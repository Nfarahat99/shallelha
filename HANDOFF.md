# HANDOFF: Sha'lelha (شعللها) — Phase 10 Complete / Milestone 2 Active

**Date:** 2026-04-18
**Milestone:** v1.0 Complete → v2.0 (Growth + Engagement Engine) Active
**Status:** Phases 1–10 COMPLETE — DEPLOYED. Active Phase: 11 (Growth Foundation)

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

**Last smoke test (2026-04-18):** Vercel HTTP 200, Railway: `{"status":"ok","postgres":"ok","approvedQuestions":204,"redis":"ok"}`

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
| AI (Admin) | OpenAI GPT-4o — admin question generation (server-side key) |
| AI (UGC) | Groq Llama 3.3 70B — free-tier AI pack assistant for hosts |
| Image generation | satori + @resvg/resvg-js — result card PNG generation |
| Hosting | Vercel (frontend) + Railway (backend + PostgreSQL + Redis) |
| Analytics | Vercel Analytics |

---

## Repository Structure

```
shllahaV2/
├── apps/
│   ├── web/                     # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── host/            # Host screens (lobby, game, dashboard)
│   │   │   ├── join/            # Player join + game screens
│   │   │   ├── admin/           # Admin dashboard (auth-gated)
│   │   │   ├── packs/           # Pack marketplace + creator
│   │   │   └── api/             # Route handlers (auth, cards)
│   │   └── components/          # Shared UI components
│   └── server/                  # Node.js backend
│       ├── src/
│       │   ├── socket/          # Socket.io handlers (room, game, lifelines)
│       │   ├── routes/          # Express routes (admin, health, packs, ai)
│       │   ├── game/            # Game service + scoring
│       │   ├── room/            # Room service (Redis CRUD)
│       │   └── db/              # Prisma client
│       └── prisma/
├── .planning/                   # GSD workflow artifacts (phases, plans, state)
└── CLAUDE.md                    # Project-level AI agent instructions
```

---

## What Was Built (10 Phases)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 01 | Monorepo scaffold, Vercel + Railway deploy, health check, RTL base | ✓ Complete |
| 02 | Room system (create/join/reconnect), Google auth, Socket.io real-time core | ✓ Complete |
| 03+04 | Arabic RTL UI (host display + player controller), Multiple Choice game loop, scoring, leaderboard | ✓ Complete |
| 05 | Media Guessing (CSS blur + audio) + Free Text Entry + voting mechanism | ✓ Complete |
| 06 | Three lifelines: Double Points, Remove Two, Freeze Opponent — server-enforced | ✓ Complete |
| 07 | Admin dashboard (CRUD + Cloudinary upload), 201 Arabic questions seeded (6 categories) | ✓ Complete |
| 08 | Error handling, loading skeletons, rate limiting, O(1) Redis lookup, monitoring, production config | ✓ Complete |
| 09 | AI Content Generation: GPT-4o admin route, AiGenerateDialog, ModerationQueue, batch approve/reject | ✓ Complete |
| UI Redesign | Dark glassmorphism brand token sweep — all `indigo-*` → `brand-*` across every screen | ✓ Complete |
| 10 | UGC Question Packs + Shareable Result Cards (see Phase 10 detail below) | ✓ Complete |

---

## Phase 10 Detail (UGC + Shareable Cards)

| Plan | Deliverable |
|------|-------------|
| 10-01 | Pack + PackQuestion Prisma schema, PackStatus enum, Pack CRUD REST API, integration tests |
| 10-02 | Pack Creator UI: create/edit flow, PackQuestionEditor, AiDraftReviewer, My Packs dashboard |
| 10-03 | Groq AI Pack Assistant: POST /ai/pack-generate, rate limiter, Llama 3.3 70B, 6/6 integration tests |
| 10-04 | Pack Marketplace: browse/filter/detail pages, room creation pack pre-selector, packId in Redis room |
| 10-05 | Admin Pack Approval Queue: pending packs tab, approve/reject Server Actions, rejectionReason field |
| 10-06 | Shareable Result Cards: satori + resvg PNG (Snapchat 9:16 + WhatsApp 1:1), Web Share API, 1hr cache |
| 10-07 | Quick UX Wins: rank delta badge (▲N/▼N), answer count progress, FrozenPlayerOverlay, Rule 2 socket fix |
| 10-08 | Game Engine Wiring: game.ts branches on packId from Redis, playCount incremented in all end paths |

