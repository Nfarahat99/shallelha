'use client'

import { useState, useEffect } from 'react'

interface VotingDisplayProps {
  answers: Array<{ id: string; emoji: string; text: string }>
  votingDeadline: number  // unix ms
  winnerResult?: { winnerId: string; winnerText: string } | null
}

export function VotingDisplay({ answers, votingDeadline, winnerResult }: VotingDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((votingDeadline - Date.now()) / 1000))
  )

  useEffect(() => {
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((votingDeadline - Date.now()) / 1000)))
    }
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [votingDeadline])

  return (
    <div className="flex flex-col gap-4 px-8 py-4 flex-1 min-h-0">
      {/* Heading */}
      <h2 className="text-[32px] font-bold text-white text-center font-[family-name:var(--font-cairo)]">
        صوّت على أفضل إجابة
      </h2>

      {/* Countdown timer */}
      <div className="text-center">
        <span className="text-4xl font-black text-indigo-400 tabular-nums">{secondsLeft}</span>
        <span className="text-lg text-gray-400 ms-2">ثانية</span>
      </div>

      {/* Answers list */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {answers.length === 0 ? (
          <p className="text-gray-400 text-center py-6">لا توجد إجابات</p>
        ) : (
          answers.map(({ id, emoji, text }) => {
            const isWinner = winnerResult != null && winnerResult.winnerId === id
            return (
              <div
                key={id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  isWinner ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'
                }`}
              >
                <span className="text-2xl shrink-0">{emoji}</span>
                <span className="text-[28px] font-semibold text-start leading-relaxed flex-1 font-[family-name:var(--font-cairo)]">
                  {text}
                </span>
                {isWinner && (
                  <span className="text-sm font-bold shrink-0 bg-yellow-600 text-white rounded-full px-3 py-1">
                    الإجابة الفائزة
                  </span>
                )}
              </div>
            )
          })
        )}

        {/* No-winner message */}
        {winnerResult != null && winnerResult.winnerId === '' && (
          <p className="text-center text-gray-400 py-4">لم يحصل أحد على أصوات</p>
        )}
      </div>
    </div>
  )
}
