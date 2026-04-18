'use client'

import { useState } from 'react'
import type { PackQuestionInput } from './PackQuestionEditor'

interface AiDraftQuestion {
  text: string
  options: string[]
  correctIndex: number
}

interface AiDraftReviewerProps {
  language: 'ar' | 'en' | 'both'
  onAccept: (questions: PackQuestionInput[]) => void
  onClose: () => void
}

export function AiDraftReviewer({ language, onAccept, onClose }: AiDraftReviewerProps) {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<AiDraftQuestion[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editedDrafts, setEditedDrafts] = useState<AiDraftQuestion[]>([])

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('يرجى كتابة موضوع لتوليد الأسئلة')
      return
    }
    setLoading(true)
    setError(null)
    setDrafts(null)

    try {
      const res = await fetch('/api/ai/pack-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count, language }),
      })

      if (res.status === 429) {
        setError('لقد وصلت إلى الحد الأقصى للتوليد — انتظر ساعة ثم حاول مجدداً')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'فشل توليد الأسئلة، حاول مرة أخرى')
        return
      }

      const data = (await res.json()) as { questions: AiDraftQuestion[] }
      const questions = data.questions ?? []
      setDrafts(questions)
      setEditedDrafts(questions.map((q) => ({ ...q })))
      setSelected(new Set(questions.map((_, i) => i)))
    } catch {
      setError('فشل الاتصال بالخادم، تحقق من اتصالك وحاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(editedDrafts.map((_, i) => i)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function updateDraftText(idx: number, value: string) {
    setEditedDrafts((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, text: value } : q)),
    )
  }

  function updateDraftOption(qIdx: number, optIdx: number, value: string) {
    setEditedDrafts((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const opts = [...q.options]
        opts[optIdx] = value
        return { ...q, options: opts }
      }),
    )
  }

  function updateDraftCorrect(qIdx: number, optIdx: number) {
    setEditedDrafts((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctIndex: optIdx } : q)),
    )
  }

  function handleAccept() {
    const accepted = editedDrafts
      .filter((_, i) => selected.has(i))
      .map((q, order): PackQuestionInput => ({
        text: q.text,
        type: 'MULTIPLE_CHOICE',
        options: q.options,
        correctIndex: q.correctIndex,
        order,
      }))
    onAccept(accepted)
  }

  return (
    <div className="rounded-xl border border-brand-500/30 bg-brand-950/40 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-brand-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          توليد بالذكاء الاصطناعي
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="إغلاق"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Generation form */}
      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="ai-topic" className="mb-1.5 block text-xs font-semibold text-slate-400">
            موضوع الأسئلة <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <input
            id="ai-topic"
            type="text"
            dir="rtl"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGenerate() } }}
            placeholder="مثال: أفلام مصرية التسعينات"
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-brand-500/50 focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="ai-count" className="mb-1.5 block text-xs font-semibold text-slate-400">
              عدد الأسئلة
            </label>
            <select
              id="ai-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-gray-800/60 px-3 py-2.5 text-sm text-white transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} أسئلة</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {loading ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 animate-spin shrink-0" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                جاري التوليد...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                توليد
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Draft questions */}
      {drafts && drafts.length > 0 && (
        <div>
          {/* Selection controls */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-400">
              {selected.size} من {editedDrafts.length} مختار
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          {/* Draft cards */}
          <ol className="space-y-3" aria-label="مسودة الأسئلة">
            {editedDrafts.map((q, qIdx) => (
              <li
                key={qIdx}
                className={`rounded-xl border p-4 transition-colors ${
                  selected.has(qIdx)
                    ? 'border-brand-500/40 bg-brand-900/20'
                    : 'border-white/10 bg-gray-900/40 opacity-60'
                }`}
              >
                <div className="mb-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`draft-select-${qIdx}`}
                    checked={selected.has(qIdx)}
                    onChange={() => toggleSelect(qIdx)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
                    aria-label={`تحديد السؤال ${qIdx + 1}`}
                  />
                  <label htmlFor={`draft-select-${qIdx}`} className="sr-only">
                    تحديد السؤال {qIdx + 1}
                  </label>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">
                    {qIdx + 1}
                  </span>
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={q.text}
                    onChange={(e) => updateDraftText(qIdx, e.target.value)}
                    className="flex-1 resize-none rounded-lg border border-white/10 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500/50 focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                    aria-label={`نص السؤال ${qIdx + 1}`}
                  />
                </div>

                <fieldset className="mr-9">
                  <legend className="sr-only">خيارات السؤال {qIdx + 1}</legend>
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`draft-correct-${qIdx}`}
                          id={`draft-${qIdx}-opt-${optIdx}-radio`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateDraftCorrect(qIdx, optIdx)}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
                          aria-label={`تحديد الخيار ${optIdx + 1} كإجابة صحيحة`}
                        />
                        <input
                          type="text"
                          id={`draft-${qIdx}-opt-${optIdx}`}
                          dir="rtl"
                          value={opt}
                          onChange={(e) => updateDraftOption(qIdx, optIdx, e.target.value)}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 ${
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

          {/* Accept button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAccept}
              disabled={selected.size === 0}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              إضافة المحدد إلى الباقة ({selected.size})
            </button>
          </div>
        </div>
      )}

      {/* Empty results */}
      {drafts && drafts.length === 0 && !loading && (
        <p className="text-center text-sm text-slate-500">لم يتم توليد أسئلة، حاول بموضوع مختلف</p>
      )}
    </div>
  )
}
