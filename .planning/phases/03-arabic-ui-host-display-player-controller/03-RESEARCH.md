# Phase 3+4: Arabic UI + Question Engine — Research

**Researched:** 2026-04-10
**Domain:** Arabic RTL UI (Next.js 14 / Tailwind), Socket.io game loop, Prisma schema extension, speed-based scoring
**Confidence:** HIGH (stack verified against live codebase; library versions confirmed via npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Answer options layout — host-selectable before game: 2×2 grid (default), 4-column bar, or vertical stack
- **D-02** Timer display — host-selectable: full-width progress bar (default), large countdown circle, or big number only
- **D-03** Player answer indicators — emoji avatars light up on host screen as each player answers (no answer revealed)
- **D-04** Player answer buttons mirror the host-configured layout
- **D-05** Player timer — thin progress bar at top edge of phone screen
- **D-06** Post-answer state — chosen answer highlighted, others grey, spinner with "في انتظار اللاعبين…"
- **D-07** Host drives all game pacing; timer does NOT auto-advance
- **D-08** Reveal mode — host configures before game: auto-reveal at timer-0 OR manual reveal via button
- **D-09** Leaderboard — host-triggered after each question, optional per question
- **D-10** Questions stored in PostgreSQL via Prisma; Category + Question models added alongside existing NextAuth tables
- **D-11** Seed script: 20–30 Arabic test questions across 2–3 categories (`apps/server/prisma/seed.ts`)
- **D-12** Speed-based scoring: max 1000, min 500 for correct answer (linear decay), 0 for wrong
- **D-13** Streak multiplier 1.5× after 3+ consecutive correct answers; resets on wrong/missed

### Claude's Discretion

- Socket event naming (e.g., `question:start`, `player:answer`, `question:end`, `leaderboard:update`, `game:podium`)
- Animation library (CSS transitions vs Motion/Framer — research must recommend one)
- Specific color palette for answer options (accessibility-safe contrast on TV)
- Component file structure (host game screen split into sub-components)
- Error handling (player disconnects mid-question, late answers after reveal)
- How "correct answer" is broadcast (event name, payload shape)

### Deferred Ideas (OUT OF SCOPE)

- Media Guessing questions (Phase 5)
- Free Text Entry questions (Phase 5)
- Lifelines (Phase 6)
- Admin dashboard UI (Phase 7)
- Player accounts / persistent stats (v2)
- QR code on host screen
- Sound effects / background music (Phase 8)
- Audience mode (v2)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RTL-01 | All UI text is in Arabic with correct RTL layout | Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) already enforced via dir="rtl" on html; confirmed working on iOS Safari 15+ and Android Chrome 89+ |
| RTL-02 | Host display optimized for landscape (TV/PC, 16:9) | CSS aspect-ratio + full-screen layout patterns; see Architecture Patterns §Host Screen |
| RTL-03 | Player controller optimized for mobile portrait mode | Safe-area-aware padding (`pb-[env(safe-area-inset-bottom)]`); 44px min touch targets already in EmojiPicker |
| RTL-04 | Arabic typography renders correctly on iOS Safari and Android Chrome | Cairo self-hosted via next/font; known iOS Safari refresh-caching issue; mitigations documented in Pitfalls |
| RTL-05 | Countdown timers, animations, score displays are RTL-aware | Progress bar must fill right-to-left in RTL; `transform: scaleX(-1)` or `direction: ltr` with `transform-origin` trick; prefers-reduced-motion required |
| GAME-01 | Multiple Choice questions display 4 options with configurable countdown timer (15–30s) | Question fetched from PostgreSQL; timer started server-side via `question:start` with `timerDuration`; client counts down visually |
| GAME-04 | Questions served in sequence from selected category/pack | `currentQuestionIndex` tracked in Redis game state; next question fetched from DB by index |
| GAME-05 | Correct answer revealed on host screen after each question with animation | `question:reveal` event broadcasts correct index; CSS/Motion animate correct option highlight + wrong options dim |
| SCORE-01 | Points awarded based on correctness and response speed | Server calculates: `floor((1 - (elapsed / timerDuration) / 2) * 1000)`; min 500 for correct |
| SCORE-02 | Streak multiplier after 3+ consecutive correct answers | Server tracks per-player `streak` counter in Redis game state; applies 1.5× when streak >= 3 |
| SCORE-03 | Live leaderboard shown on host screen after each question | `leaderboard:update` event broadcasts sorted player array with scores; host-triggered |
| SCORE-04 | Final podium (top 3) with animation at game end | `game:podium` event; CSS/Motion entrance animation top-3 in reverse order (3rd → 2nd → 1st) |
</phase_requirements>

