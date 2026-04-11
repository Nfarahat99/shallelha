import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db/prisma'

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
})

export const adminRouter = Router()

// GET /admin/analytics — question stats with wrong answer rates
adminRouter.get('/analytics', adminLimiter, async (_req, res) => {
  try {
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        text: true,
        status: true,
        type: true,
        timesPlayed: true,
        timesAnsweredWrong: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timesPlayed: 'desc' },
    })

    const stats = questions.map((q) => ({
      ...q,
      wrongRate: q.timesPlayed > 0
        ? Math.round((q.timesAnsweredWrong / q.timesPlayed) * 100) / 100
        : 0,
    }))

    res.json({ questions: stats })
  } catch (err) {
    console.error('[Admin] analytics error:', err)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})
