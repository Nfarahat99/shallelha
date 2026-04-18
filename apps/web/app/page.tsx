import type { Metadata } from 'next'
import { AnimatedCounter } from './LandingClient'

// ---------------------------------------------------------------------------
// Page-level metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: 'شعللها — منصة الألعاب الجماعية العربية',
  description: 'العبوا مع بعض من أي جهاز — أسئلة ممتعة، تحديات حماسية، وضحك ما ينتهي',
  openGraph: {
    title: 'شعللها — منصة الألعاب الجماعية العربية',
    description: 'العبوا مع بعض من أي جهاز — أسئلة ممتعة، تحديات حماسية، وضحك ما ينتهي',
    locale: 'ar_SA',
    type: 'website',
  },
}

// ---------------------------------------------------------------------------
// Inline SVG icons — no external dependency
// ---------------------------------------------------------------------------
function IconScreen() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-8 h-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
      />
    </svg>
  )
}

function IconShare() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-8 h-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
      />
    </svg>
  )
}

function IconGamepad() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-8 h-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
      />
    </svg>
  )
}

function IconQuestions() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  )
}

function IconPower() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  )
}

function IconDevice() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3"
      />
    </svg>
  )
}

function IconFlame() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 inline-block text-orange-400"
    >
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Landing Page — Server Component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ================================================================
          SECTION 1: HERO
          ================================================================ */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-purple-600 to-violet-700 min-h-dvh flex flex-col items-center justify-center px-6 py-20 text-center text-white"
      >
        {/* Decorative dot grid overlay — pure CSS, no image */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Decorative blurred blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -start-32 w-96 h-96 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -end-32 w-96 h-96 rounded-full bg-violet-400/20 blur-3xl"
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Logo / brand */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm border border-white/20">
            <IconFlame />
            <span>العب الآن — مجاناً</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.18)' }}
          >
            شعللها
          </h1>

          {/* Tagline */}
          <p className="text-2xl sm:text-3xl font-bold text-white/90">
            أوقد المنافسة — منصة الألعاب الجماعية العربية
          </p>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-lg mx-auto">
            العبوا مع بعض من أي جهاز — أسئلة ممتعة، تحديات حماسية، وضحك ما ينتهي
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <a
              href="/host"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-brand-700 shadow-lg shadow-black/20 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 min-h-[52px]"
              aria-label="أنشئ غرفة لعب جديدة"
            >
              أنشئ غرفة
            </a>
            <a
              href="/join"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-8 py-4 text-lg font-bold text-white border border-white/30 backdrop-blur-sm hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 min-h-[52px]"
              aria-label="انضم إلى غرفة باستخدام الكود"
            >
              عندك كود؟ انضم
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50"
        >
          <span className="text-xs">اكتشف المزيد</span>
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ================================================================
          SECTION 2: HOW IT WORKS
          ================================================================ */}
      <section
        aria-labelledby="how-heading"
        className="py-20 px-6 bg-gray-50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2
              id="how-heading"
              className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
            >
              كيف تلعب؟
            </h2>
            <p className="text-gray-500 text-lg">ثلاث خطوات وتكون في الملعب</p>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8" role="list">
            {/* Step 1 */}
            <li className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line — desktop only */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-10 start-1/2 w-full h-px bg-brand-100"
              />
              <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200">
                <IconScreen />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-brand-400 uppercase tracking-widest">
                  الخطوة ١
                </span>
                <h3 className="text-xl font-bold text-gray-900">أنشئ غرفة</h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  المضيف يفتح غرفة جديدة بضغطة زر
                </p>
              </div>
            </li>

            {/* Step 2 */}
            <li className="relative flex flex-col items-center text-center gap-4">
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-10 start-1/2 w-full h-px bg-brand-100"
              />
              <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
                <IconShare />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-purple-400 uppercase tracking-widest">
                  الخطوة ٢
                </span>
                <h3 className="text-xl font-bold text-gray-900">شارك الكود</h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  شارك كود الغرفة مع الأصدقاء
                </p>
              </div>
            </li>

            {/* Step 3 */}
            <li className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                <IconGamepad />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-violet-400 uppercase tracking-widest">
                  الخطوة ٣
                </span>
                <h3 className="text-xl font-bold text-gray-900">العبوا!</h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  الكل يجاوب من جواله والنتائج على الشاشة
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: FEATURE HIGHLIGHTS
          ================================================================ */}
      <section
        aria-labelledby="features-heading"
        className="py-20 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
            >
              ليش شعللها؟
            </h2>
            <p className="text-gray-500 text-lg">تجربة لعب مختلفة عن أي شيء جربته</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <article className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-50 text-brand-600 mb-6 group-hover:bg-brand-100 transition-colors duration-300">
                <IconQuestions />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3 أنواع أسئلة</h3>
              <p className="text-gray-500 leading-relaxed">
                اختيار من متعدد، تخمين بالصور والصوت، وإجابات حرة — ما في ملل أبداً
              </p>
            </article>

            {/* Card 2 */}
            <article className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-purple-50 text-purple-600 mb-6 group-hover:bg-purple-100 transition-colors duration-300">
                <IconPower />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">قدرات خاصة</h3>
              <p className="text-gray-500 leading-relaxed">
                نقاط مضاعفة، تجميد الخصم، وحذف إجابات — اللعب الاستراتيجي حقيقي
              </p>
            </article>

            {/* Card 3 */}
            <article className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-violet-50 text-violet-600 mb-6 group-hover:bg-violet-100 transition-colors duration-300">
                <IconDevice />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">بدون تحميل</h3>
              <p className="text-gray-500 leading-relaxed">
                العب مباشرة من المتصفح بدون أي تطبيق — فتح الرابط وخلاص
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 4: STATS / SOCIAL PROOF
          ================================================================ */}
      <section
        aria-labelledby="stats-heading"
        className="py-20 px-6 bg-gradient-to-br from-brand-600 via-purple-600 to-violet-700 text-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            id="stats-heading"
            className="text-3xl sm:text-4xl font-black mb-14"
          >
            الأرقام تحكي
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-5xl sm:text-6xl font-black tabular-nums"
                aria-label="أكثر من 204 سؤال"
              >
                <AnimatedCounter target={204} suffix="+" />
              </span>
              <span className="text-white/75 font-semibold text-base">سؤال</span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-5xl sm:text-6xl font-black tabular-nums"
                aria-label="6 فئات"
              >
                <AnimatedCounter target={6} />
              </span>
              <span className="text-white/75 font-semibold text-base">فئات</span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-5xl sm:text-6xl font-black tabular-nums"
                aria-label="3 أنواع ألعاب"
              >
                <AnimatedCounter target={3} />
              </span>
              <span className="text-white/75 font-semibold text-base">أنواع ألعاب</span>
            </div>

            {/* Stat 4 — static, infinity symbol */}
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-5xl sm:text-6xl font-black"
                aria-label="ضحك لا نهاية له"
              >
                ∞
              </span>
              <span className="text-white/75 font-semibold text-base">ضحك</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 5: FINAL CTA
          ================================================================ */}
      <section
        aria-labelledby="final-cta-heading"
        className="py-24 px-6 bg-white text-center"
      >
        <div className="max-w-2xl mx-auto space-y-8">
          <h2
            id="final-cta-heading"
            className="text-4xl sm:text-5xl font-black text-gray-900"
          >
            جاهزين تشعللوها؟
          </h2>
          <p className="text-gray-500 text-xl leading-relaxed">
            ابدأ الآن — بدون حساب، بدون تحميل، بدون انتظار
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/host"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-200 hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all duration-300 min-h-[52px]"
              aria-label="أنشئ غرفة لعب جديدة"
            >
              أنشئ غرفة
            </a>
            <a
              href="/join"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-bold text-brand-700 border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all duration-300 min-h-[52px]"
              aria-label="انضم إلى غرفة باستخدام الكود"
            >
              عندك كود؟ انضم
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p className="flex items-center gap-1">
            شعللها © 2026 — صنع بحب{' '}
            <IconFlame />
          </p>
          <a
            href="/admin"
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            لوحة الإدارة
          </a>
        </div>
      </footer>
    </main>
  )
}
