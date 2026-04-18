---
phase: 10-ugc-question-packs-shareable-cards
plan: "06"
subsystem: sharing
tags: [cards, satori, resvg, share-api, png-generation, post-game]
dependency_graph:
  requires: [10-01-PLAN.md]
  provides: [GET /cards/result, ResultCard component, post-game share screen]
  affects: [HostDashboard ended state]
tech_stack:
  added: [satori, "@resvg/resvg-js"]
  patterns: [satori object format (no JSX), Google Fonts CDN fetch with fallback, in-memory TTL cache, Web Share API with download fallback]
key_files:
  created:
    - apps/server/src/routes/cards.ts
    - apps/server/src/routes/__tests__/cards.test.ts
    - apps/web/app/host/[roomCode]/game/ResultCard.tsx
  modified:
    - apps/server/src/index.ts
    - apps/server/package.json
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
decisions:
  - "Fetch Cairo font from Google Fonts CDN at startup (TTF via no-UA request) rather than bundling a local copy — avoids binary asset in repo"
  - "Pinned Cairo v31 TTF URL with CSS API fallback for resilience against CDN URL changes"
  - "Use satori object format (not JSX) in Express — no JSX transpiler configured"
  - "In-memory Map cache with 1-hour TTL (per T-10-06-03 DoS mitigation) rather than Redis to avoid extra round-trips"
  - "Integrate ResultCard directly into HostDashboard ended branch — game state (leaderboard) is already present in socket state there"
metrics:
  duration: "~45 minutes"
  completed: "2026-04-18T09:28:00Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 4
---

# Phase 10 Plan 06: Shareable Result Cards Summary

**One-liner:** Server-side PNG card generation (satori + resvg, Snapchat 9:16 / WhatsApp 1:1) with Cairo Arabic font, in-memory caching, and a Web Share API post-game UI integrated into HostDashboard.

## What Was Built

### Task 1: Server-side card generation route (commit `493c869`)
- `GET /cards/result?gameId=&variant=snapchat|whatsapp` Express route
- Reads `room:${gameId}` from Redis, builds top-3 leaderboard from `playerStates.score`
- Renders PNG via satori (object format, not JSX) → Resvg rasterizer
- Cairo Arabic font fetched from Google Fonts CDN at first use, cached in module memory
- In-memory `Map<string, {buffer, expiresAt}>` cache with 1-hour TTL (T-10-06-03 mitigation)
- Rate limiter: 30 req/min (mirrors adminLimiter)
- 3 Vitest tests: valid gameId → 200 + image/png, missing gameId → 404, renderCard() snapchat → Buffer > 0
- All 3 tests pass

### Task 2: Post-game ResultCard UI (commit `fb49d76`)
- `ResultCard.tsx` ('use client') with variant pill tabs (snapchat / whatsapp)
- Image preview `<img>` points to `NEXT_PUBLIC_BACKEND_URL/cards/result?gameId=&variant=`
- Share button: Web Share API (`navigator.share({ files: [file] })`) with download fallback
- Download button always visible as secondary action
- Loading spinner overlay on image, Arabic error message on failure
- Integrated into `HostDashboard` `status === 'ended'` branch — replaces bare "انتهت اللعبة" text with full post-game screen showing top-3 leaderboard + ResultCard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong font URL format (woff2 vs TTF)**
- **Found during:** Task 1 font loading
- **Issue:** Original code used a pinned woff2 URL and a woff2-only regex fallback. Google Fonts CSS API (without browser User-Agent) returns TTF links, not woff2 — so both the primary URL and fallback regex failed to load Cairo.
- **Fix:** Discovered correct Cairo v31 TTF URL via `node -e` test against the CSS API. Updated primary URL to the TTF pinned URL and updated fallback regex from `/\.woff2/` to `/fonts\.gstatic\.com\/[^)]+/` (matches any format).
- **Files modified:** `apps/server/src/routes/cards.ts`
- **Commit:** `493c869`

**2. [Rule 1 - Bug] satori TypeScript type mismatch**
- **Found during:** Task 1 TypeScript compilation
- **Issue:** satori's type signature expects `ReactNode` but the custom `SatoriElement` type (object format) doesn't satisfy it.
- **Fix:** Cast to `any` at the satori call site — this is the documented workaround when not using React/JSX.
- **Files modified:** `apps/server/src/routes/cards.ts`
- **Commit:** `493c869`

## Known Stubs

None — leaderboard data is wired from live socket state (`leaderboard` array from `leaderboard:update` events in HostDashboard). The card image is fetched from the real Express endpoint using the live `roomCode`.

**Edge case:** If a game ends before any `leaderboard:update` event fires, `leaderboard` will be an empty array and the ResultCard will show 0 entries. This is an existing edge case in the game flow (podium data from `game:podium` could be used as fallback), not introduced by this plan.

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model. All T-10-06-* items addressed:
- T-10-06-01: accepted (roomCode as gameId, data expires, no PII)
- T-10-06-02: mitigated by design (satori renders to rasterized PNG — no SVG injected into browser)
- T-10-06-03: mitigated (rate limiter + in-memory cache)

## Self-Check: PASSED

Files created:
- `apps/server/src/routes/cards.ts` — exists
- `apps/server/src/routes/__tests__/cards.test.ts` — exists
- `apps/web/app/host/[roomCode]/game/ResultCard.tsx` — exists

Commits:
- `493c869` — feat(10-06): server-side card generation route
- `fb49d76` — feat(10-06): post-game ResultCard UI
