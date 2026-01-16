import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Determine which AI provider to use
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'anthropic' or 'openai'

// Load AI Persona
const aiPersonaPath = path.join(process.cwd(), 'src', 'config', 'aiPersona.ts');
let AI_PERSONA = '';
let SCHEDULING_CONTEXT = '';
let RECOMMENDATION_PROMPT = '';

try {
  const personaContent = fs.readFileSync(aiPersonaPath, 'utf-8');
  // Extract the persona strings from the TypeScript file
  const personaMatch = personaContent.match(/export const AI_PERSONA = `([^`]+)`/s);
  const contextMatch = personaContent.match(/export const SCHEDULING_CONTEXT = `([^`]+)`/s);
  const recMatch = personaContent.match(/export const RECOMMENDATION_PROMPT = `([^`]+)`/s);
  
  if (personaMatch) AI_PERSONA = personaMatch[1];
  if (contextMatch) SCHEDULING_CONTEXT = contextMatch[1];
  if (recMatch) RECOMMENDATION_PROMPT = recMatch[1];
} catch (error) {
  console.warn('Could not load AI persona file, using defaults');
  AI_PERSONA = 'You are an expert logistics scheduler for JBG truck fleet.';
  SCHEDULING_CONTEXT = '';
  RECOMMENDATION_PROMPT = '';
}

app.use(cors());
app.use(express.json());

// Generic AI call function
async function callAI(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
  if (AI_PROVIDER === 'openai') {
    return callOpenAI(prompt, systemPrompt, maxTokens);
  } else {
    return callAnthropic(prompt, systemPrompt, maxTokens);
  }
}

// OpenAI API call
async function callOpenAI(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages: Array<{role: string; content: string}> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Anthropic API call
async function callAnthropic(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const body: any = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic API error:', errorText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

// Import the API handlers
// We'll implement them inline since they're Vercel functions

interface ScheduleRequest {
  trucks: Array<{
    id: string;
    truckId: string;
    contractorName: string;
    size: string;
    capacityTons: number;
    weeklyLoads: number;
    minWeeklyLoads: number;
    active: boolean;
  }>;
  loads: Array<{
    id: string;
    loadId: string;
    sizeTons: number;
    destination: string;
    origin: string;
    priority: string;
    deadline: string;
    status: string;
  }>;
  constraints: {
    minWeeklyLoads: number;
    prioritizeUnderQuota: boolean;
    respectCapacity: boolean;
  };
}

interface ChatRequest {
  message: string;
  context: {
    trucks: Array<{
      truckId: string;
      contractorName: string;
      weeklyLoads: number;
      minWeeklyLoads: number;
      size: string;
      active: boolean;
    }>;
    loads: Array<{
      loadId: string;
      destination: string;
      sizeTons: number;
      status: string;
      assignedTruckId: string | null;
      assignedContractor: string | null;
    }>;
  };
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface ParseCSVRequest {
  csvText: string;
  dataType: 'trucks' | 'customers' | 'loads';
}

// Schedule Generation Endpoint
app.post('/api/schedule', async (req: Request, res: Response) => {
  try {
    const { trucks, loads, constraints } = req.body as ScheduleRequest;

    if (!trucks || !Array.isArray(trucks) || trucks.length === 0) {
      return res.status(400).json({ error: 'Invalid trucks data' });
    }

    const prompt = buildSchedulingPrompt(trucks, loads, constraints);

    const aiResponse = await callAI(prompt, undefined, 4096);

    if (!aiResponse) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      aiResponse.match(/\{[\s\S]*"assignments"[\s\S]*\}/);

    let parsedResponse;
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      parsedResponse = JSON.parse(jsonStr);
    } else {
      parsedResponse = JSON.parse(aiResponse);
    }

    return res.json(parsedResponse);
  } catch (error) {
    console.error('Schedule generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate schedule',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sanitizedMessage = message.slice(0, 2000).replace(/<[^>]*>/g, '');
    const systemPrompt = buildChatSystemPrompt(context);

    const aiResponse = await callAI(sanitizedMessage, systemPrompt, 1024);

    return res.json({ response: aiResponse || 'I apologize, I could not generate a response.' });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CSV Parse Endpoint
app.post('/api/parse-csv', async (req: Request, res: Response) => {
  try {
    const { csvText, dataType } = req.body as ParseCSVRequest;

    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    if (!['trucks', 'customers', 'loads'].includes(dataType)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const prompt = buildParsingPrompt(csvText, dataType);

    const aiResponse = await callAI(prompt, undefined, 4096);

    if (!aiResponse) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      aiResponse.match(/\[([\s\S]*?)\]/);

    let parsedData;
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      parsedData = JSON.parse(jsonStr);
    } else {
      parsedData = JSON.parse(aiResponse);
    }

    if (!Array.isArray(parsedData)) {
      return res.status(500).json({ error: 'Invalid parsed data format' });
    }

    return res.json({
      data: parsedData,
      count: parsedData.length,
    });
  } catch (error) {
    console.error('CSV parsing error:', error);
    return res.status(500).json({
      error: 'Failed to parse CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', provider: AI_PROVIDER, message: 'API server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Provider: ${AI_PROVIDER.toUpperCase()}`);
  console.log(`📝 API endpoints ready:`);
  console.log(`   POST /api/schedule - Generate fair schedules`);
  console.log(`   POST /api/chat - Chat with AI`);
  console.log(`   POST /api/parse-csv - Parse CSV files`);
  console.log(`   GET /api/health - Health check`);
});

