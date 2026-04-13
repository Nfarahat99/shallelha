# Phase 8: Polish, Performance & Launch — Research

**Researched:** 2026-04-14
**Domain:** Production readiness — error handling, performance, security hardening, monitoring, deployment, E2E smoke testing
**Confidence:** HIGH (all findings verified against actual codebase)

---

## Summary

Phase 8 transforms a feature-complete application into a production-grade, publicly-launched platform. All seven core game features (room system, multiple choice, media guessing, free text, scoring, lifelines, admin) are implemented and deployed on Railway + Vercel. The gaps are entirely in production readiness: no loading skeletons, no Next.js error boundaries, no monitoring, no analytics provider, no rate limiting on Socket.io events or room creation, and server error messages exposed to clients are in English rather than Arabic.

The codebase is structurally sound. Security foundations are good: Helmet, CORS, Zod validation, Prisma ORM (SQL injection immunity), escapeHtml on free text, server-side answer deduplication, lifeline guards. The gaps are operational rather than architectural — this phase adds the shell that protects a working core.

**Primary recommendation:** Execute in 5 plan waves: (1) error boundaries + loading skeletons, (2) Socket.io rate limiting + input hardening, (3) monitoring + Vercel Analytics, (4) final Railway/Vercel production config + domain, (5) 8-player E2E smoke test + launch gate.

---

## Current State Analysis (per domain)

### Domain 1: Error Handling

**What exists:**
- Global Express error handler in `apps/server/src/index.ts` — suppresses stack traces in production, returns `{ error: 'Internal server error' }` [VERIFIED: codebase]
- Socket.io error events emitted on known failure paths: `room:error`, `game:error` with English messages [VERIFIED: codebase]
- Railway `restartPolicyType: ON_FAILURE` with `maxRetries: 3` [VERIFIED: railway.json]
- Health check at `/health` verifying Postgres + Redis + approvedQuestions count, returns 503 on failure [VERIFIED: codebase]

**What is missing:**
- No `process.on('uncaughtException')` or `process.on('unhandledRejection')` handlers [VERIFIED: grep — not present]
- No Next.js `error.tsx` boundary files anywhere in `apps/web/app/` [VERIFIED: glob — 0 results]
- No Next.js `not-found.tsx` for 404 pages
- Server error messages to clients are in English (`'Room is full'`, `'Room not found'`, `'Invalid answer index'`) — Arabic-first platform should display Arabic errors or the frontend must translate
- Disconnect cleanup: `apps/server/src/socket/index.ts` logs disconnect but does not clean up in-memory timer state (autoRevealTimers, votingTimers left in Maps after disconnect)

### Domain 2: Socket.io Performance

**What exists:**
- `transports: ['websocket']` forces WebSocket only — no polling fallback, no sticky-session requirement on Railway [VERIFIED: index.ts]
- `connectionStateRecovery` with 10s window [VERIFIED: index.ts]
- Redis WATCH/MULTI/EXEC atomic join in `room.service.ts` [VERIFIED: codebase]
- In-memory Maps: `questionCache`, `autoRevealTimers`, `votingTimers`, `freeTextLocks` — correct for single-process Railway but breaks on horizontal scale [VERIFIED: codebase]
- `question:progress` broadcast fires on every player answer (up to 8 broadcasts per question) [VERIFIED: game.ts]

**Performance concern identified:**
- `findRoomByHostId` in `room.service.ts` uses `redis.keys('room:*')` — O(n) scan across all rooms [VERIFIED: codebase]. At 100 concurrent rooms this adds latency on reconnect. Standard fix: maintain a reverse index `hostroom:{userId}` → roomCode in Redis.
- `adminLimiter` in `admin.ts` uses express-rate-limit's default in-memory store — not Redis-backed [VERIFIED: codebase]. Does not persist across process restarts and doesn't work correctly with multiple instances.

### Domain 3: Rate Limiting

