---
phase: 07-admin-dashboard-content-management
plan: "02"
subsystem: auth
tags: [admin, cookie-session, middleware, prisma, server-actions, next14]

# Dependency graph
requires:
  - phase: 07-01
    provides: "Category.archived, Question.timesPlayed, Question.timesAnsweredWrong in server schema"
provides:
  - Cookie-based admin session auth (login/logout Route Handlers)
  - Admin middleware protection integrated into NextAuth auth() callback
  - Admin layout with sidebar navigation (admin route group)
  - Admin dashboard with 4 live Prisma stat cards
  - Full Category CRUD via Server Actions (create, rename, archive, unarchive)
  - Web app prisma schema extended with Category/Question models
affects: [07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Cookie-based admin auth separate from NextAuth (httpOnly, sameSite strict, 7-day)
    - Next.js route group (admin) for shared layout without URL segments
    - Server Actions with revalidatePath for optimistic CRUD
    - force-dynamic on DB-reading Server Components to avoid build-time prerender
    - Prisma client generated from web app schema including admin models

key-files:
  created:
    - apps/web/app/api/admin/login/route.ts
    - apps/web/app/api/admin/logout/route.ts
    - apps/web/app/(admin)/AdminLogoutButton.tsx
    - apps/web/app/(admin)/layout.tsx
    - apps/web/app/(admin)/admin-login/page.tsx
    - apps/web/app/(admin)/admin/page.tsx
    - apps/web/app/(admin)/admin/categories/actions.ts
    - apps/web/app/(admin)/admin/categories/CategoryList.tsx
    - apps/web/app/(admin)/admin/categories/page.tsx
  modified:
    - apps/web/middleware.ts
    - apps/web/prisma/schema.prisma

key-decisions:
  - "Admin auth uses simple cookie session (ADMIN_SESSION_TOKEN env var) independent of NextAuth — no DB lookup needed"
  - "Admin middleware check lives INSIDE the NextAuth auth() callback wrapper to preserve NextAuth edge compatibility"
  - "Web app prisma/schema.prisma extended with Category+Question models (not just NextAuth) so @prisma/client includes admin types"
  - "force-dynamic export added to all DB-reading Server Components to prevent build-time prerender errors without DATABASE_URL"

patterns-established:
  - "Pattern: Admin cookie check uses isAdminRoute && !isAdminLogin to allow access to login page while protecting all /admin/* routes"
  - "Pattern: Server Actions call revalidatePath after mutations so category list auto-refreshes"
  - "Pattern: CategoryList client component uses useTransition to show pending state during Server Action calls"

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-04-11
---

# Phase 07 Plan 02: Admin Authentication + Category CRUD Summary

**Cookie-based admin auth with password login/logout, middleware protection integrated into NextAuth wrapper, and full Category CRUD via Next.js Server Actions with live Prisma counts on the dashboard.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-11T10:30:00Z
- **Completed:** 2026-04-11T10:55:00Z
- **Tasks:** 2 completed
- **Files modified:** 11

## Accomplishments

- Admin session auth fully isolated from NextAuth: POST /api/admin/login sets httpOnly cookie, POST /api/admin/logout clears it
- Middleware extended to protect all /admin/* routes (cookie check) while /admin-login stays public; /host/* still protected via NextAuth
- (admin) route group delivers shared sidebar layout: nav links to رئيسية, الفئات, الأسئلة, plus logout button
- Dashboard shows 4 live stat cards (active categories, total questions, approved, draft) queried via Prisma
- Category CRUD: create (name+slug with validation), rename (inline edit), archive, unarchive — all via Server Actions with revalidatePath
- Web app prisma schema updated to include Category/Question/enums so TypeScript compiles without errors; Prisma client regenerated

## Task Commits

1. **Task 1 + 2: Admin auth, layout, dashboard, Category CRUD** - `64d1121` (feat)

## Files Created/Modified

- `apps/web/middleware.ts` — Extended with admin cookie check inside auth() callback, updated matcher
- `apps/web/prisma/schema.prisma` — Added QuestionStatus/QuestionType enums, Category, Question models
- `apps/web/app/api/admin/login/route.ts` — POST handler: validates ADMIN_PASSWORD, sets admin_session cookie
- `apps/web/app/api/admin/logout/route.ts` — POST handler: clears admin_session cookie (maxAge 0)
- `apps/web/app/(admin)/AdminLogoutButton.tsx` — Client component: calls logout API, redirects to /admin-login
- `apps/web/app/(admin)/layout.tsx` — Admin shell layout with sidebar, nav links, logout button
- `apps/web/app/(admin)/admin-login/page.tsx` — Arabic password login form with error display
- `apps/web/app/(admin)/admin/page.tsx` — Dashboard with 4 Prisma stat cards (force-dynamic)
- `apps/web/app/(admin)/admin/categories/actions.ts` — Server Actions: createCategory, renameCategory, archiveCategory, unarchiveCategory
- `apps/web/app/(admin)/admin/categories/CategoryList.tsx` — Client table with inline edit, create form, archive/unarchive buttons
- `apps/web/app/(admin)/admin/categories/page.tsx` — Categories page: fetches all categories with question count (force-dynamic)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Extended web app prisma schema with Category/Question models**
- **Found during:** Task 2 (build step)
- **Issue:** Web app `prisma/schema.prisma` only had NextAuth models; `@prisma/client` had no `category` or `question` properties, causing TypeScript error `Property 'category' does not exist on type 'PrismaClient'`
- **Fix:** Added QuestionStatus/QuestionType enums, Category model (with archived field from 07-01), Question model to web app schema; ran `prisma generate` targeting main project node_modules
- **Files modified:** `apps/web/prisma/schema.prisma`

**2. [Rule 2 - Missing Critical Functionality] Added `export const dynamic = 'force-dynamic'` to DB-reading pages**
- **Found during:** Task 2 (build step)
- **Issue:** Next.js tried to statically prerender `/admin` and `/admin/categories` at build time, failing with `DATABASE_URL not found` since there is no DB available during CI/build
- **Fix:** Added `export const dynamic = 'force-dynamic'` to both server pages
- **Files modified:** `apps/web/app/(admin)/admin/page.tsx`, `apps/web/app/(admin)/admin/categories/page.tsx`

## Known Stubs

None — all admin pages render live data from Prisma.

## Self-Check: PASSED

Files verified present:
- `apps/web/middleware.ts` — FOUND
- `apps/web/app/api/admin/login/route.ts` — FOUND
- `apps/web/app/api/admin/logout/route.ts` — FOUND
- `apps/web/app/(admin)/layout.tsx` — FOUND
- `apps/web/app/(admin)/admin-login/page.tsx` — FOUND
- `apps/web/app/(admin)/admin/page.tsx` — FOUND
- `apps/web/app/(admin)/admin/categories/actions.ts` — FOUND
- `apps/web/app/(admin)/admin/categories/CategoryList.tsx` — FOUND
- `apps/web/app/(admin)/admin/categories/page.tsx` — FOUND

Build commit: `64d1121` — FOUND (via git log)
