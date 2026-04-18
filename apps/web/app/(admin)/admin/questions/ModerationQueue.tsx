'use client'

import { useState, useTransition } from 'react'
import { approveQuestionsAction, rejectQuestionsAction } from './ai-actions'

type DraftQuestion = {
  id: string
  text: string
  type: string
  category: { name: string }
  createdAt: Date
}

interface Props {
  questions: DraftQuestion[]
}

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'اختيار متعدد',
  MEDIA_GUESSING: 'تخمين وسائط',
  FREE_TEXT: 'نص حر',
}

export function ModerationQueue({ questions }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Return null when no drafts — no empty state needed per plan
  if (questions.length === 0) return null

  function toggleAll() {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map((q) => q.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleApprove(ids: string[]) {
    startTransition(async () => {
      await approveQuestionsAction(ids)
      setSelected(new Set())
    })
  }

  function handleReject(ids: string[]) {
    if (
      !confirm(
        `هل أنت متأكد من رفض ${ids.length > 1 ? `${ids.length} أسئلة` : 'هذا السؤال'}؟ سيتم حذفها نهائياً.`
      )
    )
      return
    startTransition(async () => {
      await rejectQuestionsAction(ids)
      setSelected(new Set())
    })
  }

  const selectedIds = Array.from(selected)

  return (
    <section className="mt-8" dir="rtl">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">قائمة المراجعة</h2>
          <p className="text-sm text-gray-500">{questions.length} سؤال في انتظار المراجعة</p>
        </div>

        {/* Batch actions — visible only when items are selected */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(selectedIds)}
              disabled={isPending}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[44px] disabled:opacity-50"
            >
              اعتماد ({selectedIds.length})
            </button>
            <button
              onClick={() => handleReject(selectedIds)}
              disabled={isPending}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-50"
            >
              رفض ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-4 py-3 text-right w-10">
                <input
                  type="checkbox"
                  checked={selected.size === questions.length && questions.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  aria-label="تحديد الكل"
                />
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السؤال</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">النوع</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الفئة</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {questions.map((q) => (
              <tr
                key={q.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selected.has(q.id) ? 'bg-amber-50/60' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggleOne(q.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    aria-label={`تحديد: ${q.text}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium line-clamp-2 text-sm">{q.text}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {typeLabels[q.type] ?? q.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{q.category.name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove([q.id])}
                      disabled={isPending}
                      className="text-emerald-600 text-sm font-medium hover:underline disabled:opacity-50"
                    >
                      اعتماد
                    </button>
                    <button
                      onClick={() => handleReject([q.id])}
                      disabled={isPending}
                      className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
                    >
                      رفض
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
