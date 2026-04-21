import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

function getMondayUTC(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon ... 6=Sat
  const daysToMonday = (dayOfWeek + 6) % 7
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysToMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

interface LeaderboardRow {
  rank: bigint
  userId: string
  displayName: string | null
  avatarEmoji: string | null
  avatarConfig: unknown
  wins: bigint
  gamesPlayed: bigint
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const period = searchParams.get('period') ?? 'alltime'
  const category = searchParams.get('category') ?? null

  // Input validation — reject unexpected period values
  if (period !== 'alltime' && period !== 'weekly') {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  // Sanitize category: cuid chars only (alphanumeric + hyphen/underscore), max 40 chars
  const safeCategory = category?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) ?? null

  try {
    // Build conditional SQL clauses using Prisma.sql tagged templates
    // This guarantees parameterized queries — NO string concatenation.
    const dateFilter: Prisma.Sql = period === 'weekly'
      ? Prisma.sql`AND pgr."createdAt" >= ${getMondayUTC()}`
      : Prisma.empty

    const categoryFilter: Prisma.Sql = safeCategory
      ? Prisma.sql`AND gs."categoryId" = ${safeCategory}`
      : Prisma.empty

    const rows = await prisma.$queryRaw<LeaderboardRow[]>`
      SELECT
        ROW_NUMBER() OVER (
          ORDER BY COUNT(*) FILTER (WHERE pgr."isWinner" = true) DESC,
                   COUNT(*) DESC
        ) AS rank,
        u."id"           AS "userId",
        u."displayName"  AS "displayName",
        u."avatarEmoji"  AS "avatarEmoji",
        u."avatarConfig" AS "avatarConfig",
        COUNT(*) FILTER (WHERE pgr."isWinner" = true) AS wins,
        COUNT(*)                                       AS "gamesPlayed"
      FROM "PlayerGameResult" pgr
      JOIN "User"        u  ON u."id"  = pgr."userId"
      JOIN "GameSession" gs ON gs."id" = pgr."gameSessionId"
      WHERE pgr."userId" IS NOT NULL
        ${dateFilter}
        ${categoryFilter}
      GROUP BY u."id", u."displayName", u."avatarEmoji", u."avatarConfig"
      HAVING COUNT(*) > 0
      ORDER BY wins DESC, "gamesPlayed" DESC
      LIMIT 50
    `

    // bigint fields (rank, wins, gamesPlayed) returned by $queryRaw must be converted
    // to Number before JSON serialisation (JSON.stringify does not support bigint).
    const result = rows.map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      displayName: row.displayName,
      avatarEmoji: row.avatarEmoji,
      avatarConfig: row.avatarConfig,
      wins: Number(row.wins),
      gamesPlayed: Number(row.gamesPlayed),
      winRate:
        Number(row.gamesPlayed) > 0
          ? Math.round((Number(row.wins) / Number(row.gamesPlayed)) * 1000) / 10
          : 0,
    }))

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err) {
    console.error('[leaderboard] query failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
