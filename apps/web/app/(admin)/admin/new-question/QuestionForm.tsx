'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string }

type QuestionData = {
  id?: string
  text: string
  options: string[]
  correctIndex: number
  categoryId: string
  type: string
  mediaUrl: string | null
  timerDuration: number
}

export function QuestionForm({
  categories,
  initialData,
  action,
}: {
  categories: Category[]
  initialData?: QuestionData
  action: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState(initialData?.type || 'MULTIPLE_CHOICE')
  const [options, setOptions] = useState<string[]>(initialData?.options || ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(initialData?.correctIndex || 0)
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'فشل رفع الملف')
        return
      }

      setMediaUrl(data.url)
    } catch {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set('options', JSON.stringify(options))
    formData.set('correctIndex', String(correctIndex))
    formData.set('type', type)
    if (mediaUrl) formData.set('mediaUrl', mediaUrl)

    startTransition(async () => {
      try {
        await action(formData)
        router.push('/admin/questions')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ')
      }
    })
  }

  const showOptions = type === 'MULTIPLE_CHOICE' || type === 'MEDIA_GUESSING'

  return (
    <form action={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6 max-w-2xl">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نوع السؤال</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="MULTIPLE_CHOICE">اختيار متعدد</option>
          <option value="MEDIA_GUESSING">تخمين وسائط</option>
          <option value="FREE_TEXT">نص حر</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نص السؤال</label>
        <textarea
          name="text"
          required
          defaultValue={initialData?.text || ''}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
          placeholder="أدخل نص السؤال..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
        <select
          name="categoryId"
          required
          defaultValue={initialData?.categoryId || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="">اختر فئة</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">مدة المؤقت (ثوانٍ)</label>
        <input
          name="timerDuration"
          type="number"
          min={5}
          max={60}
          defaultValue={initialData?.timerDuration || 20}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {showOptions && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">الخيارات (4 خيارات)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctRadio"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                className="w-4 h-4"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const updated = [...options]
                  updated[i] = e.target.value
                  setOptions(updated)
                }}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={`الخيار ${i + 1}`}
              />
              {correctIndex === i && (
                <span className="text-green-600 text-xs font-medium">الصحيح</span>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500">اختر الإجابة الصحيحة بالضغط على الدائرة</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">وسائط (اختياري)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg"
          onChange={handleUpload}
          disabled={uploading}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && <p className="text-sm text-blue-600 mt-1">جارٍ الرفع...</p>}
        {mediaUrl && (
          <div className="mt-2">
            <p className="text-sm text-green-600">تم الرفع بنجاح</p>
            <input type="hidden" name="mediaUrl" value={mediaUrl} />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'جارٍ الحفظ...' : initialData?.id ? 'تحديث السؤال' : 'إنشاء السؤال'}
      </button>
    </form>
  )
}
