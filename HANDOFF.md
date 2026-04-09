# Sha'lelha (شعللها) — Project Handoff Document

**Date:** 2026-04-10
**Status:** Phase 1 COMPLETE — all plans executed, both services live
**Next action:** `/gsd-plan-phase 2` — Room System & Real-Time Core

---

## Phase 1 Completion Summary

All 3 plans executed successfully:

| Plan | Name | Status | Commits |
|------|------|--------|---------|
| 01-01 | DevOps: monorepo scaffold, Railway/Vercel config | ✅ Done | cec4963 |
| 01-02 | Backend: Express + Socket.io + Prisma 6 + ioredis | ✅ Done | merged |
| 01-03 | Frontend: Next.js 14.2.35, Tailwind RTL, Cairo font | ✅ Done | 23f2681 |

### Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Railway backend | https://shallelha-server-production.up.railway.app | ✅ Live |
| Railway health | https://shallelha-server-production.up.railway.app/health | ✅ `{"status":"ok","postgres":"ok","redis":"ok"}` |
| Vercel frontend | https://shallelha.vercel.app | ✅ Deployed (build Ready) |

> **Note:** Vercel Deployment Protection is enabled (SSO gate). To make the frontend publicly accessible, go to Vercel Dashboard → Project Settings → Deployment Protection → disable "Vercel Authentication".

---

## What Was Built

### 1. PRD — Validated & Rebuilt (`shallelha.md`)

- Name locked: **Sha'lelha (شعللها)**
- Tech stack locked (see below)
- 3-phase roadmap with clear scope boundaries
- Out-of-scope items documented with reasons
- Non-functional requirements (latency, concurrency, browser targets)

### 2. GSD Project Initialized

```
.planning/
├── PROJECT.md        ← Vision, requirements, key decisions
├── REQUIREMENTS.md   ← 35 v1 requirements with IDs (ROOM, GAME, SCORE, LIFE, SYNC, RTL, ADMIN, INFRA)
├── ROADMAP.md        ← 8-phase roadmap, Phase 1 all plans complete
├── STATE.md          ← Project memory / session continuity
└── config.json       ← YOLO mode, standard granularity, all quality agents on
```

### 3. Phase 1 — Executed

Three plans executed across two waves:

```
.planning/phases/01-project-foundation-infrastructure/
├── 01-RESEARCH.md        ← Technical research with critical findings
├── 01-01-PLAN.md         ← DevOps: monorepo, Railway/Vercel deploy, env vars
├── 01-01-SUMMARY.md      ← Execution summary
├── 01-02-PLAN.md         ← Backend: Express + Socket.io + Prisma 6 + ioredis
├── 01-02-SUMMARY.md      ← Execution summary
├── 01-03-PLAN.md         ← Frontend: Next.js 14 + Tailwind RTL + Cairo font
└── 01-03-SUMMARY.md      ← Execution summary
```

### 4. Skills Installed

Five specialized skills in `.agents/skills/` symlinked to Claude Code:

| Skill | Role | Invoke |
|-------|------|--------|
| `next-best-practices` | Next.js 14 frontend | `/next-best-practices` |
| `nodejs-backend-patterns` | Node.js/Socket.io/Prisma backend | `/nodejs-backend-patterns` |
| `ui-ux-pro-max` | UI/UX, Arabic RTL design | `/ui-ux-pro-max` |
| `senior-devops` | Railway/Vercel infra, CI/CD | `/senior-devops` |
| `webapp-testing` | Unit, integration, E2E testing | `/webapp-testing` |

---

## Tech Stack (Locked — Do Not Change)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js **14.2.35** (App Router) | Pinned to 14.x — `create-next-app@latest` installs 15+ today |
| Styling | Tailwind CSS | RTL via logical properties only (`ms-`, `ps-`, `text-start`) — NEVER `ml-`, `pl-` |
| Arabic font | Cairo | Google Fonts, Arabic + Latin subsets via `next/font/google` |
| Backend | Node.js + Express + Socket.io | Runs on Railway — Vercel is serverless, cannot host WebSockets |
| ORM | Prisma **6.x** (not 7) | Prisma 7 has breaking changes (ESM-only, driver adapters required) |
| Database | PostgreSQL | Hosted on Railway (raw Docker: postgres:16) |
| Cache | Redis via ioredis | Hosted on Railway (raw Docker: redis:7) |
| Auth | NextAuth.js | Phase 2 — not needed in Phase 1 |
| Media | Cloudinary | Images, audio, blurring transforms — Phase 5 |
| Deployment | Vercel (frontend) + Railway (backend + DB + Redis) | Same Railway project for private networking |

