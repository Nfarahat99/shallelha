---
phase: 6
slug: lifelines
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already installed) |
| **Config file** | `apps/server/vitest.config.ts` |
| **Quick run command** | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` |
| **Full suite command** | `cd apps/server && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts`
- **After every plan wave:** Run `cd apps/server && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | LIFE-01 | T-06-01 | `doublePointsUsed` guard prevents second activation | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | LIFE-01 | — | `calculateScore` with `doublePoints=true` doubles base×streak result | unit | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` | ✅ extend | ⬜ pending |
| 06-01-03 | 01 | 1 | LIFE-04 | — | All `*Used` flags initialize to `false` in initial player state | unit | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` | ✅ extend | ⬜ pending |
| 06-02-01 | 02 | 2 | LIFE-02 | T-06-02 | `eliminatedIndices` never contains `correctIndex` | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | LIFE-02 | T-06-02 | `eliminatedIndices` always contains exactly 2 elements | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | LIFE-02 | T-06-04 | Remove Two rejected on FREE_TEXT question type | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 3 | LIFE-03 | T-06-03 | Frozen player's answer is silently rejected | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 3 | LIFE-03 | T-06-03 | Freeze fails gracefully when target already answered | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 3 | LIFE-03 | T-06-03 | Cannot freeze self | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-04 | 03 | 3 | LIFE-03 | T-06-04 | Lifeline rejected when `gameState.phase !== 'question'` | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/server/src/game/__tests__/lifelines.test.ts` — new test file covering LIFE-01 guard, LIFE-02 index safety, LIFE-03 freeze logic, phase-guard enforcement
- [ ] Extend `apps/server/src/game/__tests__/game.service.test.ts` — add `calculateScore(doublePoints=true)` cases and initial player state lifeline fields

*Wave 0 must be committed before any implementation tasks in Wave 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LifelineBar renders correctly on mobile portrait with 3 buttons above question header | LIFE-04 | Requires browser rendering | Load player controller in mobile DevTools, start a MULTIPLE_CHOICE question, verify LifelineBar appears above question text with all 3 buttons active |
| Spent lifeline button shows greyed/disabled state correctly | LIFE-04 | Requires browser rendering + interaction | Activate a lifeline, verify button renders with `bg-gray-200 text-gray-400 opacity-50` and `cursor-not-allowed` |
| FreezeOpponentOverlay renders player list and dismisses correctly | LIFE-03 | Requires browser rendering + interaction | Tap "جمّد منافس", verify overlay appears with all other players listed, tap "إلغاء التجميد" to dismiss |

---

## Security Threat Model

| Threat ID | Pattern | STRIDE | Mitigation |
|-----------|---------|--------|------------|
| T-06-01 | Replay: emit `lifeline:*` twice (Double Points twice) | Spoofing/Tampering | `if (playerState.doublePointsUsed) return` guard before state mutation |
| T-06-02 | Remove Two: emit without valid question phase to get indices | Tampering | Phase guard + questionCache type check |
| T-06-03 | Freeze Opponent: fake targetPlayerId or self-freeze | Tampering/Elevation | Validate against `gameState.playerStates` keys + `targetId !== socket.data.reconnectToken` |
| T-06-04 | Emit any lifeline during reveal/leaderboard phase | Tampering | `gameState.phase !== 'question'` guard in all handlers |

Block on: **high** severity threats. All T-06-* above are high severity and must be mitigated before execution.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
