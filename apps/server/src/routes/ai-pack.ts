import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Groq from 'groq-sdk'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroqDraftQuestion {
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

// ─── Lazy singleton ───────────────────────────────────────────────────────────

// Groq client — lazy singleton so tests that don't mock groq-sdk can still
// import ai-pack.ts without the constructor throwing when GROQ_API_KEY is absent.
let _groqClient: Groq | null = null
function getGroqClient(): Groq {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set')
    }
    _groqClient = new Groq({ apiKey })
  }
  return _groqClient
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

// 3 AI generation requests per host per hour.
// Key is keyed on NextAuth session cookie; validate.ip disabled to silence
// ERR_ERL_KEY_GEN_IPV6 warning (key is cookie-based, not IP-based).
const aiPackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const secureCookie = req.cookies?.['__Secure-next-auth.session-token'] as string | undefined
    const regularCookie = req.cookies?.['next-auth.session-token'] as string | undefined
    return secureCookie ?? regularCookie ?? req.ip ?? 'anonymous'
  },
  validate: { ip: false },
  message: { error: 'تجاوزت الحد المسموح به — انتظر ساعة قبل المحاولة مجدداً' },
})

// ─── Router ───────────────────────────────────────────────────────────────────

export const aiPackRouter = Router()

/**
 * POST /ai/pack-generate
 * Body:  { prompt: string, language?: 'ar' | 'en' | 'both' }
 * Response: { questions: GroqDraftQuestion[], model: string }
 */
aiPackRouter.post('/pack-generate', aiPackLimiter, async (req, res) => {
  // ── Input validation ────────────────────────────────────────────────────────
  const { prompt, language = 'ar' } = req.body as {
    prompt?: unknown
    language?: unknown
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'الموضوع مطلوب — يرجى كتابة موضوع الأسئلة' })
    return
  }

  if (prompt.length > 200) {
    res.status(400).json({ error: 'الموضوع طويل جداً — الحد الأقصى 200 حرف' })
    return
  }

  const validLanguages = ['ar', 'en', 'both']
  const lang = validLanguages.includes(language as string) ? (language as string) : 'ar'

  // ── Groq availability check ─────────────────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: 'خدمة توليد الأسئلة غير متاحة حالياً' })
    return
  }

  // ── Build prompts ───────────────────────────────────────────────────────────
  const langLabel =
    lang === 'ar' ? 'عربي فصيح/خليجي' : lang === 'en' ? 'English' : 'mix of Arabic and English'

  const systemPrompt = `أنت مساعد متخصص في إنشاء أسئلة اختيار متعدد تفاعلية.
قواعد صارمة:
- أنشئ 10 أسئلة دقيقاً عن الموضوع المطلوب.
- كل سؤال له 4 خيارات بالضبط.
- correctIndex هو رقم من 0 إلى 3.
- أعد JSON فقط — لا نص، لا markdown.
- الصيغة: {"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0},...]}
- لغة الأسئلة: ${langLabel}`

  const userPrompt = `اكتب 10 أسئلة اختيار متعدد عن الموضوع: "${prompt.trim()}".
أعد JSON فقط بالصيغة المطلوبة.`

  // ── Call Groq ───────────────────────────────────────────────────────────────
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const rawContent = completion.choices[0]?.message?.content ?? ''

    // ── Parse response ────────────────────────────────────────────────────────
    let parsed: unknown
    try {
      const obj = JSON.parse(rawContent) as Record<string, unknown>
      parsed = obj.questions
    } catch {
      console.error('[AI Pack] Invalid JSON from Groq:', rawContent.slice(0, 200))
      res.status(503).json({ error: 'فشل توليد الأسئلة — حاول مرة أخرى' })
      return
    }

    if (!Array.isArray(parsed)) {
      console.error('[AI Pack] Expected questions array, got:', typeof parsed)
      res.status(503).json({ error: 'فشل توليد الأسئلة — حاول مرة أخرى' })
      return
    }

    // ── Filter valid questions ────────────────────────────────────────────────
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
    ) as GroqDraftQuestion[]

    if (valid.length < 3) {
      console.error('[AI Pack] Insufficient valid questions:', valid.length)
      res.status(503).json({ error: 'لم يُولَّد عدد كافٍ من الأسئلة' })
      return
    }

    res.json({
      questions: valid,
      model: 'llama-3.3-70b-versatile',
    })
  } catch (err) {
    console.error('[AI Pack] Groq call error:', err)
    res.status(503).json({ error: 'فشل توليد الأسئلة — حاول مرة أخرى' })
  }
})
