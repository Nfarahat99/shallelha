# Sha'lelha (شعللها) — Product Requirements Document

> **"Ignite it"** — An Arabic-first interactive group gaming platform that merges local cultural identity with Jackbox-style social gameplay.

---

## 1. Product Overview

Sha'lelha is a real-time multiplayer party game platform built for the Arabic-speaking market. Players join game rooms from their phones — no app install required — while a host controls the game on a shared screen (TV or PC). The platform goes beyond multiple-choice trivia: it supports creativity, drawing, bluffing, and audience participation, with full Arabic UI and culturally relevant content.

**Core insight:** The Arabic market has no locally-built equivalent to Jackbox Games. Sha'lelha fills that gap with Arabic language support, Khaleeji cultural references, and gameplay mechanics tailored for group gatherings (family game nights, diwaniyas, corporate events).

---

## 2. Product Identity

| Field | Value |
|-------|-------|
| **Name** | Sha'lelha (شعللها) |
| **Tagline** | شعللها — أوقد المنافسة (Ignite the Competition) |
| **Primary Language** | Arabic (RTL) |
| **Secondary Language** | English (future) |
| **Target Regions** | Gulf (Saudi Arabia, UAE, Kuwait) → broader Arab world |
| **Target Users** | Groups of 2–8 players, age 15–40, gathered in the same space |
| **Platform** | Browser-based (no app install) |

---

## 3. Tech Stack (Decided)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR for host display, React ecosystem, RTL support |
| **Player UI** | Next.js (mobile-first routes) | Same codebase, no separate app needed |
| **Real-time** | Socket.io (Node.js) | Industry standard for WebSocket game rooms |
| **Backend API** | Node.js + Express | Unified JS stack, easy Socket.io integration |
| **Primary DB** | PostgreSQL + Prisma ORM | Structured data: questions, users, game history |
| **Cache / State** | Redis | Active room state, session management, pub/sub |
| **Auth** | NextAuth.js | OAuth (Google) + magic link email |
| **Styling** | Tailwind CSS | RTL support, rapid UI development |
| **Media Storage** | Cloudinary | Player drawings, blurred images, audio clips |
| **Deployment** | Vercel (frontend) + Railway (Node + Redis + PostgreSQL) | Simple, scalable, low DevOps overhead |
| **AI** | OpenAI API (GPT-4o) | Real-time question generation (Phase 2) |

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────┐
│                  Vercel (Frontend)                 │
│   Host Display (Next.js SSR)                       │
│   Player Controller (Next.js, mobile-first)        │
└──────────────────┬─────────────────────────────────┘
                   │ WebSocket (Socket.io)
