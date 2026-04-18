'use client'

/**
 * FrozenPlayerOverlay — shown to a frozen player for the duration of the freeze.
 * Distinct from the FreezeOpponentOverlay in ./game/ (which is the "select target" dialog).
 *
 * Automatically disappears when the parent unmounts or re-renders without this component.
 * No dismiss button — clears when frozenCurrentQ becomes false (new question starts).
 */
export function FrozenPlayerOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-950/90 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      {/* Pulsing ring decoration */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-40 h-40 rounded-full border-4 border-blue-400/60 animate-pulse" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-blue-300/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <span className="text-8xl select-none" aria-hidden="true">❄️</span>
      </div>

      {/* Primary message */}
      <p
        className="text-3xl font-black text-blue-200 tracking-wide"
        dir="rtl"
      >
        أنت مجمّد
      </p>

      {/* Secondary message */}
      <p
        className="mt-3 text-lg text-blue-300/80 text-center px-8"
        dir="rtl"
      >
        لا يمكنك الإجابة على هذا السؤال
      </p>
    </div>
  )
}
