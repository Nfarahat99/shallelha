# Phase 1: Project Foundation & Infrastructure - Research

**Researched:** 2026-04-09
**Domain:** Monorepo scaffolding, Next.js 14 App Router + RTL, Node.js/Express/Socket.io backend, PostgreSQL/Prisma, Redis, Vercel + Railway deployment
**Confidence:** MEDIUM-HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Application is deployed to a public URL (Vercel frontend + Railway backend) | Vercel + Railway deployment patterns documented; Railway multi-service project confirmed |
| INFRA-04 | Environment variables and secrets managed securely (not hardcoded) | Vercel env var management + Railway Variables pattern documented |
</phase_requirements>

---

## Summary

Phase 1 sets up a working skeleton — two deployable services (Next.js frontend on Vercel, Node.js/Express/Socket.io backend on Railway) sharing a PostgreSQL database and Redis instance — both running with health checks passing before any game logic exists.

The stack has one critical architectural decision that affects everything: Socket.io cannot run on Vercel (serverless, no persistent connections). The Socket.io server MUST live on Railway. The Next.js frontend on Vercel connects to it via the Railway public URL. This is the correct and intended architecture per the PRD.

Prisma 7 (latest) introduces major breaking changes from Prisma 6 — the generator target changed, `node_modules` generation is gone, and `prisma.config.ts` replaces datasource URL in schema files. Given the project is greenfield, use Prisma 6 (6.x, latest stable) to avoid the complexity of Prisma 7's new driver adapter requirement and ESM-only constraint unless there is a specific reason to adopt v7 now.

**Primary recommendation:** Use a simple two-folder monorepo (`apps/web` + `apps/server`) without a Turbo/Nx build system for Phase 1 — shared types can be imported directly. Introduce Turborepo only if build coordination becomes a pain point in later phases.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.x (pin to 14) | Frontend framework | Locked by PRD; App Router, SSR for host display |
| react / react-dom | 18.x | React runtime for Next.js 14 | Next.js 14 targets React 18 (not React 19) |
| tailwindcss | 4.2.2 | Utility CSS + RTL logical props | Latest stable [VERIFIED: npm registry] |
| @prisma/client + prisma | 6.x | PostgreSQL ORM | v7 has major breaking changes; v6 is stable and Railway-tested [ASSUMED: Prisma 7 is in a rapidly changing state] |
| socket.io | 4.8.3 | Real-time WebSocket server | Latest stable [VERIFIED: npm registry] |
| socket.io-client | 4.8.3 | Client side socket connection | Must match server major version |
| ioredis | 5.10.1 | Redis client for Node.js | Latest stable; required Railway-specific `?family=0` param [VERIFIED: npm registry] |
| express | 5.2.1 | HTTP server for backend | Latest stable [VERIFIED: npm registry] |
| cors | ^2.8 | CORS middleware for Express | Required for Vercel → Railway cross-origin |
| helmet | ^8.x | Security headers | Standard Express hardening |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | ^5.x | Type safety across both apps | Always — both apps use TypeScript |
| dotenv | ^16.x | Env var loading in backend | Local dev; Railway injects vars automatically |
| zod | ^3.x | Input validation | Any user-submitted data in API routes |
| @next/font (built-in) | part of Next.js | Cairo Arabic font, self-hosted | Use `next/font/google` with `subsets: ['arabic']` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple two-folder monorepo | Turborepo / Nx | Turbo adds build orchestration complexity not needed in Phase 1; worth adding in Phase 3+ if CI times increase |
| Prisma 6 | Prisma 7 | Prisma 7 removes Rust engine (90% bundle reduction) but requires driver adapters and `prisma.config.ts` — greenfield advantage doesn't outweigh migration friction for a fast Phase 1 |
| ioredis | node-redis (official) | Both work; ioredis has better Railway compatibility docs and retryStrategy |

**Installation (frontend):**
```bash
npx create-next-app@14 web --typescript --tailwind --app --src-dir --import-alias "@/*"
# Then pin next to 14.x in package.json
```

