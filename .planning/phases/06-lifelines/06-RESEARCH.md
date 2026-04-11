# Phase 6: Lifelines — Research

**Researched:** 2026-04-11
**Domain:** Socket.io game state extension — per-player ephemeral lifeline mechanics with server-side enforcement
**Confidence:** HIGH

---

## Summary

Phase 6 adds three one-shot lifelines (Double Points, Remove Two, Freeze Opponent) to the existing real-time game loop. The architecture is already Redis-first: all mutable game state lives in `room:{code}` as a JSON blob under the `gameState` hash field, hydrated per socket event. Lifeline state fits naturally into this pattern — it belongs in `GameState` as per-player flags, not in PostgreSQL, because lifelines are ephemeral to a game session and require no cross-session persistence.

The existing `PlayerGameState` interface (`game.types.ts`) is the precise insertion point: add three boolean fields (`doublePointsUsed`, `removeTwoUsed`, `freezeOpponentUsed`) plus one per-question transient field (`doublePointsActiveCurrentQ`). The scoring function `calculateScore` in `game.service.ts` already accepts `streak` as a multiplier — adding a `doublePoints` boolean parameter follows the same signature pattern without structural change. The `player:answer` handler is the only place scoring is applied, so the Double Points multiplier intercept is localized.

Remove Two requires the server to select two wrong-answer indices and broadcast them: server picks indices from `[0,1,2,3]` minus `correctIndex`, shuffles the two remaining wrong indices, and returns them. This is deterministic and safe — the server owns the `correctIndex` from `questionCache`, which is already in-memory per room. Freeze Opponent is the most interaction-rich: a new socket event `lifeline:freeze_opponent` targets another player by their reconnect token ID; the server writes a `frozenCurrentQ` flag onto the target's `PlayerGameState`, and the `player:answer` handler already reads `playerStates[playerId]` before accepting answers — adding one guard is sufficient.

**Primary recommendation:** All lifeline state goes into `GameState.playerStates` (Redis) as boolean fields. No Prisma schema change needed. Three new server socket events + one server response event suffice. Frontend adds `LifelineBar.tsx`, `FreezeOpponentOverlay.tsx`, and extends `AnswerOptions.tsx` with `eliminatedIndices`. The UI spec (06-UI-SPEC.md) is already fully authored and approved.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIFE-01 | Each player receives one "Double Points" lifeline per game (2x points on next question) | `doublePointsUsed` + `doublePointsActiveCurrentQ` in `PlayerGameState`; `calculateScore` extended with multiplier flag |
| LIFE-02 | Each player receives one "Remove Two" lifeline per game (eliminates 2 wrong answers on multiple choice) | Server selects 2 wrong indices from `questionCache.correctIndex`; responds via `lifeline:remove_two_result` |
| LIFE-03 | Each player receives one "Freeze Opponent" lifeline per game (targets one player, blocks their answer for that question) | `frozenCurrentQ` flag on target `PlayerGameState`; guard in `player:answer` handler |
| LIFE-04 | Used lifelines are visually marked as spent on the player controller | `LifelineBar.tsx` reads three `*Used` booleans from parent state; spent = gray+opacity-50+disabled |
</phase_requirements>

---

## Standard Stack

No new npm packages are needed. [VERIFIED: codebase grep — all required capabilities already present]

### Core (already installed)
| Library | Version | Purpose | Why Used Here |
|---------|---------|---------|---------------|
| socket.io (server) | existing | New lifeline socket events | All game comms already on Socket.io |
| socket.io-client | existing | Frontend event emit/listen | Frontend already uses `getSocket()` singleton |
| ioredis | existing | Read/write `GameState` with lifeline fields | Pattern: `redis.hset('room:{code}', 'gameState', JSON.stringify(...))` |
| React (useState) | existing | Lifeline UI state (used flags, eliminatedIndices, overlay open) | PlayerJoin.tsx already uses this pattern |

### No New Dependencies
Remove Two needs no external randomisation library — `Math.random()` for picking wrong indices is sufficient given the low security stakes (entertainment, not gambling). [ASSUMED — no regulatory requirement found for this project]

---

## Architecture Patterns

