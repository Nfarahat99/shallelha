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
      <p className="text-xl font-bold text-white text-start leading-relaxed font-[family-name:var(--font-cairo)]">
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
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-base font-semibold bg-white/10 text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-[family-name:var(--font-cairo)] resize-none disabled:opacity-50"
        />
        {/* Character count */}
        <p className="text-xs text-white/40 text-end">{text.length}/80</p>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full rounded-xl px-6 py-4 text-lg font-bold text-white transition-colors min-h-[80px] font-[family-name:var(--font-cairo)] ${
          canSubmit
            ? 'bg-brand-600 hover:bg-brand-500 active:bg-brand-700'
            : 'bg-white/10 opacity-40 cursor-not-allowed'
        }`}
      >
        أرسل
      </button>
    </div>
  )
}
