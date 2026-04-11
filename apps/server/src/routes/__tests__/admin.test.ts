import { describe, it } from 'vitest'

describe('Admin Analytics Endpoint', () => {
  it.todo('GET /admin/analytics returns question stats with timesPlayed and timesAnsweredWrong')
  it.todo('GET /admin/analytics returns wrongRate calculated as timesAnsweredWrong/timesPlayed')
  it.todo('GET /admin/analytics returns 0 wrongRate when timesPlayed is 0')
  it.todo('responds with 429 when rate limit exceeded')
})
