---
phase: 10
title: UGC Community Question Packs + Shareable Result Cards
slug: ugc-question-packs-shareable-cards
status: pre-planning
research_date: 2026-04-18
research_method: 3 parallel product analysis agents (Feature Gap, Player Experience, Gulf Market)
---

# Phase 10 — Context & Requirements

> This document consolidates all product analysis research findings that define the scope and priorities for Phase 10. Pass this file to the planner with `--prd CONTEXT.md`.

---

## Why This Phase Exists

Product analysis (3 independent agents, 2026-04-18) found the same root problem from three angles:

- **Post-game retention score: 1/10** — Every game ends in a dead end. No sharing, no memory, no reason to return.
- **No viral loop** — The platform generates zero organic growth from its own users.
- **No content flywheel** — Admin is the sole source of questions. Growth is bottlenecked by a single operator.
- **Gulf market white space** — Zero Arabic-native community question pack platforms exist. Jawabak Jawabahom (closest competitor) has no UGC system.

Draw & Guess was the original Phase 10 plan. It was replaced because:
- Skribbl.io already owns this English/global market
- Requires Cloudinary + canvas + real-time stroke sync (high complexity, low differentiation)
- Adds zero to the viral loop or content flywheel problems

---

## Requirements

### R1 — Pack Creator (Host-side)

Any authenticated host can create a question pack:

- Pack metadata: name (Arabic), category tag (dropdown from existing categories), language (Arabic/English/both), difficulty, description
- Question editor: add/edit/delete questions; each question has text, type (MULTIPLE_CHOICE or FREE_TEXT), options, correct answer
- Submit for review → admin approves/rejects before pack goes public
- Host can edit their own packs; approved packs lock until admin re-approves after edit
- My Packs dashboard: list of owned packs with status (draft / pending / approved / rejected)

**Acceptance criteria:**
- Host creates a pack with 5+ questions and submits it in under 3 minutes
- Admin approves it from the existing admin dashboard
- Pack appears in the marketplace within 1 minute of approval

---

### R2 — Pack Marketplace (Host game-start flow)

Replace or extend the current question-count selector in the game-start flow:

- Browse/search packs: filter by category, language, play count, rating
- Default categories surfaced: رمضان، محبوبين، رياضة، أفلام، ثقافة عامة، خليجي
- Pack detail page: name, description, question count, creator handle, play count, average rating
- "Play this pack" → enters room creation flow with pack pre-selected
- Official packs (admin-created/curated) are badged separately from community packs

**Acceptance criteria:**
- Host discovers and starts a game with a community pack in under 60 seconds
- Pack browsing works on mobile (RTL, touch-friendly)

---

### R3 — Groq AI Pack Assistant

When creating a pack, host can use an AI assistant to generate draft questions:

- Input: topic prompt in Arabic or English (e.g. "أفلام مصرية التسعينات")
- Model: `llama-3.3-70b-versatile` via Groq API (free tier: 14,400 req/day, ~100-200 tok/s)
- Output: 10 draft multiple-choice questions with options and correct answers, in the same language as the prompt
- Host reviews, edits, deletes, or keeps each draft question before saving to pack
- Rate limit: 3 AI generation requests per host per hour (protect Groq free quota)
- Graceful fallback: if Groq is unavailable, show error and allow manual entry

**Acceptance criteria:**
- Host types Arabic topic → receives 10 draft questions within 5 seconds
- Questions are Arabic RTL, grammatically correct, relevant to the topic
- Host can edit any generated question before saving

**Environment variable required:**
```
GROQ_API_KEY=<free key from console.groq.com>
```

**SDK:**
```
npm install groq-sdk
```

---

### R4 — Shareable Result Cards (Post-game)

At the end of every game, generate a shareable image card:

- Content: game title / pack name, final leaderboard (top 3-5 players), player emoji avatars, Sha'lelha logo + brand colors
- Two crop variants auto-generated:
  - **Snapchat Story**: 9:16 vertical (1080×1920px)
  - **WhatsApp / Instagram**: 1:1 square (1080×1080px)
