---
phase: 10-ugc-question-packs-shareable-cards
plan: 08
subsystem: backend/game-engine
tags: [game-engine, packs, socket, prisma, integration-tests, security]
dependency_graph:
  requires: [10-01, 10-04]
  provides: [pack-game-engine-wiring, playcount-tracking]
  affects:
    - apps/server/src/socket/game.ts
    - apps/server/src/game/game.types.ts
    - apps/server/src/routes/__tests__/packs.integration.test.ts
tech_stack:
  added: []
  patterns: [fire-and-forget-prisma, additive-branch-pattern, approved-status-gate]
key_files:
  modified:
    - apps/server/src/socket/game.ts
    - apps/server/src/game/game.types.ts
    - apps/server/src/routes/__tests__/packs.integration.test.ts
decisions:
  - Used room.packId (from Redis via getRoom) as the branch condition — avoids any new socket payload; packId is already stored in Redis by Plan 10-04
  - Default timerDuration of 20s for pack questions (PackQuestion has no timerDuration field — consistent with typical quiz timing)
  - playCount increment added to BOTH question:next natural end AND game:end early exit — ensures count is always captured
  - Pack APPROVED status re-verified at game:start time (not just at room:create) as defense-in-depth against Redis tamper (T-10-08-01)
metrics:
  duration: ~20 minutes
  completed: 2026-04-18
  tasks_completed: 2
  files_created: 0
  files_modified: 3
---

# Phase 10 Plan 08: Wire PackQuestion into Game Engine Summary

**One-liner:** game.ts branches on room.packId to serve community PackQuestion rows instead of the global Question table, with APPROVED-status re-verification, DoS cap, Arabic error messages, and fire-and-forget playCount increment on game end.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Branch game engine question loading on packId | 5f29eb4 | game.ts, game.types.ts |
| 2 | Integration tests — question ordering + playCount increment | 5f29eb4 | packs.integration.test.ts |

---

## What Was Built

### Task 1 — Game Engine Pack Branch (`apps/server/src/socket/game.ts`)

**`game.types.ts` extension:**
- Added `packId?: string` to `GameState` interface — stored in Redis game state when a pack game is running

**`game:start` handler branch:**

```
if (room.packId) {
  1. prisma.pack.findUnique — verify status === 'APPROVED' (T-10-08-01)
  2. emit game:error 'الباقة المحددة غير متاحة' if not approved
  3. prisma.packQuestion.findMany — orderBy: order asc, take: 20 (T-10-08-02)
  4. emit game:error 'الباقة المحددة لا تحتوي على أسئلة' if empty
  5. map to QuestionData[] — id, text, options, correctIndex, timerDuration: 20, type, mediaUrl: undefined
} else {
  existing Question table behavior unchanged
}
```

**`packId` carried into `GameState`:** stored via `...(room.packId ? { packId: room.packId } : {})` — available downstream for playCount increment.

**playCount increment (fire-and-forget):**
- Added to `question:next` natural game end path
- Added to `game:end` early exit path
- Pattern: `prisma.pack.update(...).catch(warn)` — never blocks game flow

### Task 2 — Integration Tests (`apps/server/src/routes/__tests__/packs.integration.test.ts`)

Two new tests added to existing 6-test suite (total: 8 tests):

**Test A — `GET /packs/:id` returns questions ordered by `order` field:**
- Creates pack directly via prisma with 3 questions inserted in reverse order (order: 2, 0, 1)
- Fetches GET /packs/:id
- Verifies: 3 questions returned, `order` fields are 0→1→2, each question has id/text/type/options/correctIndex

**Test B — playCount increments correctly via prisma:**
- Creates APPROVED pack with playCount: 0
- Applies `prisma.pack.update({ data: { playCount: { increment: 1 } } })` twice
- Verifies: 0 → 1 → 2 progression

---

## Verification Results

- `npx tsc --noEmit`: 0 errors
- `npx vitest run src/routes/__tests__/packs.integration.test.ts`: **8/8 pass**
- `npx vitest run` (full suite): **108/108 pass** (13 test files)

---

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-10-08-01 | Pack APPROVED re-verified via prisma.pack.findUnique at game:start; game:error emitted if not approved | Mitigated |
| T-10-08-02 | `take: 20` on packQuestion.findMany prevents large-pack memory DoS | Mitigated |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Added APPROVED status re-verification per threat model**
- **Found during:** Task 1 — reading threat model T-10-08-01
- **Issue:** Plan body showed a simplified branch without the APPROVED check; threat model required it
- **Fix:** Added `prisma.pack.findUnique` + status check before serving questions, per the prompt's "security: T-10-08-01" annotation
- **Files modified:** apps/server/src/socket/game.ts
- **Commit:** 5f29eb4

None — plan executed with all threat mitigations applied as specified.

---

## Known Stubs

None. All pack game paths are fully wired to real Prisma queries.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| apps/server/src/socket/game.ts | FOUND (modified) |
| apps/server/src/game/game.types.ts | FOUND (modified) |
| apps/server/src/routes/__tests__/packs.integration.test.ts | FOUND (modified) |
| commit 5f29eb4 | FOUND |
| TypeScript clean | PASSED |
| 108/108 tests pass | PASSED |
