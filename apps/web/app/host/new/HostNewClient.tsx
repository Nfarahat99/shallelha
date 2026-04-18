'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'

interface HostNewClientProps {
  userId: string
}

// Client Component: connect socket → room:create → redirect to /host/[roomCode]
export function HostNewClient({ userId }: HostNewClientProps) {
  const router = useRouter()

  useEffect(() => {
    const socket = getSocket()
    socket.auth = { userId }
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
  }, [userId, router])

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
      <div className="text-center space-y-6">
        <div className="relative flex items-center justify-center mx-auto w-16 h-16" aria-hidden="true">
          <span className="block w-16 h-16 rounded-full border-4 border-brand-900" />
          <span className="absolute block w-16 h-16 rounded-full border-4 border-transparent border-t-brand-500 motion-safe:animate-spin" />
        </div>
        <p className="text-3xl font-black tracking-tight text-white select-none">شعللها</p>
        <p className="text-sm text-white/50 font-medium select-none">جارٍ إنشاء الغرفة…</p>
      </div>
    </main>
  )
}