**Installation (backend):**
```bash
mkdir server && cd server && npm init -y
npm install express socket.io ioredis cors helmet dotenv
npm install -D typescript @types/express @types/node ts-node nodemon
npm install prisma @prisma/client
npx prisma init
```

**Version verification:** Versions above were verified against npm registry on 2026-04-09. Next.js latest is 16.2.3 — pin explicitly to `14.x` in package.json to avoid accidental upgrade.

---

## Architecture Patterns

### Recommended Project Structure

```
shallelha/                        # git root
├── apps/
│   ├── web/                      # Next.js 14 frontend (deploys to Vercel)
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout: Cairo font, dir="rtl", lang="ar"
│   │   │   ├── page.tsx          # Landing page
│   │   │   └── (game)/           # Route group for game screens
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── socket.ts         # socket.io-client singleton ("use client")
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── server/                   # Node.js + Express + Socket.io (deploys to Railway)
│       ├── src/
│       │   ├── index.ts           # Entry: http.createServer(app) → io attach
│       │   ├── socket/
│       │   │   └── index.ts       # Socket.io server setup
│       │   ├── routes/
│       │   │   └── health.ts      # GET /health
│       │   ├── db/
│       │   │   └── prisma.ts      # PrismaClient singleton
│       │   └── redis/
│       │       └── client.ts      # ioredis singleton
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── .env.example                   # Template for both apps
└── package.json                   # Root: workspace scripts only (no Turbo needed)
```

### Pattern 1: Next.js 14 Root Layout with Arabic RTL

**What:** Configure the HTML root to be Arabic RTL with Cairo font from next/font/google
**When to use:** Always — this is the root `app/layout.tsx`

```tsx
// apps/web/app/layout.tsx
// Source: next-best-practices skill (font.md) + Tailwind RTL docs
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
```

```js
// apps/web/tailwind.config.ts
// Source: next-best-practices skill (font.md)
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'sans-serif'],
      },
    },
  },
}
export default config
```

```css
/* apps/web/app/globals.css */
/* Use Tailwind logical properties throughout — ps/pe instead of pl/pr, ms/me instead of ml/mr */
/* This makes all spacing automatically RTL-aware */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Pattern 2: Socket.io Client Singleton (Next.js)

**What:** Create a client-side Socket.io connection pointing to the Railway backend URL
**When to use:** Any client component that needs real-time events

```typescript
// apps/web/lib/socket.ts
// Source: Socket.io docs — https://socket.io/how-to/use-with-nextjs
'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      transports: ['websocket'],  // Skip polling — Railway doesn't need it
      autoConnect: false,
    })
  }
  return socket
}
```

**Important:** `transports: ['websocket']` skips HTTP long-polling entirely. This is correct for Railway because Railway does NOT support sticky sessions. If polling falls back, requests from the same client can hit different processes and break the connection. Forcing WebSocket-only avoids this entirely.

### Pattern 3: Express + Socket.io Server Entry

**What:** Attach Socket.io to an HTTP server created from Express app
**When to use:** Always — Socket.io must share the HTTP server with Express

```typescript
// apps/server/src/index.ts
// Source: nodejs-backend-patterns skill + Socket.io docs
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import { setupSocketHandlers } from './socket'
import { healthRouter } from './routes/health'

const app = express()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,  // e.g. https://shallelha.vercel.app
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],  // Force WebSocket — no polling
})

// Express middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

// Routes
app.use('/health', healthRouter)

// Socket.io handlers
setupSocketHandlers(io)

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
```

### Pattern 4: Prisma Client Singleton (Backend)

```typescript
// apps/server/src/db/prisma.ts
// Source: Prisma docs — standard singleton pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Pattern 5: ioredis Client (Railway-compatible)

