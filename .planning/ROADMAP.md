# Roadmap: Sha'lelha (شعللها) — v1.0

**Milestone:** MVP — Public Launch Ready
**Goal:** A polished, publicly accessible Arabic group gaming platform where any group can play a complete session within 60 seconds of discovering the site.

---

## Phase 1: Project Foundation & Infrastructure

**Goal:** Establish the monorepo structure, configure all tooling, and deploy a working skeleton to production with health checks passing.

**Covers:** INFRA-01, INFRA-04
**Delivers:**
- Next.js 14 (App Router) project with Tailwind CSS and RTL config
- Node.js + Express + Socket.io backend
- PostgreSQL schema via Prisma ORM
- Redis connection and room state structure
- Vercel (frontend) + Railway (backend + PostgreSQL + Redis) deployed
- CI-ready project structure with environment variable management
- Arabic font (Cairo) loaded and RTL base styles confirmed

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — DevOps: monorepo scaffold, Railway/Vercel config, env var management
- [x] 01-02-PLAN.md — Backend scaffold: Express + Socket.io + Prisma 6 + ioredis + health check
- [x] 01-03-PLAN.md — Frontend scaffold: Next.js 14, Tailwind RTL, Cairo font, socket singleton

---

## Phase 2: Room System & Real-Time Core

**Goal:** Host can create a room, players can join on mobile, and all connections are synchronized in real time.

**Covers:** ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, ROOM-06, SYNC-01, SYNC-02, SYNC-03, INFRA-02, INFRA-03
**Delivers:**
- Host creates room → 4-character code generated, stored in Redis
- Player joins from mobile browser with code → appears in live lobby on host screen
- Socket.io room management (join, leave, reconnect within 10s)
- Max 8 players enforced server-side
- Host controls: start game, advance question, end game
- WebSocket connection recovery on brief disconnects
- Tested at 100 simultaneous rooms

**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — NextAuth v5 setup: Prisma schema (User/Account/Session/VerificationToken), JWT sessions, Google + Resend providers, middleware route protection
- [ ] 02-02-PLAN.md — Room service + Socket.io handlers: Redis room CRUD, atomic joins, reconnect, host controls, connectionStateRecovery
- [ ] 02-03-PLAN.md — Frontend pages: landing, /host, /host/[roomCode], /join, /join/[roomCode], auth pages, emoji picker, live lobby, sessionStorage reconnect
- [ ] 02-04-PLAN.md — Load test: Artillery config for 100 concurrent rooms, socketio-v3 engine

---

## Phase 3: Arabic UI — Host Display & Player Controller

**Goal:** Both the host screen and player mobile UI are fully Arabic RTL and render correctly across all target browsers.

**Covers:** RTL-01, RTL-02, RTL-03, RTL-04, RTL-05
**Delivers:**
- Host display: full-screen landscape layout (TV/PC 16:9), Arabic RTL
- Player controller: mobile portrait layout, large touch targets, Arabic RTL
- Cairo Arabic font rendering on iOS Safari 16+ and Android Chrome 110+
- Countdown timer, animations, and score displays RTL-aware
- Cross-browser smoke test: iOS Safari, Android Chrome, Desktop Chrome/Firefox

---

## Phase 4: Question Engine — Multiple Choice & Scoring

**Goal:** The core game loop works end-to-end: questions appear, players answer, scores update, leaderboard shows.

**Covers:** GAME-01, GAME-04, GAME-05, SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Delivers:**
- Multiple Choice questions served from DB with 4 options and configurable timer
- Player answer submission via Socket.io → validated server-side
- Speed-based point calculation (faster answer = more points)
- Streak multiplier after 3+ consecutive correct answers
- Live leaderboard broadcast to host screen after each question
- Correct answer reveal with animation
- Final podium (top 3) animation at game end

---

## Phase 5: Question Engine — Media Guessing & Free Text

**Goal:** The two remaining Phase 1 question types are implemented and integrated into the game loop.

**Covers:** GAME-02, GAME-03
**Delivers:**
- Media Guessing: progressively un-blurring image (CSS blur transition) or audio clip playback
- Free Text Entry: player types answer on phone → displayed anonymously on host screen for group voting
- Voting mechanism: players vote on displayed answers, most-voted wins (800 pts author, 200 pts voters)
- Cloudinary image rendering via next/image remotePatterns

