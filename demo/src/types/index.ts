// Core data types for JBG Truck Scheduling Demo

export type TruckSize = 'small' | 'medium' | 'large';
export type LoadPriority = 'high' | 'normal' | 'low';
export type LoadStatus = 'unassigned' | 'assigned' | 'in_transit' | 'delivered';

export interface Truck {
  id: string;
  truckId: string; // e.g., "T-001"
  contractorName: string;
  size: TruckSize;
  capacityTons: number;
  weeklyLoads: number; // Current week's load count
  minWeeklyLoads: number; // Quota (default: 3)
  active: boolean;
  // Enhanced attributes
  onTimeRate?: number; // 0.00 - 1.00 (percentage)
  preferredRegions?: string[]; // Geographic preferences
  availabilityNotes?: string; // e.g., "No Sundays", "Maintenance on Thursdays"
}

export interface Load {
  id: string;
  loadId: string; // e.g., "L-1001"
  sizeTons: number;
  destination: string;
  origin: string;
  priority: LoadPriority;
  deadline: string; // ISO date string
  status: LoadStatus;
  assignedTruckId: string | null;
  description?: string;
  // Enhanced attributes
  deliveryWindow?: string; // e.g., "8AM-12PM"
  customerName?: string; // e.g., "KFC Kingston"
  specialRequirements?: string; // e.g., "Refrigerated", "Fragile"
  estimatedDuration?: number; // Hours
}

export interface Assignment {
  loadId: string;
  truckId: string;
  reasoning: string;
}

export interface Schedule {
  id: string;
  weekStart: string; // ISO date string (Monday)
  assignments: Assignment[];
  fairnessScore: number; // 0.00 - 1.00
  aiReasoning: string;
  createdAt: string;
}

export interface ScheduleGenerationRequest {
  trucks: Truck[];
  loads: Load[];
  constraints: ScheduleConstraints;
}

export interface ScheduleConstraints {
  minWeeklyLoads: number;
  prioritizeUnderQuota: boolean;
  respectCapacity: boolean;
}

export interface Recommendation {
  issue: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'fairness' | 'efficiency' | 'risk' | 'cost';
}

export interface ScheduleGenerationResponse {
  assignments: Assignment[];
  fairnessScore: number;
  reasoning: string;
  recommendations?: Recommendation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppState {
  trucks: Truck[];
  loads: Load[];
  schedules: Schedule[];
  chatHistory: ChatMessage[];
}

// Fairness metrics
export interface FairnessMetrics {
  totalTrucks: number;
  trucksAtQuota: number;
  trucksBelowQuota: number;
  trucksAboveQuota: number;
  fairnessPercentage: number; // % of trucks meeting or exceeding quota
  averageLoadsPerTruck: number;
}
