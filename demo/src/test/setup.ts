import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Mock scrollIntoView since it's not available in jsdom
Element.prototype.scrollIntoView = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Reset localStorage and mocks after each test
afterEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

// Export for use in tests
export { localStorageMock }
