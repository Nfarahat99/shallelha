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
          className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          ابدأ اللعبة {playerCount > 0 && `(${playerCount} لاعب)`}
        </button>
      )}
      {status === 'playing' && (
        <button
          onClick={onEnd}
          className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          إنهاء اللعبة
        </button>
      )}
      {status === 'ended' && (
        <div className="flex-1 rounded-xl bg-gray-100 px-6 py-3 text-center font-semibold text-gray-500">
          انتهت اللعبة
        </div>
      )}
    </div>
  )
}
