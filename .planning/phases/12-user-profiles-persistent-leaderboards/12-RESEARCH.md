# Phase 12: User Profiles + Persistent Leaderboards — Research

**Researched:** 2026-04-21
**Domain:** PWA (Next.js App Router), SVG composable avatars, PostgreSQL leaderboard aggregation, anonymous-to-auth stat claiming, @vercel/og profile cards
**Confidence:** HIGH (core stack verified), MEDIUM (leaderboard aggregation patterns), MEDIUM (anonymous claiming pattern)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tech stack is fixed: Next.js 14 (App Router, RSC), Tailwind CSS, Node.js + Express + Socket.io, PostgreSQL + Prisma ORM, Redis, NextAuth v5 beta.30, @vercel/og edge runtime
- Phase 11 Prisma schema is already in place (User, GameSession, PlayerGameResult models)
- Avatar format per REQ-008: composable SVG/CSS, NOT raster images, stored as `{ faceShape, headwear, colorPalette }` JSON
- Avatar localStorage key is `shallelha_avatar`
- Socket event for join is `player:join` (currently `room:join` in client — must stay backward-compatible)
- PWA package per REQUIREMENTS.md mentions `next-pwa` — but research has determined @serwist/next is the correct choice (next-pwa is deprecated/unmaintained for App Router)
- Manifest fields: `name: "شعللها"`, `display: "standalone"`, icons 192×192 + 512×512
- OG image generation uses @vercel/og with Cairo font loaded from Google Fonts CDN (existing pattern in /api/og/result)

### Claude's Discretion
- Leaderboard query strategy (materialized view vs cron aggregation vs $queryRaw)
- Room leaderboard data model design (roomCode-keyed history)
- Anonymous stat claiming matching algorithm details
- Profile card OG route design (new route vs new variant parameter)
- SVG avatar layer composition architecture (CSS custom properties vs fill/stroke attributes)
- A2HS banner placement and trigger logic

### Deferred Ideas (OUT OF SCOPE)
- Spectator mode (REQ-009) — separate phase
- Ramadan Mode (REQ-010) — separate phase
- User-Generated Question Packs (REQ-011) — separate phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AC-007-1 | Valid manifest.json: name "شعللها", display "standalone", theme_color, icons 192×192 + 512×512 | Next.js `app/manifest.ts` using `MetadataRoute.Manifest` — built-in App Router support, no extra package |
| AC-007-2 | Service worker registered on first load; caches static assets + question API | @serwist/next `withSerwist` wrapper + `app/sw.ts`; `defaultCache` covers static assets |
| AC-007-3 | On `game_starting`, pre-fetch and cache full question payload | Custom runtime cache rule in sw.ts with `cache-first` strategy for `/api/questions/*`; dispatch fetch from socket handler |
| AC-007-4 | A2HS banner on host post-first-game screen; dismissable, 7-day cooldown | `beforeinstallprompt` event + localStorage cooldown flag; custom banner component |
| AC-007-5 | iOS Safari manual install guide (Share → Add to Home Screen) | iOS UA detection (`/iPhone|iPad|iPod/.test(navigator.userAgent)`), custom JSX guide component |
| AC-007-6 | Lighthouse PWA score >= 90 | Correct manifest + SW registration + HTTPS + icons = 90+ automatically |
| AC-007-7 | Socket reconnect overlay "جاري إعادة الاتصال..." + questions from cache | Existing `DisconnectBanner` component + SW cache-first serving question data |
| AC-008-1 | Avatar Builder step: 3 face shapes, 4 headwear, 5 color palettes | `AvatarBuilder` component with SVG layers; 3-step wizard within join flow `form` phase |
| AC-008-2 | Avatar config stored in localStorage `shallelha_avatar` | `useEffect` read/write on mount and config change |
| AC-008-3 | Avatar data via `player:join` socket event → Redis room player object | Add `avatarConfig` to `room:join` payload in PlayerJoin.tsx; add `avatarConfig` to `Player` interface in room.ts |
| AC-008-4 | Host lobby + in-game player indicators display avatars | `PlayerAvatar` SVG component consumed by host lobby player list and in-game indicators |
| AC-008-5 | Final podium animation uses player avatars | Podium component receives avatar config from game result state |
| AC-008-6 | Avatar builder adds <= 15 seconds to join flow | Pre-load all SVG parts inline (no network fetches); single-step UI with clear CTAs |
| AC-008-7 | Avatars as CSS/SVG, no raster | All avatar parts are inline SVG `<path>` elements — zero image files |
</phase_requirements>

