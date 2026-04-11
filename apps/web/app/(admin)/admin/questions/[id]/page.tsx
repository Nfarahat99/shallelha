import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { QuestionForm } from '../../new-question/QuestionForm'
import { updateQuestion } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string }
}) {
  const [question, categories] = await Promise.all([
    prisma.question.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({
      where: { archived: false },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!question) notFound()

  const boundAction = async (formData: FormData) => {
    'use server'
    await updateQuestion(params.id, formData)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">تعديل السؤال</h1>
      <QuestionForm
        categories={categories}
        initialData={{
          id: question.id,
          text: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          categoryId: question.categoryId,
          type: question.type,
          mediaUrl: question.mediaUrl,
          timerDuration: question.timerDuration,
        }}
        action={boundAction}
      />
    </div>
  )
}
