---
phase: 12
phase_name: User Profiles + Persistent Leaderboards
status: ready
created: 2026-04-21
covers: REQ-007, REQ-008
---

# Phase 12 Context — User Profiles + Persistent Leaderboards

## Phase Goal

Players and hosts have persistent identities with game history, stats, and a social leaderboard — creating the retention loop that makes groups return weekly.

## Requirements Covered

### REQ-007: Progressive Web App (PWA) with Offline Question Packs
- AC-007-1: Valid `manifest.json` — name "شعللها", display "standalone", theme_color, icons 192x192 + 512x512
- AC-007-2: Service worker registered on first load; caches static assets + question API responses
- AC-007-3: On `game_starting`, pre-fetch and cache full question payload
- AC-007-4: "Add to Home Screen" banner on host post-first-game screen; dismissable, 7-day cooldown
- AC-007-5: iOS Safari manual install guide (Share → Add to Home Screen) with visual guide
- AC-007-6: Lighthouse PWA score >= 90
- AC-007-7: Socket reconnection overlay "جاري إعادة الاتصال..." + questions render from cache

### REQ-008: Avatar System (Gulf-Themed Player Identity)
- AC-008-1: Avatar Builder step in join flow: 3 face shapes, 4 headwear (غترة, حجاب, كاب, none), 5 color palettes
- AC-008-2: Avatar config stored in localStorage (key: `shallelha_avatar`), auto-loaded on return
- AC-008-3: Avatar data transmitted via `player:join` socket event, stored in Redis room player object
- AC-008-4: Host lobby + in-game player indicators display avatars alongside names
- AC-008-5: Final podium animation uses player avatars for top 3
- AC-008-6: Avatar builder adds no more than 15 seconds to join flow
- AC-008-7: Avatars rendered as CSS/SVG (no raster images)

## Deliverables (from ROADMAP.md)

1. **Player profile page** — display name, avatar (emoji selection), total games played, win count, best streak, favorite category
2. **Persistent game history** — after each game, session summary saved to PostgreSQL
3. **"Join with profile" flow** — anonymous players can claim stats by signing in
4. **Global leaderboard** — weekly and all-time rankings; filterable by category
5. **Room leaderboard** — recurring groups personal history head-to-head
6. **Profile card shareable to WhatsApp** — "لعبت ٢٣ مرة وفزت ٨ مرات على شعللها"
7. **PWA (manifest, service worker, question pre-cache, A2HS prompt, iOS guide)**
8. **Avatar system (Gulf-themed SVG builder, localStorage, socket integration)**

## What Already Exists (from Phase 11)

### Prisma Schema (already in place)
- `User` model has: displayName, avatarEmoji, totalGamesPlayed, winCount, bestStreak, favoriteCategory
- `GameSession` model: roomCode, hostId, playedAt, categoryId, categoryName, playerCount, winnerId
- `PlayerGameResult` model: gameSessionId, userId, playerName, playerEmoji, score, rank, isWinner

### Existing Features
- Profile page at `/profile` — shows avatar, display name, stats grid (2x2), game history list
- Game history saving works (Phase 11-05: `saveGameHistory` in game.ts)
- Post-game player screen with leaderboard, rank badge, share button (Phase 11-06)
- OG image generation at `/api/og/result` — edge runtime, Arabic Cairo font, WhatsApp + Snapchat variants
- WhatsApp share button + QR code on host lobby (Phase 11-03)
- Google OAuth via NextAuth (exists since Phase 2)

### What's New in Phase 12
- **PWA infrastructure**: manifest.json, service worker, question pre-caching, A2HS prompt, iOS guide — entirely new
- **Avatar system**: SVG composable avatar builder (face + headwear + colors) — replaces current emoji-only avatar
- **Global leaderboard**: New page/component with weekly + all-time rankings, category filter — new
- **Room leaderboard**: Per-room recurring group history — new (needs schema consideration)
- **"Join with profile" flow**: Anonymous stat claiming on sign-in — new auth flow
- **Profile card sharing**: WhatsApp-optimized profile summary card — extends existing OG route
- **Enhanced profile page**: Upgrade existing `/profile` to show richer data, avatar builder integration

## Tech Stack

- **Frontend**: Next.js 14 (App Router, RSC), Tailwind CSS, deployed on Vercel
- **Backend**: Node.js + Express + Socket.io, deployed on Railway
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (room state, player data)
- **Auth**: NextAuth with Google OAuth
- **Image Gen**: @vercel/og (edge runtime)
- **Assets**: Cloudinary (existing)

## Key Decisions

1. **Avatar: SVG composable vs emoji** — REQ-008 requires SVG/CSS composable avatars (face shape + headwear + color palette). Current `avatarEmoji` field stores a single emoji. Need to add structured avatar data field.
2. **PWA: next-pwa vs custom service worker** — REQ-007 suggests `next-pwa` package. Need to evaluate compatibility with Next.js 14 App Router.
3. **Leaderboard queries**: Global leaderboard needs efficient aggregation queries on PlayerGameResult. Consider materialized views or periodic aggregation.
4. **Room leaderboard**: Need to track recurring group identity. Could use roomCode history or player-pair frequency analysis.
5. **Anonymous stat claiming**: When an anonymous player signs in, match by playerName + session timestamps to retroactively link results.