---

## Summary

Phase 12 has four distinct technical domains that must be integrated carefully: (1) PWA infrastructure using `@serwist/next` as the App Router-compatible service worker solution, (2) a composable SVG avatar system with Gulf-themed layers, (3) leaderboard aggregation in PostgreSQL with Prisma, and (4) schema migrations to support structured avatar data.

The PWA domain is the most well-defined. Next.js 14 App Router has native manifest support via `app/manifest.ts`. `@serwist/next@9.5.7` (the `next-pwa` successor) provides the `withSerwist` config wrapper and a TypeScript-typed service worker entry point. The iOS A2HS limitation (no `beforeinstallprompt`) requires a separate manual guide component detecting iOS UA.

The avatar system requires a **Prisma schema migration** to add a `avatarConfig Json?` column to both `User` and `PlayerGameResult`, and a `avatarConfig` field to the Redis `Player` interface. The SVG composable architecture uses stacked `<g>` groups with color controlled via CSS custom properties or direct `fill` attributes driven by the palette index. All SVG parts must be inlined (no external file fetches) to meet the 15-second join flow constraint.

The leaderboard architecture should use Prisma `$queryRaw` for weekly/all-time aggregation queries on `PlayerGameResult` rather than PostgreSQL materialized views — Prisma v6's view support is still maturing and adds operational complexity. For a game at this scale, a raw aggregation query with proper indexes on `(userId, createdAt, isWinner)` is sufficient. A `node-cron` job on the server refreshing a denormalized summary table is the recommended approach for all-time rankings.

**Primary recommendation:** Ship PWA + Avatar first (they are player-facing and self-contained), then leaderboard + profile card (they depend on accumulated game data).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @serwist/next | 9.5.7 | Service worker integration for Next.js App Router | Official successor to next-pwa; App Router-compatible; maintained |
| serwist | 9.5.7 | Service worker runtime (precaching, runtime caching) | Peer of @serwist/next; provides `Serwist` class and `defaultCache` |
| next (built-in) | 14.2.35 | `app/manifest.ts` for PWA manifest | No extra package; MetadataRoute.Manifest is the App Router idiomatic way |
| @vercel/og (via next/og) | bundled with next | Profile card OG image generation | Already in use at /api/og/result; edge runtime; existing Cairo font loading pattern |
| Prisma | ^6 (existing) | Schema migration for avatarConfig field | Already installed; `prisma migrate dev` for new Json field |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-cron | ^3.0.x | Schedule leaderboard aggregation refresh | Only for all-time leaderboard if raw query is too slow at scale |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @serwist/next | next-pwa | next-pwa is deprecated, broken with App Router — DO NOT USE |
| app/manifest.ts (built-in) | /public/manifest.json static file | Static file approach works but bypasses RSC metadata conventions; Next.js docs recommend app/manifest.ts |
| Prisma $queryRaw for leaderboard | PostgreSQL materialized view | Materialized views add migration complexity; Prisma v6 view support still in preview; $queryRaw is simpler for this scale |
| Inline SVG layers | SVG file sprites | External SVG fetches would violate the 15-second join flow constraint |

**Installation (new packages only):**
```bash
cd apps/web && npm install @serwist/next && npm install -D serwist
```

**Version verification:** [VERIFIED: npm registry] — `@serwist/next@9.5.7` and `serwist@9.5.7` confirmed current as of research date.

---

## Architecture Patterns

### Recommended Project Structure (new files)
```
apps/web/
├── app/
│   ├── manifest.ts              # PWA manifest — MetadataRoute.Manifest
│   ├── sw.ts                    # Service worker entry point (@serwist/next)
│   ├── leaderboard/
│   │   └── page.tsx             # Global leaderboard RSC
│   ├── api/
│   │   └── og/
│   │       └── profile/
│   │           └── route.tsx    # Profile card OG image (new route)
│   └── profile/
│       ├── actions.ts           # Extended: add avatarConfig field
│       └── ProfileClient.tsx    # Extended: replace EmojiPicker with AvatarBuilder
├── components/
│   └── avatar/
│       ├── AvatarBuilder.tsx    # SVG builder wizard (3 steps)
│       ├── PlayerAvatar.tsx     # Render-only SVG component
│       └── avatar-parts.ts     # Inline SVG path data for all parts
├── public/
│   └── icons/
│       ├── icon-192.png         # Required for PWA manifest
│       └── icon-512.png         # Required for PWA manifest
└── next.config.mjs              # Wrapped with withSerwist

apps/server/src/
└── room/
    └── room.ts                  # Player interface: add avatarConfig field
```

