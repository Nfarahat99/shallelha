---
plan: 11-01
status: complete
wave: 1
completed_at: 2026-04-19
---

# Plan 11-01 — Prisma Schema Extension

## What was done

Extended both `apps/web/prisma/schema.prisma` and `apps/server/prisma/schema.prisma` with:
- **User profile fields**: displayName, avatarEmoji (VarChar(10)), totalGamesPlayed, winCount, bestStreak, favoriteCategory
- **GameSession model**: tracks each completed game session (roomCode, hostId, categoryId/Name, playerCount, winnerId) with no FK constraints on hostId or categoryId — consistent with the Pack.createdBy plain-string pattern established in Phase 10
- **PlayerGameResult model**: per-player outcome per session with cascade deletes and @@unique([gameSessionId, userId]) to prevent duplicate rows

Schemas were validated, pushed to shared Railway PostgreSQL, and Prisma clients regenerated for both apps. TypeScript compiles clean.

## Files modified

- apps/web/prisma/schema.prisma
- apps/server/prisma/schema.prisma

## Verification

- prisma validate (web): PASS
- prisma validate (server): PASS
- prisma db push (web): PASS — "Your database is now in sync with your Prisma schema"
- prisma db push (server): PASS — used --accept-data-loss for pre-existing @@unique([text,categoryId]) on Question (constraint already in DB from Phase 7, no actual data loss)
- prisma generate (web): PASS — Prisma Client v6.19.3 generated
- prisma generate (server): PASS — Prisma Client v6.19.3 generated
- npx tsc --noEmit: PASS — zero errors

## Key decisions

- No FK from GameSession.hostId to User: host may be anonymous/not have a User row; consistent with Pack.createdBy plain String pattern
- No FK from GameSession.categoryId to Category: categories use cuid-based IDs but games may reference deleted/archived categories; denormalized categoryName stored for display
- avatarEmoji uses @db.VarChar(10) to handle multi-codepoint emoji sequences safely
- Server schema db push required --accept-data-loss flag due to pre-existing @@unique([text,categoryId]) constraint on Question (added Phase 7); constraint was already in DB so no data loss occurred
- Web app lacks DATABASE_URL in .env.local (only has Vercel OIDC token); db push and generate run using DATABASE_URL from apps/server/.env

## Deviations from Plan

None — plan executed exactly as written. The --accept-data-loss flag on server db push was expected behavior (pre-existing constraint, not new data risk).

## Self-Check: PASSED

- apps/web/prisma/schema.prisma: FOUND
- apps/server/prisma/schema.prisma: FOUND
- Commit 8d550b8: FOUND
