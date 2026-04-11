import { PrismaClient } from '@prisma/client'
import { categories } from './seed-data'

const prisma = new PrismaClient()

async function main() {
  let totalUpserted = 0

  for (const cat of categories) {
    // Upsert category (idempotent by slug)
    const dbCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    })

    // MULTIPLE_CHOICE questions
    for (const q of cat.mc) {
      await prisma.question.upsert({
        where: { text_categoryId: { text: q.text, categoryId: dbCat.id } },
        update: {},
        create: {
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          timerDuration: 20,
          status: 'approved',
          type: 'MULTIPLE_CHOICE',
          categoryId: dbCat.id,
        },
      })
      totalUpserted++
    }

    // MEDIA_GUESSING questions
    for (const q of cat.media) {
      await prisma.question.upsert({
        where: { text_categoryId: { text: q.text, categoryId: dbCat.id } },
        update: {},
        create: {
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          timerDuration: 25,
          status: 'approved',
          type: 'MEDIA_GUESSING',
          mediaUrl: q.mediaUrl,
          categoryId: dbCat.id,
        },
      })
      totalUpserted++
    }

    // FREE_TEXT questions
    for (const q of cat.freeText) {
      await prisma.question.upsert({
        where: { text_categoryId: { text: q.text, categoryId: dbCat.id } },
        update: {},
        create: {
          text: q.text,
          options: [],
          correctIndex: 0,
          timerDuration: 30,
          status: 'approved',
          type: 'FREE_TEXT',
          categoryId: dbCat.id,
        },
      })
      totalUpserted++
    }

    console.log(
      `  [${cat.slug}] MC: ${cat.mc.length}, MEDIA: ${cat.media.length}, FREE_TEXT: ${cat.freeText.length}`
    )
  }

  console.log(`\nSeed complete: ${categories.length} categories, ${totalUpserted} questions upserted (idempotent)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