### Pattern 1: Next.js App Router PWA Manifest

**What:** Use `app/manifest.ts` exporting a `MetadataRoute.Manifest` object. Next.js serves it at `/manifest.webmanifest` automatically.
**When to use:** All App Router projects — this is the idiomatic App Router approach.
**Example:**
```typescript
// Source: nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'شعللها',
    short_name: 'شعللها',
    description: 'لعبة الأسئلة والتسلية العربية',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### Pattern 2: @serwist/next Service Worker Setup

**What:** Wrap `next.config.mjs` with `withSerwist`; create `app/sw.ts` as the SW entry.
**When to use:** Required for PWA with App Router.
**Example:**
```typescript
// Source: serwist.pages.dev/docs/next/getting-started
// next.config.mjs
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist({
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }],
  },
})
```

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: /^https:\/\/.*\/api\/questions\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'questions-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
      },
    },
  ],
})

serwist.addEventListeners()
```

### Pattern 3: SVG Composable Avatar

**What:** Stack multiple SVG `<g>` groups: base circle (face color), face shape path, headwear path. Color is controlled by Tailwind/CSS variables or inline `fill` attributes.
**When to use:** REQ-008 avatar system — must be CSS/SVG only, no raster.
**Avatar config data model:**
```typescript
// Source: REQUIREMENTS.md REQ-008 Technical Requirements
interface AvatarConfig {
  faceShape: 1 | 2 | 3           // 3 options
  headwear: 'ghutra' | 'hijab' | 'cap' | 'none'  // 4 options
  colorPalette: 1 | 2 | 3 | 4 | 5  // 5 skin/accent color pairs
}

// Palette map (ASSUMED — colors should match Gulf-appropriate tones)
const PALETTES: Record<number, { skin: string; accent: string }> = {
  1: { skin: '#F5CBA7', accent: '#7c3aed' }, // light warm + purple
  2: { skin: '#D4A076', accent: '#2563eb' }, // medium + blue
  3: { skin: '#A0522D', accent: '#16a34a' }, // deep warm + green
  4: { skin: '#8B6914', accent: '#dc2626' }, // golden + red
  5: { skin: '#4A3728', accent: '#F59E0B' }, // deep brown + gold
}
```

**PlayerAvatar render component (skeleton):**
```tsx
// components/avatar/PlayerAvatar.tsx
interface PlayerAvatarProps {
  config: AvatarConfig
  size?: number
}

export function PlayerAvatar({ config, size = 64 }: PlayerAvatarProps) {
  const palette = PALETTES[config.colorPalette]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Layer 1: face base */}
      <circle cx="32" cy="32" r="28" fill={palette.skin} />
      {/* Layer 2: face shape details — path from avatar-parts.ts */}
      <g fill={palette.skin}>{FACE_SHAPES[config.faceShape]}</g>
      {/* Layer 3: headwear */}
      {config.headwear !== 'none' && (
        <g fill={palette.accent}>{HEADWEAR_PATHS[config.headwear]}</g>
      )}
    </svg>
  )
}
```

### Pattern 4: Prisma Schema Migration for avatarConfig

**What:** Add `avatarConfig Json?` to `User` and `PlayerGameResult`. Keep `avatarEmoji` for backward compatibility.
**When to use:** Required before any avatar feature can be saved.
```prisma
model User {
  // ... existing fields ...
  avatarEmoji    String?   @db.VarChar(10)   // keep for backward compat
  avatarConfig   Json?                        // new: { faceShape, headwear, colorPalette }
}

model PlayerGameResult {
  // ... existing fields ...
  playerEmoji    String?   // keep for backward compat
  avatarConfig   Json?     // new: snapshot of avatar at game time
}
```

### Pattern 5: Leaderboard Aggregation with $queryRaw

**What:** Use Prisma `$queryRaw` for weekly/all-time rank queries. Index `(userId, createdAt)` and `(isWinner, createdAt)` on PlayerGameResult.
**When to use:** For any leaderboard query that Prisma's type-safe client cannot express in a single query.
**Example:**
```typescript
// Source: prisma.io/docs/orm/prisma-client/using-raw-sql
// Weekly leaderboard — top 50 by win count in last 7 days
const weeklyLeaderboard = await prisma.$queryRaw<
  { userId: string; displayName: string; winCount: bigint; gamesPlayed: bigint }[]
>`
  SELECT
    u.id AS "userId",
    COALESCE(u."displayName", u.name) AS "displayName",
    COUNT(*) FILTER (WHERE pgr."isWinner" = true) AS "winCount",
    COUNT(*) AS "gamesPlayed"
  FROM "PlayerGameResult" pgr
  JOIN "User" u ON u.id = pgr."userId"
  WHERE pgr."createdAt" >= NOW() - INTERVAL '7 days'
  GROUP BY u.id, u."displayName", u.name
  ORDER BY "winCount" DESC, "gamesPlayed" DESC
  LIMIT 50
