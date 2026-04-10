---
phase: 03-arabic-ui-host-display-player-controller
plan: "02"
subsystem: server/socket
tags: [socket.io, game-loop, scoring, real-time, server-authoritative]
dependency_graph:
  requires:
    - 03-01 (game.types.ts, game.service.ts interfaces — created here as Rule 3 deviation)
    - apps/server/src/socket/room.ts (registerRoomHandlers pattern)
    - apps/server/src/room/room.service.ts (getRoom, updateRoomStatus)
    - apps/server/src/db/prisma.ts (prisma client)
  provides:
    - apps/server/src/socket/game.ts (registerGameHandlers — all game socket events)
    - apps/server/src/game/game.types.ts (GameState, HostSettings, PlayerGameState, LeaderboardEntry, QuestionPayload)
    - apps/server/src/game/game.service.ts (calculateScore, createInitialPlayerStates, getLeaderboard, saveGameState, getGameState)
  affects:
    - apps/server/src/socket/index.ts (registerGameHandlers wired into connection handler)
    - Plans 03-04 (frontend receives question:start, question:revealed, leaderboard:update, game:podium, question:progress)
tech_stack:
  added: []
  patterns:
    - Module-level Map for auto-reveal timers (NodeJS.Timeout keyed by roomCode)
    - Module-level Map for question cache (QuestionData[] keyed by roomCode — avoids DB per-answer)
    - requireHost() guard pattern for all host-only events
    - Fisher-Yates shuffle for question randomization
    - Promise.all for concurrent Redis reads (gameState + room)
    - Server-side elapsed timing: Date.now() - gameState.questionStartedAt (client cannot influence score)
key_files:
  created:
    - apps/server/src/game/game.types.ts
    - apps/server/src/game/game.service.ts
    - apps/server/src/socket/game.ts
  modified:
    - apps/server/src/socket/index.ts
decisions:
  - game:start event (not room:start) triggers question fetching — keeps room.ts clean, game.ts owns game loop
  - Questions capped at 20, shuffled Fisher-Yates, cached in memory — avoids N DB reads during gameplay
  - answeredIds[] included in question:progress broadcast — required for D-03 PlayerIndicators (emoji avatars light up)
  - Silent rejection for late answers (phase !== question) per D-06 — no error emitted to player
  - Streak applied before score calculation — streak is the count of consecutive correct answers before this answer
  - game.types.ts and game.service.ts created here (Rule 3 deviation) because Plan 01 parallel files were absent
metrics:
  duration: "~12 minutes"
  completed: "2026-04-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 03 Plan 02: Game Socket Event Handlers Summary

**One-liner:** Server-authoritative Socket.io game loop with 7 event handlers — speed-scored answers, streak multipliers, auto-reveal timer, and per-player progress broadcast for emoji avatar indicators.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create game socket event handlers | e888d20 | apps/server/src/game/game.types.ts, game.service.ts, socket/game.ts |
| 2 | Register game handlers in socket index | ede0c1e | apps/server/src/socket/index.ts |

## What Was Built

### game.types.ts
TypeScript interfaces for the game domain:
- `HostSettings` — layout, timerStyle, revealMode
- `PlayerGameState` — score, streak, answeredCurrentQ, lastAnswerTime
- `GameState` — full game snapshot stored in Redis (questionIds, currentQuestionIndex, phase, questionStartedAt, timerDuration, playerStates, hostSettings)
- `LeaderboardEntry` — id, name, emoji, score, rank, streak
- `QuestionPayload` — text, options, timerDuration

### game.service.ts
Pure functions for game logic:
- `calculateScore(isCorrect, elapsedMs, timerDurationMs, streak)` — max 1000, min 500, linear decay, 1.5x streak multiplier at 3+ consecutive correct answers; 0 for wrong
- `createInitialPlayerStates(players)` — initializes all player scores at 0
- `getLeaderboard(playerStates, players)` — merges profile + state, sorts desc by score, assigns 1-indexed rank
- `saveGameState / getGameState` — Redis JSON serialization with 24h TTL
- `deleteGameState` — cleanup on game end

