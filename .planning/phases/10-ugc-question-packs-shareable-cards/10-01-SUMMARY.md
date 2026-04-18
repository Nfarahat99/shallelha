---
phase: 10-ugc-question-packs-shareable-cards
plan: 01
subsystem: backend/packs
tags: [prisma, rest-api, pack-crud, postgresql, integration-tests]
dependency_graph:
  requires: []
  provides: [pack-data-layer, pack-rest-api]
  affects: [apps/server/prisma/schema.prisma, apps/server/src/routes/packs.ts, apps/server/src/index.ts]
tech_stack:
  added: [PackStatus enum, Pack model, PackQuestion model]
  patterns: [express-rate-limit, prisma-cascade-delete, arabic-error-messages]
key_files:
  created:
    - apps/server/src/routes/packs.ts
    - apps/server/src/routes/__tests__/packs.integration.test.ts
  modified:
    - apps/server/prisma/schema.prisma
    - apps/server/src/index.ts
decisions:
  - Used `prisma db push` instead of `prisma migrate dev` due to drift between migration history and existing DB state
  - Placed integration test at src/routes/__tests__/packs.integration.test.ts to match existing test pattern (vitest includes src/**/*.test.ts)
  - GET /packs/mine defined before GET /packs/:id in the router to prevent route shadowing
metrics:
  duration: ~15 minutes
  completed: 2026-04-18
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 10 Plan 01: Pack CRUD Data Layer + REST API Summary

**One-liner:** PostgreSQL Pack + PackQuestion schema via Prisma `db push` with 6-endpoint Express REST API and 6 green integration tests.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Extend Prisma schema with Pack models and run migration | 3102e83 | apps/server/prisma/schema.prisma |
| 2 | Pack CRUD REST route + integration tests | 74eeb47 | apps/server/src/routes/packs.ts, apps/server/src/index.ts, apps/server/src/routes/__tests__/packs.integration.test.ts |

---

## What Was Built

### Prisma Schema Extension (`apps/server/prisma/schema.prisma`)

Added three new declarations after the `VerificationToken` model:

- **`PackStatus` enum**: `DRAFT | PENDING | APPROVED | REJECTED`
- **`Pack` model**: id, name, description, category, language, difficulty, status (default: DRAFT), createdBy (NextAuth user ID string — no FK to avoid cascade complexity), creatorHandle, playCount, rating, questions relation, timestamps
- **`PackQuestion` model**: id, packId (FK with `onDelete: Cascade`), text, type (reuses `QuestionType`), options (String[]), correctIndex (nullable for FREE_TEXT), order

Schema applied via `prisma db push` (migration history had drift from existing DB state).

### Pack REST API (`apps/server/src/routes/packs.ts`)

Six endpoints mounted at `/packs`:

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| POST | `/packs` | Create pack with nested questions | 201, 400, 500 |
| GET | `/packs` | List APPROVED packs with ?category= ?language= filters | 200 |
| GET | `/packs/mine?userId=` | List all-status packs for owner | 200, 400 |
| GET | `/packs/:id` | Get single pack with full questions | 200, 404 |
| PATCH | `/packs/:id/status` | Update pack status | 200, 400, 404 |
| DELETE | `/packs/:id` | Delete DRAFT-only pack | 204, 400, 404 |

Rate limiter: 30 req/min on all routes. Arabic error messages on all 4xx responses.

### Integration Tests (`apps/server/src/routes/__tests__/packs.integration.test.ts`)

Six tests, all passing against real PostgreSQL:

1. POST /packs creates pack with status DRAFT
2. GET /packs only returns APPROVED packs
3. GET /packs/mine returns all statuses for owner
4. PATCH /packs/:id/status transitions DRAFT → PENDING
5. DELETE /packs/:id fails (400) if status is PENDING
6. DELETE /packs/:id succeeds (204) if status is DRAFT

Cleanup: `afterEach` deletes packQuestions then packs where `name LIKE '[TEST_PACK]%'`. `afterAll` removes test user stub and disconnects Prisma.

---

## Verification Results

- `npx prisma validate` — passes
- `npx prisma generate` — regenerates client with Pack + PackQuestion types
- Pack/PackQuestion tables confirmed in PostgreSQL
- Integration tests: **6/6 pass**
- Full server suite: 101/103 pass (2 pre-existing failures in `ai-pack.integration.test.ts` — rate-limiter state leak, unrelated to this plan)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used `prisma db push` instead of `prisma migrate dev`**
- **Found during:** Task 1
- **Issue:** `prisma migrate dev` detected drift between migration history and the live DB (all existing models were "new" from the perspective of migration history). The command required an interactive reset confirmation that would have dropped all data.
- **Fix:** Used `prisma db push` which syncs the schema without requiring a clean migration history. This is the correct approach for an existing production-like DB.
- **Files modified:** None beyond schema.prisma (already staged)
- **Commit:** 3102e83

**2. [Rule 3 - Blocking] Discovered `aiPackRouter` already mounted in `index.ts`**
- **Found during:** Task 2 (mounting packsRouter)
- **Issue:** The plan's `index.ts` context showed only `adminRouter`, but the actual file also had `aiPackRouter` from a prior phase. Added packsRouter alongside the existing mounts.
- **Fix:** Added import and mount line without disturbing existing routes.
- **Files modified:** apps/server/src/index.ts
- **Commit:** 74eeb47

---

## Known Stubs

None — all endpoints are fully wired to real Prisma queries against PostgreSQL.

---

## Threat Flags

No new threat surface beyond what the plan's threat model covers (T-10-01-01 through T-10-01-04). The `createdBy` spoofing and admin-gate mitigations are deferred to Plans 02 and 05 as documented in the threat register.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| apps/server/src/routes/packs.ts | FOUND |
| apps/server/src/routes/__tests__/packs.integration.test.ts | FOUND |
| .planning/phases/10-ugc-question-packs-shareable-cards/10-01-SUMMARY.md | FOUND |
| commit 3102e83 | FOUND |
| commit 74eeb47 | FOUND |
