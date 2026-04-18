---
phase: 08
created: "2026-04-14"
strategy: nyquist
---

# Phase 8 — Nyquist Validation Strategy

## Sampling Theorem Applied

Each observable user-facing behavior requires at least one automated test that can catch regression. Phase 8 adds production-hardening behaviors — most are either "present or absent" with binary verifiability.

---

## Requirements → Test Coverage Map

| Req ID | Behavior | Test Type | Command | File | Status |
|--------|----------|-----------|---------|------|--------|
| INFRA-01 | Public URL responds 200 | smoke | `node e2e-test.mjs` | e2e-test.mjs | ✅ Exists |
| INFRA-02 | 100 simultaneous rooms, p99 < 200ms | load | `npm run test:load` | Artillery YAML | ✅ Exists (Phase 2) |
| INFRA-03 | iOS Safari + Android Chrome + Desktop | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| ROOM-04 | Max 8 players enforced (9th rejected) | unit+smoke | `npm run test` + e2e | room.test.ts + e2e-phase8.mjs | ❌ Must create |
| ROOM-05 | Rejoin within 10s without losing state | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| GAME-01 | Multiple choice question full loop | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| GAME-02 | Media guessing question full loop | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| GAME-03 | Free text question + voting loop | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| LIFE-01 | Double Points lifeline changes score | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| LIFE-02 | Remove Two lifeline removes 2 options | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| LIFE-03 | Freeze Opponent lifeline freezes target | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| SCORE-01 | Correct answer awards points | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| SCORE-02 | Leaderboard updates after each question | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| SCORE-03 | Final podium shows top 3 | smoke | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must create |
| ADMIN-05 | 200+ approved questions in DB | smoke | `/health` endpoint check | e2e-phase8.mjs | ❌ Threshold must update |
| PERF-01 | Answer appears on host in < 200ms | smoke/perf | `node e2e-phase8.mjs` | e2e-phase8.mjs | ❌ Must add timing |
| SEC-01 | room:create limited 5/min per socket | unit | `npm run test` | rate-limit.test.ts | ❌ Must create |
| SEC-02 | room:join limited 10/min per IP | unit | `npm run test` | rate-limit.test.ts | ❌ Must create |
| SEC-03 | 9th join rejected (room full) | unit+smoke | Both | room.test.ts + e2e | ❌ Must create |
| OBS-01 | Vercel Analytics fires on page load | manual | Vercel dashboard | N/A | Manual only |

---

## Wave 0 Gaps (Must Be Addressed Before Phase Completes)

### Critical (Phase gate blockers)
- [ ] `e2e-phase8.mjs` — full 8-player game simulation (ROOM-04, ROOM-05, GAME-01–05, LIFE-01–03, SCORE-01–03)
- [ ] `e2e-phase8.mjs` — approvedQuestions >= 200 threshold (ADMIN-05)
- [ ] `e2e-phase8.mjs` — answer latency timing assertions < 200ms (PERF-01)
- [ ] `e2e-phase8.mjs` — 9th player rejection (SEC-03)
- [ ] `e2e-phase8.mjs` — player reconnect within 10s (ROOM-05)

### High Priority (Must be created in Phase 8)
- [ ] `apps/server/src/socket/room.test.ts` — 9th player rejection unit test (ROOM-04)
- [ ] `apps/server/src/socket/rate-limit.test.ts` — socket event rate limiting unit tests (SEC-01, SEC-02)

### Low Priority (Manual acceptable for MVP)
- [ ] OBS-01 — Vercel Analytics firing verified via dashboard after deploy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| Server unit tests | Vitest (`cd apps/server && npm run test`) |
| E2E tests | Playwright Chromium headless (existing pattern: e2e-test.mjs) |
| Load tests | Artillery (existing, Phase 2 complete) |
| E2E run command | `node e2e-phase8.mjs` |
| Phase gate | All automated tests green + manual cross-browser checklist signed off |

---

## Sampling Rate

- **Per task commit:** `cd apps/server && npm run test` (unit tests, ~10s)
- **Per wave completion:** `cd apps/server && npm run test && node e2e-test.mjs` (~30s)
- **Phase gate (before marking complete):** Full suite + `node e2e-phase8.mjs` (new smoke) must be green

---

## Manual Test Checklist (Phase Gate)

Run on actual devices/browsers, not emulation:
- [ ] iOS Safari 16+ (iPhone, portrait): join room, play full game, use lifeline
- [ ] Android Chrome 110+ (portrait): join room, play full game, use lifeline
- [ ] Desktop Chrome (1920px): host view — all controls visible, RTL correct
- [ ] Desktop Firefox: functional parity with Chrome
- [ ] Arabic text displays correctly (no LTR contamination)
- [ ] Loading skeletons appear on join and host pages on slow 3G (DevTools throttling)
- [ ] Disconnect banner appears within 1s of network drop
- [ ] Reconnect succeeds within 10s on mobile (airplane mode test)
