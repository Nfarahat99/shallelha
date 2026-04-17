'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Inline SVG icons — no external dependency
// ---------------------------------------------------------------------------
function IconFlame({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconArrowStart({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  )
}

function IconSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function IconExclamation({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// JoinPage
// ---------------------------------------------------------------------------
export default function JoinPage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Trigger mount animation
  useEffect(() => {
    setMounted(true)
    // Auto-focus the input after the mount animation starts
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    setCode(value)
    if (error) setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 4) {
      setError('الكود يجب أن يكون 4 أحرف')
      inputRef.current?.focus()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Navigate — the [roomCode] page will validate existence
      router.push(`/join/${trimmed}`)
    } catch {
      setError('حدث خطأ، حاول مجدداً')
      setIsLoading(false)
    }
  }

  const isReady = code.length === 4

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12"
      aria-label="صفحة الانضمام إلى غرفة"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Background gradient                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-purple-950"
      />

      {/* Dot-grid texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Decorative blobs — CSS only, no images */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -start-40 w-[480px] h-[480px] rounded-full bg-brand-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -end-40 w-[480px] h-[480px] rounded-full bg-purple-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-700/10 blur-[80px]"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Card container                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={[
          'relative z-10 w-full max-w-sm',
          'transition-all duration-500 ease-out motion-reduce:transition-none',
          mounted
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6',
        ].join(' ')}
      >
        {/* Logo / Brand header */}
        <header className="mb-8 text-center">
          {/* Flame badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/40 mb-4">
            <IconFlame className="w-9 h-9 text-white" />
          </div>

          {/* Brand name */}
          <h1
            className={[
              'text-5xl font-black text-white tracking-tight leading-none mb-2',
              'transition-all duration-500 delay-75 ease-out motion-reduce:transition-none',
              mounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4',
            ].join(' ')}
            style={{
              textShadow: '0 0 40px rgba(99,102,241,0.6)',
            }}
          >
            شعللها
          </h1>

          {/* Subtitle */}
          <p
            className={[
              'text-base text-brand-200/80 font-medium',
              'transition-all duration-500 delay-150 ease-out motion-reduce:transition-none',
              mounted
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3',
            ].join(' ')}
          >
            أدخل كود الغرفة للانضمام
          </p>
        </header>

        {/* Form card */}
        <div
          className={[
            'rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40 p-6 sm:p-8',
            'transition-all duration-500 delay-200 ease-out motion-reduce:transition-none',
            mounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4',
          ].join(' ')}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Code input field */}
            <div className="mb-5">
              <label
                htmlFor="room-code"
                className="block text-sm font-semibold text-brand-100 mb-2 text-start"
              >
                كود الغرفة
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  id="room-code"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={code}
                  onChange={handleChange}
                  maxLength={4}
                  dir="ltr"
                  aria-describedby={error ? 'code-error' : 'code-hint'}
                  aria-invalid={!!error}
                  disabled={isLoading}
                  placeholder="ABCD"
                  className={[
                    // Layout & sizing — min 44px touch target height met by py-4
                    'w-full rounded-2xl px-5 py-4',
                    // Typography
                    'text-center text-4xl font-black uppercase tracking-[0.5em]',
                    // Colors: transparent bg, white text, placeholder muted
                    'bg-white/10 text-white placeholder:text-white/25',
                    // Border: changes on focus/error
                    'border-2',
                    error
                      ? 'border-red-400/80 focus:border-red-400'
                      : isReady
                        ? 'border-brand-400/80 focus:border-brand-400'
                        : 'border-white/20 focus:border-brand-300',
                    // Focus ring
                    'focus:outline-none focus:ring-4',
                    error
                      ? 'focus:ring-red-500/20'
                      : 'focus:ring-brand-500/30',
                    // Disabled
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    // Transition
                    'transition-all duration-200',
                  ].join(' ')}
                />

                {/* Ready checkmark glow overlay */}
                {isReady && !error && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-brand-400/5 transition-opacity duration-200"
                  />
                )}
              </div>

              {/* Hint text — hidden when error is shown */}
              {!error && (
                <p
                  id="code-hint"
                  className="mt-2 text-xs text-brand-300/60 text-start"
                >
                  4 أحرف أو أرقام — تجدها عند المضيف
                </p>
              )}

              {/* Error message */}
              {error && (
                <p
                  id="code-error"
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-400 text-start animate-fade-in motion-reduce:animate-none"
                >
                  <IconExclamation className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isReady || isLoading}
              aria-busy={isLoading}
              className={[
                // Layout — min 44px touch target
                'w-full flex items-center justify-center gap-2 rounded-2xl',
                'px-6 py-4 min-h-[56px]',
                // Typography
                'text-lg font-black',
                // Colors & gradient
                'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
                'shadow-lg shadow-brand-900/50',
                // Hover / focus
                'hover:from-brand-400 hover:to-brand-600',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
                // Disabled
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
                'disabled:from-brand-600 disabled:to-brand-700',
                // Transition
                'transition-all duration-200',
                // Active press feedback
                'active:scale-[0.98]',
              ].join(' ')}
            >
              {isLoading ? (
                <>
                  <IconSpinner className="w-5 h-5 animate-spin" />
                  <span>جاري الانضمام…</span>
                </>
              ) : (
                <span>انضم الآن</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to home link */}
        <div
          className={[
            'mt-6 text-center',
            'transition-all duration-500 delay-300 ease-out motion-reduce:transition-none',
            mounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3',
          ].join(' ')}
        >
          <Link
            href="/"
            className={[
              'inline-flex items-center justify-center gap-2',
              'rounded-xl px-4 py-2.5 min-h-[44px]',
              'text-sm font-semibold text-brand-300/70',
              'hover:text-brand-100 hover:bg-white/8',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
              'transition-all duration-200',
            ].join(' ')}
          >
            <IconArrowStart className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Decorative bottom flame accent — pure CSS                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
      />
    </main>
  )
}