### Where Lifeline State Lives: Redis GameState (not Prisma)

**Decision:** All lifeline state belongs in `GameState.playerStates` inside Redis.

**Evidence:** [VERIFIED: codebase read]
- `saveGameState` / `getGameState` in `game.service.ts` already serialize/deserialize the full `GameState` JSON blob to `room:{code}` hash.
- `PlayerGameState` already carries ephemeral per-question flags (`answeredCurrentQ`, `votedCurrentQ`). Lifeline flags follow the exact same pattern.
- Prisma schema has no session-scoped table structure. Adding a DB table for lifelines would require schema migration, a foreign-key join, and async reads per lifeline event — all unnecessary overhead.
- Game sessions are already destroyed at game end (`deleteGameState` / `questionCache.delete`), so ephemeral Redis state is cleaned up automatically.

**Type extensions required:**

```typescript
// apps/server/src/game/game.types.ts — PlayerGameState additions
export interface PlayerGameState {
  score: number
  streak: number
  answeredCurrentQ: boolean
  lastAnswerTime?: number
  votedCurrentQ?: boolean
  // --- Phase 6 additions ---
  doublePointsUsed: boolean        // permanent per-game spent flag
  removeTwoUsed: boolean           // permanent per-game spent flag
  freezeOpponentUsed: boolean      // permanent per-game spent flag
  doublePointsActiveCurrentQ: boolean  // transient: true from activation until scoring
  frozenCurrentQ: boolean          // target player: true = blocked this question
}
```

`createInitialPlayerStates` in `game.service.ts` must be updated to initialize all five new fields to `false`.

**Reset on `sendQuestion`:** `doublePointsActiveCurrentQ` and `frozenCurrentQ` are per-question transient flags and must be reset in `sendQuestion()` alongside `answeredCurrentQ`:

```typescript
// Inside sendQuestion(), the existing per-question reset loop:
for (const id of Object.keys(gameState.playerStates)) {
  gameState.playerStates[id].answeredCurrentQ = false
  gameState.playerStates[id].votedCurrentQ = false
  gameState.playerStates[id].doublePointsActiveCurrentQ = false  // NEW
  gameState.playerStates[id].frozenCurrentQ = false               // NEW
}
```

---

### Pattern: Double Points (LIFE-01)

**Flow:**
1. Player taps "نقاط مضاعفة" → client emits `lifeline:double_points`
2. Server handler: validates `!doublePointsUsed`, sets `doublePointsUsed = true` + `doublePointsActiveCurrentQ = true`, saves state.
3. Server emits `lifeline:double_points_ack` back to the **emitting socket only** (no room broadcast needed).
4. On `player:answer`: if `doublePointsActiveCurrentQ === true`, the score calculation uses `2x` multiplier. Flag is cleared during `sendQuestion` for next question (but `doublePointsUsed` remains `true`).

**Scoring integration — `calculateScore` extension:**

The existing signature:
```typescript
// game.service.ts
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
): number
```

Add `doublePoints` parameter:
```typescript
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
  doublePoints = false,   // Phase 6 addition — defaults false for backward compat
): number {
  if (!isCorrect) return 0
  const ratio = Math.min(Math.max(elapsedMs / timerDurationMs, 0), 1)
  const base = Math.floor((1 - ratio / 2) * 1000)
  const streakMultiplier = streak >= 3 ? 1.5 : 1
  const dpMultiplier = doublePoints ? 2 : 1
  return Math.floor(base * streakMultiplier * dpMultiplier)
}
```

The call site in `player:answer` becomes:
```typescript
const points = calculateScore(
  isCorrect,
  elapsedMs,
  timerDurationMs,
  currentStreak,
  playerState.doublePointsActiveCurrentQ,  // Phase 6
)
```

**Interaction with streak:** Double Points and streak are independent multipliers that stack. A streak-3 player with Double Points active on an instant-correct answer scores `1000 * 1.5 * 2 = 3000`. [ASSUMED — no explicit requirement found for whether they stack or not; this is the most natural game design interpretation]

