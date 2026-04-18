import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MyPacksClient } from '@/components/packs/MyPacksClient'

export const metadata = {
  title: 'باقاتي — شعللها',
}

interface PackSummary {
  id: string
  name: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  category: string
  language: string
  _count: { questions: number }
  createdAt: string
  updatedAt: string
}

async function fetchMyPacks(userId: string): Promise<PackSummary[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return []

  try {
    const res = await fetch(`${backendUrl}/packs/mine?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function MyPacksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/host')

  const packs = await fetchMyPacks(session.user.id)

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900"
    >
      {/* Decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -start-40 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 end-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/50">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white" aria-hidden="true">
              <path d="M12.017 2C12.017 2 9 7 9 10.5c0 1.66 1.34 3 3 3s3-1.34 3-3C15 7.5 12.017 2 12.017 2ZM6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.06-1.04-3.87-2.62-4.96C15.04 10.35 14 11.8 14 13.5c0 1.1-.9 2-2 2s-2-.9-2-2c0-.45.14-.86.38-1.2C8.54 13.04 6 13.41 6 14Z" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">شعللها</span>
        </div>
        <Link
          href="/host"
          className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="العودة للوحة المضيف"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          العودة
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">باقاتي</h1>
            <p className="mt-1 text-slate-400">إدارة باقات الأسئلة الخاصة بك</p>
          </div>
          <Link
            href="/packs/create"
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/50 transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            إنشاء باقة جديدة
          </Link>
        </div>

        <MyPacksClient packs={packs} userId={session.user.id} />
      </main>

      <footer className="relative z-10 mt-16 border-t border-white/10 px-6 py-5 text-center text-xs text-slate-500">
        شعللها © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
