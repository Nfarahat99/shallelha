---
phase: 05-question-engine-media-guessing-free-text
plan: 03
subsystem: free-text-game-loop
tags: [socket, free-text, voting, arabic-rtl, react, game-engine]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [freetext-answer-handler, freetext-vote-handler, startVotingPhase, resolveVoting, FreeTextFeed, VotingDisplay, FreeTextInput, VotingUI, full-free-text-game-loop]
  affects: []
tech_stack:
  added: []
  patterns: [server-managed-voting-timer, socket-broadcast-live-feed, RTL-Arabic-UI, logical-CSS-properties, Fisher-Yates-shuffle]
key_files:
  created:
    - apps/web/app/host/[roomCode]/game/FreeTextFeed.tsx
    - apps/web/app/host/[roomCode]/game/VotingDisplay.tsx
    - apps/web/app/join/[roomCode]/game/FreeTextInput.tsx
    - apps/web/app/join/[roomCode]/game/VotingUI.tsx
  modified:
    - apps/server/src/socket/game.ts
    - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx
    - apps/web/app/host/[roomCode]/game/HostInGameControls.tsx
    - apps/web/app/host/[roomCode]/HostDashboard.tsx
    - apps/web/app/join/[roomCode]/PlayerJoin.tsx
decisions:
  - "handleLockFreeText reuses question:reveal emit — server routes FREE_TEXT questions to startVotingPhase so no new socket event needed (T-05-15: requireHost guard already in place)"
  - "PlayerJoin FREE_TEXT flow uses early-return branches per playerPhase rather than nested conditionals — cleaner state machine"
  - "VotingUI countdown bar uses totalDuration=15_000 hardcoded (mirrors server timer) — avoids needing votingDeadline-minus-startTime calculation from server"
  - "freetext:results listener in PlayerJoin ignores score details — score display comes from existing myScore state updated by question:revealed on next question"
metrics:
  duration_seconds: 507
  completed_date: "2026-04-11"
  tasks_completed: 2
  files_modified: 9
---

# Phase 05 Plan 03: Free Text Game Loop Summary

One-liner: End-to-end free text question flow — server freetext:answer/vote handlers with 15s voting timer, live answer feed broadcast, host FreeTextFeed+VotingDisplay, player FreeTextInput+VotingUI, all wired into HostDashboard+QuestionDisplay+HostInGameControls+PlayerJoin state machines.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Server freetext handlers + voting timer + host/player frontend components | 286d820 | game.ts, FreeTextFeed.tsx, VotingDisplay.tsx, FreeTextInput.tsx, VotingUI.tsx |
| 2 | Wire free text into HostDashboard, QuestionDisplay, HostInGameControls, PlayerJoin | f698eb1 | HostDashboard.tsx, QuestionDisplay.tsx, HostInGameControls.tsx, PlayerJoin.tsx |

## What Was Built

### Task 1: Server + New Components

**game.ts** — Added `calculateFreeTextScore` import. Added `votingTimers` Map and `clearVotingTimer` helper (mirrors `autoRevealTimers` pattern). Extended `sendQuestion()` to reset `freeTextAnswers={}`, `votingDeadline=undefined`, and `votedCurrentQ=false` for all players on each new question; calls `clearVotingTimer`. Added `startVotingPhase()` function — sets phase to 'voting', sets 15s deadline, shuffles answers (Fisher-Yates, T-05-13), emits `freetext:lock`, starts 15s auto-close timer. Added `resolveVoting()` — clears timer, calls `calculateFreeTextScore`, applies author/voter scores (no streak impact per D-09), sets phase to 'reveal', emits `freetext:results`. Modified `handleReveal()` to intercept FREE_TEXT questions and route to `startVotingPhase` instead of standard reveal. Added `freetext:answer` handler (phase check, type check, typeof+trim+slice(0,80) validation per T-05-08, dedup, stores answer, broadcasts live feed). Added `freetext:vote` handler (voting phase check per T-05-12, dedup per T-05-09, self-vote rejection per T-05-10, valid answerId check). Added `clearVotingTimer` in both `question:next` advancement and `game:end` paths (T-05-14).

**FreeTextFeed.tsx** — Scrollable live answer feed for host screen. `AnimatePresence` + `m.div` slide-in animation (`x: -20 → 0`); respects `useReducedMotion` (fade-only). Answer count indicator. Empty state "في انتظار إجابات اللاعبين…". RTL, Cairo font, logical CSS properties.

**VotingDisplay.tsx** — Host screen during voting phase. 15s countdown via `setInterval(100ms)` + `Math.ceil`. Answers list with winner highlight (`bg-yellow-400`) and "الإجابة الفائزة" badge. Zero-votes fallback message. RTL, Cairo font.

