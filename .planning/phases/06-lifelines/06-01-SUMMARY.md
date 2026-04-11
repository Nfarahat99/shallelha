---
phase: 06-lifelines
plan: "01"
subsystem: api
tags: [socket.io, typescript, vitest, game-state, redis, lifelines]

# Dependency graph
requires:
  - phase: 05-free-text
    provides: PlayerGameState, calculateScore, sendQuestion, player:answer handler patterns

provides:
  - PlayerGameState extended with 5 lifeline boolean fields (doublePointsUsed, removeTwoUsed, freezeOpponentUsed, doublePointsActiveCurrentQ, frozenCurrentQ)
  - calculateScore with optional doublePoints param (backward compatible)
  - createInitialPlayerStates initializes all 5 lifeline fields to false
  - sendQuestion resets transient lifeline flags (doublePointsActiveCurrentQ, frozenCurrentQ) per question
  - question:next also resets transient flags (defense-in-depth)
  - player:answer guards frozenCurrentQ and passes doublePointsActiveCurrentQ to scoring
  - Wave 0 test stubs: lifelines.test.ts with Remove Two index tests (GREEN) + todo stubs

affects:
  - 06-02 (Double Points + Remove Two server handlers — depend on these types and scoring extension)
  - 06-03 (Freeze Opponent server handler — depends on frozenCurrentQ flag in PlayerGameState)
  - 06-04 (end-to-end verification)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lifeline state lives in Redis GameState.playerStates as boolean fields — no DB schema change"
    - "Transient per-question flags reset in sendQuestion (primary) and question:next (defense-in-depth)"
    - "Server-side frozen guard in player:answer before accepting answers — flag is server-written only"
    - "calculateScore extended with optional param (default=false) for backward compatibility"

key-files:
  created:
    - apps/server/src/game/__tests__/lifelines.test.ts
  modified:
    - apps/server/src/game/game.types.ts
    - apps/server/src/game/game.service.ts
    - apps/server/src/game/__tests__/game.service.test.ts
    - apps/server/src/socket/game.ts

key-decisions:
  - "Double Points and streak multipliers stack (base * streakMultiplier * 2) — independent mechanics, most natural game design"
  - "Transient flags reset in both sendQuestion and question:next for defense-in-depth consistency"
  - "Wave 0 handler tests written as it.todo() stubs — socket handler tests deferred to Plans 02 and 03 when handlers exist"

patterns-established:
  - "Lifeline state in Redis GameState: boolean flags in PlayerGameState, no DB migration needed"
  - "Per-question transient flag reset pattern: add to sendQuestion loop alongside answeredCurrentQ"

requirements-completed: [LIFE-01, LIFE-02, LIFE-03, LIFE-04]

# Metrics
duration: 5min
completed: 2026-04-11
---

# Phase 6 Plan 01: Data Layer + Scoring Summary

**PlayerGameState extended with 5 lifeline booleans, calculateScore with stacking doublePoints param, sendQuestion + player:answer wired for frozen guard and double-points scoring, Wave 0 Vitest stubs green**

## Performance

- **Duration:** ~5 min (code was partially pre-applied at plan start)
- **Started:** 2026-04-11T04:40:00Z
- **Completed:** 2026-04-11T04:43:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Extended `PlayerGameState` with 5 lifeline boolean fields covering per-game spent flags and per-question transient flags
- Updated `calculateScore` to accept optional `doublePoints` param (defaults to `false` — backward compatible); stacks multiplicatively with streak
- Updated `createInitialPlayerStates` to initialize all 5 new fields to `false`
- Added frozen guard in `player:answer` and wired `doublePointsActiveCurrentQ` to `calculateScore`
- Both `sendQuestion` and `question:next` now reset transient flags each question
- Created `lifelines.test.ts` with Remove Two index-selection tests (7 GREEN) and 9 `it.todo()` stubs for handler tests coming in Plans 02 and 03
- Full server test suite: 48 tests passed, 9 todo, 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — Test stubs + type extensions + scoring update** - `8b6c2f4` (feat)
2. **Task 2: Update sendQuestion + player:answer for lifeline per-question resets and frozen guard** - `5817cb9` (feat)

