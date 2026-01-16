import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import type { Truck, Load } from '../types'
import * as api from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  generateSchedule: vi.fn(),
}))

const mockGenerateSchedule = vi.mocked(api.generateSchedule)

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

describe('Dashboard', () => {
  const mockOnScheduleGenerated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('metrics display', () => {
    it('should display fairness percentage', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', weeklyLoads: 3 }), // at quota
        createTruck({ id: '2', weeklyLoads: 4 }), // above
        createTruck({ id: '3', weeklyLoads: 1 }), // below
        createTruck({ id: '4', weeklyLoads: 3 }), // at quota
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      // 3 out of 4 trucks at or above quota = 75%
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should display active truck count', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', active: true }),
        createTruck({ id: '2', active: true }),
        createTruck({ id: '3', active: false }),
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      // Check that "Active Trucks" section shows the count
      expect(screen.getByText('Active Trucks')).toBeInTheDocument()
    })

    it('should display trucks below quota count', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', weeklyLoads: 1 }), // below
        createTruck({ id: '2', weeklyLoads: 0 }), // below
        createTruck({ id: '3', weeklyLoads: 3 }), // at
        createTruck({ id: '4', weeklyLoads: 5 }), // above
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      // Look for "Below Quota" section
      expect(screen.getByText('Below Quota')).toBeInTheDocument()
    })

    it('should display unassigned loads count', () => {
      const loads: Load[] = [
        createLoad({ id: '1', status: 'unassigned' }),
        createLoad({ id: '2', status: 'unassigned' }),
        createLoad({ id: '3', status: 'assigned' }),
      ]

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={loads}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      expect(screen.getByText('Unassigned Loads')).toBeInTheDocument()
    })

    it('should exclude inactive trucks from fairness calculation', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', weeklyLoads: 3, active: true }), // at quota
        createTruck({ id: '2', weeklyLoads: 0, active: false }), // inactive - should be excluded
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      // 1 out of 1 active trucks at quota = 100%
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('generate schedule button', () => {
    it('should be enabled when there are unassigned loads', () => {
      const loads: Load[] = [createLoad({ status: 'unassigned' })]

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={loads}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      expect(button).not.toBeDisabled()
    })

    it('should be disabled when there are no unassigned loads', () => {
      const loads: Load[] = [createLoad({ status: 'assigned' })]

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={loads}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      expect(button).toBeDisabled()
    })

    it('should call generateSchedule API when clicked', async () => {
      mockGenerateSchedule.mockResolvedValueOnce({
        assignments: [{ loadId: 'L-1001', truckId: 'T-001', reasoning: 'Best fit' }],
        fairnessScore: 0.9,
        reasoning: 'Optimized schedule',
      })

      const trucks = [createTruck()]
      const loads = [createLoad({ status: 'unassigned' })]

      render(
        <Dashboard
          trucks={trucks}
          loads={loads}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockGenerateSchedule).toHaveBeenCalledWith(
          trucks,
          loads,
          expect.objectContaining({
            minWeeklyLoads: 3,
            prioritizeUnderQuota: true,
            respectCapacity: true,
          })
        )
      })
    })

    it('should call onScheduleGenerated callback with assignments', async () => {
      const mockAssignments = [
        { loadId: 'L-1001', truckId: 'T-001', reasoning: 'Best fit' },
      ]

      mockGenerateSchedule.mockResolvedValueOnce({
        assignments: mockAssignments,
        fairnessScore: 0.9,
        reasoning: 'Optimized',
      })

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnScheduleGenerated).toHaveBeenCalledWith(mockAssignments)
      })
    })

    it('should show loading state while generating', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockGenerateSchedule.mockReturnValueOnce(promise as never)

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/generating schedule/i)).toBeInTheDocument()
      })

      // Resolve the promise
      resolvePromise!({
        assignments: [],
        fairnessScore: 1,
        reasoning: '',
      })
    })

    it('should disable button while generating', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockGenerateSchedule.mockReturnValueOnce(promise as never)

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      resolvePromise!({
        assignments: [],
        fairnessScore: 1,
        reasoning: '',
      })
    })
  })

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      mockGenerateSchedule.mockRejectedValueOnce(new Error('Network error'))

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should show generic error message for non-Error rejections', async () => {
      mockGenerateSchedule.mockRejectedValueOnce('Unknown error')

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/failed to generate schedule/i)).toBeInTheDocument()
      })
    })
  })

  describe('success state', () => {
    it('should display success message after schedule generation', async () => {
      mockGenerateSchedule.mockResolvedValueOnce({
        assignments: [{ loadId: 'L-1001', truckId: 'T-001', reasoning: 'Best fit' }],
        fairnessScore: 0.85,
        reasoning: 'Schedule optimized',
      })

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/schedule generated successfully/i)).toBeInTheDocument()
      })
    })

    it('should display AI fairness score after generation', async () => {
      mockGenerateSchedule.mockResolvedValueOnce({
        assignments: [],
        fairnessScore: 0.92,
        reasoning: '',
      })

      render(
        <Dashboard
          trucks={[createTruck()]}
          loads={[createLoad({ status: 'unassigned' })]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      const button = screen.getByRole('button', { name: /generate fair schedule/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/92%/)).toBeInTheDocument()
      })
    })
  })

  describe('priority trucks section', () => {
    it('should display trucks below quota in priority section', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', truckId: 'T-001', contractorName: 'Alpha Trucking', weeklyLoads: 0 }),
        createTruck({ id: '2', truckId: 'T-002', contractorName: 'Beta Transport', weeklyLoads: 1 }),
        createTruck({ id: '3', truckId: 'T-003', contractorName: 'Gamma Logistics', weeklyLoads: 3 }), // at quota
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      expect(screen.getByText('Alpha Trucking')).toBeInTheDocument()
      expect(screen.getByText('Beta Transport')).toBeInTheDocument()
    })

    it('should sort priority trucks by weekly loads (lowest first)', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 2 }),
        createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 0 }),
        createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 1 }),
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      // The table should show T-002 (0 loads) first, then T-003 (1), then T-001 (2)
      const rows = screen.getAllByRole('row')
      // First row is header, so data starts at index 1
      const dataRows = rows.slice(1)
      expect(dataRows.length).toBeGreaterThanOrEqual(3)
    })

    it('should show "Needs X more" for trucks below quota', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', weeklyLoads: 1, minWeeklyLoads: 3 }), // needs 2 more
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      expect(screen.getByText(/needs 2 more/i)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty trucks array', () => {
      render(
        <Dashboard
          trucks={[]}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle all inactive trucks', () => {
      const trucks: Truck[] = [
        createTruck({ id: '1', active: false }),
        createTruck({ id: '2', active: false }),
      ]

      render(
        <Dashboard
          trucks={trucks}
          loads={[]}
          onScheduleGenerated={mockOnScheduleGenerated}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})
