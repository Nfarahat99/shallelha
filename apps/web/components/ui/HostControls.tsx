'use client'

interface HostControlsProps {
  onStart: () => void
  onEnd: () => void
  playerCount: number
  status: 'lobby' | 'playing' | 'ended'
}

export function HostControls({ onStart, onEnd, playerCount, status }: HostControlsProps) {
  return (
    <div className="flex gap-3">
      {status === 'lobby' && (
        <button
          onClick={onStart}
          disabled={playerCount === 0}
          className="flex-1 min-h-[44px] rounded-2xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shadow-elevated"
        >
          ابدأ اللعبة {playerCount > 0 && `(${playerCount} لاعب)`}
        </button>
      )}
      {status === 'playing' && (
        <button
          onClick={onEnd}
          className="flex-1 min-h-[44px] rounded-2xl bg-red-600/90 px-6 py-3 font-semibold text-white hover:bg-red-500 transition-colors duration-150 cursor-pointer"
        >
          إنهاء اللعبة
        </button>
      )}
      {status === 'ended' && (
        <div className="flex-1 min-h-[44px] rounded-2xl bg-white/10 border border-white/10 px-6 py-3 text-center font-semibold text-white/40">
          انتهت اللعبة
        </div>
      )}
    </div>
  )
}