**Note on question type:** Double Points applies to MC and MEDIA_GUESSING (where `calculateScore` is used). It does NOT apply to FREE_TEXT (which uses `calculateFreeTextScore`). The UI spec already specifies LifelineBar is hidden during FREE_TEXT, so the server doesn't need to guard against it — but the server handler should reject it if `questionType === 'FREE_TEXT'` as defense-in-depth.

---

### Pattern: Remove Two (LIFE-02)

**Flow:**
1. Player taps "أزل خيارين" → client emits `lifeline:remove_two`
2. Server handler:
   - Validates `!removeTwoUsed`, `gameState.phase === 'question'`
   - Validates question type is not `FREE_TEXT` (lifeline is only for MC/MEDIA_GUESSING)
   - Looks up `correctIndex` from `questionCache.get(roomCode)?.[currentQuestionIndex]`
   - Picks 2 wrong indices from `[0,1,2,3].filter(i => i !== correctIndex)`, shuffles them, takes 2
   - Sets `removeTwoUsed = true`, saves state
   - Emits `lifeline:remove_two_result` to **emitting socket only**: `{ eliminatedIndices: [n, m] }`
3. Client stores `eliminatedIndices` in state and passes to `AnswerOptions`.

**Server-side index selection (safe):**
```typescript
// In lifeline:remove_two handler
const wrongIndices = [0, 1, 2, 3].filter(i => i !== questionData.correctIndex)
// Shuffle wrongIndices (Fisher-Yates already available in game.ts)
shuffle(wrongIndices)
const eliminatedIndices = wrongIndices.slice(0, 2)
```

`shuffle` is already defined as a module-level function in `game.ts` and can be used directly.

**The server does NOT broadcast eliminatedIndices to the room** — only the requesting player sees the reduced options. This is correct game design (Remove Two is a personal lifeline).

**Frontend `AnswerOptions` change** — add optional prop:
```typescript
interface AnswerOptionsProps {
  // ... existing props
  eliminatedIndices?: number[]  // Phase 6: indices to grey out (Remove Two)
}
```

Inside `getButtonClasses(index)`, check `eliminatedIndices?.includes(index)` before normal state logic. Eliminated buttons receive `bg-gray-200 text-gray-400 opacity-40 pointer-events-none line-through` regardless of selected/revealed state. [VERIFIED: UI spec 06-UI-SPEC.md]

---

### Pattern: Freeze Opponent (LIFE-03)

