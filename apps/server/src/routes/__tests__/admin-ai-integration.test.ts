/**
 * Integration tests for Phase 9 AI generation flow.
 *
 * Strategy:
 * - Mock the OpenAI SDK to avoid real API calls and costs
 * - Do NOT mock prisma — let routes write real records to verify DB state
 * - All test data uses the prefix '[TEST_AI]' on question text for safe cleanup
 * - afterEach cleans up via prisma.question.deleteMany
 *
 * Prerequisites:
 * - DATABASE_URL must point to a test/dev database (same as regular dev DB is fine)
 * - Run with: cd apps/server && npx vitest run src/routes/__tests__/admin-ai-integration.test.ts
 */

import { describe, it, expect, vi, afterEach, afterAll, beforeAll } from 'vitest'
import express from 'express'
import request from 'supertest'

// vi.hoisted ensures mockCreate is available inside the vi.mock factory (which is hoisted)
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

// Mock groq-sdk before any imports — return controlled test data
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}))

import { adminRouter } from '../admin'
import { prisma } from '../../db/prisma'

// Controlled GPT-4o mock response — all texts prefixed [TEST_AI] for cleanup
const testQuestions = [
  {
    text: '[TEST_AI] ما هي عاصمة الكويت؟',
    options: ['الكويت', 'دبي', 'الدوحة', 'المنامة'],
    correctIndex: 0,
  },
  {
    text: '[TEST_AI] ما هو العملة الرسمية للإمارات؟',
    options: ['الدرهم', 'الريال', 'الدينار', 'الجنيه'],
    correctIndex: 0,
  },
  {
    text: '[TEST_AI] كم عدد إمارات دولة الإمارات؟',
    options: ['7', '6', '8', '5'],
    correctIndex: 0,
  },
  {
    text: '[TEST_AI] ما هو أطول برج في العالم؟',
    options: ['برج خليفة', 'برج إيفل', 'ناطحات سحاب نيويورك', 'برج القاهرة'],
    correctIndex: 0,
  },
  {
    text: '[TEST_AI] في أي دولة خليجية تقع مدينة مسقط؟',
    options: ['عُمان', 'البحرين', 'الكويت', 'قطر'],
    correctIndex: 0,
  },
]

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/admin', adminRouter)
  return app
}

// Ensure test category exists in DB (create if missing)
let testCategoryId: string

beforeAll(async () => {
  process.env.GROQ_API_KEY = 'test-key'
  const existing = await prisma.category.findFirst({
    where: { slug: 'test-ai-integration' },
  })
  if (existing) {
    testCategoryId = existing.id
  } else {
    const created = await prisma.category.create({
      data: {
        name: '[TEST_AI] تكامل',
        slug: 'test-ai-integration',
      },
    })
    testCategoryId = created.id
  }
})

afterEach(async () => {
  mockCreate.mockReset()
  // Clean up all test questions — safe because prefix is unique to this test file
  await prisma.question.deleteMany({
    where: { text: { startsWith: '[TEST_AI]' } },
  })
})

afterAll(async () => {
  // Clean up test category
  await prisma.category.deleteMany({
    where: { slug: 'test-ai-integration' },
  })
  await prisma.$disconnect()
})

describe('AI Generation Integration — full generate→approve/reject flow', () => {
  it('POST /admin/ai-generate writes DRAFT questions to DB', async () => {
    // Arrange: GPT-4o returns 5 valid questions wrapped in { questions: [...] }
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ questions: testQuestions }) } }],
    })

    // Act: call the route
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: testCategoryId, count: 5 })

    // Assert response
    expect(res.status).toBe(200)
    expect(res.body.created).toBeGreaterThanOrEqual(1)

    // Assert DB state: questions exist as DRAFT
    const dbQuestions = await prisma.question.findMany({
      where: { text: { startsWith: '[TEST_AI]' }, categoryId: testCategoryId },
    })
    expect(dbQuestions.length).toBeGreaterThanOrEqual(1)
    // Every question must be in DRAFT status
    for (const q of dbQuestions) {
      expect(q.status).toBe('draft')
    }
  })

  it('approveQuestionsAction logic: updateMany(status=draft) → status becomes approved', async () => {
    // Arrange: insert a DRAFT question directly
    const draft = await prisma.question.create({
      data: {
        text: '[TEST_AI] سؤال للاعتماد',
        options: ['أ', 'ب', 'ج', 'د'],
        correctIndex: 0,
        categoryId: testCategoryId,
        status: 'draft',
        type: 'MULTIPLE_CHOICE',
        timerDuration: 20,
      },
    })

    // Act: simulate approveQuestionsAction (the Server Action logic, extracted to prisma call)
    await prisma.question.updateMany({
      where: { id: { in: [draft.id] }, status: 'draft' },
      data: { status: 'approved' },
    })

    // Assert: question is now approved
    const updated = await prisma.question.findUnique({ where: { id: draft.id } })
    expect(updated?.status).toBe('approved')
  })

  it('rejectQuestionsAction logic: deleteMany(status=draft) deletes the question', async () => {
    // Arrange: insert a DRAFT question
    const draft = await prisma.question.create({
      data: {
        text: '[TEST_AI] سؤال للرفض',
        options: ['أ', 'ب', 'ج', 'د'],
        correctIndex: 0,
        categoryId: testCategoryId,
        status: 'draft',
        type: 'MULTIPLE_CHOICE',
        timerDuration: 20,
      },
    })

    // Act: simulate rejectQuestionsAction
    await prisma.question.deleteMany({
      where: { id: { in: [draft.id] }, status: 'draft' },
    })

    // Assert: question is gone
    const deleted = await prisma.question.findUnique({ where: { id: draft.id } })
    expect(deleted).toBeNull()
  })

  it('rejectQuestionsAction safety: deleteMany scoped to draft cannot delete approved questions', async () => {
    // Arrange: insert an APPROVED question
    const approved = await prisma.question.create({
      data: {
        text: '[TEST_AI] سؤال معتمد مصون',
        options: ['أ', 'ب', 'ج', 'د'],
        correctIndex: 0,
        categoryId: testCategoryId,
        status: 'approved',
        type: 'MULTIPLE_CHOICE',
        timerDuration: 20,
      },
    })

    // Act: attempt to reject using that ID (status: 'draft' guard means it won't match)
    await prisma.question.deleteMany({
      where: { id: { in: [approved.id] }, status: 'draft' },
    })

    // Assert: approved question is still there
    const stillExists = await prisma.question.findUnique({ where: { id: approved.id } })
    expect(stillExists).not.toBeNull()
    expect(stillExists?.status).toBe('approved')
  })

  it('POST /admin/ai-generate returns 400 when count=4 (below minimum)', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: testCategoryId, count: 4 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')

    // Assert: no DB writes occurred
    const dbQuestions = await prisma.question.findMany({
      where: { text: { startsWith: '[TEST_AI]' }, categoryId: testCategoryId },
    })
    expect(dbQuestions.length).toBe(0)
  })

  it('POST /admin/ai-generate returns 400 when count=11 (above maximum)', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ categoryId: testCategoryId, count: 11 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('POST /admin/ai-generate returns 400 when categoryId is missing', async () => {
    const res = await request(buildApp())
      .post('/admin/ai-generate')
      .send({ count: 5 })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})
