# Phase 3: Arabic UI — Host Display & Player Controller — Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

> **Scope note:** By user decision, Phase 3 (Arabic UI) and Phase 4 (Question Engine) are merged
> into this single phase. Screens are designed around real game state from day one.
> This context covers both the UI layer AND the game engine (questions, answers, scoring, leaderboard).

<domain>
## Phase Boundary

Phase 3+4 delivers the complete game loop: host sees a full-screen Arabic game display, players answer on their phones, the server validates answers and calculates scores, and the leaderboard is shown between questions. At the end of this phase, a real group of 2–8 players can play a full game session with multiple questions, scoring, streaks, and a final podium — all in Arabic RTL.

**In scope:**
- Host game screen: full-screen landscape layout (TV/PC 16:9), question + options + timer + player indicators
- Player mobile controller: portrait answer UI, timer bar, post-answer waiting state
- Host pre-game configuration: layout style, timer style, reveal behavior
- Host in-game controls: reveal answer, next question, show leaderboard, end game
- PostgreSQL schema: Question + Category tables (added alongside existing NextAuth tables)
- Prisma seed script: 20–30 Arabic test questions across 2–3 categories
- Game loop socket events: question:start, player:answer, question:end, score:update, leaderboard:update, game:end
- Speed-based scoring + streak multiplier (3+ consecutive correct)
- Leaderboard broadcast after each question (host-triggered)
- Final podium (top 3) at game end
- Cairo Arabic font rendering verified on iOS Safari 16+ and Android Chrome 110+
- Cross-browser smoke test

**Out of scope (later phases):**
- Media Guessing questions (Phase 5)
- Free Text Entry questions (Phase 5)
- Lifelines (Phase 6)
- Admin dashboard UI (Phase 7 — questions go in via seed script for now)
- Player accounts / persistent stats (v2)

</domain>

<decisions>
## Implementation Decisions

### Host Game Screen Layout

**D-01: Answer options layout — host-selectable before game starts**

The host picks their preferred layout from a pre-game settings screen before clicking "Start Game":
- **2×2 grid** (Kahoot style — 4 colored quadrants, top-left/top-right/bottom-left/bottom-right)
- **4-column bar** (horizontal strip at bottom of screen, all 4 options in a row)
- **Vertical stack** (question left 2/3, options stacked in right 1/3)

Default if not configured: 2×2 grid.

**D-02: Timer display — host-selectable before game starts**

The host picks from:
- **Full-width progress bar** across the top of the screen
- **Large countdown circle** (centered above the question)
- **Big number only** (corner of screen)

Default: full-width progress bar.

**D-03: Player answer indicators — emoji avatars light up**

While a question is active, player emoji avatars appear at the bottom of the host screen. As each player submits an answer, their avatar lights up (animated highlight). No answer is revealed — just "answered vs waiting". Shows momentum and social engagement without spoiling answers.

### Player Mobile Controller

**D-04: Answer buttons mirror host layout**

The player's 4 answer buttons use the same layout the host configured (2×2 grid, 4-column, or vertical stack). This creates a consistent visual mapping between the TV and the phone — players can orient quickly.

**D-05: Timer — thin progress bar at top edge**

A thin progress bar runs across the very top of the player's phone screen, depleting in real time. Present but not distracting — focus stays on the answer buttons.

**D-06: Post-answer state — waiting screen**

After the player taps an answer:
- Their chosen answer remains highlighted
- Other options grey out
- A spinner appears with the text "في انتظار اللاعبين…"
- No right/wrong shown until the host reveals the answer

### Game Flow — Host Controls Everything

**D-07: Host drives all game pacing**

The host has full control at every stage. The timer is a visual countdown for players but does NOT auto-advance the game. Host taps:
1. **"اكشف الإجابة"** (Reveal Answer) — shows correct answer with highlight + wrong answers dimmed
2. **"التالي"** (Next Question) — loads the next question
3. **"عرض النتائج"** (Show Leaderboard) — slides in the leaderboard overlay
4. **"إنهاء اللعبة"** (End Game) — shows final podium

**D-08: Reveal timing — pre-game host configuration**

Before starting the game, host configures whether:
- **Auto-reveal:** Correct answer reveals automatically when timer hits 0 (host then taps "التالي")
- **Manual reveal:** Timer ends, question stays up, host taps "اكشف الإجابة" when ready

This gives hosts who want to add commentary or dramatic tension control over the moment of reveal.

**D-09: Leaderboard — host-triggered after each question**

After revealing the answer, host taps "عرض النتائج" to show the leaderboard. The host decides when to show it (not every question is required). Host taps "التالي" from the leaderboard to load the next question.

### Question Data

**D-10: Questions stored in PostgreSQL via Prisma**

A new Prisma schema is added for questions (alongside existing NextAuth tables):
- `Category` — name (Arabic), slug
- `Question` — text (Arabic), 4 options (A/B/C/D), correct answer index, category, timer duration (15/20/30s), status (draft/approved/live)

Questions are editable by admin and host (Phase 7 admin UI will manage them; for now they go in via seed script and are directly editable in the DB).

**D-11: Seed script with 20–30 test questions**

`apps/server/prisma/seed.ts` populates:
- 2–3 Arabic categories (e.g. "ثقافة عامة", "رياضة", "ترفيه")
- 20–30 approved multiple-choice questions per category
- All questions in Arabic, culturally appropriate for Gulf audience

### Scoring

**D-12: Speed-based scoring — Claude's discretion on formula**

