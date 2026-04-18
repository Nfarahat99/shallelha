import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Server Component — reads session and renders host dashboard.
// Middleware already blocks unauthenticated users, but we double-check here.
export default async function HostPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  const displayName = session.user.name ?? session.user.email ?? 'مضيف'

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900"
    >
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -start-40 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 end-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      {/* ─────────────────────────── Header ─────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* Flame icon */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/50">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-white"
              aria-hidden="true"
            >
              <path d="M12.017 2C12.017 2 9 7 9 10.5c0 1.66 1.34 3 3 3s3-1.34 3-3C15 7.5 12.017 2 12.017 2ZM6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.06-1.04-3.87-2.62-4.96C15.04 10.35 14 11.8 14 13.5c0 1.1-.9 2-2 2s-2-.9-2-2c0-.45.14-.86.38-1.2C8.54 13.04 6 13.41 6 14Z" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            شعللها
          </span>
        </div>

        {/* User + sign-out */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-300 sm:block">
            مرحباً،{' '}
            <span className="font-semibold text-white">{displayName}</span>
          </span>
          <a
            href="/api/auth/signout"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            تسجيل الخروج
          </a>
        </div>
      </header>

      {/* ─────────────────────────── Main ─────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Hero greeting */}
        <section className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-white drop-shadow-sm sm:text-5xl">
            لوحة المضيف
          </h1>
          <p className="text-lg text-slate-300">
            ابدأ جلسة جديدة أو راجع إحصائياتك
          </p>
        </section>

        {/* ─── Primary CTA ─── */}
        <section className="mb-12 flex justify-center">
          <a
            href="/host/new"
            className="group relative flex min-h-[60px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-600 px-10 py-4 text-xl font-bold text-white shadow-xl shadow-brand-900/60 transition-all duration-200 hover:bg-brand-500 hover:shadow-brand-700/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400"
          >
            {/* Shimmer overlay */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
            />
            {/* Plus icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            أنشئ غرفة جديدة
          </a>
        </section>

        {/* ─── Secondary nav links ─── */}
        <section className="mb-10 flex flex-wrap justify-center gap-3">
          <a
            href="/packs/my-packs"
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            باقاتي
          </a>
        </section>

        {/* ─── Stats cards ─── */}
        <section aria-labelledby="stats-heading" className="mb-12">
          <h2
            id="stats-heading"
            className="mb-5 text-start text-lg font-semibold text-slate-300"
          >
            إحصائياتك
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: 'الألعاب السابقة',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z" />
                    <line x1="12" y1="12" x2="12" y2="16" />
                    <line x1="10" y1="14" x2="14" y2="14" />
                  </svg>
                ),
              },
              {
                label: 'اللاعبون',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                label: 'الأسئلة المستخدمة',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ),
              },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors duration-150 hover:bg-white/8"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-300">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-400">{label}</p>
                  <p className="text-2xl font-bold text-white">—</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Quick tips ─── */}
        <section aria-labelledby="tips-heading">
          <h2
            id="tips-heading"
            className="mb-5 text-start text-lg font-semibold text-slate-300"
          >
            نصائح للمضيف
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: 'شارك الرمز',
                body: 'بعد إنشاء الغرفة، أرسل رمز الانضمام للاعبين — يمكنهم الدخول عبر الهاتف مباشرةً.',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                ),
              },
              {
                title: 'تحكم في الوتيرة',
                body: 'أنت من يتحكم بانتقال الأسئلة — خذ وقتك لإجراء نقاشات ممتعة بين الأسئلة.',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
              {
                title: 'الإجابات الصحيحة',
                body: 'تظهر الإجابة الصحيحة تلقائياً بعد انتهاء وقت كل سؤال — يمكنك التعليق عليها.',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ),
              },
              {
                title: 'لوحة النتائج',
                body: 'تُعرض لوحة المتصدرين بعد كل سؤال — وفي نهاية الجلسة تظهر النتائج الكاملة للجميع.',
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
            ].map(({ title, body, icon }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300">
                  {icon}
                </span>
                <div>
                  <p className="mb-1 font-semibold text-white">{title}</p>
                  <p className="text-sm leading-relaxed text-slate-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 mt-16 border-t border-white/10 px-6 py-5 text-center text-xs text-slate-500">
        شعللها © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
