// API Service Layer - Communicates with Vercel serverless functions
// All API keys are kept server-side for security

import type {
  Truck,
  Load,
  ScheduleConstraints,
  ScheduleGenerationResponse,
  ChatMessage
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function generateSchedule(
  trucks: Truck[],
  loads: Load[],
  constraints: ScheduleConstraints
): Promise<ScheduleGenerationResponse> {
  const response = await fetch(`${API_BASE}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trucks,
      loads: loads.filter(l => l.status === 'unassigned'),
      constraints,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error || 'Failed to generate schedule',
      response.status,
      error.details
    );
  }

  return response.json();
}

export async function sendChatMessage(
  message: string,
  trucks: Truck[],
  loads: Load[],
  history: ChatMessage[]
): Promise<string> {
  // Create a mapping from internal id to display truckId and contractor name
  const truckIdMap = new Map(trucks.map(t => [t.id, { truckId: t.truckId, contractorName: t.contractorName }]));

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context: {
        trucks: trucks.map(t => ({
          truckId: t.truckId,
          contractorName: t.contractorName,
          weeklyLoads: t.weeklyLoads,
          minWeeklyLoads: t.minWeeklyLoads,
          size: t.size,
          active: t.active,
        })),
        loads: loads.map(l => {
          // Map internal assignedTruckId to display format
          const assignedTruck = l.assignedTruckId ? truckIdMap.get(l.assignedTruckId) : null;
          return {
            loadId: l.loadId,
            destination: l.destination,
            sizeTons: l.sizeTons,
            status: l.status,
            assignedTruckId: assignedTruck?.truckId || null,
            assignedContractor: assignedTruck?.contractorName || null,
          };
        }),
      },
      history: history.slice(-10).map(h => ({
        role: h.role,
        content: h.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error || 'Failed to send message',
      response.status,
      error.details
    );
  }

  const data = await response.json();
  return data.response;
}
