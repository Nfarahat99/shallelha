'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function verifyAdminCookie() {
  const cookieStore = cookies()
  const session = cookieStore.get('admin_session')
  if (!session || session.value !== process.env.ADMIN_SESSION_TOKEN) {
    throw new Error('Unauthorized')
  }
}

export async function approvePack(
  packId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    verifyAdminCookie()
  } catch {
    return { error: 'غير مصرح' }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return { error: 'خطأ في الاتصال بالخادم' }

  try {
    const res = await fetch(`${backendUrl}/packs/${packId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل اعتماد الباقة' }
    }

    revalidatePath('/admin/packs')
    revalidatePath('/packs')
    return { success: true }
  } catch (err) {
    console.error('[approvePack] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}

export async function rejectPack(
  packId: string,
  reason: string,
): Promise<{ success: true } | { error: string }> {
  try {
    verifyAdminCookie()
  } catch {
    return { error: 'غير مصرح' }
  }

  if (!reason || !reason.trim()) {
    return { error: 'سبب الرفض مطلوب' }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return { error: 'خطأ في الاتصال بالخادم' }

  try {
    const res = await fetch(`${backendUrl}/packs/${packId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason.trim() }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'فشل رفض الباقة' }
    }

    revalidatePath('/admin/packs')
    return { success: true }
  } catch (err) {
    console.error('[rejectPack] error:', err)
    return { error: 'فشل الاتصال بالخادم' }
  }
}
