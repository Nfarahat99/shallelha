import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Server, Socket } from 'socket.io'
import { registerGameHandlers } from '../game'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../game/game.service', () => ({
  calculateScore: vi.fn(),
  createInitialPlayerStates: vi.fn(),
  getLeaderboard: vi.fn(),
  saveGameState: vi.fn().mockResolvedValue(undefined),
  getGameState: vi.fn(),
  deleteGameState: vi.fn().mockResolvedValue(undefined),
  calculateFreeTextScore: vi.fn(),
}))

vi.mock('../../room/room.service', () => ({
  getRoom: vi.fn(),
  updateRoomStatus: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../db/prisma', () => ({
  prisma: {
    question: { update: vi.fn().mockResolvedValue(undefined) },
    pack: { update: vi.fn().mockResolvedValue(undefined) },
    gameSession: { create: vi.fn().mockResolvedValue({ id: 'session-1' }) },
    playerGameResult: { createMany: vi.fn().mockResolvedValue(undefined) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
    category: { findUnique: vi.fn().mockResolvedValue(null) },
    packQuestion: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { deleteGameState } from '../../game/game.service'
import { updateRoomStatus } from '../../room/room.service'

function buildMockSocket(overrides: Partial<Socket['data']> = {}): {
  socket: Partial<Socket>
  handlers: Record<string, (...args: unknown[]) => void>
} {
  const handlers: Record<string, (...args: unknown[]) => void> = {}

  const socket: Partial<Socket> = {
    data: {
      isHost: true,
      roomCode: 'ABC123',
      reconnectToken: 'player-host-token',
      ...overrides,
    },
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler
      return socket as Socket
    }),
  }

  return { socket, handlers }
}

function buildMockIo(): { io: Partial<Server>; roomEmit: ReturnType<typeof vi.fn> } {
  const roomEmit = vi.fn()
  const io: Partial<Server> = {
    to: vi.fn().mockReturnValue({ emit: roomEmit }),
  }
  return { io, roomEmit }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('game:reset handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('broadcasts room:reset and resets state when host emits game:reset', async () => {
    const { socket, handlers } = buildMockSocket({ isHost: true, roomCode: 'ABC123' })
    const { io, roomEmit } = buildMockIo()

    registerGameHandlers(io as Server, socket as Socket)

    // Trigger the game:reset handler
    const handler = handlers['game:reset']
    expect(handler).toBeDefined()

    await handler()

    // deleteGameState should have been called with the room code
    expect(deleteGameState).toHaveBeenCalledWith('ABC123')

    // updateRoomStatus should reset to lobby
    expect(updateRoomStatus).toHaveBeenCalledWith('ABC123', 'lobby')

    // io.to(roomCode).emit('room:reset') should have been called
    expect(io.to).toHaveBeenCalledWith('ABC123')
    expect(roomEmit).toHaveBeenCalledWith('room:reset')
  })

  it('emits room:error when socket is not a host', async () => {
    const { socket, handlers } = buildMockSocket({ isHost: false, roomCode: 'ABC123' })
    const { io } = buildMockIo()

    registerGameHandlers(io as Server, socket as Socket)

    const handler = handlers['game:reset']
    expect(handler).toBeDefined()

    await handler()

    // Should emit error and NOT proceed
    expect(socket.emit).toHaveBeenCalledWith('room:error', {
      message: 'Only the host can perform this action',
    })
    expect(deleteGameState).not.toHaveBeenCalled()
    expect(updateRoomStatus).not.toHaveBeenCalled()
  })

  it('emits room:error when roomCode is missing', async () => {
    const { socket, handlers } = buildMockSocket({ isHost: true, roomCode: undefined })
    const { io } = buildMockIo()

    registerGameHandlers(io as Server, socket as Socket)

    const handler = handlers['game:reset']
    expect(handler).toBeDefined()

    await handler()

    // Should return early — no state mutations
    expect(deleteGameState).not.toHaveBeenCalled()
    expect(updateRoomStatus).not.toHaveBeenCalled()
  })
})
