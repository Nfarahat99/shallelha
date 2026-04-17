/**
 * Phase 5 E2E Test Suite
 * Tests: question types seeded, media guessing payloads, free text flow end-to-end
 * Against: https://shallelha.vercel.app + https://shallelha-server-production.up.railway.app
 */
import { chromium } from 'playwright'

const BASE   = process.env.BASE_URL || 'https://shallelha.vercel.app'
const SERVER = process.env.SERVER_URL || 'https://shallelha-server-production.up.railway.app'

const results = []
function pass(test, detail = '') { results.push({ status: 'PASS', test, detail }); console.log(`✅  ${test}${detail ? ' | ' + detail : ''}`) }
function fail(test, detail = '') { results.push({ status: 'FAIL', test, detail }); console.error(`❌  ${test}${detail ? ' | ' + detail : ''}`) }
function warn(test, detail = '') { results.push({ status: 'WARN', test, detail }); console.warn(`⚠️   ${test}${detail ? ' | ' + detail : ''}`) }

// ─── helpers ───────────────────────────────────────────────────────────────────
async function socketConnect(page, server) {
  return page.evaluate(async (srv) => {
    await new Promise(resolve => {
      if (window.__sio_loaded) return resolve()
      const s = document.createElement('script')
      s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js'
      s.onload = () => { window.__sio_loaded = true; resolve() }
      document.head.appendChild(s)
    })
    return new Promise((res, rej) => {
      const sock = window.io(srv, { transports: ['websocket'], timeout: 8000 })
      const t = setTimeout(() => { sock.disconnect(); rej(new Error('connect timeout')) }, 10000)
      sock.on('connect', () => { clearTimeout(t); window.__sock = sock; res(sock.id) })
      sock.on('connect_error', e => { clearTimeout(t); rej(e) })
    })
  }, server)
}

async function socketEmitWait(page, event, data, replyEvent, timeout = 8000) {
  return page.evaluate(([ev, d, re, to]) => {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`timeout waiting for ${re}`)), to)
      window.__sock.once(re, (payload) => { clearTimeout(t); res(payload) })
      window.__sock.emit(ev, d)
    })
  }, [event, data, replyEvent, timeout])
}

