import { prisma } from '@/lib/prisma'
import { DrawingPromptForm } from './DrawingPromptForm'
import { DrawingPromptList } from './DrawingPromptList'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['حيوانات', 'رياضة', 'طعام', 'مشاهير', 'مواصلات', 'طبيعة', 'مهن', 'أشياء']

export default async function DrawingPromptsPage({
  searchParams,
}: {
  searchParams: { showArchived?: string; category?: string; difficulty?: string }
}) {
  const showArchived = searchParams.showArchived === 'true'
  const category = searchParams.category || undefined
  const difficulty = searchParams.difficulty || undefined

  const prompts = await prisma.drawingPrompt.findMany({
    where: {
      ...(showArchived ? {} : { archived: false }),
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">كلمات الرسم</h1>
        <span className="text-sm text-gray-500">{prompts.length} كلمة</span>
      </div>

      <DrawingPromptForm />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form className="flex gap-3 flex-wrap">
          <select
            name="category"
            defaultValue={category || ''}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
          >
            <option value="">جميع الفئات</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            name="difficulty"
            defaultValue={difficulty || ''}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
          >
            <option value="">جميع المستويات</option>
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer">
            <input
              type="checkbox"
              name="showArchived"
              value="true"
              defaultChecked={showArchived}
              className="rounded"
            />
            <span className="text-sm text-gray-700">إظهار المؤرشف</span>
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            تصفية
          </button>
        </form>
      </div>

      <DrawingPromptList prompts={prompts} />
    </div>
  )
}
