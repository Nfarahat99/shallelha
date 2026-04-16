import type { Server } from 'socket.io'
import { registerRoomHandlers } from './room'
import { registerGameHandlers, clearAutoRevealTimer, clearVotingTimer } from './game'
import { clearSocketRateLimits } from './middleware/rateLimiter'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} — ${reason}`)
      clearSocketRateLimits(socket.id)
      if (socket.data.isHost && socket.data.roomCode) {
        clearAutoRevealTimer(socket.data.roomCode)
        clearVotingTimer(socket.data.roomCode)
      }
    })
  })
}