**FreeTextInput.tsx** — Player phone text entry. RTL `<textarea dir="rtl" lang="ar">` with `maxLength={80}`, character counter, Arabic placeholder. "أرسل" button with `min-h-[80px]` touch target, enabled only when `text.trim().length > 0`. No `ml-`/`mr-`/`pl-`/`pr-` — all logical properties.

**VotingUI.tsx** — Player voting screen. Decreasing progress bar (100ms tick). Scrollable answer cards: own answer locked (opacity-40, cursor-not-allowed), voted card gets ring-4 ring-indigo-500, other cards dim after vote. `onVote` called on tap; disabled after vote or time expiry. "انتهى التصويت" message on expiry. RTL, Cairo font.

### Task 2: Wiring

**HostDashboard.tsx** — Extended `GamePhase` with `'voting'`. Added state: `freeTextAnswers`, `votingAnswers`, `votingDeadline`, `freeTextWinner`. Added `freetext:answers` listener (updates live feed), `freetext:lock` listener (sets voting state + phase), `freetext:results` listener (sets winner + phase 'reveal'). Free text state reset in `question:start` listener. Added cleanup for 3 new listeners. Added `handleLockFreeText` callback (emits `question:reveal` — server routes FREE_TEXT to startVotingPhase). Added voting phase render arm with `VotingDisplay` + `HostInGameControls`. Passed `freeTextAnswers`, `onLockFreeText`, `currentQuestionType` to child components.

**QuestionDisplay.tsx** — Added `freeTextAnswers?` prop. Replaced FREE_TEXT placeholder with actual branch: question text + `<FreeTextFeed answers={freeTextAnswers ?? []} />`.

**HostInGameControls.tsx** — Extended `GamePhase` with `'voting'`. Added `onLockFreeText?` and `currentQuestionType?` props. During `question` phase + FREE_TEXT type: shows "اغلق الإجابات" button calling `onLockFreeText`. During `voting` phase: next/leaderboard buttons disabled (waiting for results). Standard MC behavior unchanged.

**PlayerJoin.tsx** — Extended `PlayerPhase` with `'voting'`. Added free text state: `freeTextSubmitted`, `submittedText`, `votingAnswers`, `votedAnswerId`, `votingDeadline`. Added `freetext:lock` listener (voting phase) and `freetext:results` listener (revealed phase). Free text state reset in `question:start`. Added `handleFreeTextSubmit` and `handleVote` callbacks with client-side dedup. Full FREE_TEXT branch: answering → `FreeTextInput` → waiting → `WaitingScreen` (submitted text) → voting → `VotingUI` → revealed → results text. MC/MEDIA_GUESSING path unchanged.

## Verification

- `cd apps/server && npx tsc --noEmit` — clean (0 errors)
- `cd apps/web && npx tsc --noEmit` — clean (0 errors)
- `cd apps/web && npx next build` — succeeded; all routes compiled including `/join/[roomCode]` and `/host/[roomCode]`
- `grep "freetext:answer" apps/server/src/socket/game.ts` — handler exists (line 615)
- `grep "freetext:vote" apps/server/src/socket/game.ts` — handler exists (line 658)
- `grep "startVotingPhase" apps/server/src/socket/game.ts` — function exists (line 139)
- `grep "resolveVoting" apps/server/src/socket/game.ts` — function exists (line 168)
- `grep "calculateFreeTextScore" apps/server/src/socket/game.ts` — imported (line 9) and used (line 175)
- `grep "FreeTextFeed" QuestionDisplay.tsx` — imported and rendered
- `grep "VotingDisplay" HostDashboard.tsx` — imported and rendered
- `grep "FreeTextInput" PlayerJoin.tsx` — imported and rendered

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all FREE_TEXT placeholders from Plan 02 have been replaced with functional implementations. The free text game loop is complete end-to-end.

## Threat Flags

None — all threat model mitigations applied:
- T-05-08: Server trims + slices to 80 chars, typeof check, empty string rejection; client maxLength={80}
- T-05-09: `votedCurrentQ` flag checked before accepting vote; client-side dedup in handleVote
- T-05-10: `answerId === playerId` check server-side; own card locked client-side
- T-05-11: `gameState.phase !== 'question'` check at freetext:answer entry
- T-05-12: `gameState.phase !== 'voting'` check at freetext:vote entry
- T-05-13: Fisher-Yates shuffle on answers array before freetext:lock broadcast
- T-05-14: clearVotingTimer in question:next, game:end, and sendQuestion
- T-05-15: Lock triggers via question:reveal which has requireHost() guard

## Self-Check: PASSED

All created files verified present. Both task commits (286d820, f698eb1) confirmed in git log. TypeScript clean on server and web. Next.js build succeeded.
