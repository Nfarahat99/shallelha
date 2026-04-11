# Requirements: Sha'lelha (شعللها)

**Defined:** 2026-04-09
**Core Value:** Any Arabic-speaking group can start a game session in under 60 seconds, on any device, with no install.

---

## v1 Requirements (MVP — Public Launch)

### Room System

- [ ] **ROOM-01**: Host can create a game room and receive a unique 4-character alphanumeric code
- [ ] **ROOM-02**: Player can join a room by entering the code on any mobile browser (no account required)
- [ ] **ROOM-03**: Host sees a live lobby listing all connected players before the game starts
- [ ] **ROOM-04**: Room supports 2 to 8 players simultaneously
- [ ] **ROOM-05**: Player who disconnects can rejoin within 10 seconds without losing game state
- [ ] **ROOM-06**: Host can start, pause (between questions), and end the game

### Gameplay — Question Types

- [ ] **GAME-01**: Multiple Choice questions display 4 options with a configurable countdown timer (15–30s)
- [ ] **GAME-02**: Media Guessing questions show a progressively un-blurring image or play an audio clip
- [ ] **GAME-03**: Free Text Entry questions collect open-ended player answers for group display and voting
- [ ] **GAME-04**: Questions are served in sequence from a selected category/pack
- [ ] **GAME-05**: Correct answer is revealed on host screen after each question with animation

### Gameplay — Scoring & Leaderboard

- [ ] **SCORE-01**: Points are awarded based on answer correctness and response speed
- [ ] **SCORE-02**: Streak multiplier activates after 3+ consecutive correct answers
- [ ] **SCORE-03**: Live leaderboard is shown on host screen after each question
- [ ] **SCORE-04**: Final podium (top 3 players) with animation is shown at game end

### Gameplay — Lifelines

- [ ] **LIFE-01**: Each player receives one "Double Points" lifeline per game (2x points on next question)
- [ ] **LIFE-02**: Each player receives one "Remove Two" lifeline per game (eliminates 2 wrong answers on multiple choice)
- [ ] **LIFE-03**: Each player receives one "Freeze Opponent" lifeline per game (targets one player, blocks their answer for that question)
- [ ] **LIFE-04**: Used lifelines are visually marked as spent on the player controller

### Real-Time Sync

- [ ] **SYNC-01**: Player answers appear on host screen within 200ms of submission
- [ ] **SYNC-02**: All players see the same question state simultaneously (no race conditions)
- [ ] **SYNC-03**: WebSocket connections recover automatically on brief network drops

### Arabic UI & RTL

- [ ] **RTL-01**: All UI text is in Arabic with correct RTL layout
- [ ] **RTL-02**: Host display is optimized for landscape (TV/PC, 16:9)
- [ ] **RTL-03**: Player controller is optimized for mobile portrait mode
- [ ] **RTL-04**: Arabic typography renders correctly on iOS Safari and Android Chrome
- [ ] **RTL-05**: Countdown timers, animations, and score displays are RTL-aware

### Content & Admin

- [ ] **ADMIN-01**: Admin can create, read, update, and delete question categories
- [ ] **ADMIN-02**: Admin can create, read, update, and delete questions (text, image, audio)
- [ ] **ADMIN-03**: Questions have a draft → approved → live workflow (not visible in-game until approved)
- [x] **ADMIN-04**: Admin dashboard shows basic analytics: questions played, wrong answer rates
- [ ] **ADMIN-05**: Minimum 200 approved questions across 6 categories available at launch

### Infrastructure & Deployment

- [ ] **INFRA-01**: Application is deployed to a public URL (Vercel frontend + Railway backend)
- [ ] **INFRA-02**: Supports 100 simultaneous game rooms at launch
- [ ] **INFRA-03**: Works on iOS Safari 16+, Android Chrome 110+, Desktop Chrome/Firefox
- [ ] **INFRA-04**: Environment variables and secrets managed securely (not hardcoded)

---

## v2 Requirements (Phase 2 — Expansion)

### Advanced Game Modes

- **MODE-01**: Draw & Guess — one player draws a word on phone; others guess in real time
- **MODE-02**: Bluffing — players write fake answers; group votes for the real one

### Audience Mode

- **AUD-01**: Unlimited audience members can join with a separate viewer link
- **AUD-02**: Audience can vote on Free Text answers
- **AUD-03**: Audience can send one lifeline to a favorite player per game

### AI Content

- **AI-01**: Host can request AI-generated questions by category in real time (GPT-4o)
- **AI-02**: AI-generated questions go into moderation queue before going live

### User Accounts

- **AUTH-01**: Player can sign in with Google or email magic link
- **AUTH-02**: Signed-in player tracks wins, games played, and favorite categories
- **AUTH-03**: Player can select an Arabic-themed avatar

---

## v3 Requirements (Phase 3 — Monetization)

### Freemium & Store

- **MON-01**: Free tier: 6 players max, 3 categories, ads
- **MON-02**: Premium tier: 8 players, all categories, no ads, drawing mode
- **MON-03**: Themed question packs purchasable in a store (Ramadan, Khaleeji, Anime)
- **MON-04**: Payment via Stripe (international) and Moyasar (Saudi mada/STC Pay)

### B2B / Events

- **B2B-01**: White-label option: custom logo/colors for corporate clients
- **B2B-02**: Bulk question import via Excel/CSV
- **B2B-03**: Post-event engagement report

### Social Sharing

- **SOCIAL-01**: One-click share of game result card to X, TikTok, Instagram Stories

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app (iOS/Android) | Browser removes install friction; app adds maintenance overhead |
| Voice/video chat | Players are co-located; not needed |
| English UI (Phase 1) | Arabic-first; deferred to Phase 3 |
| Public question submissions | Requires moderation pipeline; Phase 2+ |
| Persistent player stats without account | Accounts are optional in Phase 1 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01–06 | Phase 1 | Pending |
| GAME-01–05 | Phase 2 | Pending |
| SCORE-01–04 | Phase 2 | Pending |
| LIFE-01–04 | Phase 3 | Pending |
| SYNC-01–03 | Phase 1 | Pending |
| RTL-01–05 | Phase 2 | Pending |
| ADMIN-01–05 | Phase 4 | Pending |
| INFRA-01–04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initialization*
