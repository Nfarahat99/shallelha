import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LeaderboardClient } from './LeaderboardClient'

export const metadata: Metadata = {
  title: 'لوحة المتصدرين — شعللها',
  description: 'أفضل اللاعبين على شعللها',
}

// Server-side fetch for initial SSR render.
// Uses NEXT_PUBLIC_APP_URL so the SSR fetch resolves correctly in both
// development (localhost:3000) and production (Railway/Vercel).
async function fetchLeaderboard(period: 'alltime' | 'weekly' = 'alltime') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/leaderboard?period=${period}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    // Graceful degradation — client-side toggle will still work
    return []
  }
}

export default async function LeaderboardPage() {
  const initialData = await fetchLeaderboard('alltime')

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-gray-950 via-purple-950 to-gray-900 px-4 py-8"
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <h1 className="text-3xl font-black text-white text-center">
          لوحة المتصدرين
        </h1>
        <Suspense
          fallback={
            <div className="text-white/50 text-center py-8">
              جاري التحميل...
            </div>
          }
        >
          <LeaderboardClient initialData={initialData} />
        </Suspense>
      </div>
    </main>
  )
}
