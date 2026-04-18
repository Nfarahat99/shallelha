'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { submitPackForReview } from '@/app/packs/create/actions'
import { deletePackAction } from '@/app/packs/[packId]/edit/actions'

type PackStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface PackSummary {
  id: string
  name: string
  status: PackStatus
  category: string
  language: string
  _count: { questions: number }
  createdAt: string
  updatedAt: string
}

interface MyPacksClientProps {
  packs: PackSummary[]
  userId: string
}

const STATUS_LABELS: Record<PackStatus, string> = {
  DRAFT: 'مسودة',
  PENDING: 'قيد المراجعة',
  APPROVED: 'مقبولة',
  REJECTED: 'مرفوضة',
}

const STATUS_CLASSES: Record<PackStatus, string> = {
  DRAFT: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
  PENDING: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  APPROVED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  REJECTED: 'border-red-500/40 bg-red-500/10 text-red-400',
}

const LANGUAGE_LABELS: Record<string, string> = {
  ar: 'عربي',
  en: 'إنجليزي',
  both: 'عربي وإنجليزي',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function MyPacksClient({ packs, userId }: MyPacksClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionPackId, setActionPackId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleSubmit(packId: string) {
    setErrors((prev) => ({ ...prev, [packId]: '' }))
    setActionPackId(packId)
    startTransition(async () => {
      const result = await submitPackForReview(packId)
      if ('error' in result) {
        setErrors((prev) => ({ ...prev, [packId]: result.error }))
      } else {
        router.refresh()
      }
      setActionPackId(null)
    })
  }

  function handleDelete(packId: string) {
    setConfirmDelete(null)
    setErrors((prev) => ({ ...prev, [packId]: '' }))
    setActionPackId(packId)
    startTransition(async () => {
      const result = await deletePackAction(packId)
      if ('error' in result) {
        setErrors((prev) => ({ ...prev, [packId]: result.error }))
      } else {
        router.refresh()
      }
      setActionPackId(null)
    })
  }

  if (packs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 h-12 w-12 text-white/20" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <p className="mb-1 text-base font-semibold text-white/60">لا توجد باقات بعد</p>
        <p className="mb-6 text-sm text-slate-500">أنشئ باقتك الأولى وشاركها مع المجتمع</p>
        <Link
          href="/packs/create"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/50 transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إنشاء باقة جديدة
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <h2 id="confirm-delete-title" className="mb-2 text-lg font-bold text-white">
              حذف الباقة
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              هل أنت متأكد من حذف هذه الباقة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex min-h-[44px] items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pack cards */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="باقاتي">
        {packs.map((pack) => {
          const isActing = isPending && actionPackId === pack.id
          const packError = errors[pack.id]
          const canEdit = pack.status === 'DRAFT' || pack.status === 'REJECTED'
          const canSubmit = pack.status === 'DRAFT' && pack._count.questions >= 5
          const canDelete = pack.status === 'DRAFT' || pack.status === 'REJECTED'

          return (
            <li
              key={pack.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/8"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="flex-1 text-sm font-bold leading-snug text-white line-clamp-2">
                  {pack.name}
                </h3>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[pack.status]}`}>
                  {STATUS_LABELS[pack.status]}
                </span>
              </div>

              {/* Meta */}
              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{pack.category}</span>
                <span>{LANGUAGE_LABELS[pack.language] ?? pack.language}</span>
                <span>{pack._count.questions} سؤال</span>
              </div>

              {/* Date */}
              <p className="mb-4 mt-auto text-xs text-slate-600">
                آخر تعديل: {formatDate(pack.updatedAt)}
              </p>

              {/* Error */}
              {packError && (
                <p role="alert" className="mb-3 text-xs text-red-400">{packError}</p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <Link
                    href={`/packs/${pack.id}/edit`}
                    className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    تعديل
                  </Link>
                )}

                {canSubmit && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(pack.id)}
                    disabled={isActing}
                    className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    {isActing ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                    تقديم للمراجعة
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(pack.id)}
                    disabled={isActing}
                    className="flex min-h-[36px] items-center justify-center rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400/70 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label={`حذف باقة ${pack.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
