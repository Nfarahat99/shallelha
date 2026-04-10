# Phase 5: Question Engine — Media Guessing & Free Text — Research

**Researched:** 2026-04-11
**Domain:** Socket.io game state extension · Prisma schema migration · CSS blur animation · HTML5 audio · Free text voting flow · Cloudinary image rendering · Arabic RTL UI
**Confidence:** HIGH — all findings grounded in direct codebase reads; no speculative library research needed

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `QuestionType` Prisma enum: `MULTIPLE_CHOICE | MEDIA_GUESSING | FREE_TEXT`. Add `type QuestionType @default(MULTIPLE_CHOICE)` and `mediaUrl String?` to `Question` model.

**D-02:** Question type embedded in DB record — host does not filter by type in pre-game settings.

**D-03:** Image reveal — continuous CSS blur transition `blur(20px)` → `blur(0px)` over full timer duration. No staged steps. Manual reveal immediately drops to `blur(0)`.

**D-04:** Audio — HTML5 `<audio autoPlay loop>`. Detected by URL extension (`.mp3 .wav .ogg .m4a`). No separate visual — question text + 4 answer options shown (same MC layout).

**D-05:** Media Guessing scoring — same `calculateScore()` path as MC. `correctIndex` in DB. No changes to the existing function.

**D-06:** Free Text — player sees question text + textarea (no options). Server collects answers. Winner by votes, not correctIndex. DB `options[]` field unused for FREE_TEXT.

**D-07:** Free text answers on host screen — emoji avatar + shuffled text. Max 80 chars. Anonymous order. Cairo font, RTL.

**D-08:** Voting phase — 15s fixed window after timer expires or host clicks "اغلق الإجابات". Players see all answers and tap one. Cannot vote for own answer.

**D-09:** Scoring — winning answer author: 800 pts flat. Voters for winner: 200 pts bonus. Ties: all tied authors win. No streak impact for FREE_TEXT.

**D-10:** New socket events:
- `freetext:answer` player→server `{ text: string }`
- `freetext:answers` server→host `{ answers: { playerId, emoji, text }[] }` (live stream)
- `freetext:lock` server→all `{ answers: { id, emoji, text }[] }` (shuffled, voting starts)
- `freetext:vote` player→server `{ answerId: string }`
- `freetext:results` server→all `{ winnerId, winnerText, votes, authorBonus[] }`

**D-11:** `GameState` extension:
```typescript
freeTextAnswers?: Record<string, { text: string; votes: string[] }>
votingDeadline?: number
```
New phase value: `'voting'`

**D-12:** Phase 5 frontend only RENDERS from `mediaUrl`. No Cloudinary SDK needed server-side.

**D-13:** Host screen uses Next.js `<Image>` with Cloudinary in `remotePatterns`. CSS `filter` wrapper div for blur (not Cloudinary transform).

**D-14:** Media Guessing host layout — same 3 variants as MC but question text area replaced by media. Image = top 60%. Audio = large "استمع وخمّن 🎵" badge with pulse animation.

**D-15:** Player free text input — `dir="rtl"`, `lang="ar"`, `inputMode="text"`, `maxLength={80}`, Cairo font, min 3 rows. "أرسل" button disabled until ≥1 char. Post-submit: waiting screen. Voting: scrollable tap-to-select list.

### Claude's Discretion

- Exact socket event timing (when to emit `freetext:answers` — per-submission vs batch)
- CSS animation details for the audio "listening" indicator
- Exact Prisma migration strategy (additive — new enum value + nullable column)
- Error handling for empty free text submissions
- Vote deduplication (server enforces one vote per player per question)
- `next.config.js` Cloudinary domain allowlist

### Deferred Ideas (OUT OF SCOPE)

- Cloudinary upload widget for admin (Phase 7)
- Audio recording from players (not in PRD)
- "Audience votes on Free Text" — v2 requirement (AUD-02)
- Animated audio waveform visualizer — Phase 8 polish
- Free text moderation / profanity filter — Phase 8
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-02 | Media Guessing questions show a progressively un-blurring image or play an audio clip | CSS blur transition pattern; HTML5 audio pattern; QuestionPayload extension; host/player component extension plan |
| GAME-03 | Free Text Entry questions collect open-ended player answers for group display and voting | freetext:* socket event architecture; GameState voting extension; VotingUI component plan; free text scoring function |
</phase_requirements>

---

## Summary

Phase 5 extends the existing Phase 3+4 game loop — it is a pure extension, not a rewrite. The codebase is well-structured for this: `game.types.ts`, `game.service.ts`, `socket/game.ts`, `HostDashboard.tsx`, and `PlayerJoin.tsx` all have clear seams where the new question types slot in.

The two primary work streams are:

1. **Schema + server** — Add `QuestionType` enum and `mediaUrl` field to Prisma, extend `QuestionData` and `GameState` interfaces, extend `sendQuestion()` to include `type`/`mediaUrl` in the payload, and add three new socket event handlers (`freetext:answer`, `freetext:vote`, and the voting timer logic) alongside the existing `player:answer` flow.

2. **Frontend** — Extend `QuestionDisplay.tsx` with media and free text branches on the host screen; extend `PlayerJoin.tsx` state machine with `'voting'` arm; add three new client components: `MediaQuestion.tsx` (blur wrapper + audio), `FreeTextInput.tsx` (textarea + submit), and `VotingUI.tsx` (scrollable answer list for voting phase). Update `next.config.mjs` to allowlist `res.cloudinary.com`.

The free text flow is the most complex new feature. The server must manage a `votingDeadline` timer independently (15 s), broadcast `freetext:lock` when the answer window closes, accept and deduplicate votes, then compute and broadcast results. This requires careful idempotency guards mirroring the existing `revealedCurrentQ` guard pattern.

**Primary recommendation:** Implement in three sequential waves — (1) schema + server interfaces, (2) media guessing end-to-end, (3) free text end-to-end — to keep PRs reviewable and testable.

---

## Standard Stack

### Core (all already installed — no new dependencies needed)
| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| Prisma | ^6 | Schema migration — add QuestionType enum + mediaUrl field | [VERIFIED: apps/server/package.json] |
| socket.io | ^4.8.3 | New freetext:* event handlers server-side | [VERIFIED: apps/server/package.json] |
| socket.io-client | ^4.8.3 | New freetext:* listeners client-side | [VERIFIED: apps/web/package.json] |
| Next.js | 14.2.35 | `<Image>` component for Cloudinary URLs | [VERIFIED: apps/web/package.json] |
| motion/react | ^12.38.0 | Already used — AnimatePresence for answer feed | [VERIFIED: apps/web/package.json] |
| Tailwind CSS | ^3.4.1 | All CSS including blur filter wrappers | [VERIFIED: apps/web/package.json] |

### No New Packages Required
Phase 5 uses zero new npm packages. All required capabilities are available:
- CSS `filter: blur()` — native browser CSS, no library
- HTML5 `<audio>` — native browser API, no library
- Cloudinary rendering — just a URL in `<Image src=...>`, no SDK

**Installation:** None needed.

---

## Architecture Patterns

### Recommended File Changes

```
apps/server/prisma/
├── schema.prisma          MODIFY — add QuestionType enum + Question.type + Question.mediaUrl
├── seed.ts                MODIFY — add media + free text questions with mediaUrl
└── migrations/            AUTO — generated by prisma migrate dev

apps/server/src/game/
├── game.types.ts          MODIFY — QuestionType, extend QuestionPayload, extend GameState, add FreeTextAnswer type
└── game.service.ts        MODIFY — add calculateFreeTextScore() function

apps/server/src/socket/
└── game.ts                MODIFY — extend sendQuestion(), extend QuestionData, add freetext handlers, add voting timer

apps/web/
├── next.config.mjs        MODIFY — add res.cloudinary.com to images.remotePatterns

apps/web/app/host/[roomCode]/
├── HostDashboard.tsx       MODIFY — add 'voting' to GamePhase, add freetext socket listeners, add freeTextAnswers state
└── game/
    ├── QuestionDisplay.tsx  MODIFY — add type prop, add MEDIA_GUESSING and FREE_TEXT branches
    ├── MediaQuestion.tsx    CREATE — image blur wrapper + audio element
    ├── FreeTextFeed.tsx     CREATE — live answer feed for host screen during free text
    ├── VotingDisplay.tsx    CREATE — host screen during voting phase (all answers visible)
    └── HostInGameControls.tsx MODIFY — add 'voting' arm to GamePhase union

apps/web/app/join/[roomCode]/
├── PlayerJoin.tsx          MODIFY — extend currentQuestion with type/mediaUrl, add voting arm, add freetext handlers
└── game/
    ├── FreeTextInput.tsx    CREATE — player textarea + submit button
    └── VotingUI.tsx         CREATE — player scrollable tap-to-vote list
```

### Pattern 1: QuestionPayload Extension (server)

Extend the existing `QuestionData` local interface in `game.ts` and `QuestionPayload` exported type in `game.types.ts`:

```typescript
// Source: existing apps/server/src/socket/game.ts — QuestionData interface
interface QuestionData {
  id: string
  text: string
  options: string[]
  correctIndex: number
  timerDuration: number
  // NEW:
  type: 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'
  mediaUrl?: string
}
```

Extend `sendQuestion()` payload to include `type` and `mediaUrl`:
```typescript
// Source: existing sendQuestion() in apps/server/src/socket/game.ts
const payload = {
  question: {
    text: question.text,
    options: question.options,
    timerDuration: question.timerDuration,
    type: question.type,          // NEW
    mediaUrl: question.mediaUrl,  // NEW (undefined for MC)
  },
  // ... rest unchanged
}
```

