---
phase: 8
name: Polish, Performance & Launch
status: draft
created: 2026-04-14
author: gsd-ui-researcher
---

# UI-SPEC — Phase 8: Polish, Performance & Launch

## 1. Design System

### Source: Detected from codebase (not shadcn — no components.json)

The project uses plain Tailwind CSS v3 with logical RTL properties. No third-party UI component library. All tokens are inferred from the existing codebase.

### 1.1 Font

| Token | Value | Source |
|---|---|---|
| Font family | Cairo (Arabic + Latin subsets) | `apps/web/app/layout.tsx` |
| CSS variable | `--font-cairo` | `tailwind.config.ts` |
| Fallback stack | `Geeza Pro, Arabic Typesetting, sans-serif` | `tailwind.config.ts` |
| Loaded weights | 400, 600, 700, 900 | `apps/web/app/layout.tsx` |

**Typography scale used in Phase 8 components (3 sizes, 2 weights):**

| Role | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| Body / labels | 14px (`text-sm`) | 400 (`font-normal`) | 1.5 | Error messages, helper text |
| UI text | 16px (`text-base`) | 600 (`font-semibold`) | 1.5 | Button labels, skeleton placeholder labels |
| Heading / status | 20px (`text-xl`) | 700 (`font-bold`) | 1.2 | Disconnection banner headline |

No sizes below 14px in Phase 8 interactive surfaces. Font sizing is `text-sm` / `text-base` / `text-xl` only.

### 1.2 Color Palette

Extracted from existing component classes. No new colors introduced in Phase 8.

**60% Dominant Surface (white / near-white):**
| Token | Tailwind class | Hex |
|---|---|---|
| Page background | `bg-white` | #ffffff |
| Input border idle | `border-gray-300` | #d1d5db |
| Timer bar track | `bg-gray-200` | #e5e7eb |

**30% Secondary (gray scale — cards, labels, metadata):**
| Token | Tailwind class | Hex |
|---|---|---|
| Secondary text | `text-gray-500` | #6b7280 |
| Placeholder / skeleton base | `bg-gray-200` | #e5e7eb |
| Skeleton shimmer highlight | `bg-gray-100` | #f3f4f6 |
| Disabled / spent lifeline | `bg-gray-200 text-gray-400` | — |

**10% Accent (indigo — reserved for specific elements only):**

