# Phase 2: Room System & Real-Time Core — Research

**Researched:** 2026-04-10
**Domain:** NextAuth.js v5, Socket.io room management, Redis ephemeral state, session reconnect, App Router route protection
**Confidence:** HIGH (core stack verified via npm registry, official docs, and authjs.dev)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Host Authentication:** Account required via NextAuth.js (Google OAuth + email magic link). Host-only auth — players join anonymously.

**Player Display Identity:** Players pick their display name (Arabic, max ~15 chars) + choose an emoji avatar from a curated grid (12–20 options, no faces, min 44px touch targets). Name + emoji stored in Redis, not PostgreSQL.

**Room URL & Navigation Structure:**
```
/               → Landing page (Create Room button + Join Room button)
/host           → Protected route — requires host auth — shows "Create Room" CTA
/host/[roomCode] → Protected route — host dashboard for active room (lobby + controls)
/join           → Public route — player enters 4-char code
/join/[roomCode] → Public route — player enters name + picks avatar
```

**Reconnect Token Strategy:** Server assigns a UUID `reconnectToken` on player join → stored in `sessionStorage` under key `shllahaReconnectToken_{roomCode}` → 10-second server-side grace window → after 10s player must re-join from scratch.

**Redis Room State Schema:**
```
room:{roomCode}  →  hash with fields:
  hostId         → NextAuth session user ID
  status         → waiting | playing | ended
  createdAt      → ISO timestamp
  players        → JSON array of { socketId, reconnectToken, name, emoji, connectedAt }
```
Key TTL: 24 hours.

### Claude's Discretion

- Socket.io event naming conventions (`room:join`, `room:leave`, etc.)
- Redis key structure beyond what's specified above
- Error handling UI (specific error messages, toast vs inline)
- Lobby UI component structure (planner decides — Phase 3 will RTL-polish it)
- Loading/skeleton states while room is being created
- Host session persistence strategy (JWT vs database session — NextAuth default is fine)
- Specific NextAuth.js version and adapter (researcher to confirm App Router compatibility)
- How "100 simultaneous rooms" load target is tested (researcher to propose approach)

### Deferred Ideas (OUT OF SCOPE)

- Player accounts for persistent stats — v2 requirement (AUTH-01 through AUTH-03)
- QR code scanning to join — noted as an option, deferred (not in Phase 2 scope)
- Arabic auto-assigned nicknames — considered but rejected
- URL-embedded player token for reconnect — considered but rejected (URL sharing could hijack a player slot)
- Chat in lobby while waiting — not in Phase 2 scope
- Full Arabic RTL UI polish — Phase 3
- Question serving and scoring — Phase 4

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-01 | Host can create a game room and receive a unique 4-character alphanumeric code | Redis SETNX-based collision-safe code generation; `room:{code}` hash with 24h TTL |
| ROOM-02 | Player can join a room by entering the code on any mobile browser (no account required) | Public `/join` and `/join/[roomCode]` routes; player state ephemeral in Redis only |
| ROOM-03 | Host sees a live lobby listing all connected players before the game starts | Socket.io `io.to(roomCode).emit('lobby:update', players)` broadcast on every join/leave |
| ROOM-04 | Room supports 2 to 8 players simultaneously | Server-side guard: parse players array from Redis, reject if length >= 8 before inserting |
| ROOM-05 | Player who disconnects can rejoin within 10 seconds without losing game state | sessionStorage token + server `disconnecting` handler + 10s `setTimeout` pattern (see Architecture) |
| ROOM-06 | Host can start, pause (between questions), and end the game | `game:start`, `game:pause`, `game:end` events emitted by host socket; server validates hostId matches |
| SYNC-01 | Player answers appear on host screen within 200ms of submission | Socket.io WebSocket-only; single Railway instance means no adapter needed for single-replica. Redis state read on each event |
| SYNC-02 | All players see the same question state simultaneously (no race conditions) | Redis transactions (MULTI/EXEC) for player join/leave mutations; broadcast happens after Redis write confirms |
| SYNC-03 | WebSocket connections recover automatically on brief network drops | Socket.io built-in reconnect + 10s server-side grace window using sessionStorage token |
| INFRA-02 | Supports 100 simultaneous game rooms at launch | Single Railway instance sufficient; verified via Artillery load test script |
| INFRA-03 | Works on iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Firefox | WebSocket transport confirmed supported; `socket.handshake.auth` used (not extraHeaders, which browsers block) |

</phase_requirements>

---

## Summary

Phase 2 introduces three interlocked systems: host authentication via NextAuth.js v5, ephemeral room state in Redis, and real-time synchronization via Socket.io. These systems must be wired together carefully because they live in separate services (Next.js on Vercel, Node.js on Railway) that cannot share session cookies directly.

The biggest architectural decision is NextAuth.js version: v5 (`next-auth@beta`, currently `5.0.0-beta.30`) is the correct choice for Next.js 14 App Router. It provides a single `auth()` function that works consistently across Server Components, Route Handlers, and middleware — eliminating the v4 pattern of juggling `getServerSession`, `getToken`, and `withAuth` in different contexts. The beta label is misleading; the APIs are stable and widely deployed in production.

The second architectural decision is how the host's identity reaches the Socket.io server. Since the backend is a separate Express server, it cannot read Next.js session cookies. The correct approach is to pass the NextAuth session user ID in the Socket.io `auth` object during connection (`socket.handshake.auth.userId`). The backend validates this by having the frontend pass the NextAuth user ID (from `session.user.id`) obtained via a server action or API route before connecting the socket.

The third decision is Redis atomicity for player join. Because multiple players can join simultaneously, the read-modify-write on the `players` JSON array must be wrapped in a Redis MULTI/EXEC transaction (or a Lua script) to prevent two concurrent joins from clobbering each other's writes.

