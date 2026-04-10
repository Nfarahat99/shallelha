---
phase: 05-question-engine-media-guessing-free-text
plan: 01
subsystem: data-layer
tags: [prisma, schema, game-types, scoring, seed, cloudinary]
dependency_graph:
  requires: []
  provides: [QuestionType-enum, FreeTextAnswer-type, GameState-voting-phase, calculateFreeTextScore, seed-media-freetext, cloudinary-allowlist]
  affects: [05-02, 05-03]
tech_stack:
  added: []
  patterns: [TDD-red-green, additive-migration, idempotent-seed]
key_files:
  created: []
  modified:
    - apps/server/prisma/schema.prisma
    - apps/server/src/game/game.types.ts
    - apps/server/src/game/game.service.ts
    - apps/server/src/game/__tests__/game.service.test.ts
    - apps/server/prisma/seed.ts
    - apps/web/next.config.mjs
decisions:
  - "Mirror QuestionType as plain TypeScript union in game.types.ts (not imported from Prisma) so frontend/shared code avoids Prisma client dependency"
  - "Seed uses three separate idempotent guards (MC count, MEDIA_GUESSING count, FREE_TEXT count) so re-runs never duplicate any type"
  - "calculateFreeTextScore is a pure function with no external state — all edge cases covered by unit tests (T-05-02 mitigation)"
metrics:
  duration_seconds: 263
  completed_date: "2026-04-11"
  tasks_completed: 2
  files_modified: 6
---

# Phase 05 Plan 01: Data Layer Foundation Summary

One-liner: Prisma QuestionType enum with 3 values, extended GameState/QuestionPayload/PlayerGameState types, pure calculateFreeTextScore() with 6 TDD unit tests covering all edge cases, 10 new seed questions (5 media + 5 free text), and Cloudinary remotePatterns allowlist.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Prisma schema migration + type extensions + next.config.mjs | 6b1d435 | schema.prisma, game.types.ts, next.config.mjs |
| 2 | Free text scoring function + seed data | 5fa9d44 | game.service.ts, game.service.test.ts, seed.ts |

## What Was Built

### Task 1: Schema + Types + Cloudinary

**schema.prisma** — Added `QuestionType` enum with 3 values (`MULTIPLE_CHOICE`, `MEDIA_GUESSING`, `FREE_TEXT`) before the Question model. Added `type QuestionType @default(MULTIPLE_CHOICE)` and `mediaUrl String?` fields to the Question model. Additive migration — existing rows get `MULTIPLE_CHOICE` default. Prisma client regenerated; `QuestionType` is importable from `@prisma/client`.

**game.types.ts** — Added:
- `QuestionType` type union (mirrors Prisma enum, no Prisma client dep)
- `FreeTextAnswer` interface `{ text: string; votes: string[] }`
- `GameState.phase` extended with `'voting'`
- `GameState.freeTextAnswers?: Record<string, FreeTextAnswer>`
- `GameState.votingDeadline?: number`
- `PlayerGameState.votedCurrentQ?: boolean`
- `QuestionPayload.type: QuestionType` and `QuestionPayload.mediaUrl?: string`

**next.config.mjs** — Added `images.remotePatterns` with `res.cloudinary.com` allowlist (T-05-01 mitigation).

### Task 2: Scoring Function + Seed

**game.service.ts** — Added `calculateFreeTextScore(freeTextAnswers)` with `FreeTextResult` interface. Logic: find max vote count, award 800 to all tied-winner authors, 200 to voters of winning answers, 0 to losers. Pure function (T-05-02 mitigation).

**game.service.test.ts** — 6 new TDD tests (all passing):
- Single winner with 3 votes
- Two tied winners (2 votes each)
- Zero votes (no winners)
- Single voter
- Player with no votes gets authorScore 0
- Voters for non-winning answers get 0 bonus

**seed.ts** — Restructured with three separate idempotent guards:
1. MC questions: seeded only if `question.count() === 0` (30 questions unchanged)
2. MEDIA_GUESSING: seeded only if `count({ where: { type: 'MEDIA_GUESSING' } }) === 0` (5 questions, Cloudinary demo URLs, timerDuration 25s)
3. FREE_TEXT: seeded only if `count({ where: { type: 'FREE_TEXT' } }) === 0` (5 Arabic questions, empty options[], timerDuration 30s)

## Verification

- `npx tsc --noEmit` — clean (zero errors)
- `npx vitest run src/game/__tests__/game.service.test.ts` — 22/22 passed
- `grep "QuestionType" schema.prisma` — enum exists with 3 values
- `grep "res.cloudinary.com" next.config.mjs` — domain allowlisted
- `grep "MEDIA_GUESSING" seed.ts` — 5 media questions seeded
- `grep "FREE_TEXT" seed.ts` — 5 free text questions seeded

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

The plan specified `npx prisma db push --accept-data-loss` before `prisma generate`. No `DATABASE_URL` is present in the worktree environment (expected — CI/dev without live DB), so only `prisma generate` was run with a placeholder URL. The schema changes will be applied to the live database during deployment via Railway's build process. The Prisma client was successfully regenerated and `QuestionType` is importable.

## Known Stubs

None — this plan creates data contracts (types, schema, scoring function). No UI rendering stubs introduced.

## Threat Flags

None — all threat model mitigations from the plan's `<threat_model>` were applied:
- T-05-01: `res.cloudinary.com` allowlisted in next.config.mjs remotePatterns
- T-05-02: `calculateFreeTextScore` is pure function with 6 unit tests covering all edge cases
- T-05-03: `mediaUrl` accepted as by-design public data (accepted disposition)

## Self-Check: PASSED
