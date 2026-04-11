import Link from 'next/link'
import { AdminLogoutButton } from './AdminLogoutButton'

export const metadata = {
  title: 'لوحة الإدارة — شعللها',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">لوحة الإدارة</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            الرئيسية
          </Link>
          <Link
            href="/admin/categories"
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            الفئات
          </Link>
          <Link
            href="/admin/questions"
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            الأسئلة
          </Link>
        </nav>
        <div className="p-4 border-t">
          <AdminLogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
