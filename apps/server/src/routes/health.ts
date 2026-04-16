import { Router } from 'express'
import { prisma } from '../db/prisma'
import { redis } from '../redis/client'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const checks: Record<string, string | number> = { status: 'ok' }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.postgres = 'ok'
    checks.approvedQuestions = await prisma.question.count({ where: { status: 'approved' } })
    if (typeof checks.approvedQuestions === 'number' && checks.approvedQuestions < 200) {
      checks.questionThreshold = 'below_minimum'
    }
  } catch {
    checks.postgres = 'error'
  }

  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const allOk = ['postgres', 'redis'].every((k) => checks[k] !== 'error') && checks.questionThreshold !== 'below_minimum'
  res.status(allOk ? 200 : 503).json(checks)
})