Industry-standard approach (Kahoot model):
- Max 1000 points for answering instantly
- Minimum 500 points for correct answer in the last second
- Linear decay between 0 and timer duration
- Wrong answer: 0 points

**D-13: Streak multiplier after 3 consecutive correct answers**

After 3+ correct answers in a row, a 1.5× multiplier applies to the base score.
Streak resets on any wrong answer or missed question (timer expiry with no answer = wrong).

### Claude's Discretion

- Socket event naming (`question:start`, `player:answer`, `question:end`, `leaderboard:update`, `game:podium`)
- Animation library (CSS transitions vs Framer Motion — researcher to evaluate)
- Specific color palette for answer options (accessibility-safe contrast on TV)
- Component file structure (host game screen split into sub-components)
- Error handling (player disconnects mid-question, late answers after reveal)
- How "correct answer" is broadcast (event name, payload shape)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — RTL-01 through RTL-05, GAME-01, GAME-04, GAME-05, SCORE-01 through SCORE-04 (full acceptance criteria)
- `.planning/PROJECT.md` — Non-negotiables: Arabic-first, 60-second join, iOS Safari 16+ / Android Chrome 110+
- `shallelha.md` — Full PRD with product decisions

### Phase 2 Decisions (already implemented — build on these)
- `.planning/phases/02-room-system-real-time-core/02-CONTEXT.md` — Room system, socket patterns, reconnect logic

### Existing Code to Extend (DO NOT rewrite from scratch)
- `apps/web/app/host/[roomCode]/HostDashboard.tsx` — Extend with game screen states (currently lobby only)
- `apps/web/app/join/[roomCode]/PlayerJoin.tsx` — Extend `playing` phase (currently placeholder)
- `apps/web/components/ui/EmojiPicker.tsx` — Reuse as player indicator avatars on host screen
- `apps/web/components/ui/PlayerCard.tsx` — Reuse in lobby; may need score variant for leaderboard
- `apps/web/components/ui/HostControls.tsx` — Extend with in-game controls (reveal, next, leaderboard)
- `apps/web/app/layout.tsx` — Cairo font + dir="rtl" already set — do not change
- `apps/web/app/globals.css` — RTL convention enforced — always use logical properties

### RTL / Tailwind Constraints
- **ALWAYS** use Tailwind logical properties: `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`
- **NEVER** use: `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`
- No tailwindcss-rtl plugin (unmaintained) — RTL via `dir="rtl"` on html + logical properties

### Backend
- `apps/server/src/socket/room.ts` — Existing room handlers to extend with game events
- `apps/server/src/room/room.service.ts` — Redis room state (add game state fields)
- `apps/server/prisma/schema.prisma` — Add Question + Category models alongside existing NextAuth tables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EmojiPicker` — 16 emoji options, 44px touch targets, grid layout — can be reused for player indicators on host screen
- `PlayerCard` — name + emoji + optional badge — extend with score display for leaderboard
- `HostControls` — start/end buttons — needs in-game variant (reveal/next/leaderboard/end)
- `Cairo` font — arabic + latin subsets, weights 400/600/700/900 — already loaded via CSS variable

### Established Patterns
- Server Components call `auth()`, Client Components receive data as props (see HostDashboard + page.tsx pattern)
- Socket singleton via `getSocket()` — `autoConnect: false`, caller calls `.connect()`
- Socket auth: `socket.auth = { userId }` — already established
- Redis room state stored as hash `room:{roomCode}` with players JSON array
- All Tailwind classes use logical properties — enforced in globals.css comments

### Integration Points
- `HostDashboard.tsx` already listens to `game:started` and `game:ended` events — add `question:start`, `player:answer`, `question:end`, `leaderboard:update`
- `PlayerJoin.tsx` already has `playing` phase state — replace placeholder with real answer UI
- `apps/server/src/socket/room.ts` — add game event handlers alongside existing room handlers
- Prisma schema already has `prisma db push` on Railway startup — adding models just requires schema update + redeploy

</code_context>

<specifics>
## Specific Ideas

- **Jackbox Games** is the reference UX model — host on TV, phones as controllers, co-located players
- Host screen must be readable from across a room — large text, high contrast, no small UI elements
- Player emoji avatars used as answer indicators on host screen (consistent with lobby identity)
- Arabic question text must be right-aligned, font-weight 700+ for visibility on TV
- Room code display on host screen during game (small, corner) so latecomers can still join in lobby phase
- Pre-game host settings screen: layout picker + timer style picker + reveal mode toggle — before "ابدأ اللعبة"
- "في انتظار اللاعبين…" spinner text on player phone after answering (D-06)
- Final podium: top 3 players with emoji + name + score, animated entrance (1st place last for drama)

</specifics>

<deferred>
## Deferred Ideas

- Media Guessing questions (image blur / audio) — Phase 5
- Free Text Entry questions with group voting — Phase 5
- Lifelines (Double Points, Remove Two, Freeze Opponent) — Phase 6
- Admin dashboard UI for question CRUD — Phase 7
- Player accounts + persistent stats — v2
- QR code on host screen for players to scan and join — noted, deferred
- Sound effects / background music — noted, deferred to Phase 8 polish
- Audience mode — v2 requirement

</deferred>

---

*Phase: 03-arabic-ui-host-display-player-controller*
*Scope: Phase 3 + Phase 4 merged by user decision*
*Context gathered: 2026-04-10 via /gsd-discuss-phase 3 --text*
