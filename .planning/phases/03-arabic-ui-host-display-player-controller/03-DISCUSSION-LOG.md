# Phase 3: Arabic UI + Game Engine — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 03 — Arabic UI — Host Display & Player Controller (merged with Phase 4)
**Areas discussed:** Host game screen layout, Player answer experience, Question data, Game flow control

---

## Host Game Screen Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 2×2 grid | Kahoot style, 4 colored quadrants | ✓ (as one option) |
| 4-column bar | Horizontal strip at bottom | ✓ (as one option) |
| Vertical stack | Question left, options right | ✓ (as one option) |

**User's choice:** All 3 layouts available — host configures before game starts

| Timer Option | Description | Selected |
|--------------|-------------|----------|
| Progress bar | Full-width bar across top | ✓ (as one option) |
| Countdown circle | Large circle above question | ✓ (as one option) |
| Big number | Numeric only in corner | ✓ (as one option) |

**User's choice:** All 3 timer styles available — host configures before game starts

| Indicator Option | Description | Selected |
|------------------|-------------|----------|
| Counter only | "أجاب 5 من 8" text | |
| Emoji avatars light up | Avatars highlight as players answer | ✓ |
| Nothing shown | No indicators during question | |

**User's choice:** Emoji avatars light up as players answer

---

## Player Answer Experience

| Option | Description | Selected |
|--------|-------------|----------|
| 2×2 grid (fixed) | Always 4 square buttons | |
| Vertical stack (fixed) | 4 full-width buttons | |
| Mirror host layout | Same layout the host chose | ✓ |

**User's choice:** Mirror host's chosen layout

| Timer Option | Description | Selected |
|--------------|-------------|----------|
| Full countdown bar | Same as host | |
| No timer | No timer on phone | |
| Thin progress bar (subtle) | Top edge, minimal | ✓ |

**User's choice:** Thin progress bar at top edge

| Post-answer Option | Description | Selected |
|--------------------|-------------|----------|
| Locked highlight | Their answer highlighted, others grey | |
| Instant right/wrong | Green/red immediately | |
| Waiting state | Spinner + "في انتظار اللاعبين" | ✓ |

**User's choice:** Spinner + waiting text until host reveals answer

---

## Question Data

| Option | Description | Selected |
|--------|-------------|----------|
| Prisma seed script | Questions in PostgreSQL, editable | ✓ |
| Basic question API | POST endpoint, no UI | |
| Hardcoded in code | Constants array | |

**User's choice:** Seed script — but with constraint: questions must be editable by admin and host (not hardcoded)

**Notes:** This means Question + Category Prisma models are required in this phase. Admin UI deferred to Phase 7.

| Quantity | Description | Selected |
|----------|-------------|----------|
| 5 questions | Bare minimum | |
| 10 questions (1 category) | Single round test | |
| 20–30 questions (2–3 categories) | Variety testing | ✓ |

**User's choice:** 20–30 questions across 2–3 Arabic categories

---

## Game Flow Control

**User's statement:** "I want the host has full control always"

| Advance Option | Description | Selected |
|----------------|-------------|----------|
| Timer auto-advances | Server moves to next automatically | |
| Host clicks next | Manual control at every step | ✓ |
| Hybrid | Auto with pause option | |

**User's choice:** Host clicks every transition

| Reveal Option | Description | Selected |
|---------------|-------------|----------|
| Auto-reveal on timer end | Correct answer shown automatically | ✓ (as config option) |
| Host taps reveal | Manual reveal anytime | ✓ (as config option) |
| Host configures before game | Pre-game toggle | ✓ |

**User's choice:** Pre-game configuration — host sets reveal mode before starting

**Notes:** Timer is visual guidance for players; game state never advances without host action.

---

## Claude's Discretion

- Scoring formula (speed-based, linear decay 1000→500)
- Streak multiplier implementation (1.5× after 3 consecutive correct)
- Socket event names
- Animation approach
- Component file structure

## Deferred Ideas

- Media questions, Free Text, Lifelines — later phases
- Admin dashboard UI — Phase 7
- QR code on host screen, sound effects — Phase 8 polish