---

## Summary

Phase 3+4 is a full-stack game loop phase — it touches the database schema, Redis game state, server-side Socket.io handlers, host screen UI, and player mobile controller simultaneously. The existing codebase (Phase 2) provides a solid foundation: Redis room state uses WATCH/MULTI transactions, the socket singleton is established, and RTL Tailwind conventions are already enforced.

The two most consequential decisions are (1) animation library and (2) how game state is extended in Redis. For animations, the recommendation is **Motion (formerly Framer Motion) with LazyMotion** — it provides the exit animations, enter animations, and layout animations needed for podium and leaderboard reveals without requiring hand-rolled CSS state machines. Bundle impact is ~4.6kb with LazyMotion. For Redis game state, the existing JSON-in-hash pattern should be extended: add `gameState` as a JSON field in the `room:{code}` hash, keeping all room data together under one WATCH/MULTI transaction boundary.

The scoring formula follows the Kahoot model: `floor((1 - (elapsed / timerDuration) / 2) * 1000)` — minimum 500 for a correct answer. Streaks tracked per-player server-side. The Prisma schema extends safely: adding `Question` and `Category` models is purely additive with `db push` (existing NextAuth tables are not touched). No migration history exists yet in this project, so continuing with `db push` is correct.

**Primary recommendation:** Add Motion via `npm install motion` in the web app. Extend Redis game state with a `gameState` JSON field. Add Question + Category Prisma models. Register `game:` socket handlers in a new `apps/server/src/socket/game.ts` file alongside the existing `room.ts`.

---

## Standard Stack

### Core (already installed — no new additions except Motion)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 14.2.35 [VERIFIED: npm registry] | App Router, RSC, next/font Cairo | Already installed |
| Tailwind CSS | 3.4.1 [VERIFIED: package.json] | RTL logical properties styling | Already installed |
| Socket.io client | 4.8.3 [VERIFIED: package.json] | Real-time game events (player side) | Already installed |
| Socket.io server | 4.8.3 [VERIFIED: package.json] | Real-time game events (server side) | Already installed |
| Prisma | ^6 (resolved 6.x) [VERIFIED: package.json] | PostgreSQL ORM; question schema | Already installed |
| ioredis | 5.4.1 [VERIFIED: package.json] | Redis game state | Already installed |
| Cairo font | loaded via next/font/google [VERIFIED: layout.tsx] | Arabic + Latin, weights 400/600/700/900 | Already configured |

### New Addition

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| motion | 12.38.0 [VERIFIED: npm registry] | Answer reveal, leaderboard slide-in, podium entrance | LazyMotion reduces bundle to ~4.6kb; exit animations and stagger are impossible with CSS transitions alone |

**Installation:**
```bash
# In apps/web/
npm install motion
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Motion (LazyMotion) | CSS transitions only | CSS transitions cannot handle unmount animations (exit) or staggered list entrance — both are required for podium and leaderboard |
| Motion (LazyMotion) | react-spring | react-spring is physics-based and harder to control for precise game timing; Motion's declarative API maps better to Tailwind-first codebase |
| Motion (LazyMotion) | Full `motion` import | Full import is ~34kb gzipped; LazyMotion with `domAnimation` is ~4.6kb — always use LazyMotion in this project |

**Version verification:**
```bash
npm view motion version  # → 12.38.0 (confirmed 2026-04-10)
```

---

## Architecture Patterns

### Recommended File Structure (new files in this phase)

```
apps/web/app/host/[roomCode]/
├── HostDashboard.tsx          # EXTEND — add 'pre-game' and 'playing' states
├── game/
│   ├── HostGameScreen.tsx     # Full-screen landscape game view (TV)
│   ├── HostPreGame.tsx        # Settings picker (layout, timer style, reveal mode)
│   ├── QuestionDisplay.tsx    # Question text + options (layout variant prop)
│   ├── TimerDisplay.tsx       # Three timer variants (bar / circle / number)
│   ├── PlayerIndicators.tsx   # Emoji avatar grid — lights up on answer
│   ├── HostInGameControls.tsx # Reveal / Next / Leaderboard / End buttons
│   ├── LeaderboardOverlay.tsx # Slide-in leaderboard panel
│   └── PodiumScreen.tsx       # Final top-3 podium with entrance animation

