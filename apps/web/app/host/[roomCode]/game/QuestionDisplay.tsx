'use client'

import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { MediaQuestion } from './MediaQuestion'

interface QuestionDisplayProps {
  text: string
  options: string[]
  layout: '2x2' | '4-column' | 'vertical'
  revealed: boolean
  correctIndex: number | null
  questionIndex: number
  total: number
  type?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
  mediaUrl?: string
  timerDuration?: number
}

const OPTION_COLORS = [
  { bg: 'bg-red-500', text: 'text-white' },
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-gray-900' },
  { bg: 'bg-green-500', text: 'text-white' },
]

const ARABIC_LETTERS = ['أ', 'ب', 'ج', 'د']

function getRevealAnimation(
  index: number,
  correctIndex: number | null,
  revealed: boolean,
  reducedMotion: boolean
) {
  if (!revealed || correctIndex === null) return {}
  const isCorrect = index === correctIndex
  if (isCorrect) {
    return reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1.05 }
  }
  return reducedMotion
    ? { opacity: 0.3 }
    : { opacity: 0.3, scale: 1 }
}

export function QuestionDisplay({
  text,
  options,
  layout,
  revealed,
  correctIndex,
  questionIndex,
  total,
  type,
  mediaUrl,
  timerDuration,
}: QuestionDisplayProps) {
  const reducedMotion = useReducedMotion() ?? false

  const renderOption = (option: string, index: number) => {
    const color = OPTION_COLORS[index] ?? { bg: 'bg-gray-600', text: 'text-white' }
    const isCorrect = revealed && correctIndex === index
    const animProps = getRevealAnimation(index, correctIndex, revealed, reducedMotion)

    return (
      <m.div
        key={index}
        animate={animProps}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {layout === '2x2' && (
          <div
            className={`relative rounded-2xl flex items-center justify-center min-h-[20vh] text-[32px] font-bold text-center p-6 ${color.bg} ${color.text}`}
          >
            <span className="absolute top-3 start-3 text-lg opacity-70">{ARABIC_LETTERS[index]}</span>
            <span>{option}</span>
            {isCorrect && (
              <span className="absolute bottom-3 end-3 text-sm font-bold">✓ إجابة صحيحة!</span>
            )}
          </div>
        )}
        {layout === '4-column' && (
          <div
            className={`flex-1 rounded-xl min-h-[80px] flex flex-col items-center justify-center text-xl font-bold p-4 gap-1 ${color.bg} ${color.text}`}
          >
            <span className="text-sm opacity-70">{ARABIC_LETTERS[index]}</span>
            <span className="text-center">{option}</span>
            {isCorrect && <span className="text-xs font-bold">✓ إجابة صحيحة!</span>}
          </div>
        )}
        {layout === 'vertical' && (
          <div
            className={`rounded-xl py-4 px-6 flex items-center gap-3 text-xl font-bold ${color.bg} ${color.text}`}
          >
            <span className="text-sm opacity-70 shrink-0">{ARABIC_LETTERS[index]}</span>
            <span className="flex-1">{option}</span>
            {isCorrect && <span className="text-xs font-bold shrink-0">✓</span>}
          </div>
        )}
      </m.div>
    )
  }

  // MEDIA_GUESSING branch
  if (type === 'MEDIA_GUESSING' && mediaUrl) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Question counter */}
        <div className="px-8 pt-4 pb-2 shrink-0">
          <span className="text-2xl font-semibold text-gray-300">
            سؤال {questionIndex + 1} من {total}
          </span>
        </div>

        {/* Media zone — takes up top area */}
        <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
          <MediaQuestion
            mediaUrl={mediaUrl}
            revealed={revealed}
            timerDuration={timerDuration ?? 20}
          />
        </div>

        {/* Question text as hint below media */}
        <div className="px-8 pb-2 shrink-0">
          <p className="text-2xl font-bold text-white/80 text-start leading-snug">{text}</p>
        </div>

        {/* Options — same as MC */}
        {layout === '2x2' && (
          <div className="grid grid-cols-2 gap-4 px-8 pb-4 shrink-0">
            {options.map((option, i) => renderOption(option, i))}
          </div>
        )}
        {layout === '4-column' && (
          <div className="flex flex-row gap-3 px-8 pb-4 shrink-0">
            {options.map((option, i) => renderOption(option, i))}
          </div>
        )}
        {layout === 'vertical' && (
          <div className="flex flex-row px-8 pb-4 gap-6 shrink-0">
            <div className="w-1/3 flex flex-col gap-3 justify-center">
              {options.map((option, i) => renderOption(option, i))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // FREE_TEXT placeholder (Plan 03 will replace this)
  if (type === 'FREE_TEXT') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Question counter */}
        <div className="px-8 pt-4 pb-2 shrink-0">
          <span className="text-2xl font-semibold text-gray-300">
            سؤال {questionIndex + 1} من {total}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-16 py-8 min-h-0">
          <h2 className="text-5xl font-black text-white text-start leading-tight">{text}</h2>
        </div>
      </div>
    )
  }

  // MULTIPLE_CHOICE (default)
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Question counter */}
      <div className="px-8 pt-4 pb-2 shrink-0">
        <span className="text-2xl font-semibold text-gray-300">
          سؤال {questionIndex + 1} من {total}
        </span>
      </div>

      {/* Question text zone */}
      {layout !== 'vertical' && (
        <div className="flex-1 flex items-center justify-center px-16 py-8 min-h-0">
          <h2 className="text-5xl font-black text-white text-start leading-tight">{text}</h2>
        </div>
      )}

      {/* Options */}
      {layout === '2x2' && (
        <div className="grid grid-cols-2 gap-4 px-8 pb-4 shrink-0">
          {options.map((option, i) => renderOption(option, i))}
        </div>
      )}

      {layout === '4-column' && (
        <div className="flex flex-row gap-3 px-8 pb-4 shrink-0">
          {options.map((option, i) => renderOption(option, i))}
        </div>
      )}

      {layout === 'vertical' && (
        <div className="flex flex-row px-8 pb-4 gap-6 flex-1 min-h-0">
          {/* Question text — left 2/3 */}
          <div className="w-2/3 flex items-center">
            <h2 className="text-5xl font-black text-white text-start leading-tight">{text}</h2>
          </div>
          {/* Options — right 1/3 */}
          <div className="w-1/3 flex flex-col gap-3 justify-center">
            {options.map((option, i) => renderOption(option, i))}
          </div>
        </div>
      )}
    </div>
  )
}
