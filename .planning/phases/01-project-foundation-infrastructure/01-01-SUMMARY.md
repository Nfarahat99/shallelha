---
phase: 01-project-foundation-infrastructure
plan: "01"
subsystem: infra
tags: [monorepo, deployment, railway, vercel, npm-workspaces]
dependency_graph:
  requires: []
  provides: [monorepo-root, railway-config, vercel-config, env-template]
  affects: [all-subsequent-plans]
tech_stack:
  added: [npm-workspaces]
  patterns: [monorepo-two-folder, railway-dockerfile-builder, vercel-nextjs-framework]
key_files:
  created:
    - package.json
    - .gitignore
    - .env.example
    - .nvmrc
    - railway.json
    - vercel.json
    - apps/server/.railwayignore
  modified: []
decisions:
  - "npm workspaces without Turborepo — sufficient for Phase 1; avoids build orchestration complexity"
  - "REDIS_URL includes ?family=0 documented in .env.example — required for Railway IPv6 DNS resolution"
  - "railway.json uses DOCKERFILE builder pointing to apps/server/Dockerfile (created in Plan 02)"
  - "vercel.json uses nextjs framework with apps/web workspace build command"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-09"
  tasks_completed: 1
  tasks_total: 2
  files_created: 7
  files_modified: 0
---

# Phase 01 Plan 01: Monorepo Scaffold and Deployment Configuration Summary

## One-liner

npm workspaces monorepo root with Railway (Dockerfile builder + /health) and Vercel (nextjs framework) deployment configs, plus comprehensive .env.example documenting all required vars including the critical `?family=0` Redis suffix.

## Status

**Task 1: COMPLETE** (commit `55b616d`)
**Task 2: AWAITING HUMAN ACTION** — see `CHECKPOINT.md` for full instructions

Task 2 requires creating Railway and Vercel projects via browser UI. This cannot be automated without prior account authentication. A CHECKPOINT.md file has been created with step-by-step instructions.

---

## Tasks Completed

### Task 1: Scaffold monorepo root and configure deployment files

**Commit:** `55b616d`

Created all 7 required files exactly as specified in the plan:

| File | Key Detail |
|------|-----------|
| `package.json` | npm workspaces: `["apps/web", "apps/server"]`, Node.js >=18 engine constraint |
| `.gitignore` | Blocks all `.env` variants; allows `.env.example`; covers Next.js, Node.js, OS, IDE, Railway |
| `.env.example` | All required vars documented; `?family=0` Redis note; placeholder values only (no secrets) |
| `.nvmrc` | `18` — pins Node.js LTS version |
| `railway.json` | `DOCKERFILE` builder, `/health` healthcheck path, 30s timeout, ON_FAILURE restart |
| `vercel.json` | `nextjs` framework, `apps/web/.next` output, workspace build command |
| `apps/server/.railwayignore` | Excludes `node_modules/`, `*.test.ts`, `*.spec.ts`, `vitest.config.ts`, `.env` |

**Verification results:**

- `package.json` workspaces: PASS (includes both `apps/web` and `apps/server`)
- `.gitignore` blocks `.env`: PASS (`git check-ignore .env` confirms it is ignored)
- `.env.example` not gitignored: PASS (`git check-ignore .env.example` confirms it is tracked)
- `.env.example` contains `DATABASE_URL`, `family=0`, `NEXT_PUBLIC_BACKEND_URL`: PASS
- `railway.json` has `/health` healthcheckPath: PASS

---

## Tasks Awaiting Human Action

### Task 2: Create Railway project and Vercel project, wire environment variables

**Status:** BLOCKED — requires browser/UI actions

**Instructions:** See `.planning/phases/01-project-foundation-infrastructure/CHECKPOINT.md`

**What's needed:**
1. Create Railway project with Node.js service + PostgreSQL plugin + Redis plugin (all in SAME project for private networking)
2. Wire Railway env vars: `DATABASE_URL`, `REDIS_URL` (with `?family=0`), `FRONTEND_URL`, `NODE_ENV`, `PORT`
3. Create Vercel project connected to this repo
4. Wire Vercel env var: `NEXT_PUBLIC_BACKEND_URL`
5. Record both public URLs for Plans 02 and 03

---

## Deviations from Plan

None — Task 1 executed exactly as specified in the plan.

---

## Threat Surface Scan

| Control | Status |
|---------|--------|
| T-01-01: `.env` files excluded from git | VERIFIED — `git check-ignore .env` confirmed |
| T-01-03: CORS origin via `FRONTEND_URL` | DOCUMENTED — `.env.example` has `FRONTEND_URL` placeholder; implementation in Plan 02 |
| T-01-04: `NODE_ENV=production` in Railway | DOCUMENTED — `.env.example` shows `NODE_ENV=development` for local; Railway will use `production` |

No new threat surface introduced beyond what is in the plan's threat model.

---

## Known Stubs

None — this plan creates only configuration files. No application code with placeholder data.

---

## Output for Subsequent Plans

Plans 02 and 03 will need the Railway and Vercel URLs from Task 2 to:
- Set `NEXT_PUBLIC_BACKEND_URL` in the Next.js app
- Configure CORS origin in Express/Socket.io
- Run the health check smoke test: `curl -f https://[railway-url]/health`

---

## Self-Check

**Files verified:**

- `package.json`: EXISTS
- `.gitignore`: EXISTS
- `.env.example`: EXISTS
- `.nvmrc`: EXISTS
- `railway.json`: EXISTS
- `vercel.json`: EXISTS
- `apps/server/.railwayignore`: EXISTS

**Commit verified:**

- `55b616d`: EXISTS (Task 1 monorepo scaffold)

## Self-Check: PASSED