**What exists:**
- `express-rate-limit` v8.3.2 installed [VERIFIED: package.json]
- `adminLimiter`: 30 req/min applied to `GET /admin/analytics` only [VERIFIED: admin.ts]
- No rate limiting on HTTP `/health` or any Socket.io events [VERIFIED: grep]

**What is missing:**
- Room creation (`room:create`) has no rate limit — a single socket client can spam room creation
- Player join (`room:join`) has no rate limit — brute-force room code guessing is possible (4-char = ~1.7M combinations, feasible without limits)
- Socket.io event-level throttling: Socket.io 4.x does not have built-in per-event rate limiting; must be implemented manually per-event or via middleware

### Domain 4: Input Sanitization

**What exists:**
- Zod v4 validation on Socket.io payloads in game.ts and room.ts [VERIFIED: codebase]
- `name` max 15 chars enforced server-side in `room:join` [VERIFIED: room.ts]
- `escapeHtml` applied to free-text answers before broadcast [VERIFIED: game.ts]
- `answerIndex` range-checked (0–3) [VERIFIED: game.ts]
- Prisma ORM eliminates SQL injection throughout [VERIFIED: codebase]

**What is missing:**
- Room code input on join page has only client-side validation (no server-side format check: 4 uppercase alphanumeric) — malformed codes proceed to socket join and get English errors
- Player name not validated for Arabic/unicode safety beyond length — emoji sequences could exceed display width
- `socket.handshake.auth.userId` is trusted without verification — any client can claim any userId for host reconnect

### Domain 5: Loading States & Skeletons

**What exists:**
- Spinner: `animate-spin rounded-full` in `PlayerJoin.tsx` when `phase='playing'` but no question yet loaded [VERIFIED: codebase]
- Standard Tailwind CSS installed with animate utilities [VERIFIED: web/package.json]
- `motion` (Framer Motion v12) installed for animations [VERIFIED: web/package.json]

**What is missing:**
- Zero `loading.tsx` files anywhere in `apps/web/app/` [VERIFIED: glob — 0 results]
- No skeleton screens for: join page, host lobby, question display, leaderboard
- No error boundaries (`error.tsx`) for route-level error recovery
- Connection state: `PlayerJoin.tsx` does not show a reconnecting indicator during the 10s recovery window

### Domain 6: Production Deployment

**What exists:**
- `railway.json`: DOCKERFILE builder, healthcheck on `/health` with 30s timeout, ON_FAILURE restart [VERIFIED: railway.json]
- `vercel.json`: correct buildCommand and outputDirectory for monorepo [VERIFIED: vercel.json]
- Cairo font with arabic+latin subsets, preloaded via `next/font/google` [VERIFIED: layout.tsx]
- `lang="ar" dir="rtl"` on `<html>` element [VERIFIED: layout.tsx]
- IPv6 fix for Railway Redis (`?family=0` appended to REDIS_URL) [VERIFIED: redis/client.ts]
- Docker image for server: Dockerfile exists, compiled seed.js committed [VERIFIED: git log]

**What is missing:**
- Custom domain not confirmed set up (out of scope for code changes but a launch gate)
- No `robots.txt` or `sitemap.xml` for SEO (minor — game platform, not content site)
- Next.js `next.config.js` remotePatterns for Cloudinary already set (Phase 5 confirmed)
- No `NEXT_PUBLIC_` environment variable audit documented

### Domain 7: Monitoring & Analytics

**What exists:**
- `console.log`/`console.error` throughout server code — Railway captures these in its log drain [VERIFIED: codebase]
- `/health` endpoint for Railway uptime monitoring [VERIFIED: health.ts]
- Railway provides basic metrics (CPU, memory, network) in dashboard [ASSUMED — Railway standard offering]

**What is missing:**
- `@vercel/analytics` not installed or imported anywhere [VERIFIED: grep — 0 results]
- No error reporting service (Sentry, etc.) — unhandled exceptions are lost after Railway log rotation
- No structured logging (Winston, Pino) — plain console output with no log levels, no JSON format for log aggregation
- `process.on('uncaughtException')` / `process.on('unhandledRejection')` not registered — silent crashes possible

### Domain 8: E2E Smoke Testing

