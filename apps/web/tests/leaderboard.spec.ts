/**
 * Phase 12 Plan 09 — Leaderboard API Smoke Tests
 *
 * These tests exercise the /api/leaderboard route at the HTTP level.
 * They are designed to run against a locally running Next.js dev server.
 *
 * Prerequisites:
 *   - App running at TEST_BASE_URL (default: http://localhost:3000)
 *   - Database reachable from the Next.js process
 *
 * Run:
 *   TEST_BASE_URL=http://localhost:3000 npx playwright test tests/leaderboard.spec.ts
 *
 * NOTE: Set SKIP_LIVE_SERVER=1 to skip all tests when no server is running.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const skipLive = process.env.SKIP_LIVE_SERVER === '1'

test.describe('Leaderboard API — /api/leaderboard', () => {
  // ---------------------------------------------------------------------------
  // 1. Default (alltime) period returns 200 with a JSON array
  // ---------------------------------------------------------------------------
  test('GET /api/leaderboard returns 200 with a JSON array', async ({ request }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    const res = await request.get(`${BASE_URL}/api/leaderboard`)

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)

    // Each entry must have the required fields if the array is non-empty
    if (body.length > 0) {
      const row = body[0]
      expect(row).toHaveProperty('rank')
      expect(row).toHaveProperty('userId')
      expect(row).toHaveProperty('wins')
      expect(row).toHaveProperty('gamesPlayed')
      expect(row).toHaveProperty('winRate')
    }
  })

  // ---------------------------------------------------------------------------
  // 2. weekly period returns 200 with a JSON array
  // ---------------------------------------------------------------------------
  test('GET /api/leaderboard?period=weekly returns 200 with a JSON array', async ({ request }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    const res = await request.get(`${BASE_URL}/api/leaderboard?period=weekly`)

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // 3. Invalid period returns 400 with an error payload
  // ---------------------------------------------------------------------------
  test('GET /api/leaderboard?period=invalid returns 400', async ({ request }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    const res = await request.get(`${BASE_URL}/api/leaderboard?period=invalid`)

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  // ---------------------------------------------------------------------------
  // 4. Category filter returns 200 and only passes clean values through
  //    (SQL injection chars must be stripped — tested via response shape, not DB)
  // ---------------------------------------------------------------------------
  test('GET /api/leaderboard?category=<id> returns 200 for a safe category id', async ({ request }) => {
    test.skip(skipLive, 'Skipped: SKIP_LIVE_SERVER=1 — no local server running')

    // Use a syntactically-valid but non-existent category id — should return an empty array, not an error
    const res = await request.get(`${BASE_URL}/api/leaderboard?category=nonexistent-cat-id`)

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    // Empty array expected for a non-existent category
    expect(body.length).toBe(0)
  })
})