**Primary recommendation:** Use NextAuth.js v5 beta (`npm install next-auth@beta`), `@auth/prisma-adapter` for the database adapter, and Resend for magic link email. Use `socket.handshake.auth` (not `extraHeaders`) for host identity — this works with WebSocket-only transport. Use Redis MULTI/EXEC for atomic player list mutations.

---

## Standard Stack

### Core — Phase 2 Additions

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | `5.0.0-beta.30` | Host authentication (App Router) | v5 is the only version with first-class App Router `auth()` support; v4 requires `getServerSession` workarounds |
| @auth/prisma-adapter | `2.11.1` | NextAuth database adapter for Prisma | Official Auth.js adapter in the `@auth/` scope (v4 used `@next-auth/prisma-adapter`) |
| resend | `6.10.0` | Magic link email delivery | Official Auth.js Resend provider; single env var `AUTH_RESEND_KEY`; no SMTP config needed |
| uuid | `13.0.0` | Generate `reconnectToken` per player | Cryptographically random, collision-resistant, Node.js built-in alternative exists (`crypto.randomUUID()`) |
| zod | `4.3.6` | Input validation for room code, player name | Already in project standards |

[VERIFIED: npm registry — all versions checked 2026-04-10]

### Existing (Already Installed — No Changes)

| Library | Version | Role in Phase 2 |
|---------|---------|-----------------|
| socket.io | 4.8.3 | Room events — expand socket/index.ts from stub to full handler |
| socket.io-client | 4.8.3 | Frontend socket connection — add `auth: { userId }` to connect options |
| ioredis | 5.4.1 | All Redis room state operations |
| prisma / @prisma/client | ^6 | Add NextAuth schema tables; run `prisma migrate dev` |
| express | 5.2.1 | No changes |

### Supporting — Load Testing Only (devDependency)

| Library | Version | Purpose |
|---------|---------|---------|
| artillery | `2.0.30` | Load test: simulate 100 concurrent rooms |
| artillery-engine-socketio-v3 | `1.2.0` | Socket.io protocol support for Artillery (default engine uses v2 client) |

[VERIFIED: npm registry 2026-04-10]

**Installation — frontend (apps/web):**
```bash
npm install next-auth@beta @auth/prisma-adapter resend --workspace=apps/web
```

**Installation — backend (apps/server):**
```bash
npm install uuid --workspace=apps/server
npm install -D artillery artillery-engine-socketio-v3 --workspace=apps/server
```

**Version note:** `next-auth@beta` resolves to `5.0.0-beta.30`. The `latest` tag (4.24.13) is NextAuth v4 — do not use. Always install with the `@beta` tag.

---

## Architecture Patterns

### Recommended Project Structure Additions

```
apps/web/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          ← NextAuth v5 catch-all API handler
│   ├── host/
│   │   ├── page.tsx                  ← Protected: Create Room CTA (server component)
│   │   └── [roomCode]/
│   │       └── page.tsx              ← Protected: Host lobby dashboard
│   └── join/
│       ├── page.tsx                  ← Public: Enter room code
│       └── [roomCode]/
│           └── page.tsx              ← Public: Enter name + pick emoji
├── auth.ts                           ← NextAuth v5 config (root level, not in app/)
├── middleware.ts                     ← Route protection for /host routes
└── lib/
    └── socket.ts                     ← Existing — add userId to auth object

apps/server/src/
├── socket/
│   ├── index.ts                      ← Expand stub: add room handlers
│   ├── handlers/
│   │   ├── room.ts                   ← room:create, room:join, room:leave
│   │   └── game.ts                   ← game:start, game:pause, game:end
│   └── middleware/
│       └── auth.ts                   ← Socket.io middleware: verify hostId handshake
├── services/
│   └── room.service.ts               ← Redis room CRUD, atomic operations
└── routes/
    └── room.ts                       ← REST: POST /room (create), GET /room/:code (validate)
```

---

### Pattern 1: NextAuth.js v5 Setup (auth.ts)

**What:** Single configuration file at `apps/web/auth.ts` — exports `auth`, `handlers`, `signIn`, `signOut`.
**When to use:** Always — this is the single source of truth for all auth operations.

```typescript
// apps/web/auth.ts
// Source: authjs.dev/getting-started/adapters/prisma [CITED: authjs.dev]
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"  // shared Prisma client

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: "noreply@shallelha.com",
    }),
  ],
  // With Prisma adapter, default session strategy is "database".
  // "jwt" is faster (no DB lookup per request) but cannot be revoked server-side.
  // Use "database" — hosts are long-lived sessions (creating/running games).
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",          // custom sign-in page (Arabic RTL)
    error: "/auth/error",
  },
  callbacks: {
    session({ session, user }) {
      // Attach user.id to session so client can access it
      session.user.id = user.id
      return session
    },
  },
})
```

