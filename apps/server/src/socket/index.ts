import type { Server } from 'socket.io'
import { registerRoomHandlers } from './room'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    registerRoomHandlers(io, socket)

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`)
    })
  })
}
