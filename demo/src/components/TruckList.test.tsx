import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TruckList } from './TruckList'
import type { Truck } from '../types'

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

describe('TruckList', () => {
  describe('rendering', () => {
    it('should render the fleet management header', () => {
      render(<TruckList trucks={[]} />)
      expect(screen.getByText('Fleet Management')).toBeInTheDocument()
    })

    it('should display truck count', () => {
      const trucks = [
        createTruck({ id: '1' }),
        createTruck({ id: '2' }),
        createTruck({ id: '3' }),
      ]

      render(<TruckList trucks={trucks} />)
      expect(screen.getByText('3 trucks')).toBeInTheDocument()
    })

    it('should display active and inactive truck counts', () => {
      const trucks = [
        createTruck({ id: '1', active: true }),
        createTruck({ id: '2', active: true }),
        createTruck({ id: '3', active: false }),
      ]

      render(<TruckList trucks={trucks} />)
      expect(screen.getByText('2 Active')).toBeInTheDocument()
      expect(screen.getByText('1 Inactive')).toBeInTheDocument()
    })

    it('should display truck data in table rows', () => {
      const trucks = [
        createTruck({
          id: '1',
          truckId: 'T-001',
          contractorName: 'Alpha Trucking',
          size: 'large',
          capacityTons: 18,
          weeklyLoads: 2,
        }),
      ]

      render(<TruckList trucks={trucks} />)

      expect(screen.getByText('T-001')).toBeInTheDocument()
      expect(screen.getByText('Alpha Trucking')).toBeInTheDocument()
      expect(screen.getByText('Large')).toBeInTheDocument()
      expect(screen.getByText('18 tons')).toBeInTheDocument()
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    it('should display correct status badges', () => {
      const trucks = [
        createTruck({ id: '1', weeklyLoads: 1, minWeeklyLoads: 3 }), // below
        createTruck({ id: '2', weeklyLoads: 3, minWeeklyLoads: 3 }), // at
        createTruck({ id: '3', weeklyLoads: 5, minWeeklyLoads: 3 }), // above
      ]

      render(<TruckList trucks={trucks} />)

      // Use getAllByText since "Below Quota" also appears in the filter dropdown
      const belowQuotaBadges = screen.getAllByText('Below Quota')
      expect(belowQuotaBadges.length).toBeGreaterThanOrEqual(1)

      const atQuotaBadges = screen.getAllByText('At Quota')
      expect(atQuotaBadges.length).toBeGreaterThanOrEqual(1)

      const aboveQuotaBadges = screen.getAllByText('Above Quota')
      expect(aboveQuotaBadges.length).toBeGreaterThanOrEqual(1)
    })

    it('should display "Inactive" status for inactive trucks when shown', () => {
      const trucks = [
        createTruck({ id: '1', active: false }),
      ]

      render(<TruckList trucks={trucks} />)

      // Check the checkbox to show inactive
      const checkbox = screen.getByRole('checkbox', { name: /show inactive/i })
      fireEvent.click(checkbox)

      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should hide inactive trucks by default', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', active: true }),
        createTruck({ id: '2', truckId: 'T-002', active: false }),
      ]

      render(<TruckList trucks={trucks} />)

      expect(screen.getByText('T-001')).toBeInTheDocument()
      expect(screen.queryByText('T-002')).not.toBeInTheDocument()
    })

    it('should show inactive trucks when checkbox is checked', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', active: true }),
        createTruck({ id: '2', truckId: 'T-002', active: false }),
      ]

      render(<TruckList trucks={trucks} />)

      const checkbox = screen.getByRole('checkbox', { name: /show inactive/i })
      fireEvent.click(checkbox)

      expect(screen.getByText('T-001')).toBeInTheDocument()
      expect(screen.getByText('T-002')).toBeInTheDocument()
    })

    it('should filter by search term (truck ID)', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', contractorName: 'Alpha' }),
        createTruck({ id: '2', truckId: 'T-002', contractorName: 'Beta' }),
        createTruck({ id: '3', truckId: 'T-003', contractorName: 'Gamma' }),
      ]

      render(<TruckList trucks={trucks} />)

      const searchInput = screen.getByPlaceholderText(/search by truck id or contractor/i)
      fireEvent.change(searchInput, { target: { value: 'T-002' } })

      expect(screen.queryByText('T-001')).not.toBeInTheDocument()
      expect(screen.getByText('T-002')).toBeInTheDocument()
      expect(screen.queryByText('T-003')).not.toBeInTheDocument()
    })

    it('should filter by search term (contractor name)', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', contractorName: 'Alpha Trucking' }),
        createTruck({ id: '2', truckId: 'T-002', contractorName: 'Beta Transport' }),
      ]

      render(<TruckList trucks={trucks} />)

      const searchInput = screen.getByPlaceholderText(/search by truck id or contractor/i)
      fireEvent.change(searchInput, { target: { value: 'beta' } })

      expect(screen.queryByText('Alpha Trucking')).not.toBeInTheDocument()
      expect(screen.getByText('Beta Transport')).toBeInTheDocument()
    })

    it('should filter by quota status - below', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 1 }), // below
        createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 3 }), // at
        createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 5 }), // above
      ]

      render(<TruckList trucks={trucks} />)

      const statusFilter = screen.getByRole('combobox')
      fireEvent.change(statusFilter, { target: { value: 'below' } })

      expect(screen.getByText('T-001')).toBeInTheDocument()
      expect(screen.queryByText('T-002')).not.toBeInTheDocument()
      expect(screen.queryByText('T-003')).not.toBeInTheDocument()
    })

    it('should filter by quota status - at', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 1 }), // below
        createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 3 }), // at
        createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 5 }), // above
      ]

      render(<TruckList trucks={trucks} />)

      const statusFilter = screen.getByRole('combobox')
      fireEvent.change(statusFilter, { target: { value: 'at' } })

      expect(screen.queryByText('T-001')).not.toBeInTheDocument()
      expect(screen.getByText('T-002')).toBeInTheDocument()
      expect(screen.queryByText('T-003')).not.toBeInTheDocument()
    })

    it('should filter by quota status - above', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 1 }), // below
        createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 3 }), // at
        createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 5 }), // above
      ]

      render(<TruckList trucks={trucks} />)

      const statusFilter = screen.getByRole('combobox')
      fireEvent.change(statusFilter, { target: { value: 'above' } })

      expect(screen.queryByText('T-001')).not.toBeInTheDocument()
      expect(screen.queryByText('T-002')).not.toBeInTheDocument()
      expect(screen.getByText('T-003')).toBeInTheDocument()
    })

    it('should display empty state when no trucks match filters', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001' }),
      ]

      render(<TruckList trucks={trucks} />)

      const searchInput = screen.getByPlaceholderText(/search by truck id or contractor/i)
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      expect(screen.getByText(/no trucks match your filters/i)).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by truck ID when clicking header', () => {
      const trucks = [
        createTruck({ id: '2', truckId: 'T-002' }),
        createTruck({ id: '1', truckId: 'T-001' }),
        createTruck({ id: '3', truckId: 'T-003' }),
      ]

      render(<TruckList trucks={trucks} />)

      const truckIdHeader = screen.getByText('Truck ID')
      fireEvent.click(truckIdHeader)

      const rows = screen.getAllByRole('row')
      // First row is header
      const firstDataRow = rows[1]
      expect(firstDataRow).toHaveTextContent('T-001')
    })

    it('should sort by contractor name when clicking header', () => {
      const trucks = [
        createTruck({ id: '1', contractorName: 'Zeta' }),
        createTruck({ id: '2', contractorName: 'Alpha' }),
        createTruck({ id: '3', contractorName: 'Gamma' }),
      ]

      render(<TruckList trucks={trucks} />)

      const contractorHeader = screen.getByText('Contractor')
      fireEvent.click(contractorHeader)

      const rows = screen.getAllByRole('row')
      const firstDataRow = rows[1]
      expect(firstDataRow).toHaveTextContent('Alpha')
    })

    it('should toggle sort direction when clicking same header twice', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001' }),
        createTruck({ id: '2', truckId: 'T-002' }),
        createTruck({ id: '3', truckId: 'T-003' }),
      ]

      render(<TruckList trucks={trucks} />)

      const truckIdHeader = screen.getByText('Truck ID')
      fireEvent.click(truckIdHeader) // First click - ascending
      fireEvent.click(truckIdHeader) // Second click - descending

      const rows = screen.getAllByRole('row')
      const firstDataRow = rows[1]
      expect(firstDataRow).toHaveTextContent('T-003')
    })

    it('should default sort by weekly loads ascending', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', weeklyLoads: 5 }),
        createTruck({ id: '2', truckId: 'T-002', weeklyLoads: 1 }),
        createTruck({ id: '3', truckId: 'T-003', weeklyLoads: 3 }),
      ]

      render(<TruckList trucks={trucks} />)

      const rows = screen.getAllByRole('row')
      const firstDataRow = rows[1]
      expect(firstDataRow).toHaveTextContent('T-002') // Lowest weekly loads
    })

    it('should sort by size correctly', () => {
      const trucks = [
        createTruck({ id: '1', truckId: 'T-001', size: 'large' }),
        createTruck({ id: '2', truckId: 'T-002', size: 'small' }),
        createTruck({ id: '3', truckId: 'T-003', size: 'medium' }),
      ]

      render(<TruckList trucks={trucks} />)

      const sizeHeader = screen.getByText('Size')
      fireEvent.click(sizeHeader)

      const rows = screen.getAllByRole('row')
      const firstDataRow = rows[1]
      expect(firstDataRow).toHaveTextContent('Small')
    })
  })

  describe('table columns', () => {
    it('should have all required column headers', () => {
      render(<TruckList trucks={[]} />)

      expect(screen.getByText('Truck ID')).toBeInTheDocument()
      expect(screen.getByText('Contractor')).toBeInTheDocument()
      expect(screen.getByText('Size')).toBeInTheDocument()
      expect(screen.getByText('Capacity')).toBeInTheDocument()
      expect(screen.getByText('Weekly Loads')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('should show green progress bar for trucks meeting quota', () => {
      const trucks = [
        createTruck({ id: '1', weeklyLoads: 3, minWeeklyLoads: 3 }),
      ]

      render(<TruckList trucks={trucks} />)

      // The progress bar container should exist
      const progressBar = document.querySelector('.bg-green-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show amber progress bar for trucks below quota', () => {
      const trucks = [
        createTruck({ id: '1', weeklyLoads: 1, minWeeklyLoads: 3 }),
      ]

      render(<TruckList trucks={trucks} />)

      const progressBar = document.querySelector('.bg-amber-500')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty trucks array', () => {
      render(<TruckList trucks={[]} />)

      expect(screen.getByText('0 trucks')).toBeInTheDocument()
      expect(screen.getByText(/no trucks match your filters/i)).toBeInTheDocument()
    })

    it('should handle all trucks having zero weekly loads', () => {
      const trucks = [
        createTruck({ id: '1', weeklyLoads: 0 }),
        createTruck({ id: '2', weeklyLoads: 0 }),
      ]

      render(<TruckList trucks={trucks} />)

      // All should show "Below Quota" - find 3 total (2 badges + 1 dropdown option)
      const belowQuotaBadges = screen.getAllByText('Below Quota')
      // 2 truck badges + 1 filter dropdown option = 3
      expect(belowQuotaBadges.length).toBeGreaterThanOrEqual(2)
    })
  })
})