```typescript
// apps/server/src/redis/client.ts
// Source: Railway Help Station — ioredis Railway connection issues
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL

if (!redisUrl) throw new Error('REDIS_URL is required')

export const redis = new Redis(`${redisUrl}?family=0`, {
  lazyConnect: true,
  connectTimeout: 15000,
  retryStrategy: (times) => Math.min(times * 30, 1000),
})

redis.on('error', (err) => console.error('Redis error:', err))
```

**Critical:** The `?family=0` suffix is required for ioredis on Railway. Without it, DNS resolution fails in Railway's private network. [VERIFIED: Railway Help Station multiple threads]

### Pattern 6: Health Check Endpoint

```typescript
// apps/server/src/routes/health.ts
import { Router } from 'express'
import { prisma } from '../db/prisma'
import { redis } from '../redis/client'

export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  const checks: Record<string, string> = { status: 'ok' }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.postgres = 'ok'
  } catch {
    checks.postgres = 'error'
  }

  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const allOk = Object.values(checks).every((v) => v !== 'error')
  res.status(allOk ? 200 : 503).json(checks)
})
```

### Anti-Patterns to Avoid

- **Embedding Socket.io in Next.js API routes:** Vercel serverless functions terminate after response — persistent WebSocket connections are not possible. The server MUST be separate on Railway. [VERIFIED: Vercel/Socket.io GitHub discussions]
- **Using `*` as CORS origin in production:** Socket.io v3+ disables CORS by default; explicitly set `FRONTEND_URL`. Never use wildcard in production.
- **HTTP long-polling with Railway:** Railway has no sticky sessions. If polling is enabled and multiple server replicas exist, connections break. Always set `transports: ['websocket']` on both client and server.
- **Importing Cairo font in individual components:** Creates multiple font instances. Import once in `app/layout.tsx` and expose as CSS variable.
- **Using left/right Tailwind classes for layout:** With RTL, `ml-4` becomes wrong-side margin. Always use logical properties: `ms-4` (margin-start), `ps-4` (padding-start), etc.
- **Hardcoding secrets:** All secrets must be in environment variables. No secrets in code. This directly addresses INFRA-04.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading + optimization | Manual `<link>` or CSS @import | `next/font/google` | Self-hosts font, eliminates CLS, preloads subset only |
| WebSocket server | Raw `ws` library | Socket.io | Room management, namespaces, reconnection, broadcasting — all built in |
| Database connection pool | Manual pg pool | Prisma Client | Type-safe queries, migrations, schema management |
| Redis reconnection logic | Custom retry loop | ioredis retryStrategy | Built-in exponential backoff and connection recovery |
| CORS handling | Manual headers | `cors` npm package | Handles preflight, credentials, headers correctly |
| Request validation | Manual if/else checks | `zod` | Schema validation, TypeScript inference, error messages |

**Key insight:** All of these problems have well-tested libraries with years of edge-case handling. The game logic is complex enough — spend Phase 1 budget on scaffolding, not infrastructure primitives.

---

## Common Pitfalls

### Pitfall 1: Next.js 14 vs. Latest (16.x)

**What goes wrong:** Running `npx create-next-app@latest` installs Next.js 16.x (current npm latest), not 14.x.
**Why it happens:** npm `latest` tag always points to the newest stable version.
**How to avoid:** After `create-next-app`, immediately pin `"next": "14.x"` in `package.json` and run `npm install`.
**Warning signs:** App router async APIs behave differently; `params` in Next.js 15+ are async.

### Pitfall 2: Socket.io CORS Breaks in Production

**What goes wrong:** Socket.io connection fails with CORS error when frontend moves from localhost to Vercel production URL.
**Why it happens:** Socket.io v3+ requires explicit CORS config; `origin: *` was the old default.
**How to avoid:** Set `FRONTEND_URL` env var in Railway; configure `cors.origin` on both Express and SocketServer using that variable.
**Warning signs:** Console shows "CORS policy: No 'Access-Control-Allow-Origin'" for WebSocket upgrade request.

### Pitfall 3: ioredis DNS Resolution Failure on Railway

