import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { PackStatus } from '@prisma/client'
import { prisma } from '../db/prisma'

const packsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
})

export const packsRouter = Router()

// Apply rate limiter to all packs routes
packsRouter.use(packsLimiter)

const VALID_STATUSES = new Set<string>(Object.values(PackStatus))

// POST /packs — create a new pack with questions
// Body: { name, description?, category, language?, difficulty?, createdBy, creatorHandle?, questions: [...] }
packsRouter.post('/', async (req, res) => {
  try {
    const { name, description, category, language, difficulty, createdBy, creatorHandle, questions } = req.body as {
      name?: string
      description?: string
      category?: string
      language?: string
      difficulty?: string
      createdBy?: string
      creatorHandle?: string
      questions?: Array<{
        text: string
        type?: string
        options?: string[]
        correctIndex?: number | null
        order?: number
      }>
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      res.status(400).json({ error: 'الاسم مطلوب ويجب أن يكون بين 1 و 100 حرف' })
      return
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'الفئة مطلوبة' })
      return
    }
    if (!createdBy || typeof createdBy !== 'string' || !createdBy.trim()) {
      res.status(400).json({ error: 'معرّف المنشئ مطلوب' })
      return
    }

    const questionsData = Array.isArray(questions) ? questions : []

    const pack = await prisma.pack.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        category: category.trim(),
        language: language?.trim() ?? 'ar',
        difficulty: difficulty?.trim() ?? null,
        createdBy: createdBy.trim(),
        creatorHandle: creatorHandle?.trim() ?? null,
        questions: {
          create: questionsData.map((q, idx) => ({
            text: q.text,
            type: (q.type as any) ?? 'MULTIPLE_CHOICE',
            options: Array.isArray(q.options) ? q.options : [],
            correctIndex: q.correctIndex ?? null,
            order: q.order ?? idx,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { questions: true },
        },
      },
    })

    res.status(201).json(pack)
  } catch (err) {
    console.error('[Packs] POST /packs error:', err)
    res.status(500).json({ error: 'فشل إنشاء الباقة' })
  }
})

// GET /packs/mine?userId={id} — list packs owned by userId (all statuses)
// NOTE: must be defined BEFORE GET /packs/:id to avoid route shadowing
packsRouter.get('/mine', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string }

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      res.status(400).json({ error: 'معرّف المستخدم مطلوب' })
      return
    }

    const packs = await prisma.pack.findMany({
      where: { createdBy: userId.trim() },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(packs)
  } catch (err) {
    console.error('[Packs] GET /packs/mine error:', err)
    res.status(500).json({ error: 'فشل جلب باقاتك' })
  }
})

// GET /packs — list APPROVED packs with optional ?category= and ?language= filters
packsRouter.get('/', async (req, res) => {
  try {
    const { category, language } = req.query as { category?: string; language?: string }

    const packs = await prisma.pack.findMany({
      where: {
        status: PackStatus.APPROVED,
        ...(category ? { category: category.trim() } : {}),
        ...(language ? { language: language.trim() } : {}),
      },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { playCount: 'desc' },
    })

    res.json(packs)
  } catch (err) {
    console.error('[Packs] GET /packs error:', err)
    res.status(500).json({ error: 'فشل جلب الباقات' })
  }
})

// GET /packs/:id — get pack with full questions array
packsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: { select: { questions: true } },
      },
    })

    if (!pack) {
      res.status(404).json({ error: 'الباقة غير موجودة' })
      return
    }

    res.json(pack)
  } catch (err) {
    console.error('[Packs] GET /packs/:id error:', err)
    res.status(500).json({ error: 'فشل جلب الباقة' })
  }
})

// PATCH /packs/:id/status — update pack status (admin: PENDING→APPROVED/REJECTED; host: DRAFT→PENDING)
packsRouter.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: string }

    if (!status || !VALID_STATUSES.has(status)) {
      res.status(400).json({ error: `الحالة غير صالحة. القيم المقبولة: ${[...VALID_STATUSES].join(', ')}` })
      return
    }

    const existing = await prisma.pack.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'الباقة غير موجودة' })
      return
    }

    const updated = await prisma.pack.update({
      where: { id },
      data: { status: status as PackStatus },
    })

    res.json(updated)
  } catch (err) {
    console.error('[Packs] PATCH /packs/:id/status error:', err)
    res.status(500).json({ error: 'فشل تحديث حالة الباقة' })
  }
})

// DELETE /packs/:id — delete own pack (only if status is DRAFT)
packsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.pack.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ error: 'الباقة غير موجودة' })
      return
    }

    if (existing.status !== PackStatus.DRAFT) {
      res.status(400).json({ error: 'لا يمكن حذف الباقة بعد تقديمها' })
      return
    }

    await prisma.pack.delete({ where: { id } })

    res.status(204).send()
  } catch (err) {
    console.error('[Packs] DELETE /packs/:id error:', err)
    res.status(500).json({ error: 'فشل حذف الباقة' })
  }
})
