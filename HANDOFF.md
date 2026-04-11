# Handoff — Sha'lelha (شعللها)

**Generated:** 2026-04-11  
**Last commit:** 91e2d1a  
**Branch:** master

---

## What Was Just Completed

**Phases 1–7 deployed to production.**

### Phase 7: Admin Dashboard + Content Management — What's Now Working

**Backend (apps/server — Railway):**
- `GET /admin/analytics` — per-question stats (timesPlayed, timesAnsweredWrong, wrongRate), rate-limited 30 req/min
- Fire-and-forget analytics counters wired into `handleReveal` in game loop
- `adminRouter` registered at `app.use('/admin', adminRouter)` in Express
- 201 Arabic questions seeded across 6 categories (MC + MEDIA_GUESSING + FREE_TEXT), idempotent via `prisma.question.upsert` keyed on `@@unique([text,categoryId])`
- Seed script compiled via `prisma/tsconfig.json` during Docker build; Dockerfile CMD runs `prisma db push --accept-data-loss && node prisma/seed.js && node dist/index.js`

**Frontend (apps/web — Vercel):**
- `/admin-login` — password-protected admin gate (httpOnly cookie, ADMIN_SESSION_TOKEN)
- `/admin` — dashboard with 4 live stat cards (active categories, total/approved/draft questions)
- `/admin/categories` — Category CRUD: create, rename, archive/unarchive via Server Actions
- `/admin/questions` — Question list with status + category filters (combinable)
- `/admin/new-question` — create question form (MC/MEDIA/FREE_TEXT, Cloudinary image upload)
- `/admin/questions/[id]` — edit question form, pre-populated; approve/revert/delete via Server Actions
- Cloudinary upload via `POST /api/admin/upload` (server-side stream, API secret never exposed)

**71 server tests passing (7 test files). TypeScript compiles clean.**

---

## Deployment Status

| Service | URL | Status |
|---------|-----|--------|
| Backend (Railway) | `shallelha-server.railway.app` | Live — port 4000 |
| Frontend (Vercel) | https://shallelha.vercel.app | Live — latest prod deployment |

---

## Project State

**ROADMAP phases:**
| Phase | Status | Notes |
|-------|--------|-------|
| 1 | Complete | Infrastructure + scaffold |
| 2 | Complete | Room system + Google auth |
| 3 | Complete | Arabic UI (merged with Phase 4) |
| 4 | Complete | Game engine (merged into Phase 3) |
| 5 | Complete | Media Guessing + Free Text |
| 6 | Complete | Lifelines (deployed) |
| 7 | Complete | Admin dashboard + 201-question Arabic seed (deployed) |
| 8 | Pending | Polish + launch |

**Next action:** `/gsd-next` (will start Phase 8)

---

## Key Architecture Decisions (Locked)

- Redis: `room:{code}` hash with `gameState` JSON field
- Speed scoring: `floor((1 - elapsed/timerDuration / 2) * 1000)` — 500-1000 pts
- Streak: 1.5x after 3+ consecutive correct, server-side only
- RTL timer: `transform-origin: inline-end` + `scaleX` CSS
- Tailwind logical props ONLY throughout entire codebase
- Motion: LazyMotion + domAnimation (4.6kb gzipped)
- Cairo font: loaded in layout.tsx, weights 400/600/700/900
- Host controls all game pacing
- Pre-game config: layoutStyle, timerStyle, revealMode in `game:configure`
- `question:progress` broadcasts `{answeredCount, totalPlayers, answeredIds: string[]}`
- Lifelines: one-use per game per player, server-authoritative, transient flags reset per question
- Admin auth: simple cookie session (ADMIN_SESSION_TOKEN), no DB lookup, edge-compatible middleware
- Cloudinary upload: server-side `upload_stream` — API secret stays server-only
- Seed: `@@unique([text, categoryId])` composite constraint enables idempotent per-question upsert
- `prisma/tsconfig.json` compiles `prisma/*.ts → prisma/*.js` during Docker builder stage

---

## Resume Instructions

```bash
cd /c/shllahaV2
git status
npm run test --workspace=apps/server -- --run   # 71 tests green
npm run build --workspace=apps/web              # build passes
```

Start Phase 8: `/gsd-next`
