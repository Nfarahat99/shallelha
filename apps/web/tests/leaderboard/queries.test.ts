import { describe, test } from 'vitest'

describe('Leaderboard API', () => {
  test.todo('GET /api/leaderboard returns 200 with valid JSON array')
  test.todo('GET /api/leaderboard?period=invalid returns 400')
  test.todo('GET /api/leaderboard?period=weekly scopes to current week')
  test.todo('leaderboard results are limited to 50 entries')
})
