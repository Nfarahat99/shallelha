'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gap-4 p-6"
    >
      <h1 className="text-xl font-bold text-red-600">حدث خطأ</h1>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl min-h-[44px] hover:bg-indigo-700 transition-colors"
      >
        حاول مجددا
      </button>
    </div>
  )
}
