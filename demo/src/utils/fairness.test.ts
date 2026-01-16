import { describe, it, expect } from 'vitest'
import {
  calculateFairnessMetrics,
  getTrucksBelowQuota,
  getUnassignedLoads,
  getLoadsNeededForQuota,
  canLoadFitInTruck,
  findSuitableTrucks,
  validateAssignments,
} from './fairness'
import type { Truck, Load } from '../types'

// Test fixtures
const createTruck = (overrides: Partial<Truck> = {}): Truck => ({
  id: '1',
  truckId: 'T-001',
  contractorName: 'Test Trucking',
  size: 'large',
  capacityTons: 18,
  weeklyLoads: 2,
  minWeeklyLoads: 3,
  active: true,
  ...overrides,
})

const createLoad = (overrides: Partial<Load> = {}): Load => ({
  id: '1',
  loadId: 'L-1001',
  sizeTons: 8,
  destination: 'Kingston',
  origin: 'JBG Depot',
  priority: 'high',
  deadline: '2026-01-14T08:00:00Z',
  status: 'unassigned',
  assignedTruckId: null,
  ...overrides,
})

describe('calculateFairnessMetrics', () => {
  it('should return zero metrics for empty truck array', () => {
    const result = calculateFairnessMetrics([])

    expect(result).toEqual({
      totalTrucks: 0,
      trucksAtQuota: 0,
      trucksBelowQuota: 0,
      trucksAboveQuota: 0,
      fairnessPercentage: 0,
      averageLoadsPerTruck: 0,
    })
  })

  it('should only count active trucks', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 3, active: true }),
      createTruck({ id: '2', weeklyLoads: 5, active: false }),
      createTruck({ id: '3', weeklyLoads: 1, active: true }),
    ]

    const result = calculateFairnessMetrics(trucks)

    expect(result.totalTrucks).toBe(2) // Only active trucks
  })

  it('should correctly categorize trucks by quota status', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 2, minWeeklyLoads: 3 }), // below
      createTruck({ id: '2', weeklyLoads: 3, minWeeklyLoads: 3 }), // at quota
      createTruck({ id: '3', weeklyLoads: 4, minWeeklyLoads: 3 }), // above
      createTruck({ id: '4', weeklyLoads: 1, minWeeklyLoads: 3 }), // below
      createTruck({ id: '5', weeklyLoads: 5, minWeeklyLoads: 3 }), // above
    ]

    const result = calculateFairnessMetrics(trucks)

    expect(result.trucksAtQuota).toBe(1)
    expect(result.trucksBelowQuota).toBe(2)
    expect(result.trucksAboveQuota).toBe(2)
  })

  it('should calculate fairness percentage correctly', () => {
    // 3 trucks at/above quota out of 5 = 60%
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 2 }), // below
      createTruck({ id: '2', weeklyLoads: 3 }), // at
      createTruck({ id: '3', weeklyLoads: 4 }), // above
      createTruck({ id: '4', weeklyLoads: 1 }), // below
      createTruck({ id: '5', weeklyLoads: 5 }), // above
    ]

    const result = calculateFairnessMetrics(trucks)

    expect(result.fairnessPercentage).toBe(60) // 3/5 = 60%
  })

  it('should return 100% fairness when all trucks meet quota', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 3 }),
      createTruck({ id: '2', weeklyLoads: 4 }),
      createTruck({ id: '3', weeklyLoads: 5 }),
    ]

    const result = calculateFairnessMetrics(trucks)

    expect(result.fairnessPercentage).toBe(100)
    expect(result.trucksBelowQuota).toBe(0)
  })

  it('should calculate average loads per truck correctly', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 2 }),
      createTruck({ id: '2', weeklyLoads: 3 }),
      createTruck({ id: '3', weeklyLoads: 4 }),
    ]

    const result = calculateFairnessMetrics(trucks)

    // (2 + 3 + 4) / 3 = 3.0
    expect(result.averageLoadsPerTruck).toBe(3)
  })

  it('should round average loads to one decimal place', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 2 }),
      createTruck({ id: '2', weeklyLoads: 3 }),
      createTruck({ id: '3', weeklyLoads: 3 }),
    ]

    const result = calculateFairnessMetrics(trucks)

    // (2 + 3 + 3) / 3 = 2.666... → 2.7
    expect(result.averageLoadsPerTruck).toBe(2.7)
  })
})

