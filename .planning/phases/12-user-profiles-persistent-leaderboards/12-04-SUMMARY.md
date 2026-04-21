---
phase: 12-user-profiles-persistent-leaderboards
plan: "04"
subsystem: host-ui
tags: [avatar, player-card, podium, indicators, typescript]
dependency_graph:
  requires: [12-03]
  provides: [host-avatar-display]
  affects: [HostDashboard, PlayerCard, PlayerIndicators, PodiumScreen]
tech_stack:
  added: []
  patterns: [conditional-avatar-rendering, emoji-fallback]
key_files:
  created: []
  modified:
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
    - apps/web/components/ui/PlayerCard.tsx
    - apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx
    - apps/web/app/host/[roomCode]/game/PodiumScreen.tsx
decisions:
  - PlayerCard uses `avatarConfig != null` guard so existing callers passing no avatarConfig continue rendering the emoji fallback unchanged
  - PodiumScreen animation logic (containerVariants, itemVariants, VISUAL_ORDER, BAR_HEIGHTS, staggerDirection) left entirely untouched
metrics:
  duration: "~5 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  files_modified: 4
---

# Phase 12 Plan 04: Wire PlayerAvatar into Host-Side UI Summary

SVG avatar rendering wired into all four host-side display surfaces — lobby player cards, in-game player indicators, and final podium — with emoji fallback for backward compatibility.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Extend HostDashboard Player + LeaderboardEntry interfaces; import AvatarConfig type | ffea0a0 |
| 2 | Update PlayerCard, PlayerIndicators, PodiumScreen to render PlayerAvatar | ffea0a0 |

## Changes Made

### HostDashboard.tsx
- Added `import type { AvatarConfig } from '@/components/avatar/avatar-parts'`
- Added `avatarConfig?: AvatarConfig | null` to `Player` interface
- Added `avatarConfig?: AvatarConfig | null` to `LeaderboardEntry` interface
- Updated `<PlayerCard>` call to pass `avatarConfig={player.avatarConfig}`

### PlayerCard.tsx
- Added imports for `AvatarConfig` type and `PlayerAvatar` component
- Added `avatarConfig?: AvatarConfig | null` prop
- Renders `<PlayerAvatar config={avatarConfig} size={32} />` when avatarConfig is non-null, falls back to emoji span

### PlayerIndicators.tsx
- Added imports for `AvatarConfig` type and `PlayerAvatar` component
- Extended player array type with `avatarConfig?: AvatarConfig | null`
- Replaced `<span className="text-2xl">{player.emoji}</span>` with `<PlayerAvatar config={player.avatarConfig} size={40} />`

### PodiumScreen.tsx
- Added imports for `AvatarConfig` type and `PlayerAvatar` component
- Added `avatarConfig?: AvatarConfig | null` to `PodiumEntry` interface
- Replaced `<span className="text-6xl">{entry.emoji}</span>` with `<PlayerAvatar config={entry.avatarConfig} size={entry.rank === 1 ? 72 : 56} />`
- All animation logic preserved untouched

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. avatarConfig flows from socket `lobby:update` payload through to all display components. The server already includes avatarConfig in player objects (wired in 12-03).

## Threat Flags

None. PlayerAvatar renders only predefined SVG shapes via enum lookup — no raw string interpolation from avatarConfig values into SVG markup (T-12-04-01 mitigated). Null/undefined avatarConfig falls back to DEFAULT_AVATAR_CONFIG — no crash path (T-12-04-02 mitigated).

## Self-Check: PASSED

- apps/web/app/host/[roomCode]/HostDashboard.tsx — modified, commit ffea0a0 present
- apps/web/components/ui/PlayerCard.tsx — modified, commit ffea0a0 present
- apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx — modified, commit ffea0a0 present
- apps/web/app/host/[roomCode]/game/PodiumScreen.tsx — modified, commit ffea0a0 present
- TypeScript: zero errors
- PlayerAvatar import verified in all three component files