**What goes wrong:** `Error: connect ECONNREFUSED redis.railway.internal:6379` in Railway backend logs.
**Why it happens:** Railway's private networking uses IPv6 by default; ioredis defaults to IPv4 resolution (family=4).
**How to avoid:** Append `?family=0` to `REDIS_URL` (allows both IPv4 and IPv6 resolution).
**Warning signs:** Redis connection timeout or ECONNREFUSED only in Railway, works fine locally.

### Pitfall 4: Prisma 7 Breaking Changes

**What goes wrong:** If someone installs `prisma@latest` they get v7, which has a completely different configuration model — no `generator client { provider = "prisma-client-js" }`, requires `prisma.config.ts`, and requires explicit driver adapters.
**Why it happens:** Prisma 7 is the npm `latest` as of 2026-04-09.
**How to avoid:** Pin `"prisma": "^6"` and `"@prisma/client": "^6"` in package.json explicitly.
**Warning signs:** `prisma generate` fails with "provider 'prisma-client-js' not found" or unfamiliar error about missing adapter.

### Pitfall 5: Tailwind RTL Layout Breaks

**What goes wrong:** UI looks correct in Chrome dev tools (LTR) but margins, padding, and icon positions are wrong in the actual RTL Arabic UI.
**Why it happens:** Using directional classes (`ml-`, `pl-`, `text-left`) instead of logical property classes (`ms-`, `ps-`, `text-start`).
**How to avoid:** Establish a team rule: never use `l`/`r` directional Tailwind classes. Use `s` (start) and `e` (end) everywhere. Tailwind v3.3+ supports logical properties natively.
**Warning signs:** Padding appears on the wrong side; icons are left-aligned when they should be right-aligned in Arabic.

### Pitfall 6: Multiple Railway Services vs. Single Project

**What goes wrong:** Creating Node.js, PostgreSQL, and Redis as separate Railway "projects" instead of services within one project — making private networking unavailable.
**Why it happens:** Railway's UI shows "New Project" prominently; it's easy to misunderstand the project/service hierarchy.
**How to avoid:** Create ONE Railway project, then add services inside it: Node.js service + PostgreSQL plugin + Redis plugin. All within same project = private networking via `*.railway.internal` URLs.
**Warning signs:** Services can only communicate via public URLs, incurring egress costs and latency.

---

## Code Examples

Verified patterns from official sources:

### Minimal Prisma Schema (Phase 1 skeleton)

```prisma
// apps/server/prisma/schema.prisma
// Source: Prisma docs — standard PostgreSQL setup
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Phase 1 skeleton — just enough to confirm connection
model Category {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

### Railway Environment Variables Setup

```
# Railway project → Node.js service → Variables tab
DATABASE_URL     = ${{Postgres.DATABASE_URL}}     # Railway reference variable
REDIS_URL        = ${{Redis.REDIS_PRIVATE_URL}}   # Private networking URL
FRONTEND_URL     = https://shallelha.vercel.app   # Set after Vercel deploy
NODE_ENV         = production
PORT             = 4000
```

```
# Vercel project → Environment Variables
NEXT_PUBLIC_BACKEND_URL = https://[your-railway-service].up.railway.app
NEXTAUTH_URL            = https://shallelha.vercel.app
NEXTAUTH_SECRET         = [generated secret]
```

### Socket.io Redis Adapter (for future scaling — note for Phase 2)

When Railway backend runs multiple replicas, add this to the Socket.io server:
```typescript
// Phase 2 consideration — not needed for Phase 1 single instance
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'

