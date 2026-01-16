// Vercel Serverless Function - Secure Chat Proxy for Anthropic
// Handles conversational AI interactions for "what if" scenarios

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    recentAssignments?: Array<{
      loadId: string;
      truckId: string;
    }>;
  };
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { message, context, history } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Sanitize message (basic XSS prevention)
    const sanitizedMessage = message.slice(0, 2000).replace(/<[^>]*>/g, '');

    const systemPrompt = buildChatSystemPrompt(context);

    // Build conversation history for Claude
    const messages = [
      ...history.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: sanitizedMessage }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({
        error: 'AI service error'
      });
    }

    const data = await response.json();
    const aiResponse = data.content[0]?.text || 'I apologize, I could not generate a response.';

    return res.status(200).json({
      response: aiResponse
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function buildChatSystemPrompt(context: ChatRequest['context']): string {
  const trucksBelow = context.trucks.filter(t => t.weeklyLoads < t.minWeeklyLoads);
  const unassignedLoads = context.loads.filter(l => l.status === 'unassigned');
  const assignedLoads = context.loads.filter(l => l.status === 'assigned');

  return `You are the AI scheduling assistant for Jamaica Broilers Group (JBG), Jamaica's leading poultry and distribution company. Your values align with JBG's mission: "Truth, Fairness & Goodwill" and tagline "With God's guidance, we serve."

## Your Role
- Help dispatchers understand and optimize truck scheduling
- Answer questions about fairness and load distribution
- Respond to "what if" scenarios
- Explain scheduling decisions clearly
- Suggest improvements to achieve better fairness

## Current Fleet Status
- Total trucks: ${context.trucks.length}
- Active trucks: ${context.trucks.filter(t => t.active).length}
- Trucks below quota: ${trucksBelow.length}
- Unassigned loads: ${unassignedLoads.length}
- Assigned loads: ${assignedLoads.length}

## Trucks Below Quota (need priority):
${trucksBelow.slice(0, 10).map(t => `- ${t.truckId} (${t.contractorName}): ${t.weeklyLoads} loads`).join('\n') || 'None - all trucks meeting quota!'}

## Current Schedule (Assigned Loads):
${assignedLoads.length > 0
  ? assignedLoads.map(l => `- ${l.loadId}: ${l.sizeTons}T to ${l.destination} → ${l.assignedTruckId || 'Unknown'} (${l.assignedContractor || 'Unknown'})`).join('\n')
  : 'No loads assigned yet - schedule not generated.'}

## Unassigned Loads (awaiting assignment):
${unassignedLoads.slice(0, 10).map(l => `- ${l.loadId}: ${l.sizeTons}T to ${l.destination}`).join('\n') || 'All loads have been assigned!'}

## Guidelines
1. Always prioritize fairness - JBG values treating all contractors equitably
2. Be concise but helpful
3. When suggesting changes, explain the fairness impact
4. Use Jamaican context when relevant (Kingston, Montego Bay, Spanish Town, etc.)
5. Be respectful and professional
6. If asked about something outside your knowledge, be honest about limitations
7. When displaying schedules or assignments, always use truck IDs in format T-XXX (e.g., T-001, T-025)

Respond naturally and helpfully to the dispatcher's questions.`;
}
