import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for apps/web smoke tests.
 *
 * Tests run against a locally running Next.js dev server.
 * Set SKIP_LIVE_SERVER=1 to skip tests that require a running server,
 * or set TEST_BASE_URL to point at a different host.
 *
 * Playwright is installed at the monorepo root (../../node_modules/.bin/playwright).
 */
export default defineConfig({
  testDir: './tests',
  // Glob to pick up all Playwright spec files under tests/ (including subdirs)
  testMatch: '**/*.spec.ts',
  // Ignore vitest unit test files that live alongside spec files
  testIgnore: ['**/leaderboard/queries.test.ts', '**/avatar/*.test.ts*', '**/avatar/*.test.tsx'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
