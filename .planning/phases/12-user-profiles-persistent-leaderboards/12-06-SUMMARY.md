---
phase: 12-user-profiles-persistent-leaderboards
plan: "06"
subsystem: game-history
tags: [anonymous-players, claim-stats, server-actions, socket-io]
dependency_graph:
  requires: [12-01, 12-05]
  provides: [anonymous-result-persistence, claim-anonymous-stats]
  affects: [PlayerPostGame, saveGameHistory, profile-actions]
tech_stack:
  added: ["@paralleldrive/cuid2 (pre-generate gameSessionId)"]
  patterns: ["optimistic-lock via userId IS NULL guard", "fire-and-forget with pre-generated ID"]
key_files:
  created: []
  modified:
    - apps/server/src/socket/game.ts
    - apps/web/app/profile/actions.ts
    - apps/web/app/join/[roomCode]/PlayerPostGame.tsx
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - "Pre-generate gameSessionId (cuid) on server before podium emit so client can use it for claiming"
  - "Used Prisma.DbNull for nullable JSON avatarConfig field to satisfy Prisma type system"
  - "Recalculate aggregates via prisma.aggregate/_count instead of raw SQL for type safety"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 4
---

# Phase 12 Plan 06: Save Anonymous Player Results + Claim Stats Summary

Anonymous player game results are now persisted to PostgreSQL with `userId=null`, and authenticated users can retroactively claim those results via a Server Action.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Update saveGameHistory to save ALL players (anonymous with userId=null) | e5966e9 |
| 2 | Add claimAnonymousStats Server Action + PlayerPostGame claim button | e5966e9 |

## What Was Built

### Task 1 — saveGameHistory (apps/server/src/socket/game.ts)

- Imported `createId` from `@paralleldrive/cuid2`
- Pre-generate `gameSessionId` before each `game:podium` emit (two call sites — normal end and early end)
- `gameSessionId` is now included in the `game:podium` socket event payload
- `saveGameHistory` accepts optional `preGeneratedSessionId` parameter and uses it in `prisma.gameSession.create`
- Rows now map ALL leaderboard entries: `userId = e.id` for real users, `userId = null` for anonymous
- `avatarConfig` field populated using `Prisma.DbNull` for null case (satisfies `NullableJsonNullValueInput | InputJsonValue`)
- `createMany` uses `skipDuplicates: true` for safety
- Aggregate stat update section (totalGamesPlayed, winCount, bestStreak) unchanged — still only applies to real users

### Task 2 — claimAnonymousStats Server Action (apps/web/app/profile/actions.ts)

- Added `claimAnonymousStats` after existing `updateProfile` (no conflict with 12-07 changes)
- Auth guard: returns `{ claimed: 0, error: 'Unauthorized' }` if no session
- Input sanitization: gameSessionId stripped to alphanumeric/dash/underscore, playerName trimmed
- 7-day window via `createdAt >= sevenDaysAgo`
- Case-insensitive name match via Prisma `mode: 'insensitive'`
- Optimistic lock: `updateMany WHERE userId IS NULL` prevents double-claiming
- Recalculates `totalGamesPlayed` and `winCount` from DB using `prisma.aggregate` and `prisma.count`
- Calls `revalidatePath('/profile')`

### Task 2 — PlayerPostGame claim button (apps/web/app/join/[roomCode]/PlayerPostGame.tsx)

- Added `gameSessionId` and `playerName` props (both optional for backwards compat)
- `useSession` from next-auth/react tracks auth state
- `claimStatus` state: `idle | pending | done | error` prevents double-submit
- Authenticated users: clicking claim button calls `claimAnonymousStats` directly
- Unauthenticated users: clicking redirects to `signIn('google', { callbackUrl: '/profile' })`
- Removed old static "auth prompt" `<a>` tag (replaced by dynamic claim button)
- Success state shows "تم حفظ إحصائياتك!" message

### Task 2 — PlayerJoin wiring (apps/web/app/join/[roomCode]/PlayerJoin.tsx)

- Added `endGameSessionId` state
- `game:podium` handler now captures `gameSessionId` from event payload
- Passes `gameSessionId={endGameSessionId}` and `playerName={name}` to `PlayerPostGame`

## Deviations from Plan

### Auto-added: Pre-generate gameSessionId on server

**Found during:** Task 1
**Issue:** `gameSessionId` is a DB-generated cuid created inside `saveGameHistory` — it was never exposed to the client. The plan required passing it to `PlayerPostGame` for the claim action, but the socket `game:podium` event didn't include it.
**Fix:** Pre-generate the ID using `createId()` from `@paralleldrive/cuid2` (already available in server deps) before emitting `game:podium`. Pass it in the event payload and also to `saveGameHistory` which uses it when creating the GameSession.
**Files modified:** `apps/server/src/socket/game.ts`, `apps/web/app/join/[roomCode]/PlayerJoin.tsx`

### Auto-fixed: Prisma type for nullable JSON field

**Found during:** Task 1 TypeScript check
**Issue:** `avatarConfig: null` caused TS2322 — Prisma's `createMany` input requires `NullableJsonNullValueInput | InputJsonValue`, not `InputJsonValue | null`.
**Fix:** Used `Prisma.DbNull` for the null case and cast non-null value to `Prisma.InputJsonValue`.
**Files modified:** `apps/server/src/socket/game.ts`

### Auto-fixed: Replaced raw SQL aggregate with Prisma ORM aggregate

**Found during:** Task 2 implementation
**Issue:** Plan suggested `prisma.$queryRaw` with PostgreSQL `FILTER` syntax. This works on PostgreSQL but is less type-safe and harder to maintain.
**Fix:** Used `prisma.playerGameResult.aggregate({ _count: { id: true } })` and `prisma.playerGameResult.count({ where: { isWinner: true } })` — equivalent result, fully typed.

## Known Stubs

None. The claim flow is fully wired end-to-end.

## Threat Surface

All threats from the plan's threat model are mitigated:
- T-12-06-01 (spoofing): claim scoped to gameSessionId + playerName + 7-day window
- T-12-06-02 (race condition): `updateMany WHERE userId IS NULL` optimistic lock
- T-12-06-03 (injection): gameSessionId sanitized to `[a-zA-Z0-9_-]`, Prisma ORM parameterizes queries
- T-12-06-04 (info disclosure): leaderboard queries filter `WHERE userId IS NOT NULL` (not changed here)

## Self-Check: PASSED

- FOUND: apps/server/src/socket/game.ts
- FOUND: apps/web/app/profile/actions.ts
- FOUND: apps/web/app/join/[roomCode]/PlayerPostGame.tsx
- FOUND: apps/web/app/join/[roomCode]/PlayerJoin.tsx
- FOUND: commit e5966e9
