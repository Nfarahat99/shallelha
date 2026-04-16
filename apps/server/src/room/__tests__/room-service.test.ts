import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Redis client before importing the service
vi.mock('../../redis/client', () => {
  const mockRedis = {
    exists: vi.fn(),
    hset: vi.fn(),
    expire: vi.fn(),
    hgetall: vi.fn(),
    hget: vi.fn(),
    keys: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    watch: vi.fn(),
    unwatch: vi.fn(),
    multi: vi.fn(() => ({
      hset: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    })),
  }
  return { redis: mockRedis }
})

import { createRoom, getRoom, joinRoom, reconnectPlayer } from '../room.service'
import { redis } from '../../redis/client'

const mockRedis = redis as ReturnType<typeof vi.mocked<typeof redis>>

describe('createRoom', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a 4-character uppercase room code (ROOM-01)', async () => {
    vi.mocked(mockRedis.exists).mockResolvedValue(0)
    vi.mocked(mockRedis.hset).mockResolvedValue(5)
    vi.mocked(mockRedis.expire).mockResolvedValue(1)
    vi.mocked(mockRedis.set).mockResolvedValue('OK')

    const room = await createRoom('user-123', 'socket-abc')

    expect(room.code).toMatch(/^[A-Z]{4}$/)
    expect(room.code).not.toMatch(/[IO]/) // No I or O
    expect(room.hostId).toBe('user-123')
    expect(room.players).toHaveLength(0)
    expect(room.status).toBe('lobby')
  })

  it('retries on collision — picks unique code', async () => {
    vi.mocked(mockRedis.exists)
      .mockResolvedValueOnce(1) // first code exists
      .mockResolvedValueOnce(0) // second code is free
    vi.mocked(mockRedis.hset).mockResolvedValue(5)
    vi.mocked(mockRedis.expire).mockResolvedValue(1)
    vi.mocked(mockRedis.set).mockResolvedValue('OK')

    const room = await createRoom('user-123', 'socket-abc')
    expect(room.code).toMatch(/^[A-Z]{4}$/)
    expect(mockRedis.exists).toHaveBeenCalledTimes(2)
  })
})

describe('getRoom', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null if room does not exist', async () => {
    vi.mocked(mockRedis.hgetall).mockResolvedValue({} as Record<string, string>)
    const room = await getRoom('XXXX')
    expect(room).toBeNull()
  })

  it('parses room data from Redis hash', async () => {
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      hostId: 'user-1',
      hostSocketId: 'sock-1',
      players: JSON.stringify([{ id: 'tok-1', name: 'علي', emoji: '🦁', socketId: 'sock-2' }]),
      status: 'lobby',
      createdAt: '1700000000000',
    })

    const room = await getRoom('ABCD')
    expect(room).not.toBeNull()
    expect(room!.players).toHaveLength(1)
    expect(room!.players[0].name).toBe('علي')
    expect(room!.status).toBe('lobby')
  })
})

describe('joinRoom', () => {
  beforeEach(() => vi.clearAllMocks())

  const baseRoomHash = {
    hostId: 'host-1',
    hostSocketId: 'host-sock',
    players: JSON.stringify([]),
    status: 'lobby',
    createdAt: '1700000000000',
  }

  it('adds player to room and returns reconnect token (ROOM-01)', async () => {
    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue(baseRoomHash)

    const multiMock = {
      hset: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(['OK']),
    }
    vi.mocked(mockRedis.multi).mockReturnValue(multiMock as unknown as ReturnType<typeof mockRedis.multi>)

    const { room, reconnectToken } = await joinRoom('ABCD', 'فاطمة', '🌸', 'sock-player')

    expect(reconnectToken).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    expect(room.players).toHaveLength(1)
    expect(room.players[0].name).toBe('فاطمة')
  })

  it('rejects join when room is full — 9th player blocked (ROOM-04)', async () => {
    const fullPlayers = Array.from({ length: 8 }, (_, i) => ({
      id: `tok-${i}`,
      name: `لاعب ${i}`,
      emoji: '🦁',
      socketId: `sock-${i}`,
    }))

    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      ...baseRoomHash,
      players: JSON.stringify(fullPlayers),
    })
    vi.mocked(mockRedis.unwatch).mockResolvedValue('OK')

    await expect(joinRoom('ABCD', 'لاعب تاسع', '😊', 'sock-9')).rejects.toThrow('Room is full')
  })

  it('retries after WATCH conflict (concurrent join)', async () => {
    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue(baseRoomHash)

    const multiMock = {
      hset: vi.fn().mockReturnThis(),
      // First exec returns null (WATCH triggered), second succeeds
      exec: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(['OK']),
    }
    vi.mocked(mockRedis.multi).mockReturnValue(multiMock as unknown as ReturnType<typeof mockRedis.multi>)

    const { room } = await joinRoom('ABCD', 'أحمد', '⚡', 'sock-player')
    expect(room.players).toHaveLength(1)
    expect(multiMock.exec).toHaveBeenCalledTimes(2)
  })

  it('rejects join for non-lobby rooms', async () => {
    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      ...baseRoomHash,
      status: 'playing',
    })
    vi.mocked(mockRedis.unwatch).mockResolvedValue('OK')

    await expect(joinRoom('ABCD', 'لاعب', '🦁', 'sock-1')).rejects.toThrow('no longer accepting')
  })
})

describe('joinRoom — 9th player', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws "Room is full" when 8 players already present', async () => {
    const fullPlayers = Array.from({ length: 8 }, (_, i) => ({
      id: `tok-${i}`,
      name: `لاعب ${i}`,
      emoji: '🦁',
      socketId: `sock-${i}`,
    }))

    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      hostId: 'host-1',
      hostSocketId: 'host-sock',
      players: JSON.stringify(fullPlayers),
      status: 'lobby',
      createdAt: '1700000000000',
    })
    vi.mocked(mockRedis.unwatch).mockResolvedValue('OK')

    await expect(
      joinRoom('ABCD', 'اللاعب التاسع', '😊', 'sock-9'),
    ).rejects.toThrow('Room is full')
  })
})

describe('reconnectPlayer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates socketId for matching reconnect token (ROOM-05)', async () => {
    const players = [{ id: 'token-abc', name: 'سارة', emoji: '🌺', socketId: 'old-sock' }]

    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      hostId: 'host-1',
      hostSocketId: 'host-sock',
      players: JSON.stringify(players),
      status: 'lobby',
      createdAt: '1700000000000',
    })

    const multiMock = {
      hset: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(['OK']),
    }
    vi.mocked(mockRedis.multi).mockReturnValue(multiMock as unknown as ReturnType<typeof mockRedis.multi>)

    const room = await reconnectPlayer('ABCD', 'token-abc', 'new-sock')
    expect(room).not.toBeNull()
    expect(room!.players[0].socketId).toBe('new-sock')
  })

  it('returns null for unknown reconnect token', async () => {
    vi.mocked(mockRedis.watch).mockResolvedValue('OK')
    vi.mocked(mockRedis.hgetall).mockResolvedValue({
      hostId: 'host-1',
      hostSocketId: 'host-sock',
      players: JSON.stringify([]),
      status: 'lobby',
      createdAt: '1700000000000',
    })
    vi.mocked(mockRedis.unwatch).mockResolvedValue('OK')

    const room = await reconnectPlayer('ABCD', 'unknown-token', 'new-sock')
    expect(room).toBeNull()
  })
})
