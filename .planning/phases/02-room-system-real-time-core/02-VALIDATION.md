---
phase: 2
slug: room-system-real-time-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (server) + Playwright (E2E join flow) |
| **Config file** | `apps/server/vitest.config.ts` (exists from Phase 1) |
| **Quick run command** | `npm run test --workspace=apps/server` |
| **Full suite command** | `npm run test --workspace=apps/server && npm run build --workspace=apps/web` |
| **Estimated runtime** | ~30 seconds (unit) / ~90 seconds (full with build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=apps/server`
- **After every plan wave:** Run full suite + `curl /health` on Railway
- **Before `/gsd-verify-work`:** Full suite must be green + manual join flow verified
- **Max feedback latency:** 30 seconds (unit), 90 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 1 | INFRA-04 | T-02-01 | NextAuth env vars not hardcoded | unit | `npm test --workspace=apps/server -- --run auth` | ⬜ pending |
| 02-01-02 | 01 | 1 | ROOM-01 | T-02-02 | Room code 4-char, no sequential leaks | unit | `npm test --workspace=apps/server -- --run room-service` | ⬜ pending |
| 02-01-03 | 01 | 1 | ROOM-04 | T-02-03 | Max 8 enforced, 9th player rejected | unit | `npm test --workspace=apps/server -- --run room-service` | ⬜ pending |
| 02-01-04 | 01 | 1 | SYNC-01 | — | Player join event reaches host within 200ms | integration | `npm test --workspace=apps/server -- --run socket` | ⬜ pending |
| 02-02-01 | 02 | 1 | ROOM-02 | — | Player can join without account | E2E manual | Manual: open /join, enter code, enter name+emoji | ⬜ pending |
| 02-02-02 | 02 | 1 | ROOM-03 | — | Player appears in host lobby within 200ms | E2E manual | Manual: two browsers, verify lobby update | ⬜ pending |
| 02-02-03 | 02 | 2 | ROOM-05 | — | Reconnect token restores player within 10s | unit | `npm test --workspace=apps/server -- --run reconnect` | ⬜ pending |
| 02-02-04 | 02 | 2 | SYNC-03 | — | WebSocket recovery on brief disconnect | unit | `npm test --workspace=apps/server -- --run socket` | ⬜ pending |
| 02-03-01 | 03 | 2 | ROOM-06 | — | Host-only controls (start/end) enforced server-side | unit | `npm test --workspace=apps/server -- --run room-controls` | ⬜ pending |
| 02-03-02 | 03 | 2 | INFRA-02 | T-02-04 | 100 rooms load test passes | load | Artillery run (manual in dev) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/server/src/room/__tests__/room-service.test.ts` — stubs for ROOM-01, ROOM-04, ROOM-05
- [ ] `apps/server/src/socket/__tests__/room-socket.test.ts` — stubs for SYNC-01, SYNC-03, ROOM-06
- [ ] `apps/server/src/auth/__tests__/auth.test.ts` — stubs for host auth enforcement
- [ ] Test stubs must fail first (TDD), then pass after implementation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Player join + emoji appears in host lobby | ROOM-03, SYNC-01 | Requires two real browsers | Open /host/[code] in Chrome, /join in mobile Safari → verify player + emoji appears < 200ms |
| Reconnect after tab refresh | ROOM-05 | Requires real sessionStorage | Join room, refresh player tab, verify player still in lobby within 10s |
| Host-only start game button | ROOM-06 | UI protection only | Player browser cannot access host dashboard (no start button shown) |
| iOS Safari WebSocket connection | INFRA-03 | Browser-specific | Real iOS Safari device — join room and verify no polling fallback |
| Arabic name input direction | RTL-01 | Visual RTL check | Type Arabic name on join screen — verify RTL cursor and display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
