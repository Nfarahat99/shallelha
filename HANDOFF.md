# HANDOFF: Sha'lelha (شعللها) — v1.0 MVP Complete

**Date:** 2026-04-17
**Milestone:** v1.0 — MVP Public Launch
**Status:** ALL 8 PHASES COMPLETE — DEPLOYED

---

## What This Product Is

Sha'lelha is an Arabic-first real-time multiplayer party game platform for the Gulf market. Groups of 2–8 players join game rooms from their phones (no install — browser-only) while a host controls the game on a shared screen. Think Jackbox Games built for Arabic culture.

**Core value:** Any Arabic-speaking group can start a game session in under 60 seconds, on any device, with no install.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://shallelha.vercel.app |
| Backend (Railway) | https://shallelha-server-production.up.railway.app |
| Health check | https://shallelha-server-production.up.railway.app/health |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + RTL + Cairo font |
| Backend | Node.js + Express + Socket.io |
| Database | PostgreSQL via Prisma ORM |
| Cache / Room state | Redis (ioredis) |
| Auth | NextAuth v5 — Google OAuth + magic link (Resend) |
| Media | Cloudinary (images + audio for Media Guessing questions) |
| Hosting | Vercel (frontend) + Railway (backend + PostgreSQL + Redis) |
| Analytics | Vercel Analytics |

---

## Repository Structure

```
shllahaV2/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   │   ├── app/      # App Router pages + layouts
│   │   ├── components/
│   │   └── lib/      # socket singleton, prisma client
│   └── server/       # Node.js backend
│       ├── src/
│       │   ├── socket/     # Socket.io handlers (room, game, lifelines)
│       │   ├── routes/     # Express routes (admin, health)
│       │   ├── game/       # Game service + scoring
│       │   ├── room/       # Room service (Redis CRUD)
│       │   └── db/         # Prisma client
│       └── prisma/
├── .planning/        # GSD workflow artifacts (phases, plans, state)
└── CLAUDE.md         # Project-level AI agent instructions
```

---

## What Was Built (8 Phases)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 01 | Monorepo scaffold, Vercel + Railway deploy, health check, RTL base | Complete |
| 02 | Room system (create/join/reconnect), Google auth, Socket.io real-time core | Complete |
| 03+04 | Arabic RTL UI (host display + player controller), Multiple Choice game loop, scoring, leaderboard | Complete |
| 05 | Media Guessing (CSS blur + audio) + Free Text Entry + voting mechanism | Complete |
| 06 | Three lifelines: Double Points, Remove Two, Freeze Opponent — server-enforced | Complete |
| 07 | Admin dashboard (CRUD + Cloudinary upload), 201 Arabic questions seeded (6 categories) | Complete |
| 08 | Error handling, loading skeletons, rate limiting, O(1) Redis lookup, monitoring, production config | Complete |

---

## Game Features

### Question Types
1. **Multiple Choice** — 4 options, configurable timer, speed-based scoring
2. **Media Guessing** — progressively un-blurring image or audio clip playback
3. **Free Text Entry** — players type answers; group votes on displayed answers anonymously

### Scoring
- Speed-based points (faster = more; range 500–1000)
- Streak multiplier (1.5x) after 3+ consecutive correct answers
- Free text: 800 pts to author of most-voted answer, 200 pts to each voter

### Lifelines (once per game per player)
- **Double Points** — 2x multiplier on next answer
- **Remove Two** — eliminates 2 wrong options from Multiple Choice
- **Freeze Opponent** — blocks a targeted player from answering one question

