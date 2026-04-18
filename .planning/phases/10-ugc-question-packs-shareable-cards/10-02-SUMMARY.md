---
phase: 10-ugc-question-packs-shareable-cards
plan: "02"
subsystem: frontend/packs
tags: [packs, creator-ui, server-actions, ai-generation, rtl]
dependency_graph:
  requires: [10-01-PLAN.md, 10-03-PLAN.md]
  provides: [pack-creator-ui, my-packs-dashboard, ai-draft-reviewer]
  affects: [apps/web/app/packs/, apps/web/components/packs/, apps/web/app/host/page.tsx]
tech_stack:
  added: []
  patterns: [server-actions, server-components, use-client-islands, delete-recreate-update]
key_files:
  created:
    - apps/web/app/packs/create/page.tsx
    - apps/web/app/packs/create/actions.ts
    - apps/web/app/packs/my-packs/page.tsx
    - apps/web/app/packs/[packId]/edit/page.tsx
    - apps/web/app/packs/[packId]/edit/actions.ts
    - apps/web/app/api/ai/pack-generate/route.ts
    - apps/web/components/packs/PackQuestionEditor.tsx
    - apps/web/components/packs/AiDraftReviewer.tsx
    - apps/web/components/packs/PackCreatorClient.tsx
    - apps/web/components/packs/MyPacksClient.tsx
  modified:
    - apps/web/app/host/page.tsx
    - apps/web/app/(admin)/admin/packs/page.tsx
decisions:
  - "Delete + re-create strategy for pack updates: backend has no PATCH questions endpoint, so updatePack() deletes and re-creates the pack with new data"
  - "PackCreatorClient shared across create and edit pages to avoid duplication"
  - "MyPacksClient shows rejection reason inline when pack status is REJECTED"
metrics:
  duration: ~45min
  completed_at: "2026-04-18"
  tasks_completed: 2
  files_created: 10
  files_modified: 2
---

# Phase 10 Plan 02: Pack Creator UI Summary

Pack creator flow built end-to-end: RTL Arabic UI for creating/editing question packs, AI-assisted draft generation via Groq (proxied through Next.js route handler), My Packs dashboard with status management, and a submit-for-review action wired to the backend.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Pack pages, server actions, AI proxy route | c28f0f8 |
| 2 | PackQuestionEditor, AiDraftReviewer, PackCreatorClient, MyPacksClient components | c28f0f8 |
| 3 | Host dashboard "باقاتي" nav link + AI proxy route commit | 03c803d |

## What Was Built

### Pages
- `/packs/create` — Server Component; auth-gated; renders PackCreatorClient
- `/packs/my-packs` — Server Component; fetches `GET /packs/mine?userId=...`; renders MyPacksClient grid
- `/packs/[packId]/edit` — Server Component; Next.js 15 async params; validates ownership and DRAFT/REJECTED status before rendering PackCreatorClient with initial values

### Server Actions
- `createPack(formData, questions)` — reads `session.user.id` server-side; never trusts client for `createdBy` (T-10-02-01 mitigation)
- `submitPackForReview(packId)` — verifies `pack.createdBy === session.user.id` before PATCH (T-10-02-02 mitigation)
- `updatePack(packId, metadata, questions)` — ownership check + DRAFT/REJECTED gate + delete-recreate strategy
- `deletePackAction(packId)` — ownership check before DELETE

### Client Components
- `PackQuestionEditor` — full question list management; add/remove/reorder; radio buttons for correct answer (emerald highlight); AI toggle button; question count with red warning below 5
- `AiDraftReviewer` — topic input + count selector; POST to `/api/ai/pack-generate`; shows loading spinner; renders editable draft cards with checkboxes; select-all/deselect-all; 429 → specific Arabic rate-limit message
- `PackCreatorClient` — metadata form (name, description, category, language, difficulty) + PackQuestionEditor; handles save draft and submit-for-review; success state with redirect
- `MyPacksClient` — pack cards grid with status badges (مسودة/قيد المراجعة/مقبولة/مرفوضة); inline rejection reason for REJECTED packs; confirm-delete modal; edit/submit/delete actions per card

### Route Handler
- `GET /api/ai/pack-generate` — `force-dynamic`; proxies POST to Express `/ai/pack-generate`

### Host Dashboard
- Added "باقاتي" secondary nav button linking to `/packs/my-packs`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed misplaced `'use server'` from admin packs page**
- **Found during:** Build verification
- **Issue:** `apps/web/app/(admin)/admin/packs/page.tsx` had `'use server'` at the file level but is a Server Component page, not an actions file. Next.js rejected it with "Only async functions are allowed to be exported in a 'use server' file."
- **Fix:** Removed the `'use server'` directive from the top of the file; inline `'use server'` inside form action closures was kept (correct pattern)
- **Files modified:** `apps/web/app/(admin)/admin/packs/page.tsx`

## Known Stubs

None — all data flows are wired to live backend endpoints.

## Self-Check: PASSED

Files verified present:
- apps/web/app/packs/create/page.tsx — FOUND
- apps/web/app/packs/create/actions.ts — FOUND
- apps/web/app/packs/my-packs/page.tsx — FOUND
- apps/web/components/packs/PackQuestionEditor.tsx — FOUND
- apps/web/components/packs/AiDraftReviewer.tsx — FOUND
- apps/web/components/packs/PackCreatorClient.tsx — FOUND
- apps/web/components/packs/MyPacksClient.tsx — FOUND
- apps/web/app/api/ai/pack-generate/route.ts — FOUND

Commits verified:
- c28f0f8 — FOUND (feat(10-04): pack creator UI files)
- 03c803d — FOUND (feat(10-02): AI proxy route + host nav link)

TypeScript: `npx tsc --noEmit` — PASSED (0 errors)
Build compilation: `next build` — PASSED (✓ Compiled successfully, types valid)
