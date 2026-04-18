'use client'

import { useState } from 'react'

interface PackQuestion {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'FREE_TEXT'
  options: string[]
  correctIndex: number | null
  order: number
}

const PREVIEW_COUNT = 3

export function PackQuestionPreview({ questions }: { questions: PackQuestion[] }) {
  const [expanded, setExpanded] = useState(false)
  const displayed = expanded ? questions : questions.slice(0, PREVIEW_COUNT)
  const remaining = questions.length - PREVIEW_COUNT

  return (
    <div>
      <ul className="divide-y divide-white/10" aria-label="قائمة الأسئلة">
        {displayed.map((q, idx) => (
          <li key={q.id} className="px-5 py-4">
            <p className="text-sm font-medium text-white mb-2">
              <span className="text-white/30 ml-2 font-mono tabular-nums">{idx + 1}.</span>
              {q.text}
            </p>
            {q.type === 'MULTIPLE_CHOICE' && q.options.length > 0 && (
              <ul className="grid grid-cols-2 gap-1.5" aria-label="خيارات الإجابة">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={[
                      'rounded-lg px-3 py-1.5 text-xs font-medium',
                      i === q.correctIndex
                        ? 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border border-white/10 text-white/60',
                    ].join(' ')}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
            {q.type === 'FREE_TEXT' && (
              <span className="inline-block rounded-full bg-blue-900/30 border border-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 font-medium">
                إجابة حرة
              </span>
            )}
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className="px-5 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-center text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors py-1 min-h-[44px]"
            aria-expanded={expanded}
          >
            {expanded ? 'إخفاء الأسئلة' : `اطلع على باقي الأسئلة (${remaining})`}
          </button>
        </div>
      )}
    </div>
  )
}