describe('getTrucksBelowQuota', () => {
  it('should return only trucks below quota', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 2 }), // below
      createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 3 }), // at
      createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 1 }), // below
      createTruck({ id: '4', truckId: 'T-004', weeklyLoads: 4 }), // above
    ]

    const result = getTrucksBelowQuota(trucks)

    expect(result).toHaveLength(2)
    expect(result.every(t => t.weeklyLoads < t.minWeeklyLoads)).toBe(true)
  })

  it('should exclude inactive trucks', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 1, active: true }),
      createTruck({ id: '2', weeklyLoads: 0, active: false }), // inactive
    ]

    const result = getTrucksBelowQuota(trucks)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should sort by weekly loads ascending (most underserved first)', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 2 }),
      createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 0 }),
      createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 1 }),
    ]

    const result = getTrucksBelowQuota(trucks)

    expect(result[0].weeklyLoads).toBe(0)
    expect(result[1].weeklyLoads).toBe(1)
    expect(result[2].weeklyLoads).toBe(2)
  })

  it('should return empty array when all trucks meet quota', () => {
    const trucks: Truck[] = [
      createTruck({ id: '1', weeklyLoads: 3 }),
      createTruck({ id: '2', weeklyLoads: 5 }),
    ]

    const result = getTrucksBelowQuota(trucks)

    expect(result).toHaveLength(0)
  })
})

describe('getUnassignedLoads', () => {
  it('should return only unassigned loads', () => {
    const loads: Load[] = [
      createLoad({ id: '1', status: 'unassigned' }),
      createLoad({ id: '2', status: 'assigned' }),
      createLoad({ id: '3', status: 'unassigned' }),
      createLoad({ id: '4', status: 'delivered' }),
    ]

    const result = getUnassignedLoads(loads)

    expect(result).toHaveLength(2)
    expect(result.every(l => l.status === 'unassigned')).toBe(true)
  })

  it('should return empty array when all loads are assigned', () => {
    const loads: Load[] = [
      createLoad({ id: '1', status: 'assigned' }),
      createLoad({ id: '2', status: 'in_transit' }),
    ]

    const result = getUnassignedLoads(loads)

    expect(result).toHaveLength(0)
  })
})

describe('getLoadsNeededForQuota', () => {
  it('should return loads needed to reach quota', () => {
    const truck = createTruck({ weeklyLoads: 1, minWeeklyLoads: 3 })

    expect(getLoadsNeededForQuota(truck)).toBe(2)
  })

  it('should return 0 when truck is at quota', () => {
    const truck = createTruck({ weeklyLoads: 3, minWeeklyLoads: 3 })

    expect(getLoadsNeededForQuota(truck)).toBe(0)
  })

  it('should return 0 when truck is above quota', () => {
    const truck = createTruck({ weeklyLoads: 5, minWeeklyLoads: 3 })

    expect(getLoadsNeededForQuota(truck)).toBe(0)
  })

  it('should return 0 for inactive trucks', () => {
    const truck = createTruck({ weeklyLoads: 0, minWeeklyLoads: 3, active: false })

    expect(getLoadsNeededForQuota(truck)).toBe(0)
  })
})

describe('canLoadFitInTruck', () => {
  it('should return true when load fits in truck capacity', () => {
    const load = createLoad({ sizeTons: 10 })
    const truck = createTruck({ capacityTons: 18 })

    expect(canLoadFitInTruck(load, truck)).toBe(true)
  })

  it('should return true when load exactly matches capacity', () => {
    const load = createLoad({ sizeTons: 18 })
    const truck = createTruck({ capacityTons: 18 })

    expect(canLoadFitInTruck(load, truck)).toBe(true)
  })

  it('should return false when load exceeds capacity', () => {
    const load = createLoad({ sizeTons: 20 })
    const truck = createTruck({ capacityTons: 18 })

    expect(canLoadFitInTruck(load, truck)).toBe(false)
  })

  it('should return false for inactive trucks', () => {
    const load = createLoad({ sizeTons: 10 })
    const truck = createTruck({ capacityTons: 18, active: false })

    expect(canLoadFitInTruck(load, truck)).toBe(false)
  })
})

