'use client'

import { useTransition, useRef } from 'react'
import { createDrawingPrompt } from './actions'

const CATEGORIES = [
  { value: 'حيوانات', label: 'حيوانات' },
  { value: 'رياضة', label: 'رياضة' },
  { value: 'طعام', label: 'طعام' },
  { value: 'مشاهير', label: 'مشاهير' },
  { value: 'مواصلات', label: 'مواصلات' },
  { value: 'طبيعة', label: 'طبيعة' },
  { value: 'مهن', label: 'مهن' },
  { value: 'أشياء', label: 'أشياء' },
]

const DIFFICULTIES = [
  { value: 'easy', label: 'سهل' },
  { value: 'medium', label: 'متوسط' },
  { value: 'hard', label: 'صعب' },
]

export function DrawingPromptForm() {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAction(formData: FormData) {
    startTransition(async () => {
      try {
        await createDrawingPrompt(formData)
        formRef.current?.reset()
      } catch (err) {
        alert((err as Error).message)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6" dir="rtl">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">إضافة كلمة جديدة</h2>
      <form ref={formRef} action={handleAction} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="dp-text" className="text-sm font-medium text-gray-700">
            الكلمة
          </label>
          <input
            id="dp-text"
            name="text"
            type="text"
            required
            placeholder="مثال: قطة"
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dp-category" className="text-sm font-medium text-gray-700">
            الفئة
          </label>
          <select
            id="dp-category"
            name="category"
            required
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">اختر فئة</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dp-difficulty" className="text-sm font-medium text-gray-700">
            الصعوبة
          </label>
          <select
            id="dp-difficulty"
            name="difficulty"
            defaultValue="medium"
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {isPending ? 'جارٍ الإضافة...' : 'إضافة كلمة'}
        </button>
      </form>
    </div>
  )
}
