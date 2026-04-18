'use client'

import { useState, useTransition } from 'react'
import { generateQuestionsAction } from './ai-actions'

type Category = { id: string; name: string }

interface Props {
  categories: Category[]
  onClose: () => void
}

export function AiGenerateDialog({ categories, onClose }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [count, setCount] = useState(5)
  const [result, setResult] = useState<{ created: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    startTransition(async () => {
      try {
        const data = await generateQuestionsAction(categoryId, count)
        setResult({ created: data.created })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'فشل التوليد — حاول مجدداً')
      }
    })
  }

  return (
    // Backdrop — clicking outside the card closes dialog
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-6 py-4 flex items-center justify-between">
          <h2 id="ai-dialog-title" className="text-lg font-bold text-white">
            توليد أسئلة بالذكاء الاصطناعي
          </h2>
          <button
            onClick={onClose}
            className="text-brand-200 hover:text-white transition-colors"
            aria-label="إغلاق"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
          {/* Category select */}
          <div>
            <label htmlFor="ai-category" className="block text-sm font-medium text-gray-700 mb-1.5">
              الفئة
            </label>
            <select
              id="ai-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Count picker */}
          <div>
            <label htmlFor="ai-count" className="block text-sm font-medium text-gray-700 mb-1.5">
              عدد الأسئلة ({count})
            </label>
            <input
              id="ai-count"
              type="range"
              min={5}
              max={10}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-brand-600"
              disabled={isPending}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div role="alert" className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success state */}
          {result && (
            <div
              role="status"
              className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium"
            >
              تم توليد {result.created} سؤال — ستظهر في قائمة المراجعة أدناه
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {result ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors min-h-[44px]"
              >
                موافق
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isPending || !categoryId}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      {/* Inline spinner — animate-spin is Tailwind built-in */}
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      جارٍ التوليد...
                    </>
                  ) : (
                    'توليد الأسئلة'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[44px] disabled:opacity-50"
                >
                  إلغاء
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
