# Checkpoint: Task 2 — Create Railway Project and Vercel Project

**Plan:** 01-01 (Phase 01: Project Foundation & Infrastructure)
**Status:** Waiting for human action — cloud platform setup required
**Task 1:** COMPLETE (commit `55b616d`)
**Task 2:** BLOCKED — requires browser/UI actions only a human can perform

---

## What Was Done (Task 1)

All monorepo root config files have been created and committed:

| File | Purpose |
|------|---------|
| `package.json` | npm workspaces root (apps/web + apps/server) |
| `.gitignore` | Excludes all .env variants, node_modules, build outputs |
| `.env.example` | Template for all required env vars (committed, no secrets) |
| `.nvmrc` | Pins Node.js 18 |
| `railway.json` | Railway deployment config: DOCKERFILE builder, /health healthcheck |
| `vercel.json` | Vercel deployment config: Next.js framework, apps/web workspace |
| `apps/server/.railwayignore` | Excludes test files and node_modules from Railway builds |

---

## What You Need to Do (Task 2)

Complete these steps **in order**. Both Railway and Vercel are cloud platforms — no CLI is available without prior login.

### Part 1: Railway Setup (backend + PostgreSQL + Redis)

1. Go to https://railway.app — create an account or log in
2. Click **"New Project"** → **"Empty Project"** — name it `shallelha`
3. Inside the project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"** — Railway provisions it automatically
4. Click **"+ New"** again → **"Database"** → **"Add Redis"** — Railway provisions it automatically
5. Click **"+ New"** → **"GitHub Repo"** → connect this repository → select the `shallelha` repo
6. Railway will detect `railway.json` and use the Dockerfile builder (Dockerfile is created in Plan 02 — the service will fail to build until then, that is expected)
7. Go to the Node.js service → **"Variables"** tab → add these environment variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway reference variable — copy exactly as written)
   - `REDIS_URL` = `${{Redis.REDIS_PRIVATE_URL}}?family=0` (append `?family=0` manually — REQUIRED for IPv6 DNS)
   - `FRONTEND_URL` = leave blank for now (fill in after Vercel deploy below)
   - `NODE_ENV` = `production`
   - `PORT` = `4000`
8. Note the Railway public URL from the service's **"Settings"** tab (e.g. `https://shallelha-server-xxxx.up.railway.app`)

**CRITICAL:** All three services (Node.js, PostgreSQL, Redis) MUST be in the **same Railway project**, not separate projects. Same project = private networking. Separate projects = no private network, added latency and egress costs.

### Part 2: Vercel Setup (frontend)

1. Go to https://vercel.com — create an account or log in
2. Click **"Add New Project"** → import the `shallelha` GitHub repository
3. Leave root directory **blank** — Vercel will use `vercel.json`
4. Under **"Environment Variables"**, add:
   - `NEXT_PUBLIC_BACKEND_URL` = the Railway public URL from step 8 above
5. Click **"Deploy"**
6. Note the Vercel URL (e.g. `https://shallelha.vercel.app`)

### Part 3: Complete Railway FRONTEND_URL

7. Go back to Railway → Node.js service → Variables → set:
   - `FRONTEND_URL` = the Vercel URL from step 6 above

---

## After You Complete These Steps

Record both URLs here or in the SUMMARY.md for use by Plans 02 and 03:

- Railway URL: `https://[your-railway-service].up.railway.app`
- Vercel URL: `https://[your-project].vercel.app`

---

## Verification (after Plan 02 deploys the server code)

```bash
# Health check — will pass after Plan 02 deploys the Node.js server
curl -f https://[your-railway-url]/health
# Expected: {"status":"ok","postgres":"ok","redis":"ok"}
```

---

## Next Step

Once both platforms are set up and URLs are recorded, resume with **Plan 01-02** (Node.js backend scaffold). The health check endpoint (`GET /health`) will be implemented there.
