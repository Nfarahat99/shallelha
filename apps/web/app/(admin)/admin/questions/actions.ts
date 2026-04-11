'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createQuestion(formData: FormData) {
  const text = formData.get('text') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('categoryId') as string
  const timerDuration = parseInt(formData.get('timerDuration') as string) || 20
  const mediaUrl = formData.get('mediaUrl') as string | null
  const optionsRaw = formData.get('options') as string
  const correctIndex = parseInt(formData.get('correctIndex') as string)

  if (!text?.trim()) throw new Error('نص السؤال مطلوب')
  if (!categoryId) throw new Error('الفئة مطلوبة')

  const options: string[] = optionsRaw ? JSON.parse(optionsRaw) : []

  if (type === 'MULTIPLE_CHOICE' || type === 'MEDIA_GUESSING') {
    if (options.length !== 4 || options.some((o) => !o.trim())) {
      throw new Error('يجب تقديم 4 خيارات لهذا النوع من الأسئلة')
    }
    if (correctIndex < 0 || correctIndex > 3) {
      throw new Error('يجب تحديد الإجابة الصحيحة')
    }
  }

  await prisma.question.create({
    data: {
      text: text.trim(),
      type: type as any,
      categoryId,
      options: type === 'FREE_TEXT' ? [] : options,
      correctIndex: type === 'FREE_TEXT' ? 0 : correctIndex,
      timerDuration,
      mediaUrl: mediaUrl || null,
      status: 'draft',
    },
  })

  revalidatePath('/admin/questions')
}

export async function updateQuestion(id: string, formData: FormData) {
  const text = formData.get('text') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('categoryId') as string
  const timerDuration = parseInt(formData.get('timerDuration') as string) || 20
  const mediaUrl = formData.get('mediaUrl') as string | null
  const optionsRaw = formData.get('options') as string
  const correctIndex = parseInt(formData.get('correctIndex') as string)

  if (!text?.trim()) throw new Error('نص السؤال مطلوب')
  if (!categoryId) throw new Error('الفئة مطلوبة')

  const options: string[] = optionsRaw ? JSON.parse(optionsRaw) : []

  if (type === 'MULTIPLE_CHOICE' || type === 'MEDIA_GUESSING') {
    if (options.length !== 4 || options.some((o) => !o.trim())) {
      throw new Error('يجب تقديم 4 خيارات لهذا النوع من الأسئلة')
    }
    if (correctIndex < 0 || correctIndex > 3) {
      throw new Error('يجب تحديد الإجابة الصحيحة')
    }
  }

  await prisma.question.update({
    where: { id },
    data: {
      text: text.trim(),
      type: type as any,
      categoryId,
      options: type === 'FREE_TEXT' ? [] : options,
      correctIndex: type === 'FREE_TEXT' ? 0 : correctIndex,
      timerDuration,
      mediaUrl: mediaUrl || null,
    },
  })

  revalidatePath('/admin/questions')
}

export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } })
  revalidatePath('/admin/questions')
}

export async function approveQuestion(id: string) {
  await prisma.question.update({
    where: { id },
    data: { status: 'approved' },
  })
  revalidatePath('/admin/questions')
}

export async function revertToDraft(id: string) {
  await prisma.question.update({
    where: { id },
    data: { status: 'draft' },
  })
  revalidatePath('/admin/questions')
}
