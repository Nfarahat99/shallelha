# Phase 7: Admin Dashboard & Content Management — Research

**Researched:** 2026-04-11
**Domain:** Next.js App Router admin dashboard, Express REST API, Prisma schema migration, Cloudinary upload, analytics
**Confidence:** HIGH

---

## Summary

Phase 7 builds a password-protected admin dashboard inside the existing Next.js 14 App Router frontend, with supporting REST API routes on the Express backend. The dashboard enables full CRUD for Categories and Questions, a Draft → Approved → Live approval workflow, Cloudinary image/audio upload, and basic per-question analytics. The phase also replaces the current thin seed script (3 categories, ~30 questions) with 200+ Arabic questions across 6 categories.

The existing Prisma schema already has `QuestionStatus` (`draft | approved | live`) and `QuestionType` (`MULTIPLE_CHOICE | MEDIA_GUESSING | FREE_TEXT`). The schema needs three additions: an `archived` flag on `Category`, two analytics counters (`timesPlayed`, `timesAnsweredWrong`) on `Question`, and a migration to add them. No structural rewrites needed.

The admin protection strategy is simple password comparison via an env var (`ADMIN_PASSWORD`), stored in a signed HTTP-only cookie by a Next.js Route Handler — this matches the "simple admin route protection, not full auth" constraint and avoids pulling in NextAuth for an internal-only tool.

**Primary recommendation:** Put admin UI entirely in Next.js (App Router route group `(admin)`, Server Components + Server Actions for reads/writes, one Route Handler for Cloudinary uploads). Express only needs new REST routes for analytics writes (question:played, question:wrong) that game.ts calls at reveal time.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-01 | Admin can create, read, update, and delete question categories | Category CRUD via Prisma in Next.js Server Actions; archived soft-delete pattern |
| ADMIN-02 | Admin can create, read, update, and delete questions (text, image, audio) | Question CRUD via Server Actions; Cloudinary upload via Route Handler + `next-cloudinary` or raw SDK |
| ADMIN-03 | Questions have a draft → approved → live workflow | `QuestionStatus` enum already in schema; approval action flips status field |
| ADMIN-04 | Admin dashboard shows basic analytics: questions played, wrong answer rates | Two new Int columns (`timesPlayed`, `timesAnsweredWrong`) on Question; game.ts increments at reveal |
| ADMIN-05 | Minimum 200 approved questions across 6 categories available at launch | Expand existing seed script; idempotent upserts by question text |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 14.2.35 (already installed) | Admin pages, Server Actions, Route Handlers | Already in project |
| Prisma | 6.x (already installed) | DB reads/writes in Server Actions | Already in project |
| Tailwind CSS | 3.4.x (already installed) | Styling admin UI | Already in project |
| cloudinary (Node SDK) | 2.9.0 [VERIFIED: npm registry] | Server-side Cloudinary upload in Route Handler | Official SDK; multer is not needed — Cloudinary SDK accepts Buffer directly |
| zod | 4.3.6 [VERIFIED: npm registry] | Input validation in Server Actions and Route Handlers | Already pattern in project's backend skill |
| bcryptjs | 3.0.3 [VERIFIED: npm registry] | NOT needed — password comparison is plain string check against env var | Simple admin protection requires no hashing |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/multer | 2.1.0 [VERIFIED: npm registry] | Type support if multer used for upload streaming | Only if not using Cloudinary SDK stream — prefer SDK |
| express-rate-limit | 8.3.2 [VERIFIED: npm registry] | Rate-limit admin API endpoints on Express | Admin endpoints on Express server only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudinary Node SDK (server upload) | next-cloudinary (client-side widget) | next-cloudinary 6.17.5 adds a client-side upload widget; fine for interactive UX but adds JS bundle. Server-side SDK keeps secrets off client — preferred for admin |
| Plain password env var check | NextAuth admin role | Project spec says "simple admin route protection, not full auth" — NextAuth overhead not justified |
| Server Actions for CRUD | Separate Express admin REST routes | Server Actions co-locate form logic with UI, type-safe, no CORS config — preferred for Next.js App Router |
| Analytics in PostgreSQL | Analytics in Redis | Persistent counters belong in the DB, not Redis ephemeral store |

