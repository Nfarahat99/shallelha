---
phase: 10
plan: 04
subsystem: frontend-packs
tags: [packs, marketplace, host-flow, socket, rtl, arabic]
dependency_graph:
  requires: [10-01]
  provides: [pack-marketplace-ui, pack-detail-ui, host-pack-selection]
  affects: [host-new-flow, room-creation]
tech_stack:
  added: []
  patterns: [rsc-async-params, suspense-boundary, socket-payload-validation]
key_files:
  created:
    - apps/web/components/packs/PackCard.tsx
    - apps/web/components/packs/PackFilters.tsx
    - apps/web/app/packs/page.tsx
    - apps/web/app/packs/[packId]/page.tsx
    - apps/web/app/packs/[packId]/PackQuestionPreview.tsx
  modified:
    - apps/web/app/host/new/page.tsx
    - apps/web/app/host/new/HostNewClient.tsx
    - apps/server/src/room/room.ts
    - apps/server/src/room/room.service.ts
    - apps/server/src/socket/room.ts
decisions:
  - No Server Action for pack wiring — room creation is socket-only; packId stored in Redis via socket handler
  - APPROVED-status gate enforced server-side in socket handler (T-10-04-01), not only client-side
  - HostNewClient auto-proceeds once packInfo is loaded; no extra confirmation step needed
metrics:
  duration: 45m
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 10
---

# Phase 10 Plan 04: Pack Marketplace UI & Host Pack Selection Summary

Pack marketplace listing page, detail page, and host room creation wired to accept a pre-selected question pack — full RTL Arabic UI with socket-level APPROVED-status validation.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Pack marketplace listing + detail pages | c28f0f8 | PackCard, PackFilters, /packs/page, /packs/[packId]/page, PackQuestionPreview |
| 2 | Wire packId into host room creation flow | 69fddef | HostNewPage, HostNewClient, room.ts, room.service.ts, socket/room.ts |

## What Was Built

### Task 1 — Pack Marketplace UI

**`/packs` listing page** (`apps/web/app/packs/page.tsx`):
- `export const dynamic = 'force-dynamic'` — always fresh
- `async searchParams: Promise<{ category?: string; language?: string }>` — Next.js 15 pattern
- 2-col mobile / 3-col md+ grid of PackCard components
- PackFilters wrapped in Suspense (required: uses `useSearchParams`)
- Shows "إنشاء باقة" only when `session.user.id` present
- Empty state with Arabic message + create CTA

**`PackCard`** (`apps/web/components/packs/PackCard.tsx`):
- Full card links to `/packs/${pack.id}` via next/link
- "العب" button calls `router.push('/host/new?packId=${pack.id}')` with stopPropagation
- Official badge when `createdBy === 'admin'` or `creatorHandle === 'الإدارة'`
- Stats row: question count, play count, category, language chips
- Touch targets: min-h-[44px] min-w-[44px]

**`PackFilters`** (`apps/web/components/packs/PackFilters.tsx`):
- `useSearchParams` + `useRouter` for URL-based filter state
- Horizontal scroll chips: category row + language row (عربي / English / ثنائي)
- `applyFilter()` updates URLSearchParams without full reload

**`/packs/[packId]` detail page** (`apps/web/app/packs/[packId]/page.tsx`):
- `async params: Promise<{ packId: string }>` — awaited in both `generateMetadata` and page
- `fetchPack()` calls `GET /packs/:id` with `next: { revalidate: 60 }`
- `notFound()` when pack is missing
- Large "العب هذه الباقة" CTA → `/host/new?packId={pack.id}`
- MetaChip components for category/language/difficulty/count/plays/rating

**`PackQuestionPreview`** (`apps/web/app/packs/[packId]/PackQuestionPreview.tsx`):
- 'use client' island — shows first 3 questions collapsed
- Toggle button: "اطلع على باقي الأسئلة (N)" / "إخفاء الأسئلة"
- Correct answer highlighted in emerald, free-text badge in blue

### Task 2 — Host Pack Selection Wiring

**`Room` interface** (`apps/server/src/room/room.ts`):
- Added `packId?: string` field

**`createRoom()`** (`apps/server/src/room/room.service.ts`):
- Accepts optional third param `packId?: string`
- Stores `packId` in Redis hset when present
- `getRoom()` now returns `packId` from raw Redis data

**`room:create` socket handler** (`apps/server/src/socket/room.ts`):
- Accepts `data?: { packId?: string }` payload
- **T-10-04-01 mitigation**: fetches `GET /packs/:id` from backend, rejects if `status !== 'APPROVED'` with Arabic error `'هذه الباقة غير متاحة'`
- Returns Arabic error for 404 (`'هذه الباقة غير موجودة'`) and fetch failures
- Passes `validatedPackId` to `createRoom()`

**`HostNewPage`** (`apps/web/app/host/new/page.tsx`):
- Added `searchParams: Promise<{ packId?: string }>` prop
- Awaits and passes `packId` to `HostNewClient`

**`HostNewClient`** (`apps/web/app/host/new/HostNewClient.tsx`):
- Accepts `packId?: string` prop
- Fetches pack info from backend; validates APPROVED status client-side (fast fail)
- Shows "باقة محددة: {name}" in the loading spinner when pack is loaded
- Shows Arabic error UI with "العودة إلى الباقات" button when pack unavailable
- Original auto-create flow preserved when no packId
- Emits `socket.emit('room:create', { packId })` when pack is valid

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] No Server Action needed — socket-only room creation**
- **Found during:** Task 2 research
- **Issue:** Plan mentioned creating `actions.ts` for pack validation, but room creation is entirely socket-based — no Server Action exists
- **Fix:** Validation performed in `room:create` socket handler instead; `TODO` comment added for game server to read pack questions from room config
- **Files modified:** `apps/server/src/socket/room.ts`
- **Commit:** 69fddef

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-10-04-01: packId tampering via query param | Socket handler fetches pack from backend; rejects non-APPROVED packs with Arabic error before storing in Redis | Mitigated |
| T-10-04-02: question content disclosure | Accepted — preview shown intentionally on detail page | Accepted |

## Known Stubs

None — all data flows are wired to live backend endpoints.

## Self-Check: PASSED

- `apps/web/components/packs/PackCard.tsx` — FOUND
- `apps/web/components/packs/PackFilters.tsx` — FOUND
- `apps/web/app/packs/page.tsx` — FOUND
- `apps/web/app/packs/[packId]/page.tsx` — FOUND
- `apps/web/app/packs/[packId]/PackQuestionPreview.tsx` — FOUND
- `apps/web/app/host/new/HostNewClient.tsx` — FOUND (modified)
- `apps/server/src/room/room.ts` — FOUND (modified)
- Commit c28f0f8 — FOUND
- Commit 69fddef — FOUND
