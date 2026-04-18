import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// Mock Redis BEFORE importing cardsRouter (vitest hoisting)
vi.mock('../../redis/client', () => ({
  redis: {
    hgetall: vi.fn(),
  },
}))

import { cardsRouter, renderCard } from '../cards'
import { redis } from '../../redis/client'

function buildApp() {
  const app = express()
  app.use('/cards', cardsRouter)
  return app
}

const VALID_ROOM_DATA = {
  hostId: 'host-1',
  hostSocketId: 'socket-1',
  players: JSON.stringify([
    { id: 'p1', name: 'محمد', emoji: '🦁', socketId: 's1' },
    { id: 'p2', name: 'سارة', emoji: '🦊', socketId: 's2' },
    { id: 'p3', name: 'خالد', emoji: '🐯', socketId: 's3' },
  ]),
  status: 'ended',
  createdAt: String(Date.now()),
  gameState: JSON.stringify({
    questionIds: [],
    currentQuestionIndex: 0,
    phase: 'ended',
    questionStartedAt: 0,
    timerDuration: 20,
    playerStates: {
      p1: { score: 2500, streak: 3, answeredCurrentQ: false, doublePointsUsed: false, removeTwoUsed: false, freezeOpponentUsed: false, doublePointsActiveCurrentQ: false, frozenCurrentQ: false },
      p2: { score: 1800, streak: 1, answeredCurrentQ: false, doublePointsUsed: false, removeTwoUsed: false, freezeOpponentUsed: false, doublePointsActiveCurrentQ: false, frozenCurrentQ: false },
      p3: { score: 1200, streak: 0, answeredCurrentQ: false, doublePointsUsed: false, removeTwoUsed: false, freezeOpponentUsed: false, doublePointsActiveCurrentQ: false, frozenCurrentQ: false },
    },
    hostSettings: { layout: '2x2', timerStyle: 'bar', revealMode: 'manual' },
  }),
}

describe('[TEST_CARD] GET /cards/result', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with image/png when gameId exists in Redis', async () => {
    vi.mocked(redis.hgetall).mockResolvedValueOnce(VALID_ROOM_DATA)

    const res = await request(buildApp())
      .get('/cards/result?gameId=TEST&variant=whatsapp')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/image\/png/)
    expect(res.body).toBeInstanceOf(Buffer)
  }, 30_000) // allow time for Google Fonts fetch on first run

  it('returns 404 when gameId does not exist in Redis', async () => {
    vi.mocked(redis.hgetall).mockResolvedValueOnce({})

    const res = await request(buildApp())
      .get('/cards/result?gameId=NONEXISTENT&variant=whatsapp')

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('[TEST_CARD] renderCard()', () => {
  it('returns a PNG Buffer with length > 0 for snapchat variant', async () => {
    const data = {
      gameName: 'اختبار شعللها',
      leaderboard: [
        { rank: 1, name: 'محمد', emoji: '🦁', score: 2500 },
        { rank: 2, name: 'سارة', emoji: '🦊', score: 1800 },
        { rank: 3, name: 'خالد', emoji: '🐯', score: 1200 },
      ],
      variant: 'snapchat' as const,
    }

    const buffer = await renderCard(data)

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
  }, 30_000) // allow time for Google Fonts fetch
})
