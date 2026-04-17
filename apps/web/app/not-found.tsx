import Link from 'next/link'

// Server Component — no 'use client' needed.
// The root layout already sets dir="rtl" and lang="ar" on <html>,
// so no local dir="rtl" wrapper is required here.

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-brand-50 via-white to-white">

      {/* Decorative geometric SVG — two overlapping hexagons, brand palette */}
      <div
        aria-hidden="true"
        className="mb-8 animate-fade-in"
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          {/* Back hexagon — brand-200 */}
          <polygon
            points="60,8 104,32 104,80 60,104 16,80 16,32"
            fill="#c7d2fe"
            opacity="0.5"
          />
          {/* Front hexagon — brand-400, rotated 30° */}
          <polygon
            points="60,20 97,41 97,83 60,104 23,83 23,41"
            fill="#818cf8"
            opacity="0.35"
          />
          {/* Inner dot — brand-600 */}
          <circle cx="60" cy="60" r="12" fill="#4f46e5" opacity="0.9" />
        </svg>
      </div>

      {/* 404 number */}
      <p
        className="text-8xl font-black tracking-tight text-brand-600 animate-slide-up"
        style={{ lineHeight: 1 }}
        aria-label="خطأ 404"
      >
        404
      </p>

      {/* Primary Arabic message */}
      <h1 className="mt-4 text-2xl font-bold text-gray-900 animate-slide-up">
        الصفحة غير موجودة
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-base text-gray-500 text-center max-w-xs leading-relaxed animate-slide-up">
        يبدو أنك وصلت لصفحة غير موجودة
      </p>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl bg-brand-600 text-white text-base font-semibold shadow-elevated hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          {/* Home icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.75Z" />
            <path d="M9 22V12h6v10" />
          </svg>
          العودة للرئيسية
        </Link>

        <Link
          href="/join"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl border-2 border-brand-600 text-brand-600 text-base font-semibold hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          {/* Game/play icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="6" width="20" height="12" rx="3" />
            <path d="M12 9v6M9 12h6" />
          </svg>
          انضم للعبة
        </Link>
      </div>
    </main>
  )
}
