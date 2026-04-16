---
phase: 08
plan: 02
title: "Rate Limiting & Input Hardening"
status: complete
subsystem: server-security, rate-limiting
tags: [rate-limiting, input-validation, redis-optimization, host-verification, testing]
key_files:
  created:
    - apps/server/src/socket/middleware/rateLimiter.ts
    - apps/server/src/socket/__tests__/rate-limiter.test.ts
  modified:
    - apps/server/src/socket/room.ts
    - apps/server/src/socket/index.ts
    - apps/server/src/room/room.service.ts
    - apps/server/src/room/__tests__/room-service.test.ts
decisions:
  - "Rate limiter is pure in-memory per-socket (no Redis) — correct for socket-level limits where Redis overhead is unnecessary"
  - "checkRateLimit count > limit returns false (not >=) to allow exactly 'limit' calls before blocking"
  - "Host identity cross-verification added to room:start and room:end via getRoom fetch — prevents isHost flag spoofing"
  - "findRoomByHostId rewritten from O(n) redis.keys scan to O(1) hostroom:{hostId} reverse index"
  - "hostroom key deleted on room end to prevent stale reverse-index entries"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-16"
  tasks_completed: 9
  tasks_total: 9
  files_created: 2
  files_modified: 4
  tests_added: 5
  tests_total: 76
---

# Phase 08 Plan 02: Rate Limiting & Input Hardening Summary

**One-liner:** Per-socket in-memory rate limiting (5/min create, 10/min join), room code regex validation, O(1) Redis reverse index for host lookup, and host identity cross-verification on game start/end.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Rate limiter utility (rateLimiter.ts) | e1738ea | done |
| 2 | Rate limit room:create (5/min) | 78488c8 | done |
| 3 | Rate limit room:join (10/min) | 78488c8 | done |
| 4 | Room code format validation (^[A-HJ-NP-Z]{4}$) | 78488c8 | done |
| 5 | Redis hostroom reverse index | 3c1196c | done |
| 6 | Host identity cross-verification (room:start, room:end) | a81e82d | done |
| 7 | clearSocketRateLimits on disconnect | 7765a5f | done |
| 8 | Unit tests — rate limiter (4 tests) | 2cfa015 | done |
| 9 | Unit test — 9th player rejection describe block | 2cfa015 | done |

## Key Files

### Created
- `apps/server/src/socket/middleware/rateLimiter.ts` — Pure in-memory rate limiter: `socketEventCounts` Map, `checkRateLimit()`, `clearSocketRateLimits()`
- `apps/server/src/socket/__tests__/rate-limiter.test.ts` — 4 Vitest tests covering allow, block, window reset, and clear

### Modified
- `apps/server/src/socket/room.ts` — Rate limit guards on room:create and room:join; regex validation on room:join and reconnect:player; host identity checks on room:start and room:end
- `apps/server/src/socket/index.ts` — clearSocketRateLimits called in disconnect handler
- `apps/server/src/room/room.service.ts` — hostroom:{hostId} reverse index in createRoom; O(1) findRoomByHostId; hostroom cleanup in updateRoomStatus('ended')
- `apps/server/src/room/__tests__/room-service.test.ts` — Added redis.get/set/del to mock; new describe('joinRoom — 9th player') block; redis.set mock in createRoom tests

## Decisions Made

1. **In-memory rate limiter (not Redis-backed):** Socket-level rate limits are per-connection, not per-IP across instances. In-memory is correct, zero-latency, and avoids Redis round-trips on every event.

2. **checkRateLimit count > limit (not >=):** Allows exactly `limit` calls before blocking. Count increments first, then checks — consistent with "allow the Nth call, block the (N+1)th" semantics.

3. **Host identity cross-verification via getRoom fetch:** The `socket.data.isHost` flag is set on connection but could theoretically be tampered with in a compromised environment. Cross-checking `room.hostId !== socket.data.userId` against Redis state adds a second factor.

4. **hostroom key TTL matches room TTL:** Both expire at 24h — no stale reverse-index keys left behind after natural expiry.

5. **room code regex `^[A-HJ-NP-Z]{4}$`:** Matches the server's own `generateCode()` character set (excludes I and O to avoid confusion with 1 and 0). Applied consistently in room:join and reconnect:player.

## Verification Results

```
redis.keys count in room.service.ts:  0   (PASS — O(n) scan eliminated)
hostroom: count in room.service.ts:   3   (PASS — create, findBy, cleanup)
checkRateLimit count in room.ts:      3   (PASS — import + 2 call sites)
TypeScript: npx tsc --noEmit          PASS (no errors)
Tests: 76 passed / 76 total           PASS (8 test files)
```

## Deviations from Plan

None — plan executed exactly as written.

- Task 9 note: existing test file already had an inline 9th-player test inside `describe('joinRoom')`. The new `describe('joinRoom — 9th player')` block was added as a distinct, dedicated describe section as specified.
- `redis.get/set/del` were added to the Redis mock in room-service.test.ts (Rule 2 auto-add) since createRoom now calls `redis.set` for the reverse index — without this, tests would fail with "not a function".

## Known Stubs

None.

## Threat Flags

None — no new network endpoints or trust boundary changes introduced. Rate limiting and validation reduce attack surface; they do not expand it.

## Self-Check

### Files created exist:
- apps/server/src/socket/middleware/rateLimiter.ts — FOUND
- apps/server/src/socket/__tests__/rate-limiter.test.ts — FOUND

### Commits exist:
- e1738ea — FOUND
- 78488c8 — FOUND
- 3c1196c — FOUND
- a81e82d — FOUND
- 7765a5f — FOUND
- 2cfa015 — FOUND

## Self-Check: PASSED
