/**
 * Integration tests for Phase 10 Pack CRUD API.
 *
 * Strategy:
 * - Do NOT mock prisma — let routes write real records to verify DB state
 * - All test data uses the prefix '[TEST_PACK]' on pack names for safe cleanup
 * - afterEach cleans up via prisma.packQuestion.deleteMany then prisma.pack.deleteMany
 *
 * Prerequisites:
 * - DATABASE_URL must point to a test/dev database
 * - Run with: cd apps/server && npx vitest run src/routes/__tests__/packs.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import { packsRouter } from '../packs'
import { prisma } from '../../db/prisma'

const TEST_USER_ID = 'test-user-packs'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/packs', packsRouter)
  return app
}

beforeAll(async () => {
  // Ensure test user stub exists (upsert by id — User has no unique constraint on id other than PK)
  const existing = await prisma.user.findUnique({ where: { id: TEST_USER_ID } })
  if (!existing) {
    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        name: '[TEST_PACK] Test User',
        email: 'test-pack-user@test.local',
      },
    })
  }
})

afterEach(async () => {
  // Clean up in dependency order: questions first, then packs
  const testPacks = await prisma.pack.findMany({
    where: { name: { startsWith: '[TEST_PACK]' } },
    select: { id: true },
  })
  const packIds = testPacks.map((p) => p.id)
  if (packIds.length > 0) {
    await prisma.packQuestion.deleteMany({ where: { packId: { in: packIds } } })
  }
  await prisma.pack.deleteMany({ where: { name: { startsWith: '[TEST_PACK]' } } })
})

afterAll(async () => {
  // Clean up test user
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } })
  await prisma.$disconnect()
})

describe('Pack CRUD API — Integration Tests', () => {
  it('POST /packs creates pack with status DRAFT', async () => {
    const res = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] ثقافة عامة',
        description: 'باقة اختبار',
        category: 'ثقافة عامة',
        language: 'ar',
        createdBy: TEST_USER_ID,
        questions: [
          {
            text: 'ما هي عاصمة المملكة العربية السعودية؟',
            type: 'MULTIPLE_CHOICE',
            options: ['الرياض', 'جدة', 'مكة', 'المدينة'],
            correctIndex: 0,
            order: 0,
          },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: '[TEST_PACK] ثقافة عامة',
      status: 'DRAFT',
      createdBy: TEST_USER_ID,
    })
    expect(res.body.id).toBeTruthy()
    expect(res.body.questions).toHaveLength(1)

    // Verify DB state
    const dbPack = await prisma.pack.findUnique({ where: { id: res.body.id } })
    expect(dbPack?.status).toBe('DRAFT')
  })

  it('GET /packs only returns APPROVED packs', async () => {
    // Create a DRAFT pack (should not appear in GET /packs)
    const draftRes = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] مسودة',
        category: 'رياضة',
        createdBy: TEST_USER_ID,
      })
    expect(draftRes.status).toBe(201)

    // Manually approve a second pack
    const approvedRes = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] معتمدة',
        category: 'رياضة',
        createdBy: TEST_USER_ID,
      })
    expect(approvedRes.status).toBe(201)

    await prisma.pack.update({
      where: { id: approvedRes.body.id },
      data: { status: 'APPROVED' },
    })

    const listRes = await request(buildApp()).get('/packs')
    expect(listRes.status).toBe(200)
    expect(Array.isArray(listRes.body)).toBe(true)

    // None of the returned packs should be DRAFT
    for (const pack of listRes.body) {
      expect(pack.status).toBe('APPROVED')
    }

    // The approved test pack must be in the list
    const names = listRes.body.map((p: any) => p.name)
    expect(names).toContain('[TEST_PACK] معتمدة')
    expect(names).not.toContain('[TEST_PACK] مسودة')
  })

  it('GET /packs/mine returns all statuses for owner', async () => {
    // Create a DRAFT pack
    const draftRes = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] mine-draft',
        category: 'ترفيه',
        createdBy: TEST_USER_ID,
      })
    expect(draftRes.status).toBe(201)

    // Approve a second pack directly via Prisma
    const approvedPack = await prisma.pack.create({
      data: {
        name: '[TEST_PACK] mine-approved',
        category: 'ترفيه',
        createdBy: TEST_USER_ID,
        status: 'APPROVED',
      },
    })

    const mineRes = await request(buildApp()).get(`/packs/mine?userId=${TEST_USER_ID}`)
    expect(mineRes.status).toBe(200)
    expect(Array.isArray(mineRes.body)).toBe(true)

    const names = mineRes.body.map((p: any) => p.name)
    expect(names).toContain('[TEST_PACK] mine-draft')
    expect(names).toContain('[TEST_PACK] mine-approved')

    // Both statuses should appear
    const statuses = mineRes.body.map((p: any) => p.status)
    expect(statuses).toContain('DRAFT')
    expect(statuses).toContain('APPROVED')
  })

  it('PATCH /packs/:id/status transitions DRAFT → PENDING', async () => {
    const createRes = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] status-transition',
        category: 'موسيقى',
        createdBy: TEST_USER_ID,
      })
    expect(createRes.status).toBe(201)
    const packId = createRes.body.id

    const patchRes = await request(buildApp())
      .patch(`/packs/${packId}/status`)
      .send({ status: 'PENDING' })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.status).toBe('PENDING')

    // Verify DB
    const dbPack = await prisma.pack.findUnique({ where: { id: packId } })
    expect(dbPack?.status).toBe('PENDING')
  })

  it('DELETE /packs/:id fails (400) if status is PENDING', async () => {
    const pack = await prisma.pack.create({
      data: {
        name: '[TEST_PACK] pending-no-delete',
        category: 'تاريخ',
        createdBy: TEST_USER_ID,
        status: 'PENDING',
      },
    })

    const deleteRes = await request(buildApp()).delete(`/packs/${pack.id}`)
    expect(deleteRes.status).toBe(400)
    expect(deleteRes.body.error).toBe('لا يمكن حذف الباقة بعد تقديمها')

    // Pack still exists
    const stillExists = await prisma.pack.findUnique({ where: { id: pack.id } })
    expect(stillExists).not.toBeNull()
  })

  it('DELETE /packs/:id succeeds (204) if status is DRAFT', async () => {
    const createRes = await request(buildApp())
      .post('/packs')
      .send({
        name: '[TEST_PACK] draft-delete',
        category: 'علوم',
        createdBy: TEST_USER_ID,
      })
    expect(createRes.status).toBe(201)
    const packId = createRes.body.id

    const deleteRes = await request(buildApp()).delete(`/packs/${packId}`)
    expect(deleteRes.status).toBe(204)

    // Pack no longer exists
    const gone = await prisma.pack.findUnique({ where: { id: packId } })
    expect(gone).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Game engine data layer tests (Plan 10-08)
  // ---------------------------------------------------------------------------

  it('GET /packs/:id returns pack with questions ordered by order field', async () => {
    // Create pack directly via prisma with 3 questions in non-sequential order
    const pack = await prisma.pack.create({
      data: {
        name: '[TEST_PACK] Game Engine Test',
        category: 'ثقافة عامة',
        language: 'ar',
        createdBy: TEST_USER_ID,
        status: 'APPROVED',
        questions: {
          create: [
            {
              text: 'السؤال الثالث',
              type: 'MULTIPLE_CHOICE',
              options: ['أ', 'ب', 'ج', 'د'],
              correctIndex: 2,
              order: 2,
            },
            {
              text: 'السؤال الأول',
              type: 'MULTIPLE_CHOICE',
              options: ['أ', 'ب', 'ج', 'د'],
              correctIndex: 0,
              order: 0,
            },
            {
              text: 'السؤال الثاني',
              type: 'MULTIPLE_CHOICE',
              options: ['أ', 'ب', 'ج', 'د'],
              correctIndex: 1,
              order: 1,
            },
          ],
        },
      },
    })

    const res = await request(buildApp()).get(`/packs/${pack.id}`)
    expect(res.status).toBe(200)

    // Verify questions array has 3 items
    expect(res.body.questions).toHaveLength(3)

    // Verify ordered by `order` field ascending
    const questions = res.body.questions
    expect(questions[0].order).toBe(0)
    expect(questions[1].order).toBe(1)
    expect(questions[2].order).toBe(2)

    // Verify each question has required fields for game engine
    for (const q of questions) {
      expect(q.id).toBeTruthy()
      expect(q.text).toBeTruthy()
      expect(q.type).toBe('MULTIPLE_CHOICE')
      expect(Array.isArray(q.options)).toBe(true)
      expect(q.options).toHaveLength(4)
      expect(typeof q.correctIndex === 'number' || q.correctIndex === null).toBe(true)
    }
  })

  it('Pack playCount increments correctly via prisma update', async () => {
    // Create an approved pack with initial playCount = 0
    const pack = await prisma.pack.create({
      data: {
        name: '[TEST_PACK] PlayCount Test',
        category: 'رياضة',
        createdBy: TEST_USER_ID,
        status: 'APPROVED',
        playCount: 0,
      },
    })

    expect(pack.playCount).toBe(0)

    // Simulate what game.ts does after game ends — fire-and-forget increment
    await prisma.pack.update({
      where: { id: pack.id },
      data: { playCount: { increment: 1 } },
    })

    const updated = await prisma.pack.findUnique({ where: { id: pack.id } })
    expect(updated?.playCount).toBe(1)

    // Simulate a second game completing
    await prisma.pack.update({
      where: { id: pack.id },
      data: { playCount: { increment: 1 } },
    })

    const updatedAgain = await prisma.pack.findUnique({ where: { id: pack.id } })
    expect(updatedAgain?.playCount).toBe(2)
  })
})
