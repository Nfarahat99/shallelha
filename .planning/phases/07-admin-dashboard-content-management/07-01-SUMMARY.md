---
phase: 07-admin-dashboard-content-management
plan: "01"
subsystem: database
tags: [prisma, postgresql, schema-migration, testing]

# Dependency graph
requires:
  - phase: 06-lifelines
    provides: Completed game engine with 58 passing tests; Question/Category models
provides:
  - Category.archived Boolean field for soft-deleting categories
  - Question.timesPlayed Int field for analytics tracking
  - Question.timesAnsweredWrong Int field for analytics tracking
  - Wave 0 test stubs for admin analytics, seed, and workflow tests
  - Phase 7 env vars documented in .env.example
affects:
  - 07-02-admin-auth-session
  - 07-03-question-seed-200
  - 07-04-admin-ui-dashboard
  - 07-05-admin-analytics-api

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 test stubs: .todo() placeholders created before implementation for TDD readiness"
    - "Schema-first additive migration: purely additive columns with defaults, no data loss risk"

key-files:
  created:
    - apps/server/src/routes/__tests__/admin.test.ts
    - apps/server/src/__tests__/admin-seed.test.ts
    - apps/server/src/game/__tests__/admin-workflow.test.ts
  modified:
    - apps/server/prisma/schema.prisma
    - .env.example

key-decisions:
  - "Used db push --accept-data-loss (safe: only additive columns with defaults, no existing data affected)"
  - "Wave 0 stubs placed in logical test directories matching future implementation locations"
  - "db push cannot run locally without DATABASE_URL; schema validated with prisma validate + dummy URL; client regenerated successfully"

patterns-established:
  - "Wave 0 stubs: create .todo() test files before implementation so TDD Red phase starts from known locations"
  - "Schema migrations for Phase 7 are purely additive — no destructive changes"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-04-11
---

# Phase 07 Plan 01: Schema Migration + Wave 0 Test Stubs Summary

**Prisma schema extended with 3 additive admin fields (archived, timesPlayed, timesAnsweredWrong), Wave 0 test stubs created for all downstream Phase 7 plans, and .env.example updated with all Phase 7 env vars**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-11T13:27:00Z
- **Completed:** 2026-04-11T13:35:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended Category model with `archived Boolean @default(false)` for soft-delete support
- Extended Question model with `timesPlayed Int @default(0)` and `timesAnsweredWrong Int @default(0)` for analytics
- Regenerated Prisma client successfully after schema changes
- Created 3 Wave 0 test stub files with 13 `.todo()` specs covering admin analytics, seed idempotency, and question status gating
- Appended Phase 7 env vars to .env.example (ADMIN_PASSWORD, ADMIN_SESSION_TOKEN, Cloudinary)
- All 58 existing tests still pass; 13 todo stubs correctly skipped

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: Schema migration + Wave 0 test stubs** - `1fd416e` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `apps/server/prisma/schema.prisma` - Added archived to Category, timesPlayed + timesAnsweredWrong to Question
- `apps/server/src/routes/__tests__/admin.test.ts` - 4 todo stubs for admin analytics endpoint
- `apps/server/src/__tests__/admin-seed.test.ts` - 4 todo stubs for seed script behavior
- `apps/server/src/game/__tests__/admin-workflow.test.ts` - 5 todo stubs for question status gate
- `.env.example` - Phase 7 env vars appended

## Decisions Made
- `db push --accept-data-loss` is safe here: all 3 new columns have `@default()` values, no data loss possible
- DATABASE_URL not available locally (Railway deployment); schema validated with `prisma validate` using dummy URL, then client regenerated — the actual `db push` will run on Railway deployment
- Wave 0 stubs placed in the directories where real tests will live in Plans 02-05

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DATABASE_URL not available in local environment**
- **Found during:** Task 1 (db push)
- **Issue:** No .env file exists locally; DATABASE_URL is a Railway deployment variable. `prisma db push` exits with P1012 error.
- **Fix:** Validated schema with `prisma validate` using a dummy DATABASE_URL (validates syntax without network call), then ran `prisma generate` to regenerate the client. The actual db push will run as part of Railway deployment.
- **Files modified:** None (schema already correct)
- **Verification:** `prisma validate` output: "The schema at prisma/schema.prisma is valid", `prisma generate` succeeded
- **Committed in:** 1fd416e

---

**Total deviations:** 1 auto-fixed (1 blocking — missing local DATABASE_URL)
**Impact on plan:** Schema changes are valid and client is regenerated. Actual migration will apply on Railway deploy. No scope impact.

## Issues Encountered
- Local environment has no .env / DATABASE_URL — this is expected for a Railway-deployed project. All schema validation and client generation succeeded; db push deferred to Railway deployment pipeline.

## User Setup Required
After deploying to Railway, run:
```bash
npx prisma db push --accept-data-loss
```
Or trigger it via the Railway deploy hook. The 3 new columns will be added to the live database with no data loss.

Also set these environment variables in Railway and Vercel dashboards:
- `ADMIN_PASSWORD` — strong password for admin login
- `ADMIN_SESSION_TOKEN` — generate with `openssl rand -hex 32`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from Cloudinary dashboard

## Known Stubs
All 13 todo stubs are intentional Wave 0 placeholders. They will be filled in by Plans 07-02 through 07-05:
- `src/routes/__tests__/admin.test.ts` — filled by Plan 07-05 (analytics API)
- `src/__tests__/admin-seed.test.ts` — filled by Plan 07-03 (question seed)
- `src/game/__tests__/admin-workflow.test.ts` — filled by Plan 07-02/07-04 (admin workflow)

## Next Phase Readiness
- Schema is ready: all Phase 7 models have required fields
- Prisma client is regenerated and type-safe with new fields
- Test stub locations established for all downstream plans
- .env.example documents all required Phase 7 secrets
- Ready for Plan 07-02: Admin auth + session management

---
*Phase: 07-admin-dashboard-content-management*
*Completed: 2026-04-11*