`
```

**Required index migrations:**
```sql
CREATE INDEX IF NOT EXISTS idx_pgr_user_created ON "PlayerGameResult"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_pgr_winner_created ON "PlayerGameResult"("isWinner", "createdAt");
```

### Pattern 6: Anonymous Stat Claiming

**What:** When an anonymous player signs in after playing, match their `PlayerGameResult` rows by `playerName + createdAt` proximity to a known anonymous guest user ID, then re-link to the new authenticated userId.
**When to use:** Post-sign-in callback flow in NextAuth.
**Approach:** Phase 11 saves `PlayerGameResult` with a `userId` pointing to a "guest" User record. On sign-in, a Server Action compares `playerName` against the new user's name and `createdAt` within a time window.

```typescript
// Sketch — anonymous claiming Server Action
// Source: [ASSUMED] — pattern based on common auth migration patterns
export async function claimAnonymousStats(guestUserId: string, authenticatedUserId: string) {
  // Match results where guestUserId was the placeholder
  await prisma.playerGameResult.updateMany({
    where: { userId: guestUserId },
    data: { userId: authenticatedUserId },
  })
  // Merge stats
  const guestUser = await prisma.user.findUnique({ where: { id: guestUserId } })
  if (!guestUser) return
  await prisma.user.update({
    where: { id: authenticatedUserId },
    data: {
      totalGamesPlayed: { increment: guestUser.totalGamesPlayed },
      winCount: { increment: guestUser.winCount },
    },
  })
}
```

**NOTE:** The current schema has `PlayerGameResult.userId` as a non-nullable FK — anonymous players must either use a real guest User record, or the schema needs a nullable `userId`. This is a **schema design decision** for the planner. [ASSUMED]

### Pattern 7: iOS A2HS Detection

**What:** iOS Safari does not fire `beforeinstallprompt`. Detect iOS and show manual guide.
**When to use:** A2HS prompt component.
```typescript
// Detect iOS Safari — no install prompt exists
const isIOS = typeof window !== 'undefined' &&
  /iPhone|iPad|iPod/.test(window.navigator.userAgent) &&
  !('MSStream' in window)
const isStandalone = typeof window !== 'undefined' &&
  ('standalone' in window.navigator) &&
  (window.navigator as { standalone?: boolean }).standalone === true
```

### Anti-Patterns to Avoid
- **Using next-pwa:** Unmaintained, fails with App Router. Use @serwist/next.
- **Static /public/manifest.json:** Works but bypasses App Router metadata conventions. Use app/manifest.ts.
- **Raster avatar images:** Violates REQ-008 and adds network latency to join flow. All avatar parts must be inline SVG.
- **Complex materialized views in Prisma:** Prisma v6 view support is still maturing; adds migration/refresh complexity for marginal gain at this scale.
- **Storing avatarConfig as a stringified JSON column (Text):** Use Prisma's native `Json` type so Prisma can type-check queries and PostgreSQL can index JSONB paths.
- **Blocking the join socket emit on avatar asset loading:** Load all SVG parts inline at bundle time so no network round-trip occurs during the AvatarBuilder step.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker precaching | Custom SW fetch/cache logic | @serwist/next `defaultCache` + Serwist runtime | Cache invalidation, versioning, and stale-while-revalidate logic have dozens of edge cases |
| PWA manifest | Manual JSON file | Next.js `app/manifest.ts` | App Router caches, versioning, and CSP headers are handled automatically |
| OG image generation | Canvas API on server, headless browser | @vercel/og `ImageResponse` | Already in use; edge-optimized; Cairo font loading already solved |
| Leaderboard rank window | Manual rank calculation in JS | PostgreSQL `RANK() OVER (ORDER BY ...)` window function | Correctness with ties, performance |
| Avatar color theming | Separate SVG file per color combination | CSS custom properties or inline fill attributes | 5 palettes × 3 faces × 4 headwear = 60 files vs 1 component |

