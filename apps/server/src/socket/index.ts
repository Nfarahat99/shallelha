import type { Server } from 'socket.io'
import { registerRoomHandlers } from './room'
import { registerGameHandlers, clearAutoRevealTimer, clearVotingTimer } from './game'
import { registerDrawingHandlers, clearDrawingTimer } from './drawing'
import { clearSocketRateLimits } from './middleware/rateLimiter'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`[INFO] Socket connected: ${socket.id}`)

    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)
    registerDrawingHandlers(io, socket)

    socket.on('disconnect', (reason) => {
      console.log(`[INFO] Socket disconnected: ${socket.id} — ${reason}`)
      clearSocketRateLimits(socket.id)
      if (socket.data.isHost && socket.data.roomCode) {
        clearAutoRevealTimer(socket.data.roomCode)
        clearVotingTimer(socket.data.roomCode)
        clearDrawingTimer(socket.data.roomCode)
      }
    })
  })
}