**Installation (apps/web — Cloudinary SDK for server-side uploads):**
```bash
cd apps/web && npm install cloudinary
```

**Installation (apps/server — analytics endpoint + rate-limit if needed):**
```bash
cd apps/server && npm install express-rate-limit zod
```

**Version verification:** Confirmed via npm registry 2026-04-11.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/app/
├── (admin)/                      # Route group — no layout shared with public
│   ├── layout.tsx                # Admin shell: sidebar nav, logout button
│   ├── admin/
│   │   ├── page.tsx              # Dashboard overview: stats summary
│   │   ├── categories/
│   │   │   ├── page.tsx          # Category list (Server Component)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Edit category
│   │   ├── questions/
│   │   │   ├── page.tsx          # Question list with filters (status, category)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Edit/approve question
│   │   └── new-question/
│   │       └── page.tsx          # Create question form
│   └── admin-login/
│       └── page.tsx              # Password form
├── api/
│   ├── admin/
│   │   ├── login/route.ts        # POST — validate password, set cookie
│   │   ├── logout/route.ts       # POST — clear cookie
│   │   └── upload/route.ts       # POST — Cloudinary upload, return URL
│   └── auth/[...nextauth]/       # Existing NextAuth handler (unchanged)

apps/server/src/
├── routes/
│   ├── health.ts                 # Existing (unchanged)
│   └── admin.ts                  # NEW: POST /admin/analytics (question:played, question:wrong)
└── socket/
    └── game.ts                   # Existing — add prisma.question.update for analytics at reveal
```

### Pattern 1: Admin Route Protection (Middleware + Cookie)

**What:** Next.js middleware reads a signed cookie `admin_session` set by the login route handler. If missing, redirect to `/admin-login`.

**When to use:** For any request to `/admin/*` paths.

**Example:**
```typescript
// apps/web/middleware.ts (extend existing middleware)
// [ASSUMED] — pattern based on Next.js cookie middleware approach
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isAdminLogin = req.nextUrl.pathname === '/admin-login'

  if (isAdminRoute && !isAdminLogin) {
    const adminSession = req.cookies.get('admin_session')
    if (!adminSession || adminSession.value !== process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/admin-login', req.url))
    }
  }

  // Existing host route protection continues below...
  return NextResponse.next()
}

export const config = {
  matcher: ['/host/:path*', '/admin/:path*'],
}
```

**Login Route Handler:**
```typescript
// apps/web/app/api/admin/login/route.ts
// [ASSUMED] — standard Next.js Route Handler pattern
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', process.env.ADMIN_SESSION_TOKEN!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
```

### Pattern 2: Server Actions for CRUD

**What:** Next.js Server Actions called from Client Components handle Category/Question mutations. No separate API route needed for CRUD — actions run server-side with direct Prisma access.

**When to use:** All create/update/delete for Category and Question.

**Example:**
```typescript
// apps/web/app/(admin)/admin/questions/actions.ts
'use server'
// [ASSUMED] — standard Server Action pattern for Next.js 14 App Router
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ApproveSchema = z.object({ questionId: z.string().cuid() })

export async function approveQuestion(questionId: string) {
  ApproveSchema.parse({ questionId })
  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'approved' },
  })
  revalidatePath('/admin/questions')
}
```

### Pattern 3: Cloudinary Upload via Route Handler

**What:** Admin uploads image/audio via a Next.js Route Handler that receives a `multipart/form-data` request. The handler uses the Cloudinary Node SDK to upload, then returns the `secure_url`. The admin form stores this URL in the question's `mediaUrl` field.

**When to use:** Question create/edit form when admin attaches media.

**Example:**
```typescript
// apps/web/app/api/admin/upload/route.ts
// [ASSUMED] — Cloudinary SDK v2 upload_stream or upload pattern
import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'shallelha/questions', resource_type: 'auto' },
      (err, result) => err ? reject(err) : resolve(result as { secure_url: string }),
    ).end(buffer)
  })

  return NextResponse.json({ url: result.secure_url })
}
```

### Pattern 4: Analytics Increment at Reveal

**What:** When `question:revealed` fires in `game.ts`, increment `timesPlayed` and (if applicable) `timesAnsweredWrong` on the Question record in PostgreSQL.

**When to use:** Inside `handleReveal` and the score calculation for wrong answers.

**Example:**
```typescript
// Inside handleReveal in apps/server/src/socket/game.ts (additions)
// [ASSUMED] — Prisma update pattern
await prisma.question.update({
  where: { id: questionData.id },
  data: { timesPlayed: { increment: 1 } },
})

// After scoring — count wrong answers for this question
const wrongCount = Object.values(gameState.playerStates)
  .filter((s) => s.answeredCurrentQ && /* answered wrong */)
  .length
