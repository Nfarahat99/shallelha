export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/auth'
import { PackCard, type PackSummary } from '@/components/packs/PackCard'
import { PackFilters } from '@/components/packs/PackFilters'

export const metadata: Metadata = {
  title: 'باقات الأسئلة — شعللها',
  description: 'تصفح باقات الأسئلة المجتمعية والرسمية والعب مع أصدقائك',
}

const DEFAULT_CATEGORIES = ['رمضان', 'محبوبين', 'رياضة', 'أفلام', 'ثقافة عامة', 'خليجي']

async function fetchPacks(category?: string, language?: string): Promise<PackSummary[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return []

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (language) params.set('language', language)

  try {
    const res = await fetch(`${backendUrl}/packs?${params.toString()}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return []
    return res.json() as Promise<PackSummary[]>
  } catch {
    return []
  }
}

interface PageProps {
  searchParams: Promise<{ category?: string; language?: string }>
}

export default async function PacksPage({ searchParams }: PageProps) {
  const { category, language } = await searchParams
  const [packs, session] = await Promise.all([fetchPacks(category, language), auth()])

  return (
    <main
      className="min-h-dvh bg-gradient-to-b from-gray-950 via-brand-950/30 to-gray-900 px-4 py-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">باقات الأسئلة</h1>
            <p className="text-sm text-white/50 mt-1">اكتشف باقات المجتمع والباقات الرسمية</p>
          </div>
          {session?.user?.id && (
            <Link
              href="/packs/create"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-semibold px-4 py-2.5 text-sm transition-all duration-150 min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              إنشاء باقة
            </Link>
          )}
        </div>

        {/* Filters — wrapped in Suspense because PackFilters uses useSearchParams */}
        <div className="mb-6">
          <Suspense fallback={<FiltersSkeleton />}>
            <PackFilters
              categories={DEFAULT_CATEGORIES}
              activeCategory={category}
              activeLanguage={language}
            />
          </Suspense>
        </div>

        {/* Pack grid */}
        {packs.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-11 w-20 rounded-full bg-white/10 animate-pulse" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-16 rounded-full bg-white/10 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ category }: { category?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 10h8M8 14h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-white/70 font-semibold text-lg">
        {category
          ? `لا توجد باقات بعد في فئة "${category}"`
          : 'لا توجد باقات بعد في هذه الفئة'}
      </p>
      <p className="text-white/40 text-sm max-w-xs">
        كن أول من يضيف باقة أسئلة مميزة لهذه الفئة
      </p>
      <Link
        href="/packs/create"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-600/20 border border-brand-500/30 hover:bg-brand-600/30 text-brand-300 font-semibold px-4 py-2.5 text-sm transition-all duration-150 min-h-[44px]"
      >
        إنشاء باقة جديدة
      </Link>
    </div>
  )
}
