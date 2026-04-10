import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Upsert categories (idempotent by slug)
  const thaqafa = await prisma.category.upsert({
    where: { slug: 'thaqafa-amma' },
    update: { name: 'ثقافة عامة' },
    create: { name: 'ثقافة عامة', slug: 'thaqafa-amma' },
  })

  const riyadha = await prisma.category.upsert({
    where: { slug: 'riyadha' },
    update: { name: 'رياضة' },
    create: { name: 'رياضة', slug: 'riyadha' },
  })

  const tarfeeh = await prisma.category.upsert({
    where: { slug: 'tarfeeh' },
    update: { name: 'ترفيه' },
    create: { name: 'ترفيه', slug: 'tarfeeh' },
  })

  // ثقافة عامة — 10 questions
  const thaqafaQuestions = [
    {
      text: 'ما هي عاصمة المملكة العربية السعودية؟',
      options: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة'],
      correctIndex: 0,
    },
    {
      text: 'كم عدد أركان الإسلام؟',
      options: ['أربعة', 'خمسة', 'ستة', 'ثلاثة'],
      correctIndex: 1,
    },
    {
      text: 'ما هي أطول سلسلة جبلية في العالم؟',
      options: ['جبال الهيمالايا', 'جبال الأنديز', 'جبال الألب', 'جبال روكي'],
      correctIndex: 1,
    },
    {
      text: 'كم عدد دول مجلس التعاون الخليجي؟',
      options: ['أربع دول', 'خمس دول', 'ست دول', 'سبع دول'],
      correctIndex: 2,
    },
    {
      text: 'ما هي العملة الرسمية للإمارات العربية المتحدة؟',
      options: ['الريال', 'الدينار', 'الدرهم', 'الجنيه'],
      correctIndex: 2,
    },
    {
      text: 'أي بحر يفصل شبه الجزيرة العربية عن أفريقيا؟',
      options: ['بحر العرب', 'البحر المتوسط', 'البحر الأحمر', 'خليج عدن'],
      correctIndex: 2,
    },
    {
      text: 'ما هو أكبر بحيرة في العالم؟',
      options: ['بحيرة فكتوريا', 'بحيرة سوبيريور', 'بحر قزوين', 'بحيرة بايكال'],
      correctIndex: 2,
    },
    {
      text: 'في أي عام تأسست منظمة الأمم المتحدة؟',
      options: ['1940', '1945', '1950', '1955'],
      correctIndex: 1,
    },
    {
      text: 'ما هو الكوكب الأقرب إلى الشمس؟',
      options: ['الزهرة', 'المريخ', 'عطارد', 'الأرض'],
      correctIndex: 2,
    },
    {
      text: 'ما هو أطول نهر في العالم؟',
      options: ['الأمازون', 'النيل', 'المسيسيبي', 'اليانغتسي'],
      correctIndex: 1,
    },
  ]

  for (const q of thaqafaQuestions) {
    await prisma.question.create({
      data: {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        timerDuration: 20,
        status: 'approved',
        categoryId: thaqafa.id,
      },
    })
  }

  // رياضة — 10 questions
  const riyadhaQuestions = [
    {
      text: 'كم عدد لاعبي كرة القدم في الفريق الواحد داخل الملعب؟',
      options: ['عشرة', 'أحد عشر', 'اثنا عشر', 'تسعة'],
      correctIndex: 1,
    },
    {
      text: 'في أي دولة ستُقام كأس العالم 2026؟',
      options: ['قطر', 'أمريكا وكندا والمكسيك', 'إسبانيا والبرتغال', 'المملكة العربية السعودية'],
      correctIndex: 1,
    },
    {
      text: 'كم عدد نقاط التسجيل في كرة السلة عن بُعد (خط الثلاثة)؟',
      options: ['نقطتان', 'ثلاث نقاط', 'أربع نقاط', 'نقطة واحدة'],
      correctIndex: 1,
    },
    {
      text: 'ما هي الرياضة التي يُعدّ فيها محمد علي كلاي من أعظم الأبطال؟',
      options: ['المصارعة', 'كرة القدم', 'الملاكمة', 'رفع الأثقال'],
      correctIndex: 2,
    },
    {
      text: 'في أي عام أُقيمت أول دورة للألعاب الأولمبية الحديثة؟',
      options: ['1886', '1896', '1900', '1906'],
      correctIndex: 1,
    },
    {
      text: 'ما هو الفريق الذي فاز بأكثر عدد من ألقاب دوري أبطال أوروبا؟',
      options: ['برشلونة', 'بايرن ميونخ', 'ريال مدريد', 'يوفنتوس'],
      correctIndex: 2,
    },
    {
      text: 'كم طول ملعب كرة القدم القياسي بالمتر تقريباً؟',
      options: ['90 متراً', '100 متراً', '105 متراً', '120 متراً'],
      correctIndex: 2,
    },
    {
      text: 'ما هو اللاعب الذي يُلقّب بـ "الفينومينون"؟',
      options: ['رونالدينيو', 'رونالدو البرازيلي', 'كاكا', 'زيدان'],
      correctIndex: 1,
    },
    {
      text: 'في أي دولة اخترع رياضة التنس؟',
      options: ['فرنسا', 'أمريكا', 'أستراليا', 'بريطانيا'],
      correctIndex: 3,
    },
    {
      text: 'كم مرة فازت البرازيل بكأس العالم لكرة القدم؟',
      options: ['أربع مرات', 'خمس مرات', 'ست مرات', 'ثلاث مرات'],
      correctIndex: 1,
    },
  ]

  for (const q of riyadhaQuestions) {
    await prisma.question.create({
      data: {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        timerDuration: 20,
        status: 'approved',
        categoryId: riyadha.id,
      },
    })
  }

  // ترفيه — 10 questions
  const tarfeehQuestions = [
    {
      text: 'ما هو اسم الشخصية الرئيسية في فيلم "أسد الجزيرة" الكوميدي الكويتي؟',
      options: ['شاهين', 'سعد', 'مرزوق', 'علي'],
      correctIndex: 2,
    },
    {
      text: 'من هو مؤلف رواية "الخيميائي"؟',
      options: ['نجيب محفوظ', 'باولو كويلو', 'غابرييل ماركيز', 'خليل جبران'],
      correctIndex: 1,
    },
    {
      text: 'ما هو أعلى مبنى في العالم حتى عام 2024؟',
      options: ['برج خليفة', 'برج شنغهاي', 'برج ماكاو', 'برج المملكة'],
      correctIndex: 0,
    },
    {
      text: 'من هو مغني أغنية "شيل العين عني"؟',
      options: ['عبدالمجيد عبدالله', 'محمد عبده', 'طلال مداح', 'راشد الماجد'],
      correctIndex: 0,
    },
    {
      text: 'في أي عام صدر أول إصدار من سلسلة ألعاب "ببجي"؟',
      options: ['2015', '2016', '2017', '2018'],
      correctIndex: 2,
    },
    {
      text: 'ما هو اسم البطل الخارق الذي يرتدي بدلة حمراء وزرقاء؟',
      options: ['باتمان', 'سوبرمان', 'سبايدرمان', 'الرجل الحديدي'],
      correctIndex: 2,
    },
    {
      text: 'كم موسماً بثّ مسلسل "لعبة العروش"؟',
      options: ['ستة مواسم', 'سبعة مواسم', 'ثمانية مواسم', 'تسعة مواسم'],
      correctIndex: 2,
    },
    {
      text: 'ما هو اسم التطبيق الذي يستخدم قصصاً قصيرة تختفي بعد 24 ساعة؟',
      options: ['تيك توك', 'إنستغرام ستوريز', 'سناب شات', 'واتساب ستاتس'],
      correctIndex: 2,
    },
    {
      text: 'من هو مطرب أغنية "عمري كله"؟',
      options: ['عمرو دياب', 'تامر حسني', 'محمد منير', 'هاني شاكر'],
      correctIndex: 0,
    },
    {
      text: 'ما هو اسم منصة البث التي أنتجت مسلسل "العالم يتغير"؟',
      options: ['نتفليكس', 'شاهد', 'واجد', 'أمازون برايم'],
      correctIndex: 1,
    },
  ]

  for (const q of tarfeehQuestions) {
    await prisma.question.create({
      data: {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        timerDuration: 20,
        status: 'approved',
        categoryId: tarfeeh.id,
      },
    })
  }

  console.log('Seed complete: 3 categories, 30 questions')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
