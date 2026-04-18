'use client'

import { useState, useCallback } from 'react'

interface LeaderboardEntry {
  id: string
  name: string
  emoji: string
  score: number
  rank: number
  streak: number
}

interface ResultCardProps {
  gameId: string
  leaderboard: LeaderboardEntry[]
}

type Variant = 'whatsapp' | 'snapchat'

export function ResultCard({ gameId, leaderboard }: ResultCardProps) {
  const [variant, setVariant] = useState<Variant>('whatsapp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
  const cardUrl = `${backendUrl}/cards/result?gameId=${encodeURIComponent(gameId)}&variant=${variant}`

  const handleShare = useCallback(async () => {
    setSharing(true)
    setError(null)
    try {
      const response = await fetch(cardUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const file = new File([blob], `shalelha-result-${variant}.png`, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'شعللها — نتائج اللعبة',
        })
      } else {
        // Desktop fallback: trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `shalelha-result-${variant}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // AbortError = user dismissed share sheet (not an error)
      if (err instanceof Error && err.name === 'AbortError') {
        setSharing(false)
        return
      }
      console.error('[ResultCard] share error:', err)
      setError('تعذر إنشاء الصورة — حاول مرة أخرى')
    } finally {
      setSharing(false)
    }
  }, [cardUrl, variant])

  const handleDownload = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch(cardUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shalelha-result-${variant}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('تعذر تحميل الصورة — حاول مرة أخرى')
    }
  }, [cardUrl, variant])

  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="w-full flex flex-col items-center gap-6" dir="rtl">
      {/* Section header */}
      <h2 className="text-xl font-bold text-white">المتصدرون 🏆</h2>

      {/* Top 3 leaderboard */}
      <div className="w-full space-y-3">
        {top3.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/8 border border-white/10"
          >
            {/* Rank badge */}
            <span className="text-lg font-bold w-8 text-center shrink-0">
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
            </span>
            {/* Emoji avatar */}
            <span className="text-2xl shrink-0">{entry.emoji}</span>
            {/* Name + score */}
            <div className="flex-1 flex flex-col">
              <span className="text-white font-semibold text-base">{entry.name}</span>
              <span className="text-brand-400 text-sm font-medium">{entry.score} نقطة</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-full border-t border-white/10" />

      {/* Card section header */}
      <div className="w-full flex flex-col items-center gap-2">
        <h3 className="text-base font-semibold text-white/70">شارك النتيجة</h3>

        {/* Variant selector — pill tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/8 border border-white/10">
          <button
            onClick={() => setVariant('whatsapp')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              variant === 'whatsapp'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            واتساب / انستغرام
          </button>
          <button
            onClick={() => setVariant('snapchat')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              variant === 'snapchat'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            سناب شات
          </button>
        </div>
      </div>

      {/* Card image preview */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 ${
          variant === 'snapchat' ? 'w-40' : 'w-64'
        }`}
        style={{ aspectRatio: variant === 'snapchat' ? '9/16' : '1/1' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={cardUrl}
          src={cardUrl}
          alt="بطاقة نتائج اللعبة"
          className="w-full h-full object-cover"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError('تعذر إنشاء الصورة — حاول مرة أخرى')
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 gap-2">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/60">جاري إنشاء الصورة...</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Action buttons */}
      <div className="w-full flex gap-3">
        {/* Share button (primary) */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sharing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
          مشاركة
        </button>

        {/* Download button (secondary) */}
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-base transition-all border border-white/10"
          aria-label="تحميل"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          تحميل
        </button>
      </div>
    </div>
  )
}
