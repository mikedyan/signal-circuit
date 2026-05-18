# Day 80 — Polish Sprint (Cycle 2 PRUNE Week, Day 4)

**Date:** 2026-05-18 (Monday)
**Build under audit going in:** `?v=1779638400`, `sw.js CACHE_NAME = 'signal-circuit-v54'` (Day 79)
**Target build out:** `?v=1779724800`, `sw.js CACHE_NAME = 'signal-circuit-v55'`
**LOC budget:** net-neutral or small-positive (~±50 LOC)
**Commits:** single (Day 65 + Day 79 cleanup-day precedent)

## Scope

Smooth the core loop end-to-end. Surface a few small wins without re-opening
any cuts.

## Cold-start defaults audit (a)

| Default | Current value | Verdict | Action |
|---|---|---|---|
| Master volume | 0.3 | Reasonable mute-friendly default | KEEP |
| SFX volume | 0.4 (post-Day 46) | Click feedback still wants ~40% | KEEP — annotate |
| Music volume | 0.2 (post-Day 46) | Ambient pad reads quiet, by design | KEEP — annotate |
| Theme | auto (prefers-color-scheme) | Day 35 already auto-detects | KEEP |
| Difficulty | Standard (silent-default since Day 78) | Day 78 cut #5 stuck | KEEP |
| Notif Settings | Daily + Streak only (post-Day 79) | Trimmed Day 79 | KEEP |

No defaults change. The cycle's prior days had already landed the right
calls; today's pass is a polish-and-confirm. Add a code comment annotating
the SFX/Music post-Day-46 audit so a future Prune day doesn't re-litigate.

## Polish items to ship

### Item 1 — Overflow popover open animation (smoothness)
The Day 78 per-card `⋯` popover currently appears instantly. Add a
180ms fade-up animation on open (`opacity 0→1`, `transform: translateY(-4px)→0`)
via a CSS keyframe + class. Respect `prefers-reduced-motion`.

### Item 2 — Tier-staircase "newly revealed" pulse
When `applyProgressGating()` flips a button from hidden→visible (i.e. the
player just crossed the L6 / L9 / L12 / L15 / L18 threshold), pulse the
new button(s) once. Implementation: cache a `_lastGatingState` map of
`{id: visible}` on the UI instance, diff on each `applyProgressGating`
call, and add `.newly-revealed` class to any IDs that flipped on. CSS
keyframe runs once (1.2s), then JS strips the class after the animation.
Cold-start (no prior state) suppresses the pulse so a fresh load doesn't
fire 0 pulses. Respect `prefers-reduced-motion`.

### Item 3 — `:focus-visible` rings on primary interactive surfaces
Right now keyboard focus is invisible on level cards, the overflow `⋯`
button, the gate-limit/view-solution menu items, and the Settings open
button. Add a single `:focus-visible` ring style and apply via a focused
selector list. This is the cheapest a11y win in the codebase.

### Item 4 — Welcome toast `prefers-reduced-motion`
The `#welcome-toast` slide animation already runs 0.4s in/out. Under
reduced-motion, snap to display without the slide. CSS-only fix.

### Item 5 — Overflow popover mobile constraint
At 320–375px widths, the 132px min-width popover can render off-screen
right edge when the level card is near the viewport edge. Add a
`@media (max-width: 480px)` rule that lowers `min-width` to 116px and
flips `right: 6px` to `right: max(6px, env(safe-area-inset-right))` so
landscape iPhone X+ frames stay clear of the notch.

## Verification matrix

| # | Check | Source |
|---|---|---|
| V1 | Build identity unified (?v=1779724800, sw v55) | Day 79 pattern |
| V2 | Overflow popover open: class present after click, removed on close | new |
| V3 | Tier-2 staircase reveal: seed to 5 → applyProgressGating, seed to 6 → re-apply, `.newly-revealed` present on the 3 newly-visible IDs | new |
| V4 | Tier-2 staircase reveal: cold-start (no prior state) → 0 IDs marked newly-revealed | new |
| V5 | `:focus-visible` ring rendered when level card Tab-focused | new |
| V6 | Welcome toast still fires on L1 cold-start (no regression) | Day 69 |
| V7 | Day 78 5-cut suite intact: 40 overflow + 18 nav at end-game, no L1 hint footer, silent-default 'standard', no PotW button, staircase reveal counts unchanged | Day 78 |
| V8 | Day 79 cleanup intact: 8 removed JS identifiers still undefined | Day 79 |
| V9 | Mobile viewport 375px: level grid renders without horizontal scroll | new |
| V10 | Mobile viewport 414px: overflow popover stays inside card | new |
| V11 | Tablet viewport 768px: layout intact | new |
| V12 | Desktop viewport 1024px: layout intact | new |
| V13 | 0 console errors across all checks | always |

## Out of scope

- Re-tuning SFX/Music levels (audited as KEEP).
- Theme switching (auto-detect already works).
- Difficulty modal (Day 78 silent-default holds).
- Any code-removal pass (Day 79 already net-negative).
- New gameplay features (PRUNE week).

## Risk

Polish work historically introduces visual regressions. Mitigations:
- All animations gated by `prefers-reduced-motion`.
- Pulse only fires on first-cross-threshold (suppressed on cold start AND on re-renders that don't change visibility).
- `:focus-visible` uses the modern pseudo-class which gracefully falls back to nothing on older browsers.
- Mobile changes are inside an existing `@media (max-width: 480px)` block — no new selectors that affect desktop.