Extend `prisma.question.findMany` select to include the new fields:
```typescript
select: {
  id: true,
  text: true,
  options: true,
  correctIndex: true,
  timerDuration: true,
  type: true,       // NEW
  mediaUrl: true,   // NEW
}
```

### Pattern 2: CSS Blur Transition (host + player screens)

```tsx
// Source: D-03 + D-13 from CONTEXT.md — no external library needed
// Wrap Next.js <Image> in a filter div
<div
  style={{
    filter: revealed ? 'blur(0px)' : `blur(20px)`,
    transition: revealed ? 'filter 300ms ease-out' : `filter ${timerDuration * 1000}ms linear`,
  }}
  className="relative w-full h-full"
>
  <Image
    src={mediaUrl}
    alt="صورة السؤال"
    fill
    sizes="100vw"
    style={{ objectFit: 'cover' }}
    priority
  />
</div>
```

Key detail: transition changes when `revealed` flips. During question: linear over full timer. On reveal: fast 300ms ease-out.

### Pattern 3: HTML5 Audio Detect + Render

```typescript
// Source: D-04 — detect by URL extension
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a']

function isAudioUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0]  // strip query params
  return AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext))
}
```

```tsx
// Render in MediaQuestion.tsx
{isAudioUrl(mediaUrl) ? (
  <>
    <audio autoPlay loop src={mediaUrl} aria-label="مقطع صوتي للسؤال" />
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-8xl animate-pulse">🎵</div>
      <p className="text-2xl font-bold text-white font-[family-name:var(--font-cairo)]">
        استمع وخمّن
      </p>
    </div>
  </>
) : (
  // image blur wrapper (Pattern 2 above)
)}
```

### Pattern 4: Free Text Socket Flow (server)

The free text flow introduces a voting timer that runs independently on the server, mirroring the existing `autoRevealTimers` pattern:

```typescript
// Source: existing pattern in apps/server/src/socket/game.ts — autoRevealTimers Map
const votingTimers = new Map<string, NodeJS.Timeout>()

// Called when freetext timer expires (or host clicks "اغلق الإجابات"):
async function startVotingPhase(io: Server, roomCode: string): Promise<void> {
  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'question') return

  gameState.phase = 'voting'
  gameState.votingDeadline = Date.now() + 15_000
  await saveGameState(roomCode, gameState)

  // Shuffle answers before broadcast (D-08: eliminate order bias)
  const answers = Object.entries(gameState.freeTextAnswers ?? {}).map(([playerId, a]) => ({
    id: playerId,
    emoji: /* look up from room.players */,
    text: a.text,
  }))
  shuffle(answers)  // existing Fisher-Yates in game.ts

  io.to(roomCode).emit('freetext:lock', { answers })

  // Auto-close voting after 15s
  const timer = setTimeout(() => {
    void resolveVoting(io, roomCode)
  }, 15_000)
  votingTimers.set(roomCode, timer)
}
```

### Pattern 5: Free Text Scoring Function

Add to `game.service.ts` alongside `calculateScore`:

```typescript
// Source: D-09 from CONTEXT.md
export interface FreeTextResult {
  authorScores: Record<string, number>   // playerId → points earned
  voterScores: Record<string, number>    // playerId → bonus points
  winnerIds: string[]
  winnerText: string
}

export function calculateFreeTextScore(
  freeTextAnswers: Record<string, { text: string; votes: string[] }>,
): FreeTextResult {
  let maxVotes = 0
  for (const answer of Object.values(freeTextAnswers)) {
    maxVotes = Math.max(maxVotes, answer.votes.length)
  }

  const winnerIds: string[] = []
  const authorScores: Record<string, number> = {}
  const voterScores: Record<string, number> = {}
  let winnerText = ''

  for (const [playerId, answer] of Object.entries(freeTextAnswers)) {
    const isWinner = answer.votes.length === maxVotes && maxVotes > 0
    authorScores[playerId] = isWinner ? 800 : 0
    if (isWinner) {
      winnerIds.push(playerId)
      winnerText = answer.text
    }
    // Award bonus to voters for this answer if it won
    for (const voterId of answer.votes) {
      if (isWinner) {
        voterScores[voterId] = (voterScores[voterId] ?? 0) + 200
      }
    }
  }

  return { authorScores, voterScores, winnerIds, winnerText }
}
```

Edge case: if `maxVotes === 0` (nobody voted), no winner — all authorScores remain 0.

### Pattern 6: GameState Phase Union Extension

`GameState.phase` currently: `'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended'`

After Phase 5: `'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended' | 'voting'`

This flows through three places:
1. `game.types.ts` — the union type
2. `HostDashboard.tsx` `GamePhase` local type — add `'voting'`
3. `HostInGameControls.tsx` `GamePhase` type — add `'voting'`, update button states