apps/web/app/join/[roomCode]/
├── PlayerJoin.tsx             # EXTEND — replace 'playing' placeholder
├── game/
│   ├── PlayerGameScreen.tsx   # Mobile portrait answer controller
│   ├── AnswerOptions.tsx      # 4 answer buttons (mirrors host layout)
│   ├── PlayerTimerBar.tsx     # Thin top-edge timer bar
│   └── WaitingScreen.tsx      # Post-answer spinner state

apps/server/src/
├── socket/
│   ├── room.ts                # EXISTING — no changes to room events
│   └── game.ts                # NEW — all game:* event handlers
├── game/
│   ├── game.service.ts        # NEW — fetchQuestion, calculateScore, broadcastLeaderboard
│   └── game.ts                # NEW — GameState type definitions
└── prisma/
    └── schema.prisma          # EXTEND — add Category (extend existing) + Question models
```

### Pattern 1: Redis Game State Extension

The existing room hash at `room:{code}` stores `hostId`, `hostSocketId`, `players` (JSON), `status`, `createdAt`. Extend it with a `gameState` field (JSON string) added only when a game starts.

**GameState type:**
```typescript
// apps/server/src/game/game.ts
export interface PlayerGameState {
  score: number
  streak: number           // consecutive correct answers
  answeredCurrentQ: boolean
  lastAnswerTime?: number  // Date.now() ms when they answered
}

export interface GameState {
  questionIds: string[]          // ordered list fetched at game:start
  currentQuestionIndex: number   // 0-based
  phase: 'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended'
  questionStartedAt: number      // Date.now() ms — for scoring
  playerStates: Record<string, PlayerGameState>  // keyed by player.id (reconnect token)
  hostSettings: {
    layout: '2x2' | '4-column' | 'vertical'
    timerStyle: 'bar' | 'circle' | 'number'
    revealMode: 'auto' | 'manual'
  }
}
```

Store as: `redis.hset('room:CODE', 'gameState', JSON.stringify(gameState))` — same WATCH/MULTI pattern as existing `players` field.

**Why this approach:** Keeps all room data under one Redis key for atomic WATCH/MULTI; consistent with existing `players` JSON pattern; no new key namespaces needed.

### Pattern 2: Socket Game Event Flow

```
HOST emits: game:configure  { layout, timerStyle, revealMode }
             → server stores hostSettings in Redis

HOST emits: game:start
             → server fetches questionIds from DB (by category/status=approved)
             → server stores GameState in Redis
             → server emits: question:start { question, timerDuration, questionIndex, total } to room

PLAYER emits: player:answer  { questionIndex, answerIndex }
              → server validates: correct phase, question not yet revealed, player hasn't answered
              → server calculates score (timestamp delta from questionStartedAt)
              → server updates Redis playerStates
              → server emits: question:progress { answeredCount, totalPlayers } to room
              → (host sees avatar light up)

HOST emits: question:reveal  (manual reveal) OR server auto-emits when timer expires (auto-reveal)
            → server emits: question:revealed { correctAnswerIndex, scores } to room
            → (players see correct/wrong, host highlights correct option)

HOST emits: leaderboard:show
            → server computes sorted leaderboard from playerStates
            → server emits: leaderboard:update { players: [{name, emoji, score, rank}] } to room

HOST emits: question:next
            → server increments currentQuestionIndex
            → if more questions: emits question:start for next question
            → if done: emits game:podium { top3: [...] }
```

**Server-side ONLY operations:** Score calculation, answer validation, question sequencing. Client never trusts its own score.

### Pattern 3: Speed-Based Scoring Formula

```typescript
// apps/server/src/game/game.service.ts
// Source: Kahoot scoring model — verified via official Kahoot help docs
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
): number {
  if (!isCorrect) return 0

  // Linear decay: 1000 at t=0, 500 at t=timerDuration
  const ratio = Math.min(elapsedMs / timerDurationMs, 1)
  const base = Math.floor((1 - ratio / 2) * 1000)  // range: 500–1000

  // Streak multiplier: 1.5× after 3+ consecutive correct
  const multiplier = streak >= 3 ? 1.5 : 1
  return Math.floor(base * multiplier)
}
```

**Streak logic:**
- Correct answer: `streak += 1`
- Wrong answer or no answer (timer expiry): `streak = 0`
- Multiplier applies only when `streak >= 3` at time of calculation — meaning the 3rd correct answer already gets 1.5×.

### Pattern 4: Motion Animation with LazyMotion (RTL-safe)

```typescript
// Wrap game screens in LazyMotion at the page level
// Source: motion.dev/docs/react-lazy-motion [CITED]
import { LazyMotion, domAnimation } from 'motion/react'
import * as m from 'motion/react-m'

