'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PackQuestionEditor } from './PackQuestionEditor'
import type { PackQuestionInput } from './PackQuestionEditor'
import { createPack, submitPackForReview } from '@/app/packs/create/actions'
import { updatePack } from '@/app/packs/[packId]/edit/actions'

const CATEGORIES = [
  'ثقافة عامة',
  'تاريخ',
  'جغرافيا',
  'رياضة',
  'فن وترفيه',
  'علوم وتكنولوجيا',
  'أدب وشعر',
  'دين وحضارة',
  'طبخ وطعام',
  'سياسة',
  'أخرى',
]

const LANGUAGES = [
  { value: 'ar', label: 'عربي' },
  { value: 'en', label: 'إنجليزي' },
  { value: 'both', label: 'عربي وإنجليزي' },
]

const DIFFICULTIES = [
  { value: '', label: 'غير محدد' },
  { value: 'EASY', label: 'سهل' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HARD', label: 'صعب' },
]

interface PackCreatorClientProps {
  userId: string
  // Edit mode props
  editPackId?: string
  initialName?: string
  initialDescription?: string
  initialCategory?: string
  initialLanguage?: string
  initialDifficulty?: string
  initialQuestions?: PackQuestionInput[]
}

export function PackCreatorClient({
  userId,
  editPackId,
  initialName = '',
  initialDescription = '',
  initialCategory = '',
  initialLanguage = 'ar',
  initialDifficulty = '',
  initialQuestions = [],
}: PackCreatorClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [category, setCategory] = useState(initialCategory)
  const [language, setLanguage] = useState(initialLanguage)
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [questions, setQuestions] = useState<PackQuestionInput[]>(initialQuestions)

  const [error, setError] = useState<string | null>(null)
  const [savedPackId, setSavedPackId] = useState<string | null>(editPackId ?? null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const isEditMode = Boolean(editPackId)
  const isSaveDisabled = isPending || !name.trim() || !category.trim()

  async function handleSave() {
    setError(null)
    startTransition(async () => {
      if (isEditMode && savedPackId) {
        const result = await updatePack(
          savedPackId,
          { name, description, category, language, difficulty },
          questions,
        )
        if ('error' in result) {
          setError(result.error)
        } else {
          router.push('/packs/my-packs')
        }
      } else {
        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)
        formData.set('category', category)
        formData.set('language', language)
        formData.set('difficulty', difficulty)

        const result = await createPack(formData, questions)
        if ('error' in result) {
          setError(result.error)
        } else if ('packId' in result) {
          setSavedPackId(result.packId as string)
          // Stay on page so they can submit for review
        }
      }
    })
  }

  async function handleSubmitForReview() {
    if (!savedPackId) {
      setSubmitError('يجب حفظ الباقة أولاً قبل التقديم للمراجعة')
      return
    }
    if (questions.length < 5) {
      setSubmitError('يجب إضافة 5 أسئلة على الأقل قبل التقديم للمراجعة')
      return
    }
    setSubmitError(null)
    startTransition(async () => {
      const result = await submitPackForReview(savedPackId)
      if ('error' in result) {
        setSubmitError(result.error)
      } else {
        setSubmitSuccess(true)
        setTimeout(() => router.push('/packs/my-packs'), 1500)
      }
    })
  }

  if (submitSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/20 px-6 py-10 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 h-12 w-12 text-emerald-400" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className="mb-1 text-xl font-bold text-emerald-400">تم تقديم الباقة للمراجعة</h2>
        <p className="text-sm text-slate-400">سيتم مراجعتها خلال 24-48 ساعة</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pack metadata card */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
          بيانات الباقة
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="pack-name" className="mb-1.5 block text-sm font-semibold text-slate-300">
              اسم الباقة <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="pack-name"
              type="text"
              dir="rtl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="مثال: أفلام مصرية التسعينات"
              required
              className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-brand-500/50 focus:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
            <p className="mt-1 text-end text-xs text-slate-500">{name.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pack-description" className="mb-1.5 block text-sm font-semibold text-slate-300">
              وصف الباقة
            </label>
            <textarea
              id="pack-description"
              dir="rtl"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="وصف مختصر للباقة..."
              className="w-full resize-none rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-brand-500/50 focus:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
          </div>

          {/* Category + Language row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pack-category" className="mb-1.5 block text-sm font-semibold text-slate-300">
                الفئة <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <select
                id="pack-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              >
                <option value="">اختر الفئة</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pack-language" className="mb-1.5 block text-sm font-semibold text-slate-300">
                لغة الأسئلة
              </label>
              <select
                id="pack-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              >
                {LANGUAGES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="pack-difficulty" className="mb-1.5 block text-sm font-semibold text-slate-300">
              مستوى الصعوبة
            </label>
            <select
              id="pack-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            >
              {DIFFICULTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Question editor */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
          الأسئلة
        </h2>
        <PackQuestionEditor
          initialQuestions={initialQuestions}
          onChange={setQuestions}
          language={language as 'ar' | 'en' | 'both'}
        />
      </section>

      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit review error */}
      {submitError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {submitError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Save draft */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="flex min-h-[48px] items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {isPending ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 animate-spin shrink-0" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              جاري الحفظ...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isEditMode ? 'حفظ التعديلات' : 'حفظ كمسودة'}
            </>
          )}
        </button>

        {/* Submit for review */}
        <button
          type="button"
          onClick={handleSubmitForReview}
          disabled={isPending || questions.length < 5 || !savedPackId}
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/50 transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          تقديم للمراجعة
          {questions.length < 5 && (
            <span className="mr-1 text-xs opacity-75">({questions.length}/5)</span>
          )}
        </button>
      </div>
    </div>
  )
}