const pubClient = createClient({ url: process.env.REDIS_URL })
const subClient = pubClient.duplicate()
await Promise.all([pubClient.connect(), subClient.connect()])
io.adapter(createAdapter(pubClient, subClient))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/font` with `<link>` tags | `next/font/google` self-hosted | Next.js 13 | No external font request; zero CLS |
| Socket.io in Next.js API routes | Separate Node.js server for Socket.io | Next.js 13 App Router | Vercel serverless can't hold persistent connections |
| Tailwind RTL plugins | Tailwind native logical properties (`ps`, `pe`, `ms`, `me`) | Tailwind v3.3 (2023) | No plugin needed; `dir="rtl"` + logical props = automatic |
| Prisma 5/6 with `prisma-client-js` generator | Prisma 7 with `prisma-client` + driver adapters | Prisma 7 (2025) | Bundle 90% smaller; but breaking change — use Prisma 6 for this phase |
| `tailwindcss-rtl` plugin | Native Tailwind logical properties | Tailwind 3.3 | Plugin is unmaintained for Tailwind v3; use native |

**Deprecated/outdated:**
- `tailwindcss-rtl` npm package: Designed for Tailwind v2; not reliable on v3. Do not install.
- `socket.io-redis` (old adapter): Replaced by `@socket.io/redis-adapter`. Old package is abandoned.
- `next/font` with `preconnect` + Google Fonts CDN links: Replaced by self-hosted via `next/font/google`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma 6 is recommended over Prisma 7 for Phase 1 | Standard Stack | If Prisma 7 is stable enough, we're pinning unnecessarily — but the downside is low; can upgrade in Phase 2 |
| A2 | Cairo font supports `subsets: ['arabic']` in next/font/google | Architecture Patterns | If not available, would need to use local font file or different Arabic font |
| A3 | Railway single project provides private networking between Node.js, PostgreSQL, and Redis | Architecture Patterns | If private networking has issues, would need public URLs with added latency |

---

## Open Questions

1. **Next.js 14 vs. upgrading to Next.js 15**
   - What we know: PRD locks the stack to "Next.js 14 (App Router)". npm latest is 16.2.3.
   - What's unclear: Whether the agent should strictly honor the PRD's "14" spec or pragmatically start on 15 (stable, better React 19 support).
   - Recommendation: Honor the PRD — pin to Next.js 14. If any Phase 1 issue arises from v14 limitations, revisit with user.

2. **Monorepo tooling: npm workspaces vs. Turborepo**
   - What we know: npm workspaces are built-in; Turborepo adds caching and parallel task execution.
   - What's unclear: Whether CI speed matters at Phase 1 scale.
   - Recommendation: Use npm workspaces only for Phase 1. Avoid Turborepo complexity until CI times exceed 3 minutes.

3. **Prisma version choice**
   - What we know: Prisma 7 is latest but has major breaking changes. Prisma 6 is stable.
   - What's unclear: Whether Railway's official Prisma templates (which may push v7) will cause conflict.
   - Recommendation: Pin `prisma@^6` explicitly. Document in RESEARCH that v7 is available for Phase 2 upgrade.

---

## Environment Availability

> This phase creates the project from scratch — no existing tools are required except git and Node.js on the build machine. Railway and Vercel are cloud services, not local tools.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Both apps | Depends on dev machine | Needs 18.x+ | Install via nvm |
| npm | Package management | With Node.js | — | — |
| Railway account | Backend deployment | External service | — | No fallback — create account |
| Vercel account | Frontend deployment | External service | — | No fallback — create account |
| PostgreSQL (local dev) | Prisma migrations | [ASSUMED: not pre-installed] | — | Use Railway PostgreSQL via tunnel or Docker |
| Redis (local dev) | Redis client testing | [ASSUMED: not pre-installed] | — | Use Railway Redis or Docker |

**Missing dependencies with fallback:**
- Local PostgreSQL: Use `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16` for local dev, or point `DATABASE_URL` at Railway PostgreSQL directly.
- Local Redis: Use `docker run -p 6379:6379 redis:7` for local dev, or point `REDIS_URL` at Railway Redis directly.

---

## Validation Architecture

> `nyquist_validation` is enabled in config.json.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (backend unit tests) + Playwright (E2E smoke test) |
| Config file | `apps/server/vitest.config.ts` — Wave 0 task |
| Quick run command | `cd apps/server && npx vitest run` |
| Full suite command | `cd apps/server && npx vitest run && cd ../web && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Frontend returns HTTP 200 at deployed Vercel URL | smoke/e2e | `curl -f $NEXT_PUBLIC_APP_URL` | Wave 0 |
| INFRA-01 | Backend `/health` returns 200 with postgres+redis ok | smoke | `curl -f $BACKEND_URL/health` | Wave 0 |
| INFRA-04 | No hardcoded secrets in codebase | static scan | `grep -r "password\|secret\|key" apps/ --include="*.ts" -l` | manual |

