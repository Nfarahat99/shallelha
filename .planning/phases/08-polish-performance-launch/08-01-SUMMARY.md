---
phase: 08
plan: 01
title: "Error Boundaries, Loading States & Process Resilience"
status: complete
subsystem: frontend-ux, server-resilience
tags: [error-handling, loading-states, accessibility, process-resilience, arabic-rtl]
dependency_graph:
  requires: []
  provides: [error-boundary, loading-skeletons, disconnect-banner, process-handlers]
  affects: [PlayerJoin, HostDashboard, server-index, socket-handlers]
tech_stack:
  added: []
  patterns: [Next.js error.tsx convention, prefers-reduced-motion, process.on resilience, socket disconnect timer cleanup]
key_files:
  created:
    - apps/web/app/error.tsx
    - apps/web/app/not-found.tsx
    - apps/web/app/join/loading.tsx
    - apps/web/app/join/[roomCode]/loading.tsx
    - apps/web/app/host/loading.tsx
    - apps/web/app/host/[roomCode]/loading.tsx
    - apps/web/components/ui/SkeletonCard.tsx
    - apps/web/components/ui/LoadingButton.tsx
    - apps/web/components/ui/ErrorBanner.tsx
    - apps/web/components/ui/DisconnectBanner.tsx
  modified:
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
    - apps/web/app/globals.css
    - apps/server/src/index.ts
    - apps/server/src/socket/index.ts
    - apps/server/src/socket/game.ts
decisions:
  - ErrorBanner maps server English message "Room is full" to full-room type; all other errors map to invalid-code
  - DisconnectBanner uses getSocket() singleton rather than a direct import — consistent with project socket pattern
  - clearAutoRevealTimer and clearVotingTimer exported from game.ts to enable cleanup from socket/index.ts disconnect handler
  - isJoining state set on socket.emit and cleared on both room:joined and room:error to prevent stuck loading state
metrics:
  duration: 25min
  completed: "2026-04-16"
  tasks: 5
  files: 16
---

# Phase 8 Plan 01: Error Boundaries, Loading States & Process Resilience Summary

**One-liner:** Arabic error boundaries, animate-pulse skeleton screens, socket disconnect banner, and process.on resilience handlers with host timer cleanup on disconnect.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Root error.tsx ('use client' Arabic panel) + not-found.tsx (404 page) | 1fc622f |
| 2 | 4 route-level loading.tsx skeleton screens (join, join/[roomCode], host, host/[roomCode]) | 631b5f6 |
| 3 | SkeletonCard, LoadingButton, ErrorBanner, DisconnectBanner components | c54cb30 |
| 4 | Integrate components into PlayerJoin.tsx and HostDashboard.tsx | a0a3ede |
| 5 | prefers-reduced-motion CSS, uncaughtException/unhandledRejection handlers, host timer cleanup | 5bf7e51 |

## Verification Results

- `cd apps/server && npm run test` — 71 tests pass (7 test files)
- `cd apps/web && npx next build` — build succeeded, all 18 routes compiled
- `find apps/web/app -name "loading.tsx" | wc -l` — 4
- `find apps/web/app -name "error.tsx" | wc -l` — 1
- `find apps/web/app -name "not-found.tsx" | wc -l` — 1
- `grep -c "uncaughtException" apps/server/src/index.ts` — 1
- `grep -c "prefers-reduced-motion" apps/web/app/globals.css` — 1
- `grep -c "ErrorBanner|LoadingButton|DisconnectBanner|SkeletonCard" apps/web/app/join/[roomCode]/PlayerJoin.tsx` — 10

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing cloudinary dependency in web app**
- **Found during:** Task 5 (Next.js build)
- **Issue:** `apps/web/node_modules/cloudinary` was missing despite being in package.json, causing webpack to fail with "Module not found: Can't resolve 'cloudinary'" on the admin upload route
- **Fix:** Ran `npm install` in `apps/web/` to restore the dependency
- **Files modified:** apps/web/node_modules (not committed — runtime only)
- **Commit:** N/A (build environment fix)

**2. [Rule 2 - Missing critical functionality] Export timer cleanup functions from game.ts**
- **Found during:** Task 5
- **Issue:** `clearAutoRevealTimer` and `clearVotingTimer` were private functions — the plan said to add `export` keyword but they were plain `function` declarations without it
- **Fix:** Added `export` to both function declarations in `socket/game.ts`
- **Files modified:** apps/server/src/socket/game.ts
- **Commit:** 5bf7e51

## Known Stubs

None. All components render from real state/events — no hardcoded placeholders.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. The process.on handlers and socket timer cleanup are defensive — they reduce attack surface rather than expanding it.

## Self-Check: PASSED

Files verified:
- apps/web/app/error.tsx — FOUND
- apps/web/app/not-found.tsx — FOUND
- apps/web/app/join/loading.tsx — FOUND
- apps/web/app/join/[roomCode]/loading.tsx — FOUND
- apps/web/app/host/loading.tsx — FOUND
- apps/web/app/host/[roomCode]/loading.tsx — FOUND
- apps/web/components/ui/SkeletonCard.tsx — FOUND
- apps/web/components/ui/LoadingButton.tsx — FOUND
- apps/web/components/ui/ErrorBanner.tsx — FOUND
- apps/web/components/ui/DisconnectBanner.tsx — FOUND

Commits verified: 1fc622f, 631b5f6, c54cb30, a0a3ede, 5bf7e51 — all present in git log.
