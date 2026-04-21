---
phase: 12-user-profiles-persistent-leaderboards
plan: "05"
subsystem: leaderboard
tags: [api, leaderboard, prisma, queryRaw, rsc, rtl]
dependency_graph:
  requires: [12-01]
  provides: [leaderboard-api, leaderboard-page]
  affects: []
tech_stack:
  added: []
  patterns:
    - Prisma.$queryRaw with Prisma.sql tagged templates (SQL injection safe)
    - ROW_NUMBER() OVER window function for server-side ranking
    - bigint-to-Number conversion for JSON serialisation
    - useTransition for non-blocking period toggle
key_files:
  created:
    - apps/web/app/api/leaderboard/route.ts
    - apps/web/app/leaderboard/page.tsx
    - apps/web/app/leaderboard/LeaderboardClient.tsx
    - apps/web/tests/leaderboard/queries.test.ts
  modified: []
decisions:
  - "Used Prisma.$queryRaw with Prisma.sql tagged templates — never string concatenation — to guarantee parameterized SQL"
  - "bigint literals (0n) avoided in favour of Number() comparison to stay compatible with tsconfig target below ES2020"
  - "avatarEmoji used as avatar display fallback; avatarConfig passed through in API response for future PlayerAvatar wiring in 12-07"
  - "SSR fetch uses NEXT_PUBLIC_APP_URL env var for correct base URL in both dev and production"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-21T15:50:11Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 0
requirements:
  - AC-008-7
---

# Phase 12 Plan 05: Global Leaderboard API and Page Summary

**One-liner:** Public leaderboard with all-time and weekly rankings via Prisma $queryRaw aggregation + Arabic RTL RSC page with period toggle.

## What Was Built

### Task 1 — GET /api/leaderboard route
`apps/web/app/api/leaderboard/route.ts`

- `period` query param: `alltime` (default) or `weekly`; returns 400 for any other value
- `category` query param: sanitized with `/[^a-zA-Z0-9_-]/g` regex before use
- `getMondayUTC()` computes the ISO week Monday with `(dayOfWeek + 6) % 7` formula
- `prisma.$queryRaw` with `Prisma.sql` and `Prisma.empty` — zero string concatenation
- `ROW_NUMBER() OVER (ORDER BY wins DESC, gamesPlayed DESC)` window function
- FILTER (WHERE pgr."isWinner" = true) for per-group win count
- bigint fields (rank, wins, gamesPlayed) converted to `Number()` before JSON.stringify
- `winRate` computed as `round(wins/gamesPlayed * 1000) / 10` (one decimal)
- `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- `export const dynamic = 'force-dynamic'`

### Task 2 — /leaderboard page
`apps/web/app/leaderboard/page.tsx` (RSC)

- Arabic metadata: title `لوحة المتصدرين — شعللها`
- Server-side initial fetch with `next: { revalidate: 60 }`
- Uses `NEXT_PUBLIC_APP_URL` for SSR base URL
- `dir="rtl"` on main element; dark gradient: `from-gray-950 via-purple-950 to-gray-900`
- Wraps `LeaderboardClient` in `<Suspense>` with Arabic fallback text

`apps/web/app/leaderboard/LeaderboardClient.tsx` (client component)

- Period toggle: `كل الأوقات` / `هذا الأسبوع` with `aria-pressed`
- `useTransition` for non-blocking fetch on toggle change
- Medal rows: 🥇🥈🥉 for top 3 with distinct highlight styles
- Empty state: `لا توجد بيانات بعد`
- `avatarEmoji` displayed; `avatarConfig` available for future `PlayerAvatar` wiring

### Task 3 — Test stubs
`apps/web/tests/leaderboard/queries.test.ts` — 4 `test.todo` stubs covering the core scenarios; full implementation deferred to 12-09.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed BigInt literal `0n` for ES target compatibility**
- **Found during:** TypeScript compilation check after Task 1
- **Issue:** `row.gamesPlayed > 0n` caused `TS2737: BigInt literals are not available when targeting lower than ES2020`
- **Fix:** Replaced `row.gamesPlayed > 0n` with `Number(row.gamesPlayed) > 0` — functionally identical, no ES2020 requirement
- **Files modified:** `apps/web/app/api/leaderboard/route.ts` line 87
- **Commit:** 8f76639

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `apps/web/app/leaderboard/LeaderboardClient.tsx` | `avatarEmoji ?? '🎮'` | Full `PlayerAvatar` with `avatarConfig` wired in 12-07 |

The stub does NOT prevent the plan's goal: the leaderboard renders player names, win stats, and emoji avatars. The `avatarConfig` field is already in the API response, ready for 12-07.

## Threat Surface Scan

All mitigations from `<threat_model>` were implemented:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-12-05-01 | `period` validated to enum; `category` sanitized with regex; `Prisma.sql` tagged template used throughout |
| T-12-05-02 | Accepted — `userId` is non-secret cuid; `displayName` is user-chosen public name |
| T-12-05-03 | `LIMIT 50` on query; `Cache-Control: s-maxage=60` absorbs CDN load |

No new threat surface introduced beyond what the plan's threat model covers.

## Self-Check: PASSED
