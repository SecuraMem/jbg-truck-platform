import { describe, it, expect } from 'vitest'
import { initialTrucks, calculateFairnessMetrics } from './initialTrucks'
import { initialLoads } from './initialLoads'

describe('initialTrucks', () => {
  it('should generate exactly 88 trucks', () => {
    expect(initialTrucks).toHaveLength(88)
  })

  it('should have valid truck IDs in sequence', () => {
    initialTrucks.forEach((truck, index) => {
      const expectedNum = String(index + 1).padStart(3, '0')
      expect(truck.truckId).toBe(`T-${expectedNum}`)
      expect(truck.id).toBe(`truck-${expectedNum}`)
    })
  })

  it('should have all required truck properties', () => {
    initialTrucks.forEach((truck) => {
      expect(truck).toHaveProperty('id')
      expect(truck).toHaveProperty('truckId')
      expect(truck).toHaveProperty('contractorName')
      expect(truck).toHaveProperty('size')
      expect(truck).toHaveProperty('capacityTons')
      expect(truck).toHaveProperty('weeklyLoads')
      expect(truck).toHaveProperty('minWeeklyLoads')
      expect(truck).toHaveProperty('active')
    })
  })

  it('should have valid truck sizes', () => {
    const validSizes = ['small', 'medium', 'large']
    initialTrucks.forEach((truck) => {
      expect(validSizes).toContain(truck.size)
    })
  })

  it('should have realistic capacity for each size', () => {
    initialTrucks.forEach((truck) => {
      switch (truck.size) {
        case 'small':
          expect(truck.capacityTons).toBeGreaterThanOrEqual(3)
          expect(truck.capacityTons).toBeLessThanOrEqual(5)
          break
        case 'medium':
          expect(truck.capacityTons).toBeGreaterThanOrEqual(8)
          expect(truck.capacityTons).toBeLessThanOrEqual(14)
          break
        case 'large':
          expect(truck.capacityTons).toBeGreaterThanOrEqual(18)
          expect(truck.capacityTons).toBeLessThanOrEqual(25)
          break
      }
    })
  })

  it('should have minWeeklyLoads set to 3 for all trucks', () => {
    initialTrucks.forEach((truck) => {
      expect(truck.minWeeklyLoads).toBe(3)
    })
  })

  it('should have 3 inactive trucks', () => {
    const inactiveTrucks = initialTrucks.filter(t => !t.active)
    expect(inactiveTrucks).toHaveLength(3)
  })

  it('should have 85 active trucks', () => {
    const activeTrucks = initialTrucks.filter(t => t.active)
    expect(activeTrucks).toHaveLength(85)
  })

  it('should have non-negative weekly loads', () => {
    initialTrucks.forEach((truck) => {
      expect(truck.weeklyLoads).toBeGreaterThanOrEqual(0)
    })
  })

  it('should have contractor names for all trucks', () => {
    initialTrucks.forEach((truck) => {
      expect(truck.contractorName).toBeTruthy()
      expect(typeof truck.contractorName).toBe('string')
      expect(truck.contractorName.length).toBeGreaterThan(0)
    })
  })

  describe('size distribution', () => {
    it('should have approximately 30% small trucks', () => {
      const smallTrucks = initialTrucks.filter(t => t.size === 'small')
      // First 26 trucks are small (indices 0-25)
      expect(smallTrucks.length).toBe(26)
    })

    it('should have approximately 50% medium trucks', () => {
      const mediumTrucks = initialTrucks.filter(t => t.size === 'medium')
      // Trucks 27-70 are medium (indices 26-69)
      expect(mediumTrucks.length).toBe(44)
    })

    it('should have approximately 20% large trucks', () => {
      const largeTrucks = initialTrucks.filter(t => t.size === 'large')
      // Trucks 71-88 are large (indices 70-87)
      expect(largeTrucks.length).toBe(18)
    })
  })
})

describe('calculateFairnessMetrics', () => {
  it('should calculate metrics for initial trucks', () => {
    const metrics = calculateFairnessMetrics(initialTrucks)

    expect(metrics).toHaveProperty('totalTrucks')
    expect(metrics).toHaveProperty('trucksAtQuota')
    expect(metrics).toHaveProperty('trucksBelowQuota')
    expect(metrics).toHaveProperty('trucksAboveQuota')
    expect(metrics).toHaveProperty('fairnessPercentage')
    expect(metrics).toHaveProperty('averageLoadsPerTruck')
  })

  it('should only count active trucks in total', () => {
    const metrics = calculateFairnessMetrics(initialTrucks)
    expect(metrics.totalTrucks).toBe(85)
  })

  it('should have metrics that sum correctly', () => {
    const metrics = calculateFairnessMetrics(initialTrucks)
    const sum = metrics.trucksAtQuota + metrics.trucksBelowQuota + metrics.trucksAboveQuota
    expect(sum).toBe(metrics.totalTrucks)
  })

  it('should have fairness percentage between 0 and 100', () => {
    const metrics = calculateFairnessMetrics(initialTrucks)
    expect(metrics.fairnessPercentage).toBeGreaterThanOrEqual(0)
    expect(metrics.fairnessPercentage).toBeLessThanOrEqual(100)
  })

  it('should have zero average loads for fresh week', () => {
    const metrics = calculateFairnessMetrics(initialTrucks)
    expect(metrics.averageLoadsPerTruck).toBe(0) // Fresh Monday morning - no loads yet
  })
})

