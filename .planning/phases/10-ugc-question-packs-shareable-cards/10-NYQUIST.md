# Phase 10 Nyquist Test Map

Maps every requirement (R1–R5) from the CONTEXT.md acceptance criteria to the specific test types and test cases that verify it. Executors use this to ensure no requirement ships untested.

---

## R1 — Pack Creator: Host creates and submits a pack with AI assist

**Acceptance criteria:** Host creates pack with 5+ questions and submits for review in under 3 min. AI generation returns 10 draft questions within 5 seconds.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | POST /packs creates Pack + PackQuestion rows in correct order; rejects payloads with < 1 question |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | PATCH /packs/:id/status transitions DRAFT → PENDING; rejects PENDING → APPROVED (admin-only path) |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | GET /packs/mine returns only packs owned by createdBy param |
| Integration | Integration (Vitest + real Prisma) | `apps/server/src/routes/__tests__/packs.test.ts` | Full CRUD: create pack → update status → read back → delete; all using `[TEST_PACK]` prefix + afterEach cleanup |
| E2E | Playwright | `apps/web/tests/e2e/phase10-pack-creator.spec.ts` | Host signs in, creates a pack with 5 questions, submits for review — /packs/my-packs shows "قيد المراجعة" badge |

---

## R2 — Pack Marketplace: Host finds and starts game with community pack in < 60 seconds

**Acceptance criteria:** /packs loads APPROVED packs with working category filter. "Play this pack" → /host/new?packId= pre-selects the pack. Room creation succeeds with packId stored in Redis room config.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | GET /packs returns only APPROVED packs when no status param; GET /packs?category=رياضة filters correctly |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | GET /packs/:id returns full questions array; 404 for non-existent pack |
| TypeScript | Compile check | `apps/web` | `npx tsc --noEmit` — PackCard, PackFilters, /packs/[packId] compile clean |
| Integration | Build check | `apps/web` | `npx next build` passes — /packs and /packs/[packId] pages render without errors |
| E2E | Playwright | `apps/web/tests/e2e/phase10-marketplace.spec.ts` | Navigate /packs → click category filter → verify pack list updates; click pack → verify CTA navigates to /host/new?packId= |

---

## R3 — Admin Approval Queue: Admin approves or rejects a pack, result visible immediately

**Acceptance criteria:** /admin/packs shows PENDING packs. Approve action transitions pack to APPROVED and it appears in /packs marketplace. Reject action stores rejectionReason visible to pack creator on /packs/my-packs.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | GET /packs?status=PENDING returns only PENDING packs; PATCH /packs/:id/status → APPROVED works |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | PATCH /packs/:id/status → REJECTED with rejectionReason persists the reason field |
| Security | Unit (Vitest) | `apps/server/src/routes/__tests__/packs.test.ts` | Reject request without admin cookie (simulate from approvePack action contract) — Server Action must throw 'Unauthorized' |
| TypeScript | Compile check | `apps/web` | `npx tsc --noEmit` — approvePack, rejectPack Server Actions in apps/web/app/admin/packs/actions.ts compile clean |
| Build | Build check | `apps/web` | `npx next build` — /admin/packs page builds without errors |
| E2E | Playwright | `apps/web/tests/e2e/phase10-admin-approval.spec.ts` | Admin approves pending pack → verify pack appears in /packs marketplace; reject with reason → verify reason shown on /packs/my-packs |

---

## R4 — Shareable Result Cards: Card generated within 3 seconds, downloads/shares on mobile

