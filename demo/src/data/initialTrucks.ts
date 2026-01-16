import type { Truck, TruckSize } from '../types';

// Jamaican contractor names for realism
const contractorNames = [
  'Brown\'s Haulage', 'Campbell Transport', 'Williams Trucking', 'Davis Logistics',
  'Robinson Freight', 'Johnson Carriers', 'Smith Haulage Co', 'Thomas Transport',
  'Anderson Trucking', 'Jackson Logistics', 'White Carriers', 'Harris Transport',
  'Martin Haulage', 'Thompson Freight', 'Garcia Trucking', 'Martinez Logistics',
  'Robinson Brothers', 'Clark Transport', 'Rodriguez Haulage', 'Lewis Carriers',
  'Lee Trucking', 'Walker Transport', 'Hall Logistics', 'Allen Freight',
  'Young Haulage', 'Hernandez Trucking', 'King Transport', 'Wright Carriers',
  'Lopez Logistics', 'Hill Haulage', 'Scott Transport', 'Green Trucking',
  'Adams Freight', 'Baker Logistics', 'Gonzalez Carriers', 'Nelson Haulage',
  'Carter Transport', 'Mitchell Trucking', 'Perez Logistics', 'Roberts Freight',
  'Turner Haulage', 'Phillips Transport', 'Campbell & Sons', 'Parker Trucking',
  'Evans Logistics', 'Edwards Carriers', 'Collins Haulage', 'Stewart Transport',
  'Sanchez Trucking', 'Morris Freight', 'Rogers Logistics', 'Reed Carriers',
  'Cook Haulage', 'Morgan Transport', 'Bell Trucking', 'Murphy Logistics',
  'Bailey Freight', 'Rivera Carriers', 'Cooper Haulage', 'Richardson Transport',
  'Cox Trucking', 'Howard Logistics', 'Ward Freight', 'Torres Carriers',
  'Peterson Haulage', 'Gray Transport', 'Ramirez Trucking', 'James Logistics',
  'Watson Freight', 'Brooks Carriers', 'Kelly Haulage', 'Sanders Transport',
  'Price Trucking', 'Bennett Logistics', 'Wood Freight', 'Barnes Carriers',
  'Ross Haulage', 'Henderson Transport', 'Coleman Trucking', 'Jenkins Logistics',
  'Perry Freight', 'Powell Carriers', 'Long Haulage', 'Patterson Transport',
  'Hughes Trucking', 'Flores Logistics', 'Washington Freight', 'Butler Carriers',
];

// Generate 88 trucks - fresh week (Monday morning) with 0 loads assigned
function generateTrucks(): Truck[] {
  const trucks: Truck[] = [];

  for (let i = 0; i < 88; i++) {
    const truckNum = String(i + 1).padStart(3, '0');
    const size = getSizeDistribution(i);
    const capacity = getCapacityForSize(size);

    trucks.push({
      id: `truck-${truckNum}`,
      truckId: `T-${truckNum}`,
      contractorName: contractorNames[i % contractorNames.length],
      size,
      capacityTons: capacity,
      weeklyLoads: 0, // Fresh week - no loads assigned yet
      minWeeklyLoads: 3,
      active: i < 85, // 3 trucks are inactive for demo purposes
    });
  }

  return trucks;
}

function getSizeDistribution(index: number): TruckSize {
  // Realistic fleet: 30% small, 50% medium, 20% large
  if (index < 26) return 'small';
  if (index < 70) return 'medium';
  return 'large';
}

function getCapacityForSize(size: TruckSize): number {
  switch (size) {
    case 'small': return 3 + Math.floor(Math.random() * 3); // 3-5 tons
    case 'medium': return 8 + Math.floor(Math.random() * 7); // 8-14 tons
    case 'large': return 18 + Math.floor(Math.random() * 8); // 18-25 tons
  }
}

export const initialTrucks = generateTrucks();

// Pre-calculate fairness stats
export function calculateFairnessMetrics(trucks: Truck[]) {
  const activeTrucks = trucks.filter(t => t.active);
  const belowQuota = activeTrucks.filter(t => t.weeklyLoads < t.minWeeklyLoads);
  const atQuota = activeTrucks.filter(t => t.weeklyLoads === t.minWeeklyLoads);
  const aboveQuota = activeTrucks.filter(t => t.weeklyLoads > t.minWeeklyLoads);

  const totalLoads = activeTrucks.reduce((sum, t) => sum + t.weeklyLoads, 0);

  return {
    totalTrucks: activeTrucks.length,
    trucksAtQuota: atQuota.length,
    trucksBelowQuota: belowQuota.length,
    trucksAboveQuota: aboveQuota.length,
    fairnessPercentage: Math.round(((atQuota.length + aboveQuota.length) / activeTrucks.length) * 100),
    averageLoadsPerTruck: Math.round((totalLoads / activeTrucks.length) * 10) / 10,
  };
}
