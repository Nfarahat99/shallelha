---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-21T16:14:01.956Z"
progress:
  total_phases: 14
  completed_phases: 11
  total_plans: 57
  completed_plans: 57
  percent: 100
---

# Project State: Sha'lelha (شعللها)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-09)

**Core value:** Any Arabic-speaking group can start a game session in under 60 seconds, on any device, with no install.
**Current focus:** Milestone 2 — Growth Foundation, User Profiles, New Game Types, Spectator Mode

---

## Current Status

- **Milestone:** v1.0 — MVP Public Launch — **COMPLETE** ✓
- **Milestone:** v2.0 — Growth + Engagement Engine — **ACTIVE**
- **Active Phase:** Phase 12 (User Profiles + Persistent Leaderboards) — **PLANNED** — 9 plans ready to execute
- **Phase 11:** Growth Foundation — Landing Page, Sharing, Post-Game Screen — **COMPLETE ✓** — All 8 plans executed 2026-04-19
- **Phase 10:** UGC Question Packs + Shareable Result Cards — **COMPLETE ✓** — deployed 2026-04-18
- **Phases complete:** 11 / 14
- **Plans complete:** 35 / 35 (v1.0 plans) + 8 / 8 (Phase 10) + 8 / 8 (Phase 11) = 51 total plans complete

---

## Recent Activity

- 2026-04-21: Phase 12 Plan 06 complete — anonymous players saved to PlayerGameResult with userId=null; claimAnonymousStats Server Action with auth guard + optimistic lock; PlayerPostGame shows claim/sign-in button; gameSessionId pre-generated and emitted in game:podium event; commit e5966e9
- 2026-04-21: Phase 12 PLANNED — 9 plans approved (12-01 through 12-09); wave structure: W1 schema+PWA, W2 avatar system, W3 avatar display+leaderboard+PWA polish, W4 anon claiming+profile enhancement, W5 smoke tests+Lighthouse; covers REQ-007 (PWA) + REQ-008 (avatars); ready to execute
- 2026-04-19: Phase 11 COMPLETE — all 8 plans executed; landing page live, player post-game screen with leaderboard+share, profile page with JWT session refresh, game:reset play-again flow, 111/111 server tests green; code review fixes applied (C-01 JWT refresh, H-02 phase guard); ready for Phase 12
- 2026-04-19: Phase 11 PLANNED — 8 plans approved (11-01 through 11-08); wave structure: W1 schema+landing+sharing+OG, W2 game engine+profile+auth callbacks, W3 post-game player screen, W4 smoke tests; REQ-002 (anonymous rooms) explicitly excluded per user decision; ready to execute
- 2026-04-18: Phase 10 COMPLETE — all 8 plans executed; single unified deploy to Railway (server) + Vercel (web); smoke test: Vercel HTTP 200, Railway health {"status":"ok","postgres":"ok","approvedQuestions":204,"redis":"ok"}; HANDOFF.md updated; active phase now Phase 11
- 2026-04-18: Phase 10 Plan 07 complete — Quick UX Wins: live rank delta badge (▲N/▼N) in answer confirmation, "X من Y أجابوا" answer count progress on player+host screens, full-screen freeze overlay for frozen player; Rule 2 fix: server now emits player:frozen targeted to frozen player's socket; 106 server tests green, TS compiles clean
- 2026-04-18: Phase 10 Plan 06 complete — Shareable Result Cards: satori+resvg PNG generation (Snapchat 9:16 / WhatsApp 1:1), Cairo font via Google Fonts CDN with fallback, in-memory 1hr cache, rate limiter, 3 Vitest tests pass; ResultCard.tsx Web Share API + download fallback integrated into HostDashboard ended state
- 2026-04-18: Phase 10 Plan 05 complete — Admin Pack Approval Queue: rejectionReason added to schema (db push), GET /packs accepts ?status= param, admin /packs page with approve/reject Server Actions, pending count badge in admin nav, rejectionReason shown on My Packs page
- 2026-04-18: Phase 10 fully planned — 8 PLAN.md files (10-01 through 10-08) + 10-NYQUIST.md; plan-checker FLAGs resolved (game engine wiring added as Plan 08, rejectionReason persistence fixed in Plan 05, NYQUIST path corrected, cards test file added to Plan 06); ready to execute
- 2026-04-18: Milestone 2 roadmap created — v2.0 Growth + Engagement Engine; Phases 11-14 defined; user confirmed priority: Phase 11 (Growth Foundation) → Phase 12 (User Profiles) → Phase 13 (Drawing + Bluffing game types) → Phase 14 (Spectator Mode); REQUIREMENTS.md v2 BRD written with REQ-001 through REQ-006
- 2026-04-18: Phase 09 complete — AI Content Generation: GPT-4o backend route, admin UI (AiGenerateDialog + ModerationQueue), 91/91 server tests green (7 new integration tests), next build clean
- 2026-04-17: Phase 08 complete — 11/11 UAT tests pass; all 78 server tests green; HANDOFF.md generated; v1.0 milestone closed
- 2026-04-14: Phase 02 confirmed complete and live — SUMMARY files created retroactively (4 plans: auth, room/socket, player join/reconnect, load test)
- 2026-04-11: Phase 07 Plan 05 complete — 201 Arabic questions seeded (6 categories, idempotent upsert, Wave 0 stubs implemented)
- 2026-04-11: Phase 07 Plan 03 complete — question CRUD + Cloudinary upload (create/edit/delete/approve, status workflow)
- 2026-04-11: Phase 07 Plan 02 complete — admin auth (cookie session) + Category CRUD via Server Actions
- 2026-04-11: Phase 07 Plan 01 complete — Prisma schema extended with archived/timesPlayed/timesAnsweredWrong fields; Wave 0 test stubs created; .env.example updated with Phase 7 vars
- 2026-04-11: Phase 06 complete — all 4 plans done (data layer, Double Points, Remove Two, Freeze Opponent, E2E verification); 58 server tests green, frontend builds clean
- 2026-04-09: Project initialized. PRD validated and rebuilt. PROJECT.md, REQUIREMENTS.md, ROADMAP.md, config.json created.

