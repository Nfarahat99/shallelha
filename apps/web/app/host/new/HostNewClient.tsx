'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'

interface HostNewClientProps {
  userId: string
  packId?: string
}

interface PackInfo {
  id: string
  name: string
  status: string
}

async function fetchPackInfo(packId: string): Promise<PackInfo | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return null
  try {
    const res = await fetch(`${backendUrl}/packs/${encodeURIComponent(packId)}`)
    if (!res.ok) return null
    return res.json() as Promise<PackInfo>
  } catch {
    return null
  }
}

// Client Component: connect socket → room:create → redirect to /host/[roomCode]
export function HostNewClient({ userId, packId }: HostNewClientProps) {
  const router = useRouter()
  const [packInfo, setPackInfo] = useState<PackInfo | null>(null)
  const [packError, setPackError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Fetch pack name to show in the UI if packId was provided
  useEffect(() => {
    if (!packId) return
    fetchPackInfo(packId).then((info) => {
      if (!info) {
        setPackError('تعذر تحميل معلومات الباقة')
      } else if (info.status !== 'APPROVED') {
        setPackError('هذه الباقة غير متاحة')
      } else {
        setPackInfo(info)
      }
    })
  }, [packId])

  function handleCreate() {
    if (creating) return
    setCreating(true)

    const socket = getSocket()
    socket.auth = { userId }
    socket.connect()

    socket.once('room:created', ({ roomCode }: { roomCode: string }) => {
      router.replace(`/host/${roomCode}`)
    })

    socket.once('room:error', ({ message }: { message: string }) => {
      console.error('[Host] Room creation failed:', message)
      setCreating(false)
      router.replace('/host')
    })

    // Pass packId in payload when present (server validates APPROVED status)
    if (packId && packInfo) {
      socket.emit('room:create', { packId })
    } else {
      socket.emit('room:create')
    }

    return () => {
      socket.off('room:created')
      socket.off('room:error')
    }
  }

  // Auto-create when no packId (original flow: immediate creation)
  useEffect(() => {
    if (packId) return // pack flow: show confirmation UI first
    handleCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // When packId provided but pack loaded — auto-proceed
  useEffect(() => {
    if (!packId) return
    if (packError) return
    if (!packInfo) return // still loading
    handleCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packInfo, packError])

  // Show pack error state
  if (packError) {
    return (
      <main
        className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 px-4"
        dir="rtl"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-500/20 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-white font-bold text-lg">{packError}</p>
          <button
            type="button"
            onClick={() => router.replace('/packs')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 text-sm transition-all duration-150 min-h-[44px]"
          >
            العودة إلى الباقات
          </button>
        </div>
      </main>
    )
  }

  // Loading / creating state (default + with pack)
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900">
      <div className="text-center space-y-6">
        <div className="relative flex items-center justify-center mx-auto w-16 h-16" aria-hidden="true">
          <span className="block w-16 h-16 rounded-full border-4 border-brand-900" />
          <span className="absolute block w-16 h-16 rounded-full border-4 border-transparent border-t-brand-500 motion-safe:animate-spin" />
        </div>
        <p className="text-3xl font-black tracking-tight text-white select-none">شعللها</p>
        {packInfo ? (
          <div className="space-y-1">
            <p className="text-sm text-white/50 font-medium select-none">جارٍ إنشاء الغرفة…</p>
            <p className="text-xs text-brand-400 font-semibold select-none">
              باقة محددة: {packInfo.name}
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/50 font-medium select-none">جارٍ إنشاء الغرفة…</p>
        )}
      </div>
    </main>
  )
}
