import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// Mock prisma BEFORE importing the admin router (vitest hoisting)
vi.mock('../../db/prisma', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
    },
  },
}))

import { adminRouter } from '../admin'
import { prisma } from '../../db/prisma'

function buildApp() {
  const app = express()
  app.use('/admin', adminRouter)
  return app
}

describe('Admin Analytics Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /admin/analytics returns question stats with timesPlayed and timesAnsweredWrong', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([
      {
        id: 'q1',
        text: 'What is 2+2?',
        status: 'approved' as any,
        type: 'MULTIPLE_CHOICE' as any,
        timesPlayed: 10,
        timesAnsweredWrong: 3,
        category: { id: 'cat1', name: 'Math' },
      },
    ])

    const res = await request(buildApp()).get('/admin/analytics')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('questions')
    expect(Array.isArray(res.body.questions)).toBe(true)
    expect(res.body.questions[0]).toMatchObject({
      id: 'q1',
      timesPlayed: 10,
      timesAnsweredWrong: 3,
    })
  })

  it('GET /admin/analytics returns wrongRate calculated as timesAnsweredWrong/timesPlayed', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([
      {
        id: 'q1',
        text: 'Hard question?',
        status: 'approved' as any,
        type: 'MULTIPLE_CHOICE' as any,
        timesPlayed: 10,
        timesAnsweredWrong: 3,
        category: { id: 'cat1', name: 'General' },
      },
    ])

    const res = await request(buildApp()).get('/admin/analytics')

    expect(res.status).toBe(200)
    expect(res.body.questions[0].wrongRate).toBe(0.3)
  })

  it('GET /admin/analytics returns 0 wrongRate when timesPlayed is 0', async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([
      {
        id: 'q2',
        text: 'Never played question?',
        status: 'draft' as any,
        type: 'MULTIPLE_CHOICE' as any,
        timesPlayed: 0,
        timesAnsweredWrong: 0,
        category: { id: 'cat1', name: 'General' },
      },
    ])

    const res = await request(buildApp()).get('/admin/analytics')

    expect(res.status).toBe(200)
    expect(res.body.questions[0].wrongRate).toBe(0)
  })

  it('responds with 429 when rate limit exceeded', async () => {
    // Mock findMany to always resolve quickly
    vi.mocked(prisma.question.findMany).mockResolvedValue([])

    const app = buildApp()
    // Send 31 requests — the 31st should hit the rate limit (30 req/min)
    const requests = Array.from({ length: 31 }, () =>
      request(app).get('/admin/analytics'),
    )
    const responses = await Promise.all(requests)
    const statuses = responses.map((r) => r.status)

    // At least one response must be 429
    expect(statuses).toContain(429)
  })
})
