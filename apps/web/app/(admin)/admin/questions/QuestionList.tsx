'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { deleteQuestion, approveQuestion, revertToDraft } from './actions'

type QuestionWithCategory = {
  id: string
  text: string
  type: string
  status: string
  category: { name: string; slug: string }
  timesPlayed: number
  timesAnsweredWrong: number
  createdAt: Date
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: 'مسودة', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'معتمد', className: 'bg-green-100 text-green-700' },
  live: { label: 'مباشر', className: 'bg-blue-100 text-blue-700' },
}

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'اختيار متعدد',
  MEDIA_GUESSING: 'تخمين وسائط',
  FREE_TEXT: 'نص حر',
}

export function QuestionList({ questions }: { questions: QuestionWithCategory[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">السؤال</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">النوع</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الفئة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {questions.map((q) => {
            const statusInfo = statusLabels[q.status] || statusLabels.draft
            return (
              <tr key={q.id}>
                <td className="px-4 py-3">
                  <span className="font-medium line-clamp-1">{q.text}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {typeLabels[q.type] || q.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{q.category.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2 space-x-reverse">
                  <Link
                    href={`/admin/questions/${q.id}`}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    تعديل
                  </Link>
                  {q.status === 'draft' && (
                    <button
                      onClick={() => startTransition(() => approveQuestion(q.id))}
                      disabled={isPending}
                      className="text-green-600 text-sm font-medium hover:underline"
                    >
                      اعتماد
                    </button>
                  )}
                  {q.status === 'approved' && (
                    <button
                      onClick={() => startTransition(() => revertToDraft(q.id))}
                      disabled={isPending}
                      className="text-yellow-600 text-sm font-medium hover:underline"
                    >
                      إرجاع للمسودة
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
                        startTransition(() => deleteQuestion(q.id))
                      }
                    }}
                    disabled={isPending}
                    className="text-red-600 text-sm font-medium hover:underline"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {questions.length === 0 && (
        <p className="text-center text-gray-500 py-8">لا توجد أسئلة مطابقة</p>
      )}
    </div>
  )
}
