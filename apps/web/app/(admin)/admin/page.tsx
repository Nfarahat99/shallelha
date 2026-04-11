import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [categoryCount, questionCount, approvedCount, draftCount] = await Promise.all([
    prisma.category.count({ where: { archived: false } }),
    prisma.question.count(),
    prisma.question.count({ where: { status: 'approved' } }),
    prisma.question.count({ where: { status: 'draft' } }),
  ])

  const stats = [
    { label: 'الفئات النشطة', value: categoryCount },
    { label: 'إجمالي الأسئلة', value: questionCount },
    { label: 'أسئلة معتمدة', value: approvedCount },
    { label: 'أسئلة مسودة', value: draftCount },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">لوحة المعلومات</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