### Pattern 7: next.config.mjs Cloudinary Allowlist

```javascript
// Source: skill next-best-practices/image.md + D-13 CONTEXT.md
// apps/web/next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
```

### Pattern 8: Prisma Schema Migration

Add to `schema.prisma` before the `Question` model:

```prisma
enum QuestionType {
  MULTIPLE_CHOICE
  MEDIA_GUESSING
  FREE_TEXT
}
```

Add to `Question` model:
```prisma
type     QuestionType @default(MULTIPLE_CHOICE)
mediaUrl String?
```

Migration commands:
- Local dev: `npx prisma migrate dev --name add-question-type`
- Railway (production): `npx prisma db push` (already wired in Dockerfile CMD per CONTEXT.md)

The migration is purely additive — existing questions get `type = MULTIPLE_CHOICE` (default) and `mediaUrl = NULL`. No data at risk.

### Pattern 9: Seed Extension

Add to `seed.ts` after existing questions:

```typescript
// Source: existing seed.ts pattern — idempotent upsert category, then createMany questions
// Media guessing — 5 questions with real Cloudinary URLs
const mediaQuestions = [
  {
    text: 'ما هذا المعلم الشهير؟',
    options: ['برج إيفل', 'برج خليفة', 'تاج محل', 'كولوسيوم'],
    correctIndex: 0,
    timerDuration: 25,
    type: 'MEDIA_GUESSING',
    mediaUrl: 'https://res.cloudinary.com/shallelha/image/upload/v.../eiffel.jpg',
  },
  // ... 4 more
]

// Free text — 5 questions
const freeTextQuestions = [
  {
    text: 'اكتب أول شيء يخطر ببالك عندما تسمع كلمة "الصحراء"',
    options: [],      // unused for FREE_TEXT
    correctIndex: 0,  // unused
    timerDuration: 30,
    type: 'FREE_TEXT',
    mediaUrl: null,
  },
  // ... 4 more
]
```

**Note on seed URLs:** Placeholder Cloudinary URLs must be replaced with real uploaded-and-approved URLs before running the seed. The planner should include a Wave 0 task for manually uploading test images to Cloudinary.

### Anti-Patterns to Avoid

- **Never compute blur percentage client-side from elapsed time** — the CSS transition handles it automatically from the initial style. Just set `blur(20px)` at question start and `blur(0px)` at reveal.
- **Never send `correctIndex` in `freetext:lock`** — FREE_TEXT has no correct answer. Sending it would expose data that doesn't exist.
- **Never accept `answerId` votes from players for their own answer** — server must check `gameState.freeTextAnswers[playerId]` exists and the voted `answerId !== playerId`.
- **Never reset `freeTextAnswers` on question:next without cleanup** — the voting timer must be cleared with `votingTimers.delete(roomCode)` when advancing.
- **Never use `ml-`/`mr-`/`pl-`/`pr-` in any new component** — always use logical properties `ms-`/`me-`/`ps-`/`pe-`.
- **Never use `text-left`/`text-right`** — use `text-start`/`text-end`.
- **Never use `<img>` for Cloudinary images** — use `<Image>` from `next/image` with `remotePatterns` configured.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS blur animation | Custom JS requestAnimationFrame loop updating filter | CSS `transition: filter Nms linear` on a wrapper div | Browser handles interpolation natively; zero JS cost |
| Audio type detection | MIME-type fetch or header inspection | Extension check on URL string (`.mp3`, `.wav`, `.ogg`, `.m4a`) | Cloudinary URLs always end with the extension; no network round-trip needed |
| Answer shuffling | Custom sort-by-random | Existing `shuffle()` Fisher-Yates already in `game.ts` | Code already exists — import and reuse |
| Voting timer | `setInterval` polling | `setTimeout` + Map pattern — identical to existing `autoRevealTimers` | Pattern already proven in the codebase |
| Free text scoring | Ad-hoc in socket handler | Dedicated `calculateFreeTextScore()` in `game.service.ts` | Testable in isolation with vitest, same as `calculateScore()` |

**Key insight:** This phase is fundamentally CSS + socket state, not complex algorithm work. The hardest part is the free text voting state machine — and even that follows the existing `autoRevealTimers` pattern exactly.

---

## Common Pitfalls

### Pitfall 1: Blur Transition Resets on Re-render
**What goes wrong:** React state update causes the blur div to re-mount, losing the in-progress CSS transition.
**Why it happens:** If `key` on the div changes or the component unmounts/remounts between question phases.
**How to avoid:** Wrap the `<Image>` + blur div at a stable level in the component tree. Do not key on `questionIndex` at the blur wrapper level — key on the outer question container instead. Set `filter` via inline `style` (not a Tailwind class) so it can be computed dynamically.
**Warning signs:** Blur jumps from 20px to 0px instantly on a transition that should be 20 seconds.