## Files Created/Modified

- `apps/server/src/game/game.types.ts` — Added 5 lifeline boolean fields to PlayerGameState interface
- `apps/server/src/game/game.service.ts` — calculateScore with doublePoints param; createInitialPlayerStates with all 5 fields initialized to false
- `apps/server/src/game/__tests__/game.service.test.ts` — 5 new doublePoints calculateScore tests + createInitialPlayerStates test updated with all 5 lifeline fields
- `apps/server/src/game/__tests__/lifelines.test.ts` — Created: Remove Two index selection tests (GREEN) + Freeze/DoublePoints/RemoveTwo guard stubs (todo)
- `apps/server/src/socket/game.ts` — sendQuestion resets transient flags; question:next also resets; player:answer frozen guard + doublePointsActiveCurrentQ passed to calculateScore

## Decisions Made

- Double Points and streak multipliers stack multiplicatively: `base * streakMultiplier * dpMultiplier`. This is the most natural game design — each is an independent mechanic.
- Wave 0 handler tests written as `it.todo()` stubs since Plans 02 and 03 implement the actual handlers. The Remove Two index-selection algorithm was testable as a pure function immediately.
- Transient flags reset in both `sendQuestion` (primary path) and `question:next` own loop (defense-in-depth) to keep the reset pattern consistent and explicit.

## Deviations from Plan

None — plan executed exactly as written. Task 1 content was already partially committed at plan start (`8b6c2f4` existed). Task 2 required completing the `question:next` defense-in-depth reset which was not yet applied.

## Issues Encountered

None. The types, service, and test files were already in their correct state from a prior partial execution. Task 2's `question:next` reset loop was the only remaining gap, applied cleanly.

## User Setup Required

None — no external service configuration required. Server-side only changes to TypeScript types and socket handlers.

## Known Stubs

`lifelines.test.ts` contains 9 `it.todo()` stubs for socket handler behaviors. These are intentional Wave 0 stubs — Plans 02 and 03 implement the handlers and will fill in these tests.

| Stub | File | Reason |
|------|------|--------|
| `doublePointsUsed guard prevents second activation` | lifelines.test.ts | handler not yet written (Plan 02) |
| `rejects on FREE_TEXT question type` (Double Points) | lifelines.test.ts | handler not yet written (Plan 02) |
| `removeTwoUsed guard prevents second activation` | lifelines.test.ts | handler not yet written (Plan 02) |
| `rejects on FREE_TEXT question type` (Remove Two) | lifelines.test.ts | handler not yet written (Plan 02) |
| `rejects when gameState.phase !== question` (Remove Two) | lifelines.test.ts | handler not yet written (Plan 02) |
| `frozen player answer is silently rejected` | lifelines.test.ts | handler not yet written (Plan 03) |
| `freeze fails gracefully when target already answered` | lifelines.test.ts | handler not yet written (Plan 03) |
| `cannot freeze self` | lifelines.test.ts | handler not yet written (Plan 03) |
| `lifeline rejected when gameState.phase !== question` (Freeze) | lifelines.test.ts | handler not yet written (Plan 03) |

## Next Phase Readiness

- Plans 02 and 03 can proceed immediately — all type contracts and scoring extension are in place
- `calculateScore(isCorrect, elapsedMs, timerDurationMs, streak, doublePointsActiveCurrentQ)` call site already wired in `player:answer`
- `frozenCurrentQ` guard already in `player:answer`; Plans 02/03 only need to add the handler that sets these flags
- No TypeScript errors; no test regressions

---
*Phase: 06-lifelines*
*Completed: 2026-04-11*
