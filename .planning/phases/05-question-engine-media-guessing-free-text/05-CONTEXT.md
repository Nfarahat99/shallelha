# Phase 5: Question Engine — Media Guessing & Free Text — Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 adds the two remaining question types to the existing game loop: Media Guessing (GAME-02) and Free Text Entry (GAME-03). The Multiple Choice infrastructure from Phase 3+4 is already in place — this phase extends it without rewriting it.

**In scope:**
- `Question.type` enum added to Prisma schema: `MULTIPLE_CHOICE | MEDIA_GUESSING | FREE_TEXT`
- `Question.mediaUrl` optional field added to Prisma schema (Cloudinary URL)
- `QuestionPayload` extended with `type` and `mediaUrl?`
- Media Guessing: host screen shows progressively un-blurring image (CSS filter blur) or auto-playing audio; player sees only the blur/audio and submits a text guess mapped to one of 4 options
- Free Text: timer runs, players type on phone → answers stream to host screen live → voting phase after timer → scoring
- Cloudinary integration: server-side signed upload URL generation; client-side Cloudinary widget for Phase 7 admin; Phase 5 only needs the playback side (render from mediaUrl)
- New socket events for free text: `freetext:answer`, `freetext:vote`, `freetext:results`
- New GameState phase: `'voting'` (after free text timer expires, before reveal)
- Seed: add 5–10 media guessing questions (using real Cloudinary-hosted test images) + 5–10 free text questions
- Arabic UI: media reveal screen, typing input on player phone, free text answer feed on host, voting UI on player phone
- RTL: all logical props, Cairo font, consistent with Phase 3+4 patterns

**Out of scope:**
- Admin dashboard for question CRUD (Phase 7)
- Cloudinary upload widget / admin upload flow (Phase 7)
- Lifelines (Phase 6)
- Audio recording from players (not in PRD)

</domain>

<decisions>
## Implementation Decisions

### Question Type Architecture

**D-01: Question type as Prisma enum**

Add `QuestionType` enum to Prisma schema:
```prisma
enum QuestionType {
  MULTIPLE_CHOICE
  MEDIA_GUESSING
  FREE_TEXT
}
```

Add to `Question` model:
- `type QuestionType @default(MULTIPLE_CHOICE)`
- `mediaUrl String?` — Cloudinary full URL (null for MC and free text questions)

The `QuestionPayload` sent via socket extends to include `type` and `mediaUrl?`.

**D-02: Question type determined by DB — no pre-game host filter**

The host does not select which question types to include in pre-game settings. Type is embedded in each question record in the DB. When a category is played, questions appear in their natural order with whatever type they have. This keeps the pre-game settings screen simple and consistent with Phase 3+4.

### Media Guessing

**D-03: Image reveal — timer-driven CSS blur transition**

The image starts at `blur(20px)` and transitions to `blur(0px)` over the full timer duration using a CSS `transition: filter {timerDuration}ms linear`. This creates a smooth, continuous progressive reveal tied exactly to the timer clock.

If the host manually reveals early (presses "اكشف الإجابة"), the blur immediately drops to 0.

No staged step reveals — continuous is simpler and visually smoother.

**D-04: Audio reveal — auto-play at question:start, loop every 10s**

When `mediaUrl` points to an audio file (detected by file extension: `.mp3`, `.wav`, `.ogg`, `.m4a`), the player and host screens use an HTML5 `<audio>` element with `autoPlay` and `loop` attributes. The clip plays immediately when the question starts and continues looping until the answer is revealed.

No visual for audio questions except the question text and the 4 answer options (same MC layout). The audio is the guessing mechanic.

**D-05: Media Guessing scoring — same speed-based scoring as Multiple Choice**

Players select one of 4 options (same as MC). Scoring: 500–1000 pts based on speed, 1.5× streak multiplier. The correct answer is the `correctIndex` field — same server-side validation path as MC. No changes to `calculateScore`.

### Free Text Entry

**D-06: Player types on phone — 4 options still exist**

Free Text questions still have `options[]` and `correctIndex` in the DB (for seeding and validation), but they are NOT shown to the player on their phone. Instead, the player sees only the question text and a text input field. The player types their answer freely.

On the HOST screen, submitted answers are collected and displayed as they arrive. After the voting phase, the host reveals which answer was "correct" (matching `correctIndex` text, fuzzy).

Actually — simpler approach: Free Text is purely group-voted. There is NO "correct answer" in the traditional sense. The DB `options[]` field is unused for FREE_TEXT questions. The winner is determined by votes.