```typescript
// apps/web/app/api/auth/[...nextauth]/route.ts
// Source: authjs.dev/getting-started/migrating-to-v5 [CITED: authjs.dev]
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

**Key v5 differences from v4:**
- Package: `next-auth@beta` (same name, different tag) [VERIFIED: npm registry]
- Env vars: `AUTH_SECRET` (not `NEXTAUTH_SECRET`), `AUTH_GOOGLE_ID` (not `GOOGLE_CLIENT_ID`) [CITED: authjs.dev/getting-started/migrating-to-v5]
- Adapter: `@auth/prisma-adapter` (not `@next-auth/prisma-adapter`) [CITED: authjs.dev]
- No separate `authOptions` object — everything in the `NextAuth({})` call
- `auth()` replaces both `getServerSession()` and `getToken()` — works in Server Components, Route Handlers, and middleware

---

### Pattern 2: Prisma Schema Additions for NextAuth v5

**What:** Four new tables required by the Prisma adapter. Add to existing schema.prisma.

```prisma
// apps/server/prisma/schema.prisma — ADDITIONS ONLY
// Source: authjs.dev/getting-started/adapters/prisma [CITED: authjs.dev]

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime
  @@unique([identifier, token])
}
```

**Migration command (run locally, then Railway redeploys):**
```bash
cd apps/server && npx prisma migrate dev --name "add-nextauth-tables"
```

**Critical note:** The `apps/web` Prisma client must point at the same database. Since Prisma client lives in `apps/server`, the frontend needs a shared Prisma import path. Options:
1. Import from `@shallelha/server` workspace (requires proper workspace exports config)
2. Create `apps/web/lib/prisma.ts` that imports `PrismaClient` directly with `DATABASE_URL` env var — only works if the Vercel deployment can reach the database, which is NOT the case (Vercel cannot reach `postgres.railway.internal`)

**Recommended solution:** The Prisma adapter should run only on the **Express backend** (Railway), not on the Next.js frontend (Vercel). The auth API route runs in Next.js, but NextAuth needs the Prisma client to reach the database. This requires setting `DATABASE_URL` on Vercel to the **public** Railway PostgreSQL URL (not the private `.railway.internal` one).

For this project: either set a Vercel env var pointing to the public DB URL, or use a JWT session strategy so no database adapter is needed for session reads. [ASSUMED: The team will need to decide between adding a public DB connection from Vercel or using JWT sessions — both have tradeoffs]

---

### Pattern 3: Next.js Middleware — Protect /host Routes

**What:** `apps/web/middleware.ts` — intercepts all `/host/*` requests, redirects to sign-in if no session.
**When to use:** Always — this is the first line of defense for host-only routes.

```typescript
// apps/web/middleware.ts
// Source: authjs.dev/getting-started/session-management/protecting [CITED: authjs.dev]
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // /host routes require authentication
  if (pathname.startsWith("/host") && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Run middleware on /host routes only — not on static assets, API routes, or join routes
  matcher: ["/host", "/host/:path*"],
}
```

**IMPORTANT:** Middleware is a UX convenience, not the security boundary. Always verify `auth()` inside Server Components and Route Handlers before touching sensitive data. [CITED: authjs.dev/getting-started/session-management/protecting]

---

### Pattern 4: Socket.io Room Event Architecture

**Naming convention (Claude's Discretion — recommending colon-namespaced events):**

| Direction | Event | Payload | Purpose |
|-----------|-------|---------|---------|
| Client → Server | `room:create` | `{ hostId }` | Host creates room, receives code |
| Server → Client | `room:created` | `{ roomCode }` | Acknowledge code to host |
| Client → Server | `room:join` | `{ roomCode, name, emoji }` | Player joins |
| Server → Client | `room:joined` | `{ reconnectToken, players }` | Acknowledge join to player |
| Server → Room | `lobby:update` | `{ players }` | Broadcast updated player list to all in room |
| Client → Server | `room:reconnect` | `{ roomCode, reconnectToken }` | Player reconnecting after drop |
| Server → Client | `room:reconnected` | `{ players }` | Confirm reconnect success |
| Client → Server | `room:leave` | `{ roomCode }` | Voluntary leave |
| Client → Server | `game:start` | `{ roomCode }` | Host starts game |
| Client → Server | `game:end` | `{ roomCode }` | Host ends game |
| Server → Room | `game:started` | `{ roomCode }` | Broadcast game start to all |

**Server-side Socket.io room management:**
```typescript
// apps/server/src/socket/handlers/room.ts
// Source: socket.io/docs/v4/rooms/ [CITED: socket.io]
import type { Server, Socket } from "socket.io"
import { redis } from "../../redis/client"
import { roomService } from "../../services/room.service"

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on("room:join", async ({ roomCode, name, emoji }) => {
    const code = roomCode.toUpperCase()

    // Atomic player join (see Pattern 6 for Redis transaction)
    const result = await roomService.addPlayer(code, {
      socketId: socket.id,
      name,
      emoji,
    })

    if (!result.ok) {
      socket.emit("room:error", { message: result.error })
      return
    }

    // Join the Socket.io room
    await socket.join(code)

    // Ack to the joining player
    socket.emit("room:joined", {
      reconnectToken: result.reconnectToken,
      players: result.players,
    })

    // Broadcast updated lobby to everyone in the room
    io.to(code).emit("lobby:update", { players: result.players })
  })

  socket.on("disconnecting", async () => {
    // Get rooms before disconnect happens
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
    for (const roomCode of rooms) {
      await roomService.markDisconnected(roomCode, socket.id)
      // Broadcast after short grace window
      setTimeout(async () => {
        const room = await roomService.getRoom(roomCode)
        if (room) {
          io.to(roomCode).emit("lobby:update", { players: room.players })
        }
      }, 10_000)
    }
  })

  socket.on("room:reconnect", async ({ roomCode, reconnectToken }) => {
    const result = await roomService.reconnectPlayer(
      roomCode.toUpperCase(),
      reconnectToken,
      socket.id,
    )
    if (!result.ok) {
      socket.emit("room:error", { message: "Reconnect failed — please rejoin" })
      return
    }
    await socket.join(roomCode.toUpperCase())
    socket.emit("room:reconnected", { players: result.players })
    io.to(roomCode.toUpperCase()).emit("lobby:update", { players: result.players })
  })
}
```

**Key Socket.io room facts:** [CITED: socket.io/docs/v4/rooms/]
- Rooms are server-only concepts — clients cannot list rooms they are in
- Sockets automatically leave all rooms on disconnect — the `disconnecting` event fires before this, allowing you to read room membership
- `socket.to(room).emit()` sends to all in room except the sender
- `io.to(room).emit()` sends to all in room including the sender

---

### Pattern 5: Redis Room State — Full Operations

```typescript
// apps/server/src/services/room.service.ts
// Source: redis.io/docs/latest/develop/data-types/hashes/ [CITED: redis.io]
import { redis } from "../redis/client"
import { randomUUID } from "crypto"  // Node.js built-in — no uuid package needed

const ROOM_TTL = 60 * 60 * 24   // 24 hours
const MAX_PLAYERS = 8

function roomKey(code: string) { return `room:${code}` }

// Generate collision-safe 4-char code
async function generateRoomCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I, O, 0, 1 (ambiguous)
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
    // NX flag: only set if key doesn't exist — atomic collision check
    const set = await redis.set(`room:${code}:lock`, "1", "EX", ROOM_TTL, "NX")
    if (set === "OK") return code
  }
  throw new Error("Failed to generate unique room code after 10 attempts")
}

export const roomService = {
  async createRoom(hostId: string) {
    const roomCode = await generateRoomCode()
    const key = roomKey(roomCode)
    await redis
      .multi()
      .hset(key, {
        hostId,
        status: "waiting",
        createdAt: new Date().toISOString(),
        players: JSON.stringify([]),
      })
      .expire(key, ROOM_TTL)
      .exec()
    return roomCode
  },

  async addPlayer(roomCode: string, player: { socketId: string; name: string; emoji: string }) {
    const key = roomKey(roomCode)
    // Use WATCH/MULTI/EXEC for optimistic locking
    // Source: redis.io/glossary/redis-race-condition/ [CITED: redis.io]
    const result = await redis.watch(key, async () => {
      const raw = await redis.hget(key, "players")
      if (!raw) return { ok: false as const, error: "Room not found" }
      const players = JSON.parse(raw) as Player[]
      if (players.length >= MAX_PLAYERS) return { ok: false as const, error: "Room is full" }

      const reconnectToken = randomUUID()
      const newPlayer = {
        ...player,
        reconnectToken,
        connectedAt: new Date().toISOString(),
        disconnectedAt: null,
      }
      players.push(newPlayer)

      const multi = redis.multi()
      multi.hset(key, "players", JSON.stringify(players))
      await multi.exec()

      return { ok: true as const, reconnectToken, players }
    })
    return result
  },

  async markDisconnected(roomCode: string, socketId: string) {
    const key = roomKey(roomCode)
    const raw = await redis.hget(key, "players")
    if (!raw) return
    const players = JSON.parse(raw) as Player[]
    const updated = players.map(p =>
      p.socketId === socketId ? { ...p, disconnectedAt: new Date().toISOString() } : p
    )
    await redis.hset(key, "players", JSON.stringify(updated))
  },

  async reconnectPlayer(roomCode: string, reconnectToken: string, newSocketId: string) {
    const key = roomKey(roomCode)
    const raw = await redis.hget(key, "players")
    if (!raw) return { ok: false as const }
    const players = JSON.parse(raw) as Player[]
    const player = players.find(p => p.reconnectToken === reconnectToken)
    if (!player) return { ok: false as const }

    const disconnectedAt = player.disconnectedAt ? new Date(player.disconnectedAt) : null
    const now = Date.now()
    const GRACE_MS = 10_000
    if (!disconnectedAt || now - disconnectedAt.getTime() > GRACE_MS) {
      return { ok: false as const }  // Grace window expired
    }

    // Restore player with new socketId
    const updated = players.map(p =>
      p.reconnectToken === reconnectToken
        ? { ...p, socketId: newSocketId, disconnectedAt: null }
        : p
    )
    await redis.hset(key, "players", JSON.stringify(updated))
    return { ok: true as const, players: updated }
  },

  async getRoom(roomCode: string) {
    const key = roomKey(roomCode)
    const data = await redis.hgetall(key)
    if (!data || !data.hostId) return null
    return {
      ...data,
      players: JSON.parse(data.players || "[]") as Player[],
    }
  },
}
```

**Room code character set note:** Exclude visually ambiguous characters (I/1, O/0). Remaining 32 chars give 32^4 = 1,048,576 possible codes. At 100 simultaneous rooms, collision probability is negligible. [ASSUMED: character set sufficient for MVP scale]

---

### Pattern 6: Host Identity in Socket.io (WebSocket-only Constraint)

**Critical finding:** Browser WebSocket API does not allow custom HTTP headers. `extraHeaders` in socket.io-client is silently ignored when using `transports: ['websocket']`. [CITED: socket.io/how-to/use-with-jwt]

**The correct approach — `auth` object in handshake:**

```typescript
// apps/web/lib/socket.ts (modified)
'use client'
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(userId?: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { userId },   // <-- available as socket.handshake.auth.userId on server
    })
  }
  return socket
}

// To update auth after page load (e.g., after session loads):
export function updateSocketAuth(userId: string) {
  const s = getSocket()
  s.auth = { userId }
}
```

```typescript
// apps/server/src/socket/middleware/auth.ts
import type { Server } from 'socket.io'

export function registerSocketMiddleware(io: Server) {
  io.use((socket, next) => {
    // Players may connect without userId (anonymous join flow)
    // Only enforce for host-specific events (game:start, game:end)
    // Store userId if present for host identity verification
    const userId = socket.handshake.auth?.userId
    if (userId) {
      socket.data.userId = userId
    }
    next()
  })
}
```

**Host identity verification per event:**
```typescript
socket.on("game:start", async ({ roomCode }) => {
  const room = await roomService.getRoom(roomCode)
  if (!room || room.hostId !== socket.data.userId) {
    socket.emit("room:error", { message: "Not authorized" })
    return
  }
  io.to(roomCode).emit("game:started", { roomCode })
})
```

---

### Pattern 7: sessionStorage Reconnect Token — Frontend Flow

```typescript
// apps/web/app/join/[roomCode]/page.tsx (client component section)
'use client'
import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'

const STORAGE_KEY = (code: string) => `shllahaReconnectToken_${code}`

export function PlayerLobby({ roomCode }: { roomCode: string }) {
  const socket = getSocket()

  useEffect(() => {
    socket.connect()

    socket.emit("room:join", { roomCode, name, emoji })

    socket.on("room:joined", ({ reconnectToken, players }) => {
      // Store in sessionStorage — survives refresh, dies on tab close
      sessionStorage.setItem(STORAGE_KEY(roomCode), reconnectToken)
    })

    socket.on("disconnect", () => {
      const token = sessionStorage.getItem(STORAGE_KEY(roomCode))
      if (token) {
        // Socket.io auto-reconnects — send reconnect event on reconnect
        socket.once("connect", () => {
          socket.emit("room:reconnect", { roomCode, reconnectToken: token })
        })
      }
    })

    return () => { socket.off(); socket.disconnect() }
  }, [roomCode])
}
```

**Why `disconnect` fires and socket auto-reconnects:** Socket.io client has built-in reconnect logic with exponential backoff. The `disconnect` event fires when the connection drops, then it auto-reconnects. The client should send the `room:reconnect` event immediately on the next `connect` event. [CITED: socket.io/docs/v4/client-socket-instance/]

---

### Pattern 8: Socket.io Connection State Recovery (Alternative to Manual Token)

Socket.io v4.6+ has built-in `connectionStateRecovery` [CITED: socket.io/docs/v4/connection-state-recovery]:

```typescript
// apps/server/src/index.ts — alternative approach
const io = new Server(httpServer, {
  transports: ['websocket'],
  connectionStateRecovery: {
    maxDisconnectionDuration: 10_000,  // 10 seconds — matches ROOM-05 requirement
    skipMiddlewares: true,
  },
})
```

**Tradeoffs vs manual token approach:**

| | Built-in Recovery | Manual sessionStorage Token |
|--|--|--|
| Implementation | One config option | ~40 lines client + server code |
| Reliability | Works if server hasn't restarted | Works across server restarts (token in Redis) |
| Adapter compat | In-memory adapter only (no Redis PUB/SUB adapter) | Any Redis operation |
| Cross-tab | Single tab | Per-tab (sessionStorage is tab-isolated) |

**Recommendation:** Use built-in `connectionStateRecovery` as the primary mechanism (zero code), with the manual `sessionStorage` token as fallback for cases where the server restarts or the recovery window expires. These two approaches are complementary, not mutually exclusive. [ASSUMED: built-in recovery will handle most short drops; manual token handles server restart edge case]

---

### Anti-Patterns to Avoid

- **Using `extraHeaders` for host token with WebSocket-only transport:** Browser WebSocket API silently drops custom headers. Use `socket.handshake.auth` instead. [CITED: socket.io/how-to/use-with-jwt]
- **Reading session cookies in Socket.io middleware:** The Express server and Next.js run in different processes. Next.js session cookies are not accessible to the Socket.io server. Pass identity through `socket.handshake.auth`.
- **Storing players as individual Redis keys:** Use a single `players` JSON field in the room hash. Individual keys (`room:{code}:player:{id}`) create multi-key transaction complexity.
- **Not wrapping player join in a Redis transaction:** A plain HGETALL + HSET pair has a TOCTOU race: two players joining simultaneously can both read 7 players, both write 8 players, and end up with 9. Use MULTI/EXEC or WATCH.
- **Using localStorage for reconnectToken:** localStorage is shared across tabs — two players on the same device would overwrite each other's token. sessionStorage is per-tab.
- **Running `prisma migrate deploy` on Railway before schema is ready:** The migration must be tested locally first. Railway's build step should run `prisma generate` only; `migrate deploy` is manual or in a release command.
- **Setting `NEXTAUTH_SECRET` instead of `AUTH_SECRET`:** NextAuth v5 ignores the old `NEXTAUTH_SECRET` env var. Only `AUTH_SECRET` is recognized. [CITED: authjs.dev/getting-started/migrating-to-v5]
- **Using `next-auth@latest` (4.x) instead of `next-auth@beta` (5.x):** The `latest` tag resolves to v4.24.13 which lacks the App Router `auth()` function. Always install with `@beta` tag for v5.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Magic link email | Custom email sender | Auth.js Resend provider | Token generation, hashing, expiry, and verification are done for you |
| Google OAuth flow | Custom OAuth redirect/callback | Auth.js Google provider | OAuth is complex (PKCE, state param, token exchange) — multiple CVEs in hand-rolled implementations |
| Session management | Custom JWT/cookie logic | NextAuth database sessions | Secure cookie flags, CSRF protection, session rotation |
| Route protection | Manual cookie reading in each page | `middleware.ts` + `auth()` | One place, one pattern; middleware runs at the edge |
| Random room code collision | Custom distributed lock | Redis `SET NX EX` (atomic) | NX flag makes "set if not exists" a single atomic operation |
| WebSocket reconnect | Custom heartbeat + reconnect loop | Socket.io built-in `connectionStateRecovery` | Auto-reconnect with exponential backoff, missed event replay, session ID |
| Emoji input | Full emoji picker library | Static array of 15–20 curated emoji rendered as buttons | Emoji pickers are large, complex, and often RTL-broken |

---

## Common Pitfalls

### Pitfall 1: NextAuth v5 Prisma Adapter + Vercel Cannot Reach Private Railway PostgreSQL

**What goes wrong:** `apps/web` runs on Vercel. The NextAuth Prisma adapter in `auth.ts` needs to create sessions in PostgreSQL. But the Railway PostgreSQL URL uses the private hostname `postgres.railway.internal:5432` — only accessible from within Railway's private network.

**Why it happens:** Vercel and Railway are separate cloud environments. The private Railway network is not accessible from Vercel.

**How to avoid:** Use one of these two strategies:
1. **JWT session strategy:** Override `session: { strategy: "jwt" }` in `auth.ts`. Sessions live in cookies — no DB query per request, no Vercel→Railway connection needed. Tradeoff: cannot revoke sessions server-side.
2. **Public DB URL:** Set `DATABASE_URL` in Vercel environment variables to the Railway PostgreSQL public URL (available from Railway → service → Connect → Public). This adds ~5ms network latency per session read.

**Recommendation for this project:** Use **JWT sessions** for Phase 2. Hosts are game runners, not high-security users — session revocation is not a critical requirement at MVP. [ASSUMED]

**Warning signs:** `Error: P1001: Can't reach database server at postgres.railway.internal:5432` in Vercel function logs.

---

### Pitfall 2: Socket.io `auth` Object Not Updated After Session Loads

**What goes wrong:** The socket singleton is created before the Next.js session loads (`autoConnect: false`). By the time `session.user.id` is available, the socket is already connected without userId.

**Why it happens:** `getSocket()` is called in component mount; session is loaded async.

**How to avoid:** Delay socket connection until session is confirmed. In host components:
```typescript
const { data: session } = useSession()
useEffect(() => {
  if (!session?.user?.id) return
  const s = getSocket(session.user.id)
  s.auth = { userId: session.user.id }
  s.connect()
}, [session?.user?.id])
```
**Warning signs:** `socket.data.userId` is undefined in room event handlers; host cannot start game.

---

### Pitfall 3: Redis WATCH Transaction Fails Silently Under Contention

**What goes wrong:** Two players join the same room simultaneously. The WATCH/MULTI/EXEC pattern detects contention and the second transaction returns `null` (exec returns null if WATCH key was modified). If the calling code doesn't retry, the second player gets a silent failure.

**Why it happens:** WATCH-based optimistic locking requires retry logic at the application layer.

**How to avoid:** Wrap the transaction in a retry loop (max 3 attempts):
```typescript
for (let i = 0; i < 3; i++) {
  const result = await redis.watch(key, async () => { /* ... */ })
  if (result !== null) return result  // success
}
throw new Error("Could not join room due to concurrent writes")
```
**Warning signs:** Players get no `room:joined` event during load tests with 8 players joining simultaneously.

---

### Pitfall 4: `next-auth@latest` Installs v4 (Not v5)

**What goes wrong:** Developer runs `npm install next-auth` or `npm install next-auth@latest` and gets v4.24.13. The App Router `auth()` function does not exist in v4.

**Why it happens:** npm `latest` tag still points to v4. v5 is published under the `beta` tag.

**How to avoid:** Always install with `npm install next-auth@beta`. Pin the exact version in package.json after install. [VERIFIED: npm registry — latest=4.24.13, beta=5.0.0-beta.30]

**Warning signs:** `Cannot find module 'next-auth/providers/google'` (path changed in v5), or `auth is not a function` from the catch-all route.

---

### Pitfall 5: iOS Safari Background Tab WebSocket Closure

**What goes wrong:** iOS Safari silently closes WebSocket connections when the browser tab is not in the foreground (power saving). A player who switches apps during a game appears to disconnect.

**Why it happens:** Apple intentionally closes background WebSocket connections to reduce battery drain. [CITED: discussions.apple.com/thread/256142477]

**How to avoid:** This is by design and cannot be prevented. The 10-second reconnect grace window is the mitigation. Additionally:
- Ensure the lobby shows a "reconnecting..." state rather than immediately showing "player left"
- Consider a slightly longer grace window (15s) on the server — though CONTEXT.md locked 10s for ROOM-05

**Warning signs:** Players on iPhone frequently appear to drop out when iOS sends the browser to background.

---

### Pitfall 6: `AUTH_SECRET` Missing → Runtime Error on Every Auth Request

**What goes wrong:** NextAuth v5 throws `[auth][error] MissingSecret: Please define a secret` on every request if `AUTH_SECRET` is not set.

**Why it happens:** v5 requires `AUTH_SECRET` (not `NEXTAUTH_SECRET`). The env var name changed in v5.

**How to avoid:** Generate and set `AUTH_SECRET`:
```bash
npx auth secret  # prints a random AUTH_SECRET to .env
```
Set the same value in Vercel environment variables. [CITED: authjs.dev/getting-started/migrating-to-v5]

---

### Pitfall 7: Prisma Migration vs Generation on Railway

**What goes wrong:** Railway build runs `prisma generate` (correct) but also runs `prisma migrate dev` (wrong — this command requires interactive prompt and should only run locally).

**Why it happens:** Developers copy local dev commands into Railway's build command.

**How to avoid:** Railway build command should be:
```bash
npx prisma generate && npm run build
```
Railway release command (one-time after schema changes):
```bash
npx prisma migrate deploy
```
`migrate deploy` (not `migrate dev`) is the production migration command — it applies pending migrations without prompt. [ASSUMED: Railway release commands are configured separately from build commands]

---

## Code Examples

### Room Code Generation (Collision-Safe)
```typescript
// Source: redis.io/docs/latest/commands/set/ [CITED: redis.io]
async function generateRoomCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
    // SET NX EX: atomic "set if not exists with TTL"
    const acquired = await redis.set(`room:${code}:lock`, "1", "EX", 86400, "NX")
    if (acquired === "OK") return code
  }
  throw new Error("Room code generation failed — too many collisions")
}
```

### NextAuth v5 Route Handler (Minimal)
```typescript
// apps/web/app/api/auth/[...nextauth]/route.ts
// Source: authjs.dev/getting-started/migrating-to-v5 [CITED: authjs.dev]
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Protecting a Server Component (Host Dashboard)
```typescript
// apps/web/app/host/page.tsx
// Source: authjs.dev/getting-started/session-management/protecting [CITED: authjs.dev]
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HostPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <main>
      {/* Create Room CTA */}
    </main>
  )
}
```

