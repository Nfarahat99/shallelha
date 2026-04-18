'use client'

import { useState } from 'react'

type GamePhase = 'question' | 'reveal' | 'leaderboard' | 'podium' | 'voting'

interface HostInGameControlsProps {
  gamePhase: GamePhase
  onReveal: () => void
  onNext: () => void
  onLeaderboard: () => void
  onEnd: () => void
  onLockFreeText?: () => void
  currentQuestionType?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
}

export function HostInGameControls({
  gamePhase,
  onReveal,
  onNext,
  onLeaderboard,
  onEnd,
  onLockFreeText,
  currentQuestionType,
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
  const isVoting = gamePhase === 'voting'
  const isRevealOrLeaderboard = gamePhase === 'reveal' || gamePhase === 'leaderboard'
  const isFreeText = currentQuestionType === 'FREE_TEXT'

  // During question phase for FREE_TEXT: show "اغلق الإجابات" instead of "اكشف الإجابة"
  const showLockButton = isQuestion && isFreeText

  return (
    <div className="flex flex-row items-center gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl border-t border-white/10 shrink-0">
      {/* Reveal / Lock button */}
      {showLockButton ? (
        <button
          onClick={onLockFreeText}
          disabled={!isQuestion}
          aria-label="اغلق الإجابات"
          className="flex-1 rounded-xl px-4 py-3 font-bold text-white transition-all bg-brand-600 hover:bg-brand-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
        >
          اغلق الإجابات
        </button>
      ) : (
        <button
          onClick={onReveal}
          disabled={!isQuestion || isVoting}
          aria-label="اكشف الإجابة"
          className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-all ${
            isQuestion && !isVoting
              ? 'bg-brand-600 hover:bg-brand-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
              : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
          }`}
        >
          اكشف الإجابة
        </button>
      )}

      {/* Next Question */}
      <button
        onClick={onNext}
        disabled={!isRevealOrLeaderboard}
        aria-label="التالي"
        className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-all border ${
          isRevealOrLeaderboard
            ? 'bg-white/10 border-white/20 hover:bg-white/20'
            : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
        }`}
      >
        التالي
      </button>

      {/* Show Leaderboard */}
      <button
        onClick={onLeaderboard}
        disabled={!isRevealOrLeaderboard}
        aria-label="عرض النتائج"
        className={`flex-1 rounded-xl px-4 py-3 font-bold text-white transition-all border ${
          isRevealOrLeaderboard
            ? 'bg-white/10 border-white/20 hover:bg-white/20'
            : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
        }`}
      >
        عرض النتائج
      </button>

      {/* End Game — always available, 2-step confirm */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleEnd}
          aria-label="إنهاء اللعبة"
          className="flex-1 rounded-xl px-4 py-3 font-bold text-white bg-red-600/80 hover:bg-red-500 border border-red-500/50 transition-all"
        >
          {confirmEnd ? 'هل أنت متأكد؟ إنهاء اللعبة' : 'إنهاء اللعبة'}
        </button>
        {confirmEnd && (
          <button
            onClick={() => setConfirmEnd(false)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  )
}
