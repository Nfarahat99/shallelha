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

interface GameMix {
  trivia: number
  drawing: number
  bluffing: number
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

// Stepper control for +/- adjusting a count
function Stepper({
  label,
  emoji,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  emoji: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        <span className="text-white font-semibold text-sm truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={`تقليل ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg transition-all duration-150 flex items-center justify-center select-none"
        >
          −
        </button>
        <span className="w-8 text-center text-white font-black text-lg tabular-nums select-none">
          {value}
        </span>
        <button
          type="button"
          aria-label={`زيادة ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg transition-all duration-150 flex items-center justify-center select-none"
        >
          +
        </button>
      </div>
    </div>
  )
}

// Client Component: connect socket → room:create → redirect to /host/[roomCode]
export function HostNewClient({ userId, packId }: HostNewClientProps) {
  const router = useRouter()
  const [packInfo, setPackInfo] = useState<PackInfo | null>(null)
  const [packError, setPackError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Game mix state (only used when no packId)
  const [trivia, setTrivia] = useState(5)
  const [drawing, setDrawing] = useState(2)
  const [bluffing, setBluffing] = useState(1)
  const total = trivia + drawing + bluffing

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

  function handleCreate(gameMix?: GameMix) {
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

    // Pass packId when present, or gameMix for mixed mode
    if (packId && packInfo) {
      socket.emit('room:create', { packId })
    } else if (gameMix) {
      socket.emit('room:create', { gameMix })
    } else {
      socket.emit('room:create')
    }

    return () => {
      socket.off('room:created')
      socket.off('room:error')
    }
  }

  // When packId provided and pack loaded — auto-proceed (existing pack flow)
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

  // Pack flow: show spinner while loading / creating
  if (packId) {
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
            <p className="text-sm text-white/50 font-medium select-none">جارٍ تحميل الباقة…</p>
          )}
        </div>
      </main>
    )
  }

  // No packId — show game type mix selector
  if (creating) {
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

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 px-4 py-8"
      dir="rtl"
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-3xl font-black tracking-tight text-white select-none">شعللها</p>
          <p className="text-sm text-white/50 font-medium select-none">اختر نوع الأسئلة</p>
        </div>

        {/* Mix steppers */}
        <div className="space-y-3">
          <Stepper
            label="أسئلة ثقافية"
            emoji="🧠"
            value={trivia}
            min={0}
            max={20}
            onChange={setTrivia}
          />
          <Stepper
            label="ارسم وخمّن"
            emoji="🎨"
            value={drawing}
            min={0}
            max={10}
            onChange={setDrawing}
          />
          <Stepper
            label="كاذب بيننا"
            emoji="🃏"
            value={bluffing}
            min={0}
            max={10}
            onChange={setBluffing}
          />
        </div>

        {/* Total count indicator */}
        <div className="flex items-center justify-between px-1">
          <span className="text-white/40 text-sm font-medium select-none">إجمالي الأسئلة</span>
          <span
            className={`text-sm font-black tabular-nums select-none ${
              total === 0 ? 'text-red-400' : total > 20 ? 'text-yellow-400' : 'text-brand-400'
            }`}
          >
            {total} / 20
          </span>
        </div>

        {/* Create button */}
        <button
          type="button"
          disabled={total === 0 || creating}
          onClick={() => handleCreate({ trivia, drawing, bluffing })}
          className="w-full min-h-[56px] rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg transition-all duration-150 select-none shadow-lg shadow-brand-900/40"
        >
          إنشاء الغرفة
        </button>
      </div>
    </main>
  )
}