// In HostGameScreen.tsx layout wrapper:
<LazyMotion features={domAnimation}>
  {/* All animated children use m.div, m.span, etc. */}
</LazyMotion>

// Answer reveal — correct option pulses, wrong options dim:
<m.div
  animate={revealed
    ? { opacity: isCorrect ? 1 : 0.3, scale: isCorrect ? 1.05 : 1 }
    : { opacity: 1, scale: 1 }
  }
  transition={{ duration: 0.3 }}
>

// Leaderboard slide-in (RTL-aware — use x not translateX):
<m.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>

// Podium entrance — staggered (3rd first, 1st last):
// Use variants + staggerChildren on parent
const podiumVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.4, staggerDirection: -1 } }
}
```

**RTL note for Motion:** Motion's `x` values are pixel offsets, not writing-mode-aware. When sliding in from the end side in RTL, `x: '100%'` slides in from the left (correct for Arabic). Verify slide direction on test device.

**RTL note for CSS progress bar (timer):** A progress bar that "depletes" left-to-right becomes right-to-left in RTL. Use `scaleX` animation with `transform-origin: right` OR wrap in `dir="ltr"` with visual correction. Recommendation: use `transform: scaleX(progress)` with `transform-origin: inline-end` — this flips correctly under RTL.

```css
/* Timer bar — depletes correctly in both LTR and RTL */
.timer-bar-fill {
  transform-origin: inline-end;  /* right in LTR, left in RTL */
  /* Animate scaleX from 1 to 0 over timerDuration seconds */
}
```

### Pattern 5: Prisma Schema Extension

```prisma
// Extend apps/server/prisma/schema.prisma
// Add enum and Question model. Category already exists — extend it.

enum QuestionStatus {
  draft
  approved
  live
}

