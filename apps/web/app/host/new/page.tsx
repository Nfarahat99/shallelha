import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { HostNewClient } from './HostNewClient'

interface PageProps {
  searchParams: Promise<{ packId?: string }>
}

// Server Component: get session server-side, pass userId + optional packId to client
export default async function HostNewPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const { packId } = await searchParams

  return <HostNewClient userId={session.user.id} packId={packId} />
}
