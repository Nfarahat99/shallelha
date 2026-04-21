---
phase: 12-user-profiles-persistent-leaderboards
plan: "03"
subsystem: avatar
tags: [avatar, svg, tdd, socket, localStorage, player-identity]
dependency_graph:
  requires: [12-01]
  provides: [AvatarConfig, PlayerAvatar, AvatarBuilder, avatarConfig-socket-field]
  affects: [PlayerJoin, room:join, Player-interface, Redis-player-store]
tech_stack:
  added: [vitest, "@testing-library/react", jsdom, "@vitejs/plugin-react"]
  patterns: [TDD-red-green, inline-SVG-composition, localStorage-persistence, server-side-validation]
key_files:
  created:
    - apps/web/components/avatar/avatar-parts.ts
    - apps/web/components/avatar/PlayerAvatar.tsx
    - apps/web/components/avatar/AvatarBuilder.tsx
    - apps/server/src/room/avatar.types.ts
    - apps/web/tests/avatar/PlayerAvatar.test.tsx
    - apps/web/tests/avatar/AvatarBuilder.test.tsx
    - apps/web/vitest.config.ts
    - apps/web/tests/setup.ts
  modified:
    - apps/server/src/room/room.ts
    - apps/server/src/room/room.service.ts
    - apps/server/src/socket/room.ts
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
    - apps/web/package.json
key_decisions:
  - "avatar-parts.ts uses plain data objects (not JSX) so it remains a .ts file with no React transform needed"
  - "Server has its own avatar.types.ts so it does not depend on the web app module boundary"
  - "avatarConfig validated server-side (T-12-03-01) before Redis storage — invalid shapes silently become null"
  - "PlayerJoin advances to 'avatar' step on form submit, emits room:join only after AvatarBuilder confirms"
metrics:
  duration: "~30 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 8
  files_modified: 5
  tests_added: 22
  tests_passing: 22
requirements_completed: [AC-008-1, AC-008-2, AC-008-3, AC-008-6, AC-008-7]
---

# Phase 12 Plan 03: SVG Avatar System Summary

Gulf-themed composable SVG avatar system with TDD, localStorage persistence, server-side validation, and socket integration into the player join flow.

## What Was Built

### Task 1 — avatar-parts.ts + PlayerAvatar.tsx (TDD)

- `avatar-parts.ts`: Pure TypeScript data module — `AvatarConfig` interface, `PALETTES` (5 Gulf skin tones + accent colors), `FACE_SHAPES` (3 ellipse overlays), `HEADWEAR_PATHS` (ghutra / hijab / cap SVG paths), `AVATAR_STORAGE_KEY`
- `PlayerAvatar.tsx`: Stateless SVG renderer. Composes face circle, optional ellipse overlay, eye dots, and headwear path. Falls back to `DEFAULT_AVATAR_CONFIG` on null/undefined input. No raster images.
- 10 unit tests covering all props and edge cases — all passing

Also established vitest + @testing-library/react + jsdom testing infrastructure for `apps/web` (did not exist before).

### Task 2 — AvatarBuilder.tsx + Server + PlayerJoin (TDD)

- `AvatarBuilder.tsx`: `'use client'` interactive builder. Loads saved config from localStorage on mount. Shows face/headwear/palette selectors with Arabic labels (RTL layout). Live `PlayerAvatar` preview (size=96) updates as user picks. On confirm: saves to localStorage, calls `onConfirm(config)`.
- `avatar.types.ts` (server): Mirrors `AvatarConfig` for server use without web app dependency. Includes `validateAvatarConfig()` — rejects invalid enum values, returns null (T-12-03-01 threat mitigation).
- `room.ts`: `Player` interface gains optional `avatarConfig?: AvatarConfig | null`
- `room.service.ts`: `joinRoom()` accepts optional `avatarConfig` param, validates it, stores on the `newPlayer` object
- `socket/room.ts`: `room:join` handler accepts `avatarConfig?` in payload, passes to `joinRoom()`
- `PlayerJoin.tsx`: New `'avatar'` step added to `JoinPhase`. Form submit now advances to avatar step; `handleAvatarConfirm` emits `room:join` with `avatarConfig` included.
- 12 unit tests covering all AvatarBuilder behaviors — all passing

## Test Results

```
Test Files  2 passed (2)
Tests      22 passed (22)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vitest infrastructure missing from apps/web**
- **Found during:** Task 1 RED phase
- **Issue:** `apps/web/package.json` had no test runner — vitest, @testing-library/react, jsdom, @vitejs/plugin-react all absent
- **Fix:** Installed test deps, created `vitest.config.ts` (jsdom env, react plugin, `@` path alias) and `tests/setup.ts`
- **Files modified:** `apps/web/package.json`, `apps/web/vitest.config.ts`, `apps/web/tests/setup.ts`
- **Commits:** 4ef739b

**2. [Rule 2 - Security] Server-side avatarConfig validation added**
- **Found during:** Task 2, checking threat model T-12-03-01**
- **Issue:** Plan specified threat T-12-03-01 (avatarConfig tampering) required server-side validation. Plan action text mentioned validation but did not spell out the validator function.
- **Fix:** Added `validateAvatarConfig()` to `avatar.types.ts` — checks enum ranges for faceShape, headwear, colorPalette before storing in Redis. Invalid configs silently become null.
- **Files modified:** `apps/server/src/room/avatar.types.ts`, `apps/server/src/room/room.service.ts`

**3. [Rule 2 - UX] Avatar phase shows error + back-to-form on socket error**
- **Found during:** Task 2 PlayerJoin implementation
- **Issue:** If `room:join` fails after the avatar step (room full, etc.), the user was stuck on the avatar screen with no way back.
- **Fix:** `room:error` handler in `handleAvatarConfirm` sets `setPhase('form')` so the user returns to the name/emoji form where ErrorBanner displays.

## Known Stubs

None — all avatar data is wired end-to-end from builder through socket to Redis Player object.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model.

## Commits

| Hash | Description |
|------|-------------|
| 4ef739b | feat(12-03): TDD avatar types, PlayerAvatar SVG component, and vitest infrastructure |
| c8edcd1 | feat(12-03): AvatarBuilder component, server avatarConfig integration, PlayerJoin avatar step |

## Self-Check: PASSED

- `apps/web/components/avatar/avatar-parts.ts` — FOUND
- `apps/web/components/avatar/PlayerAvatar.tsx` — FOUND
- `apps/web/components/avatar/AvatarBuilder.tsx` — FOUND
- `apps/server/src/room/avatar.types.ts` — FOUND
- `apps/web/tests/avatar/PlayerAvatar.test.tsx` — FOUND
- `apps/web/tests/avatar/AvatarBuilder.test.tsx` — FOUND
- Commit 4ef739b — FOUND
- Commit c8edcd1 — FOUND
- 22/22 tests passing — CONFIRMED
