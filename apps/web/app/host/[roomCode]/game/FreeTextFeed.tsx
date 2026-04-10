'use client'

import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'

interface FreeTextFeedProps {
  answers: Array<{ playerId: string; emoji: string; text: string }>
}

export function FreeTextFeed({ answers }: FreeTextFeedProps) {
  const prefersReducedMotion = useReducedMotion() ?? false

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Answer count indicator */}
      <p className="text-sm text-gray-400">
        {answers.length} إجابة مستلمة
      </p>

      {/* Scrollable answer list */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh]">
        {answers.length === 0 ? (
          <p className="text-gray-400 text-center py-6">في انتظار إجابات اللاعبين…</p>
        ) : (
          <AnimatePresence initial={false}>
            {answers.map(({ playerId, emoji, text }) => (
              <m.div
                key={playerId}
                initial={prefersReducedMotion ? { opacity: 0 } : { x: -20, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3"
              >
                <span className="text-2xl shrink-0">{emoji}</span>
                <span
                  className="text-[32px] font-semibold text-white text-start leading-relaxed font-[family-name:var(--font-cairo)]"
                >
                  {text}
                </span>
              </m.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
