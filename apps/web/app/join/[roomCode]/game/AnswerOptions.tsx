'use client'

interface AnswerOptionsProps {
  options: string[]
  /** Layout variant matching host configuration (D-04) */
  layout: '2x2' | '4-column' | 'vertical'
  /** Index of the answer the player selected, or null if not yet answered */
  selectedIndex: number | null
  /** Index of the correct answer — null until question:revealed fires (T-03-11) */
  correctIndex: number | null
  /** Whether the correct answer has been revealed by the host */
  revealed: boolean
  /** Called with the answer index when player taps an option */
  onSelect: (index: number) => void
  /** When true, all buttons are non-interactive */
  disabled: boolean
}

/** Color classes per option index — must match host QuestionDisplay colors (D-04) */
const OPTION_COLORS = [
  'bg-red-500 text-white',        // A — red
  'bg-blue-500 text-white',       // B — blue
  'bg-yellow-400 text-gray-900',  // C — yellow (text-gray-900 for 8.4:1 contrast ratio)
  'bg-green-500 text-white',      // D — green
] as const

/** Letter labels for accessibility — color alone is not sufficient differentiator */
const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'] as const

/**
 * Four colored answer buttons in 3 layout variants mirroring the host screen (D-04).
 * - 2x2 grid: Kahoot-style 4 colored quadrants
 * - 4-column: horizontal strip with 4 equal buttons
 * - vertical: stacked list with letter + text
 *
 * Selection states:
 * - Idle: full opacity, clickable
 * - Selected: ring-4 ring-white ring-offset-2, other options opacity-30
 * - Waiting: selected highlighted, others bg-gray-200 text-gray-400
 * - Correct reveal: selected + correct = scale-105 brightness-110
 * - Wrong reveal: selected + wrong = opacity-20 saturate-0; correct gets ring
 *
 * Touch targets: min-h-[80px] on every button (INFRA-03 — iOS 44px minimum).
 * RTL: uses logical properties only (text-start, gap-*, etc.).
 */
export function AnswerOptions({
  options,
  layout,
  selectedIndex,
  correctIndex,
  revealed,
  onSelect,
  disabled,
}: AnswerOptionsProps) {
  const hasSelected = selectedIndex !== null

  function getButtonClasses(index: number): string {
    const base = OPTION_COLORS[index]
    const isSelected = selectedIndex === index
    const isCorrect = correctIndex === index

    // Post-reveal states
    if (revealed && correctIndex !== null) {
      if (isCorrect) {
        // Correct answer — scale up and brighten
        return `${base} scale-105 brightness-110 ring-4 ring-white ring-offset-2`
      }
      if (isSelected && !isCorrect) {
        // Player chose wrong answer — fade and desaturate
        return `${base} opacity-20 saturate-0`
      }
      // Other wrong options — dim them
      return `${base} opacity-30`
    }

    // Post-tap waiting state (selected but not yet revealed)
    if (hasSelected && !revealed) {
      if (isSelected) {
        return `${base} ring-4 ring-white ring-offset-2 opacity-100`
      }
      // Other options greyed out while waiting
      return 'bg-gray-200 text-gray-400'
    }

    // Idle state
    return `${base} active:scale-95 active:brightness-90`
  }

  function isButtonDisabled(index: number): boolean {
    return disabled || (hasSelected && selectedIndex !== index)
  }

  function handleClick(index: number) {
    if (!isButtonDisabled(index)) {
      onSelect(index)
    }
  }

  // 2x2 grid layout — default, Kahoot-style
  if (layout === '2x2') {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={isButtonDisabled(index)}
            aria-pressed={selectedIndex === index}
            aria-disabled={isButtonDisabled(index)}
            className={`
              rounded-2xl flex flex-col items-center justify-center
              min-h-[80px] min-w-[44px] text-base font-semibold p-4
              transition-all duration-200 focus-visible:ring-2
              focus-visible:ring-indigo-500 focus-visible:ring-offset-2
              ${getButtonClasses(index)}
              ${isButtonDisabled(index) ? 'pointer-events-none' : 'cursor-pointer'}
            `}
          >
            <span className="text-xs opacity-70 mb-1">{OPTION_LETTERS[index]}</span>
            <span className="text-center leading-tight">{option}</span>
          </button>
        ))}
      </div>
    )
  }

  // 4-column bar layout — horizontal strip
  if (layout === '4-column') {
    return (
      <div className="flex flex-row gap-2 p-4">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={isButtonDisabled(index)}
            aria-pressed={selectedIndex === index}
            aria-disabled={isButtonDisabled(index)}
            className={`
              flex-1 rounded-xl min-h-[80px] min-w-[44px]
              flex flex-col items-center justify-center
              text-sm font-semibold p-3 transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
              ${getButtonClasses(index)}
              ${isButtonDisabled(index) ? 'pointer-events-none' : 'cursor-pointer'}
            `}
          >
            <span className="text-xs opacity-70 mb-1">{OPTION_LETTERS[index]}</span>
            <span className="text-center leading-tight text-xs">{option}</span>
          </button>
        ))}
      </div>
    )
  }

  // Vertical stack layout
  return (
    <div className="flex flex-col gap-3 p-4">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={isButtonDisabled(index)}
          aria-pressed={selectedIndex === index}
          aria-disabled={isButtonDisabled(index)}
          className={`
            rounded-xl py-4 px-6 min-h-[80px] min-w-[44px]
            flex items-center gap-3 text-base font-semibold
            transition-all duration-200 focus-visible:ring-2
            focus-visible:ring-indigo-500 focus-visible:ring-offset-2
            ${getButtonClasses(index)}
            ${isButtonDisabled(index) ? 'pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <span className="text-sm opacity-70 shrink-0">{OPTION_LETTERS[index]}</span>
          <span className="text-start leading-tight">{option}</span>
        </button>
      ))}
    </div>
  )
}
