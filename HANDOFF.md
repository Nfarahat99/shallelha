# Sha'lelha (شعللها) — Project Handoff Document

**Date:** 2026-04-09
**Status:** Phase 1 planned, ready for execution
**Next action:** Execute Phase 1 — `/gsd-execute-phase 1`

---

## What Was Built in This Session

### 1. PRD — Validated & Rebuilt (`shallelha.md`)

The original PRD had gaps (no tech stack decision, no target name chosen, no success metrics). It was fully rebuilt with:
- Name locked: **Sha'lelha (شعللها)**
- Tech stack locked (see below)
- 3-phase roadmap with clear scope boundaries
- Out-of-scope items documented with reasons
- Non-functional requirements (latency, concurrency, browser targets)

### 2. GSD Project Initialized

GSD (Get Shit Done) is an agentic planning framework for Claude Code. It was initialized with:

```
.planning/
├── PROJECT.md        ← Vision, requirements, key decisions
├── REQUIREMENTS.md   ← 35 v1 requirements with IDs (ROOM, GAME, SCORE, LIFE, SYNC, RTL, ADMIN, INFRA)
├── ROADMAP.md        ← 8-phase roadmap for MVP, Phase 1 plans listed
├── STATE.md          ← Project memory / session continuity
└── config.json       ← YOLO mode, standard granularity, all quality agents on
```

### 3. Phase 1 Planned & Verified

Three PLAN.md files were created and verified by a plan-checker agent:

```
.planning/phases/01-project-foundation-infrastructure/
├── 01-RESEARCH.md      ← Technical research with critical findings
├── 01-01-PLAN.md       ← DevOps: monorepo, Railway/Vercel deploy, env vars
├── 01-02-PLAN.md       ← Backend: Express + Socket.io + Prisma 6 + ioredis
└── 01-03-PLAN.md       ← Frontend: Next.js 14 + Tailwind RTL + Cairo font
```

### 4. Skills Installed

Five specialized skills are installed in `.agents/skills/` and symlinked to Claude Code:

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
| Frontend | Next.js **14.x** (App Router) | Pin to 14.x — `create-next-app@latest` installs 15+ today |
| Styling | Tailwind CSS | RTL via logical properties only (`ms-`, `ps-`, `text-start`) — NEVER `ml-`, `pl-` |
| Arabic font | Cairo | Google Fonts, Arabic + Latin subsets |
| Backend | Node.js + Express + Socket.io | Must run on Railway — Vercel is serverless, cannot host WebSockets |
| ORM | Prisma **6.x** (not 7) | Prisma 7 has breaking changes (ESM-only, driver adapters required) |
| Database | PostgreSQL | Hosted on Railway |
| Cache | Redis via ioredis | Hosted on Railway |
| Auth | NextAuth.js | Phase 2 — not needed in Phase 1 |
| Media | Cloudinary | Images, audio, blurring transforms — Phase 5 |
| Deployment | Vercel (frontend) + Railway (backend + DB + Redis) | Same Railway project for private networking |

---

## Critical Technical Findings (Read Before Touching Code)

These were discovered during Phase 1 research. Violating them causes hard-to-debug failures:

### 1. Socket.io Cannot Run on Vercel
Vercel is serverless — persistent WebSocket connections are not supported. Socket.io server **must** live on Railway. The Next.js frontend connects to it via `NEXT_PUBLIC_BACKEND_URL` env var.

### 2. Pin Next.js to 14.x
Running `npx create-next-app@latest` today installs Next.js 15+. After scaffolding, verify `package.json` has `"next": "14.x"` and downgrade if needed:
```bash
npm install next@14 --workspace=apps/web
```

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

---

## Monorepo Structure (Target)

