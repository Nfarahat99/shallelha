import type { Server, Socket } from 'socket.io'
import {
  createRoom,
  getRoom,
  joinRoom,
  reconnectPlayer,
  updateHostSocket,
  updateRoomStatus,
  findRoomByHostId,
} from '../room/room.service'
import { getAuthUserId } from './auth'
import { checkRateLimit } from './middleware/rateLimiter'

export function registerRoomHandlers(io: Server, socket: Socket): void {
  /**
   * HOST: Create a new game room.
   * Requires auth (userId in handshake.auth).
   * Emits: room:created { roomCode } | room:error { message }
   */
  socket.on('room:create', async () => {
    if (!checkRateLimit(socket.id, 'room:create', 5, 60_000)) {
      socket.emit('room:error', { message: 'Rate limit exceeded — try again later' })
      return
    }
    const userId = getAuthUserId(socket)
    if (!userId) {
      socket.emit('room:error', { message: 'Authentication required to create a room' })
      return
    }

    try {
      const room = await createRoom(userId, socket.id)
      socket.join(room.code)
      socket.data.userId = userId
      socket.data.roomCode = room.code
      socket.data.isHost = true
      socket.emit('room:created', { roomCode: room.code })
      console.log(`[INFO] Room: created ${room.code} by ${userId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      socket.emit('room:error', { message })
    }
  })

  /**
   * HOST: Rejoin an existing room after page refresh.
   * Looks up room by hostId — does NOT create a new room.
   * Emits: lobby:update { players } | room:error { message }
   */
  socket.on('room:rejoin', async (data: { roomCode?: string }) => {
    const userId = getAuthUserId(socket)
    if (!userId) {
      socket.emit('room:error', { message: 'Authentication required' })
      return
    }

    try {
      let room = data.roomCode ? await getRoom(data.roomCode) : null

      // Verify the requesting user is actually the host
      if (!room || room.hostId !== userId) {
        // Fallback: scan for host's room by userId
        room = await findRoomByHostId(userId)
      }

      if (!room) {
        socket.emit('room:error', { message: 'No active room found' })
        return
      }

      await updateHostSocket(room.code, socket.id)
      socket.join(room.code)
      socket.data.userId = userId
      socket.data.roomCode = room.code
      socket.data.isHost = true

      socket.emit('lobby:update', { players: room.players })
      console.log(`[INFO] Room: host rejoined ${room.code}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rejoin room'
      socket.emit('room:error', { message })
    }
  })

  /**
   * PLAYER: Join an existing room.
   * No auth required — players are anonymous.
   * Emits: room:joined { reconnectToken, players } | room:error { message }
   * Broadcasts: lobby:update { players } to room
   */
  socket.on('room:join', async (data: { roomCode: string; name: string; emoji: string }) => {
    if (!checkRateLimit(socket.id, 'room:join', 10, 60_000)) {
      socket.emit('room:error', { message: 'Rate limit exceeded — try again later' })
      return
    }
    const { roomCode, name, emoji } = data ?? {}

    if (!roomCode || !name || !emoji) {
      socket.emit('room:error', { message: 'roomCode, name, and emoji are required' })
      return
    }
    if (!/^[A-HJ-NP-Z]{4}$/.test(roomCode)) {
      socket.emit('room:error', { message: 'Invalid room code format' })
      return
    }
    if (name.length > 15) {
      socket.emit('room:error', { message: 'Name must be 15 characters or fewer' })
      return
    }

    try {
      const { room, reconnectToken } = await joinRoom(roomCode, name, emoji, socket.id)

      socket.join(roomCode)
      socket.data.roomCode = roomCode
      socket.data.reconnectToken = reconnectToken

      socket.emit('room:joined', { reconnectToken, players: room.players })
      io.to(roomCode).emit('lobby:update', { players: room.players })
      console.log(`[Room] ${name} joined ${roomCode}`)
      console.log(`[INFO] Room: ${socket.id} joined ${roomCode} (${room.players.length}/8 players)`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room'
      socket.emit('room:error', { message })
    }
  })

  /**
   * PLAYER: Reconnect using stored reconnect token from sessionStorage.
   * Restores player's slot in the room without re-joining.
   * Emits: room:joined { reconnectToken, players } | room:error { message }
   */
  socket.on('reconnect:player', async (data: { roomCode: string; reconnectToken: string }) => {
    const { roomCode, reconnectToken } = data ?? {}
    if (!roomCode || !reconnectToken) {
      socket.emit('room:error', { message: 'roomCode and reconnectToken required' })
      return
    }
    if (!/^[A-HJ-NP-Z]{4}$/.test(roomCode)) {
      socket.emit('room:error', { message: 'Invalid room code format' })
      return
    }

    try {
      const room = await reconnectPlayer(roomCode, reconnectToken, socket.id)
      if (!room) {
        socket.emit('room:error', { message: 'Reconnect token expired or invalid' })
        return
      }

      socket.join(roomCode)
      socket.data.roomCode = roomCode
      socket.data.reconnectToken = reconnectToken

      socket.emit('room:joined', { reconnectToken, players: room.players })
      io.to(roomCode).emit('lobby:update', { players: room.players })
      console.log(`[INFO] Room: player reconnected to ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reconnect failed'
      socket.emit('room:error', { message })
    }
  })

  /**
   * HOST: Start the game. Host-only — verified server-side by isHost flag.
   * Emits: game:started to room | room:error if not host
   */
  socket.on('room:start', async () => {
    if (!socket.data.isHost) {
      socket.emit('room:error', { message: 'Only the host can start the game' })
      return
    }
    const roomCode = socket.data.roomCode
    if (!roomCode) {
      socket.emit('room:error', { message: 'Not in a room' })
      return
    }

    try {
      const room = await getRoom(roomCode)
      if (!room || room.hostId !== socket.data.userId) {
        socket.emit('room:error', { message: 'Host verification failed' })
        return
      }
      await updateRoomStatus(roomCode, 'playing')
      io.to(roomCode).emit('game:started', { roomCode })
      console.log(`[INFO] Room: game started in ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game'
      socket.emit('room:error', { message })
    }
  })

  /**
   * HOST: End the game. Host-only.
   * Emits: game:ended to room | room:error if not host
   */
  socket.on('room:end', async () => {
    if (!socket.data.isHost) {
      socket.emit('room:error', { message: 'Only the host can end the game' })
      return
    }
    const roomCode = socket.data.roomCode
    if (!roomCode) {
      socket.emit('room:error', { message: 'Not in a room' })
      return
    }

    try {
      const room = await getRoom(roomCode)
      if (!room || room.hostId !== socket.data.userId) {
        socket.emit('room:error', { message: 'Host verification failed' })
        return
      }
      await updateRoomStatus(roomCode, 'ended')
      io.to(roomCode).emit('game:ended', { roomCode })
      console.log(`[INFO] Room: game ended in ${roomCode}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end game'
      socket.emit('room:error', { message })
    }
  })
}
