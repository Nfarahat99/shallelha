---
phase: 05-question-engine-media-guessing-free-text
plan: 02
subsystem: media-guessing-ui
tags: [socket, media, blur, audio, react, next-image, player-screen]
dependency_graph:
  requires: [05-01]
  provides: [MediaQuestion-component, MEDIA_GUESSING-game-loop, server-type-mediaUrl-payload]
  affects: [05-03]
tech_stack:
  added: []
  patterns: [pure-presentational-component, CSS-blur-transition, HTML5-audio-autoplay-fallback, RTL-Arabic-UI]
key_files:
  created:
    - apps/web/app/host/[roomCode]/game/MediaQuestion.tsx
  modified:
    - apps/server/src/socket/game.ts
    - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - "MediaQuestion is pure presentational (props-only) so it works in both host QuestionDisplay and player PlayerJoin without host-specific context"
  - "CSS blur transition uses inline style (not Tailwind) to allow dynamic duration from timerDuration prop"
  - "Audio autoplay detection uses 300ms timeout checking paused+currentTime rather than the error event (more reliable across Safari/Chrome)"
  - "FREE_TEXT rendered as placeholder in both QuestionDisplay and PlayerJoin — Plan 03 replaces these stubs"
metrics:
  duration_seconds: 420
  completed_date: "2026-04-11"
  tasks_completed: 2
  files_modified: 5
---

# Phase 05 Plan 02: Media Guessing UI Summary

One-liner: Server extended to emit type+mediaUrl in question:start payload; pure MediaQuestion component with CSS blur transition + HTML5 audio autoplay/fallback; QuestionDisplay MEDIA_GUESSING branch; host and player screens wired end-to-end.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Server game.ts extension + MediaQuestion component | 847b485 | game.ts, MediaQuestion.tsx |
| 2 | Wire QuestionDisplay + HostDashboard + PlayerJoin for media guessing | fb8df05 | QuestionDisplay.tsx, HostDashboard.tsx, PlayerJoin.tsx |

## What Was Built

### Task 1: Server Extension + MediaQuestion Component

**game.ts** — Extended `QuestionData` interface with `type` and `mediaUrl?` fields. Extended `sendQuestion()` to include `type` and `mediaUrl` in the `question:start` payload. Extended `prisma.question.findMany` select to fetch `type` and `mediaUrl` columns. Extended the question mapping to cast `q.type` and normalize `q.mediaUrl ?? undefined`.

**MediaQuestion.tsx** — Pure presentational component (no `useContext`, no provider dependencies) accepting `mediaUrl`, `revealed`, `timerDuration` props:
- `isAudioUrl()` helper detects `.mp3/.wav/.ogg/.m4a` extensions (lowercased, query params stripped)
- **Image path**: Wraps `next/image <Image>` in a div with inline `filter: blur(20px→0px)` + CSS transition that switches between `linear over timerDuration*1000ms` (during question) and `ease-out 300ms` (on reveal snap)
- **Audio path**: Hidden `<audio autoPlay loop>` element; 300ms timeout detects autoplay failure (checks `paused && !currentTime`); shows large 🎵 badge with `animate-pulse` (skipped when `useReducedMotion()`), Arabic "استمع وخمّن" text, and "▶ استمع" fallback button; `useEffect` pauses audio on reveal

### Task 2: Wiring

**QuestionDisplay.tsx** — Added `type?`, `mediaUrl?`, `timerDuration?` props. Added `MEDIA_GUESSING` branch: renders `MediaQuestion` in flex-1 top zone, question text as smaller hint below, then full MC-style options grid unchanged. Added `FREE_TEXT` placeholder branch (text-only, no options — Plan 03 replaces). MC/undefined falls through to original render path unchanged.

**HostDashboard.tsx** — Extended `CurrentQuestion` interface with `type?` and `mediaUrl?`. Passes `type`, `mediaUrl`, `timerDuration` to `<QuestionDisplay>` (the `question:start` socket listener already does `setCurrentQuestion(question)` so no listener changes needed).

**PlayerJoin.tsx** — Extended `currentQuestion` state type with `type?` and `mediaUrl?`. Extended `question:start` listener type annotation. Added `MediaQuestion` import from host game directory (safe — pure presentational). In the playing render: when `type === 'MEDIA_GUESSING'`, renders `<div className="h-[40vh]"><MediaQuestion ...></div>` above the existing `AnswerOptions`. When `type === 'FREE_TEXT'`, renders a placeholder "سيتم تفعيلها قريبا" (Plan 03 replaces). MC/undefined: unchanged.

## Verification

- `npx tsc --noEmit` (server) — clean (0 errors)
- `npx tsc --noEmit` (web) — clean (0 errors)
- `npx next build` — succeeded; all routes compiled
- `grep "MEDIA_GUESSING" QuestionDisplay.tsx` — branch exists (lines 15, 105, 106)
- `grep "MediaQuestion" QuestionDisplay.tsx` — imported and rendered (lines 5, 118)
- `grep "type:" game.ts` — sendQuestion includes type in payload (line 89)
- `grep "mediaUrl" game.ts` — sendQuestion includes mediaUrl in payload (line 90)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| FREE_TEXT placeholder (text only, no options) | QuestionDisplay.tsx | ~160 | Plan 03 will replace with FreeTextFeed component |
| FREE_TEXT placeholder ("سيتم تفعيلها قريبا") | PlayerJoin.tsx | ~303 | Plan 03 will replace with free text input UI |

These stubs do not prevent the plan's goal (media guessing) from working — they are intentional forward-compatibility placeholders.

## Threat Flags

None — all threat model mitigations applied:
- T-05-04: `mediaUrl` comes from DB (server-side); next.config.mjs remotePatterns already restricts to `res.cloudinary.com` (applied in Plan 01)
- T-05-05: `type` comes from Prisma DB — client cannot modify
- T-05-06: Audio loop paused on reveal, no network amplification risk
- T-05-07: `mediaUrl` is intentionally public question content

## Self-Check: PASSED
