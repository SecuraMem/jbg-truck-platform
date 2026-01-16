// Vercel Serverless Function - CSV Parsing with Claude Sonnet 4
// Intelligent parsing of truck/customer/load CSV files

import type { VercelRequest, VercelResponse } from '@vercel/node';

type DataType = 'trucks' | 'customers' | 'loads';

interface ParseCSVRequest {
  csvText: string;
  dataType: DataType;
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
    const { csvText, dataType } = req.body as ParseCSVRequest;

    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    if (!['trucks', 'customers', 'loads'].includes(dataType)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    // Build the parsing prompt based on data type
    const prompt = buildParsingPrompt(csvText, dataType);

    // Call Anthropic API with Claude 3.5 Haiku (fast and cheap for parsing)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 - best model for demo
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
        error: 'AI parsing service error'
      });
    }

    const data = await response.json();
    const aiResponse = data.content[0]?.text;

    if (!aiResponse) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    // Extract JSON from Claude's response
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      aiResponse.match(/\[([\s\S]*?)\]/);

    let parsedData;
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      parsedData = JSON.parse(jsonStr);
    } else {
      // Try parsing the whole response as JSON
      parsedData = JSON.parse(aiResponse);
    }

    // Validate the parsed data
    if (!Array.isArray(parsedData)) {
      return res.status(500).json({ error: 'Invalid parsed data format' });
    }

    // Additional validation based on data type
    const validationError = validateParsedData(parsedData, dataType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    return res.status(200).json({
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
}

function buildParsingPrompt(csvText: string, dataType: DataType): string {
  const baseInstructions = `You are a CSV parsing assistant. Parse the following CSV data and convert it to clean JSON.

CRITICAL RULES:
1. Return ONLY a valid JSON array - no explanations, no markdown
2. Normalize all text (trim whitespace, fix inconsistencies)
3. Handle missing fields gracefully with sensible defaults
4. Convert text booleans ("Yes"/"No", "true"/"false", "Active"/"Inactive") to actual booleans
5. Ensure all numeric values are valid numbers (not strings)`;

  switch (dataType) {
    case 'trucks':
      return `${baseInstructions}
6. Normalize truck sizes to lowercase: "small", "medium", or "large"
7. Set default capacity based on size if missing: small=6, medium=11, large=18
8. Default weeklyLoads to 0 if missing
9. Default active to true if missing

Expected output format:
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

    case 'customers':
      return `${baseInstructions}
6. Extract city/town name from full addresses
7. Normalize priority to lowercase: "high", "normal", or "low"
8. Default priority to "normal" if missing

Expected output format:
[
  {
    "customerName": "string",
    "destination": "string (city/town)",
    "fullAddress": "string",
    "priority": "high" | "normal" | "low"
  }
]

CSV Data:
${csvText}

Return ONLY the JSON array:`;

    case 'loads':
      return `${baseInstructions}
6. Convert dates to ISO format (YYYY-MM-DD)
7. Normalize priority to lowercase: "high", "normal", or "low"
8. Convert weights to tons (if in kg, divide by 1000)
9. Default priority to "normal" if missing

Expected output format:
[
  {
    "customerName": "string",
    "destination": "string",
    "sizeTons": number,
    "quantity": number (optional),
    "priority": "high" | "normal" | "low",
    "deadline": "YYYY-MM-DD",
    "description": "string (optional)"
  }
]

CSV Data:
${csvText}

Return ONLY the JSON array:`;

    default:
      return baseInstructions;
  }
}

function validateParsedData(data: any[], dataType: DataType): string | null {
  if (data.length === 0) {
    return 'No data found in CSV';
  }

  switch (dataType) {
    case 'trucks':
      for (const item of data) {
        if (!item.contractorName || typeof item.contractorName !== 'string') {
          return 'Missing or invalid contractor name';
        }
        if (!['small', 'medium', 'large'].includes(item.size)) {
          return `Invalid truck size: ${item.size}`;
        }
        if (typeof item.capacityTons !== 'number' || item.capacityTons <= 0) {
          return 'Invalid capacity';
        }
      }
      break;

    case 'customers':
      for (const item of data) {
        if (!item.customerName || typeof item.customerName !== 'string') {
          return 'Missing customer name';
        }
        if (!item.destination || typeof item.destination !== 'string') {
          return 'Missing destination';
        }
      }
      break;

    case 'loads':
      for (const item of data) {
        if (!item.destination || typeof item.destination !== 'string') {
          return 'Missing destination';
        }
        if (typeof item.sizeTons !== 'number' || item.sizeTons <= 0) {
          return 'Invalid load size';
        }
      }
      break;
  }

  return null;
}
