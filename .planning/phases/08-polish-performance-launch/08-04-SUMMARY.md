---
phase: 08
plan: "04"
title: "Production Configuration & Deployment Audit"
status: complete
subsystem: devops, configuration
tags: [env-vars, deployment, robots-txt, railway, vercel, e2e, cloudinary]
completed: "2026-04-17T19:57:28Z"
duration_minutes: 15
tasks_completed: 8
tasks_total: 8
key_files:
  created:
    - apps/web/.env.example
    - apps/server/.env.example
    - apps/web/public/robots.txt
    - apps/server/railway.json
    - apps/web/vercel.json
  modified:
    - e2e-test.mjs
    - e2e-phase5.mjs
  verified_no_change:
    - apps/web/next.config.mjs
decisions:
  - Web .env.example uses NEXT_PUBLIC_BACKEND_URL (not NEXT_PUBLIC_SOCKET_URL) — matches actual code in apps/web/lib/socket.ts
  - No output: standalone added to next.config.mjs — Vercel handles its own build pipeline; standalone is for Docker/self-hosting only
  - Created apps/web/public/ directory as it did not exist — Next.js auto-serves from this path
requirements: []
---

# Phase 08 Plan 04: Production Configuration & Deployment Audit Summary

**One-liner:** Deployment configuration hardened — .env.example files, Railway/Vercel configs, robots.txt, and env-parameterized e2e scripts all created from scratch.

---

## What Was Built

### Task 1 — Web `.env.example`
Created `apps/web/.env.example` covering all env vars found by scanning the web app source:
- `NEXT_PUBLIC_BACKEND_URL` — Socket.io/backend URL (public, browser-exposed)
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth (from `apps/web/auth.ts`)
- `AUTH_SECRET` — Auth.js signing secret
- `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN` — Admin dashboard auth (from `apps/web/app/api/admin/login/route.ts` and `apps/web/middleware.ts`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Image upload (from `apps/web/app/api/admin/upload/route.ts`)
- `DATABASE_URL` — Prisma database (from `apps/web/lib/prisma.ts`)
- `NODE_ENV` — Runtime environment flag

**Note:** The actual var name used in code is `NEXT_PUBLIC_BACKEND_URL` (in `apps/web/lib/socket.ts`), not `NEXT_PUBLIC_SOCKET_URL`. The .env.example correctly reflects the code.

### Task 2 — Server `.env.example`
Created `apps/server/.env.example` covering all env vars found in `apps/server/src/`:
- `PORT` — Express server port
- `DATABASE_URL` — PostgreSQL (Prisma schema)
- `REDIS_URL` — Redis client
- `FRONTEND_URL` — CORS origin allowlist
- `NODE_ENV` — Prisma logging and error message behavior

### Task 3 — `e2e-test.mjs` Env-var Parameterization
Replaced hardcoded URL constants:
```js
// Before
const BASE = 'https://shallelha.vercel.app'
const SERVER = 'https://shallelha-server-production.up.railway.app'

// After
const BASE = process.env.BASE_URL || 'https://shallelha.vercel.app'
const SERVER = process.env.SERVER_URL || 'https://shallelha-server-production.up.railway.app'
```
Default values ensure backward compatibility with no env vars set.

### Task 4 — `e2e-phase5.mjs` Env-var Parameterization
Applied the identical pattern to the phase 5 e2e file.

### Task 5 — `next.config.mjs` Cloudinary Verification
`res.cloudinary.com` was already present in `images.remotePatterns`. No change needed.

```js
// Already in place:
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }
  ]
}
```

### Task 6 — `robots.txt`
Created `apps/web/public/robots.txt` (and the `public/` directory which did not exist):
```
User-agent: *
Allow: /

Sitemap: https://shallelha.vercel.app/sitemap.xml
```
Next.js auto-serves files from `public/` at the root path — no configuration needed.

### Task 7 — `apps/server/railway.json`
Created Railway deployment configuration from scratch:
- `builder: DOCKERFILE` — uses existing `Dockerfile`
- `healthcheckPath: /health` — existing `/health` endpoint
- `healthcheckTimeout: 30` — 30 second startup allowance
- `restartPolicyType: ON_FAILURE` with max 3 retries

### Task 8 — `apps/web/vercel.json`
Created Vercel deployment configuration:
- `framework: nextjs` — signals Next.js detection to Vercel
- `buildCommand: npx next build`
- `outputDirectory: .next`

---

## Verification Results

| Check | Result |
|---|---|
| `tsc --noEmit` (server) | Clean — 0 errors |
| Server tests | 78/78 passing |
| `NEXT_PUBLIC_` count in web .env.example | 2 |
| `DATABASE_URL\|REDIS_URL\|FRONTEND_URL\|PORT` count in server .env.example | 4 |
| `process.env.BASE_URL` in e2e-test.mjs | 1 |
| `process.env.SERVER_URL` in e2e-test.mjs | 1 |
| `process.env.BASE_URL` in e2e-phase5.mjs | 1 |
| `process.env.SERVER_URL` in e2e-phase5.mjs | 1 |
| `cloudinary` in next.config.mjs | 1 (already present) |
| `User-agent` in robots.txt | 1 |
| `healthcheckPath` in railway.json | 1 |
| All files exist | YES |

---

## Commits

| Hash | Description |
|---|---|
| 13a91fb | feat(08-04): add .env.example for web and server apps |
| 185c4de | feat(08-04): parameterize e2e test URLs via BASE_URL / SERVER_URL env vars |
| 363032c | feat(08-04): add robots.txt to web app public directory |
| 0e3bf48 | feat(08-04): add railway.json and vercel.json deployment configs |

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- `NEXT_PUBLIC_SOCKET_URL` listed in the plan spec was **not** the actual var name in code. The actual var is `NEXT_PUBLIC_BACKEND_URL` (used in `apps/web/lib/socket.ts`). The .env.example uses the correct name from the source.
- `apps/web/public/` directory did not exist and was created as part of Task 6. This is standard Next.js — a missing `public/` is fine until you need static files.

---

## Known Stubs

None.

---

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

---

## Self-Check: PASSED

- `apps/web/.env.example` — FOUND
- `apps/server/.env.example` — FOUND
- `apps/web/public/robots.txt` — FOUND
- `apps/server/railway.json` — FOUND
- `apps/web/vercel.json` — FOUND
- `e2e-test.mjs` contains `process.env.BASE_URL` — FOUND
- `e2e-phase5.mjs` contains `process.env.BASE_URL` — FOUND
- Commits 13a91fb, 185c4de, 363032c, 0e3bf48 — verified in git log
