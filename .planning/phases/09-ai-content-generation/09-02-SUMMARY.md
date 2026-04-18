---
phase: 9
plan: "02"
subsystem: admin-ui
tags: [next.js, server-actions, admin-panel, ai-moderation, arabic-rtl]
dependency_graph:
  requires: ["09-01"]
  provides: ["admin-ai-generate-ui", "moderation-queue-ui"]
  affects: ["apps/web/app/(admin)/admin/questions"]
tech_stack:
  added: []
  patterns:
    - "Server Actions with async cookies() for cross-service auth forwarding"
    - "useTransition for async Server Action calls in Client Components"
    - "Parallel Promise.all queries in Server Component page"
    - "brand-* design tokens (no raw indigo-* classes)"
    - "Arabic RTL layout with dir=rtl"
key_files:
  created:
    - apps/web/app/(admin)/admin/questions/ai-actions.ts
    - apps/web/app/(admin)/admin/questions/AiGenerateButton.tsx
    - apps/web/app/(admin)/admin/questions/AiGenerateDialog.tsx
    - apps/web/app/(admin)/admin/questions/ModerationQueue.tsx
  modified:
    - apps/web/app/(admin)/admin/questions/page.tsx
    - apps/web/app/(admin)/layout.tsx
decisions:
  - "AiGenerateButton uses violet-600 to visually distinguish AI action from primary brand-600 actions"
  - "ModerationQueue returns null when questions.length === 0 (no empty state per plan spec)"
  - "Batch reject uses window.confirm() as a lightweight destructive-action confirmation (no modal overlay needed)"
  - "generateQuestionsAction forwards admin_session cookie via server-side Cookie header (never exposed to client JS)"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-18"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 2
---

# Phase 9 Plan 02: Admin UI — AI Generation Dialog & Moderation Queue Summary

Admin UI layer built on top of the Wave 1 Express backend route. JWT-authenticated admin can now trigger AI question generation from the questions page and review/moderate generated drafts inline — all in Arabic RTL with brand-token styling.

## What Was Built

### T1 — ai-actions.ts (Server Actions)

Three exported Server Actions in `apps/web/app/(admin)/admin/questions/ai-actions.ts`:

- **`generateQuestionsAction(categoryId, count)`** — POSTs to the Express `POST /admin/ai-generate` route, forwarding the `admin_session` cookie via a server-side `Cookie` header. Uses `cache: 'no-store'` and calls `revalidatePath('/admin/questions')` on success.
- **`approveQuestionsAction(ids[])`** — `prisma.question.updateMany` scoped to `status: 'draft'` only (T-09-09 mitigation).
- **`rejectQuestionsAction(ids[])`** — `prisma.question.deleteMany` scoped to `status: 'draft'` only (T-09-10 mitigation).

All three call `revalidatePath` after mutation. `cookies()` is `await`-ed per Next.js 14 async API requirement.

### T2 — AiGenerateButton + AiGenerateDialog

- **`AiGenerateButton`** — Client component, violet-600 with sparkle SVG icon, `min-h-[44px]`, renders `AiGenerateDialog` on click via local `useState`.
- **`AiGenerateDialog`** — Client component modal with:
  - Brand-600 header, brand tokens throughout (no `indigo-*`)
  - Category `<select>` + count `<input type="range" min=5 max=10>`
  - `useTransition` wrapping `generateQuestionsAction` call
  - Inline SVG spinner (`animate-spin`) during pending state
  - Success message showing count of generated questions
  - Error display with `role="alert"`
  - Backdrop click closes dialog, `dir="rtl"` on form

### T3 — ModerationQueue + page.tsx + layout.tsx wiring

- **`ModerationQueue`** — Client component table of DRAFT questions:
  - Returns `null` when `questions.length === 0`
  - Per-row `اعتماد` / `رفض` buttons calling approve/rejectQuestionsAction
  - Header "select all" checkbox + per-row checkboxes via `Set<string>` state
  - Batch approve/reject buttons appear when selection is non-empty
  - `useTransition` keeps UI responsive during mutations
  - `window.confirm()` guard before destructive batch reject

- **`page.tsx`** updated to:
  - Add parallel `draftQuestions` query (`where: { status: 'draft' }`)
  - Render `<AiGenerateButton categories={categories} />` next to "سؤال جديد"
  - Render `<ModerationQueue questions={draftQuestions} />` above filters

- **`layout.tsx`** updated with "قائمة المراجعة" sidebar nav link (sparkle icon, brand hover tokens).

## Commits

| Hash | Message |
|------|---------|
| da40d65 | feat(09-02): add ai-actions Server Actions (generate/approve/reject) |
| de5c16c | feat(09-02): add AiGenerateButton and AiGenerateDialog components |
| ba0de91 | feat(09-02): add ModerationQueue and wire AI UI into questions page |

## Verification

- `npx tsc --noEmit` — zero errors after each task
- `npx next build` — completed successfully, admin/questions route compiled as dynamic (ƒ)
- All 4 new files confirmed present in `apps/web/app/(admin)/admin/questions/`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data flows are wired: `draftQuestions` query feeds `ModerationQueue`, `categories` feeds `AiGenerateButton`/`AiGenerateDialog`, Server Actions call real Prisma and real Express backend.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model (T-09-07 through T-09-11). All mitigations implemented as specified.

## Self-Check: PASSED

- [x] `apps/web/app/(admin)/admin/questions/ai-actions.ts` — exists
- [x] `apps/web/app/(admin)/admin/questions/AiGenerateButton.tsx` — exists
- [x] `apps/web/app/(admin)/admin/questions/AiGenerateDialog.tsx` — exists
- [x] `apps/web/app/(admin)/admin/questions/ModerationQueue.tsx` — exists
- [x] Commits da40d65, de5c16c, ba0de91 — all present in git log
- [x] `next build` — passed
