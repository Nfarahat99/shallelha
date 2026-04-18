'use client'

import { useState } from 'react'
import { AiDraftReviewer } from './AiDraftReviewer'

export interface PackQuestionInput {
  text: string
  type: 'MULTIPLE_CHOICE' | 'FREE_TEXT'
  options: string[]
  correctIndex: number | null
  order: number
}

interface PackQuestionEditorProps {
  initialQuestions?: PackQuestionInput[]
  onChange: (questions: PackQuestionInput[]) => void
  language?: string
}

function createEmptyQuestion(order: number): PackQuestionInput {
  return {
    text: '',
    type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correctIndex: 0,
    order,
  }
}

export function PackQuestionEditor({
  initialQuestions,
  onChange,
  language = 'ar',
}: PackQuestionEditorProps) {
  const [questions, setQuestions] = useState<PackQuestionInput[]>(
    initialQuestions ?? [],
  )
  const [showAiReviewer, setShowAiReviewer] = useState(false)

  function update(next: PackQuestionInput[]) {
    const reordered = next.map((q, i) => ({ ...q, order: i }))
    setQuestions(reordered)
    onChange(reordered)
  }

  function addQuestion() {
    update([...questions, createEmptyQuestion(questions.length)])
  }

  function removeQuestion(index: number) {
    update(questions.filter((_, i) => i !== index))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...questions]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    update(next)
  }

  function moveDown(index: number) {
    if (index === questions.length - 1) return
    const next = [...questions]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    update(next)
  }

  function updateQuestionField(
    index: number,
    field: keyof PackQuestionInput,
    value: unknown,
  ) {
    const next = questions.map((q, i) =>
      i === index ? { ...q, [field]: value } : q,
    )
    update(next)
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q
      const opts = [...q.options]
      opts[optIndex] = value
      return { ...q, options: opts }
    })
    update(next)
  }

  function handleAiAccept(aiQuestions: PackQuestionInput[]) {
    update([...questions, ...aiQuestions])
    setShowAiReviewer(false)
  }

  const isUnderMinimum = questions.length < 5

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold ${
              isUnderMinimum ? 'text-red-400' : 'text-emerald-400'
            }`}
            aria-live="polite"
          >
            {questions.length} سؤال
            {isUnderMinimum && (
              <span className="mr-1 text-red-400/80">(الحد الأدنى ٥ للتقديم)</span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAiReviewer((v) => !v)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-600/20 px-4 py-2 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-600/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-expanded={showAiReviewer}
          aria-controls="ai-draft-reviewer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          توليد بالذكاء الاصطناعي
        </button>
      </div>

      {/* AI Draft Reviewer */}
      {showAiReviewer && (
        <div id="ai-draft-reviewer">
          <AiDraftReviewer
            language={language as 'ar' | 'en' | 'both'}
            onAccept={handleAiAccept}
            onClose={() => setShowAiReviewer(false)}
          />
        </div>
      )}

      {/* Question cards */}
      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-gray-900/30 p-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 h-10 w-10 text-white/20" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-slate-500">لا توجد أسئلة بعد — أضف أسئلة يدوياً أو استخدم الذكاء الاصطناعي</p>
        </div>
      ) : (
        <ol className="space-y-4" aria-label="قائمة الأسئلة">
          {questions.map((q, qIdx) => (
            <li
              key={qIdx}
              className="rounded-xl border border-white/10 bg-gray-900/50 p-4"
            >
              {/* Question header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">
                  {qIdx + 1}
                </span>

                {/* Move up/down */}
                <div className="flex gap-1" role="group" aria-label="ترتيب السؤال">
                  <button
                    type="button"
                    onClick={() => moveUp(qIdx)}
                    disabled={qIdx === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    aria-label="تحريك السؤال للأعلى"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(qIdx)}
                    disabled={qIdx === questions.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    aria-label="تحريك السؤال للأسفل"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 transition-colors hover:border-red-500/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label={`حذف السؤال ${qIdx + 1}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>

              {/* Question text */}
              <div className="mb-3">
                <label
                  htmlFor={`q-text-${qIdx}`}
                  className="mb-1.5 block text-xs font-semibold text-slate-400"
                >
                  نص السؤال <span className="text-red-400" aria-hidden="true">*</span>
                </label>
                <textarea
                  id={`q-text-${qIdx}`}
                  dir="rtl"
                  rows={2}
                  value={q.text}
                  onChange={(e) => updateQuestionField(qIdx, 'text', e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                  required
                  className="w-full resize-none rounded-lg border border-white/10 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-brand-500/50 focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  aria-required="true"
                />
              </div>

              {/* Options */}
              <fieldset className="mb-3">
                <legend className="mb-2 text-xs font-semibold text-slate-400">
                  الخيارات (الإجابة الصحيحة مُحددة)
                </legend>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-correct-${qIdx}`}
                        id={`q-${qIdx}-opt-${optIdx}-radio`}
                        checked={q.correctIndex === optIdx}
                        onChange={() => updateQuestionField(qIdx, 'correctIndex', optIdx)}
                        className="h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
                        aria-label={`تحديد الخيار ${optIdx + 1} كإجابة صحيحة`}
                      />
                      <input
                        type="text"
                        id={`q-${qIdx}-opt-${optIdx}`}
                        dir="rtl"
                        value={opt}
                        onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                        placeholder={`الخيار ${optIdx + 1}`}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
                          q.correctIndex === optIdx
                            ? 'border-emerald-500/40 bg-emerald-900/20 focus:border-emerald-500/60 focus:ring-emerald-500/30'
                            : 'border-white/10 bg-gray-800/60 focus:border-brand-500/50 focus:ring-brand-500/30'
                        }`}
                        aria-label={`نص الخيار ${optIdx + 1}${q.correctIndex === optIdx ? ' — الإجابة الصحيحة' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}

      {/* Add question button */}
      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-gray-900/30 text-sm font-semibold text-slate-400 transition-colors hover:border-brand-500/40 hover:bg-gray-900/50 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        إضافة سؤال
      </button>
    </div>
  )
}
