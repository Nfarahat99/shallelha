'use client'

// error.tsx MUST be a Client Component — Next.js App Router requirement.
// The root layout already sets dir="rtl" on <html>; no local dir attr needed.

import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error: _error, reset }: ErrorProps) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-red-50 via-white to-white">

      {/* Warning triangle SVG icon */}
      <div
        aria-hidden="true"
        className="mb-8 animate-fade-in"
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="تحذير"
        >
          {/* Outer triangle — red-200 */}
          <polygon
            points="40,6 74,66 6,66"
            fill="#fecaca"
            strokeLinejoin="round"
          />
          {/* Inner triangle — red-400 */}
          <polygon
            points="40,14 68,62 12,62"
            fill="#f87171"
            opacity="0.5"
            strokeLinejoin="round"
          />
          {/* Exclamation stem */}
          <rect x="37" y="28" width="6" height="18" rx="3" fill="#dc2626" />
          {/* Exclamation dot */}
          <circle cx="40" cy="52" r="3.5" fill="#dc2626" />
        </svg>
      </div>

      {/* Primary error message */}
      <h1 className="text-2xl font-bold text-gray-900 animate-slide-up">
        حدث خطأ غير متوقع
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-base text-gray-500 text-center max-w-xs leading-relaxed animate-slide-up">
        نعتذر عن هذا الخطأ، يرجى المحاولة مرة أخرى
      </p>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center animate-fade-in">
        {/* Primary: retry — calls the Next.js reset() boundary reset */}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl bg-brand-600 text-white text-base font-semibold shadow-elevated hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition-colors duration-150 cursor-pointer"
        >
          {/* Refresh / retry icon */}
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
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          حاول مرة أخرى
        </button>

        {/* Secondary: go home */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl border-2 border-brand-600 text-brand-600 text-base font-semibold hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 transition-colors duration-150"
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
      </div>
    </main>
  )
}