if (wrongCount > 0) {
  await prisma.question.update({
    where: { id: questionData.id },
    data: { timesAnsweredWrong: { increment: wrongCount } },
  })
}
```

### Pattern 5: Seed Script Expansion

**What:** Expand `apps/server/prisma/seed.ts` to 200+ questions across 6 categories. Use idempotent `upsert` per category (already done), and a per-question existence check (already pattern: `existingCount === 0` guard). The 6 categories should cover the required Arabic content areas.

**Six target categories (ASSUMED — reasonable defaults for Arabic trivia):**
1. ثقافة عامة (General Knowledge) — already exists
2. رياضة (Sports) — already exists
3. ترفيه (Entertainment) — already exists
4. جغرافيا (Geography) — new
5. تاريخ (History) — new
6. علوم وتكنولوجيا (Science & Technology) — new

**Target distribution:** ~34 questions per category = 204 total. Mix of MULTIPLE_CHOICE (80%), MEDIA_GUESSING (10%), FREE_TEXT (10%).

### Anti-Patterns to Avoid

- **Blocking Cloudinary upload on the game server:** The Express server handles real-time game traffic. Never add file upload logic there — keep it in the Next.js API route where it can scale independently on Vercel.
- **Using `status: 'live'` for games:** The game server (`game.ts`) queries `status: QuestionStatus.approved`. Do not change this filter. The `live` enum value is unused in the current game loop and may be used in a future "schedule questions" feature. Leave `approved` as the gate for gameplay.
- **Hard-coding admin password:** Must be env var `ADMIN_PASSWORD` — never in source.
- **Storing admin cookie value as a predictable string:** Use `ADMIN_SESSION_TOKEN` env var (a random 32-char hex string), not the password itself, as the cookie value.
- **Full page reloads after Server Action:** Use `revalidatePath()` in actions to bust the Next.js cache — this triggers RSC re-render without a full navigation.
- **Race conditions on analytics:** Prisma's `{ increment: N }` is an atomic operation — never read-then-write analytics counters.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload to Cloudinary | Custom base64 or fetch chain | `cloudinary.uploader.upload_stream` with Buffer | SDK handles retries, format validation, CDN delivery, transformation URLs |
| Input validation in Server Actions | Manual type checks | `zod` schema parse | Single source of truth; throws on invalid input before any DB write |
| Analytics counter increments | Read → add → write | Prisma `{ increment: N }` operator | Atomic at DB level; no TOCTOU race under concurrent reveals |
| RTL admin UI layout | Custom CSS direction hacks | Tailwind's `rtl:` prefix + `dir="rtl"` on admin layout | Already set up in project globals |
| Admin session management | JWT or session table | HTTP-only cookie with env var token | Overkill for internal admin tool; simple cookie is sufficient and auditable |

**Key insight:** The project already has Cloudinary configured in `next.config.mjs` (`remotePatterns: res.cloudinary.com`) — the upload pipeline just needs server-side credentials added to env vars.

---

## Runtime State Inventory

Step 2.5: SKIPPED — Phase 7 is a greenfield feature addition (new routes, new schema columns, expanded seed). No rename or migration of existing runtime state is involved. The seed script expansion is additive (new rows only), not a rename.

---

## Environment Availability Audit

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server + Next.js build | Already in use | 20.x | — |
| PostgreSQL (Railway) | Prisma migrations | Already deployed | 15.x | — |
| Cloudinary account | Image/audio upload | Not verified in env | — | Use placeholder URLs in dev; block upload in production without credentials |
| `ADMIN_PASSWORD` env var | Admin login | Not in `.env.example` | — | Must add before this phase executes |
| `ADMIN_SESSION_TOKEN` env var | Admin cookie value | Not in `.env.example` | — | Must add; generate with `openssl rand -hex 32` |
| `CLOUDINARY_CLOUD_NAME` env var | Upload route | Not in `.env.example` | — | Must add for upload to work |
| `CLOUDINARY_API_KEY` env var | Upload route | Not in `.env.example` | — | Must add |
| `CLOUDINARY_API_SECRET` env var | Upload route | Not in `.env.example` | — | Must add |

**Missing dependencies with no fallback:**
- `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN` — Phase gate: admin login will fail without these.
- `CLOUDINARY_*` env vars — Upload route will return 500 without them. Wave 0 task: add to `.env.example` and document in Railway/Vercel dashboard setup.

**Missing dependencies with fallback:**
- Cloudinary upload in dev: can skip upload step during development and use hardcoded `res.cloudinary.com` demo URLs (pattern already in seed.ts).

---

## Common Pitfalls

### Pitfall 1: `QuestionStatus.live` vs `QuestionStatus.approved` confusion

**What goes wrong:** Developer interprets the `live` status as the gate for gameplay and writes admin UI that sets questions to `live` to "publish" them. Game loop still uses `approved` — questions never appear in games.

**Why it happens:** The enum has three values but only two are used. `live` is a dead enum value left for future scheduling features.

**How to avoid:** Admin approval action sets `status: 'approved'`. The "approve" button maps directly to `approved`. Document the mapping in the action's JSDoc. Never introduce a `live` write path in this phase.

**Warning signs:** No approved questions returned when starting a game despite questions existing.

### Pitfall 2: Server Actions not available from nested Client Components

**What goes wrong:** A `'use client'` question form component tries to call a Server Action defined in a `'use server'` file in the same directory — works in some Next.js versions but breaks under strict RSC rules.

**Why it happens:** Server Actions must be imported from files with `'use server'` directive at the top, not inline in Client Components.

**How to avoid:** Put all Server Actions in a dedicated `actions.ts` file with `'use server'` at the top. Import into Client Components. [ASSUMED — pattern from Next.js App Router docs]

**Warning signs:** "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'" error.

### Pitfall 3: Cloudinary upload leaks API secret to client

**What goes wrong:** Developer uses the `next-cloudinary` `<CldUploadWidget>` client-side component which auto-generates signed upload URLs — accidentally exposes `CLOUDINARY_API_SECRET` in a client-visible route.

**Why it happens:** The upload widget requires a signed URL endpoint that must be kept server-side, but if the signing logic is accidentally put in a client component, the secret leaks.

**How to avoid:** Keep Cloudinary credentials exclusively in the Next.js Route Handler (`/api/admin/upload`). The admin UI `<form>` POSTs to this route — no client JS ever sees API key/secret. [VERIFIED: Cloudinary docs state credentials must be server-side]

**Warning signs:** `CLOUDINARY_API_SECRET` referenced in a `'use client'` file.

### Pitfall 4: Prisma migration on Railway disrupts live game rooms

**What goes wrong:** Running `prisma migrate deploy` in production while a game session is active can cause the `question` table to be locked briefly, dropping active websocket queries.

**Why it happens:** The schema additions (`timesPlayed`, `timesAnsweredWrong` on Question; `archived` on Category) require a migration. PostgreSQL `ALTER TABLE ADD COLUMN` with a default value is non-blocking on Postgres 11+ but Prisma wraps it in a transaction.

**How to avoid:** Deploy the schema migration during off-peak hours. The columns being added (`Int @default(0)`) are non-destructive. Plan migration as a Wave 0 task with a note about timing. [ASSUMED — standard practice; Postgres 12+ `ADD COLUMN NOT NULL DEFAULT` is instant]

**Warning signs:** Spike in socket errors during migration window.

### Pitfall 5: Seed script re-runs duplicate all 200+ questions

**What goes wrong:** Running `prisma db seed` again after the initial run creates duplicate questions because the existing guard is `if (existingCount === 0)` — as soon as any question exists, all new ones are skipped.

**Why it happens:** The current seed guard is coarse: it checks total question count, not per-question existence. This is intentional for the thin seed but breaks when adding more questions.

**How to avoid:** Use `upsert` per question keyed on a stable unique field (e.g., `text` + `categoryId` composite unique constraint, or a stable `slug` field). Alternative: check per-category question count. [ASSUMED — Prisma upsert pattern]

**Warning signs:** Seed runs but adds 0 new questions when expected; or 200+ duplicates appear.

### Pitfall 6: Admin middleware matcher conflicts with existing host protection

**What goes wrong:** Extending `middleware.ts` matcher to include `/admin/:path*` accidentally removes or short-circuits the existing host route protection.

**Why it happens:** Middleware logic is a single function — adding admin checks requires careful ordering so host auth and admin auth don't interfere.

**How to avoid:** Structure middleware with early returns for each route group. Test both `/host/new` (requires Google auth) and `/admin/questions` (requires admin cookie) after middleware change. [ASSUMED]

**Warning signs:** `/host/new` becomes accessible without Google login after admin middleware added.

---

## Code Examples

Verified patterns from official sources:

### Prisma Schema Migration (adding analytics columns)

```prisma
// Source: Prisma docs — additive migration [ASSUMED: standard pattern]
model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  archived  Boolean    @default(false)    // NEW: soft-delete for categories
  questions Question[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id                 String         @id @default(cuid())
  text               String
  options            String[]
  correctIndex       Int
  timerDuration      Int            @default(20)
  status             QuestionStatus @default(draft)
  type               QuestionType   @default(MULTIPLE_CHOICE)
  mediaUrl           String?
  timesPlayed        Int            @default(0)   // NEW: analytics
  timesAnsweredWrong Int            @default(0)   // NEW: analytics
  category           Category       @relation(fields: [categoryId], references: [id])
  categoryId         String
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
}
```

### Category CRUD Server Action

```typescript
// apps/web/app/(admin)/admin/categories/actions.ts
'use server'
// [ASSUMED] — Next.js Server Action pattern
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CategorySchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
})

