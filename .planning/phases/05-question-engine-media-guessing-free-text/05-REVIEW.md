---
phase: 05-question-engine-media-guessing-free-text
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - apps/server/src/socket/game.ts
  - apps/server/src/game/game.service.ts
  - apps/server/src/game/game.types.ts
  - apps/server/prisma/schema.prisma
  - apps/web/app/host/[roomCode]/game/MediaQuestion.tsx
  - apps/web/app/host/[roomCode]/game/FreeTextFeed.tsx
  - apps/web/app/host/[roomCode]/game/VotingDisplay.tsx
  - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx
  - apps/web/app/host/[roomCode]/game/HostInGameControls.tsx
  - apps/web/app/host/[roomCode]/HostDashboard.tsx
  - apps/web/app/join/[roomCode]/game/FreeTextInput.tsx
  - apps/web/app/join/[roomCode]/game/VotingUI.tsx
  - apps/web/app/join/[roomCode]/PlayerJoin.tsx
  - apps/web/next.config.mjs
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-11
**Depth:** standard
**Files Reviewed:** 14 (note: `game.service.test.ts` did not exist on disk — marked as missing)
**Status:** issues_found

## Summary

The Phase 5 implementation covers free text answers, media guessing questions, and a voting phase. The server-side security posture is generally solid: vote deduplication, self-vote prevention, phase guards, and server-authoritative timers are all correctly in place. The threat model items T-05-09 through T-05-12 are properly addressed.

However, one critical XSS risk (T-05-08) is only half-mitigated — the server truncates the input but does not strip or encode HTML/script content before broadcasting it to the host's live feed. Since React's JSX escapes string renders by default, runtime XSS is unlikely under normal conditions, but the raw unescaped text is stored in Redis and rebroadcast verbatim; a non-React consumer or a future refactor could expose it. The absence of any sanitization library is a gap that should be closed.

Beyond the critical finding, five warnings cover: a redundant `votingTimers.delete` call after `clearVotingTimer` in `game:end`, the voting deadline being calculated client-side rather than echoed from the server (meaning clock skew can cause premature/late lock-out on the player UI), the `freetext:answer` rate-limit gap (T-05-15), a missing null-guard on `questionCache` when `handleReveal` is invoked for a non-FREE_TEXT question, and the missing test file.

---

## Critical Issues

### CR-01: Free text answer stored and broadcast without HTML sanitization (T-05-08)

**File:** `apps/server/src/socket/game.ts:630`

**Issue:** The `freetext:answer` handler slices the input to 80 characters and trims whitespace, but performs no HTML/script stripping before storing the text in Redis (`gameState.freeTextAnswers[playerId] = { text: trimmed, votes: [] }`) and broadcasting it to the entire room via `freetext:answers` and `freetext:lock`. A malicious player can submit a payload such as `<img src=x onerror=alert(1)>` or `<script>…</script>`. React JSX escapes string content by default so the current host/player UIs are not immediately exploitable, but:

1. The raw payload is persisted in Redis and re-emitted on `freetext:lock` — any current or future consumer that renders via `innerHTML`, `dangerouslySetInnerHTML`, or a non-React renderer will execute it.
2. The `FreeTextFeed` and `VotingDisplay` components render `{text}` directly inside JSX, which is safe today, but there is no defence-in-depth layer on the server that other developers can rely on.

**Fix:** Add server-side HTML entity encoding before storing. A minimal approach with no dependencies:

```typescript
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// In freetext:answer handler, replace:
const trimmed = text.trim().slice(0, 80)
// with:
const trimmed = escapeHtml(text.trim().slice(0, 80))
```

Alternatively, add the `he` or `sanitize-html` package and use `he.encode(trimmed)`. Either way, the sanitization must happen on the server before write-to-Redis, not on the client.

---

## Warnings

### WR-01: Redundant `votingTimers.delete` after `clearVotingTimer` in `game:end` handler

**File:** `apps/server/src/socket/game.ts:601`

**Issue:** The `game:end` handler calls `clearVotingTimer(roomCode)` on line 600, which already calls `votingTimers.delete(roomCode)` internally (line 72). Then on line 601, `votingTimers.delete(roomCode)` is called a second time. This is harmless today but creates misleading double-delete code that diverges from how every other handler cleans up timers. A future refactor that moves logic out of `clearVotingTimer` could re-introduce a leak if the caller relies on the double-delete as a backstop.