**Test suite after Phase 10:** 108/108 server tests green, Next.js build clean (25 routes)

---

## Game Features

### Question Types
1. **Multiple Choice** — 4 options, configurable timer, speed-based scoring
2. **Media Guessing** — progressively un-blurring image or audio clip playback
3. **Free Text Entry** — players type answers; group votes on displayed answers anonymously

### Scoring
- Speed-based points (faster = more; range 500–1000)
- Streak multiplier (1.5x) after 3+ consecutive correct answers
- Live rank delta badge on answer confirmation screen (▲N / ▼N positions)
- Free text: 800 pts to author of most-voted answer, 200 pts to each voter

### Lifelines (once per game per player)
- **Double Points** — 2x multiplier on next answer
- **Remove Two** — eliminates 2 wrong options from Multiple Choice
- **Freeze Opponent** — blocks a targeted player from answering one question; targeted player sees full-screen freeze overlay

### UGC Question Packs
- Hosts create packs (name + questions); admin approves before going public
- Pack Marketplace: browse by category, filter by status
- Groq AI assistant: type a topic → get 10 draft Arabic questions (free, no OpenAI dependency)
- Hosts select a pack when starting a game; game.ts serves PackQuestion rows from DB
- playCount incremented per game played with a pack

### Shareable Result Cards
- Auto-generated at game end via satori + resvg
- Snapchat 9:16 + WhatsApp 1:1 variants
- Cairo font via Google Fonts CDN (TTF, pinned v31 URL)
- In-memory Map cache (1hr TTL)
- Web Share API + download fallback

### Admin Dashboard
- Password-protected at `/admin` (ADMIN_SESSION_TOKEN cookie, edge-compatible)
- Category CRUD, Question CRUD with Cloudinary upload
- AI question generation: GPT-4o dialog per category (5–10 questions)
- Moderation queue: approve/reject DRAFT questions (AI-generated or UGC packs)
- Pack Approval Queue: pending community packs with approve/reject + rejection reason

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `brand-600` | `#4f46e5` | Primary CTAs, active states, accent color |
| `brand-950/900` | dark indigo | Page gradients, selected state backgrounds |
| `brand-400/300` | light indigo | Text accents, score displays, icon colors |
| Dark gradient | `from-gray-950 via-brand-950 to-gray-900` | Full-screen game backgrounds |
| Glassmorphism card | `bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl` | All overlay cards |
| Font | Cairo (Arabic) via `--font-cairo` CSS var | All game UI text |

