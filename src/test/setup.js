import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock crypto.randomUUID for jsdom which may not support it
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `test-${Math.random().toString(36).slice(2)}`,
    },
    configurable: true,
  })
}

// Mock URL.createObjectURL used in exportData
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
globalThis.URL.revokeObjectURL = vi.fn()

// Suppress console.error for cleaner test output (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