describe('initialLoads', () => {
  it('should generate exactly 24 loads', () => {
    expect(initialLoads).toHaveLength(24)
  })

  it('should have valid load IDs starting from L-1001', () => {
    initialLoads.forEach((load, index) => {
      const expectedNum = String(1001 + index).padStart(4, '0')
      expect(load.loadId).toBe(`L-${expectedNum}`)
      expect(load.id).toBe(`load-${expectedNum}`)
    })
  })

  it('should have all required load properties', () => {
    initialLoads.forEach((load) => {
      expect(load).toHaveProperty('id')
      expect(load).toHaveProperty('loadId')
      expect(load).toHaveProperty('sizeTons')
      expect(load).toHaveProperty('destination')
      expect(load).toHaveProperty('origin')
      expect(load).toHaveProperty('priority')
      expect(load).toHaveProperty('deadline')
      expect(load).toHaveProperty('status')
      expect(load).toHaveProperty('assignedTruckId')
    })
  })

  it('should have all loads as unassigned initially', () => {
    initialLoads.forEach((load) => {
      expect(load.status).toBe('unassigned')
      expect(load.assignedTruckId).toBeNull()
    })
  })

  it('should have valid priorities', () => {
    const validPriorities = ['high', 'normal', 'low']
    initialLoads.forEach((load) => {
      expect(validPriorities).toContain(load.priority)
    })
  })

  it('should have positive sizeTons', () => {
    initialLoads.forEach((load) => {
      expect(load.sizeTons).toBeGreaterThan(0)
    })
  })

  it('should have realistic sizes based on priority', () => {
    initialLoads.forEach((load) => {
      switch (load.priority) {
        case 'high':
          expect(load.sizeTons).toBeGreaterThanOrEqual(8)
          expect(load.sizeTons).toBeLessThanOrEqual(20)
          break
        case 'normal':
          expect(load.sizeTons).toBeGreaterThanOrEqual(4)
          expect(load.sizeTons).toBeLessThanOrEqual(12)
          break
        case 'low':
          expect(load.sizeTons).toBeGreaterThanOrEqual(1)
          expect(load.sizeTons).toBeLessThanOrEqual(5)
          break
      }
    })
  })

  it('should have JBG Kingston Depot as origin', () => {
    initialLoads.forEach((load) => {
      expect(load.origin).toBe('JBG Kingston Depot')
    })
  })

  it('should have Jamaican destinations', () => {
    const validDestinations = [
      'Kingston', 'Montego Bay', 'Spanish Town', 'Portmore', 'Mandeville',
      'May Pen', 'Ocho Rios', 'Savanna-la-Mar', 'Negril', 'Half Way Tree',
      'Liguanea', 'Constant Spring', 'Papine', 'Cross Roads', 'Port Antonio',
      'Black River', 'Falmouth', 'Runaway Bay', 'Old Harbour', 'Linstead'
    ]
    initialLoads.forEach((load) => {
      expect(validDestinations).toContain(load.destination)
    })
  })

  it('should have valid deadline dates', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    initialLoads.forEach((load) => {
      const deadline = new Date(load.deadline)
      expect(deadline.getTime()).toBeGreaterThanOrEqual(today.getTime())
    })
  })

  it('should have descriptions for all loads', () => {
    initialLoads.forEach((load) => {
      expect(load.description).toBeTruthy()
      expect(typeof load.description).toBe('string')
    })
  })

  describe('priority distribution', () => {
    it('should have some high priority loads', () => {
      const highPriorityLoads = initialLoads.filter(l => l.priority === 'high')
      expect(highPriorityLoads.length).toBeGreaterThan(0)
    })

    it('should have some normal priority loads', () => {
      const normalPriorityLoads = initialLoads.filter(l => l.priority === 'normal')
      expect(normalPriorityLoads.length).toBeGreaterThan(0)
    })

    it('should have some low priority loads', () => {
      const lowPriorityLoads = initialLoads.filter(l => l.priority === 'low')
      expect(lowPriorityLoads.length).toBeGreaterThan(0)
    })
  })
})

describe('data consistency', () => {
  it('should have loads that can be assigned to available trucks', () => {
    const maxTruckCapacity = Math.max(...initialTrucks.map(t => t.capacityTons))

    initialLoads.forEach((load) => {
      expect(load.sizeTons).toBeLessThanOrEqual(maxTruckCapacity)
    })
  })

  it('should have enough truck capacity for all loads', () => {
    const totalLoadSize = initialLoads.reduce((sum, l) => sum + l.sizeTons, 0)
    const totalTruckCapacity = initialTrucks
      .filter(t => t.active)
      .reduce((sum, t) => sum + t.capacityTons, 0)

    expect(totalTruckCapacity).toBeGreaterThan(totalLoadSize)
  })

  it('should have unique truck IDs', () => {
    const truckIds = initialTrucks.map(t => t.truckId)
    const uniqueIds = new Set(truckIds)
    expect(uniqueIds.size).toBe(truckIds.length)
  })

  it('should have unique load IDs', () => {
    const loadIds = initialLoads.map(l => l.loadId)
    const uniqueIds = new Set(loadIds)
    expect(uniqueIds.size).toBe(loadIds.length)
  })
})
