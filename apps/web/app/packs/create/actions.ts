'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export interface PackQuestionInput {
  text: string
  type: 'MULTIPLE_CHOICE' | 'FREE_TEXT'
  options: string[]
  correctIndex: number | null
  order: number
}

export async function createPack(
  formData: FormData,
  questions: PackQuestionInput[],
): Promise<{ packId: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'يجب تسجيل الدخول أولاً' }
  }

  const name = formData.get('name')?.toString()?.trim() ?? ''
  const category = formData.get('category')?.toString()?.trim() ?? ''
  const language = formData.get('language')?.toString()?.trim() ?? 'ar'
  const difficulty = formData.get('difficulty')?.toString()?.trim() ?? ''
  const description = formData.get('description')?.toString()?.trim() ?? ''

  if (!name || name.length < 1 || name.length > 100) {
    return { error: 'اسم الباقة مطلوب (1-100 حرف)' }
  }
  if (!category) {
    return { error: 'الفئة مطلوبة' }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    return { error: 'خطأ في الاتصال بالخادم' }
  }

  try {
    const res = await fetch(`${backendUrl}/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || undefined,
        category,
        language,
        difficulty: difficulty || undefined,
        // T-10-02-01: createdBy is always taken from the server-side session — never from client input
        createdBy: session.user.id,
        creatorHandle: session.user.name ?? undefined,
        questions,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل إنشاء الباقة' }
    }

    const pack = (await res.json()) as { id: string }
    revalidatePath('/packs/my-packs')
    return { packId: pack.id }
  } catch (err) {
    console.error('[createPack] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}

export async function submitPackForReview(
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

  // T-10-02-02: verify pack belongs to session user before submitting
  const checkRes = await fetch(`${backendUrl}/packs/${packId}`)
  if (!checkRes.ok) {
    return { error: 'الباقة غير موجودة' }
  }
  const pack = (await checkRes.json()) as { createdBy?: string }
  if (pack.createdBy !== session.user.id) {
    return { error: 'ليس لديك صلاحية تقديم هذه الباقة' }
  }

  try {
    const res = await fetch(`${backendUrl}/packs/${packId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING' }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل تقديم الباقة للمراجعة' }
    }

    revalidatePath('/packs/my-packs')
    return { success: true }
  } catch (err) {
    console.error('[submitPackForReview] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}
