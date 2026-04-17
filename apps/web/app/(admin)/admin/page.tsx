import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Icon components (inline SVG, no emoji)
function IconCategories() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  )
}
function IconQuestions() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}
function IconApproved() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconDraft() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  )
}

export default async function AdminDashboardPage() {
  const [categoryCount, questionCount, approvedCount, draftCount] = await Promise.all([
    prisma.category.count({ where: { archived: false } }),
    prisma.question.count(),
    prisma.question.count({ where: { status: 'approved' } }),
    prisma.question.count({ where: { status: 'draft' } }),
  ])

  const stats = [
    {
      label: 'الفئات النشطة',
      value: categoryCount,
      icon: <IconCategories />,
      accent: 'border-brand-500',
      iconBg: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'إجمالي الأسئلة',
      value: questionCount,
      icon: <IconQuestions />,
      accent: 'border-violet-500',
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'أسئلة معتمدة',
      value: approvedCount,
      icon: <IconApproved />,
      accent: 'border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'أسئلة مسودة',
      value: draftCount,
      icon: <IconDraft />,
      accent: 'border-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">لوحة المعلومات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة عامة على محتوى المنصة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl shadow-card p-6 border-t-4 ${stat.accent}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
