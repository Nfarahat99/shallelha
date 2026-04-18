/**
 * Phase 11 Plan 08 — Smoke Tests
 *
 * These tests validate the Phase 11 landing page redesign and profile auth guard.
 * They are designed to run against a locally running Next.js dev server.
 *
 * Prerequisites:
 *   - Playwright configured (npx playwright install)
 *   - App running at TEST_BASE_URL (default: http://localhost:3000)
 *
 * Run:
 *   TEST_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/phase11-smoke.spec.ts
 *
 * NOTE: When no local server is running, tests that require a live server are
 * skipped automatically via the SKIP_LIVE_SERVER env flag.
 */

import { test, expect } from '@playwright/test'

// Use local dev server; set TEST_BASE_URL to override
const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

// Set SKIP_LIVE_SERVER=1 to skip tests that require a running Next.js server
const skipLive = process.env.SKIP_LIVE_SERVER === '1'

// ---------------------------------------------------------------------------
// Phase 11 smoke tests
// ---------------------------------------------------------------------------

test.describe('Phase 11 smoke', () => {
  // -------------------------------------------------------------------------
  // Group 1 — Landing page
  // Tests the Phase 11 redesigned landing page (apps/web/app/page.tsx)
  // -------------------------------------------------------------------------

  test('landing page renders Arabic hero and both CTAs', async ({ page }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    await page.goto(`${BASE_URL}/`)
    // h1 heading contains the brand name
    await expect(page.getByRole('heading', { level: 1 })).toContainText('شعللها')
    // Both primary CTAs must be present (page has duplicate links in hero + footer CTA;
    // match by visible text using getByText to avoid aria-label mismatch; .first() avoids
    // strict-mode violation when both hero and bottom CTA contain the same link text)
    await expect(page.getByText('ابدأ لعبة').first()).toBeVisible()
    await expect(page.getByText('انضم للعبة').first()).toBeVisible()
    // How-to-play section heading
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: 'كيف تلعب' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Group 2 — Post-game leaderboard (requires live game session — manual QA)
  // -------------------------------------------------------------------------

  test.skip('post-game leaderboard renders rank badges (requires live game session)', async () => {
    // Manual QA: join a game, end it, verify leaderboard + rank badge + share button visible
  })

  // -------------------------------------------------------------------------
  // Group 3 — Profile auth guard
  // next-auth redirects /profile → /api/auth/signin when unauthenticated
  // -------------------------------------------------------------------------

  test('/profile redirects unauthenticated user to sign-in', async ({ page }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    await page.goto(`${BASE_URL}/profile`)
    // next-auth v5 redirects to /api/auth/signin
    await expect(page).toHaveURL(/api\/auth\/signin|signin|auth|login/)
  })
})
