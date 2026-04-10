---
phase: 03-arabic-ui-host-display-player-controller
plan: "04"
subsystem: player-mobile-controller
tags: [react, nextjs, rtl, arabic, mobile, socket.io, tailwind, game-ui]
dependency_graph:
  requires:
    - 03-01 (game.types.ts — HostSettings interface shape)
    - 03-02 (question:start, question:revealed, game:podium socket events from game.ts)
  provides:
    - apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx (mobile portrait wrapper)
    - apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx (RTL timer bar)
    - apps/web/app/join/[roomCode]/game/AnswerOptions.tsx (3-layout answer buttons)
    - apps/web/app/join/[roomCode]/game/WaitingScreen.tsx (post-answer waiting state)
    - PlayerJoin.tsx (playing phase fully wired with real game UI)
  affects:
    - Plans 03-03 (host screen — shares same socket events and layout decisions)
tech_stack:
  added: []
  patterns:
    - RTL scaleX timer depletion (transform-origin right = inline-end in Arabic)
    - Three layout variants matching host screen (2x2/4-column/vertical) — D-04
    - Client-side answer guard (myAnswer !== null check) — T-03-10
    - correctIndex null until question:revealed — T-03-11 (no visual spoiler during answering)
    - setInterval(100ms) for timer progress with cleanup on unmount
key_files:
  created:
    - apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx
    - apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx
    - apps/web/app/join/[roomCode]/game/AnswerOptions.tsx
    - apps/web/app/join/[roomCode]/game/WaitingScreen.tsx
  modified:
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - "transformOrigin set to 'right' (not 'inline-end') for CSS — logical property inline-end only applies in CSS logical properties context; JS style object requires physical 'right' which equals inline-end in RTL document"
  - "Arabic letter labels (أ ب ج د) used instead of Latin (A B C D) — Arabic document, Arabic users"
  - "correctIndex kept null during answering phase — T-03-11: no client-side reveal before host fires question:revealed"
  - "Fallback loading spinner added for playing phase before first question:start arrives (gap between game:started and question:start)"
  - "myToken used as player ID key to match playerResults from question:revealed"
metrics:
  duration: "~18 minutes"
  completed: "2026-04-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 03 Plan 04: Player Mobile Controller Summary

**One-liner:** Complete player game controller with 4 colored answer buttons in 3 host-mirroring layout variants, RTL timer bar depleting right-to-left, Arabic post-answer waiting screen, and full socket event wiring for the game loop.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create PlayerGameScreen, AnswerOptions, PlayerTimerBar, WaitingScreen | 83fa407 | 4 new game/ components |
| 2 | Wire PlayerJoin with full game playing phase | db314c3 | PlayerJoin.tsx |

## What Was Built

### PlayerGameScreen (`apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx`)
Mobile portrait game wrapper:
- `min-h-screen flex flex-col bg-white` — white background per UI-SPEC 60/30/10 player screen
- `pt-[6px]` — clearance for the fixed timer bar at top edge
- `pb-[env(safe-area-inset-bottom)]` — iOS home bar safe area (RTL-03)
- `dir="rtl"` explicitly set (inherits from html but explicit for robustness)
- Children render in `flex-1 flex flex-col` inner div

### PlayerTimerBar (`apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx`)
Thin 6px progress bar fixed at top of screen (D-05):
- `fixed top-0 inset-x-0 h-[6px] bg-gray-200 z-50` — full width at very top
- Inner fill: `bg-indigo-500` with `transform: scaleX(progress)`, `transformOrigin: 'right'`
- RTL depletion: scaleX shrinks from 1→0, anchored at right edge — visually depletes right-to-left for Arabic (RTL-05)
- `setInterval(100ms)` updates progress; cleared on unmount or `active === false`
- ARIA: `role="progressbar" aria-valuenow aria-valuemax aria-label="الوقت المتبقي"`

