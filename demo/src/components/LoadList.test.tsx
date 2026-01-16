import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LoadList } from './LoadList'
import type { Load, Truck } from '../types'

// Test fixtures
const createLoad = (overrides: Partial<Load> = {}): Load => ({
  id: '1',
  loadId: 'L-1001',
  sizeTons: 8,
  destination: 'Kingston',
  origin: 'JBG Depot',
  priority: 'high',
  deadline: '2026-01-14',
  status: 'unassigned',
  assignedTruckId: null,
  description: 'Test load description',
  ...overrides,
})

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

describe('LoadList', () => {
  const mockOnAddLoad = vi.fn()

  describe('rendering', () => {
    it('should render the load management header', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('Load Management')).toBeInTheDocument()
    })

    it('should display unassigned and assigned counts', () => {
      const loads = [
        createLoad({ id: '1', status: 'unassigned' }),
        createLoad({ id: '2', status: 'unassigned' }),
        createLoad({ id: '3', status: 'assigned' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('2 unassigned, 1 assigned')).toBeInTheDocument()
    })

    it('should display load cards with correct data', () => {
      const loads = [
        createLoad({
          loadId: 'L-1001',
          sizeTons: 10,
          destination: 'Montego Bay',
          priority: 'high',
          description: 'KFC Montego Bay delivery',
        }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      expect(screen.getByText('L-1001')).toBeInTheDocument()
      expect(screen.getByText('10 tons')).toBeInTheDocument()
      expect(screen.getByText('Montego Bay')).toBeInTheDocument()
      expect(screen.getByText('high')).toBeInTheDocument()
    })

    it('should show "Awaiting Assignment" for unassigned loads', () => {
      const loads = [createLoad({ status: 'unassigned' })]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('Awaiting Assignment')).toBeInTheDocument()
    })

    it('should show assigned truck for assigned loads', () => {
      const trucks = [createTruck({ id: 'truck-1', truckId: 'T-001' })]
      const loads = [
        createLoad({
          status: 'assigned',
          assignedTruckId: 'truck-1',
        }),
      ]

      render(<LoadList loads={loads} trucks={trucks} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('Assigned to T-001')).toBeInTheDocument()
    })

    it('should display Add Load button', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByRole('button', { name: /add load/i })).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should filter by search term (load ID)', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001' }),
        createLoad({ id: '2', loadId: 'L-1002' }),
        createLoad({ id: '3', loadId: 'L-1003' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const searchInput = screen.getByPlaceholderText(/search by load id/i)
      fireEvent.change(searchInput, { target: { value: 'L-1002' } })

      expect(screen.queryByText('L-1001')).not.toBeInTheDocument()
      expect(screen.getByText('L-1002')).toBeInTheDocument()
      expect(screen.queryByText('L-1003')).not.toBeInTheDocument()
    })

    it('should filter by search term (destination)', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', destination: 'Kingston' }),
        createLoad({ id: '2', loadId: 'L-1002', destination: 'Montego Bay' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const searchInput = screen.getByPlaceholderText(/search by load id/i)
      fireEvent.change(searchInput, { target: { value: 'montego' } })

      expect(screen.queryByText('L-1001')).not.toBeInTheDocument()
      expect(screen.getByText('L-1002')).toBeInTheDocument()
    })

    it('should filter by priority - high', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', priority: 'high' }),
        createLoad({ id: '2', loadId: 'L-1002', priority: 'normal' }),
        createLoad({ id: '3', loadId: 'L-1003', priority: 'low' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const priorityFilter = screen.getAllByRole('combobox')[0]
      fireEvent.change(priorityFilter, { target: { value: 'high' } })

      expect(screen.getByText('L-1001')).toBeInTheDocument()
      expect(screen.queryByText('L-1002')).not.toBeInTheDocument()
      expect(screen.queryByText('L-1003')).not.toBeInTheDocument()
    })

    it('should filter by assignment status - unassigned', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', status: 'unassigned' }),
        createLoad({ id: '2', loadId: 'L-1002', status: 'assigned' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const assignmentFilter = screen.getAllByRole('combobox')[1]
      fireEvent.change(assignmentFilter, { target: { value: 'unassigned' } })

      expect(screen.getByText('L-1001')).toBeInTheDocument()
      expect(screen.queryByText('L-1002')).not.toBeInTheDocument()
    })

    it('should filter by assignment status - assigned', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', status: 'unassigned' }),
        createLoad({ id: '2', loadId: 'L-1002', status: 'assigned' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const assignmentFilter = screen.getAllByRole('combobox')[1]
      fireEvent.change(assignmentFilter, { target: { value: 'assigned' } })

      expect(screen.queryByText('L-1001')).not.toBeInTheDocument()
      expect(screen.getByText('L-1002')).toBeInTheDocument()
    })

    it('should display empty state when no loads match filters', () => {
      const loads = [createLoad({ loadId: 'L-1001' })]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const searchInput = screen.getByPlaceholderText(/search by load id/i)
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      expect(screen.getByText(/no loads match your filters/i)).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should sort by priority (high first)', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', priority: 'low', deadline: '2026-01-15' }),
        createLoad({ id: '2', loadId: 'L-1002', priority: 'high', deadline: '2026-01-15' }),
        createLoad({ id: '3', loadId: 'L-1003', priority: 'normal', deadline: '2026-01-15' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const loadCards = screen.getAllByText(/^L-100[1-3]$/)
      expect(loadCards[0]).toHaveTextContent('L-1002') // High priority first
    })

    it('should sort by deadline when priority is equal', () => {
      const loads = [
        createLoad({ id: '1', loadId: 'L-1001', priority: 'high', deadline: '2026-01-20' }),
        createLoad({ id: '2', loadId: 'L-1002', priority: 'high', deadline: '2026-01-14' }),
        createLoad({ id: '3', loadId: 'L-1003', priority: 'high', deadline: '2026-01-17' }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const loadCards = screen.getAllByText(/^L-100[1-3]$/)
      expect(loadCards[0]).toHaveTextContent('L-1002') // Earliest deadline
    })
  })

  describe('add load modal', () => {
    it('should open modal when Add Load button is clicked', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      expect(screen.getByText('Add New Load')).toBeInTheDocument()
    })

    it('should close modal when Cancel is clicked', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByText('Add New Load')).not.toBeInTheDocument()
    })

    it('should close modal when X button is clicked', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      // Find the close button (X icon)
      const modal = screen.getByText('Add New Load').closest('div')
      const closeButton = within(modal!.parentElement!).getAllByRole('button')[0]
      fireEvent.click(closeButton)

      expect(screen.queryByText('Add New Load')).not.toBeInTheDocument()
    })

    it('should have Add Load button disabled when destination is empty', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      // The submit button should be disabled
      const submitButtons = screen.getAllByRole('button', { name: /add load/i })
      const submitButton = submitButtons[submitButtons.length - 1]
      expect(submitButton).toBeDisabled()
    })

    it('should enable Add Load button when destination is provided', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      const destinationInput = screen.getByPlaceholderText(/e.g., Kingston, Montego Bay/i)
      fireEvent.change(destinationInput, { target: { value: 'Kingston' } })

      const submitButtons = screen.getAllByRole('button', { name: /add load/i })
      const submitButton = submitButtons[submitButtons.length - 1]
      expect(submitButton).not.toBeDisabled()
    })

    it('should call onAddLoad with correct data when form is submitted', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      // Fill in the form
      const destinationInput = screen.getByPlaceholderText(/e.g., Kingston, Montego Bay/i)
      fireEvent.change(destinationInput, { target: { value: 'Montego Bay' } })

      const sizeInput = screen.getByDisplayValue('5')
      fireEvent.change(sizeInput, { target: { value: '12' } })

      const prioritySelect = screen.getByDisplayValue(/normal/i)
      fireEvent.change(prioritySelect, { target: { value: 'high' } })

      // Submit
      const submitButtons = screen.getAllByRole('button', { name: /add load/i })
      const submitButton = submitButtons[submitButtons.length - 1]
      fireEvent.click(submitButton)

      expect(mockOnAddLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'Montego Bay',
          sizeTons: 12,
          priority: 'high',
          origin: 'JBG Kingston Depot',
        })
      )
    })

    it('should close modal and reset form after successful submission', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const addButton = screen.getByRole('button', { name: /add load/i })
      fireEvent.click(addButton)

      const destinationInput = screen.getByPlaceholderText(/e.g., Kingston, Montego Bay/i)
      fireEvent.change(destinationInput, { target: { value: 'Kingston' } })

      const submitButtons = screen.getAllByRole('button', { name: /add load/i })
      const submitButton = submitButtons[submitButtons.length - 1]
      fireEvent.click(submitButton)

      // Modal should be closed
      expect(screen.queryByText('Add New Load')).not.toBeInTheDocument()
    })
  })

  describe('priority colors', () => {
    it('should display high priority with red styling', () => {
      const loads = [createLoad({ priority: 'high' })]
      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const badge = screen.getByText('high')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('should display normal priority with blue styling', () => {
      const loads = [createLoad({ priority: 'normal' })]
      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const badge = screen.getByText('normal')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should display low priority with gray styling', () => {
      const loads = [createLoad({ priority: 'low' })]
      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)

      const badge = screen.getByText('low')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-600')
    })
  })

  describe('edge cases', () => {
    it('should handle empty loads array', () => {
      render(<LoadList loads={[]} trucks={[]} onAddLoad={mockOnAddLoad} />)

      expect(screen.getByText('0 unassigned, 0 assigned')).toBeInTheDocument()
      expect(screen.getByText(/no loads match your filters/i)).toBeInTheDocument()
    })

    it('should handle load without description', () => {
      const loads = [
        createLoad({
          loadId: 'L-1001',
          description: undefined,
        }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('L-1001')).toBeInTheDocument()
    })

    it('should show "Unknown" for assigned load with missing truck', () => {
      const loads = [
        createLoad({
          status: 'assigned',
          assignedTruckId: 'nonexistent-truck-id',
        }),
      ]

      render(<LoadList loads={loads} trucks={[]} onAddLoad={mockOnAddLoad} />)
      expect(screen.getByText('Assigned to Unknown')).toBeInTheDocument()
    })
  })
})
