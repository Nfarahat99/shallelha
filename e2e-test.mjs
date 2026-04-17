import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'https://shallelha.vercel.app'
const SERVER = process.env.SERVER_URL || 'https://shallelha-server-production.up.railway.app'
const results = []

function pass(test, detail = '') { results.push({ status: 'PASS', test, detail }); console.log(`✅ PASS — ${test}${detail ? ' | ' + detail : ''}`) }
function fail(test, detail = '') { results.push({ status: 'FAIL', test, detail }); console.error(`❌ FAIL — ${test}${detail ? ' | ' + detail : ''}`) }
function warn(test, detail = '') { results.push({ status: 'WARN', test, detail }); console.warn(`⚠️  WARN — ${test}${detail ? ' | ' + detail : ''}`) }

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  })

  // ── 1. SERVER HEALTH ────────────────────────────────────────────────────────
  console.log('\n=== SERVER HEALTH ===')
  try {
    const r = await fetch(`${SERVER}/health`)
    const body = await r.json()
    if (body.status === 'ok') pass('Server health', JSON.stringify(body))
    else fail('Server health', JSON.stringify(body))
    if (body.postgres === 'ok') pass('PostgreSQL connected')
    else fail('PostgreSQL connected', body.postgres)
    if (body.redis === 'ok') pass('Redis connected')
    else fail('Redis connected', body.redis)
  } catch (e) { fail('Server health', e.message) }

  // ── 2. FRONTEND PAGES ───────────────────────────────────────────────────────
  console.log('\n=== FRONTEND PAGES ===')
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))

  // Landing / root
  try {
    const res = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 })
    if (res.status() < 400) pass('Root page loads', `HTTP ${res.status()}`)
    else fail('Root page loads', `HTTP ${res.status()}`)
  } catch (e) { fail('Root page loads', e.message) }

  // Check RTL
  try {
    const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'))
    if (dir === 'rtl') pass('RTL direction set on <html>', 'dir=rtl')
    else fail('RTL direction', `dir="${dir}" (expected rtl)`)
  } catch (e) { fail('RTL direction check', e.message) }

  // Check Cairo font loaded
  try {
    const fontLoaded = await page.evaluate(() => {
      return document.fonts.check('16px Cairo') ||
             document.fonts.check('700 16px Cairo') ||
             [...document.fonts].some(f => f.family === 'Cairo' && f.status === 'loaded')
    })
    if (fontLoaded) pass('Cairo font loaded')
    else warn('Cairo font', 'Not detected as loaded — may still render correctly on device')
  } catch (e) { warn('Cairo font check', e.message) }

  // /join page (no auth needed)
  try {
    const res = await page.goto(`${BASE}/join`, { waitUntil: 'networkidle', timeout: 15000 })
    if (res.status() < 400) pass('/join page loads', `HTTP ${res.status()}`)
    else fail('/join page loads', `HTTP ${res.status()}`)

    // Check for Arabic text
    const bodyText = await page.textContent('body')
    const hasArabic = /[\u0600-\u06FF]/.test(bodyText)
    if (hasArabic) pass('/join has Arabic text')
    else warn('/join Arabic text', 'No Arabic characters found in body')

    // Check for room code input
    const hasInput = await page.locator('input').count() > 0
    if (hasInput) pass('/join has input field for room code')
    else fail('/join missing input field')

    await page.screenshot({ path: '/tmp/join-page.png', fullPage: true })
    pass('Screenshot saved', '/tmp/join-page.png')
  } catch (e) { fail('/join page', e.message) }

  // /host/new — should redirect to sign-in (auth middleware)
  try {
    const res = await page.goto(`${BASE}/host/new`, { waitUntil: 'networkidle', timeout: 15000 })
    const url = page.url()
    if (url.includes('/auth/signin') || url.includes('/signin')) {
      pass('/host/new → redirects to sign-in', `landed at: ${url}`)
    } else if (res.status() === 200 && !url.includes('signin')) {
      warn('/host/new auth redirect', `Landed at ${url} without redirect — auth may not be protecting route`)
    } else {
      fail('/host/new', `Unexpected URL: ${url}`)
    }

    // Check sign-in page has Google button
    const googleBtn = await page.locator('text=/Google|جوجل/i').count()
    if (googleBtn > 0) pass('Google sign-in button visible on auth page')
    else fail('Google sign-in button', 'Not found on sign-in page')

    await page.screenshot({ path: '/tmp/signin-page.png', fullPage: true })
  } catch (e) { fail('/host/new redirect', e.message) }

  // ── 3. SOCKET.IO CONNECTION ─────────────────────────────────────────────────
  console.log('\n=== SOCKET.IO ===')
  try {
    const socketTest = await page.evaluate(async (server) => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js'
        document.head.appendChild(script)
        script.onload = () => {
          const socket = window.io(server, { transports: ['websocket'], timeout: 5000 })
          const t = setTimeout(() => { socket.disconnect(); resolve({ ok: false, reason: 'timeout' }) }, 6000)
          socket.on('connect', () => { clearTimeout(t); socket.disconnect(); resolve({ ok: true, id: socket.id }) })
          socket.on('connect_error', (e) => { clearTimeout(t); resolve({ ok: false, reason: e.message }) })
        }
        script.onerror = () => resolve({ ok: false, reason: 'failed to load socket.io client' })
      })
    }, SERVER)

    if (socketTest.ok) pass('Socket.io WebSocket connection', `socket.id: ${socketTest.id}`)
    else fail('Socket.io connection', socketTest.reason)
  } catch (e) { fail('Socket.io test', e.message) }

  // ── 4. ROOM JOIN FLOW (player, no auth) ─────────────────────────────────────
  console.log('\n=== ROOM JOIN FLOW ===')

  // room:create requires a real Google auth token — test that the server
  // correctly rejects unauthenticated attempts (expected behavior)
  let roomCode = null
  try {
    const authGuardResult = await page.evaluate(async (server) => {
      return new Promise((resolve) => {
        const socket = window.io(server, { transports: ['websocket'], timeout: 5000 })
        const t = setTimeout(() => { socket.disconnect(); resolve({ ok: false, reason: 'timeout' }) }, 8000)
        socket.on('connect', () => {
          socket.emit('room:create')  // no auth token — should get room:error
        })
        socket.on('room:created', (data) => {
          clearTimeout(t); socket.disconnect()
          resolve({ ok: false, reason: 'SECURITY: room created without auth — should not happen' })
        })
        socket.on('room:error', (data) => {
          clearTimeout(t); socket.disconnect()
          resolve({ ok: true, message: data.message })
        })
        socket.on('connect_error', (e) => { clearTimeout(t); resolve({ ok: false, reason: e.message }) })
      })
    }, SERVER)

    if (authGuardResult.ok) {
      pass('room:create auth guard works', `Server rejected unauthenticated attempt: "${authGuardResult.message}"`)
    } else {
      fail('room:create auth guard', authGuardResult.reason)
    }
  } catch (e) { fail('room:create auth guard test', e.message) }

  // Now join as a player via the UI
  if (roomCode) {
    try {
      const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      })
      const mobilePage = await mobileCtx.newPage()
      await mobilePage.goto(`${BASE}/join`, { waitUntil: 'networkidle', timeout: 15000 })

      // Enter room code
      const input = mobilePage.locator('input').first()
      await input.fill(roomCode)
      pass('Room code entered in /join input', roomCode)

      // Submit
      const submitBtn = mobilePage.locator('button[type="submit"], button:has-text("انضم"), button:has-text("Join"), button:has-text("دخول")').first()
      const btnCount = await submitBtn.count()
      if (btnCount > 0) {
        await submitBtn.click()
        await mobilePage.waitForTimeout(2000)
        const newUrl = mobilePage.url()
        await mobilePage.screenshot({ path: '/tmp/player-join-after.png', fullPage: true })
        if (newUrl.includes(roomCode) || newUrl.includes('/join/')) {
          pass('Player navigated to join room page', newUrl)
        } else {
          warn('Player join navigation', `URL after submit: ${newUrl}`)
        }
      } else {
        warn('Join submit button', 'Could not find submit button — UI may require emoji selection first')
        await mobilePage.screenshot({ path: '/tmp/player-join.png', fullPage: true })
      }
      await mobileCtx.close()
    } catch (e) { fail('Player join UI flow', e.message) }
  }

  // ── 5. JOIN PAGE — Specific Room ─────────────────────────────────────────────
  if (roomCode) {
    console.log('\n=== ROOM-SPECIFIC JOIN PAGE ===')
    try {
      const mobileCtx2 = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const mp2 = await mobileCtx2.newPage()
      const res = await mp2.goto(`${BASE}/join/${roomCode}`, { waitUntil: 'networkidle', timeout: 15000 })
      if (res.status() < 400) {
        pass(`/join/${roomCode} loads`, `HTTP ${res.status()}`)
        const bodyText = await mp2.textContent('body')
        const hasArabic = /[\u0600-\u06FF]/.test(bodyText)
        if (hasArabic) pass(`/join/${roomCode} has Arabic text`)
        else warn(`/join/${roomCode} Arabic text`, 'No Arabic chars found')
        await mp2.screenshot({ path: '/tmp/player-room.png', fullPage: true })
      } else {
        fail(`/join/${roomCode}`, `HTTP ${res.status()}`)
      }
      await mobileCtx2.close()
    } catch (e) { fail(`/join/${roomCode}`, e.message) }
  }

  // ── 6. CONSOLE ERRORS CHECK ─────────────────────────────────────────────────
  console.log('\n=== CONSOLE ERRORS ===')
  const criticalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('fonts.gstatic') &&
    !e.includes('analytics')
  )
  if (criticalErrors.length === 0) pass('No critical console errors')
  else criticalErrors.forEach(e => fail('Console error', e.slice(0, 120)))

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  await browser.close()

  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  console.log(`PASS: ${passed} | FAIL: ${failed} | WARN: ${warned} | TOTAL: ${results.length}`)
  if (failed > 0) {
    console.log('\nFAILURES:')
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.test}: ${r.detail}`))
  }
  if (warned > 0) {
    console.log('\nWARNINGS:')
    results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ⚠️  ${r.test}: ${r.detail}`))
  }
  return failed
}

run().then(failures => process.exit(failures > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(1) })