// Helper functions
function buildSchedulingPrompt(trucks: any[], loads: any[], constraints: any): string {
  const activeTrucks = trucks.filter(t => t.active);
  const unassignedLoads = loads.filter(l => l.status === 'unassigned');

  return `${AI_PERSONA}

${SCHEDULING_CONTEXT}

**YOUR TASK: Generate Today's Fair Load Assignments**

You are scheduling loads for TODAY (${new Date().toLocaleDateString('en-JM', { weekday: 'long', month: 'long', day: 'numeric' })}), while ensuring weekly fairness (3 loads per truck per week).

CURRENT FLEET STATUS (Today's available trucks):
${JSON.stringify(activeTrucks.slice(0, 15).map(t => ({
  ...t,
  weeklyProgress: `${t.weeklyLoads}/${t.minWeeklyLoads} loads this week`,
  status: t.weeklyLoads < t.minWeeklyLoads ? 'BEHIND QUOTA' : 
          t.weeklyLoads === t.minWeeklyLoads ? 'AT QUOTA' : 'ABOVE QUOTA'
})), null, 2)}
... (${activeTrucks.length} total active trucks)

LOADS TO ASSIGN TODAY:
${JSON.stringify(unassignedLoads, null, 2)}

SCHEDULING CONSTRAINTS:
- Weekly target: ${constraints.minWeeklyLoads} loads per truck per week
- Today's priority: Trucks BEHIND their weekly quota
- Respect truck capacity (don't exceed capacityTons)
- Consider geographic clustering (Kingston area vs Western vs North Coast)
- Factor in performance data (onTimeRate, preferredRegions)
- All loads should be assigned if possible

Please generate TODAY's assignments that:
1. **Daily Fairness** - Prioritize trucks with weeklyLoads < ${constraints.minWeeklyLoads} (falling behind this week)
2. **Route Optimization** - Cluster loads by region (Kingston/Western/North Coast)
3. **Capacity Matching** - Right truck size for load size
4. **Performance** - Use reliable trucks (high onTimeRate) for critical/time-sensitive loads
5. **Cost Efficiency** - Minimize empty miles through geographic clustering

Also provide 3-5 actionable recommendations for TODAY's operations.

Return a JSON object with this EXACT structure:
{
  "assignments": [
    {
      "loadId": "L-1001",
      "truckId": "T-001",
      "reasoning": "Truck T-001 (Winston Campbell) has 1/3 loads this week (behind quota). Kingston delivery matches preferred region. 95% on-time rate ensures reliability."
    }
  ],
  "fairnessScore": 0.85,
  "reasoning": "Today's schedule assigned ${unassignedLoads.length} loads, prioritizing 8 trucks behind weekly quota. Clustered 3 Kingston deliveries and 2 Montego Bay loads for route efficiency.",
  "recommendations": [
    {
      "issue": "TR-001, TR-045, TR-089 still at 0/3 loads this week",
      "impact": "Risk of missing weekly minimum by Friday, affects contractor fairness",
      "action": "Prioritize these 3 trucks for tomorrow's high-priority loads",
      "priority": "high",
      "category": "fairness"
    }
  ]
}`;
}

