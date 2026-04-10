---
phase: 03-arabic-ui-host-display-player-controller
plan: "05"
subsystem: host-game-ui-podium
tags: [react, nextjs, rtl, arabic, animation, motion, tailwind, game-ui, podium]
dependency_graph:
  requires:
    - 03-01 (game types, socket event shapes)
    - 03-02 (question:start, question:progress, question:revealed, leaderboard:update, game:podium socket events)
    - 03-04 (player-side UI for context — same socket events)
  provides:
    - apps/web/app/host/[roomCode]/game/PodiumScreen.tsx (staggered top-3 podium)
    - apps/web/app/host/[roomCode]/game/HostGameScreen.tsx (LazyMotion full-screen wrapper)
    - apps/web/app/host/[roomCode]/game/HostPreGame.tsx (pre-game settings picker)
    - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx (3-layout question renderer)
    - apps/web/app/host/[roomCode]/game/TimerDisplay.tsx (3-style timer)
    - apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx (answered emoji avatars)
    - apps/web/app/host/[roomCode]/game/HostInGameControls.tsx (reveal/next/leaderboard/end)
    - apps/web/app/host/[roomCode]/game/LeaderboardOverlay.tsx (slide-in leaderboard)
    - apps/web/app/host/[roomCode]/HostDashboard.tsx (full state machine)
  affects:
    - All host game screens — plan 03-03 content delivered here (03-03 was unexecuted)
tech_stack:
  added:
    - motion@12.38.0 (LazyMotion + domAnimation + motion/react-m for host game animations)
  patterns:
    - staggerChildren + staggerDirection:-1 for podium 3rd→2nd→1st reveal drama
    - LazyMotion + domAnimation for tree-shaken animation bundle
    - AnimatePresence for LeaderboardOverlay mount/unmount transitions
    - RTL scaleX timer depletion with transformOrigin:'right' (physical = inline-end in RTL)
    - useReducedMotion() hook — disables y translations, keeps opacity fades
    - Two-step inline end game confirm (no modal — host screen stays unobstructed)
    - hostSettings driven layout variant — 2x2/4-column/vertical mirrors player screen
key_files:
  created:
    - apps/web/app/host/[roomCode]/game/PodiumScreen.tsx
    - apps/web/app/host/[roomCode]/game/HostGameScreen.tsx
    - apps/web/app/host/[roomCode]/game/HostPreGame.tsx
    - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx
    - apps/web/app/host/[roomCode]/game/TimerDisplay.tsx
    - apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx
    - apps/web/app/host/[roomCode]/game/HostInGameControls.tsx
    - apps/web/app/host/[roomCode]/game/LeaderboardOverlay.tsx
  modified:
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
    - apps/web/tailwind.config.ts
    - apps/web/package.json
decisions:
  - "staggerDirection:-1 with render order [1st, 2nd, 3rd] — LAST child animates first, so 3rd place appears first, then 2nd, then 1st (maximum drama)"
  - "Classic podium visual layout: [2nd] [1st] [3rd] bar heights — implemented via VISUAL_ORDER index remapping"
  - "Plan 03-03 was never executed in this worktree — all host game components (HostPreGame, HostGameScreen, QuestionDisplay, TimerDisplay, PlayerIndicators, HostInGameControls, LeaderboardOverlay) built as part of this plan (Rule 3 deviation — blocking dependency)"
  - "Arabic font fallback chain: var(--font-cairo) → Geeza Pro → Arabic Typesetting → sans-serif — covers iOS Safari Cairo cache failure"
  - "useReducedMotion() used in PodiumScreen and QuestionDisplay — replaces y/scale with opacity-only transitions"
  - "TimerDisplay uses setInterval(100ms) rather than requestAnimationFrame for simplicity and consistency with PlayerTimerBar pattern from 03-04"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-10"
  tasks_completed: 2
  tasks_total: 2
  files_created: 8
  files_modified: 3
---

# Phase 03 Plan 05: Podium Screen & Host Game UI Summary

**One-liner:** PodiumScreen with staggered Motion entrance (3rd→2nd→1st), complete host game screen suite (7 new components), HostDashboard full state machine (lobby→pre-game→playing→podium), and Arabic iOS Safari font fallback chain.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create PodiumScreen, full host game screen suite, wire HostDashboard, update Tailwind | a7b8970 | 8 created, 3 modified |
| 2 (checkpoint) | Cross-browser smoke test | auto-approved | — |

## What Was Built

### PodiumScreen (`apps/web/app/host/[roomCode]/game/PodiumScreen.tsx`)
Final top-3 podium with staggered Motion entrance animation:
- `containerVariants`: `staggerChildren: 0.4, staggerDirection: -1`
- Render order `[1st, 2nd, 3rd]` + `staggerDirection:-1` = 3rd animates first, then 2nd, then 1st (maximum drama)
- Visual layout: `[2nd] [1st] [3rd]` via `VISUAL_ORDER = [1, 0, 2]` index remapping — classic Olympic podium arrangement
- Each entry: emoji (text-6xl), name (text-2xl font-bold), score (indigo-300 + "نقطة"), rank medal (🥇🥈🥉 at decreasing sizes)
- Podium bars: `h-40` (1st), `h-32` (2nd), `h-24` (3rd) — `bg-gray-800 rounded-t-2xl`
- `useReducedMotion()` — disables y translation, keeps opacity fade
- Edge case: `top3.length < 3` handled gracefully — only available players rendered