### Pitfall 2: Audio Autoplay Blocked by Browser
**What goes wrong:** `<audio autoPlay>` silently fails on mobile browsers (iOS Safari, Android Chrome) because browser autoplay policy requires user gesture.
**Why it happens:** Modern browsers block autoplay for audio without prior user interaction.
**How to avoid:** Since players have already tapped "انضم إلى الغرفة" (join button), there is user gesture context in the session. However, the audio element renders after a socket event — not directly after a tap. Safest approach: render the `<audio>` element but also show a "▶ استمع" tap button that calls `audioRef.current.play()` as a fallback if autoplay fails. Detect via the `<audio>` element's `onPlay`/`onError` events.
**Warning signs:** Audio never plays on iPhone; console shows "NotAllowedError: play() failed".

### Pitfall 3: freetext:vote Race — Player Votes After Results
**What goes wrong:** Player submits a vote just as the server resolves voting (15s timer fires), causing a late vote to land after `freetext:results` is broadcast and scores are already calculated.
**Why it happens:** Network latency means the player's vote packet arrives at the server after the timer fires.
**How to avoid:** In the `freetext:vote` handler, check `gameState.phase === 'voting'` before accepting. Same pattern as `player:answer` checking `gameState.phase !== 'question'`. Apply `votedCurrentQ` flag per player identical to `answeredCurrentQ`.
**Warning signs:** Score discrepancies between what's shown and what's stored; votes counted after reveal.

### Pitfall 4: freeTextAnswers Not Reset Between Questions
**What goes wrong:** Free text answers from question N bleed into question N+1's state in Redis.
**Why it happens:** `GameState.freeTextAnswers` and `votingDeadline` are only set, never explicitly cleared when advancing.
**How to avoid:** In `question:next` handler, reset `freeTextAnswers` to `{}` and `votingDeadline` to `undefined` before calling `sendQuestion()`. Also clear `votingTimers.get(roomCode)` with `clearTimeout` + `delete`.
**Warning signs:** Voting UI on question 2 shows answers from question 1.

### Pitfall 5: Cloudinary URL in seed.ts uses placeholder
**What goes wrong:** Seed runs successfully but questions have broken image URLs; media guessing questions show broken image icons instead of content.
**Why it happens:** Placeholder Cloudinary URLs in seed.ts haven't been replaced with real uploaded content.
**How to avoid:** Wave 0 task must include manually uploading 5–10 test images to Cloudinary and capturing the real URLs before adding to seed.ts. Alternatively use a single working public Cloudinary test image URL for all 5 seed questions during development.
**Warning signs:** `<Image>` renders with error state; browser network tab shows 404 from res.cloudinary.com.

### Pitfall 6: QuestionType Enum on Prisma Client Import
**What goes wrong:** `import { QuestionStatus } from '@prisma/client'` in `game.ts` needs to be extended to also import `QuestionType`, but the regenerated client won't have it until after `prisma generate` runs.
**Why it happens:** Prisma client is generated — schema changes require regeneration before TypeScript can see the new enum.
**How to avoid:** Wave 0 step: `npx prisma migrate dev --name add-question-type && npx prisma generate`. After this, `QuestionType` is importable from `@prisma/client`.
**Warning signs:** TypeScript error "Module '@prisma/client' has no exported member 'QuestionType'".

### Pitfall 7: next.config.mjs Extension Mismatch
**What goes wrong:** `next.config.mjs` vs `next.config.js` — the project uses `.mjs` (confirmed from codebase read). Editing the wrong file causes no effect.
**Why it happens:** Developer creates `next.config.js` while `.mjs` exists.
**How to avoid:** Confirm extension before editing. Project file is `apps/web/next.config.mjs` using ESM `export default` syntax.
**Warning signs:** `<Image>` with Cloudinary URL still throws "hostname not configured" despite editing config.

---

## Code Examples

### QuestionType enum + model fields (Prisma)
```prisma
// Source: CONTEXT.md D-01 + existing schema.prisma pattern
enum QuestionType {
  MULTIPLE_CHOICE
  MEDIA_GUESSING
  FREE_TEXT
}

model Question {
  // ... existing fields unchanged ...
  type     QuestionType @default(MULTIPLE_CHOICE)
  mediaUrl String?
}
```

