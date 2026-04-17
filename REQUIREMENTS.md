# Sha'lelha (شعللها) v2 — Business Requirements Document

**Version:** 2.0  
**Date:** 2026-04-18  
**Status:** Draft — For Development Team  
**Prepared By:** Business Analysis (based on PRODUCT-REVIEW.md + FEATURE-IDEAS.md)  
**Codebase:** https://shallelha.vercel.app  

---

## Table of Contents

1. [Product Brief](#part-1-product-brief)
2. [Phase Requirements](#part-2-phase-requirements)
3. [Non-Functional Requirements](#part-3-non-functional-requirements)
4. [Release Plan](#part-4-release-plan)
5. [Success Criteria and KPIs](#part-5-success-criteria-and-kpis)

---

# PART 1: PRODUCT BRIEF

## 1.1 Executive Summary

Sha'lelha (شعللها) is an Arabic-native, browser-based social party game platform built for the Gulf market (Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman). It positions itself as the Arabic Jackbox Games — a zero-install, phone-as-controller group game that works in family gatherings, friend meetups, diwaniyas, and corporate team-building events.

**v1.0 Status:** Technically complete and live. All 8 build phases shipped. The game engine works: real-time Socket.io, three question types (Multiple Choice, Media Guessing, Free Text voting), 204 Arabic questions across 6 Gulf-relevant categories, Google OAuth for hosts, and a clean co-located multiplayer experience.

**v1.0 Critical Gap:** The product is fully built and publicly invisible. The root URL shows a construction placeholder. Zero users can self-discover or organically enter the product. PMF score is 4/10 — not because the game is bad, but because the front door is locked and the retention loop is absent.

**v2 Mission:** Transform a technically complete but undiscoverable MVP into a product that acquires, retains, and grows users through engineered growth loops, cultural seasonality, and deeper engagement mechanics.

---

## 1.2 Problem Statement

### Primary Problems (from PRODUCT-REVIEW.md)

**Problem 1: The product is invisible (no landing page)**  
The homepage at `/` displays "قيد الإنشاء — Phase 1 foundation". Any organic visitor — from a WhatsApp link, search engine, or word of mouth — cannot discover what the product is, cannot start playing, and has no reason to stay. The entire acquisition funnel is broken at step zero.

**Problem 2: Zero retention loop**  
After a game ends, players and hosts have no reason to return. No player profiles. No persistent scores. No rematch button. No game history. The platform requires the same physical group to re-coordinate from scratch every session. Nothing in the product creates a hook for the next session.

**Problem 3: Content depth insufficient for repeat play**  
204 questions across 6 categories serves a first session well. A group that plays twice a week will exhaust the question pool in 3–4 sessions. There is no host-selectable category system, no user-generated content path, and no content velocity visible to users.

**Problem 4: Host friction before first game**  
Google OAuth is required to create a room. For a casual Friday-night gathering, mandatory OAuth sign-in is a conversion killer. The first session should be frictionless; account creation should be earned by experience, not demanded before it.

**Problem 5: No engineered growth/viral loop**  
Every completed game session is a missed acquisition event. The current sharing mechanism is passive: the host verbally tells people a 4-character code. There is no QR code, no WhatsApp share button, no post-game result card, no deeplink — nothing that turns a satisfied player into a distribution agent.

---

## 1.3 Target Users — 3 Personas

### Persona 1: Khaled — The Host/Organizer
**Demographics:** Male, 22–35, Saudi or Emirati, tech-comfortable, organizes regular gatherings (diwaniya, family night, friend meetup)  
**Situation:** He's the person who pulls out his laptop and connects it to the TV. He found Sha'lelha via WhatsApp or Twitter/X. He wants to start a game fast — not set up accounts, not configure settings.  
**Goals:** Start a game in under 60 seconds. Share the room code easily. Look like the cool one who found a fun activity. Play again with the same group next week.  
**Frustrations with v1.0:** Had to sign in with Google before seeing anything. Join URL is hard to share (small text). No way to pick a category. Game ended with no summary.  
**What v2 must do for Khaled:** Anonymous room creation. One-tap WhatsApp share. QR code on the host screen. Category selection. "Play again" button after the game ends.

### Persona 2: Noor — The Player/Friend Group Member
**Demographics:** Female, 19–30, Saudi, plays on her phone, joins the game via a WhatsApp link from the group chat  
**Situation:** She's in a family gathering. Someone shares a WhatsApp link saying "العب معنا". She taps it, enters her name, and jumps into the game. She's competitive but mostly here for the social laughs.  
**Goals:** Join in 10 seconds. Know her rank during the game, not just her score. Share her result to the WhatsApp group after to brag (or laugh at herself). Have a reason to come back next week.  
**Frustrations with v1.0:** Never knew her rank — only her score. Game ended and she was dropped at a dead `/join` page. No way to share her performance.  
**What v2 must do for Noor:** Real-time rank visibility (not just score). Post-game result card shareable to WhatsApp. A "play again" loop that keeps the group together. Spectator mode so latecomers can still participate.

### Persona 3: Mohammed — The Corporate Event Planner
**Demographics:** Male, 30–45, HR Manager or Event Coordinator at a Gulf company (Saudi or UAE), planning a team-building event for 20–100 employees  
**Situation:** He's been told by leadership to "do something fun" for the quarterly all-hands. He's looking for an Arabic-first alternative to Kahoot that doesn't feel like a training tool.  
**Goals:** Run a structured event for 50+ employees. Have the company branding on screen. Export results as a PDF. Get an invoice (not a credit card payment). Have icebreaker question sets ready.  
**Frustrations with v1.0:** No B2B features. Hard player limit of 8. No branding options. No export. OAuth-only login is unsuitable for event setup.  
**What v2 must do for Mohammed:** Spectator mode to handle overflow. Tournament engine for department competitions. B2B tier with branding, bulk codes, and PDF export (Sprint 5+).

---

## 1.4 Success Metrics — Baselines and Targets

| Metric | v1.0 Baseline | v2 Sprint 1 Target | v2 Full Target |
|--------|--------------|-------------------|----------------|
| Landing page conversion (visit → room created) | ~0% (placeholder page) | 15% | 25% |
| Time-to-first-game for new host | Unknown (no data) | < 90 seconds | < 60 seconds |
| Sessions per group per month | ~1 (no retention loop) | 2–3 | 5+ |
| WhatsApp share rate (games with at least 1 share) | 0% | 30% | 60% |
| Post-game screen engagement (play again click) | 0% (no post-game screen) | 25% | 40% |
| Monthly active rooms (MAR) | Unknown | 100 | 1,000+ |
| Player rank visibility score (NPS proxy) | Not tracked | — | Baseline established |
| Content question pool | 204 | 500+ | 1,000+ (UGC included) |
| PWA install rate | 0% | — | 10% of returning hosts |

---

## 1.5 Competitive Landscape Summary

| Competitor | Type | Arabic Support | Party Format | Key Weakness vs. Sha'lelha |
|-----------|------|----------------|-------------|---------------------------|
| Jackbox Games | PC/Console download | None | Yes | Requires purchase, install, English-only |
| Kahoot | Browser/App | Partial (edtech only) | No — educational format | Not entertainment; corporate/school tool |
| Netflix Party Games | Browser | English-first | Yes | No Arabic, no mobile-as-controller |
| Jawaker | App | Arabic-first | Baloot/Tarneeb only | Card games only; no party trivia format |
| Spacetoon x Kahoot | Browser | Arabic | No | Educational, not social entertainment |

**Competitive Whitespace:** No Arabic-native social party game platform exists at scale in the Gulf. Sha'lelha's combination of Arabic-first content, zero-install browser play, and co-located phone-as-controller format occupies an uncontested category. The moat is cultural content quality and brand recognition — not technology.

---

# PART 2: PHASE REQUIREMENTS

> Each requirement is linked to the friction points from PRODUCT-REVIEW.md it addresses. See cross-reference column.

---

## REQ-001: WhatsApp-Native Room Sharing Flow

**Arabic Name:** مشاركة الغرفة عبر واتساب  
**Requirement ID:** REQ-001  
**Priority:** P0 — Sprint 1  
**ICE Score:** 12.5 (Rank #2 from FEATURE-IDEAS.md: PD-01)  
**Addresses Friction Points:** #3 (no QR code), #1 (invisible product — sharing is the fix), #2 (host must share manually)

### User Stories

1. As a host, I want to share a pre-written Arabic WhatsApp message with the room join link, so that my friends can join in one tap without typing a code.
2. As a host showing the game on a TV, I want a large QR code on the lobby screen, so that players in the room can scan it with their phone instead of typing the code.
3. As a player who received a WhatsApp link, I want to tap it and land directly on the room join screen with the code pre-filled, so that I can join without manual entry.
4. As a host on a mobile phone, I want a native share sheet (iOS/Android) to appear when I tap "Share Room," so that I can share via any app — not just WhatsApp.
5. As a player in a game, I want to see a "Send to your friends" nudge that lets me forward the join link to my own WhatsApp contacts, so that I can bring in more players.

### Acceptance Criteria

- AC-001-1: A "Share on WhatsApp" button is visible on the host lobby screen (`/host/[code]`) at all times during the lobby phase.
- AC-001-2: Tapping the WhatsApp button opens a `wa.me/?text=` link pre-populated with a message in Arabic: "تعال العب معنا! كود الغرفة: {CODE} — شعللها 🎮 {JOIN_URL}".
- AC-001-3: A QR code is displayed on the host lobby screen alongside the 4-character room code. The QR code encodes `https://shallelha.vercel.app/join/{code}` and is at minimum 200×200px in rendering size.
- AC-001-4: Navigating to `/join/{code}` (the deep link) pre-fills the room code input field so the user only needs to enter their name.
- AC-001-5: The QR code is generated server-side or at the edge and is delivered as an inline SVG or a cacheable PNG to avoid per-request latency.
- AC-001-6: On mobile browsers that support the Web Share API, a "Share" button triggers the native OS share sheet as a fallback/primary mechanism.
- AC-001-7: The Open Graph meta tags for `/join/{code}` render a branded preview card ("Join the Sha'lelha game! Room: {CODE}") when the URL is pasted into WhatsApp.
- AC-001-8: On the player end-game screen, a "Invite friends to next game" button appears that shares the same join URL.

### Technical Requirements

- **New API route:** `GET /api/rooms/[code]/qr` — returns a QR code SVG/PNG for the given room code. Uses the `qrcode` npm package. Cache TTL: 24 hours.
- **Frontend:** `QRCodeDisplay` component on `HostLobbyScreen`. Renders QR code image + "Share on WhatsApp" button + Web Share API button.
- **Deep link handling:** Modify `/join/[code]/page.tsx` to accept the room code from URL path param and pre-populate the code input field on mount.
- **OG meta tags:** Add dynamic `<meta property="og:*">` tags to `/join/[code]` page using Next.js `generateMetadata()`.
- **WhatsApp share URL format:** `https://wa.me/?text=` — no WhatsApp Business API required; this is standard share protocol.

### Dependencies

- None — this is the first item in Sprint 1 and has no upstream dependencies.

### Effort Estimate

1–2 days (from FEATURE-IDEAS.md PD-01 assessment)

### Key Assumptions to Validate

- Deep links to `/join/XXXX` open correctly on iOS Safari and Android Chrome without being blocked by WhatsApp's link preview behavior.
- The pre-written Arabic WhatsApp message resonates culturally and does not feel robotic or spammy.
- QR code scanning rate is sufficient in Gulf social gatherings (hypothesis: younger Gulf audiences are QR-comfortable from COVID-era restaurant menus).

### Risks

- iOS Safari handles Web Share API differently across versions — test on iOS 16, 17, and 18 specifically.
- WhatsApp may truncate long URLs in preview. Keep join URL under 100 characters.
- QR code sizing on TV screens: test at 1080p and 4K to ensure scanability from 2–3 meters.

---

## REQ-002: Anonymous Room Creation (No-Auth Host Mode)

**Arabic Name:** إنشاء غرفة بدون تسجيل دخول  
**Requirement ID:** REQ-002  
**Priority:** P0 — Sprint 1  
**ICE Score:** 10.0 (Rank #3 from FEATURE-IDEAS.md: PM-05)  
**Addresses Friction Points:** #2 (Google OAuth required), #1 (conversion killer at top of funnel)

### User Stories

1. As a new host on a Friday night, I want to create a game room without signing in, so that I can start playing with my friends immediately without any account friction.
2. As an anonymous host, I want all host controls (start game, advance questions, end game) to work normally, so that my guests have the same experience as an authenticated game.
3. As an anonymous host who just finished a game, I want to see my game stats (scores, top moments) and be shown a "Create Account to save your history" prompt, so that I have a compelling reason to register.
4. As a returning host who created anonymously last week, I want to sign in and see my previous game sessions (if I was prompted to save), so that account creation felt worthwhile.
5. As a developer/admin, I want anonymous rooms to be IP-rate-limited to prevent abuse, so that the removal of OAuth does not create a room spam vector.

### Acceptance Criteria

- AC-002-1: A "Create Room" button on the landing page (and `/host` page) is available without requiring sign-in.
- AC-002-2: When an unauthenticated user creates a room, a `guestHostToken` (UUID) is generated, stored in `localStorage` and an httpOnly cookie, and bound to the room in Redis as `guestHostId`.
- AC-002-3: All host game controls (start game, advance question, reveal answer, end game) are fully functional with the guest token.
- AC-002-4: Admin-only features (custom question pack selection, analytics, question creation) require authentication and show a "Sign in to unlock" prompt.
- AC-002-5: After game end, a modal is displayed: "بقيت سجلاتك لمدة 24 ساعة — أنشئ حسابًا لحفظها دائمًا" with Google OAuth and magic link options.
- AC-002-6: Guest room sessions expire via Redis TTL after 24 hours with no DB writes required.
- AC-002-7: IP-based rate limiting for anonymous room creation: maximum 3 rooms per IP per hour.
- AC-002-8: Authenticated hosts retain all existing behavior — no regression on current Google OAuth flow.

### Technical Requirements

- **New Redis field:** `guestHostId` (UUID string) on room object, alongside existing optional `hostId` for authenticated users.
- **Guest token generation:** `POST /api/rooms/create` — when `session` is null, generate UUID, set httpOnly cookie `guestHostToken`, store in Redis room object.
- **Middleware update:** `hostAuthMiddleware` must accept either a valid NextAuth session OR a valid `guestHostToken` cookie that matches the room's `guestHostId`.
- **Rate limiting:** Extend existing per-socket rate limiter to include IP-based anonymous room creation limit (3/hour using Redis `INCR` + `EXPIRE`).
- **Post-game modal component:** `GuestUpgradeModal` — shown on game end when `isGuest === true`. Offers Google OAuth or magic link sign-in. Passes `guestHostId` to merge session on auth completion.
- **Redis TTL:** Set `EXPIRE room:{code}` to 86400 (24 hours) for guest-created rooms.

### Dependencies

- REQ-001 should be complete or in parallel — the landing page CTA depends on both anonymous rooms and the landing page existing.

### Effort Estimate

2 days (from FEATURE-IDEAS.md PM-05 assessment)

### Key Assumptions to Validate

- Hosts who play anonymously will convert to accounts when shown game history and told it will be lost. Target: 20% conversion from guest to registered host.
- Anonymous room abuse can be managed with IP-based limits equivalent to current per-socket limits.
- Removing the auth gate does not create admin content pipeline abuse (admin dashboard remains Google-OAuth-only).

### Risks

- `localStorage` + httpOnly cookie dual storage: if cookies are cleared between sessions, the guest loses host controls for an in-progress room. Mitigate: refresh cookie on every host action.
- Privacy compliance: guest tokens must not be personally identifiable. UUIDs are sufficient; do not log IPs alongside tokens.

---

## REQ-003: Share-to-Unlock Viral Mechanic

**Arabic Name:** مشاركة النتيجة — ميكانيكية الانتشار  
**Requirement ID:** REQ-003  
**Priority:** P0 — Sprint 1  
**ICE Score:** 12.5 (Rank #1 from FEATURE-IDEAS.md: PM-04)  
**Addresses Friction Points:** #1 (invisible product — sharing is acquisition), #6 (game end screen is minimal), #5 (no "play again" flow)

### User Stories

1. As a player who just finished a game, I want to see a branded result card showing my rank, score, and best streak, so that I can share it to my WhatsApp group and brag.
2. As a player who finished last, I want a "funny loser" card variant, so that I can still share my result for laughs without feeling embarrassed.
3. As a host who just ran a game, I want a "Room Recap" card showing the funniest Free Text answers and top moments, so that I can share the group's highlights to our WhatsApp chat.
4. As a non-player who receives a result card on WhatsApp, I want to tap the card and land on the Sha'lelha homepage with a clear CTA, so that I can immediately understand the product and create my own room.
5. As a product owner, I want every shared card to include the game's `deeplink` URL, so that every share event is a user acquisition event with a traceable referral source.

### Acceptance Criteria

- AC-003-1: After every game ends, a "Share your result" screen is shown to players (not just the host) before the dead-end `/join` redirect.
- AC-003-2: The result card includes: player rank (e.g., "المركز 2 من 7"), total score, best streak count, platform name "شعللها", and the URL `shallelha.vercel.app`.
- AC-003-3: The result card is generated as a PNG image using Vercel OG Image (`@vercel/og`) at a `/api/og/result` edge route.
- AC-003-4: The PNG card is formatted for WhatsApp sharing (1:1 ratio, 1200×1200px) and for Instagram Stories (9:16 ratio, 1080×1920px). The user selects which format via a toggle.
- AC-003-5: A "Share on WhatsApp" button uses `wa.me/?text=` with the result card URL and a message: "حصلت على المركز {RANK} في شعللها! العب معنا: {DEEPLINK}".
- AC-003-6: The host's Room Recap card includes: top 3 players, funniest Free Text answer (most votes), and the game date.
- AC-003-7: Share events are tracked via a `POST /api/analytics/share` event counter (sessionId, platform, cardType) to measure uptake.
- AC-003-8: The deeplink on every card points to `shallelha.vercel.app/?ref=share` so acquisition events from sharing are distinguishable in analytics.

### Technical Requirements

- **New API endpoint:** `POST /api/sessions/{sessionId}/recap` — generates structured JSON: `{ players: [...], topMoments: [...], funniest FreeTextAnswer: {...}, hostRecap: {...} }`. Reads from game session data in Redis or DB.
- **New edge route:** `GET /api/og/result?rank=2&score=4500&streak=5&name=Noor` — returns a branded PNG using `@vercel/og`. Two templates: player card (1:1) and Instagram card (9:16).
- **New edge route:** `GET /api/og/recap?sessionId=abc` — returns host room recap PNG.
- **Frontend components:** `PostGameShareScreen` (replaces current minimal end screen for players). `HostRecapCard` on host post-game view.
- **Share analytics:** `POST /api/analytics/share` — body `{ sessionId, platform: 'whatsapp|instagram|copy', cardType: 'player|recap' }`. Increment Redis counter.

### Dependencies

- REQ-001 (WhatsApp sharing button pattern is already established)
- A real post-game screen requires the game session data to persist in Redis or DB for at least 10 minutes after game end.

### Effort Estimate

2–3 days (from FEATURE-IDEAS.md PM-04 assessment)

### Key Assumptions to Validate

- Players are willing to share their score/rank publicly. Design for both bragging mode and self-deprecating humor mode.
- Result cards generate curiosity clicks from non-players who receive them via WhatsApp.
- Deep links to `/join` work correctly on iOS Safari and Android Chrome without login walls blocking the destination.

### Risks

- `@vercel/og` has a 30-second edge function limit; ensure recap JSON generation is fast (< 500ms).
- Free Text answers may contain inappropriate content — sanitize all user-generated strings that appear in shareable cards.
- Instagram Stories card dimensions may not render correctly in all WhatsApp preview scenarios. Test on iOS WhatsApp and Android WhatsApp separately.

---

## REQ-004: Real Landing Page

**Arabic Name:** الصفحة الرئيسية الحقيقية  
**Requirement ID:** REQ-004  
**Priority:** P0 — Sprint 1 (prerequisite to all other work)  
**ICE Score:** Not scored in FEATURE-IDEAS.md — this is the #1 recommendation from PRODUCT-REVIEW.md (highest priority of all)  
**Addresses Friction Points:** #1 (dead end homepage — CRITICAL), all other friction is secondary until this is fixed

### User Stories

1. As an organic visitor who found Sha'lelha from a WhatsApp link, I want to immediately understand what the product is in one sentence, so that I decide to stay and play.
2. As a potential host who just landed on the homepage, I want a prominent "أنشئ غرفة" (Create Room) button, so that I can start a game in one click.
3. As a potential player who landed on the homepage, I want a visible "ادخل كود الغرفة" (Enter Room Code) input, so that I can join a game directly from the homepage.
4. As a visitor on mobile, I want the page to load in under 2 seconds and look polished on a phone, so that I don't bounce before seeing the value proposition.
5. As a curious visitor, I want to see screenshots or a short demo clip of the game, so that I understand what the experience looks like before committing.

### Acceptance Criteria

- AC-004-1: The root URL `/` no longer shows "قيد الإنشاء". It shows a real product page.
- AC-004-2: The hero section contains: product name in Arabic, a one-sentence tagline ("لعبة حفلات عربية — العب الآن من هاتفك بدون تحميل"), two primary CTAs ("أنشئ غرفة" for hosts, "انضم للعبة" for players).
- AC-004-3: "أنشئ غرفة" CTA navigates to `/host` (or triggers anonymous room creation if REQ-002 is live).
- AC-004-4: "انضم للعبة" CTA navigates to `/join` or reveals an inline room code input.
- AC-004-5: The landing page includes at least one visual element showing what the game looks like (screenshot, animated GIF, or short looping video clip).
- AC-004-6: Page uses Next.js Static Site Generation (SSG) and loads in under 2 seconds on a 4G mobile connection (Lighthouse performance score ≥ 85).
- AC-004-7: Full RTL layout, Cairo font, Arabic copy throughout.
- AC-004-8: The page includes a "How it works" section with 3 steps: "1. أنشئ غرفة — 2. أرسل الكود لأصحابك — 3. استمتعوا بالأسئلة".

### Technical Requirements

- **Route:** Replace `/app/page.tsx` placeholder with real landing page component.
- **Component:** `LandingHero` — hero section with tagline, dual CTA buttons.
- **Component:** `HowItWorks` — 3-step explainer with icons.
- **Component:** `GamePreview` — screenshot or looping video of gameplay.
- **Performance:** Use `next/image` for all images. Use `next/font` for Cairo (already installed).
- **SEO:** Add `<title>شعللها — لعبة حفلات عربية</title>`, `<meta name="description">`, OG tags.

### Dependencies

- None — this is foundational and must be the first task in Sprint 1.

### Effort Estimate

1–2 days

### Key Assumptions to Validate

- The hero tagline in Arabic is immediately understood by a Saudi 25-year-old with no prior knowledge of the product.
- The dual CTA (host vs. player) is not confusing — users self-identify into the right path.

### Risks

- Design quality matters here — a poor landing page is worse than the current placeholder. Invoke `ui-ux-pro-max` skill for this component.
- First impression of brand identity. Ensure consistent use of Cairo font, color palette, and tone of voice.

---

## REQ-005: Post-Game Screen and Play-Again Flow

**Arabic Name:** شاشة نهاية اللعبة وإعادة اللعب  
**Requirement ID:** REQ-005  
**Priority:** P0 — Sprint 1 (part of retention minimum viable)  
**Addresses Friction Points:** #5 (no play again flow), #6 (game end screen minimal), #4 (players never see rank)

### User Stories

1. As a player who just finished a game, I want to see the full leaderboard (all players, ranked), so that I know where I placed among my friends.
2. As a host, I want a "العب مرة أخرى" (Play Again) button after the game ends, so that I can restart a new game with the same players without leaving the page.
3. As a player on the end screen, I want to see not just my score but my rank ("المركز 3 من 8"), so that I feel the competitive tension that makes party games fun.
4. As a host, I want to see a brief game summary (questions played, average score, most wrong answer), so that I can decide whether to play the same category again or switch.
5. As a player, I want the "play again" to take me back to the lobby waiting screen (not to a blank `/join` page), so that the group doesn't need to re-coordinate.

### Acceptance Criteria

- AC-005-1: The player end-game screen shows: full ranked leaderboard (all players, sorted by score), player's own highlighted rank, total score, and a "شارك نتيجتك" (Share Result) button linking to REQ-003.
- AC-005-2: The host end-game screen shows: final podium (top 3, existing animation), full leaderboard below, host game summary stats, and a "العب مرة أخرى" button.
- AC-005-3: "العب مرة أخرى" resets the current room state (new game, same players who are still connected) without requiring a new room code.
- AC-005-4: Players who are still connected when "Play Again" is triggered receive a `game:reset` socket event and return to the lobby waiting screen automatically.
- AC-005-5: Players who disconnected (left the page) are not automatically included in the next game — they would need to re-join.
- AC-005-6: The winning player's name is highlighted in gold on the leaderboard. Top 3 get visible medal icons (gold, silver, bronze).

### Technical Requirements

- **New socket event:** `game:reset` — emitted by host; transitions all connected player sockets back to `waiting_for_start` state.
- **Server-side:** `RoomService.resetGame(roomCode)` — clears current game state from Redis, retains player list, sets room phase to `lobby`.
- **Frontend (player):** `PlayerEndScreen` component — replace current minimal end screen with full leaderboard + share button.
- **Frontend (host):** Add "Play Again" button to existing `HostEndScreen`. Add full leaderboard panel below podium.

### Dependencies

- REQ-003 (Share button on player end screen links to viral mechanic)

### Effort Estimate

1–2 days

### Key Assumptions to Validate

- "Play Again" retaining the same room code is acceptable. (Alternative: issue a new room code — validate which UX feels more natural.)
- Players want to see the full leaderboard, not just their own rank. (Hypothesis: yes, party game social dynamic requires comparative visibility.)

### Risks

- Redis state reset must be atomic — use a Redis transaction to avoid partial state during reset.
- Players who navigate away between game end and play-again trigger will miss the reset. Implement a 30-second "Play Again countdown" visible to all connected players so they stay on the page.

---

## REQ-006: Spectator Mode

**Arabic Name:** وضع المتفرج  
**Requirement ID:** REQ-006  
**Priority:** P1 — Sprint 2  
**ICE Score:** 8.0 (Rank #6 from FEATURE-IDEAS.md: PD-02)  
**Addresses Friction Points:** Latecomer exclusion; 8-player cap in large Gulf gatherings

### User Stories

1. As a person who arrives at a gathering mid-game, I want to join as a spectator, so that I can follow along on my phone without disrupting the ongoing game.
2. As a spectator, I want to see the live questions, timer, and answer reveals on my phone, so that I feel included in the experience.
3. As a spectator, I want to send emoji reactions that appear on the host screen, so that I can express myself and add energy to the room.
4. As a host, I want spectator joins to not affect the player count or game state, so that adding watchers doesn't break the game.
5. As a player in a room that's full, I want a "Join as Spectator" option instead of an error message, so that I can still be part of the experience.

### Acceptance Criteria

- AC-006-1: When a room is at capacity (8 players), the join flow offers a "Join as Spectator" button instead of an error.
- AC-006-2: Spectators connect via `/join/{code}/spectate` and see a mobile-optimized view: current question, timer, answer options (read-only), and running scores.
- AC-006-3: Spectators receive all game socket events (`question:show`, `answer:reveal`, `score:update`) but their join does not trigger a `player:joined` event.
- AC-006-4: A reaction bar with 5 emoji (🔥 😂 😮 👏 💀) is visible to spectators. Tapping sends a `spectator:react` socket event rate-limited to 1 per 3 seconds per spectator.
- AC-006-5: Reactions float across the host display screen as lightweight overlay elements. Reactions must not obscure question text.
- AC-006-6: Spectator count is shown on the host lobby screen ("3 متفرجون").
- AC-006-7: Spectators do not appear on the player leaderboard.
- AC-006-8: The number of spectators per room is capped at 50 to prevent Redis broadcast overload.

### Technical Requirements

- **Redis room object:** Add `spectators: []` array (socketId + name) and `spectatorCount: number` field.
- **New socket event (client → server):** `spectator:join` — adds spectator to room state.
- **New socket event (client → server):** `spectator:react` — rate-limited; broadcasts `spectator:reaction` to host room.
- **New socket event (server → client):** `spectator:reaction` — received by host screen to render floating emoji.
- **Frontend:** `SpectatorView` component — portrait mobile layout mirroring host display. Reaction bar component at bottom.
- **Route:** `/join/[code]/spectate` page — renders `SpectatorView`.
- **Host screen update:** Floating emoji overlay layer. Spectator count badge.

### Dependencies

- None — spectator mode is self-contained. REQ-001 (WhatsApp sharing) recommended first so spectators can easily receive join links.

### Effort Estimate

3 days (from FEATURE-IDEAS.md PD-02 assessment)

### Key Assumptions to Validate

- Spectators watching on their own phones adds engagement rather than fragmenting attention away from the shared TV screen.
- Emoji reactions from spectators on the host screen are seen as fun energy, not distracting noise.
- Unlimited spectators (capped at 50) does not create scaling problems in the Redis room state.

### Risks

- Emoji reaction broadcast could create socket broadcast spikes if 50 spectators each react simultaneously. Enforce server-side rate limiting at the room level (max 10 reaction events per second across all spectators combined).

---

## REQ-007: Progressive Web App (PWA) with Offline Question Packs

**Arabic Name:** تطبيق ويب تقدمي مع حزم الأسئلة الأوفلاين  
**Requirement ID:** REQ-007  
**Priority:** P1 — Sprint 2  
**ICE Score:** 8.0 (Rank #5 from FEATURE-IDEAS.md: SE-02)  
**Addresses Friction Points:** WiFi reliability in Gulf gathering spaces; low retention (no home screen presence)

### User Stories

1. As a returning host, I want to add Sha'lelha to my home screen, so that I have a one-tap shortcut for future game nights.
2. As a player in a villa with weak WiFi, I want the game questions to still load fast even if the connection is intermittent, so that connectivity issues don't ruin the game.
3. As a host, I want to see a "Add to Home Screen" prompt at an appropriate moment (after my first game), so that I'm invited to install when I've already seen the value.
4. As a player whose connection drops mid-game, I want to see a "Reconnecting..." overlay with graceful state recovery, so that I don't lose my game progress.
5. As a player, I want the Sha'lelha icon on my home screen to feel like a real app (standalone mode, no browser chrome), so that it feels native.

### Acceptance Criteria

- AC-007-1: A valid `manifest.json` is served from the root with fields: `name: "شعللها"`, `short_name: "شعللها"`, `display: "standalone"`, `theme_color`, app icons at 192×192 and 512×512.
- AC-007-2: A service worker is registered on first load. It caches: static assets, the question API response for the current room's game session.
- AC-007-3: When a game transitions to `game_starting`, the player's browser pre-fetches and caches the full question payload for the session.
- AC-007-4: An "Add to Home Screen" banner appears on the host's post-first-game screen. The banner is dismissable and does not reappear for 7 days after dismissal.
- AC-007-5: On iOS Safari, the Add to Home Screen prompt uses a manual instruction ("Tap Share → Add to Home Screen") with a visual guide, since iOS does not support the `beforeinstallprompt` event.
- AC-007-6: Lighthouse PWA score ≥ 90.
- AC-007-7: If the socket connection drops during a game, a "جاري إعادة الاتصال..." overlay appears. Questions continue to render from cache. When reconnected, the player's state is restored from the existing reconnect token mechanism.

### Technical Requirements

- **Package:** Add `next-pwa` to `package.json`. Configure in `next.config.mjs` with `runtimeCaching` rules.
- **Manifest:** `/public/manifest.json` with all required PWA fields.
- **Icons:** Generate and place app icons at `/public/icons/icon-192.png`, `/public/icons/icon-512.png`.
- **Service worker cache rules:** Cache `/_next/static/*` (stale-while-revalidate), `/api/questions/*` (cache-first for game session duration).
- **Question pre-cache:** When `game:starting` socket event is received, dispatch a fetch to `/api/questions/{sessionId}` that the service worker caches.
- **iOS detection:** Detect `navigator.userAgent` for Safari iOS; show custom manual install guide component.

### Dependencies

- None — independent feature.

### Effort Estimate

4 days total (1 day `next-pwa` setup, 2 days question pre-cache architecture, 1 day iOS testing per FEATURE-IDEAS.md SE-02)

### Key Assumptions to Validate

- iOS Safari PWA support is sufficient for the Gulf player base (iOS dominates in Saudi Arabia and UAE).
- Players will add Sha'lelha to their home screen when shown a well-designed prompt.
- Service worker caching of question payloads is within acceptable storage budgets on mobile devices (estimated: < 500KB per question pack).

### Risks

- iOS PWA support has significant limitations vs. Android: no push notifications, no `beforeinstallprompt`, standalone mode has quirks. Test exhaustively on iOS 16, 17.
- Service worker updates can cause stale cache issues. Implement a `skipWaiting` + `clientsClaim` strategy and a version-check mechanism.

---

## REQ-008: Avatar System (Gulf-Themed Player Identity)

**Arabic Name:** نظام الأفاتار — هوية اللاعب  
**Requirement ID:** REQ-008  
**Priority:** P1 — Sprint 2  
**ICE Score:** High delight, moderate effort (PD-04 from FEATURE-IDEAS.md parking lot — recommended Sprint 2 candidate)  
**Addresses Friction Points:** Player engagement and emotional investment in session

### User Stories

1. As a player, I want to choose a Gulf-themed avatar (face shape, headwear, color palette) when I join a room, so that I have a distinct visual identity in the game.
2. As a returning player, I want my avatar to be remembered from my last session, so that I don't have to rebuild it every time.
3. As a host viewing the lobby, I want to see each player's avatar alongside their name, so that the pre-game lobby feels alive and personalized.
4. As a player watching the final podium, I want to see the top 3 players' avatars in the celebration animation, so that the moment feels personal.
5. As a player with a conservative preference, I want avatar options that include traditional Gulf dress (غترة, حجاب, كاب), so that I can represent myself authentically.

### Acceptance Criteria

- AC-008-1: The player join flow (`/join/[code]`) includes an "Avatar Builder" step before lobby entry: 3 face shapes, 4 headwear options (غترة, حجاب, كاب, none), 5 color palettes.
- AC-008-2: Avatar configuration is stored in `localStorage` (key: `shallelha_avatar`) and auto-loaded on return visits.
- AC-008-3: Avatar data is transmitted to the server as part of the `player:join` socket event and stored in the Redis room player object.
- AC-008-4: The host lobby screen and in-game player indicators display avatars alongside names.
- AC-008-5: The final podium animation uses player avatars for the top 3 positions.
- AC-008-6: Avatar builder adds no more than 15 seconds to the join flow (it must feel fast, not laborious).
- AC-008-7: Avatars are rendered as CSS/SVG (not raster images) to avoid asset loading overhead.

### Technical Requirements

- **Frontend component:** `AvatarBuilder` — a step between name entry and lobby join. Uses composable SVG layers.
- **Data model:** Avatar config object: `{ faceShape: 1-3, headwear: 'ghutra|hijab|cap|none', colorPalette: 1-5 }`.
- **localStorage persistence:** Read/write `shallelha_avatar` JSON key.
- **Socket event update:** Add `avatar` field to `player:join` event payload.
- **Redis room player object:** Add `avatar` field.
- **Rendering:** `PlayerAvatar` component — renders SVG avatar from config. Used on lobby screen, in-game indicators, leaderboard, and podium.

### Dependencies

- None — self-contained enhancement to player join flow.

### Effort Estimate

2 days (from FEATURE-IDEAS.md PD-04 assessment)

### Key Assumptions to Validate

- Players will engage with avatar customization rather than skipping it. Make it skippable but visually enticing.
- SVG-based composable avatars render consistently across iOS Safari, Android Chrome, and desktop browsers.

### Risks

- The avatar builder must not create a bottleneck in fast-paced game starts. Make it dismissable and preserve the quick-join option.
- Cultural sensitivity: headwear options must be respectful and accurate. Review with at least 2 Gulf-native users before shipping.

---

## REQ-009: Real-Time Reaction Layer

**Arabic Name:** طبقة التفاعلات الفورية  
**Requirement ID:** REQ-009  
**Priority:** P1 — Sprint 2  
**ICE Score:** Low effort, high delight (PD-05 from FEATURE-IDEAS.md parking lot — recommended Sprint 2 alongside Spectator Mode)  
**Addresses Friction Points:** Low energy/participation during gameplay; silent moments between questions

### User Stories

1. As a player, I want to send a quick emoji reaction (🔥 😂 😮 👏 💀) during gameplay, so that I can express my feelings about a question without speaking.
2. As a host, I want to see player reactions floating on my screen during questions, so that I can feel the room's energy.
3. As a quiet player, I want reactions as a low-friction participation mode, so that I feel included even if I don't vocalize.
4. As a host, I want reactions to be subtle — not blocking the question text or distracting from gameplay.

### Acceptance Criteria

- AC-009-1: A reaction bar with 5 emoji buttons (🔥 😂 😮 👏 💀) is visible at the bottom of the player game screen during active questions.
- AC-009-2: Tapping a reaction button sends a `player:react` socket event to the server. Rate limited to 1 reaction per 3 seconds per player.
- AC-009-3: The host screen renders received reactions as floating emoji that animate upward and fade out over 2 seconds. Reactions do not overlap question text (rendered in a dedicated side channel or bottom area).
- AC-009-4: At the end of each question's answer reveal, a "Most used reaction this question: 🔥 (12 times)" summary is shown briefly.
- AC-009-5: Players who have already answered (in the waiting period before the next question) can react freely without the 3-second throttle.

### Technical Requirements

- **New socket event (client → server):** `player:react` — payload `{ emoji: string }`. Server rate-limits per socket.
- **New socket event (server → all in room):** `reaction:broadcast` — payload `{ playerId, emoji, timestamp }`.
- **Frontend (player):** `ReactionBar` component on `PlayerGameScreen`.
- **Frontend (host):** `ReactionOverlay` component on `HostGameDisplay` — floating animation layer using CSS keyframe animations.
- **Post-question summary:** Aggregate reaction counts in-memory per question; emit `reaction:summary` after answer reveal.

### Dependencies

- REQ-006 (Spectator Mode) — spectator reactions use the same mechanism; build together.

### Effort Estimate

2 days (from FEATURE-IDEAS.md PD-05 assessment)

### Key Assumptions to Validate

- Reactions enhance group atmosphere without creating noise or distraction.
- Players use reactions naturally; they don't feel obligated or confused by them.

### Risks

- High-volume reaction events from large lobbies could strain socket broadcast. Rate limiting at both client and server is mandatory.

---

## REQ-010: Ramadan Mode — Seasonal Event Campaign

**Arabic Name:** وضع رمضان — حملة موسمية  
**Requirement ID:** REQ-010  
**Priority:** P1 — Sprint 3 (content seeding must begin 2–3 months before Ramadan)  
**ICE Score:** 10.0 (Rank #4 from FEATURE-IDEAS.md: PM-01)  
**Addresses Friction Points:** Content depth for repeat sessions; retention through seasonal events

### User Stories

1. As a host during Ramadan, I want to see a "Ramadan Pack" in the category selector, so that my group can play questions themed around the holy month.
2. As a player during Ramadan, I want the game to have a crescent/lantern visual theme, so that the experience feels seasonally appropriate.
3. As a host, I want the Ramadan mode to activate automatically based on the current date, so that I don't need to manually toggle it.
4. As a competitive host, I want to see my group's score on a public "Top Groups This Ramadan" leaderboard, so that we have external competitive motivation.
5. As an admin, I want to create seasonal events in the admin dashboard and assign question categories to them, so that I can manage Ramadan and future seasonal campaigns.

### Acceptance Criteria

- AC-010-1: A `seasonal_events` table is added to the database with fields: `id`, `name`, `slug`, `startDate`, `endDate`, `isActive`, `uiTheme`.
- AC-010-2: Categories can be tagged with a `seasonalEventId` FK — linking them to a seasonal event.
- AC-010-3: When the current date falls within an active seasonal event window, the host game setup screen shows the event's category group (e.g., "حزمة رمضان") as a selectable option.
- AC-010-4: A Ramadan UI theme (crescent/lantern color palette) is applied as a Tailwind CSS namespace (`ramadan:`) when the Ramadan event is active.
- AC-010-5: The theme applies to: landing page, lobby screen, host game display, and player game screen.
- AC-010-6: A public `/leaderboard` page shows top-scoring groups from the current active seasonal event. Updated in near-real-time (5-minute cache).
- AC-010-7: Admin dashboard has a "Seasonal Events" section: create event, assign categories, toggle active/inactive.
- AC-010-8: At least 50 Ramadan-themed Arabic questions are seeded before the event activates.

### Technical Requirements

- **DB migration:** New `SeasonalEvent` table. Add `seasonalEventId` nullable FK to `Category` table.
- **API:** `GET /api/seasonal/active` — returns current active event (or null). Cached at edge for 5 minutes.
- **Admin:** New "Seasonal Events" CRUD section in `/admin`. Extends existing admin dashboard patterns.
- **Frontend:** `SeasonalThemeProvider` component — wraps app, reads active event, applies theme class to root element.
- **Leaderboard:** `GET /api/leaderboard/seasonal?eventId={id}` — returns top 10 groups by aggregate session score during event window. New `/leaderboard` public page.
- **Content pipeline:** Admin can bulk-import CSV of questions tagged with seasonal category.

### Dependencies

- Must be started well before Ramadan (content seeding takes time — begin 8 weeks before the event start date).

### Effort Estimate

3–4 days engineering + content production timeline (from FEATURE-IDEAS.md PM-01 assessment)

### Key Assumptions to Validate

- Ramadan-themed content resonates without being seen as exploitative. Validated with Gulf-native reviewers before seeding.
- The seasonal UI skin adds perceived value. The theme should be tasteful and optional (hosts can disable it).
- Public leaderboard drives competitive engagement between groups.

### Risks

- Ramadan start date varies by year and by country (moon sighting). Use an Islamic calendar library or hardcode annual dates. Build a manual override in admin.
- Content moderation: Ramadan questions touching religious topics require extra review to avoid offense. All Ramadan questions reviewed by a Gulf-native cultural advisor before approval.

---

## REQ-011: User-Generated Question Packs (UGC Content Engine)

**Arabic Name:** حزم الأسئلة من المستخدمين  
**Requirement ID:** REQ-011  
**Priority:** P1 — Sprint 3  
**ICE Score:** 5.0 (Rank #7 from FEATURE-IDEAS.md: PM-03)  
**Addresses Friction Points:** Content depth insufficient for repeat sessions (Weakness #3 from PRODUCT-REVIEW.md)

### User Stories

1. As an authenticated host, I want to create my own question pack, so that I can play custom trivia with my family or friends using inside jokes and personal knowledge.
2. As a creator, I want my private packs to never require approval, so that I can use personal/family content without moderation delay.
3. As a creator, I want to submit my pack to the public library for review, so that other users can benefit from my questions.
4. As a host, I want to select from my own packs and community-approved packs during game setup, so that I'm not limited to the default question pool.
5. As an admin, I want a "Community Submissions" tab in the admin dashboard, so that I can review and approve user-submitted packs efficiently.

### Acceptance Criteria

- AC-011-1: A `/create` page is available for authenticated users: pack name, description, category tag, and a question editor (supports MC, Media Guessing, Free Text types).
- AC-011-2: Private packs (visibility: `private`) are usable immediately by the creator in game setup. No review required.
- AC-011-3: Submitting a pack for community review sets `packStatus: 'pending_review'` and shows it in the admin dashboard "Community Submissions" tab.
- AC-011-4: Approved public packs appear in the category selector for all hosts.
- AC-011-5: The host game setup screen has a "My Packs" section alongside the default categories.
- AC-011-6: Creator profile page shows: their packs, total plays across all packs, and a "Creator" badge after first approved public pack.
- AC-011-7: Pack questions are the same 3 types as the existing admin question creator (MC, Media Guessing with Cloudinary upload, Free Text).

### Technical Requirements

- **DB migration:** New `QuestionPack` table: `{ id, createdBy (userId FK), name, description, categoryTag, visibility, packStatus, createdAt }`. Questions linked via `packId` FK on existing `Question` table.
- **New pages:** `/create` (pack creation), `/profile/[userId]` (creator profile).
- **API routes:** `POST /api/packs`, `GET /api/packs/mine`, `PUT /api/packs/:id/submit`, `GET /api/packs/community`.
- **Admin extension:** New "Community Submissions" tab. `PATCH /api/admin/packs/:id/review` endpoint.
- **Game setup extension:** `PackSelector` component in host game setup — tabs: "افتراضي" (default), "حزمي" (my packs), "مجتمعي" (community approved).
- **Cloudinary:** UGC media upload must reuse existing Cloudinary integration with per-user upload limits.

### Dependencies

- Requires authenticated user session (REQ-002 guest hosts cannot create packs — prompt to sign in).
- Admin dashboard must be extended before community submissions can be reviewed.

### Effort Estimate

5–7 days (from FEATURE-IDEAS.md PM-03 assessment)

### Key Assumptions to Validate

- Gulf users are willing to spend time creating questions. Validate with an early access program — offer "Creator" badge for first 100 UGC pack creators.
- Private packs (family/friend-only) see higher creation rates than public submissions.
- Existing admin approval workflow can scale to handle user-submitted content.

### Risks

- Content moderation burden: any user-generated content platform will receive inappropriate submissions. The approval workflow is critical. Do not allow unreviewed content into public game sessions.
- Media uploads from users could exhaust Cloudinary free tier. Set per-user upload limits and monitor storage usage.

---

## REQ-012: Creator / Streamer Mode

**Arabic Name:** وضع الستريمر  
**Requirement ID:** REQ-012  
**Priority:** P2 — Sprint 4  
**ICE Score:** 5.0 (Rank #8 from FEATURE-IDEAS.md: SE-03)  
**Addresses Friction Points:** Distribution channel (Gulf gaming creators with millions of subscribers)

### User Stories

1. As a Gulf gaming streamer, I want an OBS-compatible stream view URL, so that I can add Sha'lelha to my stream without manual CSS hacks.
2. As a streamer, I want to customize the stream overlay color to match my stream branding, so that the game display looks professional on my channel.
3. As a streamer, I want the first 8 people who use my join link to be players, and everyone else to be spectators, so that I can play with my audience while the rest watch.
4. As a streamer, I want a live event ticker (player joined, streak broken, lifeline used) in a corner widget, so that viewers can follow the action without watching the full game screen.
5. As a host setting up a stream, I want a preview of the stream view before going live, so that I can verify the layout looks correct.

### Acceptance Criteria

- AC-012-1: A `/room/{code}/stream` route renders the host game display with stream-optimized options.
- AC-012-2: The stream view accepts query params: `?bg=transparent&color={hex}&overlay=minimal`.
- AC-012-3: Transparent background option uses `background: transparent` CSS, allowing OBS chroma-key or window capture.
- AC-012-4: An event ticker component in the top-right corner shows sliding events: "لاعب انضم", "استخدم تجميد", "سلسلة 5!".
- AC-012-5: A "Creator Join Link" with `?creator={handle}` reserves a player slot for the streamer. All subsequent joins after 8 players default to spectator mode (REQ-006).
- AC-012-6: A stream setup page for the host shows: color picker, background toggle, layout preview, and a "Copy OBS URL" button.
- AC-012-7: The stream view has no browser navigation chrome, no hover states, and no interactive controls — display only.

### Technical Requirements

- **New route:** `/room/[code]/stream` page — renders `HostGameDisplay` in stream mode.
- **Query param handling:** Parse and apply `bg`, `color`, `overlay` params.
- **Event ticker component:** `StreamEventTicker` — subscribes to socket events; renders a fixed-position sliding list.
- **Stream setup page:** `/host/[code]/stream-setup` — color picker, preview iframe, copy URL button.
- **Creator slot reservation:** Extend room creation to accept `creatorHandle` param; store in Redis room object; reserve slot.

### Dependencies

- REQ-006 (Spectator Mode) — "rest become spectators" logic requires spectator mode.

### Effort Estimate

4–5 days (from FEATURE-IDEAS.md SE-03 assessment)

### Key Assumptions to Validate

- Arabic gaming streamers on YouTube/TikTok are willing to feature Sha'lelha. Validate with outreach to 5–10 mid-tier creators before building.
- A dedicated stream URL is necessary vs. using the existing host view — confirm by having a creator attempt to stream the current host screen first.

### Risks

- OBS browser source has quirks with WebSocket connections. Test stream view in OBS on Windows and macOS before shipping.
- Transparent background mode may not render correctly in all browsers. Provide a fallback solid color option.

---

## REQ-013: Post-Game Highlight Reel

**Arabic Name:** ملخص اللعبة القابل للمشاركة  
**Requirement ID:** REQ-013  
**Priority:** P2 — Sprint 4  
**ICE Score:** High delight; depends on REQ-003 (PD-03 from FEATURE-IDEAS.md)  
**Addresses Friction Points:** Social sharing of game moments; amplifies REQ-003 viral mechanic

### User Stories

1. As a host, I want to see a 30-second highlight reel of top game moments before the final podium, so that the game ends with a memorable climax.
2. As a player, I want the highlight reel to include "Fastest Answer," "Biggest Comeback," and "Funniest Free Text Answer" moments, so that everyone gets a moment to shine.
3. As a host, I want to share the highlight reel to WhatsApp as an image card, so that the group has a keepsake of the session.
4. As a player, I want individual highlight cards ("Most Savage Freeze Target," "Never Missed Once") to be shareable from the end screen.

### Acceptance Criteria

- AC-013-1: After game end, before the final podium, a 30-second animated sequence plays showing: fastest correct answer (player + response time), biggest free-text winner (most votes), and most active "Freeze" user.
- AC-013-2: Each highlight is a full-screen animated card (3–5 seconds per card) with the player's name, avatar, and the moment's metric.
- AC-013-3: At the end of the highlight sequence, a "Share Highlights" button generates a single-image recap PNG using Vercel OG.
- AC-013-4: Individual player highlight cards are accessible from the player end screen ("Your Best Moment: Fastest Answer — Question 7, 1.2 seconds").

### Technical Requirements

- **New API endpoint:** `GET /api/sessions/{sessionId}/highlights` — computes highlight metrics from session data.
- **Frontend:** `HighlightReelPlayer` component — renders animated card sequence using CSS animations.
- **OG image route:** `GET /api/og/highlight?type=fastest&player=Noor&value=1.2s` — generates highlight PNG.

### Dependencies

- REQ-003 (Share Mechanic) — shares use the same OG image infrastructure.
- REQ-006 (Spectator Mode) — spectators should see the highlight reel too.

### Effort Estimate

3–4 days

### Key Assumptions to Validate

- The highlight reel does not slow down the post-game experience. Provide a "Skip" button.

### Risks

- Computing highlights requires all game events to be persisted in DB (not just Redis). Ensure the session event log is written to PostgreSQL during gameplay.

---

## REQ-014: B2B Corporate and Team-Building Tier

**Arabic Name:** الباقة المؤسسية لبناء الفريق  
**Requirement ID:** REQ-014  
**Priority:** P2 — Sprint 5+  
**ICE Score:** 2.5 (Rank #9 from FEATURE-IDEAS.md: PM-02)  
**Addresses:** Revenue generation; Gulf corporate market opportunity

### User Stories

1. As an HR event planner, I want to create a branded Sha'lelha room (my company logo and colors on the host screen), so that the game looks professional at our event.
2. As a corporate event organizer, I want to generate 10 room codes at once for a 100-person event, so that I can run parallel games simultaneously.
3. As a finance manager, I want to receive an invoice for the event package, so that I can process the payment through our procurement system.
4. As an HR manager, I want a PDF results export after the event, so that I can report on participation and engagement.

### Acceptance Criteria

- AC-014-1: An `Organization` table and `OrganizationMembership` model exist. One org can have multiple host accounts.
- AC-014-2: Org branding config (`logoUrl`, `primaryColor`, `orgName`) is applied as a header band on the host game display.
- AC-014-3: Bulk room code generation: `POST /api/orgs/{id}/event` creates N rooms simultaneously (max 20 parallel rooms).
- AC-014-4: Post-game PDF export generated via `pdfmake` or Playwright headless: includes all player results, question breakdown, category breakdown.
- AC-014-5: A B2B pricing page exists at `/corporate` with package options and a "Contact Us" form (pre-billing; manual invoicing for MVP).
- AC-014-6: Stripe integration for online payment (optional at MVP — manual invoicing acceptable for first 10 enterprise clients).

### Technical Requirements

- New DB tables: `Organization`, `OrganizationMembership`, `OrganizationBranding`.
- New admin section: Organization management.
- PDF export: `pdfmake` library (lighter than Playwright for this use case).
- B2B pricing page: Static page at `/corporate`.

### Dependencies

- REQ-006 (Spectator Mode) for large events (overflow handling).
- REQ-016 (Tournament Engine) for department-vs-department competitions.

### Effort Estimate

3–4 weeks (from FEATURE-IDEAS.md PM-02 assessment)

### Key Assumptions to Validate

- Gulf HR/events teams actively seek Arabic-first alternatives to Kahoot. Validate with 5 discovery calls before building.
- Branded room screens are a genuine buying criterion vs. nice-to-have.

### Risks

- Enterprise sales cycle is long (procurement, legal, IT approval). Do not block product roadmap waiting for B2B revenue.
- Invoice-based payments require manual ops work. Cap at 10 early clients before building full Stripe integration.

---

## REQ-015: Multi-Room Tournament Engine

**Arabic Name:** محرك البطولات متعددة الغرف  
**Requirement ID:** REQ-015  
**Priority:** P2 — Sprint 5+  
**ICE Score:** 2.0 (Rank #10 from FEATURE-IDEAS.md: SE-05)  
**Addresses:** Recurring engagement; competitive events; B2B corporate tournaments

### User Stories

1. As a tournament host, I want to create a bracket with 4 rooms of 8 players, so that 32 people can compete in a structured elimination format.
2. As a qualifying player, I want to see "You are advancing to the finals!" on my screen when I win my qualifying room, so that I know to stay in the session.
3. As a spectator, I want to watch the finals room live, so that I can cheer for my friend who advanced.
4. As an admin, I want to create a weekly public tournament, so that Sha'lelha has a recurring social media moment every week.

### Acceptance Criteria

- AC-015-1: A `Tournament` structure in Redis stores: bracket state, phase (qualifying/finals/complete), room IDs, and advancement rules.
- AC-015-2: A `TournamentService` wraps existing `RoomService` to create N rooms and register them under the tournament.
- AC-015-3: When a qualifying room ends, the top N scorers receive a `tournament:advance` socket event with the new room join code.
- AC-015-4: A `TournamentBracketView` component on the admin/host screen shows live bracket state as rooms complete.
- AC-015-5: The finals room is accessible in spectator mode (REQ-006) via a public link.

### Technical Requirements

- New Redis key structure: `tournament:{id}`.
- New `TournamentService` class.
- New socket event: `tournament:advance`.
- New frontend component: `TournamentBracketView`.
- New admin section: Tournament management.

### Dependencies

- REQ-006 (Spectator Mode) — finals spectating requires this.
- REQ-002 (Anonymous Room Creation) — tournament players should not need accounts.

### Effort Estimate

2–3 weeks (from FEATURE-IDEAS.md SE-05 assessment)

### Key Assumptions to Validate

- Is there genuine demand for competitive tournaments vs. casual social play? Validate the segments separately before building.

### Risks

- Architecturally the most complex feature on the roadmap. Do not build before simpler retention mechanics are validated.

---

# PART 3: NON-FUNCTIONAL REQUIREMENTS

## 3.1 Performance Requirements

| Metric | Requirement | Measurement Method |
|--------|------------|-------------------|
| Landing page first contentful paint (FCP) | < 1.5 seconds on 4G mobile | Lighthouse CI / WebPageTest |
| Landing page Time to Interactive (TTI) | < 3 seconds on 4G mobile | Lighthouse CI |
| Player join flow (code entry → lobby) | < 2 seconds end-to-end | Manual timing + Playwright test |
| Socket event round-trip latency | < 200ms (p95) in Gulf region | Custom socket latency telemetry |
| Question delivery (socket → player screen render) | < 300ms | In-game timer accuracy audit |
| OG image generation (`/api/og/*`) | < 500ms edge function response | Vercel Edge Function analytics |
| QR code generation (`/api/rooms/[code]/qr`) | < 100ms (cached after first gen) | Server-side timing headers |
| Concurrent players per room | 8 players + 50 spectators = 58 simultaneous WebSocket connections | Load test with k6 |
| Concurrent rooms supported | 100+ rooms simultaneously | Load test scenario |
| API route response time (p95) | < 300ms for all read routes | Vercel Analytics / custom APM |

## 3.2 Security Requirements

| Area | Requirement |
|------|------------|
| Authentication | Google OAuth via NextAuth for hosts. Guest host tokens via signed UUID in httpOnly cookie. Admin dashboard uses separate password-based auth (existing). |
| Rate limiting | Room creation: 5/min per socket (existing) + 3/hour per IP for anonymous creation (REQ-002). Answer submission: existing per-socket limit retained. Spectator reactions: 1/3s per socket. |
| Input validation | Room code: 4-character alphanumeric regex (existing). Player name: 20-character max, XSS-sanitized. Avatar config: enum-validated server-side. All user-generated strings (Free Text answers, pack names) HTML-encoded before rendering. |
| CORS | API routes restricted to same-origin. Socket.io CORS configured to allow only `shallelha.vercel.app` and `localhost` in development. |
| Environment variables | All secrets (DB URL, Redis URL, Google OAuth secrets, Cloudinary keys) in environment variables only. No secrets in code or version control. `.env.example` is the canonical reference. |
| Guest token security | `guestHostToken` UUID stored in httpOnly, SameSite=Strict cookie. Not exposed to JavaScript. Server validates token against Redis before processing any host command. |
| Content moderation | User-generated question content (REQ-011) requires admin approval before public use. All UGC strings are sanitized before rendering. |
| OG image injection | All values passed to `/api/og/*` routes must be validated/sanitized to prevent template injection in generated images. |

## 3.3 Accessibility Requirements

| Requirement | Standard | Priority |
|------------|----------|----------|
| All interactive elements have `aria-label` or visible text labels | WCAG 2.1 AA | P0 |
| Color contrast ratio ≥ 4.5:1 for all text | WCAG 2.1 AA | P0 |
| Touch targets minimum 44×44px on mobile | Apple HIG / WCAG 2.5.5 | P0 |
| RTL layout correct for all Arabic text | Arabic UX best practice | P0 |
| Keyboard navigation functional for host controls | WCAG 2.1 AA | P1 |
| Game timer animations respect `prefers-reduced-motion` | WCAG 2.3.3 | P1 |
| QR code has `alt` text: "QR code to join room {CODE}" | WCAG 1.1.1 | P1 |
| Screen reader support for lobby player list | WCAG 1.3.1 | P2 |

## 3.4 Localization Requirements

| Requirement | Detail |
|------------|--------|
| Primary language | Arabic (Gulf dialect preferred for UI copy) |
| Font | Cairo (Google Fonts — already installed) for all Arabic text |
| RTL direction | `dir="rtl"` on `<html>` element. All layout components must be RTL-aware. |
| Number formatting | Use Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) for scores and timers in the Arabic UI |
| Date formatting | Hijri calendar support for Ramadan mode date detection |
| Future English support | All UI strings must be extracted to a translation file (`/messages/ar.json`) from v2 Sprint 1 onward, enabling future i18n without code refactoring |
| Cultural sensitivity review | Any new content (question packs, avatar options, seasonal themes) must be reviewed by a Gulf-native cultural advisor before shipping |

## 3.5 Analytics Requirements

| Event | What to Track | Why |
|-------|--------------|-----|
| Landing page CTA click | Which CTA (host vs. player), source (`?ref=`) | Measure acquisition funnel step 1 |
| Room created | Auth type (google/guest), timestamp | Measure conversion rate and auth preference |
| Player joined | Room code, player count at join time | Measure room fill rate |
| Game started | Room code, player count, question pack used | Measure host activation |
| Share event | Platform (whatsapp/instagram/copy), card type (player/recap), session ID | Measure viral coefficient |
| Play again clicked | Session ID, players still connected | Measure retention loop engagement |
| PWA install | Platform (iOS/Android), install surface (post-game/banner) | Measure PWA adoption |
| Question answered | Question ID, time taken, correct/incorrect | Feeds adaptive timer feature (REQ future) |
| Spectator joined | Room code, spectator count at join | Measure spectator mode adoption |
| Post-game screen time | Time spent on post-game screen before exit | Measure engagement with retention screen |

All analytics events are sent to Vercel Analytics (page views, already implemented) plus a custom `POST /api/analytics/event` endpoint that writes to a lightweight `AnalyticsEvent` table in PostgreSQL.

## 3.6 Infrastructure Requirements

| Requirement | Detail |
|------------|--------|
| Web frontend hosting | Vercel (current) — auto-scaling, edge CDN, OG image edge functions |
| Backend/API hosting | Railway (current) — Node.js + Socket.io server |
| Database | PostgreSQL on Railway (current) |
| Cache / real-time state | Redis on Railway (current) |
| Media storage | Cloudinary (current) — images and audio for questions |
| Environment | Production: `shallelha.vercel.app` / `shallelha-server.railway.app`. Staging: separate Vercel preview deployments per PR. |
| Scaling threshold | Monitor Socket.io server memory. Scale Railway instance when concurrent rooms exceed 50 (current 512MB plan). |
| Database connection pooling | Use PgBouncer or Prisma connection pool limit (current: max 5 connections) — increase to max 20 for v2 load. |
| Redis memory | Estimate 10KB per active room. At 100 concurrent rooms = 1MB. Current Redis plan is sufficient; monitor at 500+ rooms. |
| CI/CD | GitHub Actions (or Railway auto-deploy from main branch). All PRs must pass automated tests before merge. |
| Health check | Existing `/health` endpoint (`postgres`, `redis`, `approvedQuestions` ≥ 200) — extend to check `approvedQuestions` ≥ 500 for v2 launch go/no-go. |

---

# PART 4: RELEASE PLAN

## Sprint 1: Fix the Front Door (Week 1)
**Theme:** Acquisition — make the product visible and shareable  
**Goal:** A user who discovers Sha'lelha via any channel can understand it, start playing, and share it within 60 seconds

| Requirement | Feature | Effort | Owner |
|------------|---------|--------|-------|
| REQ-004 | Real Landing Page | 1–2 days | Frontend |
| REQ-002 | Anonymous Room Creation | 2 days | Backend + Frontend |
| REQ-001 | WhatsApp-Native Room Sharing + QR Code | 1–2 days | Frontend + API |
| REQ-003 | Share-to-Unlock Viral Mechanic + Result Cards | 2–3 days | Frontend + API |
| REQ-005 | Post-Game Screen + Play Again Flow | 1–2 days | Frontend + Backend |

**Sprint 1 Total Effort:** 7–11 days  
**Sprint 1 Definition of Done:**
- Landing page deployed with dual CTAs and game preview visual
- Anonymous room creation works end-to-end (no Google OAuth required)
- QR code visible on host lobby screen
- WhatsApp share button on host lobby screen
- Post-game screen shows full leaderboard for players
- "Play Again" button on host end screen
- Result card generates and is shareable to WhatsApp

---

## Sprint 2: Engagement Depth (Weeks 2–3)
**Theme:** Retention — give players reasons to stay longer and come back  
**Goal:** Sessions per group increase from ~1/month to 3+/month

| Requirement | Feature | Effort | Owner |
|------------|---------|--------|-------|
| REQ-006 | Spectator Mode | 3 days | Backend + Frontend |
| REQ-007 | PWA with Offline Question Packs | 4 days | Frontend + Backend |
| REQ-008 | Avatar System (Gulf-Themed) | 2 days | Frontend |
| REQ-009 | Real-Time Reaction Layer | 2 days | Backend + Frontend |

**Sprint 2 Total Effort:** 11 days  
**Sprint 2 Definition of Done:**
- Users can join rooms as spectators when room is full
- Spectator emoji reactions float on host screen
- Sha'lelha is installable as PWA with home screen icon
- Players can build Gulf-themed avatars that persist across sessions
- Reaction bar visible during gameplay; reactions animate on host screen

---

## Sprint 3: Content Moat (Weeks 3–4)
**Theme:** Depth — give repeat players reasons to keep coming back  
**Goal:** Question pool grows from 204 to 500+ and UGC pipeline opens

| Requirement | Feature | Effort | Owner |
|------------|---------|--------|-------|
| REQ-010 | Ramadan Mode (engineering) | 3–4 days | Full Stack |
| — | Ramadan Content Seeding (50+ questions) | Ongoing | Content |
| REQ-011 | User-Generated Question Packs | 5–7 days | Full Stack |
| — | Admin content sprint (target: 500+ total questions) | Ongoing | Content |

**Sprint 3 Total Effort:** 8–11 days engineering + content production  
**Sprint 3 Definition of Done:**
- `seasonal_events` DB table and admin CRUD operational
- Ramadan theme applies automatically based on date
- Public seasonal leaderboard at `/leaderboard`
- Authenticated hosts can create private question packs
- Community submission workflow operational in admin dashboard
- Total question pool ≥ 500 approved questions

---

## Sprint 4: Distribution Engine (Weeks 5–6)
**Theme:** Growth — activate influencer and creator distribution channels  
**Goal:** One Gulf creator stream event generates 1,000+ new session starts

| Requirement | Feature | Effort | Owner |
|------------|---------|--------|-------|
| REQ-012 | Creator / Streamer Mode | 4–5 days | Frontend + Backend |
| REQ-013 | Post-Game Highlight Reel | 3–4 days | Frontend + API |

**Sprint 4 Total Effort:** 7–9 days  
**Sprint 4 Definition of Done:**
- `/room/{code}/stream` route renders OBS-compatible overlay
- Stream setup page with color customization and OBS URL copy
- Event ticker visible in stream view
- 30-second highlight reel plays after game end before podium
- Individual highlight cards shareable from player end screen

---

## Sprint 5+: Platform Plays (Ongoing)
**Theme:** Monetization and Scale

| Requirement | Feature | Effort | Timeline |
|------------|---------|--------|----------|
| REQ-014 | B2B Corporate Tier | 3–4 weeks | After consumer PMF confirmed |
| REQ-015 | Multi-Room Tournament Engine | 2–3 weeks | After B2B validation |
| SE-01 | WhatsApp Business API Integration | 1–2 weeks | After organic WhatsApp sharing validated |
| SE-04 | Adaptive Timer / AI Difficulty | 1 week | After 10,000+ questions answered (data threshold) |

---

# PART 5: SUCCESS CRITERIA AND KPIS

## 5.1 Sprint-Level Definitions of Done

### Sprint 1 Go/No-Go Criteria
Before moving to Sprint 2, ALL of the following must be true:
- [ ] Landing page Lighthouse performance score ≥ 85 on mobile
- [ ] Anonymous room creation success rate ≥ 95% (no token errors in production)
- [ ] WhatsApp share button clickable and generates correct deep link on iOS and Android
- [ ] QR code scans correctly from a 2-meter distance on a standard laptop screen
- [ ] Post-game player screen shows full leaderboard (not just own score)
- [ ] "Play Again" resets room and returns connected players to lobby
- [ ] OG image for result card renders correctly in WhatsApp iOS and Android preview
- [ ] Zero regressions on existing authenticated host flow (78 passing tests must stay green)

### Sprint 2 Go/No-Go Criteria
Before moving to Sprint 3, ALL of the following must be true:
- [ ] Spectator join does not affect player game state or count
- [ ] Spectator emoji reactions visible on host screen within 500ms of tap
- [ ] PWA Lighthouse score ≥ 90
- [ ] PWA installable on iOS 16+ and Android Chrome 110+
- [ ] Avatars persist in localStorage and reappear on return visit
- [ ] Reaction events rate-limited and do not cause socket overload at 8 players + 50 spectators

### Sprint 3 Go/No-Go Criteria
Before moving to Sprint 4, ALL of the following must be true:
- [ ] Total approved questions ≥ 500
- [ ] Seasonal event admin CRUD creates event and assigns categories without errors
- [ ] Ramadan theme applies correctly when current date is within event window
- [ ] Creator can build and use a private question pack without admin intervention
- [ ] Community submission appears in admin "Community Submissions" tab after host submits

### Sprint 4 Go/No-Go Criteria
Before moving to Sprint 5+, ALL of the following must be true:
- [ ] Stream view renders at `/room/{code}/stream` without browser chrome
- [ ] OBS browser source captures stream view correctly on Windows OBS 29+
- [ ] Highlight reel plays without hanging or missing player names
- [ ] Highlight card PNG generates in < 500ms on Vercel Edge

---

## 5.2 v2 Launch KPIs (Full Sprint 1–4 Complete)

| KPI | Target | Measurement |
|-----|--------|-------------|
| Monthly Active Rooms (MAR) | 1,000 rooms/month | Redis room creation count |
| Unique hosts per month | 300+ | NextAuth + guest token distinct count |
| WhatsApp share rate | 40%+ of completed games | `analytics.share` event counter |
| Play Again rate | 25%+ of completed games | `game:reset` event counter |
| Sessions per group per month (cohort) | 4+ for groups that play twice | Session log analysis |
| PWA install rate | 10%+ of hosts | `beforeinstallprompt` accepted counter |
| Spectator usage rate | 20%+ of rooms with 8 players have ≥ 1 spectator | `spectator:join` event counter |
| Time from landing to first game start | Median < 90 seconds | Funnel event timing |
| Organic referral rate (sessions starting from a share link) | 30%+ of new room creations | `?ref=share` UTM tracking |
| App crash / error rate | < 0.5% of sessions | Vercel error tracking |

---

## 5.3 Product-Market Fit Signals to Watch

The following signals — absent in v1.0 — must appear before the v2 launch is considered successful:

1. **Organic discovery:** Sessions starting from `/` (not from direct `/join` links) constitute ≥ 20% of all sessions. This means the landing page is working.

2. **Repeat sessions:** At least 15% of all room-creating hosts have created 3+ rooms in 30 days. This is the minimum retention signal.

3. **Viral coefficient > 1:** Each new user acquired via share links brings at least 1 additional new user (measure: new sessions from `?ref=share` relative to share events generated).

4. **Free Text engagement:** Free Text questions have a submission rate ≥ 80% across all active players. Low submission rate = social mechanic is not working.

5. **Session completion rate:** ≥ 70% of started games reach the final podium screen (not abandoned mid-game). Low completion = pacing, connectivity, or content issue.

---

## 5.4 Risks to v2 Success

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Landing page fails to convert visitors to players | Medium | Critical | A/B test hero copy; run user testing with 5 Gulf-native participants before Sprint 1 ship |
| Anonymous room creation enables abuse | Low | Medium | IP rate limiting (3 rooms/hour) + Redis TTL cleanup prevents sustained abuse |
| Content pool exhausted before UGC ships | Medium | High | Begin admin content sprint immediately; target 500 questions before first marketing push |
| iOS PWA limitations block home screen adoption | High | Medium | Provide clear manual install instructions; treat PWA as bonus, not core feature gate |
| Ramadan content is culturally insensitive | Low | Very High | Mandatory Gulf-native cultural review of all Ramadan questions before seeding |
| WhatsApp deep links blocked by platform changes | Low | High | Test on iOS WhatsApp and Android WhatsApp monthly; maintain fallback copy-link mechanism |
| Socket server overload during viral growth event | Medium | High | Load test to 100 concurrent rooms before Sprint 4 (streamer mode could cause sudden spikes) |

---

*Document generated from analysis of PRODUCT-REVIEW.md (v1.0 post-launch founder review, 2026-04-18) and FEATURE-IDEAS.md (multi-perspective ICE-scored ideation, 2026-04-18).*  
*A new developer reading this document should have full scope context to begin Sprint 1 implementation without additional briefing.*
