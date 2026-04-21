---
phase: 12
plan: "01"
subsystem: database
tags: [prisma, schema, avatars, leaderboard, postgresql]
dependency_graph:
  requires: []
  provides: [avatar-config-schema, nullable-user-id, leaderboard-indexes]
  affects: [PlayerGameResult, User]
tech_stack:
  added: []
  patterns: [nullable-fk-with-setnull, json-column-for-flexible-data, composite-indexes]
key_files:
  modified:
    - apps/web/prisma/schema.prisma
decisions:
  - "Removed @@unique([gameSessionId, userId]) — PostgreSQL NULLs-are-distinct prevents unique enforcement on nullable userId; anonymous players would violate it"
  - "Used Json? (not a separate AvatarConfig model) for avatarConfig — flexible, schema-less storage suits evolving SVG avatar data"
  - "onDelete: SetNull on PlayerGameResult.user — deleting a User preserves game history as anonymous records rather than cascading delete"
metrics:
  duration: 8min
  completed_date: "2026-04-21T12:59:24Z"
  tasks: 1
  files_modified: 1
---

# Phase 12 Plan 01: Prisma Schema Extension for Avatar + Leaderboard Summary

**One-liner:** Extended Prisma schema with Json avatarConfig columns on User and PlayerGameResult, nullable userId FK with SetNull cascade, and two composite leaderboard performance indexes.

## What Was Done

Sami (nodejs-backend-patterns) reviewed the schema changes for correctness before implementation.

The following exact changes were applied to `apps/web/prisma/schema.prisma`:

1. **User model** — Added `avatarConfig Json?` after `avatarEmoji` to store structured SVG avatar builder configuration (colors, shape, accessories) without a rigid schema.

2. **PlayerGameResult model** — Five coordinated changes:
   - `userId String` → `userId String?` (nullable for anonymous players)
   - `user User @relation(..., onDelete: Cascade)` → `user User? @relation(..., onDelete: SetNull)` (preserve game history when user is deleted)
   - Added `avatarConfig Json?` after `playerEmoji` (anonymous players can have avatars without accounts)
   - Removed `@@unique([gameSessionId, userId])` — PostgreSQL's NULLs-are-distinct behavior means two rows with `userId = NULL` in the same game session would NOT violate this constraint, making it unreliable and misleading
   - Added `@@index([userId, createdAt])` for efficient leaderboard queries by user
   - Added `@@index([isWinner, createdAt])` for efficient winner history queries

## Files Modified

- `apps/web/prisma/schema.prisma` — commit `2f533a9`

## Verification Results

| Check | Result |
|-------|--------|
| `prisma validate` (with dummy DATABASE_URL) | PASSED — "The schema at prisma/schema.prisma is valid" |
| `prisma generate` types regenerated | PASSED — `index.d.ts` contains `avatarConfig` in both User and PlayerGameResult, `userId` typed as `StringNullableFilter` |
| `grep avatarConfig` in User model | FOUND at line 87 |
| `grep avatarConfig` in PlayerGameResult | FOUND at line 116 |
| `grep "userId String?"` in PlayerGameResult | FOUND at line 112 |
| `grep @@index` in PlayerGameResult | FOUND at lines 122-123 |
| `@@unique([gameSessionId, userId])` removed | CONFIRMED absent |

## Issues Encountered

**`prisma generate` binary DLL lock (Windows):** The `prisma generate` command failed with `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` due to a running Node.js process holding a file lock on the existing query engine binary. This is a Windows-only runtime issue — the TypeScript type generation (the critical part for compilation) completed successfully as confirmed by inspecting `node_modules/.prisma/client/index.d.ts`. The binary will be replaced automatically on next cold start or when the locking process exits.

**No migration needed:** This project uses `prisma db push` (not `prisma migrate dev`) per the established pattern in STATE.md decisions. No migrations folder exists. The schema changes will be applied via `prisma db push` at deploy time.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan is schema-only with no UI or data rendering.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced.

## Self-Check

- [x] `apps/web/prisma/schema.prisma` modified and verified
- [x] Commit `2f533a9` exists in git log
- [x] `prisma validate` passed
- [x] Prisma client types regenerated with all new fields present
