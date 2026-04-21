---
phase: 12-user-profiles-persistent-leaderboards
plan: "08"
subsystem: pwa-polish
tags: [pwa, service-worker, install-prompt, reconnect, offline]
dependency_graph:
  requires: [12-02]
  provides: [question-runtime-cache, a2hs-banner, ios-install-guide, reconnect-overlay]
  affects: [PodiumScreen, PlayerJoin, sw.ts]
tech_stack:
  added: [NetworkFirst (serwist), BeforeInstallPromptEvent]
  patterns: [service-worker-runtime-cache, pwa-install-prompt, socket-reconnect-ux]
key_files:
  created:
    - apps/web/components/pwa/A2HSBanner.tsx
    - apps/web/components/pwa/IOSInstallGuide.tsx
    - apps/web/components/pwa/ReconnectOverlay.tsx
  modified:
    - apps/web/app/sw.ts
    - apps/web/app/host/[roomCode]/game/PodiumScreen.tsx
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - NetworkFirst imported from 'serwist' (not '@serwist/next/worker') — serwist re-exports all Workbox strategies; @serwist/next/worker only exports defaultCache
  - ReconnectOverlay wired into PlayerJoin.tsx (not page.tsx) — socket event handlers live in PlayerJoin, not the page shell
  - ReconnectOverlay rendered at top of every playing/lobby render branch so it overlays correctly regardless of phase state
  - sw.ts kept with existing 'const sw = self as unknown as WorkerGlobalScope' pattern — not changed to 'declare const self: ServiceWorkerGlobalScope'
metrics:
  duration: "8m"
  completed: "2026-04-21T15:56:44Z"
  tasks_completed: 2
  files_modified: 6
---

# Phase 12 Plan 08: PWA Polish Summary

**One-liner:** NetworkFirst question cache + A2HS install banner + iOS share-sheet guide + socket reconnect overlay wired across all player phases.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create pwa/ components (A2HSBanner, IOSInstallGuide, ReconnectOverlay) | f879740 | 3 created |
| 2 | Extend sw.ts + wire A2HSBanner into PodiumScreen + wire ReconnectOverlay into PlayerJoin | 83cc610 | 3 modified |

## What Was Built

### A2HSBanner (`apps/web/components/pwa/A2HSBanner.tsx`)
- Listens for `beforeinstallprompt` browser event
- Guards against iOS (handled separately by IOSInstallGuide)
- 7-day localStorage cooldown (`shallelha_a2hs_dismissed`) prevents repeat prompts
- Arabic UI: "أضف شعللها لشاشتك" with install + dismiss buttons

### IOSInstallGuide (`apps/web/components/pwa/IOSInstallGuide.tsx`)
- Detects iOS Safari without standalone mode via `window.navigator.standalone`
- Same 7-day cooldown key shared with A2HSBanner
- 3-step Arabic guide: share icon → scroll → Add to Home Screen

### ReconnectOverlay (`apps/web/components/pwa/ReconnectOverlay.tsx`)
- Full-screen fixed overlay (`z-[100]`) with dark backdrop + blur
- Shows spinning animation + "جاري إعادة الاتصال..." Arabic text
- Returns null when `isConnected=true` (zero render cost when connected)

### sw.ts changes
- Imported `NetworkFirst` from `serwist`
- Added runtime cache rule: `/api/questions/*` → `NetworkFirst` with `cacheName: 'questions-cache'`, `networkTimeoutSeconds: 3`
- Rule placed BEFORE `...defaultCache` spread so it takes priority

### PodiumScreen.tsx
- Added imports for A2HSBanner + IOSInstallGuide
- Rendered below `</m.div>` (podium animation container) inside `<div className="px-4">`
- Animation logic (containerVariants, itemVariants, BAR_HEIGHTS, VISUAL_ORDER, staggerDirection) completely untouched

### PlayerJoin.tsx
- Added `isConnected` state (defaults `true`)
- Added `socket.on('connect', ...)` and `socket.on('disconnect', ...)` in lobby+game useEffect
- Added cleanup for both listeners in useEffect return
- `<ReconnectOverlay isConnected={isConnected} />` rendered at top of lobby phase and all 5 playing phase branches (voting, waiting-freetext, revealed-freetext, answering-freetext, MC/MEDIA_GUESSING)

## Deviations from Plan

### Context Adaptations (not deviations — per critical context note)

**1. sw.ts pattern kept as-is**
- Plan showed `declare const self: ServiceWorkerGlobalScope` but actual file uses `const sw = self as unknown as WorkerGlobalScope`
- Kept existing pattern per critical context instructions; only added NetworkFirst import + runtime cache rule

**2. ReconnectOverlay wired in PlayerJoin.tsx (not page.tsx)**
- Plan referenced `apps/web/app/join/[roomCode]/page.tsx` but socket handlers are in `PlayerJoin.tsx`
- Applied to correct file per critical context instructions

**3. NetworkFirst import from 'serwist' not '@serwist/next/worker'**
- Plan suggested checking exports; confirmed `NetworkFirst` is in `serwist` package (not the next/worker wrapper)
- Used correct import source

## Known Stubs

None — all features are fully wired with real logic.

## Threat Surface Scan

No new security-relevant surface introduced beyond the plan's threat model. The `/api/questions/*` NetworkFirst cache rule is same-origin only and contains no auth tokens or PII. The localStorage cooldown bypass (T-12-08-02) is accepted per the threat register.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| apps/web/components/pwa/A2HSBanner.tsx | FOUND |
| apps/web/components/pwa/IOSInstallGuide.tsx | FOUND |
| apps/web/components/pwa/ReconnectOverlay.tsx | FOUND |
| commit f879740 | FOUND |
| commit 83cc610 | FOUND |