### socket/game.ts — registerGameHandlers
All 7 game events implemented with host authorization:

| Event | Direction | Auth | Key behavior |
|-------|-----------|------|--------------|
| `game:configure` | host → server | requireHost | Store HostSettings in Redis; create pre-game state if none exists |
| `game:start` | host → server | requireHost | Fetch approved questions from Postgres (optionally by categoryId), shuffle, cap at 20, init playerStates, emit game:started + question:start |
| `player:answer` | player → server | none | Validate phase=question (silent), index 0-3, no duplicate; server-computed elapsed; calculateScore; update streak; emit question:progress with answeredIds[] |
| `question:reveal` | host → server | requireHost | Set phase=reveal, emit question:revealed with correctAnswerIndex + per-player scores |
| `leaderboard:show` | host → server | requireHost | Compute sorted leaderboard, set phase=leaderboard, emit leaderboard:update |
| `question:next` | host → server | requireHost | Advance index or emit game:podium with top3 if exhausted |
| `game:end` | host → server | requireHost | Compute top3, set phase=ended, update room status, emit game:podium, cleanup cache |

Auto-reveal: when `hostSettings.revealMode === 'auto'`, a `setTimeout` fires `handleReveal` after `timerDuration * 1000ms`. The timer is stored in `autoRevealTimers` Map and cancelled on manual reveal, question:next, or game:end.

question:progress payload: `{ answeredCount: number, totalPlayers: number, answeredIds: string[] }` — required for D-03 PlayerIndicators on host screen.

### socket/index.ts
Added `import { registerGameHandlers } from './game'` and `registerGameHandlers(io, socket)` call after `registerRoomHandlers`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created game.types.ts and game.service.ts (Plan 01 parallel artifacts absent)**
- **Found during:** Task 1 setup
- **Issue:** Plan 02 imports from `../game/game.service` and `../game/game.types` but Plan 01 (which creates those files) runs in parallel — files were not present in the worktree
- **Fix:** Created both files in this plan following the exact interface spec from the plan's `<interfaces>` section
- **Files created:** apps/server/src/game/game.types.ts, apps/server/src/game/game.service.ts
- **Commit:** e888d20

**2. [Rule 1 - Bug] Fixed QuestionStatus type mismatch in prisma.question.findMany where clause**
- **Found during:** Task 1 TypeScript check
- **Issue:** `{ status: string }` is not assignable to `QuestionWhereInput` — Prisma expects `QuestionStatus` enum
- **Fix:** Imported `QuestionStatus` from `@prisma/client` and used `QuestionStatus.approved` in the where clause
- **Files modified:** apps/server/src/socket/game.ts
- **Commit:** e888d20

## Threat Model Coverage

All T-03-0x threats from the plan's threat register are addressed:

| Threat | Mitigation | Location |
|--------|-----------|----------|
| T-03-03 Elevation of Privilege | `requireHost()` on all 6 host events | `requireHost()` function, all host socket.on handlers |
| T-03-04 Tampering (player:answer) | phase check, answerIndex 0-3 range, answeredCurrentQ duplicate check | player:answer handler |
| T-03-05 Tampering (timing) | elapsedMs = Date.now() - gameState.questionStartedAt (server-only) | player:answer handler |
| T-03-06 Repudiation (late answer) | Silent return when phase !== 'question' | player:answer handler |
| T-03-07 DoS (game:start) | 20 question cap, questionCache.delete on game:end | game:start handler, clearAutoRevealTimer |

## Verification Results

- TypeScript (`npx tsc --noEmit`): PASS
- Unit tests (`npm run test`): 14/14 PASS (2 test files — room-service + health)
- All acceptance criteria grep checks: PASS

## Self-Check: PASSED

- apps/server/src/game/game.types.ts: FOUND
- apps/server/src/game/game.service.ts: FOUND
- apps/server/src/socket/game.ts: FOUND
- apps/server/src/socket/index.ts: MODIFIED (registerGameHandlers import + call)
- Commit e888d20: FOUND
- Commit ede0c1e: FOUND