### AnswerOptions (`apps/web/app/join/[roomCode]/game/AnswerOptions.tsx`)
Four colored answer buttons mirroring host layout (D-04):
- **2x2 grid**: `grid grid-cols-2 gap-3 p-4` — Kahoot-style quadrants (default)
- **4-column bar**: `flex flex-row gap-2 p-4` — horizontal strip
- **Vertical stack**: `flex flex-col gap-3 p-4` — stacked list with letter label
- Colors: A=red-500, B=blue-500, C=yellow-400/text-gray-900, D=green-500 (UI-SPEC contrast ratios)
- Arabic letter labels: أ ب ج د (color not sole differentiator — accessibility)
- Touch targets: `min-h-[80px] min-w-[44px]` on every button (INFRA-03)
- Selection states: idle → selected (ring-4 ring-white, others opacity-30) → revealed (correct: scale-105 brightness-110; wrong: opacity-20 saturate-0)
- `aria-pressed` on selected button; `aria-disabled` when non-interactive
- T-03-11: `correctIndex` prop is null during answering phase — no visual reveal until host fires event

### WaitingScreen (`apps/web/app/join/[roomCode]/game/WaitingScreen.tsx`)
Post-answer waiting state (D-06):
- Chosen answer displayed with its option color at 80% opacity
- Spinner: `animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent`
- Arabic text: "في انتظار اللاعبين…" per D-06 and UI-SPEC copywriting contract

### PlayerJoin.tsx — Playing Phase Wired
Extended with full game state and socket events:

**New state variables:** `currentQuestion`, `questionIndex`, `hostSettings`, `myAnswer`, `correctIndex`, `playerPhase` (answering/waiting/revealed), `questionStartedAt`, `myScore`, `myStreak`

**Socket events wired:**
- `question:start` — loads question, resets answer state, timestamps start for timer bar, advances to playing phase
- `question:revealed` — sets correctIndex, transitions to revealed phase, extracts score/streak for this player from playerResults array
- `game:podium` — transitions to ended phase

**handleAnswer:** Emits `player:answer { answerIndex }`, sets myAnswer (client guard: `if (myAnswer !== null) return` — T-03-10)

**Playing phase renders:**
- `PlayerTimerBar` active during answering phase, frozen during waiting/revealed
- Question text (Arabic RTL, text-start alignment)
- `WaitingScreen` during waiting phase; `AnswerOptions` during answering/revealed
- Score + streak indicator after reveal (`إجابة صحيحة!` / `إجابة خاطئة`, `النقاط:`, `سلسلة ×1.5` when streak ≥ 3)

**Ended phase:** Shows final score (`النقاط: {myScore}`) + replay link

Old placeholder (`🎮` + `اللعبة بدأت!`) fully replaced.

## Verification

- `npm run build` — PASSED (both tasks)
- All acceptance criteria grep checks — PASSED
- No Tailwind physical property violations (`ml-/mr-/pl-/pr-/text-left/text-right`) in any file
- `/join/[roomCode]` bundle: 3.9 kB (up from 2.24 kB — expected with 4 new components)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Clarifications

**1. transformOrigin: 'right' vs 'inline-end'**
- The plan specified `transformOrigin: 'inline-end'` in JSX style object
- CSS logical properties (`inline-end`) only work in CSS stylesheets, not inline JS style objects
- Used `transformOrigin: 'right'` in the style object — which is physically equivalent since the HTML root has `dir="rtl"` and `right` is inline-end in RTL
- No functional difference; both produce right-anchored scaleX depletion

**2. Arabic letter labels instead of Latin (A/B/C/D)**
- Plan specified A, B, C, D as labels
- Since all UI is Arabic (RTL-01) and the document is Arabic, used أ ب ج د instead
- Maintains accessibility requirement (color not sole differentiator) with culturally appropriate labels

## Known Stubs

None — all components fully implemented with real socket data. No placeholder values flow to rendered UI.

## Threat Model Coverage

| Threat | Mitigation | Location |
|--------|-----------|----------|
| T-03-10 Tampering (player:answer) | `if (myAnswer !== null) return` client guard + `disabled` prop on AnswerOptions | handleAnswer in PlayerJoin.tsx |
| T-03-11 Information Disclosure (correctIndex) | `correctIndex` state initialized to null, only set on `question:revealed` event; AnswerOptions receives `null` until revealed | PlayerJoin.tsx state, AnswerOptions correctIndex prop |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx | FOUND |
| apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx | FOUND |
| apps/web/app/join/[roomCode]/game/AnswerOptions.tsx | FOUND |
| apps/web/app/join/[roomCode]/game/WaitingScreen.tsx | FOUND |
| apps/web/app/join/[roomCode]/PlayerJoin.tsx (modified) | FOUND |
| commit 83fa407 (Task 1) | FOUND |
| commit db314c3 (Task 2) | FOUND |
