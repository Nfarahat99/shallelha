---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Growth + Engagement Engine
status: active
last_updated: "2026-04-18T18:00:00.000Z"
progress:
  total_phases: 14
  completed_phases: 9
  total_plans: 35
  completed_plans: 35
  percent: 64
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
- **Active Phase:** Phase 10 (UGC Question Packs + Shareable Cards) — **IN PROGRESS** — Plan 01 complete (Pack CRUD data layer + REST API)
- **Phases complete:** 9 / 14
- **Plans complete:** 35 / 35 (v1.0 plans) + 8 plans (Phase 10, not yet executed)

---

## Recent Activity

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

---

| 07    | 05   | 20min    | 2     | 5     |

*Last session: 2026-04-18 — Stopped at: Completed 10-01-PLAN.md — Pack CRUD data layer + REST API, 6/6 integration tests green*

---
| Phase 09 P01 | 15 | 3 tasks | 4 files |
| Phase 09 P03 | 20 | 3 tasks | 2 files |

## Roadmap Evolution

- Phase 9 added: AI Content Generation (GPT-4o admin question generation + moderation queue) — plans verified, not yet executed
- Phase 10 added: Draw and Guess game mode (ارسم وخمن) — from PRD shallelha.md Phase 2 Expansion
- Phase 10 redesigned (2026-04-18): Draw and Guess → **UGC Community Question Packs + Shareable Result Cards** — product analysis (3 parallel agents) found this is higher-leverage for Gulf market growth: viral Snapchat/WhatsApp sharing loop + creator-driven content flywheel + Groq AI pack assistant (free, no OpenAI dependency)

| Phase 08 P02 | 15 | 9 tasks | 6 files |
| Phase 08 P03 | 25min | 6 tasks | 8 files |
| Phase 08 P04 | 15 | 8 tasks | 7 files |