**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md — Data layer: Prisma schema (QuestionType enum + mediaUrl), type extensions, calculateFreeTextScore, seed data, Cloudinary allowlist
- [x] 05-02-PLAN.md — Media Guessing end-to-end: server payload extension, MediaQuestion component (CSS blur + audio), QuestionDisplay/HostDashboard/PlayerJoin wiring
- [x] 05-03-PLAN.md — Free Text end-to-end: server freetext handlers + voting timer, FreeTextFeed/VotingDisplay/FreeTextInput/VotingUI components, state machine wiring
- [x] 05-04-PLAN.md — End-to-end verification: build checks, seed, visual/functional checkpoint

---

## Phase 6: Lifelines

**Goal:** All three lifelines are implemented, usable once per game per player, and visually tracked.

**Covers:** LIFE-01, LIFE-02, LIFE-03, LIFE-04
**Delivers:**
- Double Points: player activates before submitting → 2x multiplier applied server-side
- Remove Two: eliminates 2 wrong options from multiple choice, server-validated
- Freeze Opponent: player targets another player → server blocks their answer for that question
- Lifeline UI on player controller with spent state (greyed out after use)
- Server-side enforcement: lifelines can't be reused

**Plans:** 4 plans

Plans:
- [x] 06-01-PLAN.md — Data layer + scoring: extend PlayerGameState types, calculateScore doublePoints param, Wave 0 test stubs, sendQuestion/player:answer lifeline wiring
- [x] 06-02-PLAN.md — Double Points + Remove Two: server handlers with security guards, LifelineBar component, AnswerOptions eliminatedIndices, PlayerJoin lifeline state
- [x] 06-03-PLAN.md — Freeze Opponent: server handler with target validation, FreezeOpponentOverlay component, PlayerJoin freeze wiring + error toast
- [x] 06-04-PLAN.md — End-to-end verification: complete lifeline tests, build checks, visual/functional checkpoint

---

## Phase 7: Admin Dashboard & Content Management

**Goal:** Admin can manage all game content through a dashboard, with a question approval workflow.

**Covers:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Delivers:**
- Admin dashboard (password-protected route)
- Category CRUD (create, rename, archive)
- Question CRUD with image/audio upload (Cloudinary)
- Draft → Approved → Live workflow (questions not in-game until approved)
- Basic analytics: questions played count, wrong answer rate per question
- Seed script for 200+ launch questions across 6 Arabic categories

**Plans:** 5/5 plans complete

Plans:
- [x] 07-01-PLAN.md — Data layer: extend schema (archived, timesPlayed, timesAnsweredWrong), Wave 0 test stubs, .env.example
- [x] 07-02-PLAN.md — Admin auth + Category CRUD: middleware cookie gate, login/logout handlers, admin layout, category Server Actions
- [x] 07-03-PLAN.md — Question CRUD + Cloudinary: upload Route Handler, question Server Actions, list/create/edit pages, status workflow UI
- [x] 07-04-PLAN.md — Analytics: fire-and-forget increments in game.ts, admin Express route with rate-limit, complete Wave 0 test stubs
- [x] 07-05-PLAN.md — Seed 200+ questions: composite unique constraint, rewrite seed.ts with 6 categories and 200+ Arabic questions, seed tests

---

## Phase 8: Polish, Performance & Launch

**Goal:** The platform is publicly deployed, stable, performant, and ready for real users.

**Covers:** INFRA-01, INFRA-02, INFRA-03 (final verification)
**Delivers:**
- Error handling: graceful disconnects, full-room rejection, invalid codes
- Loading states and skeleton screens on player controller
- Performance audit: Socket.io message latency < 200ms under load
- Security: rate limiting on room creation, input sanitization, no secrets exposed
- Domain setup and final Vercel/Railway production deployment
- End-to-end smoke test: 8 players, complete game, all 3 question types, all 3 lifelines
- Monitoring: basic error logging (Railway logs + Vercel analytics)