### Artillery Load Test Script (100 Simultaneous Rooms)
```yaml
# apps/server/load-test/100-rooms.yml
# Source: artillery.io/docs/reference/engines/socketio [CITED: artillery.io]
config:
  target: "https://shallelha-server-production.up.railway.app"
  engines:
    socketio-v3: {}
  phases:
    - duration: 30
      arrivalRate: 10          # 10 new rooms/sec for 30s = ~300 total connections
  socketio:
    transports:
      - websocket

scenarios:
  - engine: socketio-v3
    name: "Simulate room with 8 players"
    flow:
      - emit:
          channel: "room:join"
          data:
            roomCode: "TEST"
            name: "لاعب"
            emoji: "🦁"
      - think: 5               # hold connection for 5s
```

**Note:** Artillery requires `npm install artillery artillery-engine-socketio-v3`. The default Artillery Socket.io engine uses v2 client — you MUST install `artillery-engine-socketio-v3` for Socket.io v4 compatibility. [CITED: socket.io/docs/v4/load-testing/]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getServerSession(authOptions)` in Server Components | `auth()` from `@/auth` | NextAuth v5 (2024) | One function works everywhere |
| `@next-auth/prisma-adapter` | `@auth/prisma-adapter` | NextAuth v5 | Scoped to `@auth/` namespace |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` env vars | `AUTH_SECRET`, `AUTH_URL` env vars | NextAuth v5 | All auth vars use `AUTH_` prefix |
| `withAuth` middleware wrapper | `auth` as middleware directly | NextAuth v5 | Simpler, no wrapper needed |
| `pages/api/auth/[...nextauth].ts` (Pages Router) | `app/api/auth/[...nextauth]/route.ts` (App Router) | Next.js 13 | App Router file convention |

