import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

      expect(result.current[0]).toBe('defaultValue')
    })

    it('should return stored value when localStorage has data', () => {
      window.localStorage.setItem('testKey', JSON.stringify('storedValue'))

      const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

      expect(result.current[0]).toBe('storedValue')
    })

    it('should handle complex objects', () => {
      const initialData = { trucks: [], loads: [], count: 0 }
      const { result } = renderHook(() => useLocalStorage('appState', initialData))

      expect(result.current[0]).toEqual(initialData)
    })

    it('should return initial value when localStorage contains invalid JSON', () => {
      window.localStorage.setItem('testKey', 'invalid-json{')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))

      expect(result.current[0]).toBe('defaultValue')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('setValue', () => {
    it('should update state and localStorage with direct value', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))

      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
      expect(window.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('updated'))
    })

    it('should update state and localStorage with updater function', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0))

      act(() => {
        result.current[1](prev => prev + 1)
      })

      expect(result.current[0]).toBe(1)

      act(() => {
        result.current[1](prev => prev + 5)
      })

      expect(result.current[0]).toBe(6)
    })

    it('should handle array updates', () => {
      const { result } = renderHook(() => useLocalStorage<string[]>('items', []))

      act(() => {
        result.current[1](['item1'])
      })

      expect(result.current[0]).toEqual(['item1'])

      act(() => {
        result.current[1](prev => [...prev, 'item2'])
      })

      expect(result.current[0]).toEqual(['item1', 'item2'])
    })

    it('should handle object updates', () => {
      interface TestState {
        name: string
        count: number
      }
      const { result } = renderHook(() =>
        useLocalStorage<TestState>('object', { name: 'test', count: 0 })
      )

      act(() => {
        result.current[1](prev => ({ ...prev, count: prev.count + 1 }))
      })

      expect(result.current[0]).toEqual({ name: 'test', count: 1 })
    })
  })

  describe('resetValue', () => {
    it('should reset to initial value and remove from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))

      act(() => {
        result.current[1]('changed')
      })

      expect(result.current[0]).toBe('changed')

      act(() => {
        result.current[2]() // resetValue
      })

      expect(result.current[0]).toBe('initial')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('testKey')
    })
  })

  describe('truck and load data persistence', () => {
    it('should persist truck data correctly', () => {
      const trucks = [
        { id: '1', truckId: 'T-001', contractorName: 'Test Co', size: 'large' as const, capacityTons: 18, weeklyLoads: 2, minWeeklyLoads: 3, active: true },
        { id: '2', truckId: 'T-002', contractorName: 'Another Co', size: 'medium' as const, capacityTons: 12, weeklyLoads: 4, minWeeklyLoads: 3, active: true },
      ]

      const { result } = renderHook(() => useLocalStorage('jbg-trucks', trucks))

      expect(result.current[0]).toEqual(trucks)
      expect(window.localStorage.setItem).toHaveBeenCalledWith('jbg-trucks', JSON.stringify(trucks))
    })

    it('should persist load data correctly', () => {
      const loads = [
        { id: '1', loadId: 'L-1001', sizeTons: 8, destination: 'Kingston', origin: 'Depot', priority: 'high' as const, deadline: '2026-01-14T08:00:00Z', status: 'unassigned' as const, assignedTruckId: null },
      ]

      const { result } = renderHook(() => useLocalStorage('jbg-loads', loads))

      expect(result.current[0]).toEqual(loads)
    })

    it('should update truck weekly loads', () => {
      const initialTrucks = [
        { id: '1', truckId: 'T-001', contractorName: 'Test Co', size: 'large' as const, capacityTons: 18, weeklyLoads: 2, minWeeklyLoads: 3, active: true },
      ]

      const { result } = renderHook(() => useLocalStorage('jbg-trucks', initialTrucks))

      act(() => {
        result.current[1](trucks =>
          trucks.map(t => t.id === '1' ? { ...t, weeklyLoads: t.weeklyLoads + 1 } : t)
        )
      })

      expect(result.current[0][0].weeklyLoads).toBe(3)
    })
  })
})