- One-tap download (mobile) or copy-to-clipboard (desktop)
- Share button opens native share sheet on mobile (Web Share API); falls back to download button
- Cards are generated server-side (canvas/sharp/satori) to ensure consistent rendering across devices
- No personal data beyond emoji + nickname stored in card

**Acceptance criteria:**
- Result card appears within 3 seconds of game end screen loading
- Card downloads/shares correctly on iOS Safari and Android Chrome
- Snapchat 9:16 card looks polished at full screen (not stretched or pixelated)

---

### R5 — Quick UX Wins (bundle into Phase 10)

Agent B (Player Experience, score 4.6/10) identified these as 1-2 day fixes that are too small for their own phase but critical for retention:

| Fix | Current problem | Implementation |
|-----|----------------|----------------|
| Live rank after each question | Players don't know if they're winning | Show player's rank + score delta in answer confirmation feedback |
| Answer count progress | "16 of 31 seconds = dead silence" — players don't know if others answered | "٣ من ٨ أجابوا" counter on player screen during question phase |
| Freeze opponent overlay | Frozen player sees nothing — confusion, not drama | Dedicated "أنت مجمّد ❄️" overlay on frozen player's screen for duration |

These are additive UI changes to existing player/host screens — no new routes needed.

---

## Technical Constraints

- **Image generation**: Use `satori` (JSX → SVG) + `@resvg/resvg-js` (SVG → PNG) — runs in Node.js, no browser dependency, no Puppeteer overhead
- **No new auth system**: Pack creator = existing NextAuth session (Google login). Anonymous users cannot create packs.
- **Admin approval flow**: Reuse existing admin dashboard patterns from Phase 7/9. Add a new "Pending Packs" queue tab.
- **Storage**: Pack questions stored in PostgreSQL (new `Pack` + `PackQuestion` tables). Images generated on-demand, not stored.
- **No payment / monetization**: Packs are free to create and play. Creator handles are displayed for attribution only.

---

## Prisma Schema Additions (draft)

```prisma
model Pack {
  id          String       @id @default(cuid())
  name        String
  description String?
  category    String
  language    String       @default("ar")
  difficulty  String?
  status      PackStatus   @default(DRAFT)
  createdBy   String       // NextAuth user ID
  creatorHandle String?
  playCount   Int          @default(0)
  rating      Float?
  questions   PackQuestion[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model PackQuestion {
  id           String   @id @default(cuid())
  packId       String
  pack         Pack     @relation(fields: [packId], references: [id], onDelete: Cascade)
  text         String
  type         QuestionType @default(MULTIPLE_CHOICE)
  options      String[] // JSON array
  correctIndex Int?
  order        Int
}

enum PackStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}
```

---

## Gulf Market Context

- **Market size**: $3.24B gaming market by 2028 (Gulf region)
- **Key platform**: Snapchat — 90% Saudi youth penetration. 9:16 shareable cards are the primary viral vector.
- **Seasonal hook**: Ramadan gaming surge +29%. Ramadan-themed packs (رمضان كريم، مسلسلات رمضان) should be promoted in marketplace at launch.
- **Closest competitor**: Jawabak Jawabahom — no UGC, no shareable cards, no AI generation. This is Sha'lelha's differentiation window.
- **Creator economy**: Arabic content creators on TikTok/Snapchat have no native game tool. A branded pack they built = organic promotion when they share result cards.

---

## Out of Scope (Phase 10)

- Pack creator monetization / paid packs
- In-game reactions or chat
- Draw & Guess mode
- Persistent player profiles / accounts (separate phase)
- Pack versioning or forking

---

## Research Sources

| Agent | Focus | Key Finding |
|-------|-------|-------------|
| Agent A — Feature Gap | Full codebase feature audit | No viral loop, no content flywheel; Draw & Guess is low-differentiation |
| Agent B — Player Experience | Player-side UX scoring | Post-game retention 1/10; dead silence between questions; no sharing moment |
| Agent C — Gulf Market | Competitive + market research | Snapchat = primary viral vector; UGC packs = blue ocean in Arabic gaming |

---

*Generated: 2026-04-18 — Product analysis session (3 parallel agents)*
*Next step: `/gsd-plan-phase 10 --prd CONTEXT.md`*
