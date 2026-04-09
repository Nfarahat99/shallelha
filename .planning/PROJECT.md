# Sha'lelha (شعللها)

## What This Is

Sha'lelha is an Arabic-first real-time multiplayer party game platform for the Gulf market. Groups of 2–8 players join game rooms from their phones (browser, no install) while a host controls the game on a shared screen — think Jackbox Games built for Arabic culture. Phase 1 delivers a publicly launchable MVP with 3 question types, lifelines, and a content admin dashboard.

## Core Value

**Any Arabic-speaking group can start a game session in under 60 seconds, on any device, with no install.**

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Host can create a room with a 4-character code and players can join from mobile browsers
- [ ] Three question types: Multiple Choice, Media Guessing, Free Text Entry
- [ ] Real-time synchronization: player answers appear on host screen within 200ms
- [ ] Scoring system with speed-based points, streak multipliers, and a live leaderboard
- [ ] Three lifelines per player: Double Points, Remove Two, Freeze Opponent
- [ ] Full Arabic RTL UI on both host display (landscape) and player controller (portrait)
- [ ] Admin dashboard for CRUD of categories and questions with media upload
- [ ] Player reconnect: rejoin within 10s without losing game state
- [ ] Deployed publicly on a stable URL, accessible from iOS Safari and Android Chrome

### Out of Scope

- Native mobile app — browser-based removes install friction for co-located players
- Voice/video chat — players are in the same room physically
- English UI — Arabic-first; English deferred to Phase 3
- Monetization — revenue features deferred to Phase 3
- Public question submissions — requires moderation pipeline, deferred to Phase 2
- Persistent player stats — requires accounts, optional for Phase 1
- Draw & Guess / Bluffing modes — Phase 2 features
- Audience Mode — Phase 2 feature

## Context

- **Market:** Arabic-speaking Gulf (Saudi Arabia, UAE, Kuwait primary); no locally-built Jackbox equivalent exists
- **Use case:** Co-located groups at homes, diwaniyas, corporate events — all players in the same physical space
- **Builder:** Fully AI-built using Claude agents via GSD workflow
- **PRD source:** `shallelha.md` — validated and rebuilt 2026-04-09
- **Content:** Minimum 200 questions across 6 Arabic categories needed at launch

## Constraints

- **Tech Stack:** Next.js 14 + Node.js/Socket.io + PostgreSQL + Redis + Vercel/Railway — decided, locked
- **Browser:** iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Firefox
- **Latency:** < 200ms from player answer to host screen update
- **Concurrency:** 100 simultaneous rooms target at Phase 1 launch
- **Language:** Arabic (RTL) throughout all Phase 1 UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser-based, no app | Eliminates install friction for co-located players | — Pending |
| 4-character room code | Short enough to type on a phone in seconds | — Pending |
| Redis for room state | Ephemeral, in-memory speed; rooms don't need persistence | — Pending |
| PostgreSQL for questions | Structured, queryable; questions are permanent data | — Pending |
| Vercel + Railway | Zero-config Next.js + managed Node/Redis/PostgreSQL | — Pending |
| Cloudinary for media | Native blurring transforms + audio hosting | — Pending |
| NextAuth.js for auth | OAuth (Google) + magic link; optional for Phase 1 players | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after initialization*
