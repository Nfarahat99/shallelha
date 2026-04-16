import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  checkRateLimit,
  clearSocketRateLimits,
  socketEventCounts,
} from '../middleware/rateLimiter'

describe('rate limiter', () => {
  beforeEach(() => {
    // Clear all state between tests to prevent leakage
    socketEventCounts.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within limit', () => {
    const socketId = 'socket-1'
    const event = 'room:create'
    const limit = 5

    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(socketId, event, limit, 60_000)).toBe(true)
    }
  })

  it('blocks request exceeding limit', () => {
    const socketId = 'socket-2'
    const event = 'room:create'
    const limit = 5

    // First 5 allowed
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(socketId, event, limit, 60_000)).toBe(true)
    }
    // 6th is blocked
    expect(checkRateLimit(socketId, event, limit, 60_000)).toBe(false)
  })

  it('resets after window expires', () => {
    vi.useFakeTimers()

    const socketId = 'socket-3'
    const event = 'room:join'
    const limit = 3
    const windowMs = 1_000

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      checkRateLimit(socketId, event, limit, windowMs)
    }
    expect(checkRateLimit(socketId, event, limit, windowMs)).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1)

    // Should be allowed again after reset
    expect(checkRateLimit(socketId, event, limit, windowMs)).toBe(true)
  })

  it('clearSocketRateLimits removes entries for that socket', () => {
    const socketId = 'socket-4'
    const event = 'room:create'

    // Create some entries
    checkRateLimit(socketId, event, 5, 60_000)
    expect(socketEventCounts.has(socketId)).toBe(true)

    clearSocketRateLimits(socketId)

    expect(socketEventCounts.has(socketId)).toBe(false)
  })
})
