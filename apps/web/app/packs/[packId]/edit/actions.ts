'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import type { PackQuestionInput } from '@/app/packs/create/actions'

export interface PackMetadata {
  name: string
  description?: string
  category: string
  language: string
  difficulty?: string
}

export async function updatePack(
  packId: string,
  metadata: PackMetadata,
  questions: PackQuestionInput[],
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'يجب تسجيل الدخول أولاً' }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    return { error: 'خطأ في الاتصال بالخادم' }
  }

  // Verify ownership before updating
  const checkRes = await fetch(`${backendUrl}/packs/${packId}`, { cache: 'no-store' })
  if (!checkRes.ok) {
    return { error: 'الباقة غير موجودة' }
  }
  const existing = (await checkRes.json()) as { createdBy?: string; status?: string }
  if (existing.createdBy !== session.user.id) {
    return { error: 'ليس لديك صلاحية تعديل هذه الباقة' }
  }
  if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
    return { error: 'لا يمكن تعديل الباقة بعد تقديمها للمراجعة' }
  }

  if (!metadata.name?.trim() || metadata.name.trim().length > 100) {
    return { error: 'اسم الباقة مطلوب (1-100 حرف)' }
  }
  if (!metadata.category?.trim()) {
    return { error: 'الفئة مطلوبة' }
  }

  try {
    // Delete the existing pack and re-create with new data
    // This is the simplest approach as the API uses nested creates
    const deleteRes = await fetch(`${backendUrl}/packs/${packId}`, {
      method: 'DELETE',
    })

    if (!deleteRes.ok && deleteRes.status !== 204) {
      const data = await deleteRes.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل تحديث الباقة' }
    }

    const createRes = await fetch(`${backendUrl}/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metadata.name.trim(),
        description: metadata.description?.trim() || undefined,
        category: metadata.category.trim(),
        language: metadata.language || 'ar',
        difficulty: metadata.difficulty?.trim() || undefined,
        createdBy: session.user.id,
        creatorHandle: session.user.name ?? undefined,
        questions,
      }),
    })

    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل تحديث الباقة' }
    }

    revalidatePath('/packs/my-packs')
    revalidatePath(`/packs/${packId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('[updatePack] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}

export async function deletePackAction(
  packId: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'يجب تسجيل الدخول أولاً' }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    return { error: 'خطأ في الاتصال بالخادم' }
  }

  // Verify ownership before deleting
  const checkRes = await fetch(`${backendUrl}/packs/${packId}`, { cache: 'no-store' })
  if (!checkRes.ok) {
    return { error: 'الباقة غير موجودة' }
  }
  const existing = (await checkRes.json()) as { createdBy?: string }
  if (existing.createdBy !== session.user.id) {
    return { error: 'ليس لديك صلاحية حذف هذه الباقة' }
  }

  try {
    const res = await fetch(`${backendUrl}/packs/${packId}`, { method: 'DELETE' })

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل حذف الباقة' }
    }

    revalidatePath('/packs/my-packs')
    return { success: true }
  } catch (err) {
    console.error('[deletePackAction] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}
