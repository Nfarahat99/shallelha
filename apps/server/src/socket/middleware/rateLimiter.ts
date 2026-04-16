/**
 * Per-socket, per-event in-memory rate limiter.
 * Pure utility — no external dependencies.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Outer key: socket.id
 * Inner key: event name
 */
export const socketEventCounts: Map<string, Map<string, RateLimitEntry>> = new Map()

/**
 * Check whether a given socket is allowed to fire `event`.
 * Returns true if within limit, false if rate-limited.
 *
 * @param socketId  - socket.id of the caller
 * @param event     - name of the Socket.io event being checked
 * @param limit     - maximum allowed calls within the window
 * @param windowMs  - window duration in milliseconds
 */
export function checkRateLimit(
  socketId: string,
  event: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()

  if (!socketEventCounts.has(socketId)) {
    socketEventCounts.set(socketId, new Map())
  }

  const socketMap = socketEventCounts.get(socketId)!

  if (!socketMap.has(event)) {
    // First call — create entry
    socketMap.set(event, { count: 1, resetAt: now + windowMs })
    return true
  }

  const entry = socketMap.get(event)!

  if (now >= entry.resetAt) {
    // Window expired — reset
    socketMap.set(event, { count: 1, resetAt: now + windowMs })
    return true
  }

  // Still within window
  entry.count += 1
  if (entry.count > limit) {
    return false
  }

  return true
}

/**
 * Remove all rate-limit tracking for a socket (call on disconnect).
 */
export function clearSocketRateLimits(socketId: string): void {
  socketEventCounts.delete(socketId)
}