export async function createCategory(data: unknown) {
  const parsed = CategorySchema.parse(data)
  await prisma.category.create({ data: parsed })
  revalidatePath('/admin/categories')
}

export async function archiveCategory(id: string) {
  z.string().cuid().parse(id)
  await prisma.category.update({ where: { id }, data: { archived: true } })
  revalidatePath('/admin/categories')
}
```

### Analytics Increment (game.ts addition)

```typescript
// In handleReveal — after scoring is computed [ASSUMED]
// Only fire-and-forget: analytics must not block the reveal broadcast
void prisma.question.update({
  where: { id: questionData.id },
  data: { timesPlayed: { increment: 1 } },
}).catch((e) => console.error('[Analytics] timesPlayed update failed:', e))
```

### Wrong Answer Rate Calculation (admin dashboard read)

```typescript
// apps/web/app/(admin)/admin/questions/page.tsx — Server Component [ASSUMED]
const questions = await prisma.question.findMany({
  include: { category: { select: { name: true } } },
  orderBy: { createdAt: 'desc' },
})

// Compute wrong rate on the fly — avoids storing a float in DB
const withRate = questions.map(q => ({
  ...q,
  wrongRate: q.timesPlayed > 0
    ? Math.round((q.timesAnsweredWrong / q.timesPlayed) * 100)
    : null,
}))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes for CRUD | App Router Server Actions | Next.js 13.4 | No separate API route needed; type-safe, co-located |
| Client-side uploads with presigned URLs | Server-side upload via Route Handler | Cloudinary v2 | Secrets stay server-side; simpler auth model |
| `getServerSideProps` for admin data | Server Components (async RSC) | Next.js 13+ | Zero client JS for data-fetch pages; faster TTFB |

