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

  // ── Drawing Prompts ──────────────────────────────────────────────────────────
  const drawingPromptsData = [
    // حيوانات (easy/medium)
    { text: 'قطة', category: 'حيوانات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'كلب', category: 'حيوانات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'أسد', category: 'حيوانات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'فيل', category: 'حيوانات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'طائر', category: 'حيوانات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'سمكة', category: 'حيوانات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'فراشة', category: 'حيوانات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'أرنب', category: 'حيوانات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'تمساح', category: 'حيوانات', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'زرافة', category: 'حيوانات', difficulty: 'hard', language: 'ar', archived: false },
    // رياضة
    { text: 'كرة القدم', category: 'رياضة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'سباحة', category: 'رياضة', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'دراجة', category: 'رياضة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'ملاكمة', category: 'رياضة', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'تنس', category: 'رياضة', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'كرة السلة', category: 'رياضة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'ركض', category: 'رياضة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'غوص', category: 'رياضة', difficulty: 'hard', language: 'ar', archived: false },
    // طعام
    { text: 'تفاحة', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'موزة', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'بيتزا', category: 'طعام', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'كعكة', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'شاورما', category: 'طعام', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'قهوة', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'آيس كريم', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'بطيخ', category: 'طعام', difficulty: 'easy', language: 'ar', archived: false },
    // مشاهير
    { text: 'ميسي', category: 'مشاهير', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'رونالدو', category: 'مشاهير', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'محمد علي', category: 'مشاهير', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'أوبرا', category: 'مشاهير', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'شاكيرا', category: 'مشاهير', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'بيكاسو', category: 'مشاهير', difficulty: 'hard', language: 'ar', archived: false },
    // مواصلات
    { text: 'سيارة', category: 'مواصلات', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'طائرة', category: 'مواصلات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'قطار', category: 'مواصلات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'سفينة', category: 'مواصلات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'دراجة نارية', category: 'مواصلات', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'مروحية', category: 'مواصلات', difficulty: 'hard', language: 'ar', archived: false },
    // طبيعة
    { text: 'جبل', category: 'طبيعة', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'نهر', category: 'طبيعة', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'شجرة', category: 'طبيعة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'شمس', category: 'طبيعة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'قمر', category: 'طبيعة', difficulty: 'easy', language: 'ar', archived: false },
    { text: 'نجمة', category: 'طبيعة', difficulty: 'easy', language: 'ar', archived: false },
    // مهن
    { text: 'طبيب', category: 'مهن', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'معلم', category: 'مهن', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'طباخ', category: 'مهن', difficulty: 'medium', language: 'ar', archived: false },
    { text: 'طيار', category: 'مهن', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'رجل الإطفاء', category: 'مهن', difficulty: 'hard', language: 'ar', archived: false },
    { text: 'شرطي', category: 'مهن', difficulty: 'medium', language: 'ar', archived: false },
  ]

  const dpResult = await prisma.drawingPrompt.createMany({
    data: drawingPromptsData,
    skipDuplicates: true,
  })
  console.log(`Seeded ${dpResult.count} drawing prompts`)

  // ── Bluffing Questions ───────────────────────────────────────────────────────
  const generalCategory = await prisma.category.findFirst({
    where: { archived: false },
    orderBy: { createdAt: 'asc' },
  })

  if (generalCategory) {
    const bluffingQuestions = [
      // جغرافيا
      { text: 'ما عاصمة سلطنة عُمان؟', options: ['مسقط'] },
      { text: 'ما أكبر قارة في العالم من حيث المساحة؟', options: ['آسيا'] },
      { text: 'ما أطول نهر في العالم؟', options: ['نهر النيل'] },
      { text: 'كم عدد دول العالم؟', options: ['195 دولة'] },
      { text: 'ما عاصمة المملكة العربية السعودية؟', options: ['الرياض'] },
      { text: 'ما أعلى جبل في العالم؟', options: ['إيفرست'] },
      { text: 'ما أصغر دولة في العالم مساحةً؟', options: ['الفاتيكان'] },
      { text: 'في أي قارة تقع مصر؟', options: ['أفريقيا'] },
      { text: 'ما البحر الذي يفصل أوروبا عن أفريقيا؟', options: ['البحر الأبيض المتوسط'] },
      { text: 'ما عاصمة اليابان؟', options: ['طوكيو'] },
      // تاريخ
      { text: 'في أي عام بُنيت الأهرامات المصرية تقريباً؟', options: ['2560 قبل الميلاد'] },
      { text: 'من هو أول رئيس للولايات المتحدة الأمريكية؟', options: ['جورج واشنطن'] },
      { text: 'في أي عام اكتشف كريستوفر كولومبوس أمريكا؟', options: ['1492'] },
      { text: 'في أي عام انتهت الحرب العالمية الثانية؟', options: ['1945'] },
      { text: 'من بنى مدينة إسطنبول القديمة تحت اسم القسطنطينية؟', options: ['الإمبراطور قسطنطين'] },
      // علوم
      { text: 'ما رمز عنصر الذهب في الجدول الدوري؟', options: ['Au'] },
      { text: 'كم تبلغ سرعة الضوء تقريباً؟', options: ['300,000 كيلومتر في الثانية'] },
      { text: 'ما أكبر كوكب في المجموعة الشمسية؟', options: ['المشتري'] },
      { text: 'ما عدد عظام جسم الإنسان البالغ؟', options: ['206 عظمة'] },
      { text: 'ما العنصر الأوفر في الغلاف الجوي للأرض؟', options: ['النيتروجين'] },
      { text: 'ما درجة غليان الماء عند مستوى سطح البحر؟', options: ['100 درجة مئوية'] },
      { text: 'من صاغ نظرية النسبية؟', options: ['ألبرت أينشتاين'] },
      // رياضة
      { text: 'كم مرة فازت البرازيل بكأس العالم؟', options: ['5 مرات'] },
      { text: 'في أي مدينة أُقيمت أول دورة أولمبية حديثة؟', options: ['أثينا'] },
      { text: 'كم عدد لاعبي كرة القدم في كل فريق على أرض الملعب؟', options: ['11 لاعباً'] },
      { text: 'من يُلقَّب بـ"ملك كرة القدم"؟', options: ['بيليه'] },
      { text: 'كم طول ملعب كرة القدم القياسي؟', options: ['105 أمتار'] },
      { text: 'في أي رياضة يُستخدم مضرب وريشة؟', options: ['الريشة الطائرة (بادمنتون)'] },
      // ثقافة وفنون
      { text: 'من رسم لوحة الموناليزا؟', options: ['ليوناردو دا فينشي'] },
      { text: 'من كتب رواية "ألف ليلة وليلة"؟', options: ['مجهول — تراث شعبي'] },
      { text: 'ما اسم أشهر مسرحية لشكسبير؟', options: ['هاملت'] },
      { text: 'في أي دولة نشأت الفنون الكنغفو؟', options: ['الصين'] },
      { text: 'من ألّف سمفونية "القدر" الخامسة؟', options: ['بيتهوفن'] },
      // طعام وثقافة
      { text: 'ما الدولة الأصلية لطبق "السوشي"؟', options: ['اليابان'] },
      { text: 'ما الدولة التي يُعدّ فيها الكسكس طبقاً وطنياً؟', options: ['المغرب'] },
      { text: 'من أي بلد أتت قهوة الإسبريسو أصلاً؟', options: ['إيطاليا'] },
      { text: 'ما الفاكهة التي تُنتج الشوكولاتة من بذورها؟', options: ['الكاكاو'] },
      { text: 'ما الدولة الأكثر إنتاجاً للتمر في العالم؟', options: ['مصر'] },
      // لغة وأدب
      { text: 'ما أكثر لغة يتحدثها البشر كلغة أم؟', options: ['الماندرين الصينية'] },
      { text: 'كم عدد حروف اللغة العربية؟', options: ['28 حرفاً'] },
      { text: 'من هو شاعر المعلقات العرب الأشهر؟', options: ['امرؤ القيس'] },
      { text: 'ما أول كلمة نزلت في القرآن الكريم؟', options: ['اقرأ'] },
      { text: 'في أي قرن عاش ابن خلدون؟', options: ['القرن الرابع عشر الميلادي'] },
      // تقنية
      { text: 'من أسّس شركة آبل؟', options: ['ستيف جوبز وستيف وزنياك'] },
      { text: 'في أي عام أُطلق أول موقع على الإنترنت؟', options: ['1991'] },
      { text: 'ما الاسم الكامل لـ"PDF"؟', options: ['Portable Document Format'] },
      { text: 'من أسّس شركة مايكروسوفت؟', options: ['بيل غيتس وبول ألن'] },
      { text: 'ما اسم أول قمر صناعي أُطلق في الفضاء؟', options: ['سبوتنيك 1'] },
      { text: 'كم بت في البايت الواحد؟', options: ['8 بتات'] },
    ]

    const bqResult = await prisma.question.createMany({
      data: bluffingQuestions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: 0,
        type: 'BLUFFING' as const,
        categoryId: generalCategory.id,
        status: 'approved' as const,
        timerDuration: 60,
      })),
      skipDuplicates: true,
    })
    console.log(`Seeded ${bqResult.count} bluffing questions`)
  } else {
    console.log('No category found — skipping bluffing questions seed')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
