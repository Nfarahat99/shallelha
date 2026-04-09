import type { Socket } from 'socket.io'

/**
 * Extracts userId from socket handshake auth.
 *
 * The client passes userId via socket.io auth option:
 *   io(backendUrl, { auth: { userId } })
 *
 * NOT via headers — browser WebSocket API silently drops custom HTTP headers.
 * Returns null if missing or not a string (caller emits room:error).
 */
export function getAuthUserId(socket: Socket): string | null {
  const userId = socket.handshake.auth?.userId
  if (!userId || typeof userId !== 'string') return null
  return userId
}
