import type { Server } from 'socket.io'
import { registerRoomHandlers } from './room'
import { registerGameHandlers } from './game'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`)
    })
  })
}