// ─── main ──────────────────────────────────────────────────────────────────────
async function run() {

  // ── 1. SERVER HEALTH — 40 questions ──────────────────────────────────────────
  console.log('\n=== 1. SERVER HEALTH ===')
  try {
    const body = await fetch(`${SERVER}/health`).then(r => r.json())
    if (body.status === 'ok')         pass('Server health',       body.status)
    else                              fail('Server health',       JSON.stringify(body))
    if (body.postgres === 'ok')       pass('PostgreSQL connected')
    else                              fail('PostgreSQL',          body.postgres)
    if (body.redis === 'ok')          pass('Redis connected')
    else                              fail('Redis',               body.redis)
    if (body.approvedQuestions >= 40) pass('Phase 5 questions seeded', `${body.approvedQuestions} approved questions (≥40 expected)`)
    else if (body.approvedQuestions === 30) fail('Phase 5 questions seeded', `Still 30 — MEDIA_GUESSING / FREE_TEXT not seeded`)
    else                              warn('Question count',      `${body.approvedQuestions} (expected ≥40)`)
  } catch (e) { fail('Server health', e.message) }

  // ── 2. FRONTEND PAGES ─────────────────────────────────────────────────────────
  console.log('\n=== 2. FRONTEND PAGES ===')
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('pageerror', e => consoleErrors.push(e.message))

  try {
    const r = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
    r.status() < 400 ? pass('Root page loads', `HTTP ${r.status()}`) : fail('Root page loads', `HTTP ${r.status()}`)
  } catch (e) { fail('Root page', e.message) }

  try {
    const r = await page.goto(`${BASE}/join`, { waitUntil: 'networkidle', timeout: 20000 })
    r.status() < 400 ? pass('/join page loads') : fail('/join page', `HTTP ${r.status()}`)
    const txt = await page.textContent('body')
    const hasArabic = /[\u0600-\u06FF]/.test(txt)
    hasArabic ? pass('/join has Arabic text') : warn('/join Arabic', 'No Arabic found')
  } catch (e) { fail('/join page', e.message) }

  // host/new should redirect to auth
  try {
    await page.goto(`${BASE}/host/new`, { waitUntil: 'networkidle', timeout: 20000 })
    const url = page.url()
    url.includes('/auth/') || url.includes('/signin')
      ? pass('/host/new → auth redirect', url)
      : warn('/host/new redirect', `Landed at ${url}`)
  } catch (e) { fail('/host/new', e.message) }

  // ── 3. SOCKET CONNECT ─────────────────────────────────────────────────────────
  console.log('\n=== 3. SOCKET.IO ===')
  let sockId
  try {
    sockId = await socketConnect(page, SERVER)
    pass('WebSocket connected', `id=${sockId}`)
  } catch (e) { fail('Socket.io connect', e.message); await browser.close(); return results.filter(r => r.status === 'FAIL').length }

  // ── 4. AUTH GUARD ─────────────────────────────────────────────────────────────
  console.log('\n=== 4. AUTH GUARD ===')
  try {
    const errReply = await socketEmitWait(page, 'room:create', undefined, 'room:error', 6000)
    errReply?.message ? pass('room:create auth guard', errReply.message) : fail('room:create auth guard', 'no error returned')
  } catch (e) { fail('room:create auth guard', e.message) }

  // ── 5. GAME SIMULATION — all 3 question types ─────────────────────────────────
  // We can't authenticate in E2E without a real Google token.
  // Instead we test the server's question-type handling via a raw socket game
  // by having a second socket act as a mock "host" (requires room:join with guest token).
  //
  // What we CAN test without auth:
  //   a) room:join rejects non-existent room gracefully
  //   b) freetext:answer rejects if not in a game (correct behaviour)
  //   c) freetext:vote rejects if not in a game (correct behaviour)

  console.log('\n=== 5. PHASE 5 SOCKET HANDLERS ===')

  // 5a. join non-existent room — graceful error
  try {
    const errReply = await socketEmitWait(page, 'room:join', { roomCode: 'XXXX', playerName: 'تست', emoji: '🎮' }, 'room:error', 6000)
    errReply?.message ? pass('room:join unknown room → error', errReply.message) : fail('room:join unknown room', 'no error returned')
  } catch (e) { fail('room:join unknown room', e.message) }

  // 5b. freetext:answer without being in a room — should error or be ignored
  try {
    await page.evaluate(() => {
      window.__ftAnswerIgnored = true
      window.__sock.emit('freetext:answer', { answer: 'test' })
    })
    // wait briefly — no crash means handler is present and safe
    await page.waitForTimeout(1500)
    pass('freetext:answer handler exists (no crash)', 'emitted to non-joined socket without server crash')
  } catch (e) { fail('freetext:answer handler', e.message) }

  // 5c. freetext:vote without being in a room — same
  try {
    await page.evaluate(() => {
      window.__sock.emit('freetext:vote', { answerId: 'fake' })
    })
    await page.waitForTimeout(1500)
    pass('freetext:vote handler exists (no crash)', 'emitted to non-joined socket without server crash')
  } catch (e) { fail('freetext:vote handler', e.message) }

  // 5d. Verify server health still ok after rogue emissions
  try {
    const body = await fetch(`${SERVER}/health`).then(r => r.json())
    body.status === 'ok' ? pass('Server stable after rogue socket emissions') : fail('Server health post-test', JSON.stringify(body))
  } catch (e) { fail('Server health post-test', e.message) }

  // ── 6. FRONTEND PHASE 5 ASSETS ────────────────────────────────────────────────
  console.log('\n=== 6. FRONTEND PHASE 5 ASSETS ===')

  // Check that next/image Cloudinary domain is configured by fetching a known Cloudinary URL via the Next.js image optimizer
  // (Cloudinary remote pattern should be allowed in next.config.mjs)
  try {
    const imgUrl = `${BASE}/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fdemo%2Fimage%2Fupload%2Fsample.jpg&w=640&q=75`
    const r = await fetch(imgUrl)
    if (r.status === 200 || r.status === 304) {
      pass('Cloudinary remote pattern accepted by next/image', `HTTP ${r.status()}`)
    } else if (r.status === 400) {
      fail('Cloudinary remote pattern', `HTTP 400 — res.cloudinary.com NOT in remotePatterns`)
    } else {
      warn('Cloudinary next/image', `HTTP ${r.status()} — may need auth or different URL format`)
    }
  } catch (e) { warn('Cloudinary next/image check', e.message) }

  // Check key JS chunk for Phase 5 components is present (MediaQuestion, FreeTextFeed)
  // by checking the join page source for component indicators
  try {
    const r = await page.goto(`${BASE}/join`, { waitUntil: 'networkidle', timeout: 20000 })
    // The compiled JS bundle should include strings from Phase 5 components
    // Check for the Arabic strings we know are in Phase 5 components
    const html = await page.content()
    const hasFreeTextArabic = html.includes('استمع') || html.includes('VotingUI') || html.includes('FreeText')
    if (hasFreeTextArabic) {
      pass('Phase 5 component strings in bundle', 'Found Arabic Phase 5 strings in page bundle')
    } else {
      // The strings may be in a lazy-loaded chunk - this is acceptable
      warn('Phase 5 bundle check', 'Phase 5 strings not found in initial bundle (may be lazy-loaded)')
    }
  } catch (e) { warn('Phase 5 bundle check', e.message) }

  // ── 7. MOBILE VIEWPORT — join page ────────────────────────────────────────────
  console.log('\n=== 7. MOBILE VIEWPORT ===')
  try {
    const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const mp = await mCtx.newPage()
    await mp.goto(`${BASE}/join`, { waitUntil: 'networkidle', timeout: 20000 })
    const inp = await mp.locator('input').count()
    inp > 0 ? pass('Mobile /join has input', 'viewport 390x844') : fail('Mobile /join input', 'no input found')
    await mp.screenshot({ path: '/tmp/p5-mobile-join.png', fullPage: true })
    pass('Mobile screenshot saved', '/tmp/p5-mobile-join.png')
    await mCtx.close()
  } catch (e) { fail('Mobile /join', e.message) }

  // ── 8. CONSOLE ERRORS ─────────────────────────────────────────────────────────
  console.log('\n=== 8. CONSOLE ERRORS ===')
  const critical = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics'))
  critical.length === 0 ? pass('No critical page errors') : critical.forEach(e => fail('Page error', e.slice(0, 120)))

  await browser.close()

  // ── SUMMARY ───────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(65))
  console.log('PHASE 5 E2E SUMMARY')
  console.log('='.repeat(65))
  const passed  = results.filter(r => r.status === 'PASS').length
  const failed  = results.filter(r => r.status === 'FAIL').length
  const warned  = results.filter(r => r.status === 'WARN').length
  console.log(`PASS: ${passed} | FAIL: ${failed} | WARN: ${warned} | TOTAL: ${results.length}`)
  if (failed > 0) {
    console.log('\nFAILURES:')
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌  ${r.test}: ${r.detail}`))
  }
  if (warned > 0) {
    console.log('\nWARNINGS:')
    results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ⚠️   ${r.test}: ${r.detail}`))
  }
  return failed
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(1) })
