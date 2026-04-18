'use client'

import { LazyMotion, domAnimation } from 'motion/react'

interface HostGameScreenProps {
  roomCode: string
  children: React.ReactNode
}

export function HostGameScreen({ roomCode, children }: HostGameScreenProps) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 flex flex-col">
      {/* Top bar with room code */}
      <div className="h-12 bg-black/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <span className="text-xs text-white/40 font-medium tracking-wide">كود الغرفة</span>
        <span dir="ltr" className="text-sm text-brand-300 font-mono tracking-[0.3em] font-bold">
          {roomCode}
        </span>
      </div>

      {/* Content area wrapped in LazyMotion */}
      <LazyMotion features={domAnimation}>
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </LazyMotion>
    </div>
  )
}