**Fix:** Remove the redundant explicit delete:
```typescript
// Remove line 601:
// votingTimers.delete(roomCode)   ← delete this line

clearAutoRevealTimer(roomCode)
clearVotingTimer(roomCode)         // already handles the Map.delete internally
questionCache.delete(roomCode)
```

---

### WR-02: Voting deadline calculated client-side — clock skew causes premature or late timer expiry (T-05-12 partial)

**File:** `apps/web/app/host/[roomCode]/HostDashboard.tsx:146` and `apps/web/app/join/[roomCode]/PlayerJoin.tsx:147`

**Issue:** When the server emits `freetext:lock`, neither the host dashboard nor the player join UI use the authoritative deadline. Both calculate their local deadline as `Date.now() + 15_000`. The server computes `gameState.votingDeadline = Date.now() + 15_000` (game.ts:144) and stores it in Redis, but **does not include `votingDeadline` in the `freetext:lock` payload** (game.ts:155). As a result, a client whose system clock is ahead will show the timer expiring before voting actually closes on the server; a client whose clock is behind will allow voting button clicks after the server has already resolved the vote. The visual timer is cosmetic, but the gap makes the countdown bar misleading.

**Fix:** Include `votingDeadline` in the `freetext:lock` broadcast and consume it on the client:

```typescript
// game.ts — startVotingPhase, replace:
io.to(roomCode).emit('freetext:lock', { answers })
// with:
io.to(roomCode).emit('freetext:lock', { answers, votingDeadline: gameState.votingDeadline })
```

```typescript
// HostDashboard.tsx — replace:
setVotingDeadline(Date.now() + 15_000)
// with:
setVotingDeadline(answers.votingDeadline ?? Date.now() + 15_000)

// PlayerJoin.tsx — same change for the freetext:lock listener
```

---

### WR-03: No rate limiting on `freetext:answer` — answer flood / DoS (T-05-15)

**File:** `apps/server/src/socket/game.ts:615`

**Issue:** The `freetext:answer` handler correctly rejects a second answer from the same player (line 637: `if (gameState.freeTextAnswers?.[playerId]) return`). However, a client can still spam the handler with many messages before the first one is processed and written back to Redis — because `getGameState` and `saveGameState` are async, a burst of rapid messages from one player will all pass the dedup check before any of them commits. Each call triggers a Redis read, a Redis write, a `getRoom` call, and a room-wide broadcast. Under a race, two answers from the same player can be stored.

**Fix 1 (short term):** Add a per-socket in-memory lock to reject duplicate emissions before the async path completes:

```typescript
// Module level
const freeTextLocks = new Set<string>() // `${roomCode}:${playerId}`

// In handler, after validating playerId:
const lockKey = `${roomCode}:${playerId}`
if (freeTextLocks.has(lockKey)) return
freeTextLocks.add(lockKey)
try {
  // ... existing logic ...
} finally {
  freeTextLocks.delete(lockKey)
}
```

**Fix 2 (better, long term):** Use a Redis atomic HSETNX to set the answer only if no entry for that player exists, eliminating the TOCTOU race entirely.

---

### WR-04: `handleReveal` silently proceeds with `correctIndex: 0` when question is not found in cache

**File:** `apps/server/src/socket/game.ts:233-240`

**Issue:** In `handleReveal`, if `questionCache.get(roomCode)?.[gameState.currentQuestionIndex]` is `undefined` (e.g., cache was evicted for a room that somehow reconnected), the code falls through to the non-FREE_TEXT reveal path. It then calls `io.to(roomCode).emit('question:revealed', { correctAnswerIndex: questionData?.correctIndex ?? 0, ... })`. Broadcasting `correctIndex: 0` when no data exists silently marks the first option as correct and awards streaks incorrectly — this is a silent data-corruption bug.

**Fix:** Guard the undefined case and emit an error instead of a fallback:

```typescript
if (!questionData) {
  socket.emit('room:error', { message: 'Question data not found in cache' })
  return
}
// Then use questionData.correctIndex directly (no nullish fallback needed)
io.to(roomCode).emit('question:revealed', {
  correctAnswerIndex: questionData.correctIndex,
  ...
})
```

