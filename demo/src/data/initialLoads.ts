import type { Load, LoadPriority } from '../types';

// Jamaican destinations for realistic loads
const destinations = [
  'Kingston', 'Montego Bay', 'Spanish Town', 'Portmore', 'Mandeville',
  'May Pen', 'Ocho Rios', 'Savanna-la-Mar', 'Negril', 'Half Way Tree',
  'Liguanea', 'Constant Spring', 'Papine', 'Cross Roads', 'Port Antonio',
  'Black River', 'Falmouth', 'Runaway Bay', 'Old Harbour', 'Linstead'
];

// Realistic customer types
const customers = [
  { name: 'KFC Kingston', priority: 'high' as LoadPriority },
  { name: 'KFC Montego Bay', priority: 'high' as LoadPriority },
  { name: 'KFC Spanish Town', priority: 'high' as LoadPriority },
  { name: 'Island Grill HWT', priority: 'high' as LoadPriority },
  { name: 'Sandals Negril', priority: 'high' as LoadPriority },
  { name: 'Sandals Montego Bay', priority: 'high' as LoadPriority },
  { name: 'RIU Ocho Rios', priority: 'high' as LoadPriority },
  { name: 'Half Moon Resort', priority: 'high' as LoadPriority },
  { name: 'Cruise Terminal Falmouth', priority: 'high' as LoadPriority },
  { name: 'Hi-Lo Supermarket', priority: 'normal' as LoadPriority },
  { name: 'PriceSmart Kingston', priority: 'normal' as LoadPriority },
  { name: 'MegaMart Portmore', priority: 'normal' as LoadPriority },
  { name: 'Loshusan Supermarket', priority: 'normal' as LoadPriority },
  { name: 'Progressive Grocers', priority: 'normal' as LoadPriority },
  { name: 'General Foods Ltd', priority: 'normal' as LoadPriority },
  { name: 'Fontana Pharmacy', priority: 'normal' as LoadPriority },
  { name: 'Shoppers Fair', priority: 'normal' as LoadPriority },
  { name: 'John R Wong', priority: 'normal' as LoadPriority },
  { name: 'Lee\'s Food Fair', priority: 'low' as LoadPriority },
  { name: 'Community Market', priority: 'low' as LoadPriority },
  { name: 'School Feeding Program', priority: 'low' as LoadPriority },
  { name: 'Local Restaurant', priority: 'low' as LoadPriority },
];

// Generate initial unassigned loads
function generateLoads(): Load[] {
  const loads: Load[] = [];
  const today = new Date();

  for (let i = 0; i < 24; i++) {
    const loadNum = String(1001 + i).padStart(4, '0');
    const customer = customers[i % customers.length];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];

    // Deadline: 1-5 days from now
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 1 + Math.floor(Math.random() * 5));

    // Size based on priority (high priority tends to be larger orders)
    const sizeTons = getSizeForPriority(customer.priority);

    loads.push({
      id: `load-${loadNum}`,
      loadId: `L-${loadNum}`,
      sizeTons,
      destination,
      origin: 'JBG Kingston Depot',
      priority: customer.priority,
      deadline: deadline.toISOString().split('T')[0],
      status: 'unassigned',
      assignedTruckId: null,
      description: `${customer.name} - ${destination}`,
    });
  }

  return loads;
}

function getSizeForPriority(priority: LoadPriority): number {
  switch (priority) {
    case 'high':
      return 8 + Math.floor(Math.random() * 12); // 8-20 tons (large orders)
    case 'normal':
      return 4 + Math.floor(Math.random() * 8); // 4-12 tons (medium orders)
    case 'low':
      return 1 + Math.floor(Math.random() * 5); // 1-5 tons (small orders)
  }
}

export const initialLoads = generateLoads();
