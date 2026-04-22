'use client'

import { useTransition } from 'react'
import { archiveDrawingPrompt, restoreDrawingPrompt } from './actions'

type DrawingPromptRow = {
  id: string
  text: string
  category: string
  difficulty: string
  timesUsed: number
  archived: boolean
}

const difficultyLabels: Record<string, { label: string; className: string }> = {
  easy: { label: 'سهل', className: 'bg-green-100 text-green-700' },
  medium: { label: 'متوسط', className: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'صعب', className: 'bg-red-100 text-red-700' },
}

export function DrawingPromptList({ prompts }: { prompts: DrawingPromptRow[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden" dir="rtl">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الكلمة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الفئة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الصعوبة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">مرات الاستخدام</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {prompts.map((p) => {
            const diffInfo = difficultyLabels[p.difficulty] || difficultyLabels.medium
            return (
              <tr key={p.id} className={p.archived ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{p.text}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${diffInfo.className}`}>
                    {diffInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-center">{p.timesUsed}</td>
                <td className="px-4 py-3">
                  {p.archived ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                      مؤرشف
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      نشط
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 space-x-2 space-x-reverse">
                  {p.archived ? (
                    <button
                      onClick={() => startTransition(() => restoreDrawingPrompt(p.id))}
                      disabled={isPending}
                      className="text-green-600 text-sm font-medium hover:underline disabled:opacity-50"
                    >
                      استعادة
                    </button>
                  ) : (
                    <button
                      onClick={() => startTransition(() => archiveDrawingPrompt(p.id))}
                      disabled={isPending}
                      className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
                    >
                      أرشفة
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {prompts.length === 0 && (
        <p className="text-center text-gray-500 py-8">لا توجد كلمات مطابقة</p>
      )}
    </div>
  )
}