**Deprecated/outdated:**
- `@next-auth/prisma-adapter`: This package still works for v4 but should not be used for v5. Use `@auth/prisma-adapter`.
- `getServerSession` from `next-auth/next`: Not available in v5. Use `auth()` instead.
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`: Deprecated in v5. Use `AUTH_SECRET` and `AUTH_URL`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | JWT session strategy is appropriate for host auth in Phase 2 (vs database sessions) | Pattern 1 / Pitfall 1 | If database sessions are required (e.g., for forced sign-out), the Vercel→Railway DB connectivity problem must be solved via public DB URL |
| A2 | A single Railway replica is sufficient for 100 simultaneous rooms (no Redis adapter needed for Socket.io) | Phase Requirements SYNC-02 | If Railway scales to multiple replicas under load, Socket.io room membership becomes inconsistent — needs `@socket.io/redis-adapter` (uses PUB/SUB, incompatible with Connection State Recovery) |
| A3 | `randomUUID()` from Node.js built-in `crypto` is available (Node 18+) — no `uuid` package needed | Pattern 5 | If running on Node <14.17, `crypto.randomUUID()` is not available. Verified Node 22 is installed locally; Railway uses Node 18 (`.nvmrc`). Safe. |
| A4 | The 4-char code character set (32 chars) provides sufficient collision avoidance at 100 rooms | Pattern 5 | 32^4 = 1,048,576 codes, 100 occupied = 0.009% collision chance per attempt. Negligible at MVP scale. |
| A5 | Resend is appropriate for magic link email (no custom SMTP needed) | Standard Stack | If the domain `shallelha.com` is not configured in Resend, email delivery fails. Requires Resend account + DNS verification before testing. |

---

## Open Questions

1. **JWT vs Database Sessions for Host Auth**
   - What we know: Prisma adapter with database sessions requires Vercel to reach Railway PostgreSQL. Railway private network is not accessible from Vercel. Public DB URL adds latency and exposure risk.
   - What's unclear: Whether the team is comfortable with JWT sessions (no forced sign-out capability) vs accepting the public DB URL approach.
   - Recommendation: Use JWT sessions for Phase 2 (set `session: { strategy: "jwt" }`). The Prisma adapter is still used for OAuth account linking (Google OAuth) and magic link token storage — these write operations happen via the Next.js API route (`/api/auth/[...nextauth]`) which is on Vercel, so the DB connection from Vercel is still needed for those writes. Cleaner solution: use Railway public DB URL in `DATABASE_URL` Vercel env var.

2. **Resend Domain Registration**
   - What we know: Resend requires DNS verification of the sending domain before emails are delivered.
   - What's unclear: Whether `shallelha.com` is owned/registered and available for Resend DNS records.
   - Recommendation: If domain is not ready, use `resend.dev` sandbox for development, or defer magic link testing to a later task.

3. **Multi-Replica Scaling**
   - What we know: At launch, a single Railway replica is sufficient for 100 rooms. If Railway auto-scales, Socket.io room state breaks.
   - What's unclear: Whether Railway is configured to allow multiple replicas.
   - Recommendation: Explicitly set Railway service to `max_instances=1` for Phase 2. Document that Phase 8 (Polish & Launch) must add `@socket.io/redis-adapter` before enabling scaling.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Both apps | Yes | v22.20.0 | — |
| npm | Package management | Yes | 10.9.3 | — |
| Railway PostgreSQL | NextAuth adapter, Prisma | Yes (live) | postgres:16 | — |
| Railway Redis | Room state | Yes (live) | redis:7 | — |
| Resend account + domain | Magic link email | Unknown | — | Use Gmail SMTP (nodemailer) during dev |
| Google Cloud Console project | Google OAuth | Unknown | — | No fallback — must create OAuth credentials |
| `AUTH_SECRET` | NextAuth v5 | Must generate | — | `npx auth secret` or `openssl rand -base64 32` |

**Missing with no fallback:**
- Google OAuth credentials (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) — must be created in Google Cloud Console and added to Vercel env vars before testing host sign-in.

**Missing with fallback:**
- Resend — can use nodemailer with Gmail SMTP for local dev magic link testing.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (backend unit) + Playwright or curl (E2E smoke) |
| Config file | `apps/server/vitest.config.ts` (existing from Phase 1) |
| Quick run command | `cd apps/server && npx vitest run` |
| Full suite command | `cd apps/server && npx vitest run && node load-test/smoke-100-rooms.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-01 | Room created with 4-char code in Redis | unit | `npx vitest run src/services/room.service.test.ts` | No — Wave 0 |
| ROOM-02 | Player joins public route, no auth required | integration | `curl -s /join/TEST` returns 200 | No — Wave 0 |
| ROOM-03 | `lobby:update` broadcast fires after join | unit (mock socket) | `npx vitest run src/socket/handlers/room.test.ts` | No — Wave 0 |
| ROOM-04 | 9th player join is rejected (max 8) | unit | `npx vitest run src/services/room.service.test.ts` | No — Wave 0 |
| ROOM-05 | Reconnect within 10s restores player | unit | `npx vitest run src/services/room.service.test.ts` | No — Wave 0 |
| INFRA-02 | 100 simultaneous rooms at load test | load test | `node load-test/smoke-100-rooms.js` | No — Wave 0 |
| INFRA-03 | iOS Safari + Android Chrome connection | manual | Visual inspection on device | Manual |