**Key insight:** The existing `/api/og/result` route already demonstrates the Cairo font loading pattern for @vercel/og. Profile card implementation should extend (or parallel) this pattern — do not duplicate the font fetch logic.

---

## Common Pitfalls

### Pitfall 1: Service Worker Not Updating in Dev
**What goes wrong:** `public/sw.js` is stale because @serwist/next caches aggressively. Dev reloads don't pick up changes.
**Why it happens:** Service workers have their own update lifecycle; `skipWaiting: true` helps in production but dev tooling can be confusing.
**How to avoid:** Set `disable: process.env.NODE_ENV === 'development'` in `withSerwistInit` options. Test SW behavior in production build only.
**Warning signs:** Changes to question caching behavior seem to have no effect.

### Pitfall 2: iOS Safari PWA Limitations
**What goes wrong:** `beforeinstallprompt` event never fires on iOS. A2HS prompt component shows nothing.
**Why it happens:** Apple does not implement the Web App Install prompt spec.
**How to avoid:** Separate code paths: `isIOS` shows manual guide; non-iOS uses `beforeinstallprompt` event listener.
**Warning signs:** A2HS works on Android/Chrome but is invisible on iPhone.

### Pitfall 3: avatarConfig Json Null Handling
**What goes wrong:** Existing players (pre-Phase 12) have `avatarConfig: null`. Components expecting a non-null config crash.
**Why it happens:** Prisma `Json?` fields are nullable. Legacy records have no avatar config.
**How to avoid:** Always provide a `DEFAULT_AVATAR_CONFIG` fallback constant. Use `user.avatarConfig ?? DEFAULT_AVATAR_CONFIG` throughout.
**Warning signs:** PlayerAvatar crashes in production for players who joined before Phase 12.

### Pitfall 4: Socket Payload Breaking Change
**What goes wrong:** Adding `avatarConfig` to `room:join` breaks older clients (browser tabs still open from pre-Phase 12 deployment).
**Why it happens:** Socket event shape changed; server's Player interface expects the new field.
**How to avoid:** Make `avatarConfig` optional in the Player interface (`avatarConfig?: AvatarConfig`). Server falls back to null if field absent.
**Warning signs:** Players on stale browser tabs can't join lobby.

### Pitfall 5: OG Image Cairo Font Fetch Latency
**What goes wrong:** Profile card OG route times out or is slow because Cairo font is fetched from Google Fonts CDN on every request.
**Why it happens:** Edge function cold starts + external font fetch = 500–1500ms latency. The existing `/api/og/result` has the same issue.
**How to avoid:** Cache the font `ArrayBuffer` in a module-level variable so it's only fetched once per edge function instance. Pattern:
```typescript
let cairoFont: ArrayBuffer | null = null
async function getCairoFont() {
  if (!cairoFont) {
    cairoFont = await fetch('https://fonts.gstatic.com/...').then(r => r.arrayBuffer())
  }
  return cairoFont
}
```
**Warning signs:** `/api/og/profile` has P95 latency > 2 seconds.

### Pitfall 6: Leaderboard Query N+1
**What goes wrong:** Fetching top-50 users then making 50 separate queries for their stats.
**Why it happens:** Naive Prisma `findMany` with relation includes can trigger N+1.
**How to avoid:** Use the `$queryRaw` aggregation pattern (see Pattern 5) — single query returns all needed data.
**Warning signs:** `/leaderboard` API handler makes > 2 DB queries.

### Pitfall 7: PlayerGameResult.userId Nullability for Anonymous Players
**What goes wrong:** Anonymous players cannot have a `PlayerGameResult` record because `userId` is a non-nullable FK referencing `User`.
**Why it happens:** Current schema design assumes all players are authenticated.
**How to avoid:** Two options — (A) create a guest `User` record per anonymous session and link to it; (B) make `userId` nullable. Option A is safer (preserves FK integrity). The planner must decide.
**Warning signs:** `saveGameHistory` crashes for anonymous players, or anonymous game results are silently dropped.

---

## Code Examples

### AvatarBuilder Step Integration in PlayerJoin.tsx
```tsx
// Source: REQUIREMENTS.md AC-008-1, AC-008-2 + [ASSUMED] implementation sketch
const AVATAR_STORAGE_KEY = 'shallelha_avatar'

function AvatarBuilderStep({ onConfirm }: { onConfirm: (config: AvatarConfig) => void }) {
  const [config, setConfig] = useState<AvatarConfig>(() => {
    try {
      const stored = localStorage.getItem(AVATAR_STORAGE_KEY)
      return stored ? JSON.parse(stored) : { faceShape: 1, headwear: 'none', colorPalette: 1 }
    } catch { return { faceShape: 1, headwear: 'none', colorPalette: 1 } }
  })

  function handleConfirm() {
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config))
    onConfirm(config)
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-6">
      <PlayerAvatar config={config} size={96} />
      {/* Face shape selector */}
      {/* Headwear selector */}
      {/* Color palette selector */}
      <button onClick={handleConfirm}>تأكيد</button>
    </div>
  )
}
```

