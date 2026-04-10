'use client'

import { LazyMotion, domAnimation } from 'motion/react'

interface HostGameScreenProps {
  roomCode: string
  children: React.ReactNode
}

export function HostGameScreen({ roomCode, children }: HostGameScreenProps) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-950 flex flex-col">
      {/* Top bar with room code */}
      <div className="h-12 bg-gray-900 flex items-center justify-between px-6 shrink-0">
        <span className="text-xs text-gray-500">كود الغرفة</span>
        <span dir="ltr" className="text-base text-gray-400 font-mono tracking-widest">
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
