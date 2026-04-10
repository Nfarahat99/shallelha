'use client'

import { useState } from 'react'

type GamePhase = 'question' | 'reveal' | 'leaderboard' | 'podium'

interface HostInGameControlsProps {
  gamePhase: GamePhase
  onReveal: () => void
  onNext: () => void
  onLeaderboard: () => void
  onEnd: () => void
}

export function HostInGameControls({
  gamePhase,
  onReveal,
  onNext,
  onLeaderboard,
  onEnd,
}: HostInGameControlsProps) {
  const [confirmEnd, setConfirmEnd] = useState(false)

  const handleEnd = () => {
    if (confirmEnd) {
      onEnd()
      setConfirmEnd(false)
    } else {
      setConfirmEnd(true)
    }
  }

  const isQuestion = gamePhase === 'question'
  const isRevealOrLeaderboard = gamePhase === 'reveal' || gamePhase === 'leaderboard'

  return (
    <div className="flex flex-row items-center gap-3 px-6 py-3 bg-gray-900 shrink-0">
      {/* Reveal Answer — active during question phase */}
      <button
        onClick={onReveal}
        disabled={!isQuestion}
        aria-label="اكشف الإجابة"
        className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-colors ${
          isQuestion
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : 'bg-gray-700 opacity-40 cursor-not-allowed'
        }`}
      >
        اكشف الإجابة
      </button>

      {/* Next Question — active after reveal */}
      <button
        onClick={onNext}
        disabled={!isRevealOrLeaderboard}
        aria-label="التالي"
        className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-colors ${
          isRevealOrLeaderboard
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-gray-700 opacity-40 cursor-not-allowed'
        }`}
      >
        التالي
      </button>

      {/* Show Leaderboard — active after reveal */}
      <button
        onClick={onLeaderboard}
        disabled={!isRevealOrLeaderboard}
        aria-label="عرض النتائج"
        className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-colors ${
          isRevealOrLeaderboard
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-gray-700 opacity-40 cursor-not-allowed'
        }`}
      >
        عرض النتائج
      </button>

      {/* End Game — always available, 2-step confirm */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleEnd}
          aria-label="إنهاء اللعبة"
          className="flex-1 rounded-xl px-4 py-3 font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          {confirmEnd ? 'هل أنت متأكد؟ إنهاء اللعبة' : 'إنهاء اللعبة'}
        </button>
        {confirmEnd && (
          <button
            onClick={() => setConfirmEnd(false)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  )
}
