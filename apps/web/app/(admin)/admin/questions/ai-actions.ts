'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// generateQuestionsAction
// Calls the Express backend POST /admin/ai-generate
// Forwards the admin_session cookie for auth
export async function generateQuestionsAction(categoryId: string, count: number) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value ?? ''

  const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

  const res = await fetch(`${serverUrl}/admin/ai-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Forward session as Cookie header so Express auth middleware sees it
      Cookie: `admin_session=${sessionToken}`,
    },
    body: JSON.stringify({ categoryId, count }),
    // Do not cache — always fresh
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `Server returned ${res.status}`)
  }

  const data = (await res.json()) as { created: number; questions: unknown[] }

  revalidatePath('/admin/questions')

  return { created: data.created, questions: data.questions }
}

// approveQuestionsAction
// Sets status='approved' for a list of question IDs
// Scoped to status='draft' — cannot approve already-live questions (T-09-09)
export async function approveQuestionsAction(ids: string[]) {
  if (!ids.length) return

  await prisma.question.updateMany({
    where: { id: { in: ids }, status: 'draft' },
    data: { status: 'approved' },
  })

  revalidatePath('/admin/questions')
}

// rejectQuestionsAction
// Deletes DRAFT questions — rejection = permanent deletion
// Scoped to status='draft' — cannot delete approved/live questions (T-09-10)
export async function rejectQuestionsAction(ids: string[]) {
  if (!ids.length) return

  await prisma.question.deleteMany({
    where: { id: { in: ids }, status: 'draft' },
  })

  revalidatePath('/admin/questions')
}
