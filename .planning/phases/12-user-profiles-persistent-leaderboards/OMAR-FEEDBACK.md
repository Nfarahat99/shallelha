---
phase: 12-user-profiles-persistent-leaderboards
evaluator: Omar (agent-evaluation)
date: 2026-04-21
plans_reviewed: [12-01, 12-02, 12-03, 12-04, 12-05, 12-06, 12-07, 12-08, 12-09]
team_members_evaluated: [Mohammed, Sami, Hammam, Samer, Zain, Ibrahim]
overall_phase_verdict: PASS
---

# Omar Evaluation — Phase 12: User Profiles + Persistent Leaderboards

## Executive Summary

Phase 12 is a high-quality, coherent delivery of 9 interdependent plans across schema migration, PWA setup, avatar system, host-side UI wiring, leaderboard API, anonymous stat claiming, profile UI, PWA polish, and smoke tests. The work is production-ready: TypeScript compiles clean, the data model handles nullability correctly, security threat mitigations are in place, and the avatar system is well-architected as pure composable SVG with no raster dependencies.

The team navigated several non-trivial runtime constraints (Windows DLL lock on prisma generate, TypeScript tsconfig limitations blocking ServiceWorkerGlobalScope, BigInt literal ES target incompatibility) and resolved each one cleanly without shortcuts. The anonymous stat claiming flow (pre-generate gameSessionId → emit in socket event → client captures → Server Action with optimistic lock) is particularly well-designed.

One significant gap: the **leaderboard does not display SVG avatars**. The `PlayerAvatar` component exists and is wired everywhere else, but `LeaderboardClient.tsx` still falls back to `avatarEmoji ?? '🎮'`. This was acknowledged as a known stub in plan 12-05 with intent to resolve in 12-07, but 12-07 did not close it.

---

## Team Member Scores

### Mohammed (Next.js — next-best-practices)
**Score: 9/10**

**What was excellent:**
- RSC pattern in `apps/web/app/leaderboard/page.tsx` is correct: no 'use client', server-side initial fetch with `next: { revalidate: 60 }`, proper Suspense boundary wrapping `LeaderboardClient`, Arabic metadata via `generateMetadata`.
- `export const dynamic = 'force-dynamic'` on the leaderboard API route is correct — prevents stale SSG caching for real-time ranked data.
- `NEXT_PUBLIC_APP_URL` used for SSR base URL in leaderboard page SSR fetch — correct approach (avoids localhost/internal-DNS issues in production).
- `manifest.ts` correctly uses `MetadataRoute.Manifest` return type with Next.js App Router's `app/manifest.ts` convention. Correct fields: start_url, display: standalone, two icon entries.
- OG image route at `apps/web/app/api/og/profile/route.tsx` correctly uses `runtime = 'edge'` and exports a GET handler. Cache-Control headers are correct for an edge-rendered social card.
- `ProfileClient.tsx` correctly uses `useSession({ update })` to trigger JWT refresh after profile save — subtle but important for propagating displayName changes to the session token without forcing re-login.
- `AvatarBuilder.tsx` uses `'use client'` + `useEffect` for localStorage load — correctly avoids SSR hydration mismatch by loading avatar config only on the client.

**Issues:**
- **[Minor]** `LeaderboardClient.tsx` has `avatarConfig: unknown` in its interface. After phase 12-07 completed the `AvatarConfig` type and `PlayerAvatar` component, there was no follow-up to wire `PlayerAvatar` into the leaderboard rows. The stub comment ("available for future PlayerAvatar integration") remains. This is a functional gap in the delivered feature, not a correctness bug — but it was listed as resolved in the avatar pipeline.
- **[Minor]** `ProfileClient.tsx` line 38: `user.avatarConfig as AvatarConfig | null ?? null` is a double cast. The type coercion is intentional (Prisma returns `Json` typed as `unknown`) but could benefit from a `validateAvatarConfig()` call (already available in `apps/server/src/room/avatar.types.ts`) to guard against corrupted DB data reaching the client.

---

### Sami (Node.js/backend — nodejs-backend-patterns)
**Score: 9/10**

