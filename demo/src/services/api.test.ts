import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSchedule, sendChatMessage, ApiError } from './api'
import type { Truck, Load, ScheduleConstraints, ChatMessage } from '../types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTrucks: Truck[] = [
    { id: '1', truckId: 'T-001', contractorName: 'Test Trucking', size: 'large', capacityTons: 18, weeklyLoads: 2, minWeeklyLoads: 3, active: true },
    { id: '2', truckId: 'T-002', contractorName: 'Another Trucking', size: 'medium', capacityTons: 12, weeklyLoads: 0, minWeeklyLoads: 3, active: true },
  ]

  const mockLoads: Load[] = [
    { id: '1', loadId: 'L-1001', sizeTons: 8, destination: 'Kingston', origin: 'Depot', priority: 'high', deadline: '2026-01-14T08:00:00Z', status: 'unassigned', assignedTruckId: null },
    { id: '2', loadId: 'L-1002', sizeTons: 5, destination: 'Montego Bay', origin: 'Depot', priority: 'normal', deadline: '2026-01-15T08:00:00Z', status: 'unassigned', assignedTruckId: null },
    { id: '3', loadId: 'L-1003', sizeTons: 10, destination: 'Spanish Town', origin: 'Depot', priority: 'low', deadline: '2026-01-16T08:00:00Z', status: 'assigned', assignedTruckId: '1' },
  ]

  const mockConstraints: ScheduleConstraints = {
    minWeeklyLoads: 3,
    prioritizeUnderQuota: true,
    respectCapacity: true,
  }

  describe('generateSchedule', () => {
    it('should call the schedule endpoint with correct payload', async () => {
      const mockResponse = {
        assignments: [
          { loadId: 'L-1001', truckId: 'T-002', reasoning: 'T-002 has 0 loads this week' },
          { loadId: 'L-1002', truckId: 'T-001', reasoning: 'T-001 has capacity for medium loads' },
        ],
        fairnessScore: 0.85,
        reasoning: 'Schedule optimized for fairness',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateSchedule(mockTrucks, mockLoads, mockConstraints)

      expect(mockFetch).toHaveBeenCalledWith('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })

      // Verify only unassigned loads are sent
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.loads).toHaveLength(2) // Only unassigned loads
      expect(callBody.loads.every((l: Load) => l.status === 'unassigned')).toBe(true)

      expect(result).toEqual(mockResponse)
    })

    it('should filter out assigned loads before sending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ assignments: [], fairnessScore: 1.0, reasoning: '' }),
      })

      await generateSchedule(mockTrucks, mockLoads, mockConstraints)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.loads).toHaveLength(2)
      expect(callBody.loads.find((l: Load) => l.loadId === 'L-1003')).toBeUndefined()
    })

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error', details: 'API rate limit' }),
      })

      await expect(generateSchedule(mockTrucks, mockLoads, mockConstraints))
        .rejects.toThrow(ApiError)

      try {
        await generateSchedule(mockTrucks, mockLoads, mockConstraints)
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(500)
        expect((error as ApiError).message).toBe('Internal server error')
      }
    })

    it('should handle JSON parse error in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(generateSchedule(mockTrucks, mockLoads, mockConstraints))
        .rejects.toThrow('Failed to generate schedule')
    })
  })

  describe('sendChatMessage', () => {
    const mockChatHistory: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: '2026-01-13T10:00:00Z' },
      { id: '2', role: 'assistant', content: 'Hi! How can I help?', timestamp: '2026-01-13T10:00:05Z' },
    ]

    it('should call the chat endpoint with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'Here is your answer...' }),
      })

      const result = await sendChatMessage('What trucks are below quota?', mockTrucks, mockLoads, mockChatHistory)

      expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.message).toBe('What trucks are below quota?')
      expect(callBody.context.trucks).toBeDefined()
      expect(callBody.context.loads).toBeDefined()
      expect(callBody.history).toBeDefined()

      expect(result).toBe('Here is your answer...')
    })

    it('should only include last 10 messages in history', async () => {
      const longHistory: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'Response' }),
      })

      await sendChatMessage('New message', mockTrucks, mockLoads, longHistory)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.history).toHaveLength(10)
    })

    it('should include only relevant truck fields in context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'Response' }),
      })

      await sendChatMessage('Question', mockTrucks, mockLoads, [])

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      const truckContext = callBody.context.trucks[0]

      expect(truckContext).toHaveProperty('truckId')
      expect(truckContext).toHaveProperty('contractorName')
      expect(truckContext).toHaveProperty('weeklyLoads')
      expect(truckContext).toHaveProperty('minWeeklyLoads')
      expect(truckContext).toHaveProperty('size')
      expect(truckContext).toHaveProperty('active')
      expect(truckContext).not.toHaveProperty('capacityTons') // Not included in context
    })

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid message format' }),
      })

      await expect(sendChatMessage('test', mockTrucks, mockLoads, []))
        .rejects.toThrow(ApiError)
    })
  })

  describe('ApiError', () => {
    it('should create error with status and details', () => {
      const error = new ApiError('Test error', 404, 'Resource not found')

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(404)
      expect(error.details).toBe('Resource not found')
      expect(error.name).toBe('ApiError')
    })

    it('should work without details', () => {
      const error = new ApiError('Simple error', 500)

      expect(error.message).toBe('Simple error')
      expect(error.status).toBe(500)
      expect(error.details).toBeUndefined()
    })
  })
})