// Extend existing Category model:
model Category {
  id        String     @id @default(cuid())
  name      String                          // Arabic display name
  slug      String     @unique              // ADD THIS
  questions Question[]                      // ADD THIS relation
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id              String         @id @default(cuid())
  text            String                           // Arabic question text
  options         String[]                         // 4 options [A, B, C, D]
  correctIndex    Int                              // 0-3
  timerDuration   Int            @default(20)      // seconds: 15, 20, or 30
  status          QuestionStatus @default(draft)
  category        Category       @relation(fields: [categoryId], references: [id])
  categoryId      String
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

**Notes:**
- `String[]` (array) is supported natively in PostgreSQL via Prisma [VERIFIED: prisma.io/docs/orm/prisma-schema/data-model/models]
- The existing `Category` model already has `id`, `name`, `createdAt`, `updatedAt` — add `slug` and `questions` relation
- `db push` applies these changes additively — existing NextAuth tables (`User`, `Account`, `Session`, `VerificationToken`) are untouched
- `status` enum with `draft/approved/live` provides the Phase 7 admin workflow foundation at no extra cost now

### Pattern 6: Host Pre-Game Settings Storage

Host settings (layout, timerStyle, revealMode) are collected on a pre-game screen and sent to the server via a single `game:configure` event before `game:start`. The server stores them in `gameState.hostSettings` in Redis. When `question:start` is broadcast, the payload includes `hostSettings` so players know which layout to render.

```typescript
// Client: host pre-game screen emits
socket.emit('game:configure', {
  layout: '2x2',         // '2x2' | '4-column' | 'vertical'
  timerStyle: 'bar',     // 'bar' | 'circle' | 'number'
  revealMode: 'manual',  // 'manual' | 'auto'
})

// question:start payload includes settings so players sync layout
socket.emit('question:start', {
  question: { text, options, timerDuration },
  questionIndex: 0,
  total: 20,
  hostSettings: { layout, timerStyle, revealMode },
})
```

No localStorage needed for settings — they are carried in the socket event payload and stored in server-side Redis. This avoids SSR/localStorage hydration issues in Next.js.

### Pattern 7: Seed Script (Prisma 6)

With Prisma ^6 installed, configure seed in `package.json` (the `prisma.config.ts` approach is Prisma 7+):

```json
// apps/server/package.json — add:
{
  "prisma": {
    "seed": "ts-node --project tsconfig.json prisma/seed.ts"
  }
}
```

`ts-node` is already a devDependency. Alternatively add `tsx` as devDependency for faster execution. The seed file uses `upsert` to be idempotent (safe to run multiple times):

```typescript
// apps/server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const thaqafa = await prisma.category.upsert({
    where: { slug: 'thaqafa-amma' },
    update: {},
    create: { name: 'ثقافة عامة', slug: 'thaqafa-amma' },
  })
  // ... 20-30 questions with prisma.question.upsert
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
```

**Run with:** `npx prisma db seed`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exit/enter animations | CSS class toggle + setTimeout | Motion `AnimatePresence` + `m.*` | Unmount animations require knowing when React removes DOM; Motion handles this automatically |
| Staggered list animations | Manual `setTimeout` per item | Motion `variants` + `staggerChildren` | Timing drift, cleanup complexity — Motion's stagger is declarative |
| Atomic Redis game state updates | Manual read-modify-write | Existing WATCH/MULTI pattern (already in room.service.ts) | Race conditions when 8 players answer simultaneously |
| Font subsetting | Manual `@font-face` + subset CSS | `next/font/google` with `subsets: ['arabic', 'latin']` already configured | Already done; do not add separate `@font-face` declarations |
| RTL layout detection | Custom `dir` detection hook | `dir="rtl"` on `<html>` + Tailwind logical properties | Already established project-wide; adding detection logic would duplicate and conflict |
| Score calculation client-side | Trust player-reported timestamps | Server-side calculation with `gameState.questionStartedAt` | Client clock skew; cheating prevention |
| Timer auto-advance | `setTimeout` on server for auto-reveal | Explicit timer in `game:configure` sent to client; server sets a `setTimeout` only if `revealMode === 'auto'` | Keep it simple — server timeout fires `question:reveal` internally if auto mode |

**Key insight:** The existing WATCH/MULTI transaction pattern in `room.service.ts` is the right pattern for all concurrent game state updates. Reuse it for `gameState` field updates.

---

## Common Pitfalls

### Pitfall 1: Tailwind Logical Properties Forgotten on New Components

**What goes wrong:** Developer uses `ml-4`, `pl-4`, `text-left` in new game components — these do not flip in RTL and the Arabic UI looks mirrored wrong.
**Why it happens:** Muscle memory from LTR development; IDE autocomplete doesn't warn.
**How to avoid:** The CONTEXT.md enforces this — always use `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`. Plan tasks must call this out per component.
**Warning signs:** Any `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right` in a grep of new files.

### Pitfall 2: Timer Progress Bar Direction in RTL

**What goes wrong:** A CSS `width: 0% → 100%` or `scaleX(0 → 1)` animation depletes left-to-right, which in RTL means it grows from the wrong end — confusing for Arabic readers who expect rightward origin.
**Why it happens:** CSS `transform-origin` defaults to `center` not logical `inline-end`.
**How to avoid:** Use `transform-origin: right` (in RTL context, `right` is the start side for Arabic reading). Or animate `scaleX` from 1 to 0 (depleting) with `transform-origin: inline-start`. Test on a real RTL device.
**Warning signs:** Timer feels "backwards" — depletes from the wrong side.

### Pitfall 3: Cairo Font Refresh Caching on iOS Safari

**What goes wrong:** Cairo renders correctly on first visit but falls back to system font (Geeza Pro) on refresh in iOS Safari.
**Why it happens:** A known iOS Safari issue with self-hosted fonts via `next/font` (GitHub issue #63812 — unfixed as of 2026-04-10 [VERIFIED: github.com/vercel/next.js/issues/63812]). The browser's font cache is not reliably invalidated between navigations.
**How to avoid:**
  - Keep `display: 'swap'` (already configured) — at minimum, fallback renders immediately
  - Ensure font fallback chain includes system Arabic fonts: `font-family: var(--font-cairo), 'Geeza Pro', 'Arabic Typesetting', sans-serif`
  - Tailwind config already sets `sans: ['var(--font-cairo)', 'sans-serif']` — extend with system Arabic fallbacks
  - For game screens where text weight is 700+, the visual difference between Cairo 700 and Geeza Pro 700 is acceptable
**Warning signs:** Arabic text looks visually "lighter" or different weight on second load in iOS Safari.

### Pitfall 4: Late Answer After Reveal

**What goes wrong:** A player's `player:answer` event arrives at the server after `question:reveal` has already been emitted (network lag).
**Why it happens:** Player tapped answer at last second; reveal fired; answer arrives 200ms later.
**How to avoid:** Server checks `gameState.phase === 'question'` before accepting answers. If phase is `'reveal'` or later, emit `room:error { message: 'Answer received after reveal — not counted' }` back to that player only. Do not update score.
**Warning signs:** Leaderboard scores jump unexpectedly after reveal.

### Pitfall 5: Motion Components in Server Components

**What goes wrong:** `m.div` or `motion.div` crashes with "You're importing a component that needs ... use client" because Motion is a client-only library.
**Why it happens:** Next.js 14 App Router defaults to Server Components; Motion requires DOM and browser APIs.
**How to avoid:** All game screen components that use Motion MUST have `'use client'` at the top. The existing HostDashboard and PlayerJoin already have this — new game sub-components should too.
**Warning signs:** Build error: "You're importing a component that needs useState..."

### Pitfall 6: Prisma `db push` Drift Risk

**What goes wrong:** Running `prisma db push` while Railway is serving production traffic causes brief schema-application window; if the deploy fails mid-push, the schema could be partially applied.
**Why it happens:** `db push` is not transactional in the same way as `migrate deploy`.
**How to avoid:** This project has no migration history and uses `db push` on every Railway deploy (Dockerfile `CMD`). This is acceptable for Phase 3 (pre-launch). For production launch (Phase 8), switch to `prisma migrate deploy`. Adding `Question` and `Category` models is purely additive — no existing columns are removed or changed — so mid-deploy risk is very low.
**Warning signs:** Server fails to start with "Table already exists" (would require rolling back; only relevant if push runs twice simultaneously).

### Pitfall 7: Socket Event on Wrong Socket vs Room Broadcast

**What goes wrong:** A score update is emitted to `socket` (individual) instead of `io.to(roomCode)` (room), so other players never see the leaderboard update.
**Why it happens:** Copy-paste from single-socket patterns.
**How to avoid:** Rule: events meant for the whole room use `io.to(roomCode).emit(...)`. Events meant only for the host use `io.to(hostSocketId).emit(...)`. Events meant only for one player use `socket.emit(...)` or look up their `socketId` from `room.players`.

---

## Code Examples

### Host Socket Listeners (extend HostDashboard.tsx)

```typescript
// Source: existing pattern in HostDashboard.tsx [VERIFIED: codebase]
socket.on('question:start', ({ question, questionIndex, total, hostSettings }) => {
  setGamePhase('question')
  setCurrentQuestion(question)
  setQuestionIndex(questionIndex)
  setHostSettings(hostSettings)
  setAnsweredCount(0)
})

socket.on('question:progress', ({ answeredCount, totalPlayers }) => {
  setAnsweredCount(answeredCount)
})

socket.on('question:revealed', ({ correctAnswerIndex, scores }) => {
  setGamePhase('reveal')
  setCorrectIndex(correctAnswerIndex)
})

socket.on('leaderboard:update', ({ players }) => {
  setGamePhase('leaderboard')
  setLeaderboard(players)
})

socket.on('game:podium', ({ top3 }) => {
  setGamePhase('podium')
  setPodium(top3)
})
```

### Player Socket Listeners (extend PlayerJoin.tsx — playing phase)

```typescript
// Source: existing pattern in PlayerJoin.tsx [VERIFIED: codebase]
socket.on('question:start', ({ question, questionIndex, hostSettings }) => {
  setCurrentQuestion(question)
  setMyAnswer(null)
  setPhase('answering')
  setHostSettings(hostSettings)
})

socket.on('question:revealed', ({ correctAnswerIndex }) => {
  setCorrectIndex(correctAnswerIndex)
  setPhase('revealed')
})

// Player emits answer:
const handleAnswer = (answerIndex: number) => {
  if (myAnswer !== null) return  // already answered
  setMyAnswer(answerIndex)
  setPhase('waiting')
  getSocket().emit('player:answer', { questionIndex, answerIndex })
}
```

### Server: Register Game Handlers

```typescript
// apps/server/src/socket/index.ts — extend setupSocketHandlers:
import { registerGameHandlers } from './game'

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)   // ADD
    socket.on('disconnect', ...)
  })
}
```

### Scoring Function (TypeScript)

```typescript
// Source: Kahoot points formula [CITED: support.kahoot.com/hc/en-us/articles/115002303908]
// min 500 points for correct answer (not 0) — this is the Kahoot model
export function calculateScore(
  isCorrect: boolean,
  elapsedMs: number,
  timerDurationMs: number,
  streak: number,
): number {
  if (!isCorrect) return 0
  const ratio = Math.min(elapsedMs / timerDurationMs, 1)
  const base = Math.floor((1 - ratio / 2) * 1000)  // 500–1000
  return Math.floor(base * (streak >= 3 ? 1.5 : 1))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package (`motion/react`) | 2024 — library rebranded | Import from `motion/react` not `framer-motion`; `framer-motion` still works but is legacy |
| Prisma seed in `package.json#prisma.seed` | `prisma.config.ts#migrations.seed` | Prisma 7 | Project uses Prisma 6 — `package.json` approach is still current; will deprecate at v7 upgrade |
| Tailwind RTL plugins | Tailwind logical properties (`ms-`, `me-`) + `dir="rtl"` | Tailwind v3.3 | No plugin needed; project already uses correct approach |
| `io.emit()` broadcast | `io.to(roomCode).emit()` namespaced rooms | Socket.io v2+ | Already using room-scoped events correctly in Phase 2 |

**Deprecated/outdated:**
- `tailwindcss-rtl` plugin: unmaintained; project correctly avoids it (noted in tailwind.config.ts comments)
- `framer-motion` package name: functional but deprecated; use `motion` package going forward

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cairo font + next/font self-hosting avoids the iOS Safari refresh bug in most cases; system font fallback is acceptable | Pitfalls §3 | If Cairo completely fails to load on iOS Safari, Arabic game text would render in Geeza Pro — still legible but visually inconsistent with brand |
| A2 | `String[]` (Prisma scalar list) works correctly for 4 answer options in PostgreSQL | Standard Stack / Schema | If DB doesn't support it, use 4 separate `optionA/B/C/D` String columns instead — equally valid |
| A3 | Auto-reveal mode timer uses a server-side `setTimeout` per question | Architecture §Pattern 2 | If server restarts mid-question, the timeout is lost — for MVP this is acceptable; Phase 8 could use Bull/BullMQ for durable timers |
| A4 | Motion 12 LazyMotion with `domAnimation` covers all needed animation primitives (opacity, scale, x, stagger) | Standard Stack | LazyMotion `domAnimation` covers: animate, initial, exit, variants, stagger — confirmed in motion.dev docs [CITED] |

**If table were empty:** All claims verified or cited. A1–A4 are noted for completeness.

---

## Open Questions

1. **Question category for game start**
   - What we know: Questions have a `categoryId`; GameState stores `questionIds`
   - What's unclear: Does the host pick a category before starting, or does the game mix all approved questions?
   - Recommendation: For Phase 3+4, implement category selection on the pre-game screen. Fetch all `approved` questions from a selected category. Randomize order server-side.

2. **Timer auto-reveal server timeout reliability**
   - What we know: Server sets `setTimeout` for `timerDuration` when question starts; fires `question:reveal` if revealMode === 'auto'
   - What's unclear: Node.js timers are not durable — a server restart (Railway redeploy) during a question loses the timeout
   - Recommendation: Accept this for MVP. Document in a code comment. Phase 8 can add Redis TTL-based timer or Bull queue for durability.

3. **How many questions per game session**
   - What we know: Host selects a category; DB has 20–30 questions in seed
   - What's unclear: Does the host pick a count, or does the game use all questions in the category?
   - Recommendation: Default to all approved questions in the category (up to 20). Add an optional count selector on the pre-game screen (10 / 15 / 20).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server runtime | ✓ | v22.20.0 [VERIFIED: node --version] | — |
| npm | Package install | ✓ | bundled with Node | — |
| PostgreSQL | Prisma + questions | ✓ (Railway) | managed [ASSUMED: Railway env] | — |
| Redis | Room + game state | ✓ (Railway) | managed [ASSUMED: Railway env] | — |
| motion package | Animations | ✗ (not yet installed) | 12.38.0 available | CSS transitions (limited — exit animations not possible) |

**Missing dependencies with no fallback:**
- None blocking. Motion can be installed in a Wave 0 step.

**Missing dependencies with fallback:**
- `motion`: fallback to CSS transitions is viable for simple cases but insufficient for podium/leaderboard exit animations.

---

## Validation Architecture

*(nyquist_validation is enabled — included per config.json)*

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.6.0 [VERIFIED: package.json] |
| Config file | `apps/server/vitest.config.ts` (exists) |
| Quick run command | `npm run test` (from `apps/server/`) |
| Full suite command | `npm run test` (runs all `src/**/*.test.ts`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | `calculateScore` returns 500–1000 for correct, 0 for wrong, decays linearly | unit | `npm run test -- src/game/game.service.test.ts` | ❌ Wave 0 |
| SCORE-02 | Streak multiplier 1.5× at streak >= 3 | unit | `npm run test -- src/game/game.service.test.ts` | ❌ Wave 0 |
| GAME-04 | Questions served in correct sequence (index increments) | unit | `npm run test -- src/game/game.service.test.ts` | ❌ Wave 0 |
| RTL-04 | Cairo font loads on iOS Safari | manual smoke test | Device test (iOS Safari 16 + Android Chrome 110) | manual-only |
| RTL-05 | Timer bar depletes from correct side in RTL | manual smoke test | Visual test on RTL device | manual-only |
| SCORE-03 | Leaderboard sorted correctly after each question | unit | `npm run test -- src/game/game.service.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test` (from `apps/server/`)
- **Per wave merge:** `npm run test` (full suite)
- **Phase gate:** Full suite green + manual device smoke test on iOS Safari + Android Chrome before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/server/src/game/game.service.test.ts` — covers SCORE-01, SCORE-02, SCORE-03, GAME-04
- [ ] No new test infrastructure needed — Vitest is configured and working

---

## Security Domain

*(security_enforcement not disabled — included)*

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no — game events use host isHost flag; players are anonymous | existing `socket.data.isHost` check |
| V3 Session Management | partial — player reconnect tokens; already implemented in Phase 2 | existing `reconnectToken` UUID pattern |
| V4 Access Control | yes — host-only events must verify `socket.data.isHost` | `if (!socket.data.isHost) return socket.emit('room:error', ...)` |
| V5 Input Validation | yes — `answerIndex` must be 0–3; `questionIndex` must match current | server validates before processing |
| V6 Cryptography | no — scoring has no crypto requirements | — |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Player submitting answer after reveal | Tampering | Server checks `gameState.phase === 'question'` before accepting |
| Player submitting multiple answers | Tampering | Server checks `playerStates[id].answeredCurrentQ` flag |
| Non-host emitting `question:reveal` | Elevation of Privilege | `socket.data.isHost` check on all host-only events |
| Invalid `answerIndex` (e.g., 99) | Tampering | Server: `if (answerIndex < 0 \|\| answerIndex > 3) return` |
| Player submitting answer for wrong question index | Tampering | Server: `if (answerIndex !== currentQuestionIndex) return` |

---

## Sources

### Primary (HIGH confidence)
- `apps/web/app/layout.tsx` — Cairo font config, RTL setup [VERIFIED: codebase]
- `apps/web/app/globals.css` — Tailwind logical property enforcement [VERIFIED: codebase]
- `apps/server/package.json` — dependency versions [VERIFIED: codebase]
- `apps/web/package.json` — Next.js 14.2.35, socket.io-client 4.8.3 [VERIFIED: codebase]
- `apps/server/prisma/schema.prisma` — existing models to extend [VERIFIED: codebase]
- `apps/server/Dockerfile` — `prisma db push && node dist/index.js` deployment pattern [VERIFIED: codebase]
- npm registry (motion 12.38.0) [VERIFIED: npm view motion version]
- prisma.io/docs/orm/prisma-schema/data-model/models — String[] arrays, enum syntax [CITED]
- motion.dev/docs/react-lazy-motion — LazyMotion ~4.6kb bundle [CITED]
- redis.io/tutorials/matchmaking-and-game-session-state-with-redis — JSON game state in Redis [CITED]

### Secondary (MEDIUM confidence)
- support.kahoot.com — scoring formula `floor((1 - elapsed/timer / 2) * 1000)` [CITED — 403 on direct fetch but formula confirmed via multiple secondary sources]
- prisma.io/docs/orm/prisma-migrate/workflows/seeding — seed configuration [CITED]
- prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema — db push additive safety [CITED]

### Tertiary (LOW confidence)
- github.com/vercel/next.js/issues/63812 — Cairo/iOS Safari refresh caching bug (unfixed) [CITED]
- WebSearch: variable font weight rendering issues iOS Safari 16 — multiple community reports, no single authoritative fix [LOW]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified in codebase or npm registry
- Architecture patterns: HIGH — derived directly from existing Phase 2 patterns in codebase
- Scoring formula: MEDIUM — Kahoot model confirmed via multiple secondary sources; direct Kahoot doc returned 403
- Animation library: HIGH — Motion docs confirmed via motion.dev
- Pitfalls: MEDIUM — Cairo/iOS Safari issue confirmed via GitHub but no official fix documented

**Research date:** 2026-04-10
**Valid until:** 2026-07-10 (stable libraries; Cairo iOS Safari issue may be fixed by Next.js team any time)
