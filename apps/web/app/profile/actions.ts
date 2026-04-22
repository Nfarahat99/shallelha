'use server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { AvatarConfig } from '@/components/avatar/avatar-parts'

export async function updateProfile(data: {
  displayName?: string
  avatarEmoji?: string
  avatarConfig?: AvatarConfig | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  if (data.displayName !== undefined) {
    const trimmed = data.displayName.trim().slice(0, 30)
    if (trimmed.length > 0) updateData.displayName = trimmed
  }
  if (data.avatarEmoji !== undefined) {
    updateData.avatarEmoji = data.avatarEmoji.slice(0, 10)
  }
  if (data.avatarConfig !== undefined) {
    updateData.avatarConfig = data.avatarConfig
  }
  if (Object.keys(updateData).length === 0) return

  await prisma.user.update({ where: { id: session.user.id }, data: updateData })
  revalidatePath('/profile')
}

export async function claimAnonymousStats(data: {
  gameSessionId: string
  playerName: string
}): Promise<{ claimed: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { claimed: 0, error: 'Unauthorized' }

  // Sanitize inputs
  const sessionId = data.gameSessionId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
  const playerName = data.playerName.trim().slice(0, 50)
  if (!sessionId || !playerName) return { claimed: 0, error: 'Invalid input' }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Find unclaimed results matching this session + player name (case-insensitive)
  const candidates = await prisma.playerGameResult.findMany({
    where: {
      gameSessionId: sessionId,
      userId: null as unknown as undefined,
      playerName: { equals: playerName, mode: 'insensitive' },
      createdAt: { gte: sevenDaysAgo },
    },
  })

  if (candidates.length === 0) return { claimed: 0 }

  // Claim them — optimistic lock: only update rows still with userId=null
  const result = await prisma.playerGameResult.updateMany({
    where: {
      id: { in: candidates.map((r) => r.id) },
      userId: null as unknown as undefined,
    },
    data: { userId: session.user.id },
  })

  if (result.count === 0) return { claimed: 0 }

  // Recalculate aggregate stats from DB to avoid drift
  const statsResult = await prisma.playerGameResult.aggregate({
    where: { userId: session.user.id },
    _count: { id: true },
  })
  const winsResult = await prisma.playerGameResult.count({
    where: { userId: session.user.id, isWinner: true },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totalGamesPlayed: statsResult._count.id,
      winCount: winsResult,
    },
  })

  revalidatePath('/profile')
  return { claimed: result.count }
}
