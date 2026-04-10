---
phase: 03-arabic-ui-host-display-player-controller
plan: "01"
subsystem: game-engine-data-layer
tags: [prisma, postgresql, seed, game-types, scoring, leaderboard, tdd, redis]
dependency_graph:
  requires: []
  provides:
    - Question + Category Prisma models (schema.prisma)
    - 30 Arabic seed questions across 3 categories
    - GameState / PlayerGameState / HostSettings / LeaderboardEntry types
    - calculateScore function (server-side, speed-based with streak multiplier)
    - getLeaderboard / createInitialPlayerStates helpers
    - saveGameState / getGameState Redis persistence helpers
  affects:
    - apps/server/prisma/schema.prisma
    - apps/server/src/game/game.service.ts
    - apps/server/src/game/game.types.ts
tech_stack:
  added: []
  patterns:
    - TDD (RED → GREEN) for all game service functions
    - vi.mock for Redis isolation in unit tests
    - Prisma upsert for idempotent category seeding
    - JSON-in-hash pattern for Redis game state (room:{code} hash)
key_files:
  created:
    - apps/server/prisma/seed.ts
    - apps/server/src/game/game.types.ts
    - apps/server/src/game/game.service.ts
    - apps/server/src/game/__tests__/game.service.test.ts
  modified:
    - apps/server/prisma/schema.prisma
    - apps/server/package.json
decisions:
  - "Redis mock (vi.mock) used in game service tests to match existing room-service test pattern"
  - "Seed uses prisma.question.create in loops (not createMany) for clear per-question control and idempotent category upserts"
  - "calculateScore clamps elapsedMs to [0, timerDurationMs] — server derives elapsed from timestamps, never from client"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-10"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 03 Plan 01: Game Engine Data Layer Summary

**One-liner:** PostgreSQL Question/Category schema + 30 Arabic seed questions + speed-based scoring service with streak multiplier, all test-driven with 16 passing unit tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Prisma schema, seed, game types | f08c1be | schema.prisma, seed.ts, game.types.ts, package.json |
| 2 (RED) | Failing tests for game service | f21b939 | game.service.test.ts |
| 2 (GREEN) | Game service implementation | 33b367b | game.service.ts, game.service.test.ts |

## What Was Built

### Prisma Schema Extension (`apps/server/prisma/schema.prisma`)
- Added `QuestionStatus` enum: `draft | approved | live`
- Extended `Category` model: added `slug String @unique` and `questions Question[]` relation
- Added `Question` model with: `id`, `text`, `options String[]`, `correctIndex Int`, `timerDuration Int @default(20)`, `status QuestionStatus @default(draft)`, `categoryId`, timestamps
- NextAuth models (User, Account, Session, VerificationToken) untouched

### Seed Script (`apps/server/prisma/seed.ts`)
- 3 Arabic categories via idempotent `upsert` by slug: `ثقافة عامة` (thaqafa-amma), `رياضة` (riyadha), `ترفيه` (tarfeeh)
- 30 real Arabic trivia questions (10 per category), all `status: approved`, `timerDuration: 20`
- Questions culturally appropriate for Gulf audience (geography, Islam, sports, entertainment)
- `prisma.$disconnect()` in finally block

### Game Types (`apps/server/src/game/game.types.ts`)
Exports: `HostSettings`, `PlayerGameState`, `GameState`, `LeaderboardEntry`, `QuestionPayload`

### Game Service (`apps/server/src/game/game.service.ts`)
- **`calculateScore(isCorrect, elapsedMs, timerDurationMs, streak)`** — Kahoot model: 1000 (instant) → 500 (last second), 1.5x at streak ≥ 3, 0 for wrong, clamps elapsed to valid range
- **`createInitialPlayerStates(players)`** — zeroes score/streak/answeredCurrentQ for all players
- **`getLeaderboard(playerStates, players)`** — sorted descending with tied-rank support
- **`saveGameState / getGameState`** — persist GameState as JSON in `room:{code}` Redis hash

### Unit Tests (`apps/server/src/game/__tests__/game.service.test.ts`)
16 test cases covering:
- calculateScore: instant (1000), last-second (500), halfway (750), wrong (0), streak ≥ 3 (1500), streak 2 (1000), halfway+streak4 (1125), negative elapsed clamped (1000), over-timer clamped (500), wrong+streak (0)
- getLeaderboard: sort order, rank assignment, tied ranks, missing state defaults to 0
- createInitialPlayerStates: correct initial values, empty player list

**All 30 tests pass (16 new + 14 existing).**

## Verification

- `npx prisma validate` — PASSED (schema valid)
- `npx prisma generate` — PASSED (Prisma client generated)
- `npm run test -- --run` — PASSED (30/30 tests)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Redis mock added to game service tests**
- **Found during:** Task 2 GREEN (first test run)
- **Issue:** `game.service.ts` imports `redis` from `../redis/client` which throws at module load time if `REDIS_URL` env var is not set. Tests failed to load the suite.
- **Fix:** Added `vi.mock('../../redis/client', ...)` at the top of the test file, matching the established pattern used in `room-service.test.ts`.
- **Files modified:** `apps/server/src/game/__tests__/game.service.test.ts`
- **Commit:** 33b367b

## Known Stubs

None — all functions are fully implemented with real logic. Seed questions are real Arabic trivia, not placeholders.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: score-trust-boundary | apps/server/src/game/game.service.ts | calculateScore accepts elapsedMs as a parameter — callers MUST derive this from server-side `questionStartedAt` timestamps, never from client-supplied values (T-03-01 mitigation noted in code comment) |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/server/prisma/schema.prisma | FOUND |
| apps/server/prisma/seed.ts | FOUND |
| apps/server/src/game/game.types.ts | FOUND |
| apps/server/src/game/game.service.ts | FOUND |
| apps/server/src/game/__tests__/game.service.test.ts | FOUND |
| commit f08c1be (Task 1) | FOUND |
| commit f21b939 (Task 2 RED) | FOUND |
| commit 33b367b (Task 2 GREEN) | FOUND |