### Sampling Rate
- **Per task commit:** `cd apps/server && npx vitest run` (unit tests, < 15s)
- **Per wave merge:** Full suite including load test script
- **Phase gate:** All unit tests green + load test completes without errors

### Wave 0 Gaps

- [ ] `apps/server/src/services/room.service.test.ts` — covers ROOM-01, ROOM-04, ROOM-05
- [ ] `apps/server/src/socket/handlers/room.test.ts` — covers ROOM-03
- [ ] `apps/server/load-test/smoke-100-rooms.js` — covers INFRA-02
- [ ] Install load test devDependencies: `npm install -D artillery artillery-engine-socketio-v3 --workspace=apps/server`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (host sign-in) | NextAuth.js v5 — Google OAuth + Resend magic link |
| V3 Session Management | Yes | NextAuth database or JWT sessions; HttpOnly cookies |
| V4 Access Control | Yes (host-only game controls) | `socket.data.userId` vs `room.hostId` check per event |
| V5 Input Validation | Yes (room code, player name, emoji) | zod — validate roomCode format, name length, emoji whitelist |
| V6 Cryptography | Partial | NextAuth handles token hashing; `crypto.randomUUID()` for reconnectToken |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Player impersonates host to start game | Elevation of Privilege | Server checks `room.hostId === socket.data.userId` before `game:start` |
| Player joins full room (bypass client-side guard) | Tampering | Server re-checks `players.length >= 8` after Redis read |
| Room code enumeration (brute force join) | Information Disclosure | Room codes expire in 24h; no auth = no account = no persistent attack surface |
| sessionStorage token stolen (XSS) | Information Disclosure | 10-second TTL limits damage window; use CSP headers via helmet |
| Replay of reconnectToken after grace window | Elevation of Privilege | Server checks `disconnectedAt` timestamp; rejects after 10s |
| CSRF on NextAuth sign-in form | Tampering | NextAuth v5 uses CSRF tokens by default on form submissions |
| `AUTH_SECRET` leaked to client | Information Disclosure | Must be server-only env var; never prefix with `NEXT_PUBLIC_` |

