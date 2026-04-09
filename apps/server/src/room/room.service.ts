import { redis } from '../redis/client'
import type { Player, Room } from './room'
import { randomUUID } from 'crypto'

const ROOM_TTL = 60 * 60 * 24 // 24 hours

function generateCode(): string {
  // Exclude I and O to avoid confusion with 1 and 0
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function roomKey(code: string): string {
  return `room:${code}`
}

export async function createRoom(hostId: string, hostSocketId: string): Promise<Room> {
  let code: string
  let attempts = 0

  // Generate unique code (collision is rare but handle it)
  do {
    code = generateCode()
    attempts++
    if (attempts > 10) throw new Error('Failed to generate unique room code')
  } while (await redis.exists(roomKey(code)))

  const room: Room = {
    code,
    hostId,
    hostSocketId,
    players: [],
    status: 'lobby',
    createdAt: Date.now(),
  }

  await redis.hset(roomKey(code), {
    hostId: room.hostId,
    hostSocketId: room.hostSocketId,
    players: JSON.stringify(room.players),
    status: room.status,
    createdAt: String(room.createdAt),
  })
  await redis.expire(roomKey(code), ROOM_TTL)

  return room
}

export async function getRoom(code: string): Promise<Room | null> {
  const raw = await redis.hgetall(roomKey(code))
  if (!raw || !raw.hostId) return null

  return {
    code,
    hostId: raw.hostId,
    hostSocketId: raw.hostSocketId,
    players: raw.players ? JSON.parse(raw.players) : [],
    status: raw.status as Room['status'],
    createdAt: parseInt(raw.createdAt),
  }
}

export async function findRoomByHostId(hostId: string): Promise<Room | null> {
  // Scan for the host's room — called only on host reconnect, not in hot path
  const keys = await redis.keys('room:*')
  for (const key of keys) {
    const storedHostId = await redis.hget(key, 'hostId')
    if (storedHostId === hostId) {
      const code = key.replace('room:', '')
      return getRoom(code)
    }
  }
  return null
}

/**
 * Atomically add a player to a room.
 * Uses Redis WATCH/MULTI/EXEC to prevent race conditions when multiple
 * players join simultaneously (prevents exceeding the 8-player limit).
 */
export async function joinRoom(
  code: string,
  name: string,
  emoji: string,
  socketId: string,
): Promise<{ room: Room; reconnectToken: string }> {
  const key = roomKey(code)
  const reconnectToken = randomUUID()
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // WATCH key — if anything modifies it before EXEC, exec() returns null
    await redis.watch(key)

    const raw = await redis.hgetall(key)
    if (!raw || !raw.hostId) {
      await redis.unwatch()
      throw new Error('Room not found')
    }
    if (raw.status !== 'lobby') {
      await redis.unwatch()
      throw new Error('Room is no longer accepting players')
    }

    const players: Player[] = raw.players ? JSON.parse(raw.players) : []
    if (players.length >= 8) {
      await redis.unwatch()
      throw new Error('Room is full')
    }

    const newPlayer: Player = { id: reconnectToken, name, emoji, socketId }
    players.push(newPlayer)

    // MULTI starts a transaction — exec returns null if WATCH was triggered
    const result = await redis.multi().hset(key, 'players', JSON.stringify(players)).exec()

    if (result !== null) {
      // Transaction committed
      const room: Room = {
        code,
        hostId: raw.hostId,
        hostSocketId: raw.hostSocketId,
        players,
        status: raw.status as Room['status'],
        createdAt: parseInt(raw.createdAt),
      }
      return { room, reconnectToken }
    }
    // WATCH was triggered by concurrent write — retry
  }

  throw new Error('Failed to join room — please try again')
}

/**
 * Reconnect a player using their stored reconnect token.
 * Updates their socketId to the new connection.
 */
export async function reconnectPlayer(
  code: string,
  reconnectToken: string,
  newSocketId: string,
): Promise<Room | null> {
  const key = roomKey(code)

  await redis.watch(key)
  const raw = await redis.hgetall(key)
  if (!raw || !raw.hostId) {
    await redis.unwatch()
    return null
  }

  const players: Player[] = raw.players ? JSON.parse(raw.players) : []
  const idx = players.findIndex(p => p.id === reconnectToken)
  if (idx === -1) {
    await redis.unwatch()
    return null
  }

  players[idx] = { ...players[idx], socketId: newSocketId }

  const result = await redis.multi().hset(key, 'players', JSON.stringify(players)).exec()
  if (result === null) return null // WATCH triggered, caller can retry

  return {
    code,
    hostId: raw.hostId,
    hostSocketId: raw.hostSocketId,
    players,
    status: raw.status as Room['status'],
    createdAt: parseInt(raw.createdAt),
  }
}

export async function updateHostSocket(code: string, newSocketId: string): Promise<void> {
  await redis.hset(roomKey(code), 'hostSocketId', newSocketId)
}

export async function updateRoomStatus(
  code: string,
  status: Room['status'],
): Promise<void> {
  await redis.hset(roomKey(code), 'status', status)
}
