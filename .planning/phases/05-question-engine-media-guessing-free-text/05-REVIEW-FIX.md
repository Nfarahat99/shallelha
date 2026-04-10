---
phase: 05-question-engine-media-guessing-free-text
fixed_at: 2026-04-11T00:00:00Z
review_path: .planning/phases/05-question-engine-media-guessing-free-text/05-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 5
skipped: 1
status: partial
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-04-11
**Source review:** `.planning/phases/05-question-engine-media-guessing-free-text/05-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, WR-01, WR-02, WR-03, WR-04, WR-05)
- Fixed: 5
- Skipped: 1 (WR-05 — false positive, test file exists with full coverage)

---

## Fixed Issues

### CR-01: Free text answer stored and broadcast without HTML sanitization

**Files modified:** `apps/server/src/socket/game.ts`
**Commit:** a268f1b
**Applied fix:** Added `escapeHtml(raw: string)` helper function (module level, before `shuffle`) that replaces `&`, `<`, `>`, `"`, and `'` with their HTML entities. Applied it in the `freetext:answer` handler: `const trimmed = escapeHtml(text.trim().slice(0, 80))`. The sanitization now occurs on the server before the text is written to Redis or broadcast to any client.

---

### WR-01: Redundant `votingTimers.delete` after `clearVotingTimer` in `game:end` handler

**Files modified:** `apps/server/src/socket/game.ts`
**Commit:** 50f0783
**Applied fix:** Removed the explicit `votingTimers.delete(roomCode)` call on the line immediately after `clearVotingTimer(roomCode)` in the `game:end` handler. Added a clarifying inline comment noting that `clearVotingTimer` already handles the Map deletion internally. The `question:next` end-of-game path was already clean (no duplicate delete there).

---

### WR-02: Voting deadline calculated client-side — clock skew causes premature or late timer expiry

**Files modified:** `apps/server/src/socket/game.ts`, `apps/web/app/host/[roomCode]/HostDashboard.tsx`, `apps/web/app/join/[roomCode]/PlayerJoin.tsx`
**Commit:** f56ebd1
**Applied fix:** Three-file change:
1. **Server (`game.ts`):** Changed `io.to(roomCode).emit('freetext:lock', { answers })` to include the server-computed deadline: `{ answers, votingDeadline: gameState.votingDeadline }`.
2. **HostDashboard.tsx:** Updated the `freetext:lock` listener destructure to include `votingDeadline?: number` and changed `setVotingDeadline(Date.now() + 15_000)` to `setVotingDeadline(votingDeadline ?? Date.now() + 15_000)`.
3. **PlayerJoin.tsx:** Same change as HostDashboard — destructures `votingDeadline` from the event and uses it with a local fallback for backwards compatibility.

---

### WR-03: No rate limiting on `freetext:answer` — TOCTOU race allows duplicate answer flood

**Files modified:** `apps/server/src/socket/game.ts`
**Commit:** 4bca291
**Applied fix:** Added a module-level `freeTextLocks = new Set<string>()`. In the `freetext:answer` handler, `playerId` is now extracted before any async work. A `lockKey = \`${roomCode}:${playerId}\`` is checked and set before the `try` block, and released unconditionally in a new `finally` block. Any rapid-fire second emission from the same player within the same async window is rejected immediately without touching Redis.

---

### WR-04: `handleReveal` silently proceeds with `correctIndex: 0` when question cache is empty

**Files modified:** `apps/server/src/socket/game.ts`
**Commit:** c4b9d0a
**Applied fix:** Added an explicit `if (!questionData)` guard after the FREE_TEXT branch in `handleReveal`. When the cache is empty the function now logs a `console.warn` with room code and question index, then returns early — no emit, no state mutation. The `correctAnswerIndex` in the `question:revealed` emit now uses `questionData.correctIndex` directly (no `?? 0` fallback needed since the guard above ensures `questionData` is defined at that point).

---

## Skipped Issues

### WR-05: `game.service.test.ts` is absent — calculateFreeTextScore has no test coverage

**File:** `apps/server/src/game/game.service.test.ts` (reported missing)
**Reason:** False positive — the file exists on disk at `apps/server/src/game/__tests__/game.service.test.ts`. It imports `calculateFreeTextScore` and contains 6 dedicated test cases covering: single winner with multiple votes, two-way tie, zero votes, single voter, non-voting author, and voters for non-winning answers. No action required.
**Original issue:** Reviewer's file scan did not find the file because it is located under `__tests__/` subdirectory rather than alongside `game.service.ts` directly.

---

_Fixed: 2026-04-11_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