┌──────────────────▼─────────────────────────────────┐
│              Railway (Node.js Backend)             │
│   Socket.io Server ← Room State Machine            │
│   REST API (questions, auth, admin)                │
│   Redis ← Active rooms, sessions, pub/sub          │
│   PostgreSQL ← Persistent data                     │
└────────────────────────────────────────────────────┘
```

**Event-driven flow:**
1. Host creates room → backend generates 4-char code, stores room state in Redis
2. Players join via phone → Socket.io connects them to room
3. Host starts game → state machine drives question sequence
4. Player answers → validated server-side, scores updated in Redis
5. Round ends → results broadcast to all clients simultaneously

---

## 5. Development Roadmap

### Phase 1: MVP (Public Launch Ready)

**Goal:** A polished, publicly launchable platform where any group can create a room and play a complete game session. Arabic UI, stable real-time gameplay, at least 3 question types, and a functional admin dashboard for content management.

#### 5.1 Room System
- Host creates a room → receives a **4-character alphanumeric code**
- Players join from their phone browser using the code — no account required
- Supports **2 to 8 players** per room
- Host sees a lobby screen listing connected players in real time
- Host controls game start, question pace, and end-game
- Graceful reconnection: players who disconnect can rejoin using the same code

#### 5.2 Core Question Types

| Type | Description |
|------|-------------|
| **Multiple Choice** | 4 options, countdown timer (15–30s configurable), correct answer revealed with animation |
| **Media Guessing** | Blurred image that gradually clears over 20s, or audio clip plays — players type/select answer |
| **Free Text Entry** | Players write their own answers; answers displayed anonymously for group voting |

#### 5.3 Scoring & Leaderboard
- Points based on speed + correctness for timed questions
- Live leaderboard visible on host screen after each question
- Final podium animation at game end
- Score multipliers for streaks (3+ correct in a row)

#### 5.4 Lifelines (Power-ups)
Each player gets one of each per game:

| Lifeline | Effect |
|----------|--------|
| **Double Points** | 2x points on the next question |
| **Remove Two** | Eliminates 2 wrong answers (multiple choice only) |
| **Freeze Opponent** | Target player cannot answer the current question |

#### 5.5 Arabic UI & RTL Support
- Full right-to-left layout for all screens
- Arabic typography (Cairo or Noto Naskh Arabic font)
- All question content, labels, and UI strings in Arabic
- Host display designed for TV/large screen (16:9 landscape)
- Player controller designed for mobile portrait mode

#### 5.6 Admin Dashboard
- CRUD for categories and questions (text, image upload, audio upload)
- Question approval workflow (draft → approved → live)
- Basic analytics: questions played, wrong answer rates, popular categories
- User management (ban/unban players)

#### 5.7 Phase 1 Success Criteria
- [ ] A group of 8 players can complete a full game session without errors
- [ ] Room code join works on iOS Safari, Android Chrome
- [ ] Latency between answer and host screen update < 200ms
- [ ] Arabic RTL renders correctly on all screen sizes
- [ ] Admin can add a new question and see it appear in-game
- [ ] Deployed publicly with a working URL

---

### Phase 2: Expansion & Innovation

**Goal:** Introduce creative gameplay modes that have no Arabic market equivalent, plus audience participation and AI-generated content.

#### 6.1 Advanced Game Modes

| Mode | Mechanic |
|------|----------|
| **Draw & Guess (ارسم وخمن)** | One player draws a word on their phone; others guess in real time |
| **Bluffing (كاذب أو صادق)** | Players write convincing fake answers; group votes for the "real" one |

#### 6.2 Audience Mode
- Unlimited viewers join as "Audience" with a separate link
- Audience votes on free-text answers
- Audience can send a lifeline to a favorite player (once per game)
- Audience count displayed on host screen

#### 6.3 AI Content Generation
- Host requests new questions by category in real time
- GPT-4o generates questions in Arabic, stored for review before going live
- Moderation queue in admin dashboard

#### 6.4 User Profiles & Accounts
- Optional Google / email sign-in
- Track wins, games played, favorite categories
- Avatar selection (Arabic-themed)

---

### Phase 3: Differentiation & Monetization

**Goal:** Transform into a sustainable Freemium business. Add B2B offering for events and corporates.

#### 7.1 Freemium Model

| Tier | Limits | Price |
|------|--------|-------|
| **Free** | 6 players max, 3 categories, ads | Free |
| **Premium** | 8 players, all categories, no ads, drawing mode | SAR 20/month |
| **Event Pack** | Unlimited audience, white-label, custom questions | SAR 200/event |

#### 7.2 Question Packs (Store)
- Themed packs: Ramadan Pack, Khaleeji Trivia, Arabic Cinema, Gaming/Anime
- One-time purchase per pack
- Host applies pack before game starts

#### 7.3 B2B / Events
- White-label: custom logo and colors for corporate clients
- Bulk question import via Excel/CSV
- Post-event report (participant count, engagement score)

#### 7.4 Social Sharing
- Share game result card to X (Twitter), TikTok, Instagram Stories
- Screenshot of funny bluffing answers with watermark

#### 7.5 Payment
- Stripe (international) + Moyasar (Saudi local, mada/STC Pay)

---

## 6. Content Strategy

### Question Categories (Phase 1 Launch Set)
- عام (General Knowledge)
- رياضة (Sports — football focus)
- أفلام ومسلسلات (Movies & Series — Arabic and Gulf productions)
- ثقافة وتاريخ (Culture & History)
- تقنية (Technology)
- ترفيه خليجي (Gulf Entertainment)

### Content Standards
- Questions reviewed by a human before going live
- No political, religious, or sensitive content in public packs
- Difficulty rating per question (سهل / متوسط / صعب)

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Latency** | < 200ms host screen update after player answer |
| **Concurrent rooms** | 100 simultaneous rooms at Phase 1 launch |
| **Player reconnect** | Auto-reconnect within 10s, game continues |
| **Browser support** | iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Firefox |
| **Uptime** | 99.5% during peak hours (evening Gulf time) |
| **RTL rendering** | Pixel-perfect on all target browsers |

---

## 8. Out of Scope (Phase 1)

| Feature | Reason |
|---------|--------|
| Native mobile app | Browser-based is sufficient; app adds maintenance overhead |
| Voice/video chat | Increases complexity, players are co-located anyway |
| Public question submissions | Needs moderation pipeline not in Phase 1 |
| Monetization | Revenue deferred to Phase 3 |
| English language UI | Phase 1 is Arabic-only |
| Persistent player stats | Requires accounts; optional in Phase 1 |

---

## 9. Key Decisions

| Decision | Rationale |
|----------|-----------|
| Browser-based (no app) | Players are co-located; friction of app install kills adoption |
| 4-character room code | Short enough to type on phone in seconds |
| Redis for room state | In-memory speed; rooms are ephemeral (don't need to persist) |
| PostgreSQL for questions | Structured, queryable; questions are permanent data |
| Railway for backend | Supports persistent Node.js + Redis + PostgreSQL in one platform |
| Vercel for frontend | Zero-config Next.js deployment |
| Arabic-first | Target market is underserved; English can come later |
| Cloudinary for media | Handles image transformation (blurring) and audio natively |

---

## 10. Open Questions

- [ ] Will the host need an account to create a room, or can rooms be created anonymously?
- [ ] What is the question bank size at launch? (Minimum viable: 200 questions across 6 categories)
- [ ] Is there a practice/solo mode, or is multiplayer required at all times?
- [ ] Should Free Text answers be voted on by players only, or can the host override?

---

*Last updated: 2026-04-09 — Initial validated PRD*
