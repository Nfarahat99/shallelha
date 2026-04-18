import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PackQuestionPreview } from './PackQuestionPreview'

interface PackQuestion {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'FREE_TEXT'
  options: string[]
  correctIndex: number | null
  order: number
}

interface Pack {
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
  questions: PackQuestion[]
  createdAt: string
}

function isOfficial(pack: Pack): boolean {
  return pack.createdBy === 'admin' || pack.creatorHandle === 'الإدارة'
}

function languageLabel(lang: string): string {
  if (lang === 'ar') return 'عربي'
  if (lang === 'en') return 'English'
  return 'ثنائي'
}

function difficultyLabel(diff?: string | null): string {
  if (!diff) return ''
  const map: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  }
  return map[diff] ?? diff
}

async function fetchPack(packId: string): Promise<Pack | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return null

  try {
    const res = await fetch(`${backendUrl}/packs/${packId}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json() as Promise<Pack>
  } catch {
    return null
  }
}

interface PageProps {
  params: Promise<{ packId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { packId } = await params
  const pack = await fetchPack(packId)
  if (!pack) return { title: 'الباقة غير موجودة — شعللها' }
  return {
    title: `${pack.name} — باقات الأسئلة — شعللها`,
    description: pack.description ?? `باقة أسئلة تحتوي على ${pack.questions.length} سؤال`,
  }
}

export default async function PackDetailPage({ params }: PageProps) {
  const { packId } = await params
  const pack = await fetchPack(packId)

  if (!pack) notFound()

  const official = isOfficial(pack)

  return (
    <main
      className="min-h-dvh bg-gradient-to-b from-gray-950 via-brand-950/30 to-gray-900 px-4 py-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/packs"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <svg
            className="w-4 h-4 rotate-180 group-hover:translate-x-0.5 transition-transform"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 12l4-4-4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          باقات الأسئلة
        </Link>

        {/* Pack header card */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/10 p-6 mb-6">
          {/* Name + badge */}
          <div className="flex items-start gap-3 mb-3">
            <h1 className="text-2xl font-black text-white leading-tight flex-1">{pack.name}</h1>
            {official && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-600/20 border border-brand-500/40 px-2.5 py-1 text-xs font-bold text-brand-300">
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
          {pack.description && (
            <p className="text-white/70 text-sm leading-relaxed mb-4">{pack.description}</p>
          )}

          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <MetaChip label={pack.category} icon="tag" />
            <MetaChip label={languageLabel(pack.language)} icon="language" />
            {pack.difficulty && <MetaChip label={difficultyLabel(pack.difficulty)} icon="bar" />}
            <MetaChip label={`${pack.questions.length} سؤال`} icon="count" />
            <MetaChip
              label={`${pack.playCount.toLocaleString('ar-EG')} تشغيل`}
              icon="play"
            />
            {pack.rating != null && (
              <MetaChip label={`${pack.rating.toFixed(1)} ★`} icon="star" />
            )}
          </div>

          {/* Creator */}
          <p className="text-xs text-white/40" dir="ltr">
            بواسطة @{pack.creatorHandle ?? 'مجهول'}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/host/new?packId=${pack.id}`}
          className="flex items-center justify-center gap-3 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-lg font-black py-4 mb-8 transition-all duration-150 shadow-lg shadow-brand-600/30 min-h-[60px]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 4.5l13 7.5-13 7.5V4.5z" />
          </svg>
          العب هذه الباقة
        </Link>

        {/* Question preview */}
        <div className="rounded-2xl bg-gray-900/70 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-bold text-white">معاينة الأسئلة</h2>
            <p className="text-xs text-white/40 mt-0.5">{pack.questions.length} سؤال في الباقة</p>
          </div>
          <PackQuestionPreview questions={pack.questions} />
        </div>
      </div>
    </main>
  )
}

function MetaChip({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
      {icon === 'tag' && (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 7.5V3a1 1 0 011-1h4.5l4 4-4.5 4.5a1 1 0 01-1.4 0L2 7.5z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <circle cx="5" cy="5" r="0.75" fill="currentColor" />
        </svg>
      )}
      {label}
    </span>
  )
}
