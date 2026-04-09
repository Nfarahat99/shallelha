import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { HostNewClient } from './HostNewClient'

// Server Component: get session server-side, pass userId to client
export default async function HostNewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  return <HostNewClient userId={session.user.id} />
}