**Deprecated/outdated:**
- `getServerSideProps`: replaced by async Server Components in App Router. Do not use in admin pages.
- `pages/api/*` routes for CRUD: Server Actions are the App Router equivalent — less boilerplate, same security model.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Admin middleware extends existing `middleware.ts` without conflicts | Pattern 1 | Middleware ordering bug could break host route auth |
| A2 | `status: 'live'` is unused in game loop; `approved` is the sole game-serving gate | Standard Stack | If `live` is the real gate, all current approved questions would be invisible in games |
| A3 | Cloudinary Node SDK `upload_stream` accepts a Buffer and can be promisified in a Route Handler | Pattern 3 | Upload might fail; may need `upload` (base64 data URI) instead |
| A4 | Prisma `ADD COLUMN NOT NULL DEFAULT 0` migration is non-blocking in production PostgreSQL 12+ | Pitfall 4 | Brief table lock; recommend off-peak deployment |
| A5 | Six categories: ثقافة عامة، رياضة، ترفيه، جغرافيا، تاريخ، علوم وتكنولوجيا | Pattern 5 | User may have different category preferences; planner should confirm |
| A6 | Per-question analytics written fire-and-forget from game.ts reveal path (void + catch) | Pattern 4 | If analytics must be guaranteed, need a queue or retry — currently best-effort |
| A7 | `ADMIN_SESSION_TOKEN` stored as env var (not derived from ADMIN_PASSWORD) to separate auth from session | Pattern 1 | If same value used for both, password rotation requires session invalidation logic |