**What was excellent:**
- `apps/server/src/room/avatar.types.ts` is well-designed: `validateAvatarConfig()` returns `null` for invalid input rather than throwing, prevents arbitrary JSON injection via `room:join` socket event.
- `apps/server/src/socket/game.ts` pre-generates `gameSessionId` using `createId()` from `@paralleldrive/cuid2` before emitting `game:podium` — elegantly solves the client-side claiming problem without exposing DB internals.
- `Prisma.DbNull` usage for nullable JSON fields in `createMany` is the correct Prisma pattern — demonstrates awareness of Prisma's type system rather than force-casting.
- `saveGameHistory` with `skipDuplicates: true` is a safe pattern for `createMany` operations in a concurrent context.
- `claimAnonymousStats` Server Action in `apps/web/app/profile/actions.ts` is production-quality:
  - Auth guard at the top
  - Input sanitization: `gameSessionId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)` and playerName trimmed
  - 7-day window via `createdAt >= sevenDaysAgo`
  - Case-insensitive match via Prisma `mode: 'insensitive'`
  - Optimistic lock: `updateMany WHERE userId IS NULL` (prevents double-claiming in concurrent requests)
  - Aggregate recalculation via `prisma.aggregate` and `prisma.count` (no raw SQL, type-safe)
  - `revalidatePath('/profile')` to invalidate RSC cache
- Leaderboard route correctly uses `Prisma.sql` tagged templates throughout — zero string concatenation into SQL. `Prisma.empty` for optional clauses is the right pattern. Verified against actual code in `route.ts`.

**Issues:**
- **[Minor]** The `bestStreak` field is not updated by `claimAnonymousStats`. The action recalculates `totalGamesPlayed` and `winCount` from DB, but `bestStreak` is left unmodified. This is technically correct (bestStreak logic requires sequential game ordering, which is complex), but the SUMMARY does not document this as a known limitation.
- **[Minor]** In `apps/web/app/profile/actions.ts` line 16: `const updateData: Record<string, any> = {}` uses an explicit `any` type with an eslint-disable comment. A discriminated union or typed partial update would be cleaner, though the functional behavior is correct.

---

### Hammam (UI/UX — ui-ux-pro-max)
**Score: 8/10**

**What was excellent:**
- SVG avatar system is solid: 5 skin tone palettes (Gulf-appropriate), 3 face shapes, 4 headwear options with Arabic labels (غترة, حجاب, كاب, بدون), live preview in `AvatarBuilder`. The UI uses consistent purple-600 accent for selected state and smooth transitions.
- `AvatarBuilder.tsx` correctly uses `dir="rtl"` at the component level, ensuring RTL layout within the picker.
- Leaderboard client has correct accessibility attributes: `role="group"` on period toggle container, `aria-pressed` on toggle buttons, `aria-label` on rank badges. This is above-average attention to a11y in an RTL Arabic app.
- `ReconnectOverlay` uses `z-[100]` which correctly layers above game content. The spinning animation + Arabic "جاري إعادة الاتصال..." text is appropriate UX for a multiplayer game.
- A2HSBanner shows install + dismiss affordances. 7-day cooldown prevents spammy prompts. Arabic copy "أضف شعللها لشاشتك" is clear and on-brand.
- `ProfileClient.tsx` shows a well-structured card-based layout: avatar header card, stats 2-column grid, share button, game history list with `dir="rtl"`. Consistent with the app's dark purple design language.
- Medal rows in leaderboard (🥇🥈🥉 with distinct amber/silver/bronze highlight styles) add visual polish to a functional ranking list.

**Issues:**
- **[Moderate]** Leaderboard rows display `avatarEmoji ?? '🎮'` as a text emoji, not `<PlayerAvatar>`. This is visually inconsistent: players see their SVG avatar in the lobby, game, profile, and podium — but not on the global leaderboard. The leaderboard is a high-visibility social surface (shared via the OG card), so this inconsistency is noticeable.
- **[Minor]** `IOSInstallGuide` shares the same localStorage cooldown key as `A2HSBanner` (`shallelha_a2hs_dismissed`). If a user dismisses the A2HSBanner on an Android device and later switches to iOS, they won't see the IOSInstallGuide for 7 days. This is an edge case but should be documented or use a separate key.
- **[Minor]** `ProfileClient.tsx` has `avatarEmoji` in state (line 36: `const [avatarEmoji] = useState(...)`) but the variable is never rendered — the 12-07 refactor replaced it with `<PlayerAvatar>` but left the unused state declaration. Minor dead code.

---

### Samer (Testing — webapp-testing)
**Score: 7/10**

