---
phase: 01-project-foundation-infrastructure
plan: "03"
subsystem: frontend
tags: [next.js, tailwind, cairo-font, rtl, socket.io-client, typescript]
dependency_graph:
  requires: [01-01]
  provides: [apps/web Next.js 14 app, Cairo RTL layout, socket.io-client singleton]
  affects: [all future frontend plans]
tech_stack:
  added: [next@14.2.35, react@18, react-dom@18, socket.io-client@4.8.3, tailwindcss@3.4.1, typescript@5]
  patterns: [Next.js App Router, Cairo next/font/google, Tailwind logical properties RTL, socket.io-client singleton]
key_files:
  created:
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/next.config.mjs
    - apps/web/tailwind.config.ts
    - apps/web/postcss.config.mjs
    - apps/web/app/layout.tsx
    - apps/web/app/globals.css
    - apps/web/app/page.tsx
    - apps/web/lib/socket.ts
    - apps/web/.env.local.example
    - apps/web/.gitignore
  modified: []
decisions:
  - "next.config.mjs used instead of next.config.ts — Next.js 14 does not support .ts config; that is a Next.js 15+ feature"
  - "Cairo font loaded via next/font/google with arabic+latin subsets and variable=--font-cairo; exposed on html element className"
  - "Tailwind content globs updated to app/**/*, components/**/*, lib/**/* — matches project structure from RESEARCH.md"
  - "Geist font files removed — scaffold artifacts unused after Cairo replacement"
  - "socket.io-client singleton uses getSocket() factory with lazy init, not top-level export, to avoid SSR import errors"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 0
---

# Phase 01 Plan 03: Next.js 14 Frontend Scaffold Summary

## One-liner

Next.js 14.2.35 frontend scaffolded with Cairo Arabic font via next/font/google, lang=ar dir=rtl root layout, Tailwind logical-properties-only RTL convention, and socket.io-client WebSocket-only singleton — build passes 0 errors.

## Next.js Version Confirmation

**Next.js 14.2.35** installed (not 15 or 16). Verified from `apps/web/package.json`:
```
"next": "14.2.35"
```

## Build Output

`npm run build` completed with **0 errors**:

```
▲ Next.js 14.2.35
✓ Compiled successfully
✓ Generating static pages (5/5)

Route (app)                              Size     First Load JS
┌ ○ /                                    138 B          87.3 kB
└ ○ /_not-found                          873 B          88.1 kB
```

## Tailwind Version

**tailwindcss@3.4.1** installed (from package.json devDependencies). Logical property support (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) is native in Tailwind v3.3+.

## RTL Configuration

| Check | Result |
|-------|--------|
| `<html lang="ar" dir="rtl">` | VERIFIED in `app/layout.tsx` |
| `cairo.variable` on `<html>` className | VERIFIED |
| Cairo subsets: arabic + latin | VERIFIED |
| Tailwind font-sans = var(--font-cairo) | VERIFIED |
| No directional classes in app/ | VERIFIED (grep returns 0 matches) |
| Landing page uses text-start, ps-, pe- | VERIFIED in `app/page.tsx` |

## Arabic RTL Rendering Description

The landing page (`app/page.tsx`) renders:
- Heading "شعللها" (Sha'lelha) — 4xl bold, `text-start` (right-aligned in RTL)
- Subtitle "أوقد المنافسة — منصة الألعاب الجماعية العربية" — text-start, gray-600
- Status box with `ps-6 pe-4 py-4` logical padding and Arabic Phase 1 status text

With `dir="rtl"` on the `<html>` element, Tailwind's `text-start` maps to `text-right` and `ps-` maps to `padding-right`, causing all Arabic text to flow correctly right-to-left.

## Socket.io Client Configuration

`apps/web/lib/socket.ts`:
- `transports: ['websocket']` — WebSocket only, no HTTP long-polling (required for Railway)
- `autoConnect: false` — explicit connection from Phase 2 components
- Reads `process.env.NEXT_PUBLIC_BACKEND_URL` — throws clear error if not set
- `'use client'` directive — prevents SSR import issues

## Cairo Font Issues

None. Cairo font with `subsets: ['arabic', 'latin']` loaded successfully via `next/font/google`. The CSS variable `--font-cairo` is injected via `className={cairo.variable}` on the `<html>` element and consumed by Tailwind's `font-sans` utility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] next.config.ts not supported in Next.js 14**
- **Found during:** Task 2 — first `npm run build` attempt
- **Issue:** Build error: "Configuring Next.js via 'next.config.ts' is not supported. Please replace the file with 'next.config.js' or 'next.config.mjs'." TypeScript config files for Next.js are a Next.js 15+ feature.
- **Fix:** Deleted `next.config.ts`, created `next.config.mjs` with identical `reactStrictMode: true` config using JSDoc type annotation
- **Files modified:** `apps/web/next.config.mjs` (created), `apps/web/next.config.ts` (deleted)
- **Commit:** 5ab3682

**2. [Rule 2 - Missing Critical Functionality] Removed unused Geist font files**
- **Found during:** Post-task git status check
- **Issue:** `app/fonts/GeistVF.woff` and `app/fonts/GeistMonoVF.woff` were scaffold artifacts left as untracked files after replacing the layout with Cairo font
- **Fix:** Deleted both font files (unused; no longer referenced in any layout or component)
- **Files modified:** `app/fonts/` directory removed
- **Commit:** 3fcc78d

## Known Stubs

- `apps/web/app/page.tsx` — Landing page shows "قيد الإنشاء — Phase 1 foundation" placeholder text. Intentional: Phase 2 plans will replace this with the game lobby UI.

## Threat Surface Scan

All mitigations from plan's threat_model are implemented:

| Threat ID | Component | Implementation |
|-----------|-----------|----------------|
| T-03-01 | NEXT_PUBLIC_BACKEND_URL in browser | Accepted — intentionally public Railway endpoint |
| T-03-02 | .env.local secrets | VERIFIED — `.env*.local` in `apps/web/.gitignore` |
| T-03-03 | Socket.io connect target | Accepted — build-time injected by Vercel pipeline |
| T-03-04 | Unhandled socket errors | VERIFIED — `autoConnect: false`; no connections established in Phase 1 |

No new threat surface beyond what the plan's threat model covers.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 603812c | feat | Task 1: scaffold Next.js 14.2.35, socket.io-client, .env.local.example |
| 5ab3682 | feat | Task 2: Cairo RTL layout, Tailwind config, socket singleton, globals.css, page.tsx |
| 3fcc78d | chore | Cleanup: favicon.ico committed, unused Geist font files removed |

## Self-Check

**Files verified (11/11):** All created files found on disk.

**Commits verified (3/3):** 603812c, 5ab3682, 3fcc78d all present in git log.

**Build verified:** `npm run build` exits 0 with 0 TypeScript or Next.js errors.

## Self-Check: PASSED