**What exists:**
- `e2e-test.mjs`: Playwright Chromium headless, targets production URLs directly [VERIFIED: codebase]
  - Health check, page loads, RTL dir attribute, Cairo font check, WebSocket connect, room:create auth guard
- `e2e-phase5.mjs`: adds approvedQuestions >= 40 check, freetext handlers, Cloudinary image, mobile viewport [VERIFIED: codebase]
- Pass/fail/warn pattern with colored output [VERIFIED: codebase]

**What is missing:**
- No full 8-player game simulation test (joining, answering, lifelines, scoring, podium)
- No multi-viewport test (iOS Safari 375px, Android 390px, Desktop 1920px simultaneously)
- Current tests connect one socket at a time — no concurrent room stress test in E2E
- No test for: full-room rejection (9th player), reconnect within 10s, Arabic error message display
- `e2e-phase5.mjs` checks approvedQuestions >= 40 — Phase 7 seeded 200+ so this passes, but Phase 8 E2E should raise threshold to >= 200

---

## Gap Analysis

| Gap | Severity | Effort |
|-----|----------|--------|
| No Next.js `error.tsx` boundary files | HIGH | Low |
| No `loading.tsx` files | HIGH | Low |
| No `@vercel/analytics` | HIGH | Low |
| No `process.on('uncaughtException'/'unhandledRejection')` | HIGH | Low |
| No rate limiting on room:create / room:join socket events | HIGH | Medium |
| Disconnect cleanup for in-memory timer Maps | MEDIUM | Low |
| `findRoomByHostId` O(n) Redis scan | MEDIUM | Medium |
| Server error messages in English | MEDIUM | Medium |
| No reconnecting indicator in PlayerJoin | MEDIUM | Low |
| adminLimiter not Redis-backed | LOW | Medium |
| Full 8-player E2E smoke test | HIGH (launch gate) | High |

---

## Standard Stack

### Core (already installed — versions verified)
| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| socket.io | ^4.8.3 | Real-time game events | [VERIFIED: package.json] |
| express-rate-limit | ^8.3.2 | HTTP + socket rate limiting | [VERIFIED: package.json] |
| @vercel/analytics | ^1.x | Vercel web analytics | [ASSUMED — standard Vercel] |
| zod | ^4.3.6 | Input validation | [VERIFIED: package.json] |
| motion (Framer Motion) | ^12.38.0 | Skeleton animations | [VERIFIED: web/package.json] |

### To Install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @vercel/analytics | ^1 | Page view + Web Vitals tracking | Official Vercel integration, zero config |
| @sentry/nextjs | ^8 | Frontend error reporting | Industry standard, Next.js SDK | [ASSUMED]
| @sentry/node | ^8 | Backend error reporting | Pairs with @sentry/nextjs | [ASSUMED]

**Note:** Sentry is an assumption — the project may prefer a lighter alternative (e.g., Axiom, Logtail, or Railway log drain only). The planner should verify user preference before adding Sentry. If user prefers no external error service, structured `console.error` with Railway drain is a viable MVP approach.

**Installation (minimal viable):**
```bash
# Frontend only (zero-config analytics)
cd apps/web && npm install @vercel/analytics

# Optional error reporting (Sentry)
cd apps/web && npm install @sentry/nextjs
cd apps/server && npm install @sentry/node
```

**Version verification:**
```bash
npm view @vercel/analytics version   # Verify before writing plan
npm view @sentry/nextjs version      # Verify before writing plan
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 8 additions)

```
apps/web/app/
├── error.tsx              # Root error boundary (catches unhandled throws)
├── not-found.tsx          # 404 page in Arabic
├── join/
│   ├── loading.tsx        # Skeleton for join page RSC data
│   └── [roomCode]/
│       └── loading.tsx    # Skeleton while PlayerJoin hydrates
├── host/
│   ├── loading.tsx        # Skeleton for host lobby
│   └── [roomCode]/
│       └── loading.tsx    # Skeleton while HostDashboard hydrates
└── layout.tsx             # Add <Analytics /> from @vercel/analytics here