### Extended GameState (game.types.ts)
```typescript
// Source: CONTEXT.md D-11 + existing game.types.ts
export type QuestionType = 'MULTIPLE_CHOICE' | 'MEDIA_GUESSING' | 'FREE_TEXT'

export interface FreeTextAnswer {
  text: string
  votes: string[]  // array of voter playerIds
}

export interface GameState {
  questionIds: string[]
  currentQuestionIndex: number
  phase: 'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended' | 'voting'
  questionStartedAt: number
  timerDuration: number
  playerStates: Record<string, PlayerGameState>
  hostSettings: HostSettings
  revealedCurrentQ?: boolean
  // NEW:
  freeTextAnswers?: Record<string, FreeTextAnswer>  // playerId → answer
  votingDeadline?: number  // unix ms
}

export interface QuestionPayload {
  text: string
  options: string[]
  timerDuration: number
  // NEW:
  type: QuestionType
  mediaUrl?: string
}
```

### PlayerGameState extension for voting guard
```typescript
// Source: existing PlayerGameState in game.types.ts
export interface PlayerGameState {
  score: number
  streak: number
  answeredCurrentQ: boolean
  lastAnswerTime?: number
  // NEW:
  votedCurrentQ?: boolean  // free text voting deduplication guard
}
```

### freetext:answer handler skeleton
```typescript
// Source: existing player:answer pattern in game.ts — follow the same structure
socket.on('freetext:answer', async (data: { text: string }) => {
  const roomCode: string = socket.data.roomCode
  if (!roomCode) return

  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'question') return

  const { text } = data ?? {}
  if (!text || typeof text !== 'string' || text.trim().length === 0) return
  const trimmed = text.trim().slice(0, 80)  // server-side enforce maxLength

  const playerId: string = socket.data.reconnectToken
  if (!playerId || !gameState.playerStates[playerId]) return

  // One answer per player per question
  if (gameState.freeTextAnswers?.[playerId]) return

  gameState.freeTextAnswers = gameState.freeTextAnswers ?? {}
  gameState.freeTextAnswers[playerId] = { text: trimmed, votes: [] }
  await saveGameState(roomCode, gameState)

  // Broadcast updated answer list to host (live feed — emit on every submission)
  const room = await getRoom(roomCode)
  const answers = Object.entries(gameState.freeTextAnswers).map(([pid, a]) => {
    const player = room?.players.find(p => p.id === pid)
    return { playerId: pid, emoji: player?.emoji ?? '❓', text: a.text }
  })
  io.to(roomCode).emit('freetext:answers', { answers })
})
```

### freetext:vote handler skeleton
```typescript
// Source: existing player:answer pattern
socket.on('freetext:vote', async (data: { answerId: string }) => {
  const roomCode: string = socket.data.roomCode
  if (!roomCode) return

  const gameState = await getGameState(roomCode)
  if (!gameState || gameState.phase !== 'voting') return  // reject after results

  const playerId: string = socket.data.reconnectToken
  if (!playerId || !gameState.playerStates[playerId]) return

  // Deduplicate votes
  if (gameState.playerStates[playerId].votedCurrentQ) return
  gameState.playerStates[playerId].votedCurrentQ = true

  const { answerId } = data ?? {}
  if (!answerId) return

  // Cannot vote for own answer
  if (answerId === playerId) return

  // answerId must exist
  if (!gameState.freeTextAnswers?.[answerId]) return

  gameState.freeTextAnswers[answerId].votes.push(playerId)
  await saveGameState(roomCode, gameState)
})
```

