---
plan: 07-04
phase: 07-admin-dashboard-content-management
status: complete
completed_at: 2026-04-11T11:09:04Z
key-files:
  created:
    - apps/server/src/routes/admin.ts
  modified:
    - apps/server/src/socket/game.ts
    - apps/server/src/index.ts
    - apps/server/src/routes/__tests__/admin.test.ts
    - apps/server/src/game/__tests__/admin-workflow.test.ts
key-decisions:
  - "Prisma import path is apps/server/src/db/prisma (not lib/prisma) — matched existing health.ts pattern"
  - "Wrong-answer detection uses s.streak === 0 && s.answeredCurrentQ — streak resets to 0 on wrong answer per game.ts player:answer handler"
  - "Rate-limit test sends 31 concurrent requests to verify 429 appears — avoids sleeping between requests"
  - "admin-workflow tests mock prisma and test the contract (what query filters are passed) rather than full socket flow — fast and DB-free"
---

## What Was Built

Analytics counters wired fire-and-forget into the game loop at reveal time; Express admin analytics endpoint returning per-question wrongRate; all Wave 0 test stubs replaced with real passing tests.

## Tasks Completed

### Task 1: Analytics + Admin Route

- Installed `express-rate-limit` and `zod` in `apps/server`
- Added fire-and-forget `timesPlayed` and `timesAnsweredWrong` Prisma atomic increments in `handleReveal` in `game.ts`, placed after `io.to(roomCode).emit('question:revealed', ...)` using `void prisma.question.update().catch()` pattern — never blocks the game loop
- Wrong-answer count derived from `playerStates` at reveal time: players with `answeredCurrentQ === true && streak === 0` answered wrong (streak resets to 0 on wrong answer per the `player:answer` handler)
- Created `apps/server/src/routes/admin.ts` exporting `adminRouter` with `GET /analytics` endpoint, rate-limited to 30 req/min via `express-rate-limit`, returns all questions with computed `wrongRate = timesAnsweredWrong / timesPlayed` (0 when `timesPlayed === 0`)
- Registered `adminRouter` in `apps/server/src/index.ts` at `app.use('/admin', adminRouter)` before the 404 handler

### Task 2: Test Stubs Completed

- Replaced all 4 `it.todo()` stubs in `admin.test.ts` with real supertest tests: question stats shape, wrongRate at 0.3 for 3/10 wrong, wrongRate 0 for timesPlayed=0, 429 on 31st concurrent request
- Replaced all 5 `it.todo()` stubs in `admin-workflow.test.ts` with real tests: approved-only filter verified, draft excluded, live excluded, draft-to-approved transition, archived category (no approved questions returned)
- All 67 tests pass; 4 remaining todos in `admin-seed.test.ts` are out of scope for this plan

## Self-Check

- [x] Fire-and-forget analytics wired in handleReveal (void+catch, no await)
- [x] Prisma atomic increment used (not read-then-write)
- [x] GET /admin/analytics returns wrongRate
- [x] Rate-limited at 30 req/min
- [x] adminRouter registered before 404 handler
- [x] No it.todo() stubs remain in admin.test.ts or admin-workflow.test.ts
- [x] All tests pass (67 passed, no failures)
- [x] TypeScript compiles clean

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. One clarification: the plan referenced `'../lib/prisma'` as the prisma import path, but the actual path in this codebase is `'../db/prisma'`. This was identified during the read-first step and corrected before writing any code — not a deviation during execution.

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model (T-7-06 through T-7-09).