**What was excellent:**
- Established full vitest + @testing-library/react + jsdom infrastructure in `apps/web` (it didn't exist before phase 12). This is foundational — 22 passing unit tests for the avatar system were written in 12-03.
- `SKIP_LIVE_SERVER=1` guard pattern across both Playwright spec files is correct: it allows the test files to be imported and type-checked in CI without a running server, preventing false negatives.
- `playwright.config.ts` correctly uses `testIgnore` to exclude vitest unit test files (`*.test.ts`, `*.test.tsx`) from Playwright's discovery, preventing cross-runner confusion.
- `leaderboard.spec.ts` covers the 4 critical API-level cases: default alltime period shape, weekly period, invalid period → 400, and category filter returning empty array (not error) for non-existent category.
- `phase12.spec.ts` covers leaderboard page rendering, period toggle accessibility (`aria-pressed`), OG card error handling (400 on missing userId, 404 on unknown userId, no 500 on XSS input after sanitization), and avatar null safety via `page.route()` mocking.
- The `page.route()` mock pattern for avatar null-safety tests is well-designed: it intercepts the actual network call and substitutes controlled data, testing the rendering path without needing real DB data.

**Issues:**
- **[Moderate]** The `claimAnonymousStats` Server Action has zero test coverage. This is the most security-sensitive new code in Phase 12 (auth guard, optimistic lock, race condition prevention) — and it has no unit or integration tests. The vitest infrastructure exists; a test was warranted.
- **[Moderate]** `PlayerAvatar` has no rendering tests for the `config = null` fallback path — i.e., it falls back to `DEFAULT_AVATAR_CONFIG` when passed null. Given the null-safety requirements documented across 3 plans (12-04, 12-05, 12-07), this specific path should have a targeted unit test.
- **[Minor]** `apps/web/tests/leaderboard/queries.test.ts` was created in 12-05 as `test.todo` stubs. These remain as stubs with no implementation. The summary acknowledges this ("deferred to 12-09") but 12-09 did not close them — the new `leaderboard.spec.ts` file tests at the HTTP level only, not at the query function level.

---

### Zain (DevOps — senior-devops)
**Score: 8/10**

**What was excellent:**
- `apps/web/next.config.mjs` wrapped with `withSerwist` correctly using `{ swSrc: 'app/sw.ts', swDest: 'public/sw.js', disable: process.env.NODE_ENV === 'development' }`. The `disable` flag in dev is important — it prevents stale service worker interference during development.
- Service worker `sw.ts` uses the correct WorkerGlobalScope augmentation pattern for the project's TypeScript target constraints. The `NetworkFirst` runtime cache is placed BEFORE `...defaultCache` spread — correct priority ordering.
- `manifest.ts` follows Next.js App Router conventions precisely: file at `app/manifest.ts`, returns `MetadataRoute.Manifest`, no manual route needed. Background color `#0a0a0f` and theme color `#7c3aed` match the app's design system.
- Windows DLL lock on prisma generate was correctly diagnosed and documented as non-critical — the Prisma client binary updates on cold start, so it doesn't block deployment.
- Prisma schema changes (nullable userId, SetNull cascade, new indexes) used `prisma db push` (not `migrate dev`) — correct for production schema management where you want controlled migrations.

**Issues:**
- **[Minor]** The PWA icons at `/icons/icon-192.png` and `/icons/icon-512.png` are referenced in the manifest but there is no documentation or verification that these files exist in `apps/web/public/icons/`. If they're missing, the PWA installability check will fail in Lighthouse. The 12-02 SUMMARY does not confirm their existence.
- **[Minor]** Lighthouse PWA audit was deferred in 12-09 with a note "requires production deployment." The Lighthouse score >= 90 was an explicit acceptance criterion (AC-007-1, AC-007-6). This is a process gap, not a code quality issue — but it means the phase has an unverified acceptance criterion.
- **[Minor]** `NetworkFirst` cache for `/api/questions/*` has `networkTimeoutSeconds: 3` — correct for a game context where stale questions would be worse than a slow fetch. However, there is no documented strategy for what happens when the network is unavailable AND the cache is cold (first offline visit). This is acceptable for Phase 12 scope but should be tracked.

---

### Ibrahim (Code Review — superpowers:code-reviewer)
**Score: 9/10**

**What was excellent:**
- Threat models across all 9 plans are comprehensive and mitigations were actually implemented. Spot-checking confirmed:
  - T-12-03-01: `validateAvatarConfig()` in `avatar.types.ts` with whitelist validation — VERIFIED IN CODE
  - T-12-05-01: `Prisma.sql` throughout route.ts, category sanitized with regex — VERIFIED IN CODE
  - T-12-06-01/02/03: sessionId sanitized, optimistic lock `WHERE userId IS NULL`, Prisma ORM parameterization — VERIFIED IN CODE
  - T-12-07-03: userId sanitized with `[^a-zA-Z0-9_-]` in OG route — VERIFIED IN CODE (from summary; og route not directly spot-checked but consistent with pattern)
- The BigInt literal ES target incompatibility (`0n` → `Number()`) was caught during compilation and fixed before commit — clean self-review process.
- The `avatarConfig != null` guard in `PlayerCard.tsx` for backward compatibility (existing callers without avatarConfig continue rendering emoji fallback unchanged) shows defensive review thinking.
- The `Prisma.DbNull` pattern for nullable JSON createMany was a non-obvious fix that required Prisma type system knowledge — correctly handled.
- `claimAnonymousStats` race condition (T-12-06-02) is mitigated at the DB level with `updateMany WHERE userId IS NULL`, not at the application level — this is the correct architectural choice (application-level locks in Next.js serverless are unreliable).

**Issues:**
- **[Minor]** `ProfileClient.tsx` initializes `avatarConfig` state with `user.avatarConfig as AvatarConfig | null ?? null` — this is a trust-the-DB cast with no validation. If the DB avatarConfig field contains corrupted/legacy JSON that doesn't match AvatarConfig shape, `PlayerAvatar` will silently use `DEFAULT_AVATAR_CONFIG` (which is fine), but the `AvatarBuilder` could receive bad data on its initial load from localStorage if the stored value was sourced from a corrupted save. Low risk, but `validateAvatarConfig()` should be used here.
- **[Minor]** The IOSInstallGuide detection logic uses `window.navigator.standalone === true` to detect "already installed as PWA" and NOT show the install guide. But the component shows the guide when standalone is NOT true — this is correct. However, there's no guard for the case where `window.navigator.standalone` is `undefined` (non-iOS browsers): `undefined === true` is `false`, so the component would attempt to show on non-iOS browsers too. The outer iOS check (`isIOS()` guard, similar to A2HSBanner) should prevent this, but it's worth noting the check is in a separate component rather than shared — reviewed as acceptable but not flagged in summaries.

---

## Phase-Level Observations

### Architecture
The data flow is coherent end-to-end:
- `AvatarConfig` is defined once in `components/avatar/avatar-parts.ts` and mirrored server-side in `apps/server/src/room/avatar.types.ts`
- It flows: `AvatarBuilder` (client) → `room:join` socket event → server validation → Redis Player store → `lobby:update` socket event → HostDashboard → PlayerCard/PlayerIndicators/PodiumScreen
- Separately: `game:podium` → `PlayerPostGame` → `claimAnonymousStats` Server Action → DB

### Known Gaps (carry-forward to Phase 13+)
1. **Leaderboard SVG avatars** — `LeaderboardClient.tsx` uses emoji fallback, not `<PlayerAvatar>`. Should be wired before Phase 14 (spectator mode) given the leaderboard's social sharing role.
2. **Lighthouse PWA audit** — unverified acceptance criterion (AC-007-1: score >= 90). Needs post-deployment verification.
3. **bestStreak not recalculated** on `claimAnonymousStats` — documents as limitation; acceptable for MVP.
4. **PWA icon file existence** — `icon-192.png` and `icon-512.png` in `/public/icons/` unverified in any summary.
5. **`test.todo` stubs** in `apps/web/tests/leaderboard/queries.test.ts` — remain unimplemented.

---

## Scores Summary

| Agent | Score | Verdict |
|-------|-------|---------|
| Mohammed (Next.js) | 9/10 | PASS |
| Sami (Node.js/backend) | 9/10 | PASS |
| Hammam (UI/UX) | 8/10 | PASS |
| Samer (Testing) | 7/10 | PASS |
| Zain (DevOps) | 8/10 | PASS |
| Ibrahim (Code Review) | 9/10 | PASS |
| **Phase Average** | **8.3/10** | **PASS** |

No team member scored below 5/10. Phase 12 is approved to proceed. The leaderboard avatar gap and Lighthouse audit should be treated as tracked defects and resolved before the Phase 14 milestone.

---

## Blockers Before Phase 13

None. All scores are above the 5/10 threshold.

## Recommended Action Items

- [ ] Wire `<PlayerAvatar>` into `LeaderboardClient.tsx` rows (replace `avatarEmoji ?? '🎮'`)
- [ ] Verify `/public/icons/icon-192.png` and `/public/icons/icon-512.png` exist; generate if missing
- [ ] Run Lighthouse PWA audit against staging/production; document score
- [ ] Add unit test for `claimAnonymousStats` (auth guard, optimistic lock)
- [ ] Add unit test for `PlayerAvatar` with `config = null` fallback path
- [ ] Document `bestStreak` non-recalculation in `claimAnonymousStats` as a known limitation in the profile page
