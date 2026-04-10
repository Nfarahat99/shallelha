---
phase: 05
slug: question-engine-media-guessing-free-text
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 1.x (existing — `apps/server/vitest.config.ts`) |
| **Config file** | `apps/server/vitest.config.ts` |
| **Quick run command** | `cd apps/server && npx vitest run` |
| **Full suite command** | `cd apps/server && npx vitest run && cd ../.. && cd apps/web && npx next build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/server && npx vitest run`
- **After every plan wave:** Run `cd apps/server && npx vitest run && cd ../.. && cd apps/web && npx next build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 05-01-01 | 01 | 1 | GAME-02, GAME-03 | T-05-01 | Prisma enum only allows known QuestionType values | unit + build | `cd apps/server && npx tsc --noEmit` | ⬜ pending |
| 05-01-02 | 01 | 1 | GAME-02, GAME-03 | T-05-08, T-05-09 | calculateFreeTextScore awards 800 to winner, 200 to voters, 0 streak impact | unit | `cd apps/server && npx vitest run --reporter=verbose` | ⬜ pending |
| 05-02-01 | 02 | 2 | GAME-02 | T-05-04 | MediaUrl only from res.cloudinary.com in remotePatterns | build | `cd apps/server && npx tsc --noEmit && cd ../.. && cd apps/web && npx tsc --noEmit` | ⬜ pending |
| 05-02-02 | 02 | 2 | GAME-02 | T-05-01 | Next.js Image component validates remote domain; non-Cloudinary URLs blocked | build | `cd apps/web && npx next build` | ⬜ pending |
| 05-03-01 | 03 | 3 | GAME-03 | T-05-08, T-05-09, T-05-10, T-05-15 | freetext:answer strips/trims text server-side; one vote per player; no self-vote | unit + build | `cd apps/server && npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 05-03-02 | 03 | 3 | GAME-03 | T-05-09, T-05-10 | Server rejects duplicate votes and self-votes silently | build | `cd apps/web && npx next build` | ⬜ pending |
| 05-04-01 | 04 | 4 | GAME-02, GAME-03 | — | Full build green; seed inserts questions | build + vitest | `cd apps/server && npx vitest run --reporter=verbose && cd ../.. && cd apps/web && npx next build` | ⬜ pending |
| 05-04-02 | 04 | 4 | GAME-02, GAME-03 | — | Human-verified: blur, audio, typing, voting, scoring, RTL | manual | echo "Checkpoint: human verification required" | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `apps/server/vitest.config.ts` — already configured
- `apps/server/src/game/__tests__/game.service.test.ts` — existing pattern; Plan 01 Task 2 adds `calculateFreeTextScore` tests inline

No new test stubs or fixtures needed before Wave 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS blur transition renders smoothly (20px → 0px over timer duration) | GAME-02 | CSS animation correctness requires visual inspection | Open host screen, start media guessing question, observe image progressively unblur |
| HTML5 audio auto-plays on question start | GAME-02 | Audio autoplay behavior is browser-context dependent | Open host screen with audio question, verify audio plays within 1s of question start |
| Free text textarea has correct RTL direction with Arabic placeholder | GAME-03 | RTL rendering correctness requires visual inspection | Open player phone at join page, start free text question, verify textarea aligns right with Arabic placeholder |
| Player cannot vote for their own answer (greyed out in UI) | GAME-03 | UI state depends on socket-derived player identity | Start free text voting phase, verify submitting player sees their own answer greyed out |
| Voting timer countdown visible on both host and player screens | GAME-03 | Timer visual requires live session | Start voting phase, verify 15-second countdown displays and closes voting when it expires |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
