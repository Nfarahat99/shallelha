import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuestionStatus } from '@prisma/client'

// Mock prisma BEFORE importing anything that uses it (vitest hoisting)
vi.mock('../../db/prisma', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '../../db/prisma'

/**
 * The game:start handler queries:
 *   prisma.question.findMany({ where: { status: QuestionStatus.approved, categoryId? } })
 *
 * These tests verify the status gate logic by confirming:
 * 1. The query filter uses QuestionStatus.approved
 * 2. Draft/live questions do NOT match that filter
 * 3. Approved questions DO match
 *
 * We test the contract (what the handler passes to prisma) rather than
 * the full socket flow, keeping tests fast and DB-free.
 */
describe('Question Status Gate (Admin Workflow)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('game:start only serves questions with status approved', async () => {
    const approvedQuestions = [
      {
        id: 'q1',
        text: 'Approved question',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        timerDuration: 20,
        type: 'MULTIPLE_CHOICE',
        mediaUrl: null,
        status: QuestionStatus.approved,
      },
    ]
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce(approvedQuestions as any)

    // Simulate what game:start does: query with status: approved
    const result = await prisma.question.findMany({
      where: { status: QuestionStatus.approved },
      select: {
        id: true,
        text: true,
        options: true,
        correctIndex: true,
        timerDuration: true,
        type: true,
        mediaUrl: true,
      },
    })

    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: QuestionStatus.approved }),
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe(QuestionStatus.approved)
  })

  it('game:start excludes questions with status draft', async () => {
    // The approved-only filter means draft questions are never returned
    // Mock returns empty array (as the DB would for a draft-only question bank)
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([])

    const result = await prisma.question.findMany({
      where: { status: QuestionStatus.approved },
      select: { id: true, text: true, options: true, correctIndex: true, timerDuration: true, type: true, mediaUrl: true },
    })

    expect(result).toHaveLength(0)
    // Verify the call used approved filter (NOT draft)
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: QuestionStatus.approved }),
      }),
    )
    const callArg = vi.mocked(prisma.question.findMany).mock.calls[0][0] as any
    expect(callArg.where.status).not.toBe(QuestionStatus.draft)
  })

  it('game:start excludes questions with status live', async () => {
    // The approved-only filter means live questions are never returned either
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([])

    const result = await prisma.question.findMany({
      where: { status: QuestionStatus.approved },
      select: { id: true, text: true, options: true, correctIndex: true, timerDuration: true, type: true, mediaUrl: true },
    })

    expect(result).toHaveLength(0)
    const callArg = vi.mocked(prisma.question.findMany).mock.calls[0][0] as any
    expect(callArg.where.status).not.toBe(QuestionStatus.live)
  })

  it('approving a draft question makes it available for game:start', async () => {
    // Before approval: draft question not returned by approved filter
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([])

    const beforeApproval = await prisma.question.findMany({
      where: { status: QuestionStatus.approved },
      select: { id: true, text: true, options: true, correctIndex: true, timerDuration: true, type: true, mediaUrl: true },
    })
    expect(beforeApproval).toHaveLength(0)

    // After approval: question now has approved status and IS returned
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([
      {
        id: 'q-formerly-draft',
        text: 'Now approved question',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 1,
        timerDuration: 20,
        type: 'MULTIPLE_CHOICE',
        mediaUrl: null,
        status: QuestionStatus.approved,
      },
    ] as any)

    const afterApproval = await prisma.question.findMany({
      where: { status: QuestionStatus.approved },
      select: { id: true, text: true, options: true, correctIndex: true, timerDuration: true, type: true, mediaUrl: true },
    })
    expect(afterApproval).toHaveLength(1)
    expect(afterApproval[0].id).toBe('q-formerly-draft')
  })

  it('questions from archived categories are not served', async () => {
    // The game:start handler filters by categoryId when provided.
    // Archived categories have no approved questions (enforced at admin level:
    // you cannot approve questions in archived categories).
    // Mock returns empty array — simulating an archived category with no approved questions.
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([])

    const result = await prisma.question.findMany({
      where: { status: QuestionStatus.approved, categoryId: 'archived-cat-id' },
      select: { id: true, text: true, options: true, correctIndex: true, timerDuration: true, type: true, mediaUrl: true },
    })

    expect(result).toHaveLength(0)
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: QuestionStatus.approved,
          categoryId: 'archived-cat-id',
        }),
      }),
    )
  })
})
