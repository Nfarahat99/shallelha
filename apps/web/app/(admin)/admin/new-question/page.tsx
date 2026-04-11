import { prisma } from '@/lib/prisma'
import { QuestionForm } from './QuestionForm'
import { createQuestion } from '../questions/actions'

export const dynamic = 'force-dynamic'

export default async function NewQuestionPage() {
  const categories = await prisma.category.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">سؤال جديد</h1>
      <QuestionForm categories={categories} action={createQuestion} />
    </div>
  )
}