---

## Critical Technical Findings (Read Before Touching Code)

### 1. Socket.io Cannot Run on Vercel
Vercel is serverless — persistent WebSocket connections are not supported. Socket.io server **must** live on Railway. The Next.js frontend connects via `NEXT_PUBLIC_BACKEND_URL` env var.

### 2. Pin Next.js to 14.x
Running `npx create-next-app@latest` today installs Next.js 15+. After scaffolding, verify `package.json` has `"next": "14.x"` and downgrade if needed:
```bash
npm install next@14 --workspace=apps/web
```
**Deviation noted:** `next.config.ts` → `next.config.mjs` (Next.js 14 does not support `.ts` config files; that is a Next.js 15+ feature).

### 3. Use Prisma 6, NOT Prisma 7
Prisma 7 (npm latest) has major breaking changes: ESM-only, required driver adapters, `prisma.config.ts` replaces datasource URL in schema. Pin explicitly:
```json
"prisma": "^6",
"@prisma/client": "^6"
```

### 4. ioredis on Railway Requires `?family=0`
Railway's private network uses IPv6. ioredis defaults to IPv4. Without this suffix, Redis connections fail with `ECONNREFUSED`. Always append to the Redis URL:
```
REDIS_URL=redis://default:password@host:6379?family=0
```

### 5. Force WebSocket Transport on Socket.io
Railway has no sticky sessions. If HTTP long-polling fallback is enabled, connections break with multiple replicas. Force WebSocket-only on both sides:
```js
// Server (index.ts)
const io = new Server(server, { transports: ['websocket'] });

// Client (lib/socket.ts)
const socket = io(BACKEND_URL, { transports: ['websocket'] });
```

### 6. Tailwind RTL — Logical Properties Only
Never use directional utility classes. Arabic RTL requires:
```
WRONG: ml-4, pl-4, mr-4, pr-4, text-left, text-right
RIGHT: ms-4, ps-4, me-4, pe-4, text-start, text-end
```
Add `dir="rtl"` to the `<html>` element in `layout.tsx`. Do NOT install `tailwindcss-rtl` — it's unmaintained.

### 7. Railway Services Are Raw Docker Images (Not Managed Plugins)
Due to CLI limitations, PostgreSQL and Redis were deployed as raw Docker images:
- PostgreSQL: `postgres:16` image
- Redis: `redis:7` image
- Internal hostnames: `postgres.railway.internal:5432`, `redis.railway.internal:6379`
This is equivalent in behavior to Railway managed plugins — private networking works the same way.

---

## Monorepo Structure

```
shallelha/                    ← git root (C:\shllahaV2)
├── apps/
│   ├── web/                  ← Next.js 14.2.35 frontend (Vercel)
│   │   ├── app/
│   │   │   ├── layout.tsx    ← Cairo font, <html lang="ar" dir="rtl">
│   │   │   ├── page.tsx      ← Arabic landing page, logical CSS only
│   │   │   └── globals.css   ← Tailwind directives, RTL comment
│   │   ├── lib/
│   │   │   └── socket.ts     ← Socket.io singleton, autoConnect: false
│   │   ├── tailwind.config.ts
│   │   └── next.config.mjs
│   └── server/               ← Node.js + Express + Socket.io (Railway)
│       ├── src/
│       │   ├── index.ts      ← Express server + Socket.io, CORS locked
│       │   ├── routes/health.ts  ← GET /health (postgres + redis checks)
│       │   ├── socket/index.ts   ← Socket.io setup, WebSocket-only
│       │   ├── db/prisma.ts      ← Prisma client singleton
│       │   └── redis/client.ts   ← ioredis client (?family=0)
│       ├── prisma/schema.prisma
│       └── Dockerfile        ← Multi-stage, node:18-alpine
├── .planning/                ← GSD planning artifacts (do not delete)
├── .agents/skills/           ← Installed skills (do not delete)
├── package.json              ← npm workspaces root
├── .env.example              ← Env var template (committed)
├── .env                      ← Real secrets (gitignored — never commit)
├── railway.json              ← Railway deployment config
├── vercel.json               ← Vercel deployment config
├── .nvmrc                    ← Node 18
└── shallelha.md              ← Full PRD
```

---

## Environment Variables

