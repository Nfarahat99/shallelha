'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface PackSummary {
  id: string
  name: string
  description?: string | null
  category: string
  language: string
  difficulty?: string | null
  status: string
  createdBy: string
  creatorHandle?: string | null
  playCount: number
  rating?: number | null
  questionCount: number
  createdAt: string
}

interface PackCardProps {
  pack: PackSummary
}

function isOfficial(pack: PackSummary): boolean {
  return pack.createdBy === 'admin' || pack.creatorHandle === 'الإدارة'
}

function languageLabel(lang: string): string {
  if (lang === 'ar') return 'عربي'
  if (lang === 'en') return 'English'
  return 'ثنائي'
}

export function PackCard({ pack }: PackCardProps) {
  const router = useRouter()
  const official = isOfficial(pack)

  function handlePlayClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/host/new?packId=${pack.id}`)
  }

  return (
    <Link
      href={`/packs/${pack.id}`}
      className="group block rounded-xl bg-gray-900/60 border border-white/10 p-4 transition-all duration-200 hover:border-brand-500/50 hover:bg-gray-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
      dir="rtl"
    >
      {/* Header: name + official badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 flex-1">
          {pack.name}
        </h3>
        {official && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-600/20 border border-brand-500/40 px-2 py-0.5 text-xs font-semibold text-brand-300">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 6l2.5 2.5L10 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            رسمي
          </span>
        )}
      </div>

      {/* Description */}
      {pack.description ? (
        <p className="text-sm text-white/60 line-clamp-2 mb-3 leading-relaxed">
          {pack.description}
        </p>
      ) : (
        <div className="mb-3" />
      )}

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {pack.questionCount} سؤال
        </span>
        <span className="w-px h-3 bg-white/20" aria-hidden="true" />
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {pack.playCount.toLocaleString('ar-EG')} تشغيل
        </span>
        <span className="w-px h-3 bg-white/20" aria-hidden="true" />
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-white/70">
          {pack.category}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-white/70">
          {languageLabel(pack.language)}
        </span>
      </div>

      {/* Footer: creator + play button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/40 truncate" dir="ltr">
          بواسطة @{pack.creatorHandle ?? 'مجهول'}
        </span>
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={`العب باقة ${pack.name}`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-sm font-semibold px-3 py-1.5 transition-all duration-150 min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 3.5l9 4.5-9 4.5V3.5z" />
          </svg>
          العب
        </button>
      </div>
    </Link>
  )
}