**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Error boundaries, loading skeletons, process resilience (uncaughtException/unhandledRejection handlers)
- [x] 08-02-PLAN.md — Rate limiting (per-socket in-memory), input hardening (room code regex), O(1) Redis host lookup
- [x] 08-03-PLAN.md — Monitoring: Vercel Analytics, structured logging [INFO]/[WARN]/[ERROR], health endpoint 503 threshold
- [x] 08-04-PLAN.md — Production config audit: .env.example files, railway.json, vercel.json, robots.txt, E2E env parameterization

---

## Phase 9: AI Content Generation

**Goal:** Admin and hosts can generate Arabic questions via GPT-4o, with all AI-generated questions entering a moderation queue (DRAFT status) before going live.

**Covers:** AI-01, AI-02
**Delivers:**
- OpenAI GPT-4o integration on the backend (new Express route, server-side key, rate-limited)
- AI generation endpoint: accepts category + count (5–10) → calls GPT-4o with Arabic Gulf-culture system prompt → creates DRAFT questions in DB
- Admin "Generate with AI" button per category in admin dashboard
- Generation dialog: pick category, pick count, trigger generation, show spinner + result summary
- Moderation queue view in admin: lists all DRAFT questions with approve/reject actions
- Batch approve/reject: select multiple DRAFT questions, approve or reject in one action
- OPENAI_API_KEY added to apps/server/.env.example only (server-side key — never in web env)

**Plans:** 3/3 plans complete

Plans:
- [x] 09-01-PLAN.md — Backend: OpenAI GPT-4o integration, ai-generate Express route, TDD unit tests
- [x] 09-02-PLAN.md — Admin UI: AI generation dialog, moderation queue, Server Actions, batch approve/reject
- [x] 09-03-PLAN.md — Verification: build checks, integration tests (generate→approve/reject flow), visual checkpoint

---

## Phase 10: UGC Question Packs + Shareable Result Cards (محتوى المجتمع)

**Goal:** Let hosts create and share community question packs, and give every game a viral sharing moment with auto-generated result cards — building a content flywheel and growth loop for the Gulf market.

**Covers:** UGC-01, UGC-02, SOCIAL-01
**Delivers:**
- **Pack Creator**: Authenticated hosts build, edit, and submit question packs (name, category, Arabic/English, questions) — admin-approved before going public
- **Pack Marketplace**: Browse/search community packs by category (e.g. محبوبين، رياضة، رمضان، أفلام); hosts pick a pack when starting a game
- **AI Pack Assistant**: Host types a topic prompt; Groq (Llama 3.3 70B, free tier) generates 10 draft questions the host can review and publish
- **Shareable Result Cards**: Auto-generated image at game end — final leaderboard, player emojis, game stats, Sha'lelha branding — Snapchat 9:16 + WhatsApp square variants, one-tap share
- Pack ratings and play-count so quality packs surface naturally
- Integrated into existing game start flow (select pack → start game)

**Depends on:** Phase 9
**Plans:** 5/8 plans executed

Plans:
- [x] 10-01-PLAN.md — Database schema: Pack + PackQuestion models, PackStatus enum, Pack CRUD API + integration tests
- [x] 10-02-PLAN.md — Pack Creator UI: create/edit flow, PackQuestionEditor, AiDraftReviewer, My Packs dashboard
- [x] 10-03-PLAN.md — Groq AI Pack Assistant: POST /ai/pack-generate, rate limiter, Groq SDK, mock unit tests
- [x] 10-04-PLAN.md — Pack Marketplace: browse/filter/detail pages, room creation pack pre-selector
- [x] 10-05-PLAN.md — Admin Pack Approval Queue: pending packs tab, approve/reject Server Actions, rejection reason on My Packs
- [ ] 10-06-PLAN.md — Shareable Result Cards: satori + @resvg/resvg-js image generation, Web Share API, post-game screen
- [ ] 10-07-PLAN.md — Quick UX Wins: rank delta in leaderboard, answer count progress, freeze opponent overlay

---

## Milestone Success Criteria (v1.0)

