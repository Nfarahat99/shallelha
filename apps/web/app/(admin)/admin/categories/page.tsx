import { prisma } from '@/lib/prisma'
import { CategoryList } from './CategoryList'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إدارة الفئات</h1>
      <CategoryList categories={categories} />
    </div>
  )
}
