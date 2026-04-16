import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
    >
      <h1 className="text-xl font-bold text-gray-700">الصفحة غير موجودة</h1>
      <Link href="/" className="text-indigo-600 underline">
        الصفحة الرئيسية
      </Link>
    </div>
  )
}
