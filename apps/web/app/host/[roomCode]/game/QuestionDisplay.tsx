'use client'

import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { MediaQuestion } from './MediaQuestion'
import { FreeTextFeed } from './FreeTextFeed'
import { HostDrawingView } from './HostDrawingView'
import { HostBluffingView } from './HostBluffingView'

interface QuestionDisplayProps {
  text: string
  options: string[]
  layout: '2x2' | '4-column' | 'vertical'
  revealed: boolean
  correctIndex: number | null
  questionIndex: number
  total: number
  type?: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT' | 'DRAWING' | 'BLUFFING'
  mediaUrl?: string
  timerDuration?: number
  freeTextAnswers?: Array<{ playerId: string; emoji: string; text: string }>
  /** Answer count progress — how many players have answered the current question */
  answerCount?: number
  /** Total active player count for progress display */
  playerCount?: number
  /** Room code — needed for Drawing game socket events */
  roomCode?: string
  /** Drawing prompt text shown to host */
  drawingPromptText?: string
}

const OPTION_COLORS = [
  { glass: 'bg-indigo-500/20 border-indigo-400/50 hover:bg-indigo-500/30', badge: 'bg-indigo-500 text-white', text: 'text-white' },
  { glass: 'bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30', badge: 'bg-purple-500 text-white', text: 'text-white' },
  { glass: 'bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30', badge: 'bg-cyan-500 text-white', text: 'text-white' },
  { glass: 'bg-rose-500/20 border-rose-400/50 hover:bg-rose-500/30', badge: 'bg-rose-500 text-white', text: 'text-white' },
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
  freeTextAnswers,
  answerCount,
  playerCount,
  roomCode,
  drawingPromptText,
}: QuestionDisplayProps) {
  const reducedMotion = useReducedMotion() ?? false

  const renderOption = (option: string, index: number) => {
    const color = OPTION_COLORS[index] ?? { glass: 'bg-white/10 border-white/20 hover:bg-white/15', badge: 'bg-gray-600 text-white', text: 'text-white' }
    const isCorrect = revealed && correctIndex === index
    const animProps = getRevealAnimation(index, correctIndex, revealed, reducedMotion)

    const correctOverlay = isCorrect
      ? 'bg-green-500/30 border-green-400/70 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
      : ''
    const baseGlass = `backdrop-blur-xl border ${color.glass} ${color.text}`

    return (
      <m.div
        key={index}
        animate={animProps}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {layout === '2x2' && (
          <div
            className={`relative rounded-2xl flex items-center justify-center min-h-[20vh] text-[28px] font-bold text-center p-6 transition-colors ${baseGlass} ${correctOverlay}`}
          >
            <span className={`absolute top-3 start-3 text-sm font-bold px-2 py-0.5 rounded-lg ${color.badge}`}>{ARABIC_LETTERS[index]}</span>
            <span>{option}</span>
            {isCorrect && (
              <span className="absolute bottom-3 end-3 text-xs font-bold text-green-300 bg-green-500/20 px-2 py-1 rounded-lg border border-green-400/30">✓ إجابة صحيحة!</span>
            )}
          </div>
        )}
        {layout === '4-column' && (
          <div
            className={`flex-1 rounded-xl min-h-[80px] flex flex-col items-center justify-center text-xl font-bold p-4 gap-2 transition-colors ${baseGlass} ${correctOverlay}`}
          >
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${color.badge}`}>{ARABIC_LETTERS[index]}</span>
            <span className="text-center">{option}</span>
            {isCorrect && <span className="text-xs font-bold text-green-300">✓ إجابة صحيحة!</span>}
          </div>
        )}
        {layout === 'vertical' && (
          <div
            className={`rounded-xl py-4 px-6 flex items-center gap-3 text-xl font-bold transition-colors ${baseGlass} ${correctOverlay}`}
          >
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${color.badge}`}>{ARABIC_LETTERS[index]}</span>
            <span className="flex-1">{option}</span>
            {isCorrect && <span className="text-xs font-bold text-green-300 shrink-0">✓</span>}
          </div>
        )}
      </m.div>
    )
  }

  // DRAWING branch — host sees live canvas + prompt
  if (type === 'DRAWING' && roomCode) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-8 pt-4 pb-2 shrink-0">
          <span className="text-2xl font-semibold text-gray-300">
            سؤال {questionIndex + 1} من {total}
          </span>
        </div>
        <div className="flex-1 px-8 pb-4 min-h-0">
          <HostDrawingView
            promptText={drawingPromptText ?? text}
            roomCode={roomCode}
            onReveal={() => {}}
          />
        </div>
      </div>
    )
  }

  // BLUFFING branch — host sees submission progress + lock button + results
  if (type === 'BLUFFING') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-8 pt-4 pb-2 shrink-0">
          <span className="text-2xl font-semibold text-gray-300">
            سؤال {questionIndex + 1} من {total}
          </span>
        </div>
        <div className="flex-1 px-8 pb-4 min-h-0">
          <HostBluffingView question={{ text }} />
        </div>
      </div>
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

  // FREE_TEXT branch — question text + live answer feed
  if (type === 'FREE_TEXT') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Question counter */}
        <div className="px-8 pt-4 pb-2 shrink-0">
          <span className="text-2xl font-semibold text-gray-300">
            سؤال {questionIndex + 1} من {total}
          </span>
        </div>
        {/* Question text */}
        <div className="flex items-center justify-center px-16 py-4 shrink-0">
          <h2 className="text-5xl font-black text-white text-start leading-tight">{text}</h2>
        </div>
        {/* Live answer feed */}
        <div className="flex-1 px-8 pb-4 overflow-hidden">
          <FreeTextFeed answers={freeTextAnswers ?? []} />
        </div>
      </div>
    )
  }

  // MULTIPLE_CHOICE (default)
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Question counter + answer progress */}
      <div className="px-8 pt-4 pb-2 shrink-0 flex items-center justify-between">
        <span className="text-2xl font-semibold text-gray-300">
          سؤال {questionIndex + 1} من {total}
        </span>
        {!revealed && typeof answerCount === 'number' && typeof playerCount === 'number' && playerCount > 0 && (
          <span className="text-lg text-white/50" dir="rtl">
            {answerCount.toLocaleString('ar-EG')} من {playerCount.toLocaleString('ar-EG')} أجابوا
          </span>
        )}
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
