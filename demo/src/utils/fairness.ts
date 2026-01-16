import type { Truck, Load, FairnessMetrics } from '../types'

/**
 * Calculate fairness metrics based on truck load distribution
 * Fairness is defined as the percentage of trucks meeting or exceeding their weekly quota
 */
export function calculateFairnessMetrics(trucks: Truck[]): FairnessMetrics {
  const activeTrucks = trucks.filter(t => t.active)

  if (activeTrucks.length === 0) {
    return {
      totalTrucks: 0,
      trucksAtQuota: 0,
      trucksBelowQuota: 0,
      trucksAboveQuota: 0,
      fairnessPercentage: 0,
      averageLoadsPerTruck: 0,
    }
  }

  const belowQuota = activeTrucks.filter(t => t.weeklyLoads < t.minWeeklyLoads)
  const atQuota = activeTrucks.filter(t => t.weeklyLoads === t.minWeeklyLoads)
  const aboveQuota = activeTrucks.filter(t => t.weeklyLoads > t.minWeeklyLoads)
  const totalLoads = activeTrucks.reduce((sum, t) => sum + t.weeklyLoads, 0)

  return {
    totalTrucks: activeTrucks.length,
    trucksAtQuota: atQuota.length,
    trucksBelowQuota: belowQuota.length,
    trucksAboveQuota: aboveQuota.length,
    fairnessPercentage: Math.round(((atQuota.length + aboveQuota.length) / activeTrucks.length) * 100),
    averageLoadsPerTruck: Math.round((totalLoads / activeTrucks.length) * 10) / 10,
  }
}

/**
 * Get trucks that are below their weekly quota, sorted by most underserved first
 */
export function getTrucksBelowQuota(trucks: Truck[]): Truck[] {
  return trucks
    .filter(t => t.active && t.weeklyLoads < t.minWeeklyLoads)
    .sort((a, b) => a.weeklyLoads - b.weeklyLoads)
}

/**
 * Get unassigned loads
 */
export function getUnassignedLoads(loads: Load[]): Load[] {
  return loads.filter(l => l.status === 'unassigned')
}

/**
 * Calculate how many more loads each truck needs to meet quota
 */
export function getLoadsNeededForQuota(truck: Truck): number {
  if (!truck.active) return 0
  return Math.max(0, truck.minWeeklyLoads - truck.weeklyLoads)
}

/**
 * Check if a load can fit in a truck based on capacity
 */
export function canLoadFitInTruck(load: Load, truck: Truck): boolean {
  return truck.active && load.sizeTons <= truck.capacityTons
}

/**
 * Find suitable trucks for a given load, prioritizing those below quota
 */
export function findSuitableTrucks(load: Load, trucks: Truck[]): Truck[] {
  return trucks
    .filter(t => canLoadFitInTruck(load, t))
    .sort((a, b) => {
      // First prioritize trucks below quota
      const aNeeds = getLoadsNeededForQuota(a)
      const bNeeds = getLoadsNeededForQuota(b)
      if (aNeeds !== bNeeds) return bNeeds - aNeeds // Higher need first

      // Then by weekly loads (fewer loads first)
      return a.weeklyLoads - b.weeklyLoads
    })
}

/**
 * Validate schedule assignments
 */
export interface AssignmentValidation {
  valid: boolean
  errors: string[]
}

export function validateAssignments(
  assignments: Array<{ loadId: string; truckId: string }>,
  trucks: Truck[],
  loads: Load[]
): AssignmentValidation {
  const errors: string[] = []

  for (const assignment of assignments) {
    const load = loads.find(l => l.loadId === assignment.loadId)
    const truck = trucks.find(t => t.truckId === assignment.truckId)

    if (!load) {
      errors.push(`Load ${assignment.loadId} not found`)
      continue
    }

    if (!truck) {
      errors.push(`Truck ${assignment.truckId} not found`)
      continue
    }

    if (!truck.active) {
      errors.push(`Truck ${assignment.truckId} is inactive`)
    }

    if (load.sizeTons > truck.capacityTons) {
      errors.push(`Load ${assignment.loadId} (${load.sizeTons}T) exceeds truck ${assignment.truckId} capacity (${truck.capacityTons}T)`)
    }

    if (load.status !== 'unassigned') {
      errors.push(`Load ${assignment.loadId} is already ${load.status}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