**Important:** All color references use semantic `brand-*` Tailwind tokens — never raw `indigo-*`.

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Per-socket in-memory rate limiter | Zero-latency; socket limits are per-connection, no Redis round-trips |
| `hostroom:{hostId}` Redis reverse index | O(1) host→room lookup replacing O(n) `redis.keys` scan |
| Admin auth via cookie session (ADMIN_SESSION_TOKEN) | Independent of NextAuth; no DB lookup needed for admin |
| Cloudinary upload via server-side `upload_stream` | Keeps API secret server-only; no unsigned client upload |
| `@@unique([text, categoryId])` constraint | Enables per-question idempotent upsert in seed script |
| OpenAI lazy singleton | Avoids constructor throw when OPENAI_API_KEY absent in test env |
| Groq rate limit key falls back to 'anonymous' | Avoids ERR_ERL_KEY_GEN_IPV6 from express-rate-limit v8 |
| Pack.createdBy stored as plain String (no FK) | Avoids cascade complexity with future anonymous users |
| prisma db push (not migrate dev) | Avoids drift with Railway DB; consistent across all Phase 10 plans |
| Cairo font fetched from Google Fonts CDN as TTF | No browser UA → returns TTF (not woff2); pinned v31 URL; cached in module memory |
| satori object format in Express (no JSX transpiler) | Non-React Express environment; cast to `any` at call site per satori docs |
| player:frozen emitted to frozen player's socketId | Rule 2 fix — server now notifies victim directly, not broadcast |
| game.ts branches on room.packId | No new socket payload needed; packId already stored in Redis room by Plan 10-04 |
| `cd apps/web && npx next build` as Vercel buildCommand | npm workspace symlinks not fully resolved in Vercel CI; direct next invocation bypasses workspace issues |
| nodeVersion: 22.x in Vercel project settings | Vercel does not support Node.js 24.x; pinned to 22.x via API + project.json |

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
OPENAI_API_KEY=                # GPT-4o admin question generation
GROQ_API_KEY=                  # Llama 3.3 70B UGC pack assistant
```

---

## Test Coverage

```
Server test suite: 108/108 tests pass across 10+ test files
├── game.service.test.ts         (27 tests)
├── lifelines.test.ts            (17 tests)
├── room-service.test.ts         (11 tests)
├── packs.test.ts                (integration — Pack CRUD)
├── pack-generate.test.ts        (6 integration tests — Groq route)
├── ai-generate.test.ts          (7 integration tests — GPT-4o route)
├── admin-workflow.test.ts        (5 tests)
├── health.test.ts               (6 tests)
├── rate-limiter.test.ts         (4 tests)
├── admin-seed.test.ts           (4 tests)
├── admin.test.ts                (4 tests)
└── cards.test.ts                (3 tests — satori PNG generation)
```

---

## Deployment Notes

### Backend (Railway)
- Deploy from `apps/server`: `railway up --detach`
- `railway.json`: `healthcheckPath: /health`, `restartPolicyType: ON_FAILURE` (max 3 retries)
- Health endpoint returns 503 when approved questions < 200

### Frontend (Vercel)
- Deploy from repo root: `vercel --prod --yes`
- **buildCommand:** `cd apps/web && npx next build` (NOT `npm run build --workspace=apps/web`)
- **outputDirectory:** `apps/web/.next`
- **nodeVersion:** `22.x` (24.x not supported by Vercel)
- **rootDirectory:** `null` (deploy from repo root)
- These settings are stored in `apps/web/.vercel/project.json` and synced to Vercel via API

---

## Content

- **204 Arabic questions** approved and live across 6 categories
- Seed script: `apps/server/prisma/seed.ts` (run via `tsx`)
- Idempotent: safe to re-run with `@@unique([text, categoryId])`

---

## Current Milestone: v2.0 — Growth + Engagement Engine

**Next phase:** Phase 11 — Growth Foundation

| Phase | Goal | Priority |
|-------|------|----------|
| **11** | Landing page, anonymous rooms, WhatsApp share, QR code, post-game screens | **NEXT** |
| 12 | User profiles + persistent leaderboards | B |
| 13 | New game types: Drawing + Bluffing | A |
| 14 | Audience / Spectator Mode | C |

Run `/gsd-plan-phase 11` to plan Phase 11.

---

## How to Resume

1. Read `CLAUDE.md` — project-level AI agent instructions (mandatory skills, wave feedback, etc.)
2. Read `.planning/PROJECT.md` — product vision, requirements, constraints
3. Read `.planning/ROADMAP.md` — full phase plan
4. Check `.planning/STATE.md` — current phase status
5. Run server tests to confirm green baseline:

```bash
cd /c/shllahaV2
npm run test --workspace=apps/server -- --run   # 108 tests green
npm run build --workspace=apps/web              # 25 routes clean
```

6. Start Phase 11: `/gsd-plan-phase 11`

---

*Generated: 2026-04-18 — Phase 10 complete — 10/14 phases shipped — v2.0 active*
