'use client'

interface WaitingScreenProps {
  /** The text of the answer the player selected */
  selectedAnswer: string
  /** The index of the chosen answer (0-3) */
  selectedIndex: number
  /** Tailwind color classes for the chosen answer button (e.g., "bg-red-500 text-white") */
  selectedColor: string
}

/**
 * Post-answer waiting state shown after the player taps an answer (D-06).
 * - Chosen answer remains highlighted with its color
 * - Spinner with Arabic "في انتظار اللاعبين…" text
 * - No right/wrong indication until host reveals the answer
 */
export function WaitingScreen({ selectedAnswer, selectedColor }: WaitingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
      {/* Chosen answer — stays highlighted with its option color */}
      <div className={`rounded-2xl p-6 w-full text-center text-xl font-bold ${selectedColor} opacity-80`}>
        {selectedAnswer}
      </div>

      {/* Spinner */}
      <div
        className="animate-spin rounded-full h-8 w-8 border-4 border-brand-900 border-t-brand-500"
        aria-hidden="true"
      />

      {/* Arabic waiting text (D-06) */}
      <p className="text-sm text-white/50">في انتظار اللاعبين…</p>
    </div>
  )
}