**D-07: Free text answers displayed live on host screen with emoji avatar**

As players submit free text answers, each answer appears on the host screen in a feed:
- Player's emoji avatar + their submitted text
- Anonymous ordering (shuffle before display to prevent bias)
- Max 80 characters per answer (enforced client-side)
- Arabic text right-aligned, Cairo font

The host sees answers filling in live during the timer.

**D-08: Voting phase after timer — 15-second vote window**

When the timer expires (or host clicks "اغلق الإجابات"), the game enters `'voting'` phase:
- All player answers are now locked (no new submissions)
- Host screen shows all collected answers for the room to read aloud
- Player phones switch to voting UI: they see all submitted answers and tap the one they like best
- Players CANNOT vote for their own answer
- Voting timer: 15 seconds (fixed, not configurable)

**D-09: Scoring — author of most-voted answer wins full points**

After voting closes:
- The answer with the most votes wins
- The author of the winning answer gets 800 points (flat, not speed-based — free text doesn't reward speed)
- All players who voted for the winning answer get 200 bonus points
- Ties on vote count: all tied answers are winners; all tied authors get 800 points
- Zero streak impact for free text questions (streak only counts MC and media guessing)

**D-10: New socket events for free text flow**

```
freetext:answer   player → server  { text: string }
freetext:answers  server → host    { answers: { playerId, emoji, text }[] }  (streamed live)
freetext:lock     server → all     { answers: { id, emoji, text }[] }  (voting starts; shuffled, no names)
freetext:vote     player → server  { answerId: string }
freetext:results  server → all     { winnerId: string, winnerText: string, votes: Record<string,string[]>, authorBonus: string[] }
```

**D-11: GameState extension for free text**

Add to `GameState`:
```typescript
freeTextAnswers?: Record<string, { text: string; votes: string[] }>  // playerId → answer + voters
votingDeadline?: number  // unix ms when voting closes
```

New `phase` value: `'voting'` — between free text timer expiry and reveal.

### Cloudinary Integration (Playback Only)

**D-12: Phase 5 uses Cloudinary URLs directly — no SDK needed**

For Phase 5, the frontend only RENDERS media (image from `mediaUrl`, audio from `mediaUrl`). No upload widget is needed — that's Phase 7. The `mediaUrl` stored in the DB is the full Cloudinary URL (e.g., `https://res.cloudinary.com/shallelha/image/upload/...`).

The server does NOT interact with Cloudinary in Phase 5. The URL is fetched from the DB and included in the `QuestionPayload`.

For seeding test data: manually upload 5–10 test images to Cloudinary and paste the resulting URLs into seed.ts.

**D-13: Image optimization — Next.js Image component with Cloudinary loader**

Host screen uses `<Image>` component with Cloudinary as the loader domain (add to `next.config.js`). The blur is applied via a CSS `filter` wrapper div over the Image component — NOT Cloudinary's blur transform (which would require regenerating the URL at each step).

Player phone for media guessing: shows the same blurred image (same CSS filter, same transition).

### Arabic UI

**D-14: Media Guessing host screen layout**

Same 3 layout variants as MC (2×2, 4-column, vertical) but the question text area is replaced by the media (image or audio icon). The answer options remain at the bottom with the same color-coding.

For image: the image takes up the top 60% of the screen with blur overlay. For audio: a large Arabic "استمع وخمّن 🎵" badge with a pulsing animation takes the top 60%.

**D-15: Free Text player input**

On the player phone:
- Question text at top (RTL, Cairo 700)
- Large textarea with Arabic placeholder "اكتب إجابتك هنا…" (dir="rtl", inputmode="text")
- "أرسل" (Send) button — disabled until at least 1 character typed
- After sending: waiting screen ("في انتظار بقية اللاعبين…") with the submitted text shown (greyed out)
- Voting UI: scrollable list of anonymous answers with a tap-to-select interaction

### Claude's Discretion

- Exact socket event timing (when to emit `freetext:answers` vs batch)
- CSS animation details for the audio "listening" indicator
- Exact Prisma migration strategy (additive — new enum value + nullable column)
- Error handling for empty free text submissions
- Vote deduplication (server enforces one vote per player per question)
- `next.config.js` Cloudinary domain allowlist

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — GAME-02, GAME-03 (full acceptance criteria)
- `.planning/PROJECT.md` — Non-negotiables: Arabic-first, Cloudinary for media (locked)
- `shallelha.md` — Full PRD

### Prior Phase Decisions (locked — do not rewrite)
- `.planning/phases/03-arabic-ui-host-display-player-controller/03-CONTEXT.md` — All game loop, socket patterns, RTL rules, scoring formula, host pacing (D-07)

### Existing Code to Extend (DO NOT rewrite from scratch)
- `apps/server/src/game/game.types.ts` — Extend `GameState`, `QuestionPayload`, add new types
- `apps/server/src/game/game.service.ts` — Extend `calculateScore` if needed; add free text scoring
- `apps/server/src/socket/game.ts` — Add new socket event handlers alongside existing ones
- `apps/server/prisma/schema.prisma` — Add `QuestionType` enum + fields to existing `Question` model
- `apps/server/prisma/seed.ts` — Add media + free text questions
- `apps/web/app/host/[roomCode]/game/HostGameScreen.tsx` — Extend with media + free text phases
- `apps/web/app/host/[roomCode]/game/QuestionDisplay.tsx` — Add media and free text variants
- `apps/web/app/join/[roomCode]/game/PlayerGameScreen.tsx` — Add free text input + voting UI
- `apps/web/app/join/[roomCode]/game/AnswerOptions.tsx` — Extend/replace for media guessing

### RTL / Tailwind Constraints (from Phase 3+4 — MANDATORY)
- **ALWAYS** use Tailwind logical properties: `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`
- **NEVER** use: `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`
- RTL via `dir="rtl"` on html + logical properties (no plugin)
- Cairo font: `font-[family-name:var(--font-cairo)]`, weights 400/600/700/900

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `QuestionDisplay.tsx` — 3 layout variants already built; extend with `type === 'MEDIA_GUESSING'` and `type === 'FREE_TEXT'` branches
- `AnswerOptions.tsx` — Arabic letter labels (أبجد), min-h-[80px] touch targets; reuse for MC variant in media guessing
- `PlayerTimerBar.tsx` — RTL scaleX already correct; reuse as-is
- `WaitingScreen.tsx` — "في انتظار اللاعبين…" — reuse for post-answer and post-freetext-submission states
- `LeaderboardOverlay.tsx` — AnimatePresence spring slide — reuse as-is for free text results

### Game Socket Pattern (Phase 3+4)
- `sendQuestion()` helper in game.ts dispatches `question:start` — extend to include `type` + `mediaUrl` in payload
- `questionCache` stores full question objects per room — extend to retain `type` and `mediaUrl`
- `requireHost()` middleware already in place for all host-triggered events
- `player:answer` handler validates `answeredCurrentQ` guard — add equivalent `votedCurrentQ` guard for free text voting

### Integration Points
- Add `QuestionType` enum to `game.types.ts` (mirrored from Prisma enum)
- `GameState.phase` currently: `'pre-game' | 'question' | 'reveal' | 'leaderboard' | 'ended'` — add `'voting'`
- `HostDashboard.tsx` state machine needs `'voting'` arm
- `PlayerGameScreen.tsx` needs `'voting'` arm (show vote UI)

</code_context>

<specifics>
## Specific Implementation Notes

- CSS blur transition: wrap `<Image>` in `<div style={{ filter: `blur(${blurPx}px)`, transition: `filter ${timerMs}ms linear` }}>` — blur starts at 20, set to 0 on reveal
- Audio: detect media type from URL extension in QuestionPayload; render `<audio autoPlay loop src={mediaUrl} />` hidden element
- Free text textarea: `dir="rtl"`, `lang="ar"`, `inputMode="text"`, `maxLength={80}`, Cairo font, min 3 rows
- Voting answers must be shuffled server-side before broadcasting `freetext:lock` to eliminate order bias
- Cloudinary domain in next.config.js: add `res.cloudinary.com` to `images.remotePatterns`
- Prisma migration: `prisma migrate dev` locally, `prisma db push` on Railway (already wired in Dockerfile CMD)

</specifics>

<deferred>
## Deferred Ideas

- Cloudinary upload widget for admin (Phase 7)
- Audio recording from players (not in PRD)
- "Audience votes on Free Text" — v2 requirement (AUD-02)
- Animated audio waveform visualizer — Phase 8 polish
- Free text moderation / profanity filter — Phase 8

</deferred>

---

*Phase: 05-question-engine-media-guessing-free-text*
*Context gathered: 2026-04-10 — all gray areas Claude's discretion (user directed researcher to handle)*
*Next: /gsd-plan-phase 5*
