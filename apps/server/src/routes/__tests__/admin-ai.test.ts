import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// vi.hoisted ensures mockCreate is available inside the vi.mock factory (which is hoisted)
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

// Mock prisma BEFORE imports (vitest hoisting)
vi.mock('../../db/prisma', () => ({
  prisma: {
    question: {
      createMany: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock openai BEFORE imports
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

import { adminRouter } from '../admin'
import { prisma } from '../../db/prisma'

// Sample GPT-4o response: array of 3 question objects
const mockGPTQuestions = [
  {
    text: 'ما هي عاصمة المملكة العربية السعودية؟',
    options: ['الرياض', 'جدة', 'مكة', 'الدمام'],
    correctIndex: 0,
  },
  {
    text: 'ما هو الطبق الوطني السعودي؟',
    options: ['الكبسة', 'المندي', 'الهريس', 'المطبق'],
    correctIndex: 0,
  },
  {
    text: 'في أي عام تأسست المملكة العربية السعودية؟',
    options: ['1902', '1932', '1950', '1960'],
    correctIndex: 1,
  },
]

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/admin', adminRouter)
  return app
}

describe('POST /admin/ai-generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: 'cat-1',
      name: 'ثقافة',
      slug: 'culture',
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.question.createMany).mockResolvedValue({ count: 3 })
  })

  it('returns 200 with created count when GPT-4o returns valid questions', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ questions: mockGPTQuestions }),
          },
        },
      ],
    })

    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: 'cat-1', count: 5 })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('created')
    expect(typeof res.body.created).toBe('number')
    expect(res.body).toHaveProperty('questions')
    expect(Array.isArray(res.body.questions)).toBe(true)
  })

  it('returns 400 when count is below 5', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: 'cat-1', count: 4 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when count is above 10', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: 'cat-1', count: 11 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when categoryId is missing', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ count: 5 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 502 when OpenAI throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI network error'))

    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: 'cat-1', count: 5 })

    expect(res.status).toBe(502)
    expect(res.body).toHaveProperty('error')
  })

  it('rate-limits to 5 requests per minute', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ questions: mockGPTQuestions }) } }],
    })
    vi.mocked(prisma.question.createMany).mockResolvedValue({ count: 3 })

    const app = buildApp()
    const reqs = Array.from({ length: 6 }, () =>
      request(app).post('/admin/ai-generate').send({ categoryId: 'cat-1', count: 5 }),
    )
    const responses = await Promise.all(reqs)
    const statuses = responses.map((r) => r.status)
    expect(statuses).toContain(429)
  })
})
