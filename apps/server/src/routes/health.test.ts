import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// Mock BEFORE importing health router (vitest hoisting)
vi.mock('../db/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    question: {
      count: vi.fn(),
    },
  },
}))

vi.mock('../redis/client', () => ({
  redis: {
    ping: vi.fn(),
  },
}))

import { healthRouter } from './health'
import { prisma } from '../db/prisma'
import { redis } from '../redis/client'

function buildApp() {
  const app = express()
  app.use('/health', healthRouter)
  return app
}

describe('GET /health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with all ok when postgres and redis are healthy', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }])
    vi.mocked(redis.ping).mockResolvedValueOnce('PONG')

    const res = await request(buildApp()).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', postgres: 'ok', redis: 'ok' })
  })

  it('returns 503 with postgres:error when postgres is down', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('connection refused'))
    vi.mocked(redis.ping).mockResolvedValueOnce('PONG')

    const res = await request(buildApp()).get('/health')

    expect(res.status).toBe(503)
    expect(res.body.postgres).toBe('error')
    expect(res.body.redis).toBe('ok')
  })

  it('returns 503 with redis:error when redis is down', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }])
    vi.mocked(redis.ping).mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await request(buildApp()).get('/health')

    expect(res.status).toBe(503)
    expect(res.body.redis).toBe('error')
    expect(res.body.postgres).toBe('ok')
  })

  it('returns 503 with both errors when both dependencies are down', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('pg down'))
    vi.mocked(redis.ping).mockRejectedValueOnce(new Error('redis down'))

    const res = await request(buildApp()).get('/health')

    expect(res.status).toBe(503)
    expect(res.body.postgres).toBe('error')
    expect(res.body.redis).toBe('error')
  })
})