### Host screen FreeTextFeed component (sketch)
```tsx
// Source: D-07 CONTEXT.md + existing component patterns
'use client'

interface FreeTextFeedProps {
  answers: Array<{ playerId: string; emoji: string; text: string }>
}

export function FreeTextFeed({ answers }: FreeTextFeedProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3">
      {answers.map((a) => (
        <div key={a.playerId} className="flex items-start gap-3 bg-gray-800 rounded-xl px-4 py-3">
          <span className="text-2xl shrink-0">{a.emoji}</span>
          <p className="text-white text-lg font-[family-name:var(--font-cairo)] text-start leading-relaxed">
            {a.text}
          </p>
        </div>
      ))}
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `blur(20px)` set via `className` with Tailwind arbitrary value | CSS `filter` set via inline `style` with dynamic value | N/A — choose inline style | Tailwind can't interpolate dynamic pixel values at runtime; inline style is correct here |
| `<img>` tag for remote images | `<Image>` from `next/image` with `remotePatterns` | Next.js 13+ | Automatic optimization, lazy loading, AVIF/WebP conversion |
| Polling Redis for voting state | setTimeout-based server timer + socket broadcast | Same pattern as existing `autoRevealTimers` | Consistent with existing architecture |

**No deprecated approaches apply to this phase's tech stack.**

---

## Codebase Insight: Existing Seams

### What can be reused AS-IS (zero changes needed):
- `PlayerTimerBar.tsx` — RTL scaleX timer bar; works for both MC and free text (just pause when phase = 'voting')
- `WaitingScreen.tsx` — reuse for post-free-text-submission state (player waiting for voting to start)
- `LeaderboardOverlay.tsx` — reuse for showing free text results after voting
- `PodiumScreen.tsx` — no changes needed
- `calculateScore()` — no changes; media guessing uses it directly
- `shuffle()` in `game.ts` — already exists; reuse for answer shuffling before `freetext:lock`
- `requireHost()` — already exists; use for `question:lock-freetext` host action
- `autoRevealTimers` Map pattern — template for `votingTimers` Map

### What needs extension (surgical changes):
- `QuestionDisplay.tsx` — add `type` and `mediaUrl` props; add conditional branches for `MEDIA_GUESSING` and `FREE_TEXT`
- `HostInGameControls.tsx` — extend `GamePhase` union to include `'voting'`; add "اغلق الإجابات" button active during `'question'` phase for free text
- `HostDashboard.tsx` — add `freeTextAnswers` state, `votingDeadline` state; add socket listeners for `freetext:answers`, `freetext:lock`, `freetext:results`; add `'voting'` render arm
- `PlayerJoin.tsx` — extend `currentQuestion` to include `type`/`mediaUrl`; add `'voting'` to `PlayerPhase`; add socket listeners for `freetext:lock`, `freetext:results`; add `handleFreeTextSubmit` and `handleVote` callbacks
- `game.ts` — extend `sendQuestion()`, add `freetext:*` handlers, add `votingTimers` Map, add voting cleanup in `question:next`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server runtime | Yes | v22.20.0 | — |
| npm | Package management | Yes | 10.9.3 | — |
| Prisma CLI | Schema migration | Yes (in node_modules) | ^6 | — |
| PostgreSQL | DB (Railway) | Assumed live on Railway | — | Local Docker if needed |
| Redis | Game state (Railway) | Assumed live on Railway | — | — |
| Cloudinary account | Media URL seeding | [ASSUMED] account 'shallelha' exists | — | Use any public image URL for dev |

**No missing dependencies block this phase.** All code-level dependencies are already installed. Cloudinary is needed only for seeding URLs — any valid HTTPS image URL works for development.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^1.6.0 |
| Config file | `apps/server/vitest.config.ts` |
| Quick run command | `cd apps/server && npm test` |
| Full suite command | `cd apps/server && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-02 | `calculateScore()` unchanged by media guessing (reuse) | unit | `npm test -- --grep "calculateScore"` | Yes (`game.service.test.ts`) |
| GAME-02 | `isAudioUrl()` correctly identifies audio vs image URLs | unit | `npm test -- --grep "isAudioUrl"` | No — Wave 0 |
| GAME-02 | `sendQuestion()` payload includes `type` and `mediaUrl` | unit | `npm test -- --grep "sendQuestion"` | No — Wave 0 |
| GAME-03 | `calculateFreeTextScore()` awards 800 to winner, 200 to voters | unit | `npm test -- --grep "calculateFreeTextScore"` | No — Wave 0 |
| GAME-03 | `calculateFreeTextScore()` handles ties correctly (all tied get 800) | unit | `npm test -- --grep "calculateFreeTextScore"` | No — Wave 0 |
| GAME-03 | `calculateFreeTextScore()` returns no winner when zero votes | unit | `npm test -- --grep "calculateFreeTextScore"` | No — Wave 0 |
| GAME-03 | Vote deduplication: `votedCurrentQ` guard rejects second vote | unit | `npm test -- --grep "freetext vote"` | No — Wave 0 |
| GAME-03 | Player cannot vote for own answer | unit | `npm test -- --grep "freetext vote"` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/server && npm test`
- **Per wave merge:** `cd apps/server && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/server/src/game/__tests__/game.service.test.ts` — extend with `calculateFreeTextScore` tests (5 cases)
- [ ] `apps/server/src/game/__tests__/free-text-scoring.test.ts` — OR extend existing `game.service.test.ts`
- [ ] `apps/server/src/game/__tests__/media-utils.test.ts` — `isAudioUrl()` tests

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Socket auth already in place from Phase 3+4 |
| V3 Session Management | No | Reconnect token pattern unchanged |
| V4 Access Control | Yes | `requireHost()` for host-only events; `votedCurrentQ` guard for vote deduplication |
| V5 Input Validation | Yes | Free text: `maxLength=80` server-side trim + slice; `answerId` existence check before accepting vote |
| V6 Cryptography | No | No crypto operations in this phase |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Player submits free text answer after timer | Tampering | `gameState.phase !== 'question'` guard in `freetext:answer` handler |
| Player votes multiple times | Tampering | `votedCurrentQ` boolean flag on `PlayerGameState` (same as `answeredCurrentQ`) |
| Player votes for own answer | Tampering | `if (answerId === playerId) return` — server-enforced |
| Invalid `answerId` in vote | Tampering | `if (!gameState.freeTextAnswers?.[answerId]) return` |
| XSS via player-submitted free text | Tampering | Text is rendered in React JSX (auto-escaped); never use `dangerouslySetInnerHTML` |
| `mediaUrl` replaced by malicious URL | Tampering | `mediaUrl` only comes from DB (server-controlled); never accepted from client at runtime |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudinary account 'shallelha' exists and test images can be manually uploaded before seeding | Environment Availability | Seed contains broken URLs; dev testing blocked until images uploaded — use any public HTTPS image URL as stand-in |
| A2 | Railway and Vercel deployments from Phase 3+4 are live and DATABASE_URL/REDIS_URL env vars are active | Environment Availability | Migration step `prisma db push` fails — requires env var setup |
| A3 | The `shuffle()` function in `game.ts` is exported or accessible — currently it is a module-private function | Code Examples | Answer shuffling for `freetext:lock` needs its own implementation if `shuffle` stays private — trivial to add or duplicate |

---

## Open Questions (RESOLVED)

1. **`shuffle()` visibility in game.ts** — **RESOLVED: Keep in `game.ts` (module-private, same file)**
   - What we know: `shuffle()` is declared as a module-private function in `game.ts` — not exported. It's used internally for `questions`.
   - Decision: `shuffle()` stays as a module-private function in `game.ts`. The `startVotingPhase` handler (Plan 03) calls `shuffle(answers)` inside the same file — no export needed. This is consistent with the existing pattern and avoids unnecessary refactoring.

2. **Host "اغلق الإجابات" button placement** — **RESOLVED: Replace "اكشف الإجابة" slot for FREE_TEXT questions**
   - What we know: `HostInGameControls.tsx` has a fixed set of buttons (`اكشف الإجابة`, `التالي`, `عرض النتائج`, `إنهاء اللعبة`).
   - Decision: When `currentQuestion.type === 'FREE_TEXT'`, the "اكشف الإجابة" button slot is replaced by "اغلق الإجابات". Same button position, different label and action. Avoids UI complexity. Implemented in Plan 03 Task 2 Part C.

3. **Player phone during media guessing — blur the image on player too?** — **RESOLVED: Yes, player phone shows same blurred image**
   - What we know: CONTEXT.md D-03 specifics: "Player and host screens use the same CSS filter". `QuestionPayload` includes `mediaUrl`.
   - Decision: Player phone renders the blurred image with the same CSS `filter: blur()` transition — unblurs over timer duration. 4 answer buttons appear below the image. Implemented in Plan 02 Task 2 Part C.

---

## Sources

### Primary (HIGH confidence — verified from codebase)
- `apps/server/src/game/game.types.ts` — Full interface definitions, current `GameState` and `QuestionPayload`
- `apps/server/src/game/game.service.ts` — `calculateScore`, `saveGameState`, `getGameState`, Redis pattern
- `apps/server/src/socket/game.ts` — Full socket handler code, `autoRevealTimers` Map pattern, `sendQuestion()`, `shuffle()`, `requireHost()`, `questionCache`
- `apps/server/prisma/schema.prisma` — Current schema (no QuestionType yet), existing `QuestionStatus` enum pattern
- `apps/server/prisma/seed.ts` — Seeding pattern, upsert by slug, question creation
- `apps/web/app/host/[roomCode]/HostDashboard.tsx` — Full state machine, all socket listeners, render phases
- `apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx` — 3 layout variants, OPTION_COLORS, ARABIC_LETTERS
- `apps/web/app/host/[roomCode]/game/HostInGameControls.tsx` — Button state management by GamePhase
- `apps/web/app/join/[roomCode]/PlayerJoin.tsx` — Full player state machine, answer flow, all socket listeners
- `apps/web/app/join/[roomCode]/game/AnswerOptions.tsx` — Touch target spec (min-h-[80px]), color classes
- `apps/web/app/join/[roomCode]/game/WaitingScreen.tsx` — Arabic waiting copy, spinner pattern
- `apps/web/app/join/[roomCode]/game/PlayerTimerBar.tsx` — RTL transform-origin: 'right' pattern
- `apps/web/next.config.mjs` — Current config (no remotePatterns yet)
- `apps/server/vitest.config.ts` — Test framework config
- `apps/server/src/game/__tests__/game.service.test.ts` — Existing test patterns, vi.mock Redis pattern
- `.planning/phases/05-question-engine-media-guessing-free-text/05-CONTEXT.md` — All locked decisions

### Secondary (MEDIUM confidence)
- `.claude/skills/next-best-practices/image.md` — `next/image` remotePatterns configuration pattern

### Tertiary (LOW confidence)
- [ASSUMED] Cloudinary account named 'shallelha' is provisioned and accessible

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json files
- Architecture: HIGH — all extension points verified from actual source files
- Pitfalls: HIGH — grounded in specific code patterns found in codebase reads
- Prisma migration: HIGH — schema verified, migration pattern confirmed from skills + existing QuestionStatus enum pattern

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable stack)
