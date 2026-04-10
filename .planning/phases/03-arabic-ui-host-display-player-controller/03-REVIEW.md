---
phase: 03-arabic-ui-host-display-player-controller
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - apps/server/src/game/game.service.ts
  - apps/server/src/game/game.types.ts
  - apps/server/src/socket/game.ts
  - apps/server/src/socket/index.ts
  - apps/server/prisma/schema.prisma
  - apps/web/app/host/[roomCode]/HostDashboard.tsx
  - apps/web/app/host/[roomCode]/game/HostPreGame.tsx
  - apps/web/app/host/[roomCode]/game/HostGameScreen.tsx
  - apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx
  - apps/web/app/host/[roomCode]/game/TimerDisplay.tsx
  - apps/web/app/host/[roomCode]/game/PlayerIndicators.tsx
  - apps/web/app/host/[roomCode]/game/HostInGameControls.tsx
  - apps/web/app/host/[roomCode]/game/LeaderboardOverlay.tsx
  - apps/web/app/host/[roomCode]/game/PodiumScreen.tsx
  - apps/web/app/join/[roomCode]/PlayerJoin.tsx
  - apps/web/app/join/[roomCode]/game/AnswerOptions.tsx
  - apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx
  - apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx
  - apps/web/app/join/[roomCode]/game/WaitingScreen.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: clean
---

# Phase 3: Code Review Report

**Reviewed:** 2026-04-10
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Phase 3 delivers a solid game engine with correct server-side scoring, proper duplicate-answer guards, and thorough host-only authorization on all control events. The RTL discipline is good — no physical `ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right` classes appear in any Phase 3 component; logical properties (`text-start`, `text-end`, `ms-`, `start-`, `end-`) are used consistently throughout. The security-critical path (elapsedMs computed server-side, answerIndex validated, correct answer kept server-side) is implemented correctly.

Two critical bugs were found: the "End Game early" button wires to the wrong socket event and will never trigger a podium screen for players, and the `handleReveal` function has a TOCTOU gap that can allow a double-reveal when auto-reveal and a manual reveal race. Four warnings cover logic gaps in phase guarding, an answer-index integer type assumption, an uncaught JSON.parse, and a stale timer on question reset. Three info items cover code quality.

---

## Critical Issues

### CR-01: "End Game" button emits `room:end` instead of `game:end` — podium never shown to players

**File:** `apps/web/app/host/[roomCode]/HostDashboard.tsx:194`

**Issue:** The host's "End Game" button (available during active gameplay via `HostInGameControls`) calls `handleEnd`, which emits `room:end`. The `room:end` handler in `socket/room.ts` updates room status and emits `game:ended` — it does NOT compute a leaderboard or emit `game:podium`. The `game:end` server event (which computes the podium and emits `game:podium`) is registered at `socket/game.ts:463` but is **never emitted by any client code**. As a result, pressing "End Game" during play moves the host to the `ended` status screen but players never see a podium — they are stuck on the answer/waiting screen until they close the tab.

**Fix:**

```typescript
// HostDashboard.tsx — split the two end-game paths:

// For lobby "end room" (before game starts) — keep emitting room:end
const handleLobbyEnd = useCallback(() => {
  getSocket().emit('room:end')
}, [])

// For in-game "end game early" — emit game:end so server computes podium
const handleGameEnd = useCallback(() => {
  getSocket().emit('game:end')
}, [])

// Then pass handleLobbyEnd to <HostControls> (lobby phase)
// and handleGameEnd to <HostInGameControls> (playing phase)
```

---

### CR-02: TOCTOU race — double-reveal possible when auto-reveal timer fires concurrently with manual `question:reveal`

**File:** `apps/server/src/socket/game.ts:115-134`

**Issue:** `handleReveal` reads game state, checks `phase === 'question'`, then sets `phase = 'reveal'` and writes back. These are not atomic. If the host manually triggers `question:reveal` at the same moment the auto-reveal `setTimeout` fires (both callbacks are in the Node.js microtask/macrotask queue), both can read `phase === 'question'` before either write completes, causing `question:revealed` to be emitted twice to the room. On slow Redis, the window is wide enough to hit this in production.

