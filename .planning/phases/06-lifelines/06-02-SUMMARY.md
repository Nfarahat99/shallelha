---
phase: "06"
plan: "02"
subsystem: lifelines
tags: [lifelines, double-points, remove-two, socket, ui, react, redis]
dependency_graph:
  requires: [06-01]
  provides: [LIFE-01-server, LIFE-01-ui, LIFE-02-server, LIFE-02-ui]
  affects: [player-join, answer-options, game-server]
tech_stack:
  added: []
  patterns: [socket-io-ack, redis-game-state, react-useCallback, tailwind-rtl]
key_files:
  created:
    - apps/web/app/join/[roomCode]/game/LifelineBar.tsx
  modified:
    - apps/server/src/socket/game.ts
    - apps/web/app/join/[roomCode]/game/AnswerOptions.tsx
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - "Server emits lifeline ACKs privately to socket (not room broadcast) to prevent opponents from learning which lifeline was used"
  - "Remove Two uses Fisher-Yates shuffle already in game.ts to pick 2 of 3 wrong indices server-side — client just renders eliminatedIndices from server"
  - "LifelineBar disabled (not hidden) during non-answering phases so players can see buttons but cannot tap them"
  - "FREE_TEXT questions silently rejected server-side — LifelineBar not rendered for FREE_TEXT in PlayerJoin"
  - "doublePointsActive resets on question:revealed so badge disappears after scoring occurs"
metrics:
  duration_minutes: 45
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 3
  completed_date: "2026-04-11"
---

# Phase 06 Plan 02: Double Points + Remove Two Lifelines Summary

Double Points (LIFE-01) and Remove Two (LIFE-02) lifelines implemented end-to-end: server socket handlers with phase/replay/type guards, LifelineBar UI component, eliminatedIndices strikethrough rendering in AnswerOptions, and full state wiring in PlayerJoin.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Server handlers for LIFE-01 + LIFE-02 | b012910 | apps/server/src/socket/game.ts |
| 2 | LifelineBar, AnswerOptions eliminatedIndices, PlayerJoin wiring | b45252f | LifelineBar.tsx, AnswerOptions.tsx, PlayerJoin.tsx |

## What Was Built

### Task 1 — Server Handlers

Two Socket.io event handlers appended to `game.ts` after the `freetext:vote` block:

**`lifeline:double_points`:**
- Phase guard: rejects if `gameState.phase !== 'question'`
- Replay guard: rejects if `playerState.doublePointsUsed`
- FREE_TEXT guard: rejects if `questionData.type === 'FREE_TEXT'`
- On success: sets `doublePointsUsed = true`, `doublePointsActiveCurrentQ = true`, saves state, emits `lifeline:double_points_ack` to socket only

**`lifeline:remove_two`:**
- Same phase, replay, and FREE_TEXT guards
- Picks 2 wrong indices: `[0,1,2,3].filter(i => i !== correctIndex)` → `shuffle()` → `.slice(0,2)`
- Sets `removeTwoUsed = true`, saves `eliminatedIndices` to player state, emits `lifeline:remove_two_result` with `{ eliminatedIndices }` to socket only

### Task 2 — UI Components + Wiring

**LifelineBar.tsx** — New component with:
- 3 lifeline buttons: نقاط مضاعفة, أزل خيارين, جمّد منافس
- 3 visual states per button: active (indigo-600), spent (gray-200 opacity-50 pointer-events-none), disabled-active (indigo-600 opacity-40 pointer-events-none)
- `role="group" aria-label="مساعدات اللعبة"` container
- `getAriaLabel()` appends `(مستخدم)` for accessibility when spent

**AnswerOptions.tsx** — Added `eliminatedIndices?: number[]` prop:
- Early check at top of `getButtonClasses()`: eliminated → `bg-gray-200 text-gray-400 opacity-40 pointer-events-none line-through`
- `isButtonDisabled()` returns `true` for eliminated indices

**PlayerJoin.tsx** — Full lifeline wiring:
- 6 new state vars: `doublePointsUsed`, `removeTwoUsed`, `freezeOpponentUsed`, `doublePointsActive`, `eliminatedIndices`, `freezeOverlayOpen`
- `question:start` resets: `doublePointsActive`, `eliminatedIndices`, `freezeOverlayOpen`
- Socket listeners: `lifeline:double_points_ack` → sets used + active; `lifeline:remove_two_result` → sets used + indices
- `question:revealed` resets: `doublePointsActive`, `freezeOverlayOpen`
- Cleanup: `socket.off()` for both lifeline events
- 2 `useCallback` handlers: `handleDoublePoints`, `handleRemoveTwo` with client-side guards
- `LifelineBar` inserted for MC + MEDIA_GUESSING only (not FREE_TEXT), with `onFreezeOpponent` opening overlay placeholder
- Double-points active badge: `النقاط مضاعفة لهذا السؤال ×2` with `animate-pulse`
- `eliminatedIndices={eliminatedIndices}` passed to `AnswerOptions`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `onFreezeOpponent` in PlayerJoin opens `freezeOverlayOpen` state but no FreezeOpponentOverlay component exists yet. This is intentional — the Freeze Opponent overlay is the subject of Plan 06-03. The `freezeOpponentUsed` flag is tracked but the button currently has no server effect.

## Verification

- `npx next build` passed cleanly — all routes compiled, no TypeScript errors
- 36 server tests all passed (pre-existing suite; `lifelines.test.ts` lives in main repo, not in this worktree's base)
- `git log --oneline` confirms 2 commits: b012910 (Task 1), b45252f (Task 2)

## Self-Check: PASSED

- b012910 exists in git log: FOUND
- b45252f exists in git log: FOUND
- apps/web/app/join/[roomCode]/game/LifelineBar.tsx: FOUND (created in b45252f)
- apps/web/app/join/[roomCode]/game/AnswerOptions.tsx: FOUND (modified in b45252f)
- apps/web/app/join/[roomCode]/PlayerJoin.tsx: FOUND (modified in b45252f)
- apps/server/src/socket/game.ts: FOUND (modified in b012910)
