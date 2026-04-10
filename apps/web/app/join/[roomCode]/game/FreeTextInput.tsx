'use client'

import { useState } from 'react'

interface FreeTextInputProps {
  questionText: string
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function FreeTextInput({ questionText, onSubmit, disabled = false }: FreeTextInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed.length === 0 || disabled) return
    onSubmit(trimmed)
  }

  const canSubmit = text.trim().length > 0 && !disabled

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Question text */}
      <p className="text-xl font-bold text-gray-900 text-start leading-relaxed font-[family-name:var(--font-cairo)]">
        {questionText}
      </p>

      {/* Textarea */}
      <div className="flex flex-col gap-1">
        <textarea
          dir="rtl"
          lang="ar"
          inputMode="text"
          maxLength={80}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="اكتب إجابتك هنا…"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold bg-gray-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-[family-name:var(--font-cairo)] resize-none disabled:opacity-50"
        />
        {/* Character count */}
        <p className="text-xs text-gray-400 text-end">{text.length}/80</p>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full rounded-xl px-6 py-4 text-lg font-bold text-white transition-colors min-h-[80px] font-[family-name:var(--font-cairo)] ${
          canSubmit
            ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            : 'bg-gray-700 opacity-40 cursor-not-allowed'
        }`}
      >
        أرسل
      </button>
    </div>
  )
}
