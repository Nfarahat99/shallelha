# Phase 2: Room System & Real-Time Core — Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Source:** /gsd-discuss-phase 2

<domain>
## Phase Boundary

Phase 2 delivers the full room creation and join flow, real-time lobby synchronization, and host game controls. At the end of this phase, a host with an account can create a room, share a 4-character code, and players can join from mobile browsers — appearing in a live lobby on the host screen. The host can then start, advance, or end the game.

**In scope:**
- NextAuth.js integration (host must be authenticated to create a room)
- Host dashboard: create room → get 4-char code → see live lobby
- Player join flow: go to /join → enter code → enter name + pick emoji avatar → wait in lobby
- Socket.io room event system (join, leave, reconnect, lobby state broadcast)
- Reconnect logic: sessionStorage token, 10-second grace window
- Max 8 players enforced server-side
- Host controls: start game, advance question, end game (UI shell only — game logic is Phase 4)
- Load target: 100 simultaneous rooms

**Out of scope (these phases handle it):**
- Full Arabic RTL UI polish — Phase 3
- Question serving and scoring — Phase 4
- Player accounts / persistent stats — v2 requirements
</domain>

<decisions>
## Implementation Decisions

### Host Authentication

**LOCKED: Account required to create a room.**

The host must sign in before creating a room. Implementation:
- **Library:** NextAuth.js (already in tech stack decision from Phase 1)
- **Providers:** Google OAuth + Email magic link
- **Scope:** Auth is ONLY required for the host. Players join anonymously (no account needed).
- **After sign-in:** Host is redirected to a "Create Room" screen. Session is persisted via NextAuth JWT/session.
- **Route protection:** `/host` and `/host/[roomCode]` routes require authentication. `/join` does not.

Note to researcher: NextAuth.js v5 (Auth.js) vs v4 — check which is compatible with Next.js 14 App Router. Phase 1 RESEARCH.md noted NextAuth.js is planned; confirm provider setup for App Router.

### Player Display Identity

**LOCKED: Players pick their own name + choose an emoji avatar.**

Join flow on `/join`:
1. Player enters 4-char room code
2. Player enters their display name (Arabic text input, max ~15 chars)
3. Player selects an emoji avatar from a grid (curated set, not full emoji picker)
4. Player joins the room → appears in lobby on host screen with name + avatar

Implementation notes:
- Name is Arabic-first (text-start, RTL input direction)
- Emoji set: 12–20 options — animals, sports, food — no people/faces to avoid representation issues
- Name + emoji stored in Redis as part of player state (ephemeral, not in PostgreSQL)
- Emoji selection UI: grid of tappable emoji buttons, large touch targets (min 44px)

### Room URL & Navigation Structure

**LOCKED: Separate /host and /join routes.**

```
/               → Landing page (Create Room button + Join Room button)
/host           → Protected route — requires host auth — shows "Create Room" CTA
/host/[roomCode] → Protected route — host dashboard for active room (lobby + controls)
/join           → Public route — player enters 4-char code
/join/[roomCode] → Public route — player enters name + picks avatar
```

- Host creates room → server generates 4-char alphanumeric code → redirected to `/host/[roomCode]`
- Player types code at `/join` → validated → redirected to `/join/[roomCode]` for name+avatar entry
- Invalid/expired code on `/join/[roomCode]` → error state with "try again" option
- Room code is case-insensitive (normalize to uppercase server-side)

### Reconnect Token Strategy

**LOCKED: sessionStorage token assigned by server on join.**

Flow:
1. Player joins room → server assigns a unique `reconnectToken` (UUID or short random string)
2. Frontend stores token in `sessionStorage` under key `shllahaReconnectToken_{roomCode}`
3. On disconnect: Socket.io fires reconnect event → client reads token from sessionStorage → sends `reconnect` event with `{ roomCode, reconnectToken }`
4. Server matches token against Redis player state → restores player to room if within 10-second window
5. Token expires server-side after 10 seconds; after that, player must re-join from scratch

Why sessionStorage (not localStorage):
- Dies when browser tab is closed → no ghost players lingering
- Survives page refresh → reconnect works after accidental refresh
- Per-tab isolation → two players on same device don't share tokens

### Redis Room State Schema

Room state stored in Redis as a hash `room:{roomCode}`:
```
hostId          → NextAuth session user ID
status          → waiting | playing | ended
createdAt       → ISO timestamp
players         → JSON array of { socketId, reconnectToken, name, emoji, connectedAt }
```
Key TTL: 24 hours (rooms auto-expire)

### Claude's Discretion

The following implementation details are left to the planner/researcher:
- Socket.io event naming conventions (`room:join`, `room:leave`, etc.)
- Redis key structure beyond what's specified above
- Error handling UI (specific error messages, toast vs inline)
- Lobby UI component structure (planner decides — Phase 3 will RTL-polish it)
- Loading/skeleton states while room is being created
- Host session persistence strategy (JWT vs database session — NextAuth default is fine)
- Specific NextAuth.js version and adapter (researcher to confirm App Router compatibility)
- How "100 simultaneous rooms" load target is tested (researcher to propose approach)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `HANDOFF.md` — Tech stack decisions, critical findings (Socket.io WebSocket-only, ioredis ?family=0, Tailwind RTL logical properties)
- `.planning/REQUIREMENTS.md` — ROOM-01 through ROOM-06, SYNC-01 through SYNC-03, INFRA-02, INFRA-03 (full acceptance criteria)
- `.planning/PROJECT.md` — Non-negotiables, constraints, out-of-scope items
- `shallelha.md` — Full PRD with product decisions

### Phase 1 Research & Infrastructure
- `.planning/phases/01-project-foundation-infrastructure/01-RESEARCH.md` — Critical technical findings (must read before planning)
- `apps/server/src/socket/index.ts` — Existing socket handler (connection logging stub — needs room event handlers)
- `apps/web/lib/socket.ts` — Frontend socket singleton (autoConnect: false — callers must call .connect())
- `apps/server/src/redis/client.ts` — ioredis client (REDIS_URL with ?family=0 pattern)
- `apps/server/src/db/prisma.ts` — Prisma singleton

### Architecture Constraints
- NextAuth.js must be compatible with Next.js 14 App Router (researcher to verify v4 vs v5/Auth.js)
- Socket.io transport MUST remain `['websocket']` only — no polling fallback (Railway has no sticky sessions)
- All Tailwind classes MUST use logical properties: `ms-`, `ps-`, `text-start` etc. — NEVER `ml-`, `text-left`

</canonical_refs>

<specifics>
## Specific Ideas & References

- **Jackbox Games** is the reference UX model — quick join, no friction, phone as controller
- Room code is 4 uppercase alphanumeric characters (e.g., "KFZQ") — short enough to type on a phone in seconds
- Emoji avatar grid: 12–20 emojis, large touch targets (min 44px × 44px), no face/person emojis
- Arabic name input: right-to-left input direction, `dir="rtl"` on the input element
- "60 seconds from discovery to game session" is the core value — every friction point in the join flow hurts this

</specifics>

<deferred>
## Deferred Ideas

- Player accounts for persistent stats — v2 requirement (AUTH-01 through AUTH-03)
- QR code scanning to join — noted as an option, deferred (not in Phase 2 scope)
- Arabic auto-assigned nicknames — considered but rejected in favor of player-chosen names
- URL-embedded player token for reconnect — considered but rejected (URL sharing could hijack a player slot)
- Chat in lobby while waiting — not in Phase 2 scope

</deferred>

---

*Phase: 02-room-system-real-time-core*
*Context gathered: 2026-04-10 via /gsd-discuss-phase 2*
