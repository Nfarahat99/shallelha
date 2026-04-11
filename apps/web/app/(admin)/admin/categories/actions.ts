'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string

  if (!name?.trim() || !slug?.trim()) {
    throw new Error('الاسم والمعرف مطلوبان')
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('المعرف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط')
  }

  await prisma.category.create({
    data: { name: name.trim(), slug: slug.trim() },
  })

  revalidatePath('/admin/categories')
}

export async function renameCategory(id: string, formData: FormData) {
  const name = formData.get('name') as string

  if (!name?.trim()) {
    throw new Error('الاسم مطلوب')
  }

  await prisma.category.update({
    where: { id },
    data: { name: name.trim() },
  })

  revalidatePath('/admin/categories')
}

export async function archiveCategory(id: string) {
  await prisma.category.update({
    where: { id },
    data: { archived: true },
  })

  revalidatePath('/admin/categories')
}

export async function unarchiveCategory(id: string) {
  await prisma.category.update({
    where: { id },
    data: { archived: false },
  })

  revalidatePath('/admin/categories')
}
