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
