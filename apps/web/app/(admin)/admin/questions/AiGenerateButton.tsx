'use client'

import { useState } from 'react'
import { AiGenerateDialog } from './AiGenerateDialog'

type Category = { id: string; name: string }

interface Props {
  categories: Category[]
}

export function AiGenerateButton({ categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors min-h-[44px] inline-flex items-center gap-2"
        aria-label="توليد أسئلة بالذكاء الاصطناعي"
      >
        {/* Sparkle icon */}
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        توليد بالذكاء الاصطناعي
      </button>

      {open && (
        <AiGenerateDialog categories={categories} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