### Admin Dashboard
- Password-protected at `/admin` (ADMIN_SESSION_TOKEN cookie, edge-compatible)
- Category CRUD (create, rename, archive)
- Question CRUD with Cloudinary media upload (server-side stream — API secret never exposed)
- Draft → Approved → Live workflow (questions not in-game until approved)
- Analytics: times played, wrong answer rate per question

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Per-socket in-memory rate limiter | Zero-latency; socket limits are per-connection, no Redis round-trips |
| `hostroom:{hostId}` Redis reverse index | O(1) host→room lookup replacing O(n) `redis.keys` scan |
| Admin auth via cookie session (ADMIN_SESSION_TOKEN) | Independent of NextAuth; no DB lookup needed for admin |
| Cloudinary upload via server-side `upload_stream` | Keeps API secret server-only; no unsigned client upload |
| `@@unique([text, categoryId])` constraint | Enables per-question idempotent upsert in seed script |
| `tsx` for seed execution (not `ts-node`) | Matches project toolchain; ts-node avoided per CLAUDE.md |
| Speed scoring: `floor((1 - elapsed/timerDuration / 2) * 1000)` | 500–1000 pts range rewards speed without punishing slow answers |
| Streak: server-side only, 1.5x after 3+ correct | Server-authoritative; transient flags reset per question |
| No Sentry for MVP | Railway log drain + `process.on` handlers sufficient for v1.0 |
| No `output:standalone` in next.config.mjs | Vercel handles its own pipeline; standalone is for Docker only |

---

## Environment Variables

### Frontend (`apps/web/.env.example`)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=                   # 32-char random string
ADMIN_PASSWORD=
ADMIN_SESSION_TOKEN=           # random hex token
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
DATABASE_URL=
NODE_ENV=development
```

### Backend (`apps/server/.env.example`)
```
PORT=4000
DATABASE_URL=
REDIS_URL=
FRONTEND_URL=http://localhost:3000
```

---

## Test Coverage

```
Server test suite: 78/78 tests pass across 8 test files
├── game.service.test.ts       (27 tests)
├── lifelines.test.ts          (17 tests)
├── room-service.test.ts       (11 tests)
├── admin-workflow.test.ts     ( 5 tests)
├── health.test.ts             ( 6 tests)
├── rate-limiter.test.ts       ( 4 tests)
├── admin-seed.test.ts         ( 4 tests)
└── admin.test.ts              ( 4 tests)
```

---

## Deployment

### Backend (Railway)
- `apps/server/railway.json`: `healthcheckPath: /health`, `restartPolicyType: ON_FAILURE` (max 3 retries)
- Health endpoint at `/health` returns 503 when approved questions < 200
- Structured logging throughout: `[INFO]` / `[WARN]` / `[ERROR]` prefixes

### Frontend (Vercel)
- `apps/web/vercel.json`: `framework: nextjs`, `buildCommand: npx next build`
- `apps/web/public/robots.txt`: `Allow: /`, Sitemap pointing to sitemap.xml
- Vercel Analytics enabled in root layout

### E2E Scripts
- `e2e-test.mjs` and `e2e-phase5.mjs` — parameterized via `BASE_URL` and `SERVER_URL` env vars

---

## Content

- **201 Arabic questions** seeded across 6 categories
- Seed script: `apps/server/prisma/seed.ts` (run via `tsx`)
- All questions in `approved` status — ready for games at launch
- Idempotent: safe to re-run with `@@unique([text, categoryId])`

---

## Known Open Questions (deferred to v2)

- Will host need an account to create a room, or anonymous room creation?
- Is there a practice/solo mode, or multiplayer-required?
- Free Text voting: players only, or host override?
- English UI localization

---

## Phase 08 UAT Results

All 11 UAT tests passed. See `.planning/phases/08-polish-performance-launch/08-UAT.md`.

---

## How to Resume (Next AI or Dev)

1. Read `CLAUDE.md` — project-level AI agent instructions (mandatory skills, wave feedback, etc.)
2. Read `.planning/PROJECT.md` — product vision, requirements, constraints
3. Read `.planning/ROADMAP.md` — 8-phase plan (all complete)
4. Check `.planning/STATE.md` — current milestone/phase status
5. Run `npm test` in `apps/server` to confirm 78/78 still green
6. Deploy: push to `main` → Vercel auto-deploys frontend; Railway auto-deploys backend

```bash
cd /c/shllahaV2
npm run test --workspace=apps/server -- --run   # 78 tests green
npm run build --workspace=apps/web              # build passes
```

---

*Generated: 2026-04-17 — v1.0 milestone complete — all 8 phases shipped*