---

### WR-05: `game.service.test.ts` is absent — calculateFreeTextScore has no test coverage

**File:** `apps/server/src/game/game.service.test.ts` (missing)

**Issue:** The plan and the file list both reference `game.service.test.ts`, but the file does not exist on disk. `calculateFreeTextScore` is the core scoring logic for the voting phase — it handles tie-breaking, voter bonuses, and the zero-votes edge case. With no tests, regressions in scoring rules (D-09) will be invisible until observed in a live game. This is especially risky given the function handles money-equivalent game points.

**Fix:** Create the test file. Minimum cases to cover:
- Zero answers input → all scores 0, winnerIds empty
- Single answer, zero votes → no winner
- Single answer, one vote → author gets 800, voter gets 200
- Tie (two answers, equal votes) → both authors get 800, both sets of voters get 200
- Voter voted for non-winning answer → voter score 0

---

## Info

### IN-01: `isAudioUrl` detects format by file extension only — Cloudinary transformation URLs will misclassify

**File:** `apps/web/app/host/[roomCode]/game/MediaQuestion.tsx:13-20`

**Issue:** `isAudioUrl` strips query strings and checks the suffix of the pathname. Cloudinary transformation URLs often look like `https://res.cloudinary.com/.../video/upload/f_mp3/v1/.../clip.mp4` — the underlying resource is an audio track but the path ends in `.mp4`, so it will be rendered as an image. Conversely, a video asset with `?format=mp3` appended would be treated as audio. The detection is fragile for any non-trivial Cloudinary usage.

**Fix:** Consider using a `type` field on the question record (e.g., `mediaType: 'image' | 'audio'`) persisted in the DB rather than inferring it from the URL. Short-term, also check `.mp4` and `.webm` as video (not audio) to reduce misclassification risk.

---

### IN-02: `game:end` handler emits `game:podium` but the room-cleanup path doesn't emit `game:ended`

**File:** `apps/server/src/socket/game.ts:604`

**Issue:** When the host manually ends the game early, `game:podium` is emitted (line 604) but `game:ended` is never emitted. The player-side `PlayerJoin.tsx` listens for `game:ended` (line 115) to transition to the ended screen. Players will see the podium event and transition via `game:podium` listener (line 175 in PlayerJoin.tsx), but the `game:ended` listener registered at line 115 is never triggered, leaving a dead code path. The normal end-of-game path (question:next when exhausted) has the same behaviour. Not a crash but indicates the `game:ended` event is dead.

**Fix:** Either emit `game:ended` alongside `game:podium` in both end-of-game paths, or remove the `game:ended` listener from `PlayerJoin.tsx` since it is never fired.

---

### IN-03: `VotingDisplay` does not handle the multi-winner (tie) case

**File:** `apps/web/app/host/[roomCode]/game/VotingDisplay.tsx:43`

**Issue:** The winner highlight logic compares `winnerResult.winnerId === id` (a single ID). `calculateFreeTextScore` can return multiple winner IDs in `authorBonus` but `freetext:results` only forwards `winnerIds[0]` as `winnerId`. In a tie, only the first winner's card will be highlighted; other winners' cards will remain unstyled. This is a display inconsistency, not a crash.

**Fix:** Either pass the full `authorBonus` array from the server event to `VotingDisplay` and check `authorBonus.includes(id)`, or document that only one winner is highlighted in tie scenarios.

---

### IN-04: `HostDashboard` ignores `hostSettings` from `question:start` payload

**File:** `apps/web/app/host/[roomCode]/HostDashboard.tsx:112-138`

**Issue:** The `question:start` socket event payload includes `hostSettings` (typed in the destructure at line 118 as part of the event shape), but the handler does not call `setHostSettings(hostSettings)`. If the server restarts mid-game and host settings differ from client state, the host display layout, timer style, and reveal mode will be stale until the next `game:configured` event.

**Fix:** Consume the `hostSettings` field from `question:start`:
```typescript
socket.on('question:start', ({ question, questionIndex: qi, total, hostSettings: hs }) => {
  // existing state updates...
  if (hs) setHostSettings(hs)
})
```

---

_Reviewed: 2026-04-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