function buildChatSystemPrompt(context: any): string {
  const assignedLoads = context.loads.filter((l: any) => l.status === 'assigned');
  const unassignedLoads = context.loads.filter((l: any) => l.status === 'unassigned');
  const trucksBelowQuota = context.trucks.filter((t: any) => t.weeklyLoads < t.minWeeklyLoads);

  return `${AI_PERSONA}

${SCHEDULING_CONTEXT}

You are assisting a JBG dispatcher with DAILY truck scheduling decisions while tracking WEEKLY quotas (3 loads per truck per week). You have access to:

## Fleet Status
- Total trucks: ${context.trucks.length}
- Trucks below quota: ${trucksBelowQuota.length}
- Assigned loads: ${assignedLoads.length}
- Unassigned loads: ${unassignedLoads.length}

## Trucks Below Quota (need priority):
${trucksBelowQuota.slice(0, 10).map((t: any) => `- ${t.truckId} (${t.contractorName}): ${t.weeklyLoads}/${t.minWeeklyLoads} loads`).join('\n') || 'None - all trucks meeting quota!'}

## Current Schedule (Assigned Loads):
${assignedLoads.length > 0
  ? assignedLoads.map((l: any) => `- ${l.loadId}: ${l.sizeTons}T to ${l.destination} → ${l.assignedTruckId || 'Unknown'} (${l.assignedContractor || 'Unknown'})`).join('\n')
  : 'No loads assigned yet - schedule not generated.'}

## Unassigned Loads (awaiting assignment):
${unassignedLoads.slice(0, 10).map((l: any) => `- ${l.loadId}: ${l.sizeTons}T to ${l.destination}`).join('\n') || 'All loads have been assigned!'}

Provide expert guidance on:
- TODAY's scheduling decisions with weekly fairness awareness
- "What if" scenarios (truck unavailability, load changes, delays)
- Route optimization and geographic clustering for daily efficiency
- Performance and reliability considerations
- Cost efficiency opportunities
- Risk mitigation strategies
- Weekly quota tracking (help dispatcher see who's behind/ahead)

IMPORTANT: When displaying schedules or assignments, always use truck IDs in format T-XXX (e.g., T-001, T-025).

Be conversational, practical, and empathetic. Understand the daily pressure dispatchers face and provide actionable advice for TODAY while keeping weekly targets in mind.`;
}

function buildParsingPrompt(csvText: string, dataType: 'trucks' | 'customers' | 'loads'): string {
  const baseInstructions = `You are a CSV parsing assistant. Parse the following CSV data and convert it to clean JSON.

CRITICAL RULES:
1. Return ONLY a valid JSON array - no explanations, no markdown
2. Normalize all text (trim whitespace, fix inconsistencies)
3. Handle missing fields gracefully with sensible defaults
4. Convert text booleans ("Yes"/"No", "true"/"false") to actual booleans
5. Ensure all numeric values are valid numbers`;

  if (dataType === 'trucks') {
    return `${baseInstructions}
6. Normalize truck sizes to lowercase: "small", "medium", or "large"
7. Set default capacity based on size if missing: small=6, medium=11, large=18
8. Default weeklyLoads to 0 if missing
9. Default active to true if missing

Expected output:
[
  {
    "contractorName": "string",
    "size": "small" | "medium" | "large",
    "capacityTons": number,
    "weeklyLoads": number,
    "active": boolean
  }
]

CSV Data:
${csvText}

Return ONLY the JSON array:`;
  }

  return baseInstructions + `\n\nCSV Data:\n${csvText}`;
}
