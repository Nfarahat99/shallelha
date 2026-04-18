import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import OpenAI from 'openai'
import { prisma } from '../db/prisma'

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later' },
})

// OpenAI client — lazy singleton so tests that don't mock openai can still import admin.ts
let _openaiClient: OpenAI | null = null
function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openaiClient
}

// Dedicated rate limiter for AI generation (expensive per-request cost)
// cookie-parser is not registered in index.ts; use admin_session cookie value when available,
// otherwise fall back to a fixed key so the limiter still functions in test environments.
// validate.ip is disabled to silence the ERR_ERL_KEY_GEN_IPV6 warning — key is cookie-based.
const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI generation requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.cookies?.admin_session as string | undefined) ?? 'default',
  validate: { ip: false },
  message: { error: 'حد معدل طلبات توليد الأسئلة تجاوز — انتظر دقيقة' },
})

export const adminRouter = Router()

// POST /admin/ai-generate — Generate Arabic questions via GPT-4o
// Body: { categoryId: string, count: number (5–10) }
// Response: { created: number, questions: Array<{ text, options, correctIndex }> }
adminRouter.post('/ai-generate', aiGenerateLimiter, async (req, res) => {
  try {
    const { categoryId, count } = req.body as { categoryId?: string; count?: number }

    // Input validation
    if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
      res.status(400).json({ error: 'categoryId مطلوب' })
      return
    }
    const parsedCount = Number(count)
    if (!Number.isInteger(parsedCount) || parsedCount < 5 || parsedCount > 10) {
      res.status(400).json({ error: 'count يجب أن يكون بين 5 و 10' })
      return
    }

    // Category existence check
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      res.status(404).json({ error: 'الفئة غير موجودة' })
      return
    }

    // Build GPT-4o prompt (Arabic, Gulf culture)
    const systemPrompt = `أنت مساعد متخصص في إنشاء أسئلة اختيار متعدد باللغة العربية الخليجية.
قواعد صارمة:
- اكتب الأسئلة عن الثقافة الخليجية العربية (تاريخ، طعام، موسيقى، رياضة، جغرافيا، تقاليد).
- كل سؤال له 4 خيارات بالضبط.
- correctIndex هو رقم من 0 إلى 3 يشير إلى الإجابة الصحيحة.
- أعد JSON فقط — لا نص إضافي، لا markdown، لا شرح.
- الصيغة الإلزامية: {"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0}, ...]}`

    const userPrompt = `اكتب ${parsedCount} أسئلة اختيار متعدد عن الفئة: "${category.name}".
أعد JSON فقط بالصيغة المطلوبة.`

    // Call GPT-4o
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content ?? ''

    // Parse GPT response — response_format: json_object always returns an object.
    // System prompt locks schema to { "questions": [...] }.
    let parsed: unknown
    try {
      const obj = JSON.parse(rawContent) as Record<string, unknown>
      parsed = obj.questions
    } catch {
      res.status(502).json({ error: 'AI generation failed — invalid JSON response' })
      return
    }

    if (!Array.isArray(parsed)) {
      res.status(502).json({ error: 'AI generation failed — expected questions array' })
      return
    }

    // Filter valid questions: text (string), options (array[4] of strings), correctIndex (0–3)
    const valid = (parsed as any[]).filter(
      (q) =>
        typeof q.text === 'string' &&
        q.text.trim() &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((o: unknown) => typeof o === 'string') &&
        typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3,
    )

    if (valid.length === 0) {
      res.status(502).json({ error: 'AI generation failed — no valid questions returned' })
      return
    }

    // Bulk-insert as draft — skipDuplicates prevents injection via duplicate text
    const created = await prisma.question.createMany({
      data: valid.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o: string) => o.trim()),
        correctIndex: q.correctIndex,
        categoryId,
        status: 'draft',
        type: 'MULTIPLE_CHOICE',
        timerDuration: 20,
      })),
      skipDuplicates: true,
    })

    res.json({ created: created.count, questions: valid })
  } catch (err) {
    console.error('[Admin] AI generate error:', err)
    res.status(502).json({ error: 'AI generation failed' })
  }
})

// GET /admin/analytics — question stats with wrong answer rates
adminRouter.get('/analytics', adminLimiter, async (_req, res) => {
  try {
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        text: true,
        status: true,
        type: true,
        timesPlayed: true,
        timesAnsweredWrong: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { timesPlayed: 'desc' },
    })

    const stats = questions.map((q) => ({
      ...q,
      wrongRate: q.timesPlayed > 0
        ? Math.round((q.timesAnsweredWrong / q.timesPlayed) * 100) / 100
        : 0,
    }))

    res.json({ questions: stats })
  } catch (err) {
    console.error('[Admin] analytics error:', err)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})
