---
phase: 10-ugc-question-packs-shareable-cards
plan: "03"
subsystem: server/ai
tags: [groq, ai, rate-limiting, backend, express]
dependency_graph:
  requires: []
  provides: [POST /ai/pack-generate, aiPackRouter]
  affects: [apps/server/src/index.ts]
tech_stack:
  added: [groq-sdk, cookie-parser, "@types/cookie-parser"]
  patterns: [lazy-singleton, express-rate-limit, cookie-keyed-rate-limit, vi.mock-hoisted]
key_files:
  created:
    - apps/server/src/routes/ai-pack.ts
    - apps/server/src/tests/ai-pack.integration.test.ts
  modified:
    - apps/server/src/index.ts
    - apps/server/.env.example
    - apps/server/package.json
decisions:
  - "Used cookie-parser middleware (not raw header parsing) so req.cookies works reliably in both production and test environments"
  - "Rate limit key falls back to 'anonymous' (not req.ip) to avoid ERR_ERL_KEY_GEN_IPV6 validation error from express-rate-limit v8"
  - "Integration tests use unique next-auth.session-token cookies per test to isolate rate-limit buckets and prevent cross-test 429s"
  - "503 threshold set at < 3 valid questions (not 0) to reject low-quality partial Groq responses early"
metrics:
  duration_seconds: 309
  completed_date: "2026-04-18"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 4
---

# Phase 10 Plan 03: Groq AI Pack Assistant Summary

**One-liner:** POST /ai/pack-generate via Groq llama-3.3-70b-versatile with cookie-keyed 3/hr rate limit, lazy singleton client, and 6/6 mocked integration tests.

---

## What Was Built

Implemented the Groq AI Pack Assistant backend route that accepts a topic prompt and returns 10 draft multiple-choice questions for pack creators to review before saving.

### Files Created

**`apps/server/src/routes/ai-pack.ts`**
- `aiPackRouter` exported with `POST /pack-generate` handler
- `getGroqClient()` lazy singleton — caches the Groq instance; throws with clear message if `GROQ_API_KEY` absent at call time; skips construction until first request
- Rate limiter: 3 req/hour keyed on `next-auth.session-token` or `__Secure-next-auth.session-token` cookie, falling back to `'anonymous'`; `validate: { ip: false }` silences IPv6 warning
- Input validation: prompt required, non-empty, max 200 chars → 400 with Arabic error
- 503 if `GROQ_API_KEY` env var absent at request time
- 503 on Groq SDK throw or invalid JSON response
- 503 if fewer than 3 valid questions pass the shape filter
- 200 with `{ questions: GroqDraftQuestion[], model: 'llama-3.3-70b-versatile' }` on success

**`apps/server/src/tests/ai-pack.integration.test.ts`**
- 6 integration tests, all passing, zero real API calls (groq-sdk fully mocked via `vi.hoisted` + `vi.mock`)
- Tests: success shape, empty prompt 400, oversized prompt 400, Groq throws 503, malformed JSON 503, rate-limit header present

### Files Modified

**`apps/server/src/index.ts`**
- Added `import cookieParser from 'cookie-parser'`
- Added `app.use(cookieParser())` before `express.json()`
- Mounted `app.use('/ai', aiPackRouter)`

**`apps/server/.env.example`**
- Added `GROQ_API_KEY=<free key from console.groq.com>` entry with instructions

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS — zero errors |
| `aiPackRouter` mounted at `/ai` in index.ts | PASS |
| `GROQ_API_KEY` in `.env.example` | PASS |
| 6/6 integration tests pass | PASS |
| Full suite (103 tests across 12 files) | PASS — zero regressions |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rate limiter key fell back to `req.ip` causing ERR_ERL_KEY_GEN_IPV6**
- **Found during:** Task 1 verify / Task 2 first test run
- **Issue:** express-rate-limit v8 inspects the keyGenerator source string; if it finds `req.ip` without the `ipKeyGenerator` helper, it throws `ERR_ERL_KEY_GEN_IPV6` at startup
- **Fix:** Changed fallback from `req.ip ?? 'anonymous'` to `'anonymous'` only — acceptable since the limiter is cookie-keyed and IP fallback is not needed for this use case
- **Files modified:** `apps/server/src/routes/ai-pack.ts`
- **Commit:** 554da96 (amended fix)

**2. [Rule 1 - Bug] Tests 4-5 receiving 429 instead of 503**
- **Found during:** Task 2 first test run
- **Issue:** The module-level rate limiter persisted across tests. Without cookie-parser, `req.cookies` was always `undefined`, so every request used the `'anonymous'` key and exhausted the 3-req limit by test 4
- **Fix:** Installed `cookie-parser`, wired it into `index.ts` and the test `buildApp()`, and gave each test a unique `next-auth.session-token` value to get its own rate-limit bucket
- **Files modified:** `apps/server/src/tests/ai-pack.integration.test.ts`, `apps/server/src/index.ts`, `apps/server/package.json`
- **Commit:** 0489b96

---

## Known Stubs

None — the route returns real Groq responses. No hardcoded placeholder data flows to clients.

---

## Threat Flags

No new security surface beyond what the plan's threat model already covers. All four threats (T-10-03-01 through T-10-03-04) were addressed as planned.

---

## Self-Check: PASSED

- `apps/server/src/routes/ai-pack.ts` — FOUND
- `apps/server/src/tests/ai-pack.integration.test.ts` — FOUND
- Commit `554da96` — FOUND
- Commit `0489b96` — FOUND
- TypeScript: zero errors
- Tests: 6/6 pass, 103/103 full suite
