// Vercel Serverless Function - Secure API Proxy for Anthropic
// This keeps the API key server-side, never exposed to the browser

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { trucks, loads, constraints } = req.body as ScheduleRequest;

    // Validate input
    if (!trucks || !Array.isArray(trucks) || trucks.length === 0) {
      return res.status(400).json({ error: 'Invalid trucks data' });
    }
    if (!loads || !Array.isArray(loads)) {
      return res.status(400).json({ error: 'Invalid loads data' });
    }

    // Build the scheduling prompt
    const prompt = buildSchedulingPrompt(trucks, loads, constraints);

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({
        error: 'AI service error',
        details: response.status === 401 ? 'Invalid API key' : 'Service unavailable'
      });
    }

    const data = await response.json();
    const aiResponse = data.content[0]?.text;

    if (!aiResponse) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    // Parse the JSON from Claude's response
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      aiResponse.match(/\{[\s\S]*"assignments"[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        error: 'Could not parse AI response',
        rawResponse: aiResponse
      });
    }

    const scheduleData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    return res.status(200).json({
      assignments: scheduleData.assignments || [],
      fairnessScore: scheduleData.fairnessScore || 0,
      reasoning: scheduleData.reasoning || scheduleData.summary || '',
    });

  } catch (error) {
    console.error('Schedule generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function buildSchedulingPrompt(
  trucks: ScheduleRequest['trucks'],
  loads: ScheduleRequest['loads'],
  constraints: ScheduleRequest['constraints']
): string {
  const trucksBelow = trucks.filter(t => t.weeklyLoads < constraints.minWeeklyLoads);
  const unassignedLoads = loads.filter(l => l.status === 'unassigned');

  return `You are the AI scheduling assistant for Jamaica Broilers Group (JBG), Jamaica's largest poultry and distribution company. Your mission aligns with JBG's values: "Truth, Fairness & Goodwill."

## Your Task
Generate fair load assignments for trucks, prioritizing drivers who haven't met their weekly quota of ${constraints.minWeeklyLoads} loads.

## Current Fleet Status
Total trucks: ${trucks.length}
Trucks below quota (< ${constraints.minWeeklyLoads} loads): ${trucksBelow.length}
Active trucks: ${trucks.filter(t => t.active).length}

## Trucks (sorted by weekly loads, ascending):
${trucks
  .filter(t => t.active)
  .sort((a, b) => a.weeklyLoads - b.weeklyLoads)
  .slice(0, 30) // Show top 30 most in need
  .map(t => `- ${t.truckId} (${t.contractorName}): ${t.weeklyLoads}/${t.minWeeklyLoads} loads, ${t.size} truck, ${t.capacityTons}T capacity`)
  .join('\n')}
${trucks.length > 30 ? `\n... and ${trucks.length - 30} more trucks` : ''}

## Unassigned Loads (${unassignedLoads.length} total):
${unassignedLoads
  .map(l => `- ${l.loadId}: ${l.sizeTons}T to ${l.destination}, priority: ${l.priority}, deadline: ${l.deadline}`)
  .join('\n')}

## Constraints
1. Prioritize trucks below their weekly quota (fairness first)
2. ${constraints.respectCapacity ? 'Respect truck capacity limits' : 'Capacity can be flexible'}
3. Match truck size to load size when possible (small: <5T, medium: 5-15T, large: >15T)
4. Consider delivery deadlines and priorities

## Required JSON Response Format
Respond ONLY with a JSON object in this exact format:
\`\`\`json
{
  "assignments": [
    {
      "loadId": "L-1001",
      "truckId": "T-023",
      "reasoning": "Brief explanation of why this assignment is fair"
    }
  ],
  "fairnessScore": 0.94,
  "reasoning": "Overall summary of the scheduling decisions and fairness improvements"
}
\`\`\`

The fairnessScore should be between 0 and 1, representing the percentage of trucks that will meet or exceed their weekly quota after these assignments.

Generate the assignments now:`;
}
