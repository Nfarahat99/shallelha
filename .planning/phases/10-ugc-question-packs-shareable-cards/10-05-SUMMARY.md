---
phase: 10-ugc-question-packs-shareable-cards
plan: "05"
subsystem: admin-pack-approval
tags: [admin, packs, approval-queue, server-actions, prisma]
dependency_graph:
  requires: [10-01-SUMMARY.md]
  provides: [admin-pack-approval-queue, rejection-reason-display]
  affects: [apps/web/app/(admin), apps/server/prisma/schema.prisma, apps/server/src/routes/packs.ts]
tech_stack:
  added: []
  patterns: [next-server-actions, admin-cookie-auth, force-dynamic-rsc, prisma-db-push]
key_files:
  created:
    - apps/web/app/(admin)/admin/packs/page.tsx
    - apps/web/app/(admin)/admin/packs/actions.ts
  modified:
    - apps/server/prisma/schema.prisma
    - apps/server/src/routes/packs.ts
    - apps/web/app/(admin)/layout.tsx
    - apps/web/app/packs/my-packs/page.tsx
    - apps/web/components/packs/MyPacksClient.tsx
decisions:
  - Used prisma db push (not migrate dev) — consistent with existing pattern established in Plan 01 to avoid DB drift
  - Admin page adds defense-in-depth cookie check (T-10-05-01) in addition to middleware gate
  - Reject form uses inline native HTML form with required input — no dialog/modal JS needed
  - Pending count badge fetched at layout render time (force-dynamic); no separate API for count
metrics:
  duration: "~45 min"
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 7
---

# Phase 10 Plan 05: Admin Pack Approval Queue Summary

Admin approval queue for community-submitted packs. Admins can review PENDING packs, approve them to the marketplace, or reject with a reason. Rejected creators see the reason on their My Packs page.

## What Was Built

**Backend changes (2 files):**
- `schema.prisma`: Added `rejectionReason String?` to the `Pack` model; ran `prisma db push` to sync
- `packs.ts`: Updated `GET /packs` to accept optional `?status=` query param (defaults to `APPROVED`); updated `PATCH /packs/:id/status` to persist `rejectionReason` when `status=REJECTED`

**Frontend changes (5 files):**
- `/admin/packs/actions.ts`: Two Server Actions — `approvePack` and `rejectPack` — both verify admin cookie for defense-in-depth (T-10-05-01)
- `/admin/packs/page.tsx`: Force-dynamic Server Component showing PENDING packs with approve button and inline reject form (reason required)
- `(admin)/layout.tsx`: Added "الباقات" nav link; fetches pending pack count at render time, shows amber badge when count > 0
- `packs/my-packs/page.tsx`: Added `rejectionReason` field to `PackSummary` interface
- `MyPacksClient.tsx`: Added `rejectionReason` to interface; renders rejection reason card for REJECTED packs

## Decisions Made

1. **prisma db push over migrate dev** — existing project pattern; avoids drift with Railway PostgreSQL
2. **Defense-in-depth admin cookie check** — middleware is the primary gate; Server Actions also check independently per T-10-05-01
3. **Inline native form for rejection reason** — `<input required>` inside `<form>` with server action handles validation without client JS; simpler than a modal
4. **Pending count in layout** — layout is already `async`; adding a fetch at layout level gives the badge without a separate client component or API endpoint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MyPacksClient already existed from Plan 02**
- **Found during:** Task 2
- **Issue:** `MyPacksClient.tsx` was already created (by Wave 2 Plan 02 agent running in parallel). It already had correct structure but was missing the `rejectionReason` field on `PackSummary` and the rejection reason display block.
- **Fix:** Read the existing file and added `rejectionReason?: string | null` to the interface + a rejection reason card in the pack card template
- **Files modified:** `apps/web/components/packs/MyPacksClient.tsx`
- **Commit:** 8c288a9

**2. [Rule 3 - Blocking] Admin route group path**
- **Found during:** Task 1
- **Issue:** Plan specified `apps/web/app/admin/packs/` but Next.js uses route group `(admin)`, so the actual path is `apps/web/app/(admin)/admin/packs/`
- **Fix:** Created files at the correct path

## Known Stubs

None — all data is fetched from the live backend API.

## Threat Flags

None — no new network endpoints or trust boundaries introduced beyond what the plan specified.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `apps/web/app/(admin)/admin/packs/page.tsx` exists | FOUND |
| `apps/web/app/(admin)/admin/packs/actions.ts` exists | FOUND |
| `apps/web/components/packs/MyPacksClient.tsx` exists | FOUND |
| commit c4bb844 (backend) exists | FOUND |
| commit 8c288a9 (frontend) exists | FOUND |
| `next build` passes | PASSED |
