# Phase 9 Context: AI Content Generation

## Phase Goal

Admin and hosts can generate Arabic questions via GPT-4o, with all AI-generated questions entering a moderation queue (DRAFT status) before going live.

## Locked Decisions

These are agreed, non-negotiable. Do not re-ask:

- **AI provider**: OpenAI GPT-4o (`gpt-4o` model ID)
- **Question destination**: All AI-generated questions are created in `DRAFT` status — they never go live automatically
- **Generation trigger**: Admin dashboard only (not in-game by host); the `AI-01` requirement "host can request" is scoped to the admin dashboard context for MVP
- **Generation count**: 5–10 questions per generation request
- **Rate limit**: Server-side rate limiting on the AI generation endpoint (reuse existing per-socket pattern; apply per-admin-session)
- **Key location**: `OPENAI_API_KEY` in server env only (`apps/server/.env`) — never exposed to frontend
- **Moderation**: Admin approves/rejects from the existing admin dashboard at `/admin`
- **Stack**: Express route on backend + Server Action or API route on frontend — consistent with existing admin patterns

## Requirements to Cover

| ID | Requirement |
|----|-------------|
| AI-01 | Host can request AI-generated questions by category in real time (GPT-4o) |
| AI-02 | AI-generated questions go into moderation queue before going live |

## Existing Infrastructure to Leverage

- `apps/server/src/routes/admin.ts` — existing admin Express routes (auth pattern already there)
- `apps/server/src/db/` — Prisma client, `Question` model with `status: DRAFT | APPROVED | LIVE`, `type`, `text`, `options` JSON, `correctAnswer`, `categoryId`, `mediaUrl`
- `apps/web/app/admin/` — existing admin dashboard pages (questions, categories, analytics)
- Admin cookie-gate middleware already in place (`ADMIN_SESSION_TOKEN`)
- Category list already available via existing admin API

## Constraints

- `tsx` only — never `ts-node`
- All 5 mandatory skills must be invoked: `next-best-practices`, `nodejs-backend-patterns`, `senior-devops`, `ui-ux-pro-max`, `webapp-testing`
- Post-wave feedback report required after each executor wave
- Dark glassmorphism design system: `brand-*` tokens, glassmorphism cards, Cairo font — never raw `indigo-*`
- Arabic RTL UI — all new UI text must be in Arabic

## Out of Scope for Phase 9

- In-game real-time generation during a live game session (deferred to v3)
- Batch CSV import (v3)
- AI-generated media (image/audio) — text questions only for MVP AI generation
- GPT-4o fine-tuning or custom models
