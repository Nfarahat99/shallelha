'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

interface HostBluffingViewProps {
  question: { text: string }
}

type BluffingPhase = 'submit' | 'vote' | 'results'

interface BluffingResult {
  id: string
  text: string
  playerName: string
  playerEmoji: string
  voteCount: number
  isReal: boolean
}

export function HostBluffingView({ question }: HostBluffingViewProps) {
  const [bluffingPhase, setBluffingPhase] = useState<BluffingPhase>('submit')
  const [submitProgress, setSubmitProgress] = useState<{ submitted: number; total: number } | null>(null)
  const [voteProgress, setVoteProgress] = useState<{ voted: number; total: number } | null>(null)
  const [results, setResults] = useState<BluffingResult[] | null>(null)

  useEffect(() => {
    const socket = getSocket()

    socket.on('bluffing:progress', ({ submitted, total }: { submitted: number; total: number }) => {
      setSubmitProgress({ submitted, total })
    })

    socket.on('bluffing:vote_start', () => {
      setBluffingPhase('vote')
    })

    socket.on('bluffing:vote_progress', ({ voted, total }: { voted: number; total: number }) => {
      setVoteProgress({ voted, total })
    })

    socket.on('bluffing:results', (data: { answers: BluffingResult[] }) => {
      setResults(data.answers)
      setBluffingPhase('results')
    })

    return () => {
      socket.off('bluffing:progress')
      socket.off('bluffing:vote_start')
      socket.off('bluffing:vote_progress')
      socket.off('bluffing:results')
    }
  }, [])

  const handleLock = () => {
    const socket = getSocket()
    socket.emit('bluffing:lock')
  }

  // Results phase
  if (bluffingPhase === 'results' && results) {
    const sortedResults = [...results].sort((a, b) => b.voteCount - a.voteCount)
    const majorityWinner = sortedResults[0]

    return (
      <div className="flex flex-col gap-6 h-full" dir="rtl">
        {/* Majority banner */}
        {majorityWinner && (
          <div className={`rounded-2xl p-4 text-center border backdrop-blur-xl ${
            majorityWinner.isReal
              ? 'bg-red-500/15 border-red-400/30'
              : 'bg-yellow-500/15 border-yellow-400/30'
          }`}>
            {majorityWinner.isReal ? (
              <p className="text-lg font-bold text-red-300">اللاعبون وجدوا الإجابة الصحيحة!</p>
            ) : (
              <p className="text-lg font-bold text-yellow-300">معظم اللاعبين وقعوا في الفخ!</p>
            )}
          </div>
        )}

        {/* Answer list */}
        <div className="space-y-3 overflow-y-auto">
          {sortedResults.map((answer) => (
            <div
              key={answer.id}
              className={`bg-white/5 border backdrop-blur-xl rounded-2xl p-4 flex items-start justify-between gap-4 ${
                answer.isReal ? 'border-green-400/40' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{answer.playerEmoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/70 truncate">{answer.playerName}</p>
                  <p className="text-base text-white leading-relaxed">{answer.text}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {answer.isReal && (
                  <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-400/30 whitespace-nowrap">
                    حقيقية
                  </span>
                )}
                <span className="text-sm font-bold text-white/60">{answer.voteCount} ✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vote phase
  if (bluffingPhase === 'vote') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-full" dir="rtl">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg text-center space-y-4">
          <p className="text-2xl font-bold text-white">{question.text}</p>
          <p className="text-white/60">اللاعبون يصوتون الآن</p>
          {voteProgress && (
            <div className="space-y-2">
              <p className="text-sm text-white/50">
                {voteProgress.voted} من {voteProgress.total} صوّتوا
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${(voteProgress.voted / voteProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {!voteProgress && (
            <div className="animate-pulse">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-brand-500/40 h-2 rounded-full w-1/3" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Submit phase (default)
  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full" dir="rtl">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg space-y-4">
        <p className="text-2xl font-bold text-white text-center">{question.text}</p>

        {/* Submit progress */}
        {submitProgress ? (
          <div className="space-y-2">
            <p className="text-sm text-white/50 text-center">
              {submitProgress.submitted} من {submitProgress.total} أجابوا
            </p>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${(submitProgress.submitted / submitProgress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-white/50 text-center animate-pulse">في انتظار إجابات اللاعبين…</p>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-brand-500/30 h-2 rounded-full w-0" />
            </div>
          </div>
        )}

        {/* Lock button */}
        <button
          onClick={handleLock}
          className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 px-6 py-4 text-base font-bold text-white transition-colors shadow-[0_0_20px_rgba(79,70,229,0.4)]"
        >
          قفل الإجابات والانتقال للتصويت
        </button>
      </div>
    </div>
  )
}
