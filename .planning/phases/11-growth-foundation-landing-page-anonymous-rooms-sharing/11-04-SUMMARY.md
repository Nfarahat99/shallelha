---
plan: 11-04
status: complete
wave: 1
completed_at: 2026-04-19
phase: 11
subsystem: web-sharing
tags: [og-meta, social-preview, whatsapp, next-og, metadata]
key-files:
  modified:
    - apps/web/app/join/[roomCode]/page.tsx
  created:
    - apps/web/app/api/og/result/route.tsx
decisions:
  - Use next/og (built into Next.js 14) instead of @vercel/og — no extra package needed
  - Use Node.js runtime (default) instead of Edge — project has no existing edge usage
  - Rename route.ts to route.tsx — JSX requires .tsx extension for TypeScript
metrics:
  duration: ~8 minutes
  tasks_completed: 2
  files_changed: 2
---

# Phase 11 Plan 04: OG Meta Tags + Edge Route Summary

One-liner: Added WhatsApp/social link preview support via generateMetadata on the join page and a branded OG image route using next/og with Cairo Arabic font.

## What was done

Added `generateMetadata` to the `/join/[roomCode]` server component page for WhatsApp and social link previews. Created `/api/og/result` route handler using the built-in `next/og` `ImageResponse` to generate branded invite images.

## Files Modified

- `apps/web/app/join/[roomCode]/page.tsx` — added `generateMetadata` export with OpenGraph + Twitter card metadata pointing to the new OG image route
- `apps/web/app/api/og/result/route.tsx` (new) — Node.js runtime route handler generating branded images in two variants: WhatsApp (1200x1200) and Snapchat (1080x1920)

## OG Image Features

- Arabic text with Cairo font loaded from Google Fonts CDN
- Dark gradient background matching the app's design language (`#0a0a0f → #1a0a2e → #0d0a1e`)
- Room code displayed when provided, omitted gracefully when absent
- Purple CTA button (`#a78bfa`) with glass-effect border
- Input sanitization: roomCode stripped to alphanumeric, max 10 chars, uppercased
- Error fallback returns minimal branded image rather than 500

## Verification

- TypeScript: PASS (zero errors)
- generateMetadata export: present
- OG route created: apps/web/app/api/og/result/route.tsx
- Both variants (whatsapp 1200x1200, snapchat 1080x1920): implemented
- Commit: ed9c211

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Use `next/og` instead of `@vercel/og`**
- Found during: Task 2 (Mohammed / next-best-practices review)
- Issue: Plan specified `@vercel/og` and `npm install @vercel/og`, but `next/og` is built into Next.js — no extra package needed, and the skill explicitly warns against using `@vercel/og`
- Fix: Used `import { ImageResponse } from 'next/og'`, skipped npm install
- Files modified: apps/web/app/api/og/result/route.tsx

**2. [Rule 1 - Bug] Removed `export const runtime = 'edge'`**
- Found during: Task 2 (Mohammed / next-best-practices review)
- Issue: Plan specified Edge runtime, but project has zero existing edge routes and the skill warns to use Node.js default unless there is a specific latency requirement
- Fix: Removed the runtime export; route uses default Node.js runtime
- Files modified: apps/web/app/api/og/result/route.tsx

**3. [Rule 3 - Blocking] Renamed route.ts to route.tsx**
- Found during: TypeScript verification
- Issue: JSX syntax inside a `.ts` file causes TS1005 parse errors; TypeScript requires `.tsx` extension for JSX
- Fix: Renamed file to `route.tsx`
- Files modified: apps/web/app/api/og/result/route.tsx

**4. [Rule 1 - Bug] Used JSX syntax instead of object-tree syntax**
- Found during: Task 2 implementation
- Issue: Plan provided object-tree syntax (`{ type: 'div', props: { ... } }`) which is verbose and error-prone; `next/og` fully supports JSX syntax in `.tsx` files
- Fix: Rewrote using standard JSX syntax for cleaner, idiomatic code

## Self-Check: PASSED

- apps/web/app/join/[roomCode]/page.tsx: FOUND
- apps/web/app/api/og/result/route.tsx: FOUND
- commit ed9c211: FOUND
