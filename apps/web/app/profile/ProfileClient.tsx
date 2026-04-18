'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateProfile } from './actions'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import type { GameSession, PlayerGameResult } from '@prisma/client'

interface GameResultWithSession extends PlayerGameResult {
  gameSession: GameSession
}

interface UserProfile {
  id: string
  name: string | null
  displayName: string | null
  avatarEmoji: string | null
  totalGamesPlayed: number
  winCount: number
  bestStreak: number
  favoriteCategory: string | null
  gameResults: GameResultWithSession[]
}

interface Props {
  user: UserProfile
}

export function ProfileClient({ user }: Props) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName ?? user.name ?? '')
  const [avatarEmoji, setAvatarEmoji] = useState(user.avatarEmoji ?? '🦁')
  const [isPending, startTransition] = useTransition()

  const visibleName = user.displayName ?? user.name ?? 'لاعب'

  function handleSave() {
    startTransition(async () => {
      await updateProfile({ displayName, avatarEmoji })
      setEditing(false)
    })
  }

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900"
    >
      <div className="max-w-lg mx-auto w-full flex flex-col gap-6 px-6 py-8">

        {/* Avatar + name header card */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-6">
          {!editing ? (
            <div className="flex flex-col items-center gap-3">
              <span className="text-6xl" role="img" aria-label="الرمز التعبيري">
                {avatarEmoji}
              </span>
              <h1 className="text-2xl font-bold text-white">{visibleName}</h1>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-1 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                تعديل
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-white/70">الاسم المعروض</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="اكتب اسمك"
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-white/70">الرمز التعبيري</span>
                <EmojiPicker value={avatarEmoji} onChange={setAvatarEmoji} />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {isPending ? 'جارٍ الحفظ…' : 'حفظ'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="مباريات" value={String(user.totalGamesPlayed)} />
          <StatCell label="فوز" value={String(user.winCount)} />
          <StatCell label="أطول سلسلة" value={String(user.bestStreak)} />
          <StatCell label="الفئة المفضلة" value={user.favoriteCategory ?? '—'} />
        </div>

        {/* Game history */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-white">سجل المباريات</h2>
          {user.gameResults.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-6">لم تلعب أي مباراة بعد</p>
          ) : (
            user.gameResults.map((result) => (
              <div
                key={result.id}
                className="rounded-2xl bg-white/8 border border-white/10 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-medium text-sm">
                    {result.gameSession.categoryName ?? 'غير محدد'}
                  </span>
                  <span className="text-white/50 text-xs">
                    {new Date(result.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-white font-bold">{result.score} نقطة</span>
                  <span className="text-white/50 text-xs">المركز #{result.rank}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="text-center text-white/60 hover:text-white text-sm transition-colors py-2"
        >
          ← العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-white/60 text-sm mt-1">{label}</div>
    </div>
  )
}