### room:join Payload Extension
```typescript
// Source: apps/server/src/room/room.ts Player interface — needs avatarConfig added
// apps/web/app/join/[roomCode]/PlayerJoin.tsx — emit site
socket.emit('room:join', {
  roomCode,
  name,
  emoji,           // keep for backward compat
  avatarConfig,    // new field — AvatarConfig | null
})
```

### Profile Card OG Route
```typescript
// Source: Existing pattern at apps/web/app/api/og/result/route.tsx
// New route: apps/web/app/api/og/profile/route.tsx
import { ImageResponse } from 'next/og'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const displayName = searchParams.get('name') ?? 'لاعب'
  const gamesPlayed = searchParams.get('games') ?? '0'
  const wins = searchParams.get('wins') ?? '0'

  const cairoFont = await getCairoFont() // module-level cached fetch

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', direction: 'rtl',
        background: 'linear-gradient(135deg, #0a0a0f, #1a0a2e)',
        fontFamily: 'Cairo, sans-serif', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 32 }}>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', display: 'flex' }}>شعللها 🎮</div>
        <div style={{ fontSize: 48, color: '#a78bfa', display: 'flex' }}>{displayName}</div>
        <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
          {`لعبت ${gamesPlayed} مرة وفزت ${wins} مرات`}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: 'Cairo', data: cairoFont, weight: 700 }] }
  )
}
```

---

## Runtime State Inventory

> Phase 12 adds new fields to existing data structures — inventory of state that must be migrated or updated.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | PostgreSQL `User` table: `avatarEmoji` only, no `avatarConfig`. `PlayerGameResult`: `playerEmoji` only. | Schema migration: add `avatarConfig Json?` to both models via `prisma migrate dev` |
| Stored data | PostgreSQL `PlayerGameResult.userId` is non-nullable FK. No guest User records exist. | Schema decision required (see Pitfall 7): either make nullable OR create guest Users in saveGameHistory |
| Live service config | Redis Player objects: `{ id, name, emoji, socketId }` — no avatarConfig | Code change in room.ts Player interface + all Redis read/write paths |
| OS-registered state | None — verified: no cron jobs, no pm2 processes specific to leaderboard | None |
| Secrets/env vars | No new env vars required for Phase 12 features | None |
| Build artifacts | `public/sw.js` will be generated by @serwist/next at build time — not currently present | Auto-generated on `next build`; add to .gitignore |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa | @serwist/next | 2023 (next-pwa abandoned) | Must use @serwist/next; next-pwa fails with App Router |
| /public/manifest.json | app/manifest.ts (MetadataRoute.Manifest) | Next.js 13.3+ | App Router idiomatic; handles caching/versioning automatically |
| next/server ImageResponse | next/og ImageResponse | Next.js 14.0 | Import from `next/og`, not `next/server` — already correct in codebase |

**Deprecated/outdated:**
- `next-pwa`: Archived/unmaintained. Incompatible with App Router parallel/intercepting routes. DO NOT USE.
- Emoji-only avatars (`avatarEmoji VarChar(10)`): Will be superseded by `avatarConfig Json` in Phase 12. Keep field for backward compatibility.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Color palette values (skin tones + accents) suitable for Gulf context | Code Examples — AvatarBuilder | Low risk — visual only; Hammam (ui-ux-pro-max) should review palette choices |
| A2 | Anonymous stat claiming via `updateMany` by guestUserId is sufficient | Pattern 6 | Medium risk — if guest User creation isn't already in saveGameHistory, anonymous results may be lost |
| A3 | Module-level font cache pattern works across edge function invocations | Pitfall 5 | Low risk — standard Vercel edge function optimization pattern |
| A4 | `PlayerGameResult.userId` nullable change is safe given cascade deletes are already in place | Runtime State Inventory | Medium risk — changing FK nullability is a breaking migration; test on staging |

---

## Open Questions (RESOLVED)

