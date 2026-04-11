---
phase: 07-admin-dashboard-content-management
plan: "05"
subsystem: database
tags: [prisma, seed, idempotent-upsert, testing, arabic-content]

# Dependency graph
requires:
  - phase: 07-03
    provides: Question CRUD + Cloudinary upload; schema has all required fields
  - phase: 07-01
    provides: Wave 0 stub tests in admin-seed.test.ts; schema with timesPlayed/timesAnsweredWrong
provides:
  - 201 Arabic questions across 6 categories (MC/MEDIA_GUESSING/FREE_TEXT)
  - Idempotent seed via prisma.question.upsert keyed on @@unique([text, categoryId])
  - seed-data.ts module importable by tests without Prisma mock
  - 4 passing structural assertions on seed data shape and counts
affects:
  - production seeding on Railway
  - game engine question pool

# Tech tracking
tech-stack:
  added:
    - tsx@4.21.0 (devDependency) — replaces ts-node for seed script execution per CLAUDE.md
  patterns:
    - "Seed data module pattern: seed-data.ts exports typed data, seed.ts imports and upserts — testable without DB"
    - "Per-question upsert: @@unique([text, categoryId]) composite key enables idempotent incremental re-seeding"

key-files:
  created:
    - apps/server/prisma/seed-data.ts
  modified:
    - apps/server/prisma/schema.prisma
    - apps/server/prisma/seed.ts
    - apps/server/src/__tests__/admin-seed.test.ts
    - apps/server/package.json

key-decisions:
  - "seed-data.ts extraction: separate module allows test imports without Prisma mocking"
  - "tsx over ts-node: CLAUDE.md prohibits ts-node for startup/seed scripts"
  - "@@unique([text, categoryId]) enables safe re-run without duplicate key errors"

# Metrics
duration: 20min
completed: 2026-04-11
---

# Phase 07 Plan 05: 200-Question Arabic Seed + Idempotent Upsert Summary

**Idempotent Arabic question seed with 201 questions across 6 categories using per-question prisma.question.upsert keyed on @@unique([text, categoryId]) composite constraint**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-04-11
- **Tasks:** 2
- **Files modified:** 5 (1 created)
- **Test results:** 71/71 passing (7 test files)

## Accomplishments

- Added `@@unique([text, categoryId])` composite unique constraint to Question model — enables upsert key `text_categoryId`
- Created `seed-data.ts` with 201 Arabic questions across 6 categories:
  - ثقافة عامة (thaqafa-amma): 27 MC + 4 MEDIA + 3 FREE_TEXT = 34
  - رياضة (riyadha): 27 MC + 3 MEDIA + 3 FREE_TEXT = 33
  - ترفيه (tarfeeh): 27 MC + 3 MEDIA + 4 FREE_TEXT = 34
  - جغرافيا (geography): 27 MC + 3 MEDIA + 4 FREE_TEXT = 34
  - تاريخ (history): 27 MC + 3 MEDIA + 3 FREE_TEXT = 33
  - علوم وتكنولوجيا (science-tech): 27 MC + 3 MEDIA + 3 FREE_TEXT = 33
  - **Total: 201 questions**
- Completely rewrote `seed.ts` to import from `seed-data.ts` and use `prisma.question.upsert` for all questions
- Updated `package.json` seed command from `ts-node --project tsconfig.json prisma/seed.ts` to `tsx prisma/seed.ts`
- Installed `tsx@4.21.0` as devDependency
- Replaced all 4 `it.todo()` stubs in `admin-seed.test.ts` with passing structural assertions
- All 71 tests pass; TypeScript compiles clean

## Task Commits

1. **Task 1: Schema constraint + seed rewrite** — `2de584c`
2. **Task 2: Seed test stubs implemented** — `7f6a812`

## Files Created/Modified

- `apps/server/prisma/seed-data.ts` — NEW: typed seed data module, 201 Arabic questions
- `apps/server/prisma/schema.prisma` — Added `@@unique([text, categoryId])` to Question model
- `apps/server/prisma/seed.ts` — Full rewrite: imports from seed-data.ts, uses upsert per question
- `apps/server/package.json` — seed command updated to `tsx prisma/seed.ts`; tsx added to devDeps
- `apps/server/src/__tests__/admin-seed.test.ts` — 4 real structural tests replacing it.todo() stubs

## Decisions Made

- **seed-data.ts extraction**: Separating data from the Prisma script makes it unit-testable without any DB setup or mocking. Tests import the module directly and assert counts/structure.
- **tsx over ts-node**: CLAUDE.md mandates no ts-node for startup/seed scripts. tsx handles TypeScript + ESM with zero config.
- **upsert over create**: `prisma.question.upsert` keyed on composite `text_categoryId` allows incremental re-seeding without fear of duplicates. The old `if (existingCount === 0)` guard blocked adding new questions to existing categories.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing dependency] tsx not installed**
- **Found during:** Task 1 — updating package.json seed command
- **Issue:** CLAUDE.md prohibits ts-node for seed scripts; plan specifies tsx, but tsx was not in package.json
- **Fix:** `npm install --save-dev tsx` — added tsx@4.21.0 to devDependencies
- **Files modified:** `apps/server/package.json`, `package-lock.json`
- **Committed in:** 2de584c

---

**Total deviations:** 1 auto-fixed (missing tsx dependency)
**Impact on plan:** No scope impact. tsx installed cleanly.

## Known Stubs

None — all Wave 0 test stubs (admin-seed.test.ts) are now fully implemented with passing assertions.

Note: `prisma db push` to apply the `@@unique([text, categoryId])` constraint to the live Railway database must be run as part of the next Railway deployment. Schema validated locally with dummy DATABASE_URL — no local DB available.

## Wave 4 Feedback Report

### nodejs-backend-patterns
Seed rewrite follows idempotent upsert pattern correctly. `prisma.$disconnect()` in finally block is correct. Logging per-category and total counts aids observability. `process.exit(1)` on error is appropriate for a seed script. No issues found.

### webapp-testing
4 structural tests replace todos. Tests are pure data assertions (no Prisma mock needed) — correct pattern for seed data validation. Tests cover: count >= 200, exactly 6 categories, uniqueness within category (idempotency proof), and options array shape. All 71 tests pass. No issues found.

### next-best-practices
Not applicable — no Next.js code touched in this plan.

### senior-devops
Package.json updated from ts-node to tsx per CLAUDE.md. tsx is devDependency-only (not bundled into production). Schema constraint deferred to Railway deployment (same pattern as Plan 07-01). No issues found.

### ui-ux-pro-max
Not applicable — no UI code touched in this plan.

### Action Items
- [ ] Deploy to Railway and run `npx prisma db push` to apply the `@@unique([text, categoryId])` constraint, then `npx prisma db seed` to populate 201 questions

---

## Self-Check: PASSED

- `apps/server/prisma/seed-data.ts` — FOUND
- `apps/server/prisma/seed.ts` — FOUND (rewritten)
- `apps/server/src/__tests__/admin-seed.test.ts` — FOUND (4 passing tests)
- Commit 2de584c — FOUND
- Commit 7f6a812 — FOUND
- 71/71 tests passing — VERIFIED
- TypeScript clean — VERIFIED

---
*Phase: 07-admin-dashboard-content-management*
*Completed: 2026-04-11*
