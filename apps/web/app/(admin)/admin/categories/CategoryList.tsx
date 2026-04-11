'use client'

import { useState, useTransition } from 'react'
import { createCategory, renameCategory, archiveCategory, unarchiveCategory } from './actions'

type CategoryWithCount = {
  id: string
  name: string
  slug: string
  archived: boolean
  createdAt: Date
  _count: { questions: number }
}

export function CategoryList({ categories }: { categories: CategoryWithCount[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {showCreate ? 'إلغاء' : 'فئة جديدة'}
      </button>

      {showCreate && (
        <form
          action={(formData) => {
            startTransition(async () => {
              await createCategory(formData)
              setShowCreate(false)
            })
          }}
          className="bg-white rounded-xl shadow p-4 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة</label>
            <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="مثال: جغرافيا" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">المعرف (slug)</label>
            <input name="slug" required dir="ltr" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. geography" />
          </div>
          <button type="submit" disabled={isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            إضافة
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الاسم</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المعرف</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الأسئلة</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className={cat.archived ? 'bg-gray-50 opacity-60' : ''}>
                <td className="px-4 py-3">
                  {editingId === cat.id ? (
                    <form
                      action={(formData) => {
                        startTransition(async () => {
                          await renameCategory(cat.id, formData)
                          setEditingId(null)
                        })
                      }}
                      className="flex gap-2"
                    >
                      <input name="name" defaultValue={cat.name} required className="px-2 py-1 border border-gray-300 rounded" />
                      <button type="submit" disabled={isPending} className="text-green-600 text-sm font-medium">حفظ</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 text-sm">إلغاء</button>
                    </form>
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500" dir="ltr">{cat.slug}</td>
                <td className="px-4 py-3 text-sm">{cat._count.questions}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${cat.archived ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {cat.archived ? 'مؤرشفة' : 'نشطة'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2 space-x-reverse">
                  {!cat.archived && (
                    <>
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => startTransition(() => archiveCategory(cat.id))}
                        disabled={isPending}
                        className="text-red-600 text-sm font-medium hover:underline"
                      >
                        أرشفة
                      </button>
                    </>
                  )}
                  {cat.archived && (
                    <button
                      onClick={() => startTransition(() => unarchiveCategory(cat.id))}
                      disabled={isPending}
                      className="text-green-600 text-sm font-medium hover:underline"
                    >
                      استعادة
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="text-center text-gray-500 py-8">لا توجد فئات بعد</p>
        )}
      </div>
    </div>
  )
}
