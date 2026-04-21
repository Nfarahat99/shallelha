'use client'

import { useState, useTransition } from 'react'

interface LeaderboardRow {
  rank: number
  userId: string
  displayName: string | null
  avatarEmoji: string | null
  avatarConfig: unknown
  wins: number
  gamesPlayed: number
  winRate: number
}

interface Props {
  initialData: LeaderboardRow[]
}

const PERIOD_LABELS: Record<'alltime' | 'weekly', string> = {
  alltime: 'كل الأوقات',
  weekly: 'هذا الأسبوع',
}

// Top-3 row highlight styles
const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  2: 'bg-gray-400/20 border-gray-400/40 text-gray-300',
  3: 'bg-orange-600/20 border-orange-600/40 text-orange-300',
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function LeaderboardClient({ initialData }: Props) {
  const [period, setPeriod] = useState<'alltime' | 'weekly'>('alltime')
  const [rows, setRows] = useState<LeaderboardRow[]>(initialData)
  const [isPending, startTransition] = useTransition()

  async function handlePeriodChange(newPeriod: 'alltime' | 'weekly') {
    if (newPeriod === period) return
    setPeriod(newPeriod)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leaderboard?period=${newPeriod}`)
        if (res.ok) {
          const data: LeaderboardRow[] = await res.json()
          setRows(data)
        }
      } catch {
        // Keep existing rows on network error — no crash
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Period toggle */}
      <div className="flex gap-2 justify-center" role="group" aria-label="اختر الفترة الزمنية">
        {(['alltime', 'weekly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            aria-pressed={period === p}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              period === p
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div
        className={`flex flex-col gap-2 transition-opacity duration-200 ${
          isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        {rows.length === 0 && (
          <p className="text-white/50 text-center py-12">
            لا توجد بيانات بعد
          </p>
        )}
        {rows.map((row) => {
          const rowStyle =
            RANK_STYLES[row.rank] ?? 'bg-white/5 border-white/10 text-white/60'
          const medal = RANK_MEDALS[row.rank]
          return (
            <div
              key={row.userId}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${rowStyle}`}
            >
              {/* Rank badge */}
              <span
                className="w-8 text-lg font-black text-center shrink-0"
                aria-label={`المركز ${row.rank}`}
              >
                {medal ?? `#${row.rank}`}
              </span>

              {/* Avatar — emoji fallback; avatarConfig available for future PlayerAvatar integration */}
              <span className="text-2xl shrink-0" aria-hidden="true">
                {row.avatarEmoji ?? '🎮'}
              </span>

              {/* Name + stats */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-white truncate">
                  {row.displayName ?? 'لاعب مجهول'}
                </span>
                <span className="text-xs text-white/50">
                  {row.wins} فوز من {row.gamesPlayed} — {row.winRate}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
