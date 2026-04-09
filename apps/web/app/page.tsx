export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* RTL test: text-start should render right-aligned in Arabic RTL */}
      <h1 className="text-4xl font-bold text-start">
        شعللها
      </h1>
      <p className="text-xl text-start text-gray-600">
        أوقد المنافسة — منصة الألعاب الجماعية العربية
      </p>
      {/* Logical spacing test: ps- should add padding on the right in RTL */}
      <div className="border border-gray-200 rounded-lg ps-6 pe-4 py-4 text-start">
        <p className="text-sm text-gray-500">
          قيد الإنشاء — Phase 1 foundation
        </p>
      </div>
    </main>
  )
}
