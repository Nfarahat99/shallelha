'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

// SVG lock icon — no emojis, inline SVG only
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

// SVG home icon — back-to-home link
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.552 5.448 21 6 21H9M19 10L21 12M19 10V20C19 20.552 18.552 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Official Google "G" SVG mark — exact brand colors
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// Shield/privacy trust icon
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3L4 7v5c0 4.418 3.364 8.565 8 9.93C16.636 20.565 20 16.418 20 12V7l-8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Star/brand decorative icon
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" />
    </svg>
  )
}

export default function SignInPage() {
  return (
    /*
     * Full-screen gradient background matching the app's brand palette.
     * RTL is inherited from <html dir="rtl"> set in layout.tsx — no need
     * to repeat dir="rtl" here, but added for standalone correctness.
     *
     * Animations use animate-fade-in / animate-slide-up defined in tailwind.config.ts.
     * motion-reduce: prefers-reduced-motion is handled via Tailwind's
     * motion-reduce: variant prefix on animation classes.
     */
    <main
      className="
        min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800
        p-6 relative overflow-hidden
      "
      aria-label="صفحة تسجيل الدخول"
    >
      {/* Decorative background orbs — visual depth, pointer-events-none */}
      <div
        aria-hidden="true"
        className="
          absolute top-[-10%] start-[-10%]
          w-72 h-72 rounded-full
          bg-brand-600/20 blur-3xl
          pointer-events-none
          motion-reduce:hidden
        "
      />
      <div
        aria-hidden="true"
        className="
          absolute bottom-[-10%] end-[-10%]
          w-96 h-96 rounded-full
          bg-brand-500/15 blur-3xl
          pointer-events-none
          motion-reduce:hidden
        "
      />

      {/* Card container */}
      <div
        className="
          relative z-10
          w-full max-w-sm
          bg-white/10 backdrop-blur-md
          border border-white/20
          rounded-3xl
          shadow-elevated
          p-8
          flex flex-col gap-8
          animate-slide-up motion-reduce:animate-none
        "
      >
        {/* Brand header */}
        <header className="text-center space-y-3">
          {/* Decorative sparkles flanking the title — purely visual, hidden from AT */}
          <div className="flex items-center justify-center gap-3" aria-hidden="true">
            <SparkleIcon className="w-5 h-5 text-brand-300 opacity-70" />
            <SparkleIcon className="w-3 h-3 text-brand-200 opacity-50" />
          </div>

          <h1
            className="
              text-5xl font-black tracking-tight
              text-white
              drop-shadow-lg
            "
          >
            شعللها
          </h1>

          {/* Subtitle / call-to-action message */}
          <p
            className="
              text-lg font-semibold
              text-brand-200
            "
          >
            سجّل دخولك لاستضافة لعبة
          </p>
        </header>

        {/* Host-only badge */}
        <div
          className="
            flex items-center justify-center gap-2
            bg-brand-600/30 border border-brand-400/30
            rounded-2xl
            px-4 py-3
          "
          role="note"
          aria-label="ملاحظة للمضيفين فقط"
        >
          <LockIcon className="w-4 h-4 flex-shrink-0 text-brand-300" />
          <p className="text-sm font-medium text-brand-200 text-center leading-snug">
            للمضيفين فقط — اللاعبون لا يحتاجون لحساب
          </p>
        </div>

        {/* Google sign-in button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/host' })}
            className="
              w-full
              flex items-center justify-center gap-3
              min-h-[56px]
              rounded-2xl
              bg-white
              px-5 py-4
              text-base font-bold text-gray-800
              shadow-card
              hover:shadow-card-hover hover:bg-gray-50
              active:scale-[0.98]
              transition-all duration-200 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900
              motion-reduce:transition-none motion-reduce:active:scale-100
            "
            aria-label="تسجيل الدخول باستخدام حساب Google"
          >
            <GoogleIcon className="w-6 h-6 flex-shrink-0" />
            <span>تسجيل الدخول بـ Google</span>
          </button>
        </div>

        {/* Trust signals */}
        <div
          className="
            flex items-start gap-2
            bg-white/5 border border-white/10
            rounded-2xl
            px-4 py-3
          "
          role="note"
          aria-label="معلومات الخصوصية"
        >
          <ShieldIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
          <p className="text-xs text-white/60 leading-relaxed">
            نستخدم Google Sign-In فقط للتحقق من هويتك. لا نحتفظ بكلمات المرور ولا نشارك بياناتك مع أي طرف ثالث.
          </p>
        </div>

        {/* Back to home link */}
        <div className="text-center">
          <Link
            href="/"
            className="
              inline-flex items-center justify-center gap-2
              min-h-[44px] min-w-[44px]
              px-4 py-2
              rounded-xl
              text-sm font-medium text-brand-300
              hover:text-white hover:bg-white/10
              transition-colors duration-150 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900
              motion-reduce:transition-none
            "
            aria-label="العودة إلى الصفحة الرئيسية"
          >
            <HomeIcon className="w-4 h-4 flex-shrink-0" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      {/* Bottom fade — polishes the page edge on tall viewports */}
      <div
        aria-hidden="true"
        className="
          absolute bottom-0 inset-x-0
          h-24
          bg-gradient-to-t from-brand-950/60 to-transparent
          pointer-events-none
        "
      />
    </main>
  )
}