- [x] A group of 8 players completes a full game session without errors
- [x] Room join works on iOS Safari and Android Chrome in under 10 seconds
- [x] Answer-to-host-screen latency is under 200ms
- [x] Arabic RTL renders correctly on all target browsers
- [x] Admin can add and approve a question; it appears in the next game
- [x] Platform is live at a public URL with 99.5%+ uptime
- [x] 200+ questions available across 6 Arabic categories at launch

---

*Roadmap v1.0 created: 2026-04-09*
*Last updated: 2026-04-18 — Phase 10 redesigned: Draw and Guess → UGC Question Packs + Shareable Result Cards (product analysis recommendation)*

---

---

# Milestone 2: Growth + Engagement Engine

**Milestone:** v2.0 — Growth, Retention & Game Variety
**Goal:** Transform Sha'lelha from a working Arabic trivia MVP into a destination party game platform that acquires users via WhatsApp virality, retains them through persistent profiles and social competition, and widens its lead over all Arabic competitors by introducing game mechanics no Arabic platform offers.

**Discovery Source:** Business analyst session 2026-04-18 — user confirmed priorities, competitive benchmark, and product vision document (منصة_المسابقات_الجماعية_التفاعلية_—_رؤية_المنتج).

**Phase priority order confirmed by user (2026-04-18):**
1. Phase 11 — Growth Foundation (unblocks acquisition; no other phase matters if the funnel is broken)
2. Phase 12 — User Profiles + Persistent Leaderboards (Priority B)
3. Phase 13 — New Game Types: Drawing + Bluffing (Priority A)
4. Phase 14 — Audience / Spectator Mode (Priority C)

---

## Phase 11: Growth Foundation — Landing Page, Anonymous Rooms, Sharing

**Goal:** Fix the three critical v1.0 gaps that make the product invisible and unretentive: dead-end homepage, Google-OAuth-gated entry, and zero post-game sharing moment.

**Covers:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 (from REQUIREMENTS.md v2)
**Delivers:**
- Real Arabic landing page at `/` — tagline, dual CTA (host / player), "How it works" 3-step, game preview visuals, SEO meta tags
- Anonymous room creation — host creates room without Google sign-in; `guestHostToken` bound to Redis room; IP-rate-limited at 3/hour
- Post-game upgrade modal for guest hosts — "بقيت سجلاتك لمدة 24 ساعة" → Google OAuth to save history
- WhatsApp share button on host lobby — pre-written Arabic message with room code + join URL
- QR code on host lobby screen — generated via `qrcode` npm; encodes `/join/{code}` deeplink; 200×200px minimum
- Deep link handling — `/join/{code}` pre-fills room code so player only enters name
- Post-game screen for players — full ranked leaderboard, player rank badge, "شارك نتيجتك" button
- "Play Again" flow for host — `game:reset` socket event; players auto-return to lobby
- Shareable result cards — `@vercel/og` edge route; 1:1 WhatsApp variant + 9:16 Snapchat Stories variant; one-tap share
- OG meta tags for `/join/{code}` — branded WhatsApp preview card

**Plans:** TBD (run `/gsd-plan-phase 11` to break down)

---

## Phase 12: User Profiles + Persistent Leaderboards

**Goal:** Players and hosts have persistent identities with game history, stats, and a social leaderboard — creating the retention loop that makes groups return weekly.

**Covers:** REQ-007, REQ-008 (from REQUIREMENTS.md v2)
**Delivers:**
- Player profile page — display name, avatar (emoji selection), total games played, win count, best streak, favorite category
- Persistent game history — after each game, session summary (date, category, score, rank, players) saved to PostgreSQL
- "Join with profile" flow — returning players who previously played anonymously can claim their stats by signing in
- Global leaderboard — weekly and all-time rankings across all Sha'lelha games; filterable by category
- Room leaderboard — recurring groups can see their personal history head-to-head (e.g., "you've played 12 games with this group")
- Profile card shareable to WhatsApp — "لعبت ٢٣ مرة وفزت ٨ مرات على شعللها 🏆"
- Google OAuth required for persistent profile; anonymous play still works but stats not saved

**Plans:** TBD (run `/gsd-plan-phase 12` to break down)

---

## Phase 13: New Game Types — Drawing + Bluffing

