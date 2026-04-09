import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { HostDashboard } from './HostDashboard'

interface Props {
  params: { roomCode: string }
}

export default async function HostRoomPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <HostDashboard
      roomCode={params.roomCode.toUpperCase()}
      userId={session.user.id}
    />
  )
}
