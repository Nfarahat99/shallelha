/**
 * Phase 10 Plan 07 — Quick UX Wins E2E Tests
 *
 * Prerequisites:
 *   - Playwright configured (npx playwright install)
 *   - App running at BASE_URL (default: http://localhost:3000)
 *   - Backend running at WS_URL (default: http://localhost:4000)
 *
 * Run:
 *   npx playwright test tests/e2e/phase10-ux-wins.spec.ts
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hostCreateRoom(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/host`)
  // Assumes an authenticated host session — adjust if auth is required
  await page.waitForSelector('[data-testid="room-code"], .font-mono')
  const codeEl = page.locator('.font-mono').first()
  return (await codeEl.textContent()) ?? ''
}

async function playerJoin(context: BrowserContext, roomCode: string, name: string): Promise<Page> {
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/join/${roomCode}`)
  await page.fill('input[placeholder]', name)
  await page.click('button[type="submit"], button:has-text("انضم")')
  await page.waitForSelector('[data-testid="player-game"], .player-waiting', { timeout: 10_000 })
  return page
}

// ---------------------------------------------------------------------------
// Test 1 — Rank delta badge shown after question answer
// ---------------------------------------------------------------------------

test('rank delta badge appears in answer feedback after answering a question', async ({ browser }) => {
  test.setTimeout(60_000)

  const hostCtx = await browser.newContext()
  const p1Ctx = await browser.newContext()
  const p2Ctx = await browser.newContext()

  const hostPage = await hostCtx.newPage()
  const roomCode = await hostCreateRoom(hostPage)

  const player1 = await playerJoin(p1Ctx, roomCode, 'لاعب1')
  const player2 = await playerJoin(p2Ctx, roomCode, 'لاعب2')

  // Host starts game
  await hostPage.click('button:has-text("ابدأ")')
  await hostPage.click('button:has-text("ابدأ اللعبة")')

  // Wait for question on player 1
  await player1.waitForSelector('[data-testid="answer-option"], .answer-option, button[data-option]', { timeout: 15_000 })

  // Player 1 answers first option
  await player1.locator('button').filter({ hasText: /./ }).first().click()

  // After answering, the revealed phase should show rank delta
  await player1.waitForSelector('[data-testid="rank-badge"], .text-green-400, .text-red-400', {
    timeout: 10_000,
  })

  // Verify rank is displayed — should show "#N" rank text
  const rankText = await player1.locator('[dir="rtl"]:has-text("المركز")').textContent()
  expect(rankText).toMatch(/المركز #/)

  await hostCtx.close()
  await p1Ctx.close()
  await p2Ctx.close()
})

// ---------------------------------------------------------------------------
// Test 2 — Answer count progress counter visible during question phase
// ---------------------------------------------------------------------------

test('answer count shows "X من Y أجابوا" after first player answers', async ({ browser }) => {
  test.setTimeout(60_000)

  const hostCtx = await browser.newContext()
  const p1Ctx = await browser.newContext()
  const p2Ctx = await browser.newContext()

  const hostPage = await hostCtx.newPage()
  const roomCode = await hostCreateRoom(hostPage)

  const player1 = await playerJoin(p1Ctx, roomCode, 'لاعب1')
  await playerJoin(p2Ctx, roomCode, 'لاعب2')

  // Host starts game
  await hostPage.click('button:has-text("ابدأ")')
  await hostPage.click('button:has-text("ابدأ اللعبة")')

  // Wait for question on player 1
  await player1.waitForSelector('button', { timeout: 15_000 })

  // Before answering — counter may not show (0 answers)
  // Player 1 answers
  await player1.locator('button').filter({ hasText: /./ }).first().click()

  // After answering — player 1 sees their own confirmation
  // From player 2's perspective, counter should show "١ من ٢ أجابوا"
  const p2Page = (await p2Ctx.pages())[0]
  await p2Page.waitForFunction(
    () => {
      const el = document.querySelector('[dir="rtl"]')
      return el?.textContent?.includes('أجابوا')
    },
    { timeout: 8_000 }
  )

  const counterText = await p2Page.locator('[dir="rtl"]:has-text("أجابوا")').first().textContent()
  // Arabic Eastern numerals: "١ من ٢ أجابوا"
  expect(counterText).toMatch(/أجابوا/)

  // Also verify on host screen
  await hostPage.waitForFunction(
    () => {
      const spans = Array.from(document.querySelectorAll('span'))
      return spans.some(s => s.textContent?.includes('أجابوا'))
    },
    { timeout: 8_000 }
  )

  await hostCtx.close()
  await p1Ctx.close()
  await p2Ctx.close()
})

// ---------------------------------------------------------------------------
// Test 3 — Freeze overlay shown to frozen player, clears on next question
// ---------------------------------------------------------------------------

test('freeze overlay appears full-screen for frozen player and clears on next question', async ({ browser }) => {
  test.setTimeout(90_000)

  const hostCtx = await browser.newContext()
  const p1Ctx = await browser.newContext()
  const p2Ctx = await browser.newContext()

  const hostPage = await hostCtx.newPage()
  const roomCode = await hostCreateRoom(hostPage)

  const player1 = await playerJoin(p1Ctx, roomCode, 'لاعب1')
  const player2 = await playerJoin(p2Ctx, roomCode, 'لاعب2')

  // Host starts game
  await hostPage.click('button:has-text("ابدأ")')
  await hostPage.click('button:has-text("ابدأ اللعبة")')

  // Wait for question
  await player1.waitForSelector('button', { timeout: 15_000 })

  // Player 1 uses freeze lifeline on player 2
  // Open lifelines panel
  await player1.locator('[data-testid="lifelines-btn"], button:has-text("الطوارئ"), button:has-text("مساعدة")').click()
  // Select freeze
  await player1.locator('button:has-text("تجميد"), [data-lifeline="freeze"]').click()
  // Select player 2 as target
  await player1.locator(`text=لاعب2`).click()
  // Confirm
  const confirmBtn = player1.locator('button:has-text("تأكيد"), button:has-text("تجميد")')
  if (await confirmBtn.count() > 0) await confirmBtn.click()

  // Player 2 should see freeze overlay
  await player2.waitForSelector('[role="alert"]:has-text("أنت مجمّد"), .fixed:has-text("مجمّد")', {
    timeout: 8_000,
  })

  const overlayText = await player2.locator('[role="alert"]').textContent()
  expect(overlayText).toContain('مجمّد')

  // Overlay has the ❄️ emoji
  expect(overlayText).toContain('❄️')

  // Host reveals answer and moves to next question
  await hostPage.click('button:has-text("كشف"), button:has-text("الإجابة")')
  await hostPage.click('button:has-text("التالي"), button:has-text("السؤال التالي")')

  // Overlay should disappear on new question
  await player2.waitForFunction(
    () => !document.querySelector('[role="alert"]'),
    { timeout: 8_000 }
  )

  const overlayAfter = await player2.locator('[role="alert"]').count()
  expect(overlayAfter).toBe(0)

  await hostCtx.close()
  await p1Ctx.close()
  await p2Ctx.close()
})
