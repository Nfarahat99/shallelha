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
})
