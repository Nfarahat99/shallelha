'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Returns a singleton Socket.io client instance.
 *
 * - transports: ['websocket'] — Railway has no sticky sessions;
 *   polling would break on multiple replicas.
 * - autoConnect: false — callers connect explicitly when needed.
 * - Reads NEXT_PUBLIC_BACKEND_URL from environment.
 *
 * Usage in a Client Component:
 *   const socket = getSocket()
 *   socket.connect()
 *   socket.on('event', handler)
 *   // cleanup: socket.off('event', handler) or socket.disconnect()
 */
export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      throw new Error(
        'NEXT_PUBLIC_BACKEND_URL is not set. ' +
        'Add it to .env.local (local dev) or Vercel environment variables (production).'
      )
    }
    socket = io(backendUrl, {
      transports: ['websocket'], // WebSocket only — no HTTP long-polling
      autoConnect: false,
    })
  }
  return socket
}
