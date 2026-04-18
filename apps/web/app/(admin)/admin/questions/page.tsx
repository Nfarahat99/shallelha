import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { QuestionList } from './QuestionList'
import { AiGenerateButton } from './AiGenerateButton'
import { ModerationQueue } from './ModerationQueue'

export const dynamic = 'force-dynamic'

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string }
}) {
  const [questions, categories, draftQuestions] = await Promise.all([
    prisma.question.findMany({
      where: {
        ...(searchParams.status ? { status: searchParams.status as any } : {}),
        ...(searchParams.category ? { categoryId: searchParams.category } : {}),
      },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { archived: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.question.findMany({
      where: { status: 'draft' },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الأسئلة</h1>
        <div className="flex gap-3">
          <AiGenerateButton categories={categories} />
          <Link
            href="/admin/new-question"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors min-h-[44px] inline-flex items-center"
          >
            سؤال جديد
          </Link>
        </div>
      </div>

      {/* Moderation Queue — AI-generated DRAFT questions awaiting review */}
      <ModerationQueue questions={draftQuestions} />

      {/* Filters */}
      <div className="flex gap-3 mb-4 mt-8">
        <form className="flex gap-3">
          <select
            name="status"
            defaultValue={searchParams.status || ''}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="approved">معتمد</option>
            <option value="live">مباشر</option>
          </select>

          <select
            name="category"
            defaultValue={searchParams.category || ''}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">جميع الفئات</option>
            {categories.map((cat: { id: string; name: string }) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            تصفية
          </button>
        </form>
      </div>

      <QuestionList questions={questions} />
    </div>
  )
}