Accent `indigo-600` (#4f46e5) is reserved for:
- Primary CTA buttons (انضم, انضم إلى الغرفة, ابدأ اللعبة)
- Inline loading spinner border (`border-indigo-600`)
- Timer bar fill (`bg-indigo-500`)
- Active lifeline buttons (`bg-indigo-600`)
- Focus rings (`ring-indigo-500`)
- Button loading overlay spinner

**Semantic colors (destructive / status only):**
| Purpose | Tailwind class | Hex | Reserved for |
|---|---|---|---|
| Error surface | `bg-red-50 border-red-200 text-red-700` | — | Error state panels: invalid code, full room |
| Error destructive | `text-red-600` | #dc2626 | Inline freeze error, disconnect warning |
| Success indicator | `bg-green-500` | #22c55e | Connected status dot |
| Disconnected indicator | `bg-gray-300` | #d1d5db | Disconnected status dot |

### 1.3 Spacing Scale

8-point scale only. All padding, gap, and margin values are multiples of 4px.

| Token | Tailwind | px |
|---|---|---|
| xs | `p-2 / gap-2` | 8px |
| sm | `p-3 / gap-3` | 12px |
| md | `p-4 / gap-4` | 16px |
| lg | `p-6 / gap-6` | 24px |
| xl | `p-8 / gap-8` | 32px |

Touch targets: minimum `min-h-[44px] min-w-[44px]` on all interactive elements (iOS 44pt standard, enforced by existing `AnswerOptions` and `LifelineBar`).

### 1.4 Border Radius

| Context | Tailwind class |
|---|---|
| Buttons (primary) | `rounded-xl` |
| Buttons (answer options) | `rounded-2xl` |
| Error panels / skeletons | `rounded-xl` |
| Skeleton pills | `rounded-full` |

### 1.5 Component Library Status

No shadcn installed. No `components.json`. All components are bespoke Tailwind. Phase 8 follows the same pattern — no new libraries introduced.

---

## 2. Loading States

**Rule:** Loading states must preserve the exact dimensions of the loaded element. No layout shift during transition. `pointer-events-none` on all loading elements.

### 2.1 Join Room Button — async loading state

**Trigger:** User submits the join form (тaps "انضم إلى الغرفة"). Loading starts when `socket.emit('room:join')` fires. Ends on `room:joined` or `room:error`.

**Implementation contract:**

```
Button dimensions: w-full rounded-xl px-6 py-4 text-lg font-bold
Normal state:      bg-indigo-600 text-white
Loading state:     bg-indigo-600 text-white opacity-70 pointer-events-none cursor-not-allowed
```

Loading content (replaces button label):
```
[inline spinner 20px] + [space 8px] + "جارٍ الانضمام…"
```

Spinner spec: `h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block`

The button must not resize. The spinner + text must fit within the existing `py-4` height.

### 2.2 Answer Buttons — async disabled state

**Trigger:** Player taps an answer. The selected answer gets highlighted via existing `WaitingScreen` flow (already implemented). The other three buttons go to `bg-gray-200 text-gray-400` — this is already handled by `AnswerOptions`.

**Phase 8 addition:** When the entire `AnswerOptions` set is `disabled` (e.g., between questions, during lifeline activation), add `opacity-60` to the entire `AnswerOptions` container — not individual buttons — so layout is preserved.

**No spinner on answer buttons.** The `WaitingScreen` component already handles the post-tap state with a spinner and waiting copy.

### 2.3 Lifeline Buttons — async pending state

**Trigger:** Player taps a lifeline button. Between emit and server acknowledgement (`lifeline:double_points_ack`, `lifeline:remove_two_result`, `lifeline:freeze_ack`), the tapped button enters a pending state.

**Pending state spec:**

```
Dimensions: same as active (flex-1, rounded-xl px-3 py-2 min-h-[44px])
Visual:     bg-indigo-400 text-white opacity-80 pointer-events-none
Content:    small inline spinner replaces label text
```

Spinner: `h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block`

Duration: typically under 200ms. If server does not respond within 3s, revert to active state silently.

---

## 3. Skeleton Screens

**Rule:** Skeletons animate continuously. They use the same pixel dimensions as the real content they replace. They do not shift layout when content loads.

**Animation:** `animate-pulse` (Tailwind built-in, maps to CSS `pulse` keyframe — see Section 5). No shimmer variant required; pulse is sufficient and matches the existing `animate-pulse` usage in the codebase (lobby waiting text, host loading text).

**Base skeleton block classes:** `bg-gray-200 rounded-xl animate-pulse`

### 3.1 Player Controller — Waiting-for-Game-Start Skeleton

**Context:** The player is in the `lobby` phase (`PlayerJoin` phase === 'lobby'). The real content shows: emoji (48px), name + room code text, a PlayerCard list, and a pulsing "في انتظار المضيف…" text.

**Current implementation** already shows real player data (no skeleton needed for cards that have data). The skeleton is for the **initial instant** before `lobby:update` fires — when the player list is empty.

**Empty player list skeleton (shown when `players.length === 0` and phase === 'lobby'):**

```
Container: w-full max-w-sm space-y-2

Skeleton card 1: w-full h-[56px] bg-gray-200 rounded-xl animate-pulse
Skeleton card 2: w-full h-[56px] bg-gray-200 rounded-xl animate-pulse opacity-70
Skeleton card 3: w-[75%] h-[56px] bg-gray-200 rounded-xl animate-pulse opacity-40
```

Three cards, decreasing opacity, suggesting an indeterminate count. Dimensions match the real `PlayerCard` height (inferred: `py-3 px-4 rounded-xl` = approximately 56px at 14px font + line-height).

**Header skeleton (shown when emoji/name not yet resolved):**

```
Emoji placeholder: w-12 h-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-2
Name line:         w-40 h-6 bg-gray-200 rounded-lg animate-pulse mx-auto
Sub-text line:     w-28 h-4 bg-gray-200 rounded-lg animate-pulse mx-auto mt-1
```

The real content loads when `room:joined` fires (on reconnect) or immediately after join form submit succeeds.

### 3.2 Host Waiting Room — Player Join Skeleton

**Context:** `HostDashboard` status === 'lobby', `players.length === 0`.

**Current implementation** shows: "في انتظار اللاعبين…" text (centered, `text-gray-400 py-8 text-sm`). This is adequate but needs a skeleton upgrade for Phase 8 polish.

**Phase 8 replacement for the empty-players state:**

```
Container: space-y-2 w-full

Skeleton row 1: w-full h-[52px] bg-gray-200 rounded-xl animate-pulse
Skeleton row 2: w-full h-[52px] bg-gray-200 rounded-xl animate-pulse opacity-70
Skeleton row 3: w-[60%] h-[52px] bg-gray-200 rounded-xl animate-pulse opacity-40
```

The "اللاعبون (0/8)" label above the list remains visible (it is real data). Only the empty-list area is skeletonized. The skeleton is replaced by real `PlayerCard` entries as players join; each card renders immediately on `lobby:update`.

---

## 4. Error States

**Rule:** Error state UI must not cause layout shift. All errors appear above (or in place of) their triggering element. Errors are dismissable by the user via an explicit close action OR auto-clear when the error condition resolves.

### 4.1 Full Room Error

**Trigger:** `room:error` fires with message indicating room is full (8 players).

**Display location:** Replaces or appears above the join button in `PlayerJoin` phase === 'form'.

**Visual spec:**
```
Container:  w-full rounded-xl bg-red-50 border border-red-200 px-4 py-3
Layout:     flex items-start gap-3
Icon:       SVG warning icon, 20px, text-red-500, shrink-0
Text block: flex flex-col gap-1
  - Headline: text-sm font-semibold text-red-700 — "الغرفة ممتلئة"
  - Body:     text-xs text-red-600 — "تواصل مع المضيف أو انتظر حتى تُفتح غرفة جديدة"
```

**Dismiss:** No X button. Error clears when user edits the room code field (clearing and re-entering). Error does not auto-clear.

**Existing partial:** `PlayerJoin` already renders a generic error div. Phase 8 replaces this with the structured error component above.

### 4.2 Invalid Room Code Error

**Trigger:** `room:error` fires with message indicating room not found / invalid code.

**Display location:** Same slot as full-room error (above join button).

**Visual spec:**
```
Container:  w-full rounded-xl bg-red-50 border border-red-200 px-4 py-3
Layout:     flex items-start gap-3
Icon:       SVG X-circle icon, 20px, text-red-500, shrink-0
Text block: flex flex-col gap-1
  - Headline: text-sm font-semibold text-red-700 — "كود الغرفة غير صحيح"
  - Body:     text-xs text-red-600 — "تأكد من الكود وحاول مجدداً"
```

**Dismiss:** Error clears as soon as the user modifies the code input (via `onChange`). This provides instant feedback that the system received the correction attempt.

**Implementation note:** The existing `setError(message)` / `error` state in `PlayerJoin` handles this. Phase 8 adds the structured icon + two-line format and the auto-clear on input change.

### 4.3 Disconnection Banner

**Trigger:** Socket `disconnect` event. Shown over any game screen (player controller or host dashboard).

**Display location:** Fixed banner at top of screen (below the existing `PlayerTimerBar` which sits at `top-0 z-50`). Banner sits at `top-[6px]` to clear the timer bar, or `top-0` when timer bar is not present (join/lobby screens).

**z-index:** `z-40` (below timer bar `z-50`, above game content).

**Visual spec:**
```
Position:   fixed top-[6px] inset-x-0 z-40
Container:  bg-red-600 text-white px-4 py-2 flex items-center gap-3
Icon:       SVG wifi-off icon, 16px, text-white, shrink-0
Text:       text-sm font-semibold — "انقطع الاتصال — جارٍ إعادة الاتصال…"
Reconnect spinner: h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ms-auto shrink-0
```

**Auto-clear:** Banner disappears automatically when socket `connect` event fires. No manual dismiss.

**Reconnect success micro-state (200ms, then auto-hide):**
```
bg-green-600 text-white
Text: "تم الاتصال"
Icon: SVG check-circle, 16px
No spinner
```

The success state lasts 1500ms then fades out (`opacity-0 transition-opacity duration-300`).

**Reconnect within 10s:** The server supports `reconnect:player` (implemented in Phase 2). The banner must remain visible for the full reconnect window. If reconnect succeeds, show the success micro-state then hide.

### 4.4 Error Hierarchy

Phase 8 introduces a single structured `ErrorBanner` component usable across both player and host surfaces. The component accepts:

```typescript
interface ErrorBannerProps {
  variant: 'inline' | 'fixed-top'
  type: 'full-room' | 'invalid-code' | 'disconnect' | 'reconnected'
  onDismiss?: () => void   // only for inline variants
}
```

---

## 5. Animation Specs

### 5.1 Pulse Keyframe (skeleton screens)

Uses Tailwind's built-in `animate-pulse`. Do not define a custom keyframe.

```css
/* Tailwind built-in — do not rewrite */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
```

| Property | Value |
|---|---|
| Duration | 2s |
| Timing function | cubic-bezier(0.4, 0, 0.6, 1) |
| Iteration | infinite |

Staggered skeleton rows use reduced `opacity` at rest (0.7, 0.4) to suggest depth — they share the same animation, not different durations.

### 5.2 Spinner Keyframe (loading buttons, reconnect banner)

Uses Tailwind's built-in `animate-spin`.

```css
/* Tailwind built-in — do not rewrite */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

| Property | Value |
|---|---|
| Duration | 1s |
| Timing function | linear |
| Iteration | infinite |

### 5.3 Disconnection Banner Entry/Exit

Entry: `translate-y-0 opacity-100` (no animation — banner appears instantly on disconnect).
Exit (reconnected success state then hide):

```css
transition: opacity 300ms ease-out;
```

Applied via Tailwind: `opacity-0 transition-opacity duration-300`. Remove the element from DOM after 300ms delay.

### 5.4 Reconnect Success State Timing

| Event | Delay | Action |
|---|---|---|
| `connect` fires | 0ms | Switch banner to green "تم الاتصال" variant |
| 1500ms | +1500ms | Add `opacity-0` class |
| 1800ms | +300ms | Remove banner from DOM |

### 5.5 Reduced Motion

All animations must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse { animation: none; opacity: 0.7; }
  .animate-spin  { animation: none; }
}
```

Add these rules to `apps/web/app/globals.css`. Skeleton blocks become static at 70% opacity. Spinners become static (user sees the partial-border arc — sufficient indication).

---

## 6. RTL Layout Notes

### 6.1 Global RTL Context

`<html lang="ar" dir="rtl">` is set in `apps/web/app/layout.tsx`. All Phase 8 components inherit RTL automatically.

### 6.2 Logical Properties — Mandatory

All Phase 8 component authors must use logical Tailwind properties only.

| Wrong | Correct |
|---|---|
| `ml-*`, `mr-*` | `ms-*`, `me-*` |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `left-0`, `right-0` | `inset-inline-start-0` or use `inset-x-0` (symmetrical) |

Exception: `inset-x-0` is correct for full-width elements (banners, timer bar) — it applies both sides symmetrically.

### 6.3 Disconnection Banner RTL Layout

```
[wifi-off icon] [text] [spinner]
```

In RTL, flex-row renders right-to-left:
- In Arabic reading order: spinner appears on the left (inline-start), icon on the right (inline-end).
- This is correct — the icon introduces the message, spinner indicates activity.

Use `flex flex-row items-center gap-3` (no directional overrides needed).

### 6.4 Skeleton Alignment

Skeleton blocks use `rounded-xl` with percentage widths (`w-full`, `w-[75%]`, `w-[60%]`). In RTL, partial-width blocks naturally align to inline-start (right). This is correct for Arabic content stubs.

### 6.5 Inline Spinner in Buttons

`inline-block` spinner inside a button:
```
[spinner inline-block] [space 8px gap-2] [Arabic text]
```

In RTL, the spinner renders to the right of the text. This is acceptable for inline loading indicators — the spinner does not carry semantic directionality.

### 6.6 Error Icon Alignment

Icons in error panels use `shrink-0` and appear first in the flex row. In RTL this places the icon to the right of the text, which is the correct reading-order position for Arabic.

### 6.7 Fixed Positioning

The disconnection banner uses `fixed top-[6px] inset-x-0` — `inset-x-0` is direction-neutral (sets both `left: 0` and `right: 0`), correct for full-width elements.

---

## 7. Copywriting Contract

All copy is Arabic. No English strings in Phase 8 UI surfaces.

### 7.1 Loading State Copy

| Context | Arabic copy |
|---|---|
| Join button loading | جارٍ الانضمام… |
| Lifeline button pending | (spinner only — no text) |
| Question loading fallback | جارٍ تحميل السؤال… (already in codebase) |
| Host question loading | جارٍ تحميل الأسئلة… (already in codebase) |

### 7.2 Error State Copy

| Error | Headline | Body |
|---|---|---|
| Full room | الغرفة ممتلئة | تواصل مع المضيف أو انتظر حتى تُفتح غرفة جديدة |
| Invalid code | كود الغرفة غير صحيح | تأكد من الكود وحاول مجدداً |
| Disconnected | انقطع الاتصال — جارٍ إعادة الاتصال… | (no body — banner only) |
| Reconnected | تم الاتصال | (no body — green banner only) |

### 7.3 Empty State Copy

The following empty states exist in the codebase and are already correct. Do not change:

| Location | Copy |
|---|---|
| Host lobby, no players | في انتظار اللاعبين… |
| Player lobby, waiting for host | في انتظار المضيف… |

### 7.4 Destructive Actions in Phase 8

No new destructive actions are introduced in Phase 8. The existing "إنهاء اللعبة" (end game) flow in `HostControls` is out of scope for this phase.

---

## 8. Acceptance Criteria

All criteria are measurable and testable via E2E test or visual inspection.

### 8.1 Loading States

- [ ] Join button shows inline spinner + "جارٍ الانضمام…" within 100ms of form submit tap
- [ ] Join button is `pointer-events-none` during loading — double-tap does not emit two `room:join` events
- [ ] Join button dimensions do not change between normal and loading state (height delta = 0)
- [ ] Lifeline button that has been tapped shows spinner during server round-trip
- [ ] Lifeline button reverts to correct post-ack state (spent or active) within 200ms of server response
- [ ] Answer buttons enter `opacity-60` container state between questions without layout shift

### 8.2 Skeleton Screens

- [ ] Player lobby skeleton renders 3 staggered skeleton cards when `players.length === 0`
- [ ] Skeleton cards are replaced by real `PlayerCard` elements within one render cycle of `lobby:update`
- [ ] Host lobby skeleton renders 3 skeleton rows when `players.length === 0`
- [ ] Skeleton rows animate with `animate-pulse` at 2s duration
- [ ] No layout shift (CLS) when skeleton transitions to real content — dimensions must match

### 8.3 Error States

- [ ] Full-room error renders icon + headline + body in `bg-red-50 border-red-200` panel
- [ ] Full-room error does not auto-clear — persists until user interaction
- [ ] Invalid-code error clears when user modifies the code input field
- [ ] Disconnection banner appears within one event loop tick of socket `disconnect`
- [ ] Disconnection banner shows animated spinner
- [ ] Disconnection banner auto-clears after 1500ms + 300ms fade when socket reconnects
- [ ] Reconnected success state shows green banner with "تم الاتصال" for 1500ms before fade

### 8.4 Animation

- [ ] `animate-pulse` runs on all skeleton blocks
- [ ] `animate-spin` runs on all loading spinners
- [ ] `@media (prefers-reduced-motion: reduce)` disables both animations in globals.css
- [ ] Reconnect success fade transition is exactly 300ms

### 8.5 RTL Layout

- [ ] All Phase 8 components use logical Tailwind properties (ms/me/ps/pe, text-start/end) — no ml/mr/pl/pr
- [ ] Error panels render with icon on the right (inline-end), text on the left (inline-start) in Arabic RTL
- [ ] Disconnection banner reads right-to-left: icon → message → spinner
- [ ] Partial-width skeleton blocks align to inline-start (right edge) in RTL

### 8.6 Accessibility

- [ ] Loading spinners have `aria-hidden="true"` (decorative) OR `role="status" aria-label="جارٍ التحميل"`
- [ ] Disconnection banner has `role="alert"` so screen readers announce it immediately
- [ ] Error panels have `role="alert"` so screen readers announce errors on appearance
- [ ] All interactive elements maintain 44x44px minimum touch target during and after loading

### 8.7 Mobile

- [ ] All loading/error/skeleton states render correctly at 375px viewport width
- [ ] No horizontal scroll introduced by any Phase 8 component
- [ ] iOS safe-area insets respected — `pb-[env(safe-area-inset-bottom)]` preserved on `PlayerGameScreen`

---

## Appendix: Component Inventory for Phase 8

New components to be created (file paths are recommended, not enforced):

| Component | Path | Purpose |
|---|---|---|
| `ErrorBanner` | `apps/web/components/ui/ErrorBanner.tsx` | Unified inline + fixed-top error states |
| `DisconnectBanner` | `apps/web/components/ui/DisconnectBanner.tsx` | Fixed-top socket disconnect indicator |
| `SkeletonCard` | `apps/web/components/ui/SkeletonCard.tsx` | Reusable skeleton row for player lists |
| `LoadingButton` | `apps/web/components/ui/LoadingButton.tsx` | Button wrapper with loading/spinner state |

Existing components to be modified:

| Component | Modification |
|---|---|
| `PlayerJoin.tsx` | Replace `setError` raw div with `ErrorBanner` component; add loading state to join button |
| `LifelineBar.tsx` | Add pending state (spinner) between tap and server ack |
| `HostDashboard.tsx` | Replace empty-players text with `SkeletonCard` rows |
| `apps/web/app/globals.css` | Add `prefers-reduced-motion` block for pulse and spin |