**Acceptance criteria:** GET /cards/result?gameId=&variant= returns PNG. Snapchat 9:16 = 1080×1920, WhatsApp 1:1 = 1080×1080. Web Share API opens native share sheet on mobile. Download fallback works on desktop.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/cards.test.ts` | GET /cards/result?gameId=X&variant=whatsapp returns Content-Type: image/png and status 200 (mock Redis with valid leaderboard) |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/cards.test.ts` | GET /cards/result?gameId=NONEXISTENT returns 404 |
| Unit | Unit (Vitest) | `apps/server/src/routes/__tests__/cards.test.ts` | renderCard() called with snapchat variant produces buffer larger than 0 bytes (satori → PNG pipeline doesn't throw) |
| TypeScript | Compile check | `apps/web` | `npx tsc --noEmit` — ResultCard.tsx compiles; navigator.canShare usage properly guarded with optional chaining |
| Visual | Human checkpoint | 10-06-PLAN.md Task 3 | Play game to end → verify card image, both variants, share/download buttons |

---

## R5 — Quick UX Wins: Live rank delta, answer count progress, freeze overlay

**Acceptance criteria:** rankDelta present in leaderboard broadcast. question:progress event emitted after each player answer. FreezeOpponentOverlay renders full-screen when frozenCurrentQ is true.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest) | `apps/server/src/game/__tests__/game.test.ts` | rankDelta = previousRank - currentRank: positive when rank improves, negative when drops, 0 when unchanged (with pre-seeded previousRankings map) |
| Unit | Unit (Vitest) | `apps/server/src/game/__tests__/game.test.ts` | answerCount increments from 0 after each player:answer event; resets to 0 when next question starts |
| Unit | Unit (Vitest) | `apps/server/src/game/__tests__/game.test.ts` | question:progress event emits {answerCount, playerCount} payload to room after each answer |
| TypeScript | Compile check | `apps/web` | `npx tsc --noEmit` — FreezeOpponentOverlay.tsx, updated PlayerJoin.tsx, updated QuestionDisplay.tsx all compile clean |
| E2E | Playwright | `apps/web/tests/e2e/phase10-ux-wins.spec.ts` | Test 1: rank delta badge visible after first question in answer confirmation state |
| E2E | Playwright | `apps/web/tests/e2e/phase10-ux-wins.spec.ts` | Test 2: "١ من ٢ أجابوا" counter appears on player screen after player 1 answers |
| E2E | Playwright | `apps/web/tests/e2e/phase10-ux-wins.spec.ts` | Test 3: Freeze overlay renders full-screen on player 2's screen when player 1 uses freeze lifeline; overlay clears on question advance |

---

## Groq AI Pack Assistant (R1 sub-requirement)

**Acceptance criteria:** POST /ai/pack-generate returns 10 questions in under 5 seconds. Rate limit 3 req/host/hour enforced. 503 returned if GROQ_API_KEY missing.

| Layer | Test type | File | What it verifies |
|-------|-----------|------|-----------------|
| Unit | Unit (Vitest, mock groq-sdk) | `apps/server/src/routes/__tests__/ai-pack.test.ts` | POST /ai/pack-generate: mocked Groq response → returns {questions[10], model} with correct shape |
| Unit | Unit (Vitest, mock groq-sdk) | `apps/server/src/routes/__tests__/ai-pack.test.ts` | Returns 503 with Arabic error when GROQ_API_KEY is absent (unset process.env) |
| Unit | Unit (Vitest, mock groq-sdk) | `apps/server/src/routes/__tests__/ai-pack.test.ts` | Returns 429 with Arabic error after 3 requests from the same session cookie key (simulate limiter exhaustion) |
| Unit | Unit (Vitest, mock groq-sdk) | `apps/server/src/routes/__tests__/ai-pack.test.ts` | Invalid JSON from Groq → 500 with Arabic fallback message, no crash |

---

## Test File Ownership Matrix

| Requirement | Test file | Plan that creates it |
|-------------|-----------|---------------------|
| R1, R2, R3 (Pack CRUD) | `apps/server/src/routes/__tests__/packs.test.ts` | 10-01-PLAN.md Task 2 |
| Groq AI (R1 sub) | `apps/server/src/routes/__tests__/ai-pack.test.ts` | 10-03-PLAN.md Task 2 |
| R4 (Cards) | `apps/server/src/routes/__tests__/cards.test.ts` | 10-06-PLAN.md Task 1 |
| R5 (UX Wins server) | `apps/server/src/game/__tests__/game.test.ts` | 10-07-PLAN.md Task 1 |
| R5 (UX Wins E2E) | `apps/web/tests/e2e/phase10-ux-wins.spec.ts` | 10-07-PLAN.md Task 2 |
| R1 (Pack Creator E2E) | `apps/web/tests/e2e/phase10-pack-creator.spec.ts` | 10-02-PLAN.md Task 3 checkpoint |
| R2 (Marketplace E2E) | `apps/web/tests/e2e/phase10-marketplace.spec.ts` | 10-04-PLAN.md Task 3 checkpoint |

---

## Nyquist Coverage Rule

For each requirement, the test must run an automated command that can PASS or FAIL without human involvement. Human checkpoints (checkpoint:human-verify) are supplemental verification — they do not count as Nyquist coverage.

All integration tests use `[TEST_PACK]` prefix on test data and `afterEach(() => prisma.pack.deleteMany({ where: { name: { startsWith: '[TEST_PACK]' } } }))` cleanup.
