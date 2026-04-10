'use client'

import { useState, useEffect } from 'react'

interface VotingUIProps {
  answers: Array<{ id: string; emoji: string; text: string }>
  myPlayerId: string
  onVote: (answerId: string) => void
  votedAnswerId: string | null
  votingDeadline: number  // unix ms
}

export function VotingUI({
  answers,
  myPlayerId,
  onVote,
  votedAnswerId,
  votingDeadline,
}: VotingUIProps) {
  const [timeExpired, setTimeExpired] = useState(false)
  const [barWidth, setBarWidth] = useState(100)

  useEffect(() => {
    const totalDuration = 15_000
    const startTime = votingDeadline - totalDuration

    const tick = () => {
      const now = Date.now()
      const remaining = votingDeadline - now
      if (remaining <= 0) {
        setBarWidth(0)
        setTimeExpired(true)
        return
      }
      const elapsed = now - startTime
      setBarWidth(Math.max(0, 100 - (elapsed / totalDuration) * 100))
    }

    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [votingDeadline])

  const hasVoted = votedAnswerId !== null

  return (
    <div className="flex flex-col gap-4 px-4 py-4 flex-1">
      {/* Heading */}
      <h2 className="text-xl font-bold text-gray-900 text-start font-[family-name:var(--font-cairo)]">
        اختر الإجابة الأفضل
      </h2>

      {/* Countdown bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-none rounded-full"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Answer cards */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {answers.map(({ id, emoji, text }) => {
          const isOwnAnswer = id === myPlayerId
          const isVoted = votedAnswerId === id
          const isDimmed = hasVoted && !isVoted

          let cardClasses = 'rounded-xl px-4 py-3 min-h-[60px] flex items-center gap-3 transition-all'

          if (isOwnAnswer) {
            cardClasses += ' bg-gray-100 opacity-40 cursor-not-allowed'
          } else if (isVoted) {
            cardClasses += ' ring-4 ring-indigo-500 bg-indigo-50 cursor-default'
          } else if (isDimmed) {
            cardClasses += ' bg-gray-50 opacity-40 cursor-default'
          } else if (timeExpired || hasVoted) {
            cardClasses += ' bg-gray-50 cursor-default'
          } else {
            cardClasses += ' bg-gray-50 hover:bg-gray-100 active:scale-95 cursor-pointer'
          }

          return (
            <div
              key={id}
              className={cardClasses}
              onClick={() => {
                if (!isOwnAnswer && !hasVoted && !timeExpired) {
                  onVote(id)
                }
              }}
              title={isOwnAnswer ? 'لا يمكنك التصويت على إجابتك' : undefined}
            >
              <span className="text-xl shrink-0">{emoji}</span>
              <span className="text-base font-semibold text-gray-900 text-start flex-1 font-[family-name:var(--font-cairo)]">
                {text}
              </span>
            </div>
          )
        })}
      </div>

      {/* Expired message */}
      {timeExpired && (
        <p className="text-center text-sm text-gray-400 font-[family-name:var(--font-cairo)]">
          انتهى التصويت
        </p>
      )}
    </div>
  )
}
