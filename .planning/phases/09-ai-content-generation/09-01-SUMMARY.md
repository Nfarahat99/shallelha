---
phase: 9
plan: "09-01"
subsystem: backend
tags: [openai, gpt-4o, ai-generation, express, rate-limiting, tdd]
dependency_graph:
  requires: []
  provides: [POST /admin/ai-generate]
  affects: [apps/server/src/routes/admin.ts]
tech_stack:
  added: [openai ^4.x]
  patterns: [lazy-singleton client, vi.hoisted mock, aiGenerateLimiter, skipDuplicates bulk insert]
key_files:
  created:
    - apps/server/src/routes/__tests__/admin-ai.test.ts
  modified:
    - apps/server/src/routes/admin.ts
    - apps/server/.env.example
    - apps/server/package.json
decisions:
  - OpenAI client uses lazy singleton (not module-level constructor) to avoid throwing when OPENAI_API_KEY is absent in test environments
  - aiGenerateLimiter keyGenerator uses admin_session cookie with validate.ip disabled to silence ERR_ERL_KEY_GEN_IPV6 and avoid cookie-parser dependency
  - GPT response parsed as json_object wrapper — obj.questions extracts the array per locked decision
  - vi.hoisted() used for mockCreate so the mock fn survives vitest module hoisting
metrics:
  duration: "~15 minutes"
  completed: "2026-04-18"
  tasks_completed: 3
  files_modified: 4
---

# Phase 9 Plan 01: Backend OpenAI GPT-4o Integration & AI Generation Route Summary

**One-liner:** Express POST /admin/ai-generate with GPT-4o (json_object mode), Arabic Gulf-culture prompt, per-cookie rate limiting (5/min), and bulk-draft DB insert via Prisma createMany.

## What Was Built

Added `POST /admin/ai-generate` to the existing `adminRouter` in `apps/server/src/routes/admin.ts`. The route:

1. Validates `categoryId` (non-empty string) and `count` (integer 5–10) — returns 400 on failure
2. Looks up the category via `prisma.category.findUnique` — returns 404 if absent
3. Calls GPT-4o with an Arabic Gulf-culture system prompt using `response_format: json_object`
4. Parses `obj.questions` from the JSON response, filters structurally valid items
5. Bulk-inserts valid questions as `status: 'draft'`, `type: 'MULTIPLE_CHOICE'`, `timerDuration: 20` via `prisma.question.createMany({ skipDuplicates: true })`
6. Returns `{ created: N, questions: [...] }` or 502 on any OpenAI/parse error

A dedicated `aiGenerateLimiter` (5 req/min, keyed on `admin_session` cookie) guards the route separately from the existing `adminLimiter`.

## Files Modified

| File | Change |
|------|--------|
| `apps/server/src/routes/admin.ts` | Added OpenAI import, lazy singleton getter, aiGenerateLimiter, POST /ai-generate handler |
| `apps/server/src/routes/__tests__/admin-ai.test.ts` | Created — 6 vitest + supertest unit tests (TDD RED→GREEN) |
| `apps/server/.env.example` | Appended OPENAI_API_KEY placeholder block (server-only) |
| `apps/server/package.json` | Added openai ^4.x dependency |

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| admin-ai.test.ts | 6 | PASS |
| admin.test.ts | 4 | PASS |
| All other suites | 74 | PASS |
| **Total** | **84** | **84/84 PASS** |

TypeScript: `npx tsc --noEmit` — zero errors.

## Commits

| Hash | Description |
|------|-------------|
| ed1cc68 | feat(09-01): install openai SDK and document OPENAI_API_KEY in .env.example |
| b538fa4 | test(09-01): add failing RED tests for POST /admin/ai-generate |
| ef9dfc3 | feat(09-01): implement POST /admin/ai-generate with GPT-4o integration (GREEN) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] OpenAI module-level constructor breaks existing admin.test.ts**
- **Found during:** Task 3 full suite run
- **Issue:** `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` at module level throws `Missing credentials` when `admin.test.ts` imports `admin.ts` without mocking openai
- **Fix:** Replaced with a lazy singleton getter `getOpenAIClient()` — client only instantiated on first real request, not at import time
- **Files modified:** `apps/server/src/routes/admin.ts`
- **Commit:** ef9dfc3

**2. [Rule 1 - Bug] vi.mock factory cannot access module-level const (vitest hoisting)**
- **Found during:** Task 2 RED run (vitest hoisting analysis)
- **Issue:** `const mockCreate = vi.fn()` declared before `vi.mock` is hoisted above it at runtime, causing `Cannot access 'mockCreate' before initialization`
- **Fix:** Used `vi.hoisted(() => ({ mockCreate: vi.fn() }))` to declare the mock fn in a hoisted context that the `vi.mock` factory can safely reference
- **Files modified:** `apps/server/src/routes/__tests__/admin-ai.test.ts`
- **Commit:** ef9dfc3

**3. [Rule 1 - Bug] ERR_ERL_KEY_GEN_IPV6 warning from express-rate-limit**
- **Found during:** Task 3 GREEN run
- **Issue:** express-rate-limit v8 emits a validation warning when keyGenerator uses `req.ip` without `ipKeyGenerator` helper, suggesting IPv6 bypass risk
- **Fix:** Changed keyGenerator to use only the `admin_session` cookie value (falls back to `'default'`) and set `validate: { ip: false }` to silence the warning — appropriate since the key is cookie-based, not IP-based
- **Files modified:** `apps/server/src/routes/admin.ts`
- **Commit:** ef9dfc3

## Known Stubs

None — all data paths are wired. The route calls real OpenAI (mocked in tests) and real Prisma (mocked in tests).

## Threat Flags

No new security surface beyond what the plan's threat model covers. OPENAI_API_KEY is server-only; apps/web/.env.example was not modified.

## Self-Check: PASSED

- `apps/server/src/routes/admin.ts` — FOUND
- `apps/server/src/routes/__tests__/admin-ai.test.ts` — FOUND
- `apps/server/.env.example` contains OPENAI_API_KEY — FOUND
- Commits ed1cc68, b538fa4, ef9dfc3 — FOUND
