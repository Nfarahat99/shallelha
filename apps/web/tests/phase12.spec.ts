/**
 * Phase 12 Plan 09 — Page-Level Smoke Tests
 *
 * Covers:
 *   - /leaderboard page renders the heading and period toggle
 *   - /api/og/profile?userId= error handling (missing or invalid userId)
 *   - Avatar null safety: avatarEmoji falls back to the default emoji
 *
 * Prerequisites:
 *   - App running at TEST_BASE_URL (default: http://localhost:3000)
 *
 * Run:
 *   TEST_BASE_URL=http://localhost:3000 npx playwright test tests/phase12.spec.ts
 *
 * NOTE: Set SKIP_LIVE_SERVER=1 to skip tests that require a running server.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const skipLive = process.env.SKIP_LIVE_SERVER === '1'

test.describe('Phase 12 smoke tests', () => {
  // ---------------------------------------------------------------------------
  // 1. Leaderboard page — structural render
  // ---------------------------------------------------------------------------
  test.describe('Leaderboard page', () => {
    test('renders the Arabic heading', async ({ page }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      await page.goto(`${BASE_URL}/leaderboard`)

      // Main heading must contain the Arabic title
      await expect(
        page.getByRole('heading', { level: 1 }).filter({ hasText: 'لوحة المتصدرين' })
      ).toBeVisible()
    })

    test('renders the alltime / weekly period toggle buttons', async ({ page }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      await page.goto(`${BASE_URL}/leaderboard`)

      // Both period buttons must be present (LeaderboardClient toggle)
      await expect(page.getByRole('button', { name: 'كل الأوقات' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'هذا الأسبوع' })).toBeVisible()
    })

    test('period toggle is accessible (aria-pressed reflects active period)', async ({ page }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      await page.goto(`${BASE_URL}/leaderboard`)

      const alltimeBtn = page.getByRole('button', { name: 'كل الأوقات' })
      const weeklyBtn  = page.getByRole('button', { name: 'هذا الأسبوع' })

      // On initial load, alltime is active
      await expect(alltimeBtn).toHaveAttribute('aria-pressed', 'true')
      await expect(weeklyBtn).toHaveAttribute('aria-pressed', 'false')

      // After clicking weekly, aria-pressed switches
      await weeklyBtn.click()
      await expect(weeklyBtn).toHaveAttribute('aria-pressed', 'true')
      await expect(alltimeBtn).toHaveAttribute('aria-pressed', 'false')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. OG profile card — error handling
  // ---------------------------------------------------------------------------
  test.describe('OG profile card — /api/og/profile', () => {
    test('returns 400 when userId is missing', async ({ request }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      const res = await request.get(`${BASE_URL}/api/og/profile`)
      // Route validates userId and returns 400 when absent
      expect(res.status()).toBe(400)
    })

    test('returns 404 for a non-existent userId', async ({ request }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      const res = await request.get(`${BASE_URL}/api/og/profile?userId=nonexistent-user-000`)
      // prisma.user.findUnique returns null → 404
      expect(res.status()).toBe(404)
    })

    test('does not expose internal errors via 200 on bad input', async ({ request }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      // XSS-style value — must be sanitized by the route, not crash with 500
      const res = await request.get(
        `${BASE_URL}/api/og/profile?userId=<script>alert(1)</script>`
      )
      // After sanitization, userId becomes empty → 400, not 500
      expect([400, 404]).toContain(res.status())
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Avatar null safety — LeaderboardClient renders fallback emoji
  // ---------------------------------------------------------------------------
  test.describe('Avatar null safety on leaderboard', () => {
    test('renders the default game controller emoji when avatarEmoji is null', async ({ page }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      // Mock the leaderboard API to return a row with null avatarEmoji
      await page.route('**/api/leaderboard*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              rank: 1,
              userId: 'mock-user-001',
              displayName: 'لاعب تجريبي',
              avatarEmoji: null,
              avatarConfig: null,
              wins: 10,
              gamesPlayed: 15,
              winRate: 66.7,
            },
          ]),
        })
      })

      await page.goto(`${BASE_URL}/leaderboard`)

      // The fallback emoji '🎮' must appear when avatarEmoji is null
      await expect(page.getByText('🎮')).toBeVisible()
    })

    test('renders a provided avatarEmoji when present', async ({ page }) => {
      test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

      await page.route('**/api/leaderboard*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              rank: 1,
              userId: 'mock-user-002',
              displayName: 'لاعب آخر',
              avatarEmoji: '🦁',
              avatarConfig: null,
              wins: 5,
              gamesPlayed: 8,
              winRate: 62.5,
            },
          ]),
        })
      })

      await page.goto(`${BASE_URL}/leaderboard`)

      await expect(page.getByText('🦁')).toBeVisible()
    })
  })
})
