import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileClient } from './ProfileClient'

export const metadata = { title: 'الملف الشخصي — شعللها' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/api/auth/signin')

  const user = await prisma.user.upsert({
    where: { id: session.user.id },
    create: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      displayName: session.user.name ?? null,
    },
    update: {},
    include: {
      gameResults: {
        include: { gameSession: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  return <ProfileClient user={user} />
}