describe('findSuitableTrucks', () => {
  it('should return trucks that can handle the load', () => {
    const load = createLoad({ sizeTons: 15 })
    const trucks: Truck[] = [
      createTruck({ id: '1', capacityTons: 10 }), // too small
      createTruck({ id: '2', capacityTons: 18 }), // can fit
      createTruck({ id: '3', capacityTons: 20 }), // can fit
    ]

    const result = findSuitableTrucks(load, trucks)

    expect(result).toHaveLength(2)
    expect(result.find(t => t.id === '1')).toBeUndefined()
  })

  it('should prioritize trucks below quota', () => {
    const load = createLoad({ sizeTons: 10 })
    const trucks: Truck[] = [
      createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 3, capacityTons: 18 }), // at quota
      createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 0, capacityTons: 18 }), // needs 3
      createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 1, capacityTons: 18 }), // needs 2
    ]

    const result = findSuitableTrucks(load, trucks)

    expect(result[0].truckId).toBe('T-002') // Most need (0 loads)
    expect(result[1].truckId).toBe('T-003') // Second most need (1 load)
    expect(result[2].truckId).toBe('T-001') // At quota
  })

  it('should sort by weekly loads when quota needs are equal', () => {
    const load = createLoad({ sizeTons: 10 })
    const trucks: Truck[] = [
      createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 4, capacityTons: 18 }), // above quota
      createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 3, capacityTons: 18 }), // at quota
      createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 5, capacityTons: 18 }), // above quota
    ]

    const result = findSuitableTrucks(load, trucks)

    // All at or above quota, should sort by weekly loads
    expect(result[0].truckId).toBe('T-002') // 3 loads
    expect(result[1].truckId).toBe('T-001') // 4 loads
    expect(result[2].truckId).toBe('T-003') // 5 loads
  })

  it('should exclude inactive trucks', () => {
    const load = createLoad({ sizeTons: 10 })
    const trucks: Truck[] = [
      createTruck({ id: '1', capacityTons: 18, active: true }),
      createTruck({ id: '2', capacityTons: 20, active: false }),
    ]

    const result = findSuitableTrucks(load, trucks)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('validateAssignments', () => {
  const trucks: Truck[] = [
    createTruck({ id: '1', truckId: 'T-001', capacityTons: 18, active: true }),
    createTruck({ id: '2', truckId: 'T-002', capacityTons: 10, active: true }),
    createTruck({ id: '3', truckId: 'T-003', capacityTons: 20, active: false }),
  ]

  const loads: Load[] = [
    createLoad({ id: '1', loadId: 'L-1001', sizeTons: 8, status: 'unassigned' }),
    createLoad({ id: '2', loadId: 'L-1002', sizeTons: 15, status: 'unassigned' }),
    createLoad({ id: '3', loadId: 'L-1003', sizeTons: 5, status: 'assigned' }),
  ]

  it('should validate correct assignments', () => {
    const assignments = [
      { loadId: 'L-1001', truckId: 'T-001' },
      { loadId: 'L-1002', truckId: 'T-001' },
    ]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect load not found', () => {
    const assignments = [{ loadId: 'L-9999', truckId: 'T-001' }]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Load L-9999 not found')
  })

  it('should detect truck not found', () => {
    const assignments = [{ loadId: 'L-1001', truckId: 'T-999' }]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Truck T-999 not found')
  })

  it('should detect inactive truck', () => {
    const assignments = [{ loadId: 'L-1001', truckId: 'T-003' }]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Truck T-003 is inactive')
  })

  it('should detect load exceeding truck capacity', () => {
    const assignments = [{ loadId: 'L-1002', truckId: 'T-002' }] // 15T load > 10T capacity

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('exceeds truck'))).toBe(true)
  })

  it('should detect already assigned load', () => {
    const assignments = [{ loadId: 'L-1003', truckId: 'T-001' }]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Load L-1003 is already assigned')
  })

  it('should collect multiple errors', () => {
    const assignments = [
      { loadId: 'L-9999', truckId: 'T-001' }, // Load not found
      { loadId: 'L-1002', truckId: 'T-002' }, // Capacity exceeded
      { loadId: 'L-1003', truckId: 'T-001' }, // Already assigned
    ]

    const result = validateAssignments(assignments, trucks, loads)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('should return valid for empty assignments', () => {
    const result = validateAssignments([], trucks, loads)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
