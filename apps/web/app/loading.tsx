// Root loading.tsx — Server Component (no 'use client').
// Shown by Next.js App Router during root-level Suspense boundaries
// and initial page loads before the page shell is ready.
//
// prefers-reduced-motion:
//   The spinning animation is suppressed via the `motion-safe:` variant.
//   When motion is reduced, a static pulsing dot indicator replaces the spinner.

export default function Loading() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-white"
      role="status"
      aria-label="جارٍ التحميل"
    >
      {/*
        Spinner — visible only when prefers-reduced-motion is NOT set.
        Uses border-based technique: top border is brand-600, rest is brand-100.
        motion-safe:animate-spin enables the spin only when motion is allowed.
        The outer ring (brand-100) gives the track; the arc (brand-600) rotates.
      */}
      <div className="relative flex items-center justify-center" aria-hidden="true">
        {/* Track ring */}
        <span className="block w-14 h-14 rounded-full border-4 border-brand-100" />
        {/* Spinning arc — layered on top via absolute positioning */}
        <span className="absolute block w-14 h-14 rounded-full border-4 border-transparent border-t-brand-600 motion-safe:animate-spin" />

        {/*
          Reduced-motion fallback: three static pulsing dots.
          Hidden when motion is allowed; shown only under reduced-motion.
          Implemented as a visually-centered row that overlaps the ring area.
        */}
        <span className="motion-safe:hidden absolute flex items-center gap-1.5">
          <span className="block w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse-slow" />
          <span className="block w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse-slow [animation-delay:200ms]" />
          <span className="block w-2.5 h-2.5 rounded-full bg-brand-300 animate-pulse-slow [animation-delay:400ms]" />
        </span>
      </div>

      {/* Brand name */}
      <p className="text-2xl font-black tracking-tight text-brand-600 select-none">
        شعللها
      </p>

      {/* Loading label — kept subtle, not competing with brand name */}
      <p className="text-sm text-gray-400 font-medium select-none">
        جارٍ التحميل...
      </p>
    </div>
  )
}
