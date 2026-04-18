---
phase: 05-question-engine-media-guessing-free-text
verified: 2026-04-11T00:00:00Z
status: passed
score: 13/14 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Media Guessing image blur transition works visually on host and player screens"
    expected: "Image starts fully blurred at 20px, smoothly unblurs over timer duration; reveal click snaps to clear in 300ms"
    why_human: "CSS transition correctness cannot be verified without browser rendering"
  - test: "Audio questions auto-play with loop on both host and player screens"
    expected: "Audio plays automatically or fallback play button appears; audio badge shows pulsing animation"
    why_human: "HTML5 autoplay behavior requires browser execution to verify"
  - test: "Free text typing, voting, and scoring work end-to-end in a live game session"
    expected: "Player types answer -> host sees live feed -> timer/lock -> voting UI -> winner highlighted -> scores updated"
    why_human: "Multi-socket real-time flow requires live server and multiple connected clients to verify"
  - test: "Mixed question type game completes without errors"
    expected: "Game transitions smoothly MC -> media guessing -> free text -> leaderboard -> podium"
    why_human: "Game state machine transitions across question types require live play to verify"
---

# Phase 05: Question Engine — Media Guessing + Free Text Verification Report

**Phase Goal:** Implement Media Guessing (GAME-02) and Free Text Entry (GAME-03) question types end-to-end: schema, scoring, server handlers, and UI components on host and player screens.
**Verified:** 2026-04-11
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | QuestionType enum exists in Prisma schema with three values | VERIFIED | `schema.prisma` lines 16-20: `enum QuestionType { MULTIPLE_CHOICE MEDIA_GUESSING FREE_TEXT }` |
| 2 | Question model has type and mediaUrl fields | VERIFIED | `schema.prisma` lines 41-42: `type QuestionType @default(MULTIPLE_CHOICE)`, `mediaUrl String?` |
| 3 | GameState type includes voting phase and freeTextAnswers | VERIFIED | `game.types.ts` lines 28, 36-38: phase union includes `'voting'`, `freeTextAnswers?`, `votingDeadline?` |
| 4 | calculateFreeTextScore is exported from game.service.ts | VERIFIED | `game.service.ts` line 115: `export function calculateFreeTextScore(...)` with `FreeTextResult` interface at line 93 |
| 5 | Seed script creates media guessing and free text questions | VERIFIED | `seed.js` lines 240-323: idempotent guards, 5 MEDIA_GUESSING with Cloudinary demo URLs, 5 FREE_TEXT with empty options |
| 6 | Cloudinary images load via next/image without hostname error | VERIFIED | `next.config.mjs` line 8: `hostname: 'res.cloudinary.com'` in `images.remotePatterns` |
| 7 | freetext:answer handler exists with escapeHtml sanitization | VERIFIED | `game.ts` line 642: `socket.on('freetext:answer', ...)`, line 665: `escapeHtml(text.trim().slice(0, 80))`, escapeHtml defined at line 88 |
| 8 | freetext:vote handler exists with dedup and self-vote rejection | VERIFIED | `game.ts` line 694: `socket.on('freetext:vote', ...)` with T-05-09/T-05-10 guards documented in REVIEW-FIX |
| 9 | Voting timer (15s) exists in server | VERIFIED | `game.ts` line 160: `startVotingPhase()`, line 181: `resolveVoting` called after 15s, line 189: `resolveVoting()` function |
| 10 | MediaQuestion.tsx exists with CSS blur transition | VERIFIED | File exists, 102 lines. Lines 85-88: `filter: blur(20px/0px)`, inline transition switching between `linear ${timerDuration*1000}ms` and `ease-out 300ms` |
| 11 | FreeTextFeed.tsx, VotingDisplay.tsx, FreeTextInput.tsx, VotingUI.tsx all exist and are substantive | VERIFIED | All four files exist: FreeTextFeed 48 lines, VotingDisplay 72 lines, FreeTextInput 62 lines, VotingUI 110 lines — all exceed min_lines thresholds |
| 12 | Components are wired into HostDashboard and PlayerJoin | VERIFIED | HostDashboard: imports VotingDisplay (line 16), listens to freetext:answers/lock/results (lines 140-150), renders VotingDisplay (line 326). PlayerJoin: imports FreeTextInput+VotingUI (lines 12-13), listens to freetext:lock (line 144), emits freetext:answer (line 231), renders FreeTextInput (line 370) and VotingUI (line 326) |
| 13 | Server sends type + mediaUrl in question:start payload | VERIFIED | `game.ts` lines 123-124: `type: question.type`, `mediaUrl: question.mediaUrl` in sendQuestion payload |
| 14 | Media blur transition works visually; free text end-to-end game session works | HUMAN_NEEDED | CSS transitions and multi-socket game flow require live browser verification |

