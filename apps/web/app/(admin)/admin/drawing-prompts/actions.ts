'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createDrawingPrompt(formData: FormData) {
  const text = (formData.get('text') as string)?.trim()
  const category = (formData.get('category') as string)?.trim()
  const difficulty = (formData.get('difficulty') as string) || 'medium'
  const language = (formData.get('language') as string) || 'ar'
  if (!text) throw new Error('نص الكلمة مطلوب')
  if (!category) throw new Error('الفئة مطلوبة')
  if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('الصعوبة غير صالحة')
  await prisma.drawingPrompt.create({ data: { text, category, difficulty, language, archived: false } })
  revalidatePath('/admin/drawing-prompts')
}

export async function archiveDrawingPrompt(id: string) {
  if (!id || typeof id !== 'string') throw new Error('معرّف غير صالح')
  await prisma.drawingPrompt.update({ where: { id }, data: { archived: true } })
  revalidatePath('/admin/drawing-prompts')
}

export async function restoreDrawingPrompt(id: string) {
  if (!id || typeof id !== 'string') throw new Error('معرّف غير صالح')
  await prisma.drawingPrompt.update({ where: { id }, data: { archived: false } })
  revalidatePath('/admin/drawing-prompts')
}