**Flow:**
1. Player taps "جمّد منافس" → `FreezeOpponentOverlay` opens with list of other players (from existing `players` state in `PlayerJoin.tsx`).
2. Player taps a target → client emits `lifeline:freeze_opponent` with `{ targetPlayerId: string }`
3. Server handler:
   - Validates `!freezeOpponentUsed`, `gameState.phase === 'question'`
   - Validates `targetPlayerId` exists in `gameState.playerStates`
   - Validates `targetPlayerId !== socket.data.reconnectToken` (cannot freeze self)
   - Validates `!gameState.playerStates[targetPlayerId].answeredCurrentQ` (target hasn't answered yet — if they already answered, freeze has no effect; emit an error)
   - Sets `freezeOpponentUsed = true` on activating player
   - Sets `frozenCurrentQ = true` on target player
   - Saves state
   - Emits `lifeline:freeze_ack` to emitting socket: `{ success: true }` or `{ success: false, reason: 'already_answered' | 'invalid_target' }`
4. In `player:answer` handler: add guard at top of handler after duplicate-answer check:
   ```typescript
   if (gameState.playerStates[playerId].frozenCurrentQ) return  // silently reject
   ```
5. Host display: the freeze is an internal game mechanic — the host screen does NOT need a "frozen" indicator in Phase 6. [ASSUMED — not specified in UI spec; adding host-side UI would require HostDashboard changes that are out of scope]

**Failure mode — question timer expires mid-overlay:**
- The player opened the overlay but the question ended before they selected a target.
- `sendQuestion` is called → `frozenCurrentQ` is reset for all players for the next question.
- The server handler for `lifeline:freeze_opponent` checks `gameState.phase === 'question'` — if the timer auto-revealed, phase is now `'reveal'`, so the emit is silently rejected.
- `freezeOpponentUsed` is NOT set (freeze was never applied) — the player keeps their lifeline. [ASSUMED — fair game design interpretation; alternative is to consume the lifeline regardless]
- Frontend: overlay is still open. The `question:revealed` event fires → `playerPhase` transitions to `'revealed'` → `LifelineBar` receives `disabled=true` → overlay should be closed. The overlay must listen for this state change. Implementation: in `PlayerJoin.tsx`, when `question:revealed` fires, set an `overlayOpen` state to `false` (or pass `playerPhase !== 'answering'` as a close signal to the overlay).

**Players list for overlay:** `FreezeOpponentOverlay` needs `players` filtered to exclude `myToken`. The `players` state in `PlayerJoin.tsx` already contains all players with `{ id, name, emoji }`. Filtering is:
```typescript
const otherPlayers = players.filter(p => p.id !== myToken)
```

---

### Pattern: Lifeline UI (LIFE-04)

The UI spec is fully approved. Key integration points in `PlayerJoin.tsx`:

**New state in `PlayerJoin.tsx`:**
```typescript
// Lifeline used flags (per-game persistent)
const [doublePointsUsed, setDoublePointsUsed] = useState(false)
const [removeTwoUsed, setRemoveTwoUsed] = useState(false)
const [freezeOpponentUsed, setFreezeOpponentUsed] = useState(false)
// Per-question transient UI state
const [doublePointsActive, setDoublePointsActive] = useState(false)
const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([])
const [freezeOverlayOpen, setFreezeOverlayOpen] = useState(false)
```

**Reset on `question:start`:** `doublePointsActive`, `eliminatedIndices`, and `freezeOverlayOpen` must be reset in the `question:start` handler.

**Socket listeners for lifeline responses:**
```typescript
socket.on('lifeline:double_points_ack', () => {
  setDoublePointsUsed(true)
  setDoublePointsActive(true)
})
socket.on('lifeline:remove_two_result', ({ eliminatedIndices }: { eliminatedIndices: number[] }) => {
  setRemoveTwoUsed(true)
  setEliminatedIndices(eliminatedIndices)
})
socket.on('lifeline:freeze_ack', ({ success, reason }: { success: boolean; reason?: string }) => {
  if (success) {
    setFreezeOpponentUsed(true)
  } else {
    // Show error toast — reason maps to Arabic copy from UI spec
  }
  setFreezeOverlayOpen(false)
})
```

**Clear `doublePointsActive` on reveal:**
```typescript
socket.on('question:revealed', (...) => {
  // existing logic
  setDoublePointsActive(false)
  setFreezeOverlayOpen(false)
})
```

**Placement in render:** LifelineBar goes between `PlayerTimerBar` and the question header `<div className="px-4 pt-4 pb-2">`, only for non-FREE_TEXT questions:
```tsx
{currentQuestion.type !== 'FREE_TEXT' && (
  <LifelineBar
    doublePointsUsed={doublePointsUsed}
    removeTwoUsed={removeTwoUsed}
    freezeOpponentUsed={freezeOpponentUsed}
    onDoublePoints={handleDoublePoints}
    onRemoveTwo={handleRemoveTwo}
    onFreezeOpponent={() => setFreezeOverlayOpen(true)}
    disabled={playerPhase !== 'answering'}
  />
)}
{doublePointsActive && (
  <p className="text-xs text-indigo-600 font-bold text-center animate-pulse px-4">
    النقاط مضاعفة لهذا السؤال ×2
  </p>
)}
```

---

## New Socket Events: Complete Reference

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `lifeline:double_points` | client → server | `{}` | Player activates Double Points |
| `lifeline:double_points_ack` | server → client (socket only) | `{}` | Confirmed; no payload needed |
| `lifeline:remove_two` | client → server | `{}` | Player requests elimination |
| `lifeline:remove_two_result` | server → client (socket only) | `{ eliminatedIndices: number[] }` | Two wrong indices |
| `lifeline:freeze_opponent` | client → server | `{ targetPlayerId: string }` | Player freezes a target |
| `lifeline:freeze_ack` | server → client (socket only) | `{ success: boolean; reason?: 'already_answered' \| 'invalid_target' \| 'already_used' }` | Confirmation with failure reason |

All lifeline events are **socket-only** (not room-wide broadcast). No host notification events are required in Phase 6. [ASSUMED — the UI spec does not specify host-side freeze notifications; the UI spec is the locked design contract]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wrong-index selection for Remove Two | Custom random selector | `shuffle()` already in `game.ts` + `.filter()` | The shuffle function is already present in `game.ts` as a module-level utility |
| Per-player lock for Freeze Opponent | Separate in-memory lock map | `frozenCurrentQ` flag in `PlayerGameState` (Redis) | Consistent with how `answeredCurrentQ` is already guarded; Redis state is the single source of truth |
| Lifeline reuse prevention | Client-side only guard | Server-side `*Used` flags checked before each handler | Client state can be spoofed via raw socket emits |
| Socket event broadcasting | Custom publish system | Existing `io.to(roomCode).emit()` and `socket.emit()` | Already established pattern; socket.emit for private ACK, io.to(room) for room-wide |

---

## Common Pitfalls

### Pitfall 1: Double Points Applied to Wrong Question
**What goes wrong:** Player activates Double Points on question N but gets the bonus on question N+1 if the `doublePointsActiveCurrentQ` flag is not reset between questions.
**Why it happens:** `sendQuestion()` resets `answeredCurrentQ` but does not know about Phase 6 flags until they are added to the reset loop.
**How to avoid:** Add `doublePointsActiveCurrentQ = false` and `frozenCurrentQ = false` to the `sendQuestion` reset loop. This is the same loop that resets `answeredCurrentQ` — it's a single consistent place.
**Warning signs:** Test: activate Double Points on question 1, do NOT answer, advance to question 2, answer — verify 2x is NOT applied.

### Pitfall 2: Freeze Opponent Consuming Lifeline on Timer Expiry
**What goes wrong:** Player opens the freeze overlay, the auto-reveal timer fires (phase flips to `'reveal'`), player taps a target — server rejects the freeze (correct) BUT if the client sets `freezeOpponentUsed = true` optimistically before the ACK, the lifeline is permanently spent even though it had no effect.
**Why it happens:** Optimistic UI update before server confirmation.
**How to avoid:** Never mark `freezeOpponentUsed = true` on the client until `lifeline:freeze_ack` with `success: true` is received. The UI spec confirms: "Overlay closes immediately (optimistic)" — close the overlay optimistically, but wait for the ACK to mark the lifeline spent.
**Warning signs:** Overlay shows `freezeOpponentUsed` immediately after tap, before ACK arrives.

### Pitfall 3: Remove Two Reveals the Correct Answer Indirectly
**What goes wrong:** If all 4 options are [wrong, correct, wrong, wrong] and server eliminates indices [0, 2], the remaining options are [index 1 (correct), index 3 (wrong)] — which narrows it to 50/50. This is correct and expected game behaviour, not a bug. However, if the server accidentally eliminates the `correctIndex`, the correct answer is removed from the option list — this is a game-breaking bug.
**Why it happens:** Bug in index selection logic if `filter(i => i !== correctIndex)` is omitted.
**How to avoid:** The filter `[0,1,2,3].filter(i => i !== questionData.correctIndex)` is mandatory. Unit test: for every possible correctIndex (0,1,2,3), verify `eliminatedIndices` never contains `correctIndex`.

### Pitfall 4: Freeze Opponent Against Already-Answered Player
**What goes wrong:** Player A freezes Player B after Player B has already answered. The freeze has no effect but consumes Player A's lifeline.
**Why it happens:** No check on `answeredCurrentQ` of target before applying freeze.
**How to avoid:** Server handler checks `gameState.playerStates[targetPlayerId].answeredCurrentQ`. If `true`, return `lifeline:freeze_ack { success: false, reason: 'already_answered' }` and do NOT set `freezeOpponentUsed = true`.
**Warning signs:** Arabic error copy "لم يتمكن التجميد من الوصول في الوقت المناسب" should appear on client in this case.

### Pitfall 5: Lifeline Replay Attack via Raw Socket Emit
**What goes wrong:** Malicious player emits `lifeline:double_points` twice (e.g., using browser devtools on the socket).
**Why it happens:** No server-side guard.
**How to avoid:** Every server handler begins with `if (playerState.doublePointsUsed) return` (or the equivalent for each lifeline). The used flag is in Redis, not just client state.

### Pitfall 6: `frozenCurrentQ` Not Cleared if No `question:start` Fires
**What goes wrong:** Game ends (via `game:end` or `game:podium`) while `frozenCurrentQ` is still set. No impact at runtime since the game is over, but if state is read between end and cleanup it could cause confusion.
**Why it happens:** `game:end` calls `deleteGameState` which wipes the Redis entry entirely — so this is not actually a bug. The state is cleaned up. [VERIFIED: game.ts game:end and question:next handlers both call `questionCache.delete(roomCode)`]
**Warning signs:** Not a real pitfall for this project given full state deletion on game end.

---

## Code Examples

### Server: Lifeline handler pattern (consistent with existing game.ts style)

```typescript
// apps/server/src/socket/game.ts — inside registerGameHandlers

// -------------------------------------------------------------------------
// lifeline:double_points — Player activates Double Points lifeline
// -------------------------------------------------------------------------
socket.on('lifeline:double_points', async () => {
  const roomCode: string = socket.data.roomCode
  if (!roomCode) return

  try {
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return

    const playerId: string = socket.data.reconnectToken
    if (!playerId || !gameState.playerStates[playerId]) return

    const playerState = gameState.playerStates[playerId]
    if (playerState.doublePointsUsed) return  // already spent

    // Reject on FREE_TEXT (defense-in-depth — UI already hides the button)
    const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
    if (!questionData || questionData.type === 'FREE_TEXT') return

    playerState.doublePointsUsed = true
    playerState.doublePointsActiveCurrentQ = true
    await saveGameState(roomCode, gameState)

    socket.emit('lifeline:double_points_ack', {})
  } catch (err) {
    console.error('[Game] lifeline:double_points error:', err)
  }
})
```

### Server: Remove Two handler

```typescript
socket.on('lifeline:remove_two', async () => {
  const roomCode: string = socket.data.roomCode
  if (!roomCode) return

  try {
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return

    const playerId: string = socket.data.reconnectToken
    if (!playerId || !gameState.playerStates[playerId]) return

    const playerState = gameState.playerStates[playerId]
    if (playerState.removeTwoUsed) return

    const questionData = questionCache.get(roomCode)?.[gameState.currentQuestionIndex]
    if (!questionData || questionData.type === 'FREE_TEXT') return

    // Pick 2 wrong indices — never include correctIndex
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== questionData.correctIndex)
    shuffle(wrongIndices)
    const eliminatedIndices = wrongIndices.slice(0, 2)

    playerState.removeTwoUsed = true
    await saveGameState(roomCode, gameState)

    socket.emit('lifeline:remove_two_result', { eliminatedIndices })
  } catch (err) {
    console.error('[Game] lifeline:remove_two error:', err)
  }
})
```

### Server: Freeze Opponent handler

```typescript
socket.on('lifeline:freeze_opponent', async (data: { targetPlayerId: string }) => {
  const roomCode: string = socket.data.roomCode
  if (!roomCode) return

  try {
    const gameState = await getGameState(roomCode)
    if (!gameState || gameState.phase !== 'question') return

    const playerId: string = socket.data.reconnectToken
    if (!playerId || !gameState.playerStates[playerId]) return

    const activatorState = gameState.playerStates[playerId]
    if (activatorState.freezeOpponentUsed) {
      socket.emit('lifeline:freeze_ack', { success: false, reason: 'already_used' })
      return
    }

    const { targetPlayerId } = data ?? {}
    if (!targetPlayerId || typeof targetPlayerId !== 'string') return
    if (targetPlayerId === playerId) return  // cannot freeze self

    const targetState = gameState.playerStates[targetPlayerId]
    if (!targetState) {
      socket.emit('lifeline:freeze_ack', { success: false, reason: 'invalid_target' })
      return
    }

    if (targetState.answeredCurrentQ) {
      socket.emit('lifeline:freeze_ack', { success: false, reason: 'already_answered' })
      return
    }

    activatorState.freezeOpponentUsed = true
    targetState.frozenCurrentQ = true
    await saveGameState(roomCode, gameState)

    socket.emit('lifeline:freeze_ack', { success: true })
  } catch (err) {
    console.error('[Game] lifeline:freeze_opponent error:', err)
  }
})
```

### Frontend: LifelineBar activation handlers in PlayerJoin.tsx

```typescript
const handleDoublePoints = useCallback(() => {
  if (doublePointsUsed || playerPhase !== 'answering') return
  getSocket().emit('lifeline:double_points')
}, [doublePointsUsed, playerPhase])

const handleRemoveTwo = useCallback(() => {
  if (removeTwoUsed || playerPhase !== 'answering') return
  getSocket().emit('lifeline:remove_two')
}, [removeTwoUsed, playerPhase])
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Persistent DB lifeline tracking (separate table) | Redis GameState inline flags | No migration needed; cleaned up with game state on game:end |
| Client-side-only lifeline enforcement | Server-side `*Used` flags in Redis + guards in handlers | Prevents replay attacks via raw socket emits |
| Room broadcast for all lifeline events | Socket-only emit for private lifeline ACKs | Correct privacy — remove two indices and freeze ACKs are private to the activating player |

---

## Open Questions

1. **Double Points + Streak — Do they stack?**
   - What we know: The spec says "2x multiplier"; the streak already applies a 1.5x multiplier. No explicit ruling on interaction.
   - What's unclear: Should Double Points stack with streak (giving e.g. 3000 points for instant+streak3+doublePoints), or should it override/be applied separately?
   - Recommendation: Stack them (`base * streakMultiplier * 2`). This is more rewarding and consistent with each being an independent mechanic. Document the formula in code comments. [ASSUMED — confirm if desired before locking]

2. **Freeze Opponent: should the activating player be notified if the freeze is ignored (target already answered)?**
   - What we know: The UI spec shows error copy "لم يتمكن التجميد من الوصول في الوقت المناسب" for this case. The spec also says the overlay closes immediately (optimistic).
   - What's unclear: Should `freezeOpponentUsed` still be set to `true` (lifeline consumed even though ineffective), or returned unused?
   - Recommendation: Return the lifeline unused (do not set `freezeOpponentUsed = true`) when target already answered. This is the fairer game design. [ASSUMED]

3. **Host display of Freeze Opponent activation**
   - What we know: The UI spec does not mention a host-side freeze indicator. `HostDashboard.tsx` has no freeze-related UI.
   - What's unclear: Should the host screen show an overlay/notification when a freeze is applied?
   - Recommendation: Omit in Phase 6 — keep scope tight. If desired, can be added in Phase 8 polish. [ASSUMED — not in UI spec scope]

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is purely server-side Socket.io event additions and frontend React component additions. No new external tools, runtimes, or services are required beyond what's already running.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed) |
| Config file | `apps/server/vitest.config.ts` |
| Quick run command | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` |
| Full suite command | `cd apps/server && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIFE-01 | `calculateScore` with `doublePoints=true` doubles the base×streak result | unit | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` | Wave 0: extend existing file |
| LIFE-01 | `doublePointsUsed` guard prevents second activation | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ Wave 0 |
| LIFE-02 | `eliminatedIndices` never contains `correctIndex` for all 4 possible correct positions | unit | `cd apps/server && npx vitest run src/game/__tests__/lifelines.test.ts` | ❌ Wave 0 |
| LIFE-02 | `eliminatedIndices` always contains exactly 2 elements | unit | same | ❌ Wave 0 |
| LIFE-03 | Frozen player's answer is silently rejected | unit | same | ❌ Wave 0 |
| LIFE-03 | Freeze fails gracefully when target already answered | unit | same | ❌ Wave 0 |
| LIFE-03 | Cannot freeze self | unit | same | ❌ Wave 0 |
| LIFE-04 | All `*Used` flags initialize to `false` in `createInitialPlayerStates` | unit | `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts` | Wave 0: extend existing file |

### Sampling Rate
- **Per task commit:** `cd apps/server && npx vitest run src/game/__tests__/game.service.test.ts`
- **Per wave merge:** `cd apps/server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/server/src/game/__tests__/lifelines.test.ts` — covers LIFE-01 guard, LIFE-02 index safety, LIFE-03 freeze logic
- [ ] Extend `apps/server/src/game/__tests__/game.service.test.ts` — add `calculateScore(doublePoints=true)` test cases and `createInitialPlayerStates` lifeline fields test

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — socket auth handled by reconnectToken in Phase 2 |
| V4 Access Control | yes | Server guards: `!playerState.*Used`, `targetPlayerId !== playerId`, `phase === 'question'` before every lifeline handler |
| V5 Input Validation | yes | `targetPlayerId` validated: typeof string, exists in playerStates, not self |

### Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Replay: emit `lifeline:*` twice | Spoofing/Tampering | `if (playerState.*Used) return` guard in each handler before any state mutation |
| Fake targetPlayerId in freeze_opponent | Tampering | Validate against `gameState.playerStates` key set |
| Freeze self to prevent own answer submission | Elevation | `targetPlayerId !== socket.data.reconnectToken` guard |
| Emit lifeline during non-question phase (reveal/leaderboard) | Tampering | `gameState.phase !== 'question'` guard in all handlers |
| Remove Two on FREE_TEXT question | Tampering | `questionData.type === 'FREE_TEXT'` guard + questionCache lookup |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Double Points and streak multipliers stack (base × 1.5 × 2) | Architecture Patterns | Scoring could be too powerful; easy to change formula before implementation |
| A2 | Freeze Opponent lifeline is returned unused if target already answered | Architecture Patterns | If consumed when ineffective, players lose lifeline unfairly — user-facing bug |
| A3 | No host-side freeze notification in Phase 6 | Architecture Patterns / Open Questions | Host cannot tell if a player was frozen — acceptable for Phase 6 scope |
| A4 | Double Points does not apply to FREE_TEXT questions (UI hides bar; server also rejects) | Architecture Patterns | If FREE_TEXT lifelines are desired in future, server guard would need removal |
| A5 | No regulatory/security requirement for strong randomness in Remove Two index selection | Standard Stack | If this were gambling, `Math.random()` would need to be `crypto.randomInt`; for entertainment only, acceptable |

---

## Sources

### Primary (HIGH confidence)
- `apps/server/src/socket/game.ts` — all existing socket events, GameState mutation patterns, per-question reset logic in `sendQuestion`, `questionCache` structure [VERIFIED: codebase read]
- `apps/server/src/game/game.types.ts` — `PlayerGameState`, `GameState` type definitions [VERIFIED: codebase read]
- `apps/server/src/game/game.service.ts` — `calculateScore` signature and multiplier pattern, `saveGameState`/`getGameState` Redis pattern [VERIFIED: codebase read]
- `apps/web/app/join/[roomCode]/PlayerJoin.tsx` — player state machine, `question:start` reset pattern, existing socket listener structure [VERIFIED: codebase read]
- `apps/web/app/join/[roomCode]/game/AnswerOptions.tsx` — `getButtonClasses` logic, disabled/revealed state patterns, prop interface [VERIFIED: codebase read]
- `apps/server/prisma/schema.prisma` — no lifeline table; confirmed DB persistence is not needed [VERIFIED: codebase read]
- `.planning/phases/06-lifelines/06-UI-SPEC.md` — approved UI contract: LifelineBar, FreezeOpponentOverlay, AnswerOptions eliminatedIndices, copy, accessibility [VERIFIED: codebase read]
- `apps/server/vitest.config.ts`, `apps/server/src/game/__tests__/game.service.test.ts` — test framework confirmed as Vitest with existing test pattern to extend [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — LIFE-01 through LIFE-04 requirement text [VERIFIED: codebase read]
- `.planning/ROADMAP.md` — Phase 6 deliverables list [VERIFIED: codebase read]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all capabilities already in codebase
- Architecture: HIGH — all insertion points identified in actual source files; patterns directly mirror existing Phase 5 additions
- Pitfalls: HIGH — derived from close reading of existing handler code and known Socket.io race condition patterns
- Open questions: MEDIUM — three assumptions flagged; all are low-risk and easy to resolve

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable codebase; lifeline mechanics are not time-sensitive)