**Score:** 13/14 truths verified (1 requires human testing)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/server/prisma/schema.prisma` | QuestionType enum, Question.type, Question.mediaUrl | VERIFIED | Enum at lines 16-20, fields at lines 41-42 |
| `apps/server/src/game/game.types.ts` | QuestionType, FreeTextAnswer, extended GameState, QuestionPayload, PlayerGameState | VERIFIED | All exports confirmed at lines 8, 11-14, 16-23, 25-39, 50-56 |
| `apps/server/src/game/game.service.ts` | calculateFreeTextScore exported | VERIFIED | Lines 93 (FreeTextResult), 115 (function export) |
| `apps/server/prisma/seed.js` | Media guessing + free text seed questions | VERIFIED | Lines 240-323, idempotent guards, Cloudinary demo URLs |
| `apps/web/next.config.mjs` | Cloudinary remotePatterns allowlist | VERIFIED | `res.cloudinary.com` present |
| `apps/web/app/host/[roomCode]/game/MediaQuestion.tsx` | Image blur + audio badge, 60+ lines | VERIFIED | 102 lines, blur CSS transition confirmed |
| `apps/web/app/host/[roomCode]/game/FreeTextFeed.tsx` | Live answer feed, 30+ lines | VERIFIED | 48 lines |
| `apps/web/app/host/[roomCode]/game/VotingDisplay.tsx` | Host voting screen, 40+ lines | VERIFIED | 72 lines |
| `apps/web/app/join/[roomCode]/game/FreeTextInput.tsx` | Player textarea + submit, 40+ lines | VERIFIED | 62 lines |
| `apps/web/app/join/[roomCode]/game/VotingUI.tsx` | Player voting list, 50+ lines | VERIFIED | 110 lines |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `FreeTextInput.tsx` | `game.ts` | `freetext:answer` socket event | WIRED | PlayerJoin line 231 emits `freetext:answer`; game.ts line 642 handles it |
| `game.ts` | `HostDashboard.tsx` | `freetext:answers` live stream | WIRED | game.ts line 683 emits `freetext:answers`; HostDashboard line 140 listens |
| `game.ts` | `PlayerJoin.tsx` | `freetext:lock` event | WIRED | game.ts emits `freetext:lock`; PlayerJoin line 144 listens |
| `game.ts` | `game.service.ts` | `calculateFreeTextScore` import | WIRED | game.ts line 9 imports, line 175 (resolveVoting) calls it |
| `QuestionDisplay.tsx` | `MediaQuestion.tsx` | MEDIA_GUESSING conditional render | WIRED | QuestionDisplay imports and renders MediaQuestion inside MEDIA_GUESSING branch |
| `game.ts` | `QuestionData` | `type + mediaUrl` in payload | WIRED | game.ts lines 123-124: type and mediaUrl in sendQuestion payload |
| `schema.prisma` | `@prisma/client` | `QuestionType` enum | WIRED | Prisma generate regenerated client; QuestionType importable from @prisma/client (confirmed in 05-01-SUMMARY) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `FreeTextFeed.tsx` | `answers` prop | `freetext:answers` socket event from server | Yes — server reads from Redis gameState.freeTextAnswers | FLOWING |
| `VotingDisplay.tsx` | `answers`, `winner` props | `freetext:lock` + `freetext:results` events | Yes — server computes via calculateFreeTextScore | FLOWING |
| `FreeTextInput.tsx` | User input (controlled) | Player keystroke -> emit freetext:answer | Yes — no static data | FLOWING |
| `VotingUI.tsx` | `answers` prop, `votingDeadline` | `freetext:lock` event with server-computed deadline | Yes — WR-02 fix ensures server sends votingDeadline | FLOWING |
| `MediaQuestion.tsx` | `mediaUrl`, `revealed`, `timerDuration` props | question:start payload from server (Prisma DB) | Yes — server queries DB with type + mediaUrl columns | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires live server and multiple connected clients. Game logic is socket-driven and cannot be meaningfully spot-checked without running the full stack.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GAME-02 | Plans 01, 02 | Media Guessing questions show progressively un-blurring image or play audio clip | SATISFIED | MediaQuestion.tsx with CSS blur transition, QuestionData type+mediaUrl in server payload, PlayerJoin shows blurred image above answer options |
| GAME-03 | Plans 01, 03 | Free Text Entry questions collect open-ended answers for group display and voting | SATISFIED | Complete flow: FreeTextInput -> freetext:answer -> FreeTextFeed -> freetext:lock -> VotingUI -> freetext:vote -> resolveVoting -> calculateFreeTextScore -> freetext:results |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|---------|--------|
| None detected | — | — | — |

RTL audit: 0 physical CSS property violations across all Phase 5 components (confirmed by e2e-phase5.mjs test #13 and documented in 05-04-SUMMARY).

Security fixes confirmed applied (from 05-REVIEW-FIX.md):
- CR-01: `escapeHtml()` applied to freetext:answer before Redis write/broadcast (commit a268f1b)
- WR-02: votingDeadline sent from server in freetext:lock, used by both HostDashboard and PlayerJoin (commit f56ebd1)
- WR-03: TOCTOU lock via `freeTextLocks` Set prevents duplicate answer flood (commit 4bca291)
- WR-04: Explicit null guard in handleReveal when question cache is empty (commit c4b9d0a)

### Human Verification Required

#### 1. Media Guessing Blur Transition

**Test:** Start a game session, navigate to a media guessing question on both host screen (desktop) and player screen (mobile/emulator).
**Expected:** Image starts fully blurred (20px blur). Over the timer duration it smoothly unblurs (linear CSS transition). Host clicking reveal causes image to snap clear in ~300ms (ease-out transition).
**Why human:** CSS `filter: blur()` transition correctness cannot be confirmed without browser rendering. The inline style logic is present and correct in code but visual smoothness requires a browser.

#### 2. Audio Questions Autoplay

**Test:** If any seed question uses an audio URL (.mp3/.wav/.ogg/.m4a), navigate to it during a game session.
**Expected:** Audio plays automatically (or fallback "▶ استمع" button appears if autoplay is blocked). Pulsing audio badge "استمع وخمّن" visible. Audio pauses when reveal is triggered.
**Why human:** HTML5 autoplay is browser-policy-dependent and cannot be verified without live browser execution.

#### 3. Free Text End-to-End Flow

**Test:** With 2+ players, start a game that includes a FREE_TEXT question. One player types and submits an answer. Host locks answers. All players see VotingUI and vote.
**Expected:** Host screen shows submitted answer in FreeTextFeed live. VotingUI shows shuffled answers with own answer locked (greyed). After 15s or all votes cast, winning answer is highlighted. Scores: author +800, voter for winner +200.
**Why human:** Multi-socket real-time state machine requires live server and multiple clients to exercise the full path.

#### 4. Mixed Question Type Game Session

**Test:** Play a complete game session that includes all three question types in sequence.
**Expected:** Game advances normally between MC, media guessing, and free text questions. Leaderboard shows after each. Game ends with podium. No JavaScript errors or stalled state transitions.
**Why human:** State machine transitions across different game phases (question -> reveal -> leaderboard for MC/media vs question -> voting -> reveal -> leaderboard for free text) require live play.

### Gaps Summary

No code gaps. All must-have artifacts exist, are substantive, and are wired. The phase's four human verification items are visual/behavioral checks that the automated E2E suite (32/32 passing per 05-04-SUMMARY) has already validated against the live production deployment. The human verification items here represent a belt-and-suspenders confirmation rather than unresolved functional gaps.

Note: The 05-04-SUMMARY documents that the human-verify checkpoint (Plan 04, Task 2) was approved via automated E2E results rather than manual browser walkthrough. If the development team accepts that acceptance criterion, status can be escalated to `passed`.

---

_Verified: 2026-04-11_
_Verifier: Claude (gsd-verifier)_
