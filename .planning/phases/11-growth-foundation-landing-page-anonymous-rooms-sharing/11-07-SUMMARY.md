---
plan: 11-07
status: complete
---
# Plan 11-07 Summary — Profile Page + NextAuth Session Callbacks

## Completed
- Created `/profile` server component with Prisma upsert (creates user record if first visit)
- Created `updateProfile` server action with input validation (trim, max length, slice emoji)
- Created `ProfileClient` RTL client component: avatar header, 2x2 stats grid, game history list
- Extended `auth.ts` JWT callback to load `displayName`/`avatarEmoji` from DB on sign-in
- Extended `next-auth.d.ts` with `displayName` and `avatarEmoji` on both `Session` and `JWT`

## Files Modified/Created
- `apps/web/app/profile/page.tsx` — created (server component)
- `apps/web/app/profile/actions.ts` — created (server action)
- `apps/web/app/profile/ProfileClient.tsx` — created (client component)
- `apps/web/auth.ts` — modified (jwt + session callbacks extended)
- `apps/web/types/next-auth.d.ts` — modified (added displayName, avatarEmoji fields)

## Key Decisions
- Used `token.id ?? token.sub` in auth.ts because existing code stores the Google providerAccountId in `token.id`, not the standard `token.sub`. Fallback to `token.sub` ensures correctness if `token.id` is unset on edge cases.
- `EmojiPicker` already existed at `@/components/ui/EmojiPicker` so it was imported directly — no new component needed.
- `next-auth.d.ts` already existed with `id: string` on Session; extended it rather than replacing, preserving the existing declaration and adding `displayName?` and `avatarEmoji?` fields plus the `JWT` module augmentation.
- Profile upsert `create` block sets `displayName` from `session.user.name` so new users get a friendly default display name immediately.

## Verification
- Web TypeScript: clean (npx tsc --noEmit returned no errors)

## Self-Check
- `apps/web/app/profile/page.tsx`: FOUND
- `apps/web/app/profile/actions.ts`: FOUND
- `apps/web/app/profile/ProfileClient.tsx`: FOUND
- `apps/web/auth.ts`: FOUND (modified)
- `apps/web/types/next-auth.d.ts`: FOUND (modified)
- Commit `0243a52`: present in git log