1. **Are anonymous players currently saved to PlayerGameResult?**
   - What we know: `saveGameHistory` in game.ts calls `prisma.playerGameResult.create` with `userId`. Non-authenticated players have no userId.
   - What's unclear: Does Phase 11's saveGameHistory skip anonymous players, or does it fail silently?
   - Recommendation: Read saveGameHistory in full; if anonymous players are currently skipped, Phase 12's "join with profile" stat claiming feature needs a guest User creation step added to saveGameHistory first.
   - **RESOLVED:** Plan 12-06 updates saveGameHistory to save ALL players — anonymous players get `userId: null` in PlayerGameResult. This is enabled by the 12-01 schema migration making `userId` nullable (String?).

2. **Which socket event name is canonical for join — `room:join` or `player:join`?**
   - What we know: CONTEXT.md says "transmitted via `player:join`" but PlayerJoin.tsx emits `room:join`. REQUIREMENTS.md AC-008-3 says `player:join`.
   - What's unclear: Was `room:join` renamed to `player:join` in REQUIREMENTS.md as a design decision, or is it a documentation error?
   - Recommendation: Check server-side socket handler. Keep existing `room:join` event name to avoid breaking change; add avatarConfig to that payload.
   - **RESOLVED:** Plan 12-03 keeps the existing `room:join` event name (no breaking change) and adds `avatarConfig` to its payload. The REQUIREMENTS.md reference to `player:join` is a documentation error.

3. **App icon assets for PWA manifest — generate from existing brand assets or create new?**
   - What we know: No icons exist in `public/`. Manifest requires 192×192 and 512×512 PNGs.
   - What's unclear: Is there a Cloudinary-hosted brand logo that can be resized?
   - Recommendation: Generate both sizes from a single source SVG (the "شعللها" wordmark or game controller icon) using sharp or imagemagick in a build script.
   - **RESOLVED:** Plan 12-02 generates both icon sizes at build time using sharp with a purple gradient + "ش" letter. Icons are committed to `public/icons/`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | @serwist/next build | Assumed ✓ | — | — |
| PostgreSQL | Leaderboard queries, schema migration | ✓ (existing) | — | — |
| Redis | Player avatarConfig in room state | ✓ (existing) | — | — |
| Vercel (deployment) | PWA manifest serving, OG edge function | ✓ (existing) | — | — |
| @serwist/next | PWA service worker | Not yet installed | 9.5.7 (current) | — |
| serwist (dev) | Service worker types | Not yet installed | 9.5.7 (current) | — |
| PWA icons (192, 512) | AC-007-1 manifest | Not present | — | Must be generated in Wave 0 |

**Missing dependencies with no fallback:**
- PWA icon PNGs at `/public/icons/icon-192.png` and `/public/icons/icon-512.png` — must be created before manifest can pass Lighthouse audit