---

## Open Questions

1. **What are the 6 official categories?**
   - What we know: ADMIN-05 says "6 categories"; current seed has 3 (ثقافة عامة, رياضة, ترفيه).
   - What's unclear: Are the 3 missing categories defined by the product owner or left to Claude's discretion?
   - Recommendation: Planner should use the 3 existing + 3 proposed (جغرافيا, تاريخ, علوم وتكنولوجيا) unless user overrides.

2. **Where do analytics writes happen — game server or Next.js?**
   - What we know: `game.ts` in the Express server is where reveal happens; it already has `prisma` imported.
   - What's unclear: Should analytics be written from `game.ts` (simpler, single DB write at reveal) or from a dedicated Express route called by the game loop?
   - Recommendation: Write directly from `game.ts` inside `handleReveal` — it already has `prisma` access. Simpler, fewer moving parts.

3. **Should wrong-answer analytics count per-player or per-question?**
   - What we know: ADMIN-04 says "wrong answer rates" — implies per-question aggregate.
   - What's unclear: Is it the fraction of players who got it wrong, or total wrong submissions?
   - Recommendation: `timesAnsweredWrong` = total wrong submissions; `wrongRate = timesAnsweredWrong / (timesPlayed * avgPlayers)` is approximate but sufficient for ADMIN-04.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.6.0 (apps/server) |