```
shallelha/                    ← git root (C:\shllahaV2)
├── apps/
│   ├── web/                  ← Next.js 14 frontend (Vercel)
│   └── server/               ← Node.js + Express + Socket.io (Railway)
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

All must be set before deployment. Template is in `.env.example`:

| Variable | Where Set | Value |
|----------|-----------|-------|
| `DATABASE_URL` | Railway (Node.js service) | `${{Postgres.DATABASE_URL}}` (Railway reference variable) |
| `REDIS_URL` | Railway (Node.js service) | `${{Redis.REDIS_PRIVATE_URL}}?family=0` (append `?family=0`) |
| `FRONTEND_URL` | Railway (Node.js service) | Vercel public URL (set after Vercel deploy) |
| `PORT` | Railway (Node.js service) | `4000` |
| `NODE_ENV` | Railway (Node.js service) | `production` |
| `NEXT_PUBLIC_BACKEND_URL` | Vercel | Railway public URL |

**Railway project rule:** PostgreSQL, Redis, and Node.js service must all be in the **same Railway project** (not separate projects) to use private networking.

---

## 8-Phase Roadmap

| Phase | Name | Status | Key Requirements |
|-------|------|--------|-----------------|
| **1** | Project Foundation & Infrastructure | **PLANNED — READY TO EXECUTE** | INFRA-01, INFRA-04 |
| 2 | Room System & Real-Time Core | Not planned | ROOM-01–06, SYNC-01–03, INFRA-02–03 |
| 3 | Arabic UI — Host Display & Player Controller | Not planned | RTL-01–05 |
| 4 | Question Engine — Multiple Choice & Scoring | Not planned | GAME-01, 04, 05, SCORE-01–04 |
| 5 | Question Engine — Media Guessing & Free Text | Not planned | GAME-02–03 |
| 6 | Lifelines | Not planned | LIFE-01–04 |
| 7 | Admin Dashboard & Content Management | Not planned | ADMIN-01–05 |
| 8 | Polish, Performance & Launch | Not planned | INFRA-01–03 (final) |

---

## Phase 1 Execution Instructions

### Pre-requisites (Human Actions Required)
Before running Phase 1 execution, you need:
- [ ] GitHub repository connected (already done — `C:\shllahaV2`)
- [ ] Railway account created at https://railway.app
- [ ] Vercel account created at https://vercel.com

Plan `01-01` has a **human checkpoint** at Task 2 that walks through Railway and Vercel project setup step-by-step. Do not skip it.

### How to Execute

```bash
# In Claude Code, from C:\shllahaV2:
/gsd-execute-phase 1
```

This will:
1. Run Plan 01-01 (DevOps) + Plan 01-02 (Backend) **in parallel** (Wave 1)
2. Wait for Wave 1 to complete
3. Run Plan 01-03 (Frontend) (Wave 2 — depends on monorepo structure from 01-01)
4. Run verifier agent to confirm phase goal is met

### What Each Plan Does

**Plan 01-01 (DevOps) — Wave 1:**
- Creates monorepo root: `package.json` (npm workspaces), `.gitignore`, `.env.example`, `.nvmrc`
- Creates `railway.json`, `vercel.json`, `apps/server/.railwayignore`
- **Human checkpoint:** Create Railway project (Node.js + PostgreSQL + Redis in same project), create Vercel project, wire env vars between them

**Plan 01-02 (Backend) — Wave 1:**
- Scaffolds `apps/server/` with TypeScript + Express + Socket.io
- Sets up Prisma 6 with PostgreSQL connection
- Sets up ioredis with `?family=0` Railway fix
- Implements `GET /health` endpoint (checks postgres + redis)
- Creates `Dockerfile` for Railway
- Tests with Vitest

**Plan 01-03 (Frontend) — Wave 2:**
- Scaffolds `apps/web/` with Next.js 14.x (verifies and pins version)
- Configures Tailwind CSS with RTL logical properties
- Adds Cairo Arabic font to `layout.tsx` with `dir="rtl"`
- Creates Socket.io singleton (`lib/socket.ts`) connecting to `NEXT_PUBLIC_BACKEND_URL`
- Creates Arabic-first landing page using only logical CSS properties

### Success Criteria for Phase 1
- [ ] `curl https://[railway-url]/health` returns `{"status":"ok","postgres":"ok","redis":"ok"}`
- [ ] `https://[vercel-url]` returns HTTP 200 with Arabic Cairo font visible
- [ ] No secrets hardcoded anywhere in the repository
- [ ] `.env.example` documents all required variables

---

## GSD Workflow Commands Reference

```bash
# Check project status
/gsd-progress

# Plan the next phase
/gsd-plan-phase 2

# Execute current phase
/gsd-execute-phase 1

# Resume after a break
/gsd-resume-work

# Debug an issue
/gsd-debug "description of problem"

# Run code review after execution
/gsd-code-review

# Verify phase goal was met
/gsd-verify-work 1
```

---

## Open Questions (Resolve Before Phase 2)

1. **Host account requirement:** Does the host need an account to create a room, or is anonymous room creation allowed? This affects Phase 2 (Room System) database schema.
2. **Question bank:** Who is populating the initial 200 questions across 6 categories? This is needed before Phase 7 (Admin Dashboard).
3. **Solo/practice mode:** Is multiplayer always required, or is there a single-player practice mode?

---

## Key Files to Read

Before continuing work, read these files in order:

1. `shallelha.md` — Full PRD with all product decisions
2. `.planning/PROJECT.md` — Vision, active requirements, key decisions
3. `.planning/ROADMAP.md` — 8-phase structure with current status
4. `.planning/REQUIREMENTS.md` — All 35 v1 requirements with IDs
5. `.planning/phases/01-project-foundation-infrastructure/01-RESEARCH.md` — Critical technical findings
6. `.planning/phases/01-project-foundation-infrastructure/01-01-PLAN.md` — DevOps plan (start here)
7. `.planning/phases/01-project-foundation-infrastructure/01-02-PLAN.md` — Backend plan
8. `.planning/phases/01-project-foundation-infrastructure/01-03-PLAN.md` — Frontend plan

---

## Prompt to Resume in Any AI Model

Paste this at the start of a new session:

```
You are continuing development of Sha'lelha (شعللها), an Arabic-first real-time 
multiplayer party game platform. The project is at C:\shllahaV2.

Read HANDOFF.md first — it contains everything you need to know about what was done 
and what to do next.

The immediate next action is: /gsd-execute-phase 1

This uses the GSD workflow (Get Shit Done). GSD commands are available as slash 
commands in Claude Code. The plans are already written in 
.planning/phases/01-project-foundation-infrastructure/

Before executing, read the three PLAN.md files and the RESEARCH.md in that directory.
Pay special attention to the 6 critical technical findings in HANDOFF.md.
```

---

*Generated: 2026-04-09 | Session: Project initialization → Phase 1 planning complete*
