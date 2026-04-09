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
- [ ] 01-01-PLAN.md — DevOps: monorepo scaffold, Railway/Vercel config, env var management
- [ ] 01-02-PLAN.md — Backend scaffold: Express + Socket.io + Prisma 6 + ioredis + health check
- [ ] 01-03-PLAN.md — Frontend scaffold: Next.js 14, Tailwind RTL, Cairo font, socket singleton

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
- Media Guessing: progressively un-blurring image (Cloudinary transform) or audio clip playback
- Free Text Entry: player types answer on phone → displayed anonymously on host screen for group voting
- Voting mechanism: players vote on displayed answers, most-voted wins
- Cloudinary integration for image and audio hosting

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

---

## Milestone Success Criteria

- [ ] A group of 8 players completes a full game session without errors
- [ ] Room join works on iOS Safari and Android Chrome in under 10 seconds
- [ ] Answer-to-host-screen latency is under 200ms
- [ ] Arabic RTL renders correctly on all target browsers
- [ ] Admin can add and approve a question; it appears in the next game
- [ ] Platform is live at a public URL with 99.5%+ uptime
- [ ] 200+ questions available across 6 Arabic categories at launch

---

*Roadmap created: 2026-04-09*
*Last updated: 2026-04-09 — Phase 1 plans created (3 plans, 2 waves)*