### HostGameScreen (`apps/web/app/host/[roomCode]/game/HostGameScreen.tsx`)
Full-screen landscape wrapper:
- `w-screen h-screen overflow-hidden bg-gray-950 flex flex-col`
- Top bar: room code display with `dir="ltr"` for numeric code within RTL context
- Wraps children in `<LazyMotion features={domAnimation}>` for tree-shaken ~4.6kb animation bundle

### HostPreGame (`apps/web/app/host/[roomCode]/game/HostPreGame.tsx`)
Pre-game settings screen:
- Layout picker (شبكة ٢×٢ / شريط أفقي / عمودي)
- Timer style picker (شريط / دائرة / رقم)
- Reveal mode toggle (تلقائي عند انتهاء الوقت / يدوي (أنت تتحكم))
- Selected state: `border-indigo-500 bg-indigo-950`; start button disabled when `playerCount === 0`
- Emits `HostSettings` object to caller on confirm

### QuestionDisplay (`apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx`)
Three layout variants with reveal animations:
- **2x2 grid**: `grid grid-cols-2 gap-4` with `min-h-[20vh]` cells — readable from across a room
- **4-column bar**: `flex flex-row gap-3` horizontal strip at bottom
- **Vertical stack**: question `w-2/3`, options `w-1/3 flex flex-col`
- Colors: A=red-500/white, B=blue-500/white, C=yellow-400/**text-gray-900** (contrast fix), D=green-500/white
- Arabic letter labels: أ ب ج د (accessibility — color not sole differentiator)
- Reveal: correct → `scale: 1.05` + "✓ إجابة صحيحة!"; wrong → `opacity: 0.3` (Motion animate, 300ms easeOut)
- `useReducedMotion()` — skips scale animations on accessibility preference

### TimerDisplay (`apps/web/app/host/[roomCode]/game/TimerDisplay.tsx`)
Three timer style variants:
- **bar**: full-width `h-3 bg-gray-800` with `scaleX` fill, `transformOrigin: 'right'` for RTL depletion
- **circle**: SVG with stroke-dashoffset animation, seconds text centered
- **number**: `absolute top-4 start-4` — `text-4xl font-bold text-white`
- `setInterval(100ms)` for progress updates; cleanup on unmount or `active === false`
- ARIA: `role="progressbar" aria-valuenow aria-valuemax aria-label="الوقت المتبقي"`

### PlayerIndicators (`apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx`)
Emoji avatar grid with live answer status:
- Answered: `ring-2 ring-indigo-400 bg-indigo-950`, `scale: 1.1`, `opacity: 1`
- Not answered: `bg-gray-800`, `scale: 1`, `opacity: 0.6`
- Spring animation: `stiffness: 400, damping: 20`
- `aria-label="{name} — أجاب"` when answered

### HostInGameControls (`apps/web/app/host/[roomCode]/game/HostInGameControls.tsx`)
Four action buttons:
- **اكشف الإجابة** (indigo-600) — active during `question` phase
- **التالي** (gray-700) — active during `reveal` or `leaderboard` phase
- **عرض النتائج** (gray-700) — active during `reveal` or `leaderboard` phase
- **إنهاء اللعبة** (red-600) — always active; 2-step inline confirm (no modal — host screen stays clear)
- Disabled state: `opacity-40 cursor-not-allowed`

### LeaderboardOverlay (`apps/web/app/host/[roomCode]/game/LeaderboardOverlay.tsx`)
Slide-in leaderboard panel:
- Motion: `x: '100%' → 0`, exit `x: 0 → '100%'` — spring 300/30
- Positioned `absolute inset-y-0 end-0 w-full max-w-sm` — RTL-safe (slides from left in RTL)
- Player rows: rank number, emoji, name (text-start, truncate), score (indigo-300 + "نقطة")
- Streak badge: "سلسلة ×1.5" (orange-500) when `streak >= 3`

### HostDashboard Extended State Machine
Full lobby→pre-game→playing→podium→ended state machine:
- Socket events wired: `game:started`, `game:configured`, `question:start`, `question:progress`, `question:revealed`, `leaderboard:update`, `game:podium`, `game:ended`
- Host emits: `game:configure`, `game:start`, `question:reveal`, `question:next`, `leaderboard:show`, `room:end`
- `answeredPlayerIds` built from `question:progress { answeredIds }` — `Set<string>` for O(1) lookup
- `AnimatePresence` wraps LeaderboardOverlay for mount/unmount transitions

### Tailwind Font Fallback (`apps/web/tailwind.config.ts`)
```typescript
sans: ['var(--font-cairo)', 'Geeza Pro', 'Arabic Typesetting', 'sans-serif']
```
- `Geeza Pro`: iOS/macOS system Arabic font — activates when Cairo fails to load (iOS Safari refresh cache bug)
- `Arabic Typesetting`: Windows system Arabic font — covers Windows desktop fallback
- Ensures Arabic text renders in a system Arabic font rather than falling back to Latin glyphs

## Verification

- `npm run build` — PASSED (exit 0)
- `grep "staggerChildren"` — PASSED
- `grep "staggerDirection.*-1"` — PASSED
- `grep "المتصدرون"` — PASSED
- `grep "🥇"` — PASSED
- `grep "PodiumScreen"` HostDashboard.tsx — PASSED
- `grep "Geeza Pro"` tailwind.config.ts — PASSED
- No `ml-/mr-/pl-/pr-/text-left/text-right` violations in any new file — PASSED

## RTL Smoke Test Checklist (Manual Steps)

Cross-browser verification cannot be automated. The following manual steps verify Arabic font rendering, RTL layout, and animations on target browsers:

### iOS Safari 16+ — Cairo font rendering
1. Open `/host/[roomCode]` on an iOS device (Safari 16+)
2. Join as a player from another device — join the room
3. Start a game — verify question text renders in Cairo (curved Arabic letterforms, not system fallback)
4. Hard-refresh the host page (to trigger Safari cache — Cairo may not reload) — verify "Geeza Pro" fallback renders Arabic text (not Latin squares)
5. Tap answer as a player — verify player emoji avatar lights up with indigo ring on host screen
6. Verify timer bar depletes from RIGHT edge toward LEFT (scaleX with transformOrigin: right)

### Android Chrome 110+ — RTL layout
1. Open `/join/[roomCode]` on Android Chrome 110+
2. Verify answer grid: A option at top-right, B at top-left (RTL flips grid start)
3. Verify timer bar at top of player screen depletes right-to-left
4. Submit an answer — verify waiting screen appears in Arabic (في انتظار اللاعبين…)
5. On host: tap "اكشف الإجابة" — verify correct answer highlights green on player phone
6. After game ends, verify podium entrance animation: 3rd place appears first, then 2nd, then 1st

### Desktop Chrome/Firefox — Full host screen
1. Open `/host/[roomCode]` in Chrome and Firefox
2. Verify host screen is full-screen (w-screen h-screen), no scroll
3. Verify leaderboard slides in from LEFT side (RTL — inline-end = left in RTL)
4. Verify podium player names are right-aligned (text-start in RTL)
5. Verify room code in top bar renders LTR (dir="ltr" attribute)
6. Verify timer bar variant depletes right-to-left in bar mode
7. Enable "Prefer reduced motion" in OS accessibility settings — verify animations are opacity-only (no y/scale)

### Cross-browser: Timer direction (scaleX RTL)
- Expected: `scaleX(progress)` with `transformOrigin: 'right'` shrinks the bar from the left side (right-anchored) — depletes right-to-left in Arabic (RTL) context
- Verify on: iOS Safari, Android Chrome, Desktop Chrome, Desktop Firefox

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 03-03 was never executed in this worktree**
- **Found during:** Task 1 — attempted to import HostGameScreen into HostDashboard, directory did not exist
- **Issue:** The `apps/web/app/host/[roomCode]/game/` directory was empty — all 7 host game screen components from plan 03-03 were missing. Plan 03-03 ran in a separate worktree that was not merged into this one before 03-04 was assigned here.
- **Fix:** Built all 7 missing components inline as part of this task (HostPreGame, HostGameScreen, QuestionDisplay, TimerDisplay, PlayerIndicators, HostInGameControls, LeaderboardOverlay) in addition to the plan-specified PodiumScreen
- **Files created:** All 8 game/ components
- **Commit:** a7b8970

**2. [Rule 2 - Missing] motion package not installed**
- **Found during:** Task 1 setup
- **Issue:** `motion` was not in `apps/web/package.json` — required for all animation components
- **Fix:** `npm install motion` → installed motion@12.38.0
- **Files modified:** apps/web/package.json, package-lock.json
- **Commit:** a7b8970

## Known Stubs

None — all components receive real data from socket events. No placeholder values flow to rendered UI.

## Threat Model Coverage

| Threat | Disposition | Notes |
|--------|-------------|-------|
| T-03-12 Information Disclosure (PodiumScreen) | accept | Top 3 scores are public game results — no sensitive data exposed |

## Threat Flags

None — this plan is UI-only (podium display + host game screen). No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/web/app/host/[roomCode]/game/PodiumScreen.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/HostGameScreen.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/HostPreGame.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/TimerDisplay.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/HostInGameControls.tsx | FOUND |
| apps/web/app/host/[roomCode]/game/LeaderboardOverlay.tsx | FOUND |
| apps/web/app/host/[roomCode]/HostDashboard.tsx (modified) | FOUND |
| apps/web/tailwind.config.ts (modified) | FOUND |
| commit a7b8970 (Task 1) | FOUND |
| npm run build exit 0 | PASSED |
