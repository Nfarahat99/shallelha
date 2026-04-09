'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length === 4) {
      router.push(`/join/${trimmed}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">شعللها</h1>
        <p className="text-gray-500">أدخل كود الغرفة للانضمام</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="ABCD"
          maxLength={4}
          autoFocus
          dir="ltr"
          className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-center text-3xl font-bold uppercase tracking-widest placeholder:text-gray-300 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={code.length !== 4}
          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          انضم
        </button>
      </form>
    </main>
  )
}
