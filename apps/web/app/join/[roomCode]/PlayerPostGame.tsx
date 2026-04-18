'use client'

import { useState } from 'react'

interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
}

interface PlayerPostGameProps {
  myPlayerId: string
  leaderboard: LeaderboardEntry[]
  roomCode: string
}

function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank.toLocaleString('ar-EG')
}

function getRankText(rank: number): string {
  if (rank === 1) return 'أنت في المرتبة الأولى 🥇'
  if (rank === 2) return 'أنت في المرتبة الثانية 🥈'
  if (rank === 3) return 'أنت في المرتبة الثالثة 🥉'
  return 'المرتبة ' + rank.toLocaleString('ar-EG')
}

export function PlayerPostGame({ myPlayerId, leaderboard, roomCode: _roomCode }: PlayerPostGameProps) {
  const [copied, setCopied] = useState(false)

  const myEntry = leaderboard.find(e => e.id === myPlayerId)

  function handleShare() {
    const rank = myEntry?.rank ?? '?'
    const text = `حصلت على المرتبة ${rank} في شعللها!`
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ text })) {
      navigator.share({ title: 'شعللها', text })
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-dvh flex flex-col bg-gradient-to-b from-gray-950 via-brand-950 to-gray-900 overflow-y-auto"
    >
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6 px-6 py-8 pb-16">

        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-4xl font-black text-brand-400">شعللها</span>
          <p className="text-2xl font-bold text-white">انتهت اللعبة!</p>
        </div>

        {/* Rank badge card */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center space-y-3">
          {myEntry ? (
            <>
              <div className="text-5xl">{getRankMedal(myEntry.rank)}</div>
              <p className="text-lg font-bold text-white">{getRankText(myEntry.rank)}</p>
              <p className="text-brand-400 text-2xl font-bold">{myEntry.score.toLocaleString('ar-EG')} نقطة</p>
            </>
          ) : (
            <p className="text-white/60 text-base">لم يتم العثور على نتائجك</p>
          )}
        </div>

        {/* Full leaderboard list */}
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isOwn = entry.id === myPlayerId
            return (
              <div
                key={entry.id}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl border',
                  isOwn
                    ? 'bg-brand-600/20 border-brand-500/30'
                    : 'bg-white/8 border-white/10',
                ].join(' ')}
              >
                {/* Rank medal / number */}
                <span className="text-lg w-7 text-center shrink-0">
                  {getRankMedal(entry.rank)}
                </span>

                {/* Emoji avatar */}
                <span className="text-2xl shrink-0">{entry.emoji}</span>

                {/* Name */}
                <span className="text-white font-bold flex-1 truncate">{entry.name}</span>

                {/* Score */}
                <span className="text-brand-400 font-bold shrink-0">
                  {entry.score.toLocaleString('ar-EG')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-base min-h-[44px] transition-all"
        >
          {copied ? 'تم النسخ ✓' : 'شارك نتيجتك'}
        </button>

        {/* Auth prompt */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-white/70 text-sm mb-3">سجّل دخولك لحفظ نتائجك</p>
          <a
            href="/api/auth/signin"
            className="inline-block bg-white text-gray-900 rounded-2xl py-3 px-6 font-bold text-sm"
          >
            تسجيل الدخول بـ Google
          </a>
        </div>

      </div>
    </div>
  )
}
