---
phase: 3
slug: arabic-ui-host-display-player-controller
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Scope: Phase 3 (Arabic UI) + Phase 4 (Game Engine) — merged by user decision.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (server), Next.js built-in (web) |
| **Config file** | `apps/server/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=apps/server -- --run` |
| **Full suite command** | `npm run test --workspace=apps/server -- --run && npm run build --workspace=apps/web` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=apps/server -- --run`
- **After every plan wave:** Run full suite + `npm run build --workspace=apps/web`
- **Before `/gsd-verify-work`:** Full suite must be green + build passes
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RTL-01 | — | N/A | build | `npm run build --workspace=apps/web` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | GAME-01 | — | N/A | unit | `npm run test --workspace=apps/server -- --run` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 1 | SCORE-01 | — | Score calc server-side only | unit | `npm run test --workspace=apps/server -- --run` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 1 | SCORE-02 | — | Streak tracked server-side | unit | `npm run test --workspace=apps/server -- --run` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 2 | RTL-02 | — | N/A | manual | Visual check on 16:9 screen | — | ⬜ pending |
| 03-03-02 | 03 | 2 | RTL-03 | — | N/A | manual | Visual check on mobile portrait | — | ⬜ pending |
| 03-04-01 | 04 | 2 | SCORE-03 | — | N/A | manual | Leaderboard updates after each question | — | ⬜ pending |
| 03-04-02 | 04 | 2 | SCORE-04 | — | N/A | manual | Final podium shows top 3 | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/server/src/game/__tests__/game-service.test.ts` — stubs for scoring, streak, question serving
- [ ] `apps/server/src/game/__tests__/scoring.test.ts` — unit tests for speed-based scoring formula
- [ ] Existing vitest infrastructure in `apps/server/` covers execution

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host display readable from across a room | RTL-02 | No automated visual distance test | Open on TV/monitor at 1920×1080, view from 3m |
| Player layout mirrors host layout | RTL-03 | Cross-device visual check | Host picks 2×2 grid; verify player phone shows 2×2 |
| Cairo font on iOS Safari | RTL-04 | Device-specific rendering | Open join URL on real iPhone, verify Arabic text |
| Emoji avatars light up as players answer | GAME-05 | Real-time visual behavior | 3 players answer; verify their avatars highlight in order |
| Auto-reveal vs manual reveal | GAME-01 | Host config behavior | Set each mode, verify correct behavior |
| RTL timer bar depletes from inline-end | RTL-05 | Visual direction check | Start timer; verify bar depletes right-to-left in RTL |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