The `clearAutoRevealTimer` inside `handleReveal` (line 116) partially mitigates the auto→manual direction but not the manual→auto direction if the timer fires between the socket event arriving and the `clearTimeout` call.

**Fix:**

```typescript
async function handleReveal(io: Server, roomCode: string): Promise<void> {
  clearAutoRevealTimer(roomCode)          // cancel pending timer first

  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'question') return   // re-check after await

  // Optimistic phase flip — write before broadcasting to prevent a second reveal
  gameState.phase = 'reveal'
  await saveGameState(roomCode, gameState)

  // Re-read to confirm the write succeeded (optional but safer under Redis failover)
  const confirmed = await getGameState(roomCode)
  if (!confirmed || confirmed.phase !== 'reveal') return     // lost the race

  const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
  io.to(roomCode).emit('question:revealed', { ... })
}
```

For a single-process Node server this risk is low today, but should be addressed before horizontal scaling. At minimum, move `clearAutoRevealTimer` to the top of the `question:reveal` socket handler (before the `await handleReveal` call) so the timer is cancelled synchronously before the async path starts.

---

## Warnings

### WR-01: `leaderboard:show` and `question:next` lack a phase guard — callable at any game phase

**File:** `apps/server/src/socket/game.ts:362-388` and `apps/server/src/socket/game.ts:393-458`

**Issue:** `player:answer` correctly guards `gameState.phase !== 'question'` (line 291). `handleReveal` guards `gameState.phase !== 'question'` (line 119). But `leaderboard:show` has no phase check — a host can emit it during the `question` phase (before reveal) or during `ended`, which would expose leaderboard data mid-question and set `phase = 'leaderboard'` out of order. Similarly, `question:next` has no check to ensure the game is in `'reveal'` or `'leaderboard'` phase before advancing.

**Fix:**

```typescript
// leaderboard:show handler — add after gameState is fetched:
if (gameState.phase !== 'reveal' && gameState.phase !== 'leaderboard') {
  socket.emit('room:error', { message: 'Cannot show leaderboard at this game phase' })
  return
}

// question:next handler — add after gameState is fetched:
if (gameState.phase === 'ended') {
  socket.emit('room:error', { message: 'Game has already ended' })
  return
}
if (gameState.phase === 'question') {
  socket.emit('room:error', { message: 'Must reveal answer before advancing' })
  return
}
```

---

### WR-02: `answerIndex` is not validated as an integer — non-integer float indices silently pass

**File:** `apps/server/src/socket/game.ts:295`

**Issue:** The guard `answerIndex < 0 || answerIndex > 3` correctly bounds-checks the value, but does not verify it is an integer. A client sending `{ answerIndex: 0.5 }` or `{ answerIndex: 1.9 }` passes the range check. The comparison `answerIndex === questionData.correctIndex` (line 315) then evaluates to `false` (since `correctIndex` is always a DB integer), so a non-integer answer is always marked wrong — this is not a scoring exploit, but it is inconsistent input handling and could mask a buggy client or a confused player.

**Fix:**

```typescript
if (
  answerIndex === undefined ||
  !Number.isInteger(answerIndex) ||
  answerIndex < 0 ||
  answerIndex > 3
) {
  socket.emit('room:error', { message: 'Invalid answer index' })
  return
}
```

---

### WR-03: `getGameState` uses `JSON.parse` without a try/catch — corrupt Redis value crashes the handler

**File:** `apps/server/src/game/game.service.ts:83`

**Issue:** If the `gameState` field in Redis is corrupted (partial write, encoding issue, manual edits), `JSON.parse(raw)` will throw a `SyntaxError`. None of the callers catch this specifically — they catch the outer error in the socket handler try/catch and emit `room:error`, so the game is not fully broken. However, all subsequent events for that room will also fail until the Redis key is cleared, and the root cause (`JSON parse error`) is not logged distinctly.

**Fix:**

