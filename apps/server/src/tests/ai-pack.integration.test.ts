import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'

// vi.hoisted ensures mockCreate is available inside the vi.mock factory (hoisted before imports)
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

// Mock groq-sdk BEFORE imports so the lazy singleton never needs a real API key
vi.mock('groq-sdk', () => {
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

import { aiPackRouter } from '../routes/ai-pack'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express()
  app.use(cookieParser())
  app.use(express.json())
  app.use('/ai', aiPackRouter)
  return app
}

const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
  text: `سؤال ${i + 1}`,
  options: ['أ', 'ب', 'ج', 'د'],
  correctIndex: 0,
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

// Each test uses a unique session cookie to get its own rate-limit bucket,
// preventing the module-level limiter from bleeding across tests.
let testCounter = 0
function uniqueSession() {
  return `test-session-${++testCounter}-${Date.now()}`
}

describe('POST /ai/pack-generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Provide API key in env so the route doesn't short-circuit with 503
    process.env.GROQ_API_KEY = 'test-groq-key'
  })

  it('returns 200 with questions array when Groq returns valid response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ questions: mockQuestions }),
          },
        },
      ],
    })

    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: 'أفلام مصرية التسعينات' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('questions')
    expect(Array.isArray(res.body.questions)).toBe(true)
    expect(res.body.questions).toHaveLength(10)
    expect(res.body).toHaveProperty('model', 'llama-3.3-70b-versatile')
  })

  it('returns 400 when prompt is empty string', async () => {
    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when prompt exceeds 200 characters', async () => {
    const longPrompt = 'أ'.repeat(201)
    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: longPrompt })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 503 when Groq client throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Groq network error'))

    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: 'رياضة' })

    expect(res.status).toBe(503)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 503 when Groq returns malformed JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'not valid json {{{',
          },
        },
      ],
    })

    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: 'تاريخ' })

    expect(res.status).toBe(503)
    expect(res.body).toHaveProperty('error')
  })

  it('includes RateLimit-Remaining header in response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ questions: mockQuestions }),
          },
        },
      ],
    })

    const res = await request(buildApp())
      .post('/ai/pack-generate')
      .set('Cookie', `next-auth.session-token=${uniqueSession()}`)
      .send({ prompt: 'طبخ خليجي' })

    // standardHeaders: true → express-rate-limit v7+ sets RateLimit-Remaining (draft-7 spec)
    const hasRateLimit =
      'x-ratelimit-remaining' in res.headers ||
      'ratelimit-remaining' in res.headers

    expect(hasRateLimit).toBe(true)
  })
})
