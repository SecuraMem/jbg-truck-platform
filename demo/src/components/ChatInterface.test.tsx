import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from './ChatInterface'
import type { ChatMessage, Truck, Load } from '../types'
import * as api from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  sendChatMessage: vi.fn(),
}))

const mockSendChatMessage = vi.mocked(api.sendChatMessage)

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

const createChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'Test message',
  timestamp: '2026-01-14T10:00:00Z',
  ...overrides,
})

// Helper to find the send button (it's in the input area at the bottom)
const getSendButton = () => {
  const inputArea = screen.getByPlaceholderText(/ask about scheduling/i).closest('.flex.gap-2')
  return inputArea?.querySelector('button') as HTMLButtonElement
}

describe('ChatInterface', () => {
  const mockOnNewMessage = vi.fn()
  const defaultProps = {
    trucks: [createTruck()],
    loads: [createLoad()],
    chatHistory: [] as ChatMessage[],
    onNewMessage: mockOnNewMessage,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('should display welcome message when chat is empty', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText(/how can i help you today/i)).toBeInTheDocument()
    })

    it('should display suggested questions when chat is empty', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText(/which trucks need the most help this week/i)).toBeInTheDocument()
    })

    it('should display assistant header', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('JBG Scheduling Assistant')).toBeInTheDocument()
      expect(screen.getByText('Powered by Claude AI')).toBeInTheDocument()
    })
  })

  describe('message input', () => {
    it('should have an input field', () => {
      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      expect(input).toBeInTheDocument()
    })

    it('should have send button disabled when input is empty', () => {
      render(<ChatInterface {...defaultProps} />)

      const sendButton = getSendButton()
      expect(sendButton).toBeDisabled()
    })

    it('should enable send button when text is entered', () => {
      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Hello' } })

      const sendButton = getSendButton()
      expect(sendButton).not.toBeDisabled()
    })

    it('should clear input after sending message', async () => {
      mockSendChatMessage.mockResolvedValueOnce('Response from AI')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Hello' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      expect(input.value).toBe('')
    })

    it('should send message on Enter key press', async () => {
      mockSendChatMessage.mockResolvedValueOnce('Response from AI')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      await waitFor(() => {
        expect(mockOnNewMessage).toHaveBeenCalled()
      })
    })

    it('should not send on Shift+Enter', async () => {
      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true })

      expect(mockOnNewMessage).not.toHaveBeenCalled()
    })
  })

  describe('sending messages', () => {
    it('should call onNewMessage with user message', async () => {
      mockSendChatMessage.mockResolvedValueOnce('AI Response')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Hello AI' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnNewMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'user',
            content: 'Hello AI',
          })
        )
      })
    })

    it('should call sendChatMessage API with correct parameters', async () => {
      mockSendChatMessage.mockResolvedValueOnce('AI Response')

      const trucks = [createTruck()]
      const loads = [createLoad()]
      const history = [createChatMessage()]

      render(
        <ChatInterface
          trucks={trucks}
          loads={loads}
          chatHistory={history}
          onNewMessage={mockOnNewMessage}
        />
      )

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test question' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockSendChatMessage).toHaveBeenCalledWith(
          'Test question',
          trucks,
          loads,
          history
        )
      })
    })

    it('should call onNewMessage with assistant message on success', async () => {
      mockSendChatMessage.mockResolvedValueOnce('This is the AI response')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Hello' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        // Should be called twice: once for user message, once for assistant
        expect(mockOnNewMessage).toHaveBeenCalledTimes(2)
        expect(mockOnNewMessage).toHaveBeenLastCalledWith(
          expect.objectContaining({
            role: 'assistant',
            content: 'This is the AI response',
          })
        )
      })
    })
  })

  describe('loading state', () => {
    it('should show loading indicator while waiting for response', async () => {
      let resolvePromise: (value: string) => void
      const promise = new Promise<string>(resolve => {
        resolvePromise = resolve
      })
      mockSendChatMessage.mockReturnValueOnce(promise)

      render(
        <ChatInterface
          {...defaultProps}
          chatHistory={[createChatMessage()]}
        />
      )

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Thinking...')).toBeInTheDocument()
      })

      // Resolve the promise
      resolvePromise!('Response')
    })

    it('should disable input while loading', async () => {
      let resolvePromise: (value: string) => void
      const promise = new Promise<string>(resolve => {
        resolvePromise = resolve
      })
      mockSendChatMessage.mockReturnValueOnce(promise)

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Test' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(input).toBeDisabled()
      })

      resolvePromise!('Response')
    })
  })

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      mockSendChatMessage.mockRejectedValueOnce(new Error('Network error'))

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should show generic error message for non-Error rejections', async () => {
      mockSendChatMessage.mockRejectedValueOnce('Unknown error')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to get response')).toBeInTheDocument()
      })
    })

    it('should clear error when sending new message', async () => {
      // First call fails
      mockSendChatMessage.mockRejectedValueOnce(new Error('First error'))

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: 'Test' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })

      // Second call succeeds
      mockSendChatMessage.mockResolvedValueOnce('Success')

      fireEvent.change(input, { target: { value: 'New message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })
    })
  })

  describe('chat history display', () => {
    it('should display chat history messages', () => {
      const history: ChatMessage[] = [
        createChatMessage({ id: '1', role: 'user', content: 'Hello' }),
        createChatMessage({ id: '2', role: 'assistant', content: 'Hi there!' }),
      ]

      render(
        <ChatInterface
          {...defaultProps}
          chatHistory={history}
        />
      )

      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should display message timestamps', () => {
      const history: ChatMessage[] = [
        createChatMessage({
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: '2026-01-14T10:30:00Z',
        }),
      ]

      render(
        <ChatInterface
          {...defaultProps}
          chatHistory={history}
        />
      )

      // The timestamp should be formatted as HH:MM
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    })

    it('should not show welcome message when there is chat history', () => {
      const history: ChatMessage[] = [
        createChatMessage({ id: '1', content: 'Hello' }),
      ]

      render(
        <ChatInterface
          {...defaultProps}
          chatHistory={history}
        />
      )

      expect(screen.queryByText(/how can i help you today/i)).not.toBeInTheDocument()
    })
  })

  describe('suggested questions', () => {
    it('should send message when clicking suggested question in empty state', async () => {
      mockSendChatMessage.mockResolvedValueOnce('Response')

      render(<ChatInterface {...defaultProps} />)

      const suggestionButton = screen.getByText(/which trucks need the most help/i)
      fireEvent.click(suggestionButton)

      await waitFor(() => {
        expect(mockOnNewMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Which trucks need the most help this week?',
          })
        )
      })
    })

    it('should show quick action buttons when there is chat history', () => {
      const history: ChatMessage[] = [
        createChatMessage({ id: '1', content: 'Hello' }),
      ]

      render(
        <ChatInterface
          {...defaultProps}
          chatHistory={history}
        />
      )

      // Should show quick actions above the input
      expect(screen.getByText(/which trucks need the most help/i)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should not send empty or whitespace-only messages', async () => {
      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: '   ' } })

      const sendButton = getSendButton()
      expect(sendButton).toBeDisabled()
    })

    it('should handle message with trimmed content', async () => {
      mockSendChatMessage.mockResolvedValueOnce('Response')

      render(<ChatInterface {...defaultProps} />)

      const input = screen.getByPlaceholderText(/ask about scheduling/i)
      fireEvent.change(input, { target: { value: '  Hello  ' } })

      const sendButton = getSendButton()
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnNewMessage).toHaveBeenCalled()
      })
    })
  })
})