### Sampling Rate

- **Per task commit:** `cd apps/server && npx vitest run` (backend unit, < 10s)
- **Per wave merge:** Full suite including curl health checks against staging
- **Phase gate:** Both health endpoints return 200; no secrets detected in grep scan

### Wave 0 Gaps

- [ ] `apps/server/vitest.config.ts` — Vitest configuration for backend
- [ ] `apps/server/src/routes/health.test.ts` — Health check unit tests (mock prisma + redis)
- [ ] Framework installs: `npm install -D vitest` in `apps/server/`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 1 skeleton — no auth yet) | NextAuth.js planned for Phase 2 |
| V3 Session Management | No | Deferred |
| V4 Access Control | No | Deferred |
| V5 Input Validation | Yes (health route, future API routes) | zod |
| V6 Cryptography | No | Deferred |
| V7 Error Handling | Yes | Never expose stack traces in production |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Secrets in source code | Information Disclosure | `.env` in `.gitignore`; Railway/Vercel env var panels |
| CORS wildcard in Socket.io | Elevation of Privilege | Set explicit `FRONTEND_URL` origin — never `*` |
| Stack traces in HTTP 500 | Information Disclosure | `NODE_ENV=production` check in error handler |

---

## Sources

### Primary (HIGH confidence)
- next-best-practices skill (font.md, file-conventions.md, directives.md) — Next.js 14 font and layout patterns
- nodejs-backend-patterns skill (SKILL.md) — Express setup, middleware, error handling
- [Socket.io official docs — use with Next.js](https://socket.io/how-to/use-with-nextjs) — confirmed separation of concerns
- [Socket.io CORS docs](https://socket.io/docs/v4/handling-cors/) — explicit origin requirement since v3
- [Tailwind RTL — Flowbite docs](https://flowbite.com/docs/customize/rtl/) — logical properties approach
- [Railway Variables docs](https://docs.railway.com/variables) — reference variable syntax `${{Service.VAR}}`

### Secondary (MEDIUM confidence)
- [Railway Help Station — ioredis connection issues](https://station.railway.com/questions/redis-connection-issue-on-railway-iored-3156557c) — `?family=0` parameter confirmed in multiple threads
- [Prisma deploy to Railway](https://www.prisma.io/docs/orm/prisma-client/deployment/traditional/deploy-to-railway) — `DATABASE_URL` setup pattern
- [Vercel community — Socket.io not supported](https://github.com/vercel/community/discussions/422) — confirmed WebSocket limitation
- WebSearch results confirming npm package versions (next 16.2.3, tailwind 4.2.2, express 5.2.1, socket.io 4.8.3, ioredis 5.10.1)

### Tertiary (LOW confidence)
- [Prisma 7 breaking changes](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) — reviewed but recommending Prisma 6 to avoid complexity
- Prisma version recommendation (Prisma 6 vs 7) — based on reading of changelog; marked [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH — package versions verified against npm registry; Next.js 14 pin is deliberate
- Architecture: HIGH — Socket.io/Vercel separation is documented fact; RTL pattern from official Tailwind docs
- Pitfalls: MEDIUM-HIGH — Railway ioredis `?family=0` is verified from community support threads; Prisma v7 breaking changes from official docs
- Deployment: MEDIUM — Railway multi-service pattern confirmed from official guides; specific Railway behavior (sticky sessions absent) confirmed

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (90 days — stable stack, but check Railway ioredis issue if deployment fails)