---

## Sources

### Primary (HIGH confidence)
- [authjs.dev/getting-started/adapters/prisma](https://authjs.dev/getting-started/adapters/prisma) — exact Prisma schema, adapter package name
- [authjs.dev/getting-started/migrating-to-v5](https://authjs.dev/getting-started/migrating-to-v5) — v4→v5 breaking changes, env var renames, auth() function
- [authjs.dev/getting-started/session-management/protecting](https://authjs.dev/getting-started/session-management/protecting) — middleware.ts pattern for route protection
- [authjs.dev/getting-started/authentication/email](https://authjs.dev/getting-started/authentication/email) — Resend provider setup, nodemailer alternative
- [socket.io/docs/v4/rooms/](https://socket.io/docs/v4/rooms/) — rooms architecture, `socket.join`, `socket.to`, `disconnecting` event
- [socket.io/docs/v4/middlewares/](https://socket.io/docs/v4/middlewares/) — `io.use()`, `socket.handshake.auth`
- [socket.io/how-to/use-with-jwt](https://socket.io/how-to/use-with-jwt) — confirmed `extraHeaders` does NOT work with WebSocket-only; `auth` object does
- [socket.io/docs/v4/connection-state-recovery](https://socket.io/docs/v4/connection-state-recovery) — built-in recovery config, maxDisconnectionDuration, adapter compatibility table
- [socket.io/docs/v4/load-testing/](https://socket.io/docs/v4/load-testing/) — Artillery + `artillery-engine-socketio-v3` recommendation
- [redis.io/docs/latest/commands/set/](https://redis.io/docs/latest/commands/set/) — SET NX EX atomic pattern
- [redis.io/docs/latest/develop/data-types/hashes/](https://redis.io/docs/latest/develop/data-types/hashes/) — HSET, HGETALL
- npm registry — verified: `next-auth@latest=4.24.13`, `next-auth@beta=5.0.0-beta.30`, `@auth/prisma-adapter=2.11.1`, `resend=6.10.0`, `artillery=2.0.30`, `artillery-engine-socketio-v3=1.2.0`

### Secondary (MEDIUM confidence)
- [artillery.io/docs/reference/engines/socketio](https://www.artillery.io/docs/reference/engines/socketio) — Socket.io engine config for Artillery
- [discussions.apple.com/thread/256142477](https://discussions.apple.com/thread/256142477) — iOS Safari background WebSocket closure (power saving behavior)
- Multiple Auth.js v5 community guides confirming beta-is-production-ready status

### Tertiary (LOW confidence)
- Community guidance on JWT vs database sessions tradeoff for this specific Vercel+Railway architecture — not verified against official Railway docs

---

## Metadata

**Confidence breakdown:**
- NextAuth.js v5 setup: HIGH — verified against authjs.dev official docs and npm registry
- Socket.io room architecture: HIGH — verified against socket.io official v4 docs
- Redis atomic operations: HIGH — verified against redis.io official docs
- Reconnect token pattern: MEDIUM — pattern is sound but specific ioredis WATCH behavior verified only from docs, not tested
- Load test approach: MEDIUM — Artillery + socketio-v3 engine is documented; specific 100-room config is extrapolated
- iOS Safari behavior: MEDIUM — based on Apple community threads and WebKit bug tracker

**Research date:** 2026-04-10
**Valid until:** 2026-07-10 (90 days — Auth.js v5 may reach stable by then; verify `next-auth@beta` version before installing)
