'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface BluffingAnswer {
  id: string      // this IS the playerId
  text: string
}

interface BluffingResult {
  id: string
  text: string
  playerName: string
  playerEmoji: string
  voteCount: number
  isReal: boolean
}

export function BluffingVoteScreen() {
  const [answers, setAnswers] = useState<BluffingAnswer[]>([])
  const [deadline, setDeadline] = useState<number>(0)
  const [votedId, setVotedId] = useState<string | null>(null)
  const [voteProgress, setVoteProgress] = useState<{ voted: number; total: number } | null>(null)
  const [results, setResults] = useState<BluffingResult[] | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const socket = getSocket()

    socket.on('bluffing:vote_start', ({ answers: a, deadline: d }: { answers: BluffingAnswer[]; deadline: number }) => {
      setAnswers(a)
      setDeadline(d)
      setVotedId(null)
      setResults(null)
    })

    socket.on('bluffing:vote_progress', ({ voted, total }: { voted: number; total: number }) => {
      setVoteProgress({ voted, total })
    })

    socket.on('bluffing:results', (data: { answers: BluffingResult[] }) => {
      setResults(data.answers)
    })

    return () => {
      socket.off('bluffing:vote_start')
      socket.off('bluffing:vote_progress')
      socket.off('bluffing:results')
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!deadline) return
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
    update()
    const interval = setInterval(update, 500)
    return () => clearInterval(interval)
  }, [deadline])

  const handleVote = (targetPlayerId: string) => {
    if (votedId !== null) return
    setVotedId(targetPlayerId)
    const socket = getSocket()
    socket.emit('bluffing:vote', { targetPlayerId })
  }

  // Results view
  if (results) {
    const sortedResults = [...results].sort((a, b) => b.voteCount - a.voteCount)
    const majorityWinner = sortedResults[0]

    return (
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6" dir="rtl">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">نتائج التصويت</h2>
        </div>

        {/* Majority result banner */}
        {majorityWinner && (
          <div className={`rounded-2xl p-4 text-center border backdrop-blur-xl ${
            majorityWinner.isReal
              ? 'bg-red-500/15 border-red-400/30'
              : 'bg-yellow-500/15 border-yellow-400/30'
          }`}>
            {majorityWinner.isReal ? (
              <p className="text-sm font-bold text-red-300">معظم اللاعبين وجدوا الإجابة الصحيحة!</p>
            ) : (
              <p className="text-sm font-bold text-yellow-300">معظم اللاعبين وقعوا في الفخ!</p>
            )}
          </div>
        )}

        {/* Answer cards with authorship */}
        <div className="space-y-3">
          {sortedResults.map((answer) => (
            <div
              key={answer.id}
              className={`bg-white/5 border backdrop-blur-xl rounded-2xl p-4 space-y-2 ${
                answer.isReal ? 'border-green-400/40' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{answer.playerEmoji}</span>
                  <span className="text-sm font-semibold text-white/80">{answer.playerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {answer.isReal && (
                    <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-400/30">
                      إجابة حقيقية
                    </span>
                  )}
                  <span className="text-xs text-white/50">{answer.voteCount} صوت</span>
                </div>
              </div>
              <p className="text-base text-white leading-relaxed">{answer.text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Voting view
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6" dir="rtl">
      {/* Header + timer */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">صوّت للإجابة الصحيحة</h2>
        {deadline > 0 && (
          <span className={`text-sm font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-white/60'}`}>
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Vote progress */}
      {votedId && voteProgress && (
        <div className="space-y-1">
          <p className="text-xs text-white/50 text-center">
            {voteProgress.voted} من {voteProgress.total} صوّتوا
          </p>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(voteProgress.voted / voteProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Answer buttons */}
      <div className="space-y-3">
        {answers.map((answer, i) => {
          const isVoted = votedId === answer.id
          const isDisabled = votedId !== null

          return (
            <button
              key={answer.id}
              onClick={() => handleVote(answer.id)}
              disabled={isDisabled}
              className={`w-full text-right rounded-2xl px-5 py-4 text-sm font-semibold transition-all border backdrop-blur-xl ${
                isVoted
                  ? 'bg-brand-500/30 border-brand-400/60 text-white shadow-[0_0_16px_rgba(79,70,229,0.4)]'
                  : isDisabled
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95'
              }`}
            >
              <span className="text-xs text-white/40 block mb-1">إجابة {i + 1}</span>
              {answer.text}
            </button>
          )
        })}
      </div>

      {votedId && (
        <p className="text-xs text-white/40 text-center animate-pulse">في انتظار بقية اللاعبين…</p>
      )}
    </div>
  )
}
