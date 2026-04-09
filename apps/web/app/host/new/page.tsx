'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import { useSession } from 'next-auth/react'

// Transitional page: connect socket → room:create → redirect to /host/[roomCode]
export default function HostNewPage() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    const socket = getSocket()

    // Pass userId via auth so server middleware can identify the host
    socket.auth = { userId: session.user.id }
    socket.connect()

    socket.once('room:created', ({ roomCode }: { roomCode: string }) => {
      router.replace(`/host/${roomCode}`)
    })

    socket.once('room:error', ({ message }: { message: string }) => {
      console.error('[Host] Room creation failed:', message)
      router.replace('/host')
    })

    socket.emit('room:create')

    return () => {
      socket.off('room:created')
      socket.off('room:error')
    }
  }, [session, router])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-gray-500">جارٍ إنشاء الغرفة…</p>
      </div>
    </main>
  )
}
