---
phase: 7
slug: admin-dashboard-content-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.6.0 (apps/server) |
| **Config file** | `apps/server/vitest.config.ts` |
| **Quick run command** | `cd apps/server && npm test` |
| **Full suite command** | `cd apps/server && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/server && npm test`
- **After every plan wave:** Run `cd apps/server && npm test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green + admin UI manual smoke test
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | ADMIN-01,02,03,04,05 | — | Schema additive only | migration | `cd apps/server && npx prisma migrate status` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 0 | ADMIN-04 | — | Analytics counters default 0 | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 0 | ADMIN-05 | — | Seed idempotent upserts | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-02-01 | 02 | 1 | ADMIN-01 | T-7-01 | Cookie check on /admin/* | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-02-02 | 02 | 1 | ADMIN-01 | — | Category CRUD actions | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-03-01 | 03 | 2 | ADMIN-02,03 | T-7-02 | Status gate: approved=game, draft=blocked | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-03-02 | 03 | 2 | ADMIN-02 | T-7-03 | Cloudinary upload server-side only | manual | Check no CLOUDINARY_API_SECRET in client | N/A | ⬜ pending |
| 7-04-01 | 04 | 3 | ADMIN-04 | — | timesPlayed increments at reveal | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-04-02 | 04 | 3 | ADMIN-04 | — | timesAnsweredWrong increments on wrong | unit | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |
| 7-05-01 | 05 | 4 | ADMIN-05 | — | Seed produces ≥200 approved questions | integration | `cd apps/server && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/server/src/routes/__tests__/admin.test.ts` — analytics endpoint stubs (ADMIN-04)
- [ ] `apps/server/src/__tests__/admin-seed.test.ts` — seed count >= 200 (ADMIN-05)
- [ ] `apps/server/src/game/__tests__/admin-workflow.test.ts` — status gate: approved questions served, draft blocked (ADMIN-03)

*All Wave 0 stubs must be it.todo() at minimum; Wave 0 task fills real tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin login form rejects wrong password | ADMIN-01 | UI interaction required | Visit /admin-login, submit wrong password, expect 401 toast |
| Admin pages redirect to /admin-login without cookie | ADMIN-01 | Middleware requires browser session | Clear cookies, navigate to /admin/questions, confirm redirect |
| Cloudinary upload succeeds for image file | ADMIN-02 | Requires live Cloudinary credentials | Upload a PNG in question create form; verify mediaUrl populated |
| Category archived flag hides from public | ADMIN-01 | No automated check for UI absence | Archive a category, start a game, confirm it doesn't appear |
| RTL admin layout renders correctly | — | Visual verification | Open /admin in Chrome/Firefox, check Arabic labels, RTL alignment |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
