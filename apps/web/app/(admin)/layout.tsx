import Link from 'next/link'
import { AdminLogoutButton } from './AdminLogoutButton'

export const metadata = {
  title: 'لوحة الإدارة — شعللها',
}

async function fetchPendingPackCount(): Promise<number> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return 0
  try {
    const res = await fetch(`${backendUrl}/packs?status=PENDING`, { cache: 'no-store' })
    if (!res.ok) return 0
    const packs = (await res.json()) as unknown[]
    return packs.length
  } catch {
    return 0
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pendingPackCount = await fetchPendingPackCount()
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        {/* Brand header */}
        <div className="bg-brand-600 px-5 py-4">
          <p className="text-xl font-black text-white tracking-tight leading-none">شعللها</p>
          <p className="text-brand-200 text-xs font-medium mt-0.5">لوحة الإدارة</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {/* Dashboard */}
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span>الرئيسية</span>
          </Link>

          {/* Categories */}
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            <span>الفئات</span>
          </Link>

          {/* Questions */}
          <Link
            href="/admin/questions"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <span>الأسئلة</span>
          </Link>

          {/* AI Queue shortcut */}
          <Link
            href="/admin/questions?status=draft"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            <span>قائمة المراجعة</span>
          </Link>

          {/* Drawing Prompts */}
          <Link
            href="/admin/drawing-prompts"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
            <span>كلمات الرسم</span>
          </Link>

          {/* Community Packs */}
          <Link
            href="/admin/packs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors group min-h-[44px]"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-brand-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            <span className="flex-1">الباقات</span>
            {pendingPackCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
                {pendingPackCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <AdminLogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
