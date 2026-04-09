import { Router } from 'express'
import { prisma } from '../db/prisma'
import { redis } from '../redis/client'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const checks: Record<string, string> = { status: 'ok' }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.postgres = 'ok'
  } catch {
    checks.postgres = 'error'
  }

  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const allOk = Object.values(checks).every((v) => v !== 'error')
  res.status(allOk ? 200 : 503).json(checks)
})