---

## Key Context

- Stack decided: Next.js 14 + Node.js/Socket.io + PostgreSQL + Redis + Vercel/Railway
- Arabic-first RTL UI throughout
- Builder: Claude agents via GSD workflow (no human dev team)
- 8-phase roadmap for v1.0 MVP

---

## Decisions

- Admin auth uses simple cookie session (ADMIN_SESSION_TOKEN) independent of NextAuth — no DB lookup needed
- Admin middleware check lives inside NextAuth auth() callback wrapper for edge compatibility
- Web app prisma/schema.prisma extended with Category+Question models so @prisma/client includes admin types
- force-dynamic added to DB-reading Server Components to prevent build-time prerender without DATABASE_URL

---
- [Phase 07]: Cloudinary upload uses server-side stream (upload_stream) rather than unsigned client upload — keeps API secret server-only
- [Phase 07]: QuestionForm placed under new-question/ and imported by [id] edit page to avoid duplication; bound 'use server' closure captures question id in edit page
- [Phase 07]: Prisma import from db/prisma (not lib/prisma) — matched existing health.ts pattern in server codebase
- [Phase 07]: Wrong-answer detection uses streak===0 && answeredCurrentQ at reveal time — atomic Prisma increment, fire-and-forget
- [Phase 07]: seed-data.ts extracted as separate module — tests import data directly, no Prisma mock needed; tsx replaces ts-node for seed execution per CLAUDE.md
- [Phase 07]: @@unique([text, categoryId]) composite constraint enables per-question upsert; old coarse existingCount===0 guard replaced
- [Phase 08]: Per-socket in-memory rate limiter chosen over Redis-backed — socket-level limits are per-connection, zero-latency, no Redis round-trips needed
- [Phase 08]: findRoomByHostId rewritten to O(1) using hostroom:{hostId} Redis reverse index — eliminates redis.keys O(n) scan
- [Phase 08]: No Sentry for MVP — Railway log drain + process.on handlers sufficient
- [Phase 08]: Analytics failures downgraded from ERROR to WARN (non-critical, fire-and-forget)
- [Phase 08]: NEXT_PUBLIC_BACKEND_URL is the correct env var name (not NEXT_PUBLIC_SOCKET_URL) — matches apps/web/lib/socket.ts
- [Phase 08]: No output:standalone added to next.config.mjs — Vercel handles its own pipeline; standalone is for Docker self-hosting only
- [Phase 09]: OpenAI client uses lazy singleton to avoid constructor throw when OPENAI_API_KEY absent in test env
- [Phase 09]: aiGenerateLimiter keyed on admin_session cookie with validate.ip:false; no cookie-parser dependency
- [Phase 09]: GPT response_format:json_object — parse obj.questions to extract array per locked decision
- [Phase 09]: vitest config uses vite loadEnv to load .env into test.env — makes DATABASE_URL available to real Prisma in integration tests without modifying test files
- [Phase 09]: Integration tests use [TEST_AI] prefix + afterEach deleteMany for isolation; afterAll deletes test category — idempotent via beforeAll upsert
- [Phase 10-01]: Used prisma db push instead of prisma migrate dev — migration history had drift from existing DB; db push syncs schema without dropping data
- [Phase 10-01]: GET /packs/mine defined before GET /packs/:id in router to prevent route shadowing on the literal path "mine"
- [Phase 10-01]: Pack.createdBy stored as plain String (no FK) — avoids cascade complexity with future anonymous users
- [Phase 10-03]: Used cookie-parser middleware so req.cookies works reliably in production and test environments
- [Phase 10-03]: Rate limit key falls back to 'anonymous' (not req.ip) to avoid ERR_ERL_KEY_GEN_IPV6 validation error from express-rate-limit v8
- [Phase 10-03]: Integration tests use unique next-auth.session-token cookies per test to isolate rate-limit buckets
- [Phase 10-03]: 503 threshold set at < 3 valid questions to reject low-quality partial Groq responses early
- [Phase 10-05]: prisma db push used (not migrate dev) — consistent with Plan 01 pattern; avoids drift with Railway DB
- [Phase 10-05]: Admin Server Actions check cookie independently of middleware (defense-in-depth per T-10-05-01)
- [Phase 10-05]: Inline native form for rejection reason — no client JS modal needed; HTML required attr handles validation
- [Phase 10-06]: Cairo font fetched from Google Fonts CDN as TTF (no browser UA → returns TTF, not woff2); pinned v31 URL with CSS API fallback; cached in module memory — avoids binary asset in repo
- [Phase 10-06]: satori object format used in Express (no JSX transpiler); cast to `any` at call site per satori docs workaround for non-React environments
- [Phase 10-06]: In-memory Map cache (1hr TTL) for PNG buffers — no Redis round-trip needed for read-heavy card serving
- [Phase 10-06]: ResultCard integrated into HostDashboard ended branch (not a separate /postgame route) — leaderboard already in socket state
- [Phase 10-ugc-question-packs-shareable-cards]: Delete + re-create strategy for pack updates: backend has no PATCH questions endpoint, so updatePack() deletes and re-creates the pack with new data
- [Phase 10-07]: FrozenPlayerOverlay placed in ./components/ (not ./game/) — ./game/FreezeOpponentOverlay is the "select target" dialog; ./components/FreezeOpponentOverlay is the "you are frozen" state shown to victim
- [Phase 10-07]: Server freeze handler emits player:frozen targeted to frozen player's socketId — Rule 2 fix; previously freeze was applied silently with no client notification
- [Phase 10]: game.ts branches on room.packId (from Redis) to serve PackQuestion rows — no new socket payload needed, packId already stored by Plan 10-04
- [Phase 10]: playCount incremented in both natural and early game end paths to ensure count is always captured
- [Phase 12]: Removed @@unique([gameSessionId, userId]) from PlayerGameResult — nullable userId breaks unique constraint semantics in PostgreSQL (NULLs-are-distinct); replaced with individual @@index directives
- [Phase 12]: avatarConfig stored as Json? column (not normalized table) — flexible, schema-less for evolving SVG avatar builder data; onDelete: SetNull on PlayerGameResult.user preserves game history when user is deleted
- [Phase 12]: sw.ts uses WorkerGlobalScope cast instead of ServiceWorkerGlobalScope — latter absent from dom lib in app tsconfig context
- [Phase 12]: SW disabled in development via process.env.NODE_ENV check to prevent dev caching interference
- [Phase 12]: sharp installed as devDep for icon generation; icons committed to git; sw.js excluded via .gitignore
- [Phase 12-04]: PlayerCard uses avatarConfig != null guard so existing callers without avatarConfig continue rendering emoji fallback
- [Phase 12-05]: bigint literal 0n avoided in $queryRaw result mapping — Number() conversion used instead to stay compatible with tsconfig target below ES2020
- [Phase 12-05]: SSR leaderboard fetch uses NEXT_PUBLIC_APP_URL for correct base URL in both dev and production environments
- [Phase 12]: NetworkFirst imported from serwist (not @serwist/next/worker); ReconnectOverlay wired in PlayerJoin.tsx not page.tsx
- [Phase 12-06]: gameSessionId pre-generated via @paralleldrive/cuid2 createId() before game:podium emit — allows client to pass it to claimAnonymousStats without a separate DB lookup
- [Phase 12-06]: Prisma.DbNull used for nullable JSON avatarConfig field in createMany — satisfies NullableJsonNullValueInput type vs InputJsonValue|null which Prisma rejects
- [Phase 12]: Playwright installed at monorepo root — web app tests reference @playwright/test without a separate install
- [Phase 12]: SKIP_LIVE_SERVER=1 guard pattern applied to all Phase 12 smoke tests — enables CI import/type-check without a live server