**Goal:** Add two entirely new game mechanics that no Arabic party game platform offers — a drawing/guessing game and a bluffing/deception game — positioning Sha'lelha as the Arabic Jackbox.

**Covers:** REQ-009, REQ-010 (from REQUIREMENTS.md v2)
**Delivers:**

### ارسم وخمّن (Draw & Guess)
- Host displays a prompt word in Arabic; one player draws on a canvas (touch/mouse); all other players guess by typing
- Real-time stroke sync via Socket.io (delta-encoded canvas strokes, not full frames)
- Timer: 60 seconds to draw; guessing players submit answers freely (free-text input)
- Scoring: guesser gets points for correct guess (speed-based); artist gets points for each correct guess
- Canvas rendered in Next.js using HTML5 Canvas API (no Cloudinary dependency)
- Arabic prompt words curated in admin dashboard (new `DrawingPrompt` table in Prisma)

### كاذب بيننا (Bluffing / Who's the Liar)
- Each round: all players submit a fake "fact" answer; one player submits the real answer; players vote for which answer is real
- Scoring: bluffers earn points for each vote they attract; real-answer submitter earns points if the majority finds the truth
- Questions curated as `BLUFFING` type — prompt that has a real factual answer (e.g., "ما عاصمة أيسلندا؟")
- Phase flow: submit phase → vote phase → reveal phase — mirrors Free Text voting but with deception mechanic
- Arabic cultural prompts: Gulf geography, Islamic history, Arab cinema, cuisine — categories where plausible bluffs are possible

**Technical approach:**
- Draw & Guess: new `QuestionType.DRAWING` in Prisma enum; new socket events `draw:stroke`, `draw:guess`, `draw:reveal`
- Bluffing: new `QuestionType.BLUFFING` in Prisma enum; extends existing freetext voting flow with per-player answer hiding
- Host can select game type mix when starting (e.g., "5 trivia + 2 drawing + 1 bluffing")

**Plans:** TBD (run `/gsd-plan-phase 13` to break down)

---

## Phase 14: Audience / Spectator Mode

**Goal:** Players who arrive after a game starts, or groups larger than 8, can join as spectators — watching on their phone, reacting with emoji, and staying engaged until the next game.

**Covers:** REQ-006 (from REQUIREMENTS.md v2)
**Delivers:**
- When room is at capacity (8 players), join flow offers "Join as Spectator" instead of error
- Spectator view at `/join/{code}/spectate` — mobile-optimized: live question, timer, read-only answers, running scores
- Spectators receive all game socket events but do not affect game state or leaderboard
- Emoji reaction bar (🔥 😂 😮 👏 💀) — tapping sends floating emoji overlay on host screen (rate-limited, 1 per 3s per spectator)
- Spectator count shown on host lobby screen ("٣ متفرجون")
- Max 50 spectators per room (Redis broadcast cap)
- Spectators can convert to players in the next game via "Play Again" if a slot opens

**Plans:** TBD (run `/gsd-plan-phase 14` to break down)

---

## Milestone 2 Success Criteria (v2.0)

- [ ] Landing page conversion: visit → room created ≥ 15%
- [ ] Time-to-first-game for new anonymous host < 90 seconds
- [ ] WhatsApp share rate: ≥ 30% of games generate at least 1 share
- [ ] Play-again click rate ≥ 25% of game-end events
- [ ] Post-game screen engagement: player sees result card in 100% of completed games
- [ ] User profiles: ≥ 20% of anonymous hosts convert to registered accounts within 7 days
- [ ] Game type variety: at least 1 Drawing and 1 Bluffing question played in ≥ 10% of sessions
- [ ] Spectator mode: no room-full error — spectator path available in 100% of capacity cases
- [ ] Monthly active rooms (MAR): 100+ (baseline)

---

*Milestone 2 roadmap created: 2026-04-18*
*Based on: business analyst discovery session, REQUIREMENTS.md v2 BRD, competitive benchmark (بنش_مارك), product vision doc (رؤية_المنتج)*
*User-confirmed priority order: Phase 11 (Growth) → Phase 12 (Profiles) → Phase 13 (Game Types) → Phase 14 (Spectator)*
