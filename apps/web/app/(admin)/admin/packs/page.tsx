import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { approvePack, rejectPack } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'مراجعة الباقات — لوحة الإدارة',
}

interface PackSummary {
  id: string
  name: string
  description: string | null
  category: string
  language: string
  difficulty: string | null
  creatorHandle: string | null
  createdAt: string
  _count: { questions: number }
}

async function fetchPendingPacks(): Promise<PackSummary[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return []

  try {
    const res = await fetch(`${backendUrl}/packs?status=PENDING`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function AdminPacksPage() {
  // Defense-in-depth: verify admin cookie (middleware is the primary gate)
  const cookieStore = cookies()
  const session = cookieStore.get('admin_session')
  if (!session || session.value !== process.env.ADMIN_SESSION_TOKEN) {
    redirect('/admin-login')
  }

  const packs = await fetchPendingPacks()

  return (
    <div dir="rtl">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مراجعة الباقات المرسلة</h1>
          <p className="mt-1 text-sm text-gray-500">
            اعتماد أو رفض الباقات التي أرسلها المستخدمون للنشر
          </p>
        </div>
        {packs.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            {packs.length} باقة قيد الانتظار
          </span>
        )}
      </div>

      {/* Empty state */}
      {packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <span className="mb-3 text-5xl" aria-hidden="true">✓</span>
          <p className="text-lg font-semibold text-gray-700">لا توجد باقات قيد المراجعة</p>
          <p className="mt-1 text-sm text-gray-400">ستظهر الباقات المرسلة من المستخدمين هنا</p>
        </div>
      ) : (
        <div className="space-y-4">
          {packs.map((pack) => (
            <PackReviewCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  )
}

function PackReviewCard({ pack }: { pack: PackSummary }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-gray-900">{pack.name}</h2>
            {pack.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{pack.description}</p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            قيد المراجعة
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
            {pack.category}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            {pack._count.questions} سؤال
          </span>
          {pack.creatorHandle && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {pack.creatorHandle}
            </span>
          )}
          <span>{formatDate(pack.createdAt)}</span>
        </div>
      </div>

      {/* Action area */}
      <div className="flex flex-wrap items-start gap-4 px-6 py-4">
        {/* Approve */}
        <form
          action={async () => {
            'use server'
            await approvePack(pack.id)
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            اعتمد
          </button>
        </form>

        {/* Reject — inline form with reason input */}
        <RejectForm packId={pack.id} />
      </div>
    </div>
  )
}

function RejectForm({ packId }: { packId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const reason = formData.get('reason')?.toString() ?? ''
        await rejectPack(packId, reason)
      }}
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <input
        type="text"
        name="reason"
        required
        minLength={1}
        placeholder="سبب الرفض (مطلوب)"
        className="min-h-[44px] flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        dir="rtl"
      />
      <button
        type="submit"
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 shadow-sm transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        ارفض
      </button>
    </form>
  )
}