**Missing dependencies with fallback:**
- @serwist/next + serwist — installed via `npm install` in Wave 0

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (assumed from project pattern) [ASSUMED] |
| Config file | `apps/web/vitest.config.ts` (check — may not exist) |
| Quick run command | `cd apps/web && npx vitest run --reporter=verbose` |
| Full suite command | `cd apps/web && npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AC-007-1 | manifest.ts exports correct shape | unit | `npx vitest run tests/pwa/manifest.test.ts` | Wave 0 |
| AC-007-2 | Service worker registered on load | manual/lighthouse | Lighthouse CLI audit | — |
| AC-007-3 | Question pre-cache on game_starting | integration | `npx vitest run tests/pwa/precache.test.ts` | Wave 0 |
| AC-008-1 | AvatarBuilder renders all options | unit | `npx vitest run tests/avatar/AvatarBuilder.test.tsx` | Wave 0 |
| AC-008-2 | localStorage read/write on mount | unit | `npx vitest run tests/avatar/storage.test.ts` | Wave 0 |
| AC-008-3 | avatarConfig in socket payload | integration | `npx vitest run tests/socket/join.test.ts` | Wave 0 |
| REQ-008 | PlayerAvatar renders all configs | unit | `npx vitest run tests/avatar/PlayerAvatar.test.tsx` | Wave 0 |
| Leaderboard | $queryRaw returns correct rankings | integration | `npx vitest run tests/leaderboard/queries.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/web && npx vitest run --reporter=verbose`
- **Per wave merge:** Full suite across both apps
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/web/tests/pwa/manifest.test.ts` — covers AC-007-1
- [ ] `apps/web/tests/avatar/AvatarBuilder.test.tsx` — covers AC-008-1, AC-008-2
- [ ] `apps/web/tests/avatar/PlayerAvatar.test.tsx` — covers AC-008-7
- [ ] `apps/web/tests/leaderboard/queries.test.ts` — covers leaderboard correctness
- [ ] Vitest config — verify `apps/web/vitest.config.ts` exists; create if absent

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth v5 beta.30 (existing); guard profile/leaderboard routes with `auth()` RSC call |
| V3 Session Management | partial | NextAuth JWT sessions (existing); `update()` after profile edit already in ProfileClient.tsx |
| V4 Access Control | yes | Server Actions must re-check `session.user.id` before any write (already done in existing updateProfile) |
| V5 Input Validation | yes | displayName: trim + slice(0, 30) (existing); avatarConfig: validate faceShape/headwear/colorPalette enum values on server |
| V6 Cryptography | no | No custom crypto needed |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Profile update IDOR (user A updates user B) | Tampering | Server Action must re-read `session.user.id` from `auth()` — never trust client-provided userId |
| OG route parameter injection | Tampering | Sanitize `name`/`games`/`wins` URL params — slice + encode before rendering in ImageResponse |
| avatarConfig deserialization | Tampering | Validate against AvatarConfig interface schema on server before writing to DB; reject unknown keys |
| Anonymous stat claiming replay | Spoofing | Require authenticated session before claimAnonymousStats; validate guestUserId belongs to same playerName + time window |
| Service worker cache poisoning | Information Disclosure | SW serves only same-origin responses; no external cache directives needed |

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` apply to all Phase 12 execution:

- **All 5 skills must be invoked:** `next-best-practices`, `nodejs-backend-patterns`, `senior-devops`, `ui-ux-pro-max`, `webapp-testing` — before and after their respective work domains.
- **Post-wave feedback report required** after every execution wave.
- **Never use ts-node for Docker startup scripts** — not applicable to Phase 12 (no new Docker scripts), but keep in mind for any server startup changes.
- **UI/UX decisions auto-route to Hammam** — Avatar builder UI/UX, leaderboard layout, and profile card design must go through `ui-ux-pro-max` skill before implementation.
- **Omar evaluates at end of every wave/phase** — OMAR-FEEDBACK.md must be written before advancing.
- **E2E tests must pass before handing off deployment** — run Playwright/Vitest against staging before marking phase complete.
- **find-skills before planning** — already done (skills are in `.agents/skills/`).

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — `@serwist/next@9.5.7`, `serwist@9.5.7` — current as of 2026-04-21
- [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest] — MetadataRoute.Manifest App Router pattern
- [CITED: nextjs.org/docs/app/api-reference/functions/image-response] — ImageResponse parameters, supported CSS, font loading
- [CITED: serwist.pages.dev/docs/next/getting-started] — @serwist/next withSerwist config, app/sw.ts pattern
- [VERIFIED: codebase grep] — Existing OG route at `apps/web/app/api/og/result/route.tsx` — Cairo font loading pattern confirmed
- [VERIFIED: codebase read] — `apps/web/prisma/schema.prisma` — no avatarConfig field, avatarEmoji VarChar(10) only
- [VERIFIED: codebase read] — `apps/server/src/room/room.ts` — Player interface has no avatarConfig
- [VERIFIED: codebase read] — `apps/web/next.config.mjs` — no PWA plugin present; minimal config
- [VERIFIED: codebase read] — `apps/web/public/` — only robots.txt; no icons, no manifest.json

### Secondary (MEDIUM confidence)
- [CITED: prisma.io/docs/orm/prisma-schema/data-model/views] — Prisma view support status (preview, not GA)
- [CITED: prisma.io — $queryRaw] — Raw SQL aggregation pattern with Prisma

### Tertiary (LOW confidence / ASSUMED)
- Avatar color palette values — ASSUMED based on Gulf skin tone appropriateness; needs Hammam review
- Vitest as test framework — ASSUMED from project stack; verify `vitest.config.ts` exists
- Guest User approach for anonymous players — ASSUMED; requires reading full saveGameHistory implementation

---

## Metadata

**Confidence breakdown:**
- PWA stack (@serwist/next, manifest.ts): HIGH — verified via npm registry + official docs
- Avatar SVG architecture: MEDIUM — pattern is well-established; specific SVG paths are [ASSUMED]
- Leaderboard $queryRaw: MEDIUM — Prisma docs confirm capability; query shape is [ASSUMED]
- Anonymous stat claiming: MEDIUM — pattern is logical but saveGameHistory behavior for anonymous users unconfirmed
- OG profile card: HIGH — existing pattern in codebase is directly extensible

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable libraries; serwist version may update)
