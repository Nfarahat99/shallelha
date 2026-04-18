'use server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { displayName?: string; avatarEmoji?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const updateData: Record<string, string> = {}
  if (data.displayName !== undefined) {
    const trimmed = data.displayName.trim().slice(0, 30)
    if (trimmed.length > 0) updateData.displayName = trimmed
  }
  if (data.avatarEmoji !== undefined) {
    updateData.avatarEmoji = data.avatarEmoji.slice(0, 10)
  }
  if (Object.keys(updateData).length === 0) return

  await prisma.user.update({ where: { id: session.user.id }, data: updateData })
  revalidatePath('/profile')
}
