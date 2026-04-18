---
plan: 11-02
status: complete
wave: 1
completed_at: 2026-04-19
---

# Plan 11-02 — Landing Page CTA Update

## What was done
Updated landing page CTA copy and OG meta tags per UI-SPEC. Changed both hero and final-CTA section button text, updated button styles to match spec (rounded-2xl, min-h-[56px]), and replaced metadata with new title, description, OG tags, and Twitter card.

## Files modified
- apps/web/app/page.tsx

## Changes detail

### CTA Copy (hero section + final CTA section)
- Primary CTA: "أنشئ غرفة" → "ابدأ لعبة" (href=/host)
- Secondary CTA: "عندك كود؟ انضم" → "انضم للعبة" (href=/join)

### Button styles updated
- Primary: rounded-2xl, min-h-[56px], text-brand-600 (hero) / bg-brand-600 text-white (final CTA)
- Secondary: rounded-2xl, min-h-[56px], bg-white/15 border border-white/30 (hero) / border-2 border-brand-200 (final CTA)

### Metadata
- title: 'شعللها 🎮 — لعبة الأسئلة الجماعية'
- description: 'ابدأ لعبة أسئلة مع أصدقائك في ثوانٍ — بدون تسجيل'
- openGraph: title, description, type: 'website' (removed locale)
- twitter: card: 'summary_large_image' (added)

## Verification
- TypeScript: PASS
- Primary CTA: "ابدأ لعبة" ✓
- Secondary CTA: "انضم للعبة" ✓
- OG meta tags: present ✓
- Twitter card: present ✓

## Deviations from Plan
None — plan executed exactly as written.
