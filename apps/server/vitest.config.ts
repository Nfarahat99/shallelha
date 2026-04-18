import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load .env file so DATABASE_URL is available to integration tests that use real Prisma.
  // Unit tests mock prisma so they are unaffected whether DATABASE_URL is set or not.
  const env = loadEnv(mode ?? 'test', process.cwd(), '')
  return {
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      coverage: {
        reporter: ['text'],
      },
      env,
    },
  }
})