apps/server/src/
├── socket/
│   ├── middleware/
│   │   └── rateLimiter.ts  # Socket.io event rate limiting
│   └── index.ts            # Add uncaughtException handlers
└── routes/
    └── admin.ts            # Upgrade adminLimiter to Redis store
```

### Pattern 1: Next.js Error Boundary (App Router)

**What:** `error.tsx` files receive the thrown error and a `reset` function
**When to use:** All route segments that could throw (data fetching, socket failures)

```typescript
// Source: Next.js App Router docs — nextjs.org/docs/app/api-reference/file-conventions/error
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" dir="rtl">
      <p className="text-xl font-bold text-red-600">حدث خطأ</p>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded">
        حاول مجددا
      </button>
    </div>
  )
}
```

### Pattern 2: Next.js Loading Skeleton (App Router)

**What:** `loading.tsx` renders immediately during RSC data fetching; replaces spinner anti-pattern
**When to use:** Every route segment where data is fetched server-side

```typescript
// Source: Next.js App Router docs — nextjs.org/docs/app/api-reference/file-conventions/loading
export default function Loading() {
  return (
    <div className="animate-pulse" dir="rtl">
      <div className="h-12 bg-gray-200 rounded mb-4" />
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
```

### Pattern 3: Vercel Analytics Integration

**What:** Add `<Analytics />` to root layout — zero configuration required
**When to use:** Root `layout.tsx`

```typescript
// Source: vercel.com/docs/analytics/package — @vercel/analytics
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Pattern 4: Socket.io Event Rate Limiting

**What:** Per-socket, per-event call tracking using an in-process Map
**When to use:** `room:create` and `room:join` events (public, unauthenticated entry points)

```typescript
// Source: Socket.io docs + express-rate-limit patterns — adapted for Socket.io
const socketEventCounts = new Map<string, Map<string, { count: number; resetAt: number }>>()

function rateLimitSocket(
  socket: Socket,
  event: string,
  maxCalls: number,
  windowMs: number
): boolean {
  const now = Date.now()
  if (!socketEventCounts.has(socket.id)) {
    socketEventCounts.set(socket.id, new Map())
  }
  const events = socketEventCounts.get(socket.id)!
  const entry = events.get(event)
  if (!entry || now > entry.resetAt) {
    events.set(event, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }
  if (entry.count >= maxCalls) return false // blocked
  entry.count++
  return true // allowed
}

// Usage in room handler:
socket.on('room:create', async (data) => {
  if (!rateLimitSocket(socket, 'room:create', 5, 60_000)) {
    socket.emit('room:error', 'Too many room creation requests')
    return
  }
  // ... existing handler
})

// Cleanup on disconnect:
socket.on('disconnect', () => {
  socketEventCounts.delete(socket.id)
})
```

### Pattern 5: Unhandled Rejection Handlers

**What:** Catch process-level errors before Railway logs them as silent crashes
**When to use:** Server entry point (`index.ts`)

```typescript
// Source: Node.js docs — nodejs.org/api/process.html#event-uncaughtexception
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err)
  process.exit(1) // Railway ON_FAILURE will restart
})

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason)
  // Do NOT exit — log and continue unless it's truly fatal
})
```

### Pattern 6: Redis Reverse Index for Host Room Lookup

**What:** Replace O(n) `redis.keys('room:*')` scan with a direct O(1) lookup
**When to use:** `room.service.ts` — `findRoomByHostId`

```typescript
// Source: Redis best practices — redis.io/docs/manual/keyspace-notifications/
// On room create: set the reverse index
await redis.set(`hostroom:${hostId}`, roomCode, 'EX', ROOM_TTL)

// On room delete/expire: delete the reverse index
await redis.del(`hostroom:${hostId}`)

// findRoomByHostId becomes:
async function findRoomByHostId(hostId: string): Promise<Room | null> {
  const roomCode = await redis.get(`hostroom:${hostId}`)
  if (!roomCode) return null
  const data = await redis.get(`room:${roomCode}`)
  return data ? JSON.parse(data) : null
}
```

### Anti-Patterns to Avoid

- **`redis.keys('room:*')` in production:** Blocks Redis while scanning. Use reverse index instead.
- **In-memory rate limit store with multiple instances:** Express-rate-limit default store is per-process. On Railway with two instances, limits are not shared. Use `rate-limit-redis` if scaling horizontally. For single-instance Railway, in-memory is fine for MVP.
- **Error boundaries without `'use client'` directive:** `error.tsx` in Next.js App Router MUST be a Client Component — it uses React hooks internally.
- **Exposing error `digest` in production:** Next.js generates a `digest` for server errors. Safe to display. Do NOT expose `error.stack` in client-facing messages.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web analytics | Custom tracking pixel | `@vercel/analytics` | Automatic Web Vitals, zero config, Vercel integrated |
| Loading UI | Spinner-only approach | Next.js `loading.tsx` | Built into App Router, parallel with Suspense, better UX |
| Error recovery UI | Try/catch in every component | Next.js `error.tsx` | Automatic boundary, reset function, nested scope |
| Socket event throttling | setTimeout-based debounce | Explicit counter per socket per event | Debounce doesn't count — it delays. Counter enforces max. |

**Key insight:** All missing pieces in Phase 8 have official Next.js or Vercel solutions that are 3–10 lines to add. The temptation to build custom solutions is high because the gap seems small — resist it.

---

## Common Pitfalls

### Pitfall 1: `error.tsx` Missing `'use client'`
**What goes wrong:** Build error or silent failure — error boundary silently ignored
**Why it happens:** `error.tsx` uses `reset` callback which requires client context
**How to avoid:** Always add `'use client'` as first line of every `error.tsx`
**Warning signs:** No error caught on production throw; page hangs instead of showing error UI

### Pitfall 2: Vercel Analytics Not Firing in Development
**What goes wrong:** `<Analytics />` renders but sends no events in `localhost`
**Why it happens:** Analytics script only activates on Vercel-hosted domains
**How to avoid:** Test with `vercel dev` or check Vercel dashboard after deploying to preview
**Warning signs:** No events in Vercel Analytics dashboard after deploy

### Pitfall 3: Rate Limiting `room:join` Blocks Legitimate Reconnects
**What goes wrong:** Player reconnects 5 times during 10s recovery window; rate limiter blocks them
**Why it happens:** Socket.io connection recovery triggers new socket ID, new socket = new counter
**How to avoid:** Rate limit by `socket.handshake.address` (IP) not `socket.id`; or use a longer window (5 joins per 10s per IP)
**Warning signs:** Players randomly ejected during reconnect phase

### Pitfall 4: `loading.tsx` Renders for Client Components
**What goes wrong:** `loading.tsx` only activates for Server Components doing async data fetching
**Why it happens:** Client components like `PlayerJoin.tsx` don't go through RSC data fetching — `loading.tsx` never fires
**How to avoid:** Add Suspense boundaries inside Client Components for client-side loading states; `loading.tsx` covers the initial server render, not client-side state
**Warning signs:** `loading.tsx` exists but skeleton never appears

### Pitfall 5: Disconnect Cleanup Memory Leak
**What goes wrong:** `autoRevealTimers` and `votingTimers` Maps grow without bound as games are played
**Why it happens:** Timers are created in `game.ts` but `disconnect` event in `socket/index.ts` only logs — no cleanup
**How to avoid:** On `disconnect`, check if the disconnecting socket is a host; if so, clear their room's timers. Wrap with try/catch to avoid cascade.
**Warning signs:** Node.js memory climbing over 24-hour Railway deployment period

### Pitfall 6: E2E Test Targeting Stale Production URL
**What goes wrong:** E2E test passes against old production but fails for real users after domain change
**Why it happens:** Both `e2e-test.mjs` and `e2e-phase5.mjs` hardcode `shallelha.vercel.app`
**How to avoid:** Accept `BASE_URL` and `BACKEND_URL` as environment variables in E2E script; hardcoded values become defaults
**Warning signs:** CI green but users report failures

---

## Runtime State Inventory

Phase 8 is not a rename/refactor phase — this section is not applicable.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server build + tests | Expected on Railway | Dockerfile-managed | — |
| Playwright | E2E smoke test | To be verified | Run `npx playwright --version` | Use existing e2e-test.mjs structure |
| Railway CLI | Deployment verification | Optional | — | Use Railway dashboard |
| Vercel CLI | Preview deploy + env check | Optional | — | Use Vercel dashboard |

**Note:** Phase 8 E2E tests target production URLs (shallelha.vercel.app) — no local service dependencies required for test execution. Playwright must be installed wherever the Phase 8 smoke test is run.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^1.6.0 (server unit tests) + Playwright (E2E) |
| Config file | `apps/server/vitest.config.ts` (or package.json scripts) |
| Quick run command | `cd apps/server && npm run test` |
| Full suite command | `cd apps/server && npm run test && node e2e-test.mjs && node e2e-phase5.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Public URL responds 200 | smoke | `node e2e-test.mjs` | ✅ |
| INFRA-02 | 100 simultaneous rooms | load | `cd apps/server && npm run test:load` | ✅ (Artillery) |
| INFRA-03 | iOS Safari / Android Chrome / Desktop | smoke | Manual + `node e2e-phase5.mjs` (mobile viewport) | ✅ (partial) |
| SYNC-01 | Answer on host screen < 200ms | perf | Manual latency check + Socket.io timing | ❌ Wave 0 |
| ROOM-04 | Max 8 players enforced | unit | Server unit test for room capacity | ❌ Wave 0 |
| ROOM-05 | Rejoin within 10s | smoke | Playwright disconnect-reconnect test | ❌ Wave 0 |
| GAME-01–05 | Full game loop | smoke | 8-player Playwright E2E script | ❌ Wave 0 |
| ADMIN-05 | 200+ approved questions | smoke | `/health` endpoint `approvedQuestions >= 200` | ❌ Wave 0 (threshold) |

### Sampling Rate
- **Per task commit:** `cd apps/server && npm run test`
- **Per wave merge:** `cd apps/server && npm run test && node e2e-test.mjs`
- **Phase gate:** Full suite + `node e2e-phase8.mjs` (new smoke test) green before phase complete

### Wave 0 Gaps
- [ ] `e2e-phase8.mjs` — full 8-player game simulation (ROOM-04, ROOM-05, GAME-01–05, LIFE-01–04, SCORE-01–04)
- [ ] `e2e-phase8.mjs` — raise approvedQuestions check threshold to >= 200 (ADMIN-05)
- [ ] `e2e-phase8.mjs` — reconnect scenario test (ROOM-05)
- [ ] `apps/server/src/socket/room.test.ts` — unit test for 9th player rejection (ROOM-04)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (host auth) | `socket.handshake.auth.userId` — weak; trust but log anomalies |
| V3 Session Management | Yes | sessionStorage reconnectToken (UUID) — adequate for game sessions |
| V4 Access Control | Yes | Server-side: host-only controls, lifeline guards, answer dedup |
| V5 Input Validation | Yes | Zod on all socket payloads + escapeHtml on free text |
| V6 Cryptography | No | No sensitive data at rest requiring encryption in this phase |
| V7 Error Handling | Yes | Stack traces suppressed in production; `error.tsx` boundaries |
| V8 Data Protection | Partial | Room data in Redis expires in 24h; no PII stored beyond player name |
| V11 Business Logic | Yes | Rate limiting on room creation/joining to prevent abuse |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Room code brute force (4-char = 1.7M combos) | Tampering | Rate limit `room:join` to 10 attempts/min per IP |
| Socket event flooding (room:create spam) | DoS | Rate limit `room:create` to 5/min per socket |
| Free text XSS injection | Tampering | `escapeHtml` already applied — verify it covers all broadcast paths |
| Host impersonation (userId claim) | Spoofing | Log mismatches; upgrade to signed token in v2 |
| Memory exhaustion via timer leaks | DoS | Cleanup on disconnect + max game duration enforcement |
| Admin endpoint abuse | DoS | Current `adminLimiter` 30 req/min is adequate for single admin |

### Security Gap: `userId` Trust Without Verification

`getAuthUserId` in `auth.ts` reads `socket.handshake.auth.userId` without cryptographic verification [VERIFIED: codebase]. Any client can claim any `userId` to hijack a host's room. For Phase 8 MVP:
- **Mitigate:** Cross-reference the claimed `userId` against a server-side session store or the active room's `hostId` before allowing host-level actions
- **Full fix:** JWT-signed session tokens (deferred to v2 per requirements)
- **Phase 8 action:** At minimum, add server-side validation that the claimed `userId` matches the room's stored `hostId` before executing `game:start`, `question:next`, `game:end`

---

## Task Breakdown Hints (5 Plans)

### Plan 08-01: Error Boundaries, Loading States & Process Resilience
**Scope:** Frontend + Backend
- Add `apps/web/app/error.tsx` (root) and `not-found.tsx`
- Add `loading.tsx` to: `/join`, `/join/[roomCode]`, `/host`, `/host/[roomCode]`
- Add Tailwind skeleton CSS to all loading files (animate-pulse, gray bars)
- Add reconnecting indicator to `PlayerJoin.tsx` during Socket.io recovery
- Add `process.on('uncaughtException')` and `process.on('unhandledRejection')` to server `index.ts`
- Add disconnect cleanup for `autoRevealTimers`, `votingTimers` in `socket/index.ts`

### Plan 08-02: Rate Limiting & Input Hardening
**Scope:** Backend (Socket.io + HTTP)
- Add per-socket event rate limiter for `room:create` (5/min) and `room:join` (10/min per IP)
- Add server-side room code format validation (4 uppercase alphanumeric regex check before Redis lookup)
- Add `hostId` cross-verification before host-privileged Socket.io events (`game:start`, `question:next`, `game:end`)
- Fix `findRoomByHostId` O(n) scan: add Redis reverse index `hostroom:{userId}` on room create/delete
- Cleanup `socketEventCounts` Map on `disconnect`

### Plan 08-03: Monitoring, Analytics & Observability
**Scope:** Frontend + Backend
- Install `@vercel/analytics` and add `<Analytics />` to `apps/web/app/layout.tsx`
- Add structured logging pattern to server (log level prefix: `[INFO]`, `[WARN]`, `[ERROR]`, `[FATAL]`)
- Add game lifecycle logging: room created/deleted, game started/ended, player count
- Verify Railway health check dashboard is active and alerting
- Document Railway log drain usage (no additional install required)
- Optional: add `@sentry/node` and `@sentry/nextjs` if error reporting service is desired (planner should confirm with user first)

### Plan 08-04: Production Deployment & Configuration Audit
**Scope:** DevOps (Vercel + Railway)
- Audit all `NEXT_PUBLIC_` env vars — document required set for production
- Verify Cloudinary `remotePatterns` in `next.config.js` covers all media URLs
- Verify `ADMIN_PASSWORD` env var is set in Railway production
- Verify `FRONTEND_URL` env var is set in Railway production (currently warns if missing)
- Verify `REDIS_URL` and `DATABASE_URL` are Railway-provisioned (not hardcoded)
- Confirm domain configured on Vercel and DNS propagated
- Run `next build` locally against production env vars to catch any missing vars
- Update `e2e-test.mjs` and `e2e-phase5.mjs` to read URLs from env vars (not hardcoded)

### Plan 08-05: Phase 8 E2E Smoke Test & Launch Gate
**Scope:** E2E Testing
- Write `e2e-phase8.mjs`: full 8-player game simulation using Playwright
  - 8 browsers join one room
  - Host starts game
  - All question types served: multiple choice, media guessing, free text
  - One player activates each lifeline (double points, remove two, freeze opponent)
  - Leaderboard updates after each question
  - Final podium displays top 3
  - All answers arrive at host in < 200ms (add timing assertions)
- Add smoke test: 9th player is rejected (full room)
- Add smoke test: player disconnects and reconnects within 10s (ROOM-05)
- Add threshold check: `approvedQuestions >= 200` in health response
- Run complete test suite; confirm all pass
- Document manual cross-browser checklist: iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Firefox
- Phase launch gate: all automated + manual tests pass before marking phase complete

---

## Open Questions

1. **Error reporting service (Sentry vs. none)**
   - What we know: No external error service is installed. Railway logs exist.
   - What's unclear: Does the user want Sentry (adds complexity, costs money after free tier) or is Railway log drain sufficient for MVP?
   - Recommendation: Ask during planning. Default to structured console.error + Railway drain for MVP if no preference.

2. **Arabic error messages in Socket.io responses**
   - What we know: Server emits English strings like `'Room is full'`. Arabic-first platform.
   - What's unclear: Should server send Arabic strings (couples backend to Arabic), or should frontend translate error codes to Arabic?
   - Recommendation: Frontend translation map keyed by error code is cleaner (server stays language-agnostic). This is a Medium effort item. Mark as discretionary for Phase 8 planner.

3. **Custom domain DNS status**
   - What we know: `railway.json` and `vercel.json` exist; domain not confirmed in code
   - What's unclear: Has the custom domain been purchased and configured?
   - Recommendation: Planner should include a plan task for domain verification; if domain not yet configured, this is a launch blocker.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Railway provides basic metrics (CPU, memory) in dashboard | Domain 7: Monitoring | Minimal — Railway does provide this on all tiers |
| A2 | `@sentry/nextjs` v8 is the current stable version | Standard Stack (To Install) | Low — planner should run `npm view @sentry/nextjs version` before including |
| A3 | Single-process Railway deployment (no horizontal scaling) | Domain 2: Socket.io Performance | Medium — if Railway scales to 2+ instances, in-memory Maps break. Verify Railway plan. |

---

## Sources

### Primary (HIGH confidence — codebase verified)
- `apps/server/src/index.ts` — transport config, error handler, CORS
- `apps/server/src/socket/game.ts` — full game loop, rate concerns, sanitization
- `apps/server/src/socket/room.ts` — join/create/reconnect handlers
- `apps/server/src/room/room.service.ts` — Redis patterns, O(n) scan identified
- `apps/server/src/routes/admin.ts` — rate limit scope
- `apps/server/src/redis/client.ts` — Railway IPv6 fix
- `apps/web/app/layout.tsx` — Analytics gap, RTL confirmed
- `apps/web/app/join/[roomCode]/PlayerJoin.tsx` — loading state gaps
- `railway.json`, `vercel.json` — deployment config
- `e2e-test.mjs`, `e2e-phase5.mjs` — existing test coverage
- Glob for `loading.tsx`: 0 results [VERIFIED]
- Glob for `error.tsx`: 0 results [VERIFIED]
- Grep for `@vercel/analytics`: 0 results [VERIFIED]
- Grep for `rateLimit`: only `admin.ts` [VERIFIED]

### Secondary (MEDIUM confidence — official docs)
- Next.js App Router `error.tsx` — nextjs.org/docs/app/api-reference/file-conventions/error
- Next.js App Router `loading.tsx` — nextjs.org/docs/app/api-reference/file-conventions/loading
- @vercel/analytics — vercel.com/docs/analytics/package

### Tertiary (LOW / ASSUMED)
- Railway dashboard metrics availability [ASSUMED — standard offering]
- Sentry v8 version [ASSUMED — planner should verify]

---

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH — all verified against actual codebase files
- Gap analysis: HIGH — gaps confirmed by grep/glob with 0 results
- Standard Stack: MEDIUM — installed packages verified; to-install versions assumed
- Architecture patterns: HIGH — official Next.js patterns, well-documented
- Pitfalls: HIGH — derived from observed codebase patterns
- Security: HIGH — verified against actual code, ASVS mapping is standard

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable stack — Next.js 14, Socket.io 4.x, Express 5)