### Railway (backend service: shallelha-server)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:6794d19edb8955ce444a37867adb13fa8bdb9ac5@postgres.railway.internal:5432/shallelha` |
| `REDIS_URL` | `redis://redis.railway.internal:6379?family=0` |
| `FRONTEND_URL` | `https://shallelha.vercel.app` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |

### Vercel (frontend project: shallelha)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://shallelha-server-production.up.railway.app` |

---

## Railway Infrastructure

| Component | Details |
|-----------|---------|
| Project ID | `e24a9a2f-5087-4454-a7fb-31e4be70a27f` |
| Project name | `shallelha` |
| Backend service ID | `c1517def-dd47-4ab5-a228-02954c370f06` |
| Backend service name | `shallelha-server` |
| Backend public URL | `https://shallelha-server-production.up.railway.app` |
| PostgreSQL | Raw Docker `postgres:16`, internal: `postgres.railway.internal:5432` |
| Redis | Raw Docker `redis:7`, internal: `redis.railway.internal:6379` |
| DB password | In Railway variables (do not commit) |

---

## 8-Phase Roadmap

| Phase | Name | Status | Key Requirements |
|-------|------|--------|-----------------|
| **1** | Project Foundation & Infrastructure | **COMPLETE** | INFRA-01, INFRA-04 |
| **2** | Room System & Real-Time Core | **Not planned** | ROOM-01–06, SYNC-01–03, INFRA-02–03 |
| 3 | Arabic UI — Host Display & Player Controller | Not planned | RTL-01–05 |
| 4 | Question Engine — Multiple Choice & Scoring | Not planned | GAME-01, 04, 05, SCORE-01–04 |
| 5 | Question Engine — Media Guessing & Free Text | Not planned | GAME-02–03 |
| 6 | Lifelines | Not planned | LIFE-01–04 |
| 7 | Admin Dashboard & Content Management | Not planned | ADMIN-01–05 |
| 8 | Polish, Performance & Launch | Not planned | INFRA-01–03 (final) |

---

## Open Questions (Resolve Before Phase 2)

1. **Host account requirement:** Does the host need an account to create a room, or is anonymous room creation allowed? Affects Phase 2 database schema.
2. **Question bank:** Who populates the initial 200 questions across 6 categories? Needed before Phase 7.
3. **Solo/practice mode:** Is multiplayer always required, or is there a single-player practice mode?
4. **Vercel Deployment Protection:** Disable in Vercel Dashboard → Project Settings → Deployment Protection to make the frontend publicly accessible.

---

## One-Time Setup Required

**Disable Vercel Deployment Protection** (makes frontend public):
1. Go to https://vercel.com/nouruldeen-farahats-projects/shallelha/settings
2. Navigate to: Security → Deployment Protection
3. Disable "Vercel Authentication"

---

## GSD Workflow Commands

```bash
# Plan next phase
/gsd-plan-phase 2

# Execute next phase (after planning)
/gsd-execute-phase 2

# Check project status
/gsd-progress

# Resume after a break
/gsd-resume-work

# Debug an issue
/gsd-debug "description of problem"

# Run code review
/gsd-code-review
```

---

## Key Files to Read

Before continuing work, read these in order:

1. `shallelha.md` — Full PRD with all product decisions
2. `.planning/PROJECT.md` — Vision, active requirements, key decisions
3. `.planning/ROADMAP.md` — 8-phase structure with current status
4. `.planning/REQUIREMENTS.md` — All 35 v1 requirements with IDs
5. `apps/server/src/index.ts` — Backend entry point
6. `apps/web/app/layout.tsx` — Frontend root layout (Cairo + RTL)
7. `apps/web/lib/socket.ts` — Socket.io singleton

---

## Prompt to Resume in Any AI Model

```
You are continuing development of Sha'lelha (شعللها), an Arabic-first real-time
multiplayer party game platform. The project is at C:\shllahaV2.

Read HANDOFF.md first — it contains everything you need to know.

Phase 1 is COMPLETE. Both services are live:
- Backend health: https://shallelha-server-production.up.railway.app/health
- Frontend: https://shallelha.vercel.app

The next action is: /gsd-plan-phase 2 (Room System & Real-Time Core)

This uses the GSD workflow. GSD commands are available as slash commands in Claude Code.
Pay special attention to the 7 critical technical findings in HANDOFF.md.
```

---

*Generated: 2026-04-10 | Phase 1 complete — infrastructure live, ready for Phase 2*