## Open Questions

- Will host need an account to create a room, or anonymous room creation?
- Minimum question bank size confirmed at 200 (across 6 categories)
- Is there a practice/solo mode, or multiplayer-required?
- Free Text voting: players only, or host override?

---

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 07    | 02   | 25min    | 2     | 11    |
| 07    | 03   | 15min    | 2     | 9     |
| 10    | 07   | 45min    | 2     | 7     |

---

| 07    | 05   | 20min    | 2     | 5     |

| 10    | 03   | 309s     | 2     | 6     |

*Last session: 2026-04-18 — Stopped at: Completed 10-03-PLAN.md — Groq AI Pack Assistant route, 6/6 integration tests green, 103/103 full suite*

---
| Phase 09 P01 | 15 | 3 tasks | 4 files |
| Phase 09 P03 | 20 | 3 tasks | 2 files |
| Phase 10-ugc-question-packs-shareable-cards P02 | 45 | 2 tasks | 12 files |
| Phase 10 P08 | 20 | 2 tasks | 3 files |
| Phase 12 P02 | 15 | 3 tasks | 9 files |
| Phase 12-user-profiles-persistent-leaderboards P04 | 5m | 2 tasks | 4 files |
| Phase 12-user-profiles-persistent-leaderboards P05 | 8m | 3 tasks | 4 files |
| Phase 12 P08 | 8m | 2 tasks | 6 files |
| Phase 12 P09 | 8m | 3 tasks | 3 files |

## Roadmap Evolution

- Phase 9 added: AI Content Generation (GPT-4o admin question generation + moderation queue) — plans verified, not yet executed
- Phase 10 added: Draw and Guess game mode (ارسم وخمن) — from PRD shallelha.md Phase 2 Expansion
- Phase 10 redesigned (2026-04-18): Draw and Guess → **UGC Community Question Packs + Shareable Result Cards** — product analysis (3 parallel agents) found this is higher-leverage for Gulf market growth: viral Snapchat/WhatsApp sharing loop + creator-driven content flywheel + Groq AI pack assistant (free, no OpenAI dependency)

| Phase 08 P02 | 15 | 9 tasks | 6 files |
| Phase 08 P03 | 25min | 6 tasks | 8 files |
| Phase 08 P04 | 15 | 8 tasks | 7 files |