```typescript
export async function getGameState(roomCode: string): Promise<GameState | null> {
  const raw = await redis.hget(`room:${roomCode}`, 'gameState')
  if (!raw) return null
  try {
    return JSON.parse(raw) as GameState
  } catch {
    console.error(`[Game] Corrupt gameState for room ${roomCode} — clearing`)
    await redis.hdel(`room:${roomCode}`, 'gameState')
    return null
  }
}
```

---

### WR-04: `TimerDisplay` initialises `remaining` from `duration` prop, but `duration` updates don't reset the displayed time

**File:** `apps/web/app/host/[roomCode]/game/TimerDisplay.tsx:13`

**Issue:** `useState(duration)` captures the initial `duration` value. When `question:start` fires for a new question with a different `timerDuration`, React re-renders `TimerDisplay` with a new `duration` prop, but `remaining` state is NOT reset to the new `duration` — it keeps ticking from wherever it was. The `useEffect` (line 16) depends on `[active, duration, startedAt]`, so a new `startedAt` will restart the interval and the `tick` function will re-derive `remaining` correctly from `Date.now() - startedAt`, so in practice the display corrects itself within 100ms. However, the initial `useState(duration)` flash and the stale state between renders can briefly show the wrong value on question transitions.

**Fix:**

```typescript
// Add a useEffect to reset remaining when a new question starts:
useEffect(() => {
  setRemaining(duration)
}, [duration, startedAt])

// Or derive remaining purely from the interval and initialise to duration:
const [remaining, setRemaining] = useState(() => duration)
```

The simplest fix is to add `startedAt` to the reset effect so a new question reliably resets the display:

```typescript
useEffect(() => {
  setRemaining(duration)
}, [duration, startedAt])
```

---

## Info

### IN-01: `text-center` used on Arabic UI text nodes — should be `text-start` for RTL content

**File:** `apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx:67`, `apps/web/app/join/[roomCode]/PlayerJoin.tsx:204, 312, 330, 343`, `apps/web/app/join/[roomCode]/game/WaitingScreen.tsx:22`

**Issue:** Several places apply `text-center` to Arabic text blocks. `text-center` is layout-neutral (centers within the container) and not itself an RTL violation. However, several instances are centering short feedback messages that would read better with `text-start` to align with the natural RTL reading direction. The project spec says "Tailwind logical props only" — `text-center` is physical centering, not a directional prop, so this is a style preference call. The bigger concern is `QuestionDisplay.tsx:67` where option cards inside a 2x2 grid use `text-center` on the option text: in RTL this centers the Arabic characters within the box, which is visually acceptable but `text-start` would be more culturally natural for longer options.

**Fix:** No change required for layout-neutral centering. For option text inside answer cards, consider `text-start` as an improvement.

---

### IN-02: `PodiumScreen` passes `sorted` (all entries) to `m.div` but build `slots` is unused

**File:** `apps/web/app/host/[roomCode]/game/PodiumScreen.tsx:62-77`

**Issue:** `slots` is computed (line 62) to reorder entries in visual podium order [2nd, 1st, 3rd], but the motion container (line 77) iterates over `sorted` instead of `slots`. The result is that all three winners are rendered in rank order (1st, 2nd, 3rd) left-to-right rather than the classic podium visual order (2nd, 1st, 3rd). The `VISUAL_ORDER` constant and `slots` variable are dead code.

**Fix:**

```typescript
// Replace:
{sorted.map((entry) => { ... })}

// With:
{slots.map((entry) => { ... })}
```

This is a display bug but not a data correctness issue — scores and names are shown correctly, only the visual left-to-right order is wrong.

---

### IN-03: `leaderboard:show` does not guard against being called when game phase is already `leaderboard`

**File:** `apps/server/src/socket/game.ts:378`

**Issue:** If the host clicks "Show Leaderboard" twice in rapid succession, two `leaderboard:update` events are emitted to the room in quick succession. This is benign (both payloads are identical), but the double Redis write and double broadcast are unnecessary. After WR-01's phase guard is added, the second call will be silently ignored because phase will already be `leaderboard` — so this resolves itself as a side effect of fixing WR-01.

**Fix:** Addressed by WR-01 fix. No separate action required.

---

_Reviewed: 2026-04-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
