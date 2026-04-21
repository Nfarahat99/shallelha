---
phase: 12-user-profiles-persistent-leaderboards
plan: "07"
subsystem: profile-ui
tags: [avatar, og-image, profile, whatsapp-sharing]
dependency_graph:
  requires: [12-03, 12-05]
  provides: [avatar-in-profile, og-profile-card]
  affects: [apps/web/app/profile, apps/web/app/api/og/profile]
tech_stack:
  added: []
  patterns: [edge-og-image, server-action-json-field, uncontrolled-avatar-builder]
key_files:
  created:
    - apps/web/app/api/og/profile/route.tsx
  modified:
    - apps/web/app/profile/ProfileClient.tsx
    - apps/web/app/profile/actions.ts
decisions:
  - "page.tsx not modified — upsert with include returns all scalar fields (avatarConfig included automatically)"
  - "avatarEmoji state kept for backward-compat display but no longer sent on save"
  - "AvatarBuilder is uncontrolled (loads from localStorage); onConfirm callback updates parent avatarConfig state"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-21T16:04:24Z"
  tasks_completed: 2
  files_changed: 3
---

# Phase 12 Plan 07: Avatar Builder in Profile + OG Image Route Summary

SVG avatar system wired into profile page (PlayerAvatar in view mode, AvatarBuilder in edit mode) with a WhatsApp-shareable OG image card at `/api/og/profile?userId=X`.

## What Was Built

### Task 1: ProfileClient + actions.ts update
- **ProfileClient.tsx**: Removed `EmojiPicker`, imported `AvatarBuilder` and `PlayerAvatar`
- View mode now renders `<PlayerAvatar config={avatarConfig} size={96} />` instead of emoji span
- Edit mode now renders `<AvatarBuilder onConfirm={(c) => setAvatarConfig(c)} />` instead of EmojiPicker
- Added `avatarConfig` state (typed `AvatarConfig | null`, initialized from `user.avatarConfig`)
- `handleSave` passes `{ displayName, avatarConfig }` to `updateProfile`
- Added "مشاركة بطاقتي" share button linking to `/api/og/profile?userId=X`
- **actions.ts**: Updated `updateProfile` to accept `avatarConfig?: AvatarConfig | null`, saves it via Prisma as Json field

### Task 2: OG image route
- Created `apps/web/app/api/og/profile/route.tsx` with `runtime = 'edge'`
- Accepts `?userId=` query param, sanitized with `[^a-zA-Z0-9_-]` regex (T-12-07-03 mitigation)
- Fetches `displayName`, `totalGamesPlayed`, `winCount`, `bestStreak` from Prisma
- Renders 1200×630 card: app name + player name + win/game/win-rate stats in Cairo font
- Cache-Control: `public, max-age=300, stale-while-revalidate=3600`
- Returns 400 for missing userId, 404 for unknown user, 500 on generation error

## Deviations from Plan

### page.tsx not modified (intentional)
The plan mentioned adding `avatarConfig: true` to the Prisma `select` — but `page.tsx` uses `upsert` with `include`, not `select`. When using `include`, all scalar fields (including `avatarConfig`) are returned automatically by Prisma. No change was required.

## Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-12-07-02 | avatarConfig saved as-is JSON; AvatarBuilder only produces enum-constrained values |
| T-12-07-03 | userId sanitized with `/[^a-zA-Z0-9_-]/g` regex before Prisma query |

## Known Stubs

None — all data flows are wired. PlayerAvatar displays the saved avatarConfig from DB; OG route reads live stats from DB.

## Threat Flags

None — no new trust boundaries introduced beyond what is documented in the plan's threat model.

## Self-Check

- [x] `apps/web/app/profile/ProfileClient.tsx` — modified, verified AvatarBuilder + PlayerAvatar wired
- [x] `apps/web/app/profile/actions.ts` — modified, avatarConfig accepted and saved
- [x] `apps/web/app/api/og/profile/route.tsx` — created, edge runtime, GET exported
- [x] Commit `3c7de16` exists
- [x] TypeScript compiled without errors (clean output)