| Config file | `apps/server/vitest.config.ts` |
| Quick run command | `cd apps/server && npm test` |
| Full suite command | `cd apps/server && npm test` (all tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Category CRUD — create, rename, archive | unit (Server Action logic) | `cd apps/server && npm test -- --reporter=verbose` | ❌ Wave 0 |
| ADMIN-02 | Question CRUD — text, status transitions | unit (Server Action logic) | same | ❌ Wave 0 |
| ADMIN-03 | `approved` status allows game start; `draft` does not | unit (game.ts filter verified) | same | ❌ Wave 0 |
| ADMIN-04 | `timesPlayed` increments on reveal; `timesAnsweredWrong` increments on wrong answer | unit (analytics logic) | same | ❌ Wave 0 |
| ADMIN-05 | Seed produces 200+ questions with status `approved` | integration (seed + DB count) | `cd apps/server && npx prisma db seed && npx ts-node -e "..."` | ❌ Wave 0 |

**Note:** Admin UI pages (Next.js Server Components, Server Actions) are not unit-testable with Vitest in apps/server. Smoke testing for the web UI is manual (see verification plan) or via the E2E script.

### Sampling Rate

- **Per task commit:** `cd apps/server && npm test`
- **Per wave merge:** `cd apps/server && npm test` (full suite)
- **Phase gate:** Full suite green + admin UI manual smoke test before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/server/src/routes/admin.test.ts` — covers analytics endpoint (ADMIN-04)
- [ ] `apps/server/src/__tests__/admin-seed.test.ts` — covers seed count >= 200 (ADMIN-05)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Simple password check + HTTP-only signed cookie; env var `ADMIN_PASSWORD` |
| V3 Session Management | yes | HTTP-only cookie with `sameSite: strict`, `secure: true` in production, 7-day expiry |
| V4 Access Control | yes | Next.js middleware checks cookie on every `/admin/*` request |
| V5 Input Validation | yes | `zod` schema in Server Actions; Cloudinary SDK validates file type |
| V6 Cryptography | no | No sensitive data encrypted at rest beyond standard PostgreSQL; no hand-rolled crypto |

### Known Threat Patterns for Admin Dashboard

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized admin access | Spoofing | HTTP-only cookie not accessible to JS; middleware on all `/admin/*` routes |
| CSRF on Server Actions | Tampering | Next.js 14 Server Actions include built-in CSRF protection via same-origin origin check [ASSUMED: Next.js docs] |
| File upload abuse (malicious files) | Tampering | Cloudinary SDK with `resource_type: 'auto'` validates MIME type server-side |
| Admin password brute force | Spoofing | Add rate limiting to `/api/admin/login` route (express-rate-limit or Next.js middleware counter) |
| Prisma injection | Tampering | Parameterized queries via Prisma ORM; no raw SQL in admin routes |
| XSS via question text | Tampering | React JSX escapes by default; admin-only input, lower risk than public forms |

---

## Sources

### Primary (HIGH confidence)
- Prisma schema (`apps/server/prisma/schema.prisma`) — verified QuestionStatus enum, Question model fields
- `apps/server/src/socket/game.ts` — verified `QuestionStatus.approved` as game-serving gate
- `apps/server/src/index.ts` — verified Express structure and existing routes
- `apps/web/middleware.ts` — verified current middleware matcher pattern
- `apps/web/next.config.mjs` — verified Cloudinary `remotePatterns` already configured
- npm registry — verified cloudinary@2.9.0, zod@4.3.6, express-rate-limit@8.3.2

### Secondary (MEDIUM confidence)
- Cloudinary Node.js SDK documentation — `upload_stream` accepts Buffer, returns `secure_url`
- Next.js 14 App Router docs — Server Actions `'use server'` pattern, `revalidatePath`

### Tertiary (LOW confidence — flagged in Assumptions Log)
- Admin middleware extension pattern — modeled on existing middleware.ts, not verified against a running test
- Seed upsert-by-text pattern — standard Prisma practice but not verified against existing seed logic edge cases

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing dependencies verified; new packages confirmed on npm registry
- Architecture: MEDIUM — patterns follow existing project conventions; admin specifics are assumed from Next.js docs
- Pitfalls: MEDIUM — derived from project code inspection and known Next.js/Prisma gotchas

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable stack — Next.js 14 is pinned; Prisma 6 stable)
