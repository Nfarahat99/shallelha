---
phase: 12
plan: "02"
subsystem: pwa-infrastructure
tags: [pwa, serwist, service-worker, manifest, icons, next-config]
dependency_graph:
  requires: []
  provides: [pwa-manifest, service-worker-entry, pwa-icons, next-config-serwist]
  affects: [apps/web/next.config.mjs, apps/web/app/manifest.ts, apps/web/app/sw.ts]
tech_stack:
  added: ["@serwist/next@9.5.7", "serwist@9.5.7", "sharp (dev)"]
  patterns: ["MetadataRoute.Manifest (Next.js file convention)", "Serwist precache + defaultCache", "withSerwist next.config wrapper"]
key_files:
  created:
    - apps/web/app/manifest.ts
    - apps/web/app/sw.ts
    - apps/web/public/icons/icon-192.png
    - apps/web/public/icons/icon-512.png
    - apps/web/scripts/generate-icons.mjs
    - apps/web/tests/pwa/manifest.test.ts
  modified:
    - apps/web/next.config.mjs
    - apps/web/.gitignore
    - apps/web/package.json
decisions:
  - "Used WorkerGlobalScope cast instead of ServiceWorkerGlobalScope — the latter is absent from dom lib in the app's tsconfig context; WorkerGlobalScope is augmented via declare global to carry __SW_MANIFEST"
  - "SW disabled in development (process.env.NODE_ENV === 'development') to prevent caching interference during dev"
  - "sharp installed as devDependency for icon generation; icons committed to git; sw.js excluded via .gitignore"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-21"
  tasks_completed: 3
  tasks_total: 3
  files_created: 6
  files_modified: 3
requirements:
  - AC-007-1
  - AC-007-2
  - AC-007-6
---

# Phase 12 Plan 02: PWA Infrastructure Summary

**One-liner:** @serwist/next@9.5.7 installed with manifest.ts, sw.ts entry point, and withSerwist next.config wrapper; purple-gradient Arabic "ش" icons generated at 192x512 via sharp.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install packages + generate icons | 6147f6a | package.json, icon-192.png, icon-512.png, .gitignore |
| 2 | manifest.ts + sw.ts + next.config.mjs | deca848 | manifest.ts, sw.ts, next.config.mjs |
| 3 | Wave 0 test stub | 2d6b0dd | tests/pwa/manifest.test.ts |

## What Was Built

- **`apps/web/app/manifest.ts`** — Next.js file-convention manifest route returning `MetadataRoute.Manifest` with name "شعللها", display "standalone", theme color #7c3aed, and two icon entries pointing to `/icons/icon-192.png` and `/icons/icon-512.png`.
- **`apps/web/app/sw.ts`** — Serwist service worker entry point wiring `self.__SW_MANIFEST` as precache entries, plus `defaultCache` for static assets. The `disable: process.env.NODE_ENV === 'development'` flag in next.config prevents SW registration during local dev.
- **`apps/web/next.config.mjs`** — Wrapped with `withSerwist({ swSrc: 'app/sw.ts', swDest: 'public/sw.js' })`. All existing config (reactStrictMode, images.remotePatterns) preserved.
- **`public/icons/icon-192.png` + `icon-512.png`** — Generated via sharp from inline SVG: dark-purple gradient background (#1a0a2e → #7c3aed) with rounded corners and centered Arabic letter "ش" in white. Script at `scripts/generate-icons.mjs` for future regeneration.
- **`apps/web/tests/pwa/manifest.test.ts`** — Three `test.todo` stubs (manifest fields, icon file references, SW registration). Full implementation deferred to 12-09 smoke tests.

## Verification Results

| Check | Result |
|-------|--------|
| `icon-192.png` and `icon-512.png` exist | PASS |
| `next.config.mjs` loads (`typeof m.default === 'object'`) | PASS |
| `npx tsc --noEmit` — no new errors | PASS |
| `@serwist/next` and `serwist` in package.json | PASS |
| `public/sw.js` in .gitignore | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: `ServiceWorkerGlobalScope` not found in tsconfig context**
- **Found during:** Task 2 — after writing sw.ts and running `npx tsc --noEmit`
- **Issue:** The plan's reference pattern used `declare const self: ServiceWorkerGlobalScope` which TS couldn't resolve in the app's tsconfig (`lib: ["dom", "dom.iterable", "esnext"]` — `ServiceWorkerGlobalScope` is not exposed there)
- **Fix:** Removed the `declare const self` line; instead cast `self as unknown as WorkerGlobalScope` where `WorkerGlobalScope` is the globally-augmented interface carrying `__SW_MANIFEST`. This is functionally equivalent and TS-clean.
- **Files modified:** `apps/web/app/sw.ts`
- **Commit:** deca848

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `test.todo` stubs x3 | `apps/web/tests/pwa/manifest.test.ts` | Full PWA smoke tests intentionally deferred to plan 12-09; stubs satisfy Wave 0 validation architecture requirement |

## Threat Surface Scan

Mitigations from threat model applied:
- **T-12-02-01** (SW cache poisoning): `defaultCache` from `@serwist/next/worker` serves only same-origin responses; no cross-origin cache directives added.
- **T-12-02-02** (Stale API caching): `disable: process.env.NODE_ENV === 'development'` prevents dev caching; production uses versioned precache via `__SW_MANIFEST`.

## Self-Check: PASSED

- `apps/web/app/manifest.ts` exists: FOUND
- `apps/web/app/sw.ts` exists: FOUND
- `apps/web/next.config.mjs` contains `withSerwist`: FOUND
- `apps/web/public/icons/icon-192.png` exists: FOUND
- `apps/web/public/icons/icon-512.png` exists: FOUND
- `apps/web/tests/pwa/manifest.test.ts` exists: FOUND
- Commit 6147f6a: FOUND
- Commit deca848: FOUND
- Commit 2d6b0dd: FOUND
