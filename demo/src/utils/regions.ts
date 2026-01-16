// Jamaica Regional Grouping Utility
// Organizes destinations by geographic region for route optimization

export type JamaicaRegion = 'Kingston Metro' | 'Western' | 'North Coast' | 'Central' | 'Eastern';

export interface RegionInfo {
  name: JamaicaRegion;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const REGION_CONFIG: Record<JamaicaRegion, RegionInfo> = {
  'Kingston Metro': {
    name: 'Kingston Metro',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  'Western': {
    name: 'Western',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  'North Coast': {
    name: 'North Coast',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
  },
  'Central': {
    name: 'Central',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  'Eastern': {
    name: 'Eastern',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
};

// Map destinations to regions
const DESTINATION_REGIONS: Record<string, JamaicaRegion> = {
  // Kingston Metro
  'Kingston': 'Kingston Metro',
  'Portmore': 'Kingston Metro',
  'Spanish Town': 'Kingston Metro',
  'Half Way Tree': 'Kingston Metro',
  'Liguanea': 'Kingston Metro',
  'Constant Spring': 'Kingston Metro',
  'Papine': 'Kingston Metro',
  'Cross Roads': 'Kingston Metro',

  // Western
  'Montego Bay': 'Western',
  'Negril': 'Western',
  'Savanna-la-Mar': 'Western',
  'Lucea': 'Western',
  'Black River': 'Western',

  // North Coast
  'Ocho Rios': 'North Coast',
  'Falmouth': 'North Coast',
  'Runaway Bay': 'North Coast',
  'Discovery Bay': 'North Coast',
  'St. Ann\'s Bay': 'North Coast',

  // Central
  'Mandeville': 'Central',
  'May Pen': 'Central',
  'Old Harbour': 'Central',
  'Linstead': 'Central',
  'Chapelton': 'Central',

  // Eastern
  'Port Antonio': 'Eastern',
  'Morant Bay': 'Eastern',
  'Yallahs': 'Eastern',
  'Bull Bay': 'Eastern',
};

export function getRegion(destination: string): JamaicaRegion {
  // Direct lookup first
  if (DESTINATION_REGIONS[destination]) {
    return DESTINATION_REGIONS[destination];
  }

  // Fuzzy matching for variations
  const lowerDest = destination.toLowerCase();

  if (/kingston|portmore|spanish town|half.?way|liguanea|constant|papine|cross.?roads/.test(lowerDest)) {
    return 'Kingston Metro';
  }
  if (/montego|negril|savanna|lucea|black river/.test(lowerDest)) {
    return 'Western';
  }
  if (/ocho rios|falmouth|runaway|discovery|st\.?\s*ann/.test(lowerDest)) {
    return 'North Coast';
  }
  if (/mandeville|may pen|old harbour|linstead|chapelton/.test(lowerDest)) {
    return 'Central';
  }
  if (/port antonio|morant|yallahs|bull bay/.test(lowerDest)) {
    return 'Eastern';
  }

  // Default to Central for unknown
  return 'Central';
}

export function getRegionInfo(destination: string): RegionInfo {
  const region = getRegion(destination);
  return REGION_CONFIG[region];
}

// Group loads by region
export function groupByRegion<T extends { destination: string }>(items: T[]): Record<JamaicaRegion, T[]> {
  const grouped: Record<JamaicaRegion, T[]> = {
    'Kingston Metro': [],
    'Western': [],
    'North Coast': [],
    'Central': [],
    'Eastern': [],
  };

  for (const item of items) {
    const region = getRegion(item.destination);
    grouped[region].push(item);
  }

  return grouped;
}
