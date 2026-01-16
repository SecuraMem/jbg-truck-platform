import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  const mockOnViewChange = vi.fn()

  const renderLayout = (currentView = 'dashboard') => {
    return render(
      <Layout currentView={currentView} onViewChange={mockOnViewChange}>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('header', () => {
    it('should display the app title', () => {
      renderLayout()
      expect(screen.getByText('JBG Truck Scheduling')).toBeInTheDocument()
    })

    it('should display the company motto', () => {
      renderLayout()
      expect(screen.getByText('Truth, Fairness & Goodwill')).toBeInTheDocument()
    })

    it('should display company name', () => {
      renderLayout()
      expect(screen.getByText('Jamaica Broilers Group')).toBeInTheDocument()
    })

    it('should display company tagline', () => {
      renderLayout()
      expect(screen.getByText("With God's guidance, we serve")).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('should display all navigation items', () => {
      renderLayout()

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Trucks')).toBeInTheDocument()
      expect(screen.getByText('Loads')).toBeInTheDocument()
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    })

    it('should call onViewChange when navigation item is clicked', () => {
      renderLayout('dashboard')

      const trucksButton = screen.getByText('Trucks')
      fireEvent.click(trucksButton)

      expect(mockOnViewChange).toHaveBeenCalledWith('trucks')
    })

    it('should call onViewChange with correct view for each nav item', () => {
      renderLayout()

      // Test each navigation item
      const navItems = [
        { label: 'Dashboard', id: 'dashboard' },
        { label: 'Trucks', id: 'trucks' },
        { label: 'Loads', id: 'loads' },
        { label: 'AI Assistant', id: 'chat' },
      ]

      navItems.forEach(({ label, id }) => {
        mockOnViewChange.mockClear()
        const button = screen.getByText(label)
        fireEvent.click(button)
        expect(mockOnViewChange).toHaveBeenCalledWith(id)
      })
    })

    it('should highlight active navigation item', () => {
      renderLayout('trucks')

      const trucksButton = screen.getByText('Trucks').closest('button')
      expect(trucksButton).toHaveClass('bg-jbg-primary', 'text-white')
    })

    it('should not highlight inactive navigation items', () => {
      renderLayout('dashboard')

      const trucksButton = screen.getByText('Trucks').closest('button')
      expect(trucksButton).not.toHaveClass('bg-jbg-primary')
      expect(trucksButton).toHaveClass('text-gray-700')
    })
  })

  describe('content area', () => {
    it('should render children in main content area', () => {
      renderLayout()
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })
  })

  describe('mobile sidebar', () => {
    it('should have mobile menu toggle button', () => {
      renderLayout()

      // Find the button that toggles sidebar (contains Menu or X icon)
      const menuButtons = screen.getAllByRole('button')
      const toggleButton = menuButtons.find(btn =>
        btn.classList.contains('lg:hidden')
      )

      expect(toggleButton).toBeInTheDocument()
    })

    it('should toggle sidebar when menu button is clicked', () => {
      renderLayout()

      // Find the toggle button (first button with lg:hidden class)
      const menuButtons = screen.getAllByRole('button')
      const toggleButton = menuButtons.find(btn =>
        btn.classList.contains('lg:hidden')
      )!

      // Initially sidebar should be hidden on mobile (has -translate-x-full)
      const sidebar = document.querySelector('aside')
      expect(sidebar).toHaveClass('-translate-x-full')

      // Click to open
      fireEvent.click(toggleButton)
      expect(sidebar).toHaveClass('translate-x-0')

      // Click to close
      fireEvent.click(toggleButton)
      expect(sidebar).toHaveClass('-translate-x-full')
    })

    it('should close sidebar when clicking overlay', () => {
      renderLayout()

      const menuButtons = screen.getAllByRole('button')
      const toggleButton = menuButtons.find(btn =>
        btn.classList.contains('lg:hidden')
      )!

      // Open sidebar
      fireEvent.click(toggleButton)

      // Find and click overlay
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(overlay).toBeInTheDocument()

      fireEvent.click(overlay!)

      // Sidebar should be closed
      const sidebar = document.querySelector('aside')
      expect(sidebar).toHaveClass('-translate-x-full')
    })

    it('should close sidebar when navigation item is selected', () => {
      renderLayout()

      const menuButtons = screen.getAllByRole('button')
      const toggleButton = menuButtons.find(btn =>
        btn.classList.contains('lg:hidden')
      )!

      // Open sidebar
      fireEvent.click(toggleButton)

      const sidebar = document.querySelector('aside')
      expect(sidebar).toHaveClass('translate-x-0')

      // Click a nav item
      const trucksButton = screen.getByText('Trucks')
      fireEvent.click(trucksButton)

      // Sidebar should close
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })

  describe('mission statement', () => {
    it('should display fair scheduling message', () => {
      renderLayout()
      expect(screen.getByText('Fair Scheduling')).toBeInTheDocument()
    })

    it('should display driver equality message', () => {
      renderLayout()
      expect(screen.getByText('Every driver deserves equal opportunity')).toBeInTheDocument()
    })
  })

  describe('view transitions', () => {
    it('should update when currentView prop changes', () => {
      const { rerender } = render(
        <Layout currentView="dashboard" onViewChange={mockOnViewChange}>
          <div>Content</div>
        </Layout>
      )

      // Dashboard should be active
      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toHaveClass('bg-jbg-primary')

      // Change to trucks view
      rerender(
        <Layout currentView="trucks" onViewChange={mockOnViewChange}>
          <div>Content</div>
        </Layout>
      )

      // Trucks should now be active
      const trucksButton = screen.getByText('Trucks').closest('button')
      expect(trucksButton).toHaveClass('bg-jbg-primary')
      expect(dashboardButton).not.toHaveClass('bg-jbg-primary')
    })
  })
})
