# Day 121 QA — Cycle 5 PRUNE Week, Day 4 (Polish Sprint)

**Date:** 2026-06-28
**Build:** `?v=1782518400` / sw v75 → **`?v=1782604800` / sw v76**
**Result:** **29 / 29** assertions across 6 phase groups. **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.
**Harness:** `qa-reports/day-121-qa.cdp.js` (run under `tools/cdp-launch.sh`, LOCAL `http://localhost:8901/`).

## Scope decision

The Day 120 scaffold (`specs/day-121-collection-merge-scaffold.md`) proposed the Tier-2 Cut #4
**collection-modal merge** (5 modals → 1 tabbed Profile hub) for today. That change is large and
carries multiple flagged risks (5 duplicate backdrop/close handlers to consolidate, a live-mutating
cosmetic renderer, a canvas-lifecycle leak risk on the Logic Profile). Per the **Day 105 precedent**
("if the merge is too large for one polish day, do smaller polish and defer the merge"), the merge is
**DEFERRED** and today ships two small, net-near-zero UX wins instead — both building on the most
recent source change (Day 119 Cut #2 typed-confirm) and the Day 105 modal-animation language.

## Polish shipped

1. **Polish #1 — `#confirm-modal-content` entrance animation.** The confirm modal previously snapped
   into view while the chapter-complete modal animates. Added `animation: modalPop 0.28s …` (reusing
   the **existing** `modalPop` keyframe — no new keyframe). The global `prefers-reduced-motion` rule
   (css ~3160, `animation-duration: 0.01ms !important`) already neutralizes it; no separate guard.

2. **Polish #2 — typed-confirm "armed" green affordance.** The Day 119 `⚠ Reset Progress` typed-confirm
   only signalled correctness by enabling the OK button; the input stayed alarming-red even when the
   user had typed `RESET` correctly. Added an `.is-armed` class (toggled in `arm()` in `js/ui.js`) that
   flips the input border from destructive-red `#f44` to confirm-green `#0f0` (with a 0.18s transition),
   giving positive feedback that the gate is satisfied before pressing the still-red destructive OK.
   `cleanup()` strips the class. The OK button intentionally stays red — it is still a destructive action.

## Coverage

| Phase | What | Result |
|-------|------|--------|
| P1 | Build identity — 11 unified `?v=1782604800`; sw v76 | 3/3 ✓ |
| P2 | Polish #1 — `modalPop` on content; plain confirm open/close; typed-input stays hidden on plain path | 4/4 ✓ |
| P3 | Polish #2 — disarmed at open; wrong text disarmed; exact `RESET` arms (`.is-armed` + green border `rgb(0,255,0)` + OK enabled); edit-back re-disarms; disarmed-OK no-op (progress 6→6, modal stays open); Cancel cleans `.is-armed` + hides input | 8/8 ✓ |
| P4 | Regression + cold-defaults — cold 2 nav / 50 cards; Day 79 dead-ids; end-game 18 nav + 50 overflow + 50 cards; SFX 0.4 / Music 0.2; difficulty silent-default `standard` | 8/8 ✓ |
| P5 | Mobile sweep — no horizontal scroll + header reachable @ 375 / 414 / 768 / 1024 px | 4/4 ✓ |
| P6 | Console hygiene — 0 exceptions / 0 errors | 2/2 ✓ |

## Harness self-bugs (first run 27/29 → 29/29, 0 app changes)

- **P3.e** read the input border at **60ms** after arming, but Polish #2 added a **0.18s** border-color
  transition — the probe sampled a mid-transition intermediate (still red). Fix: wait **300ms** before
  sampling. The `.is-armed` class itself was correctly applied on the first run (P3.d passed). Verified
  no light-mode override exists (`grep` clean), so the green flip is purely a settle-time read.
- **P4.h** asserted difficulty `=== null`. The Day 78 PRUNE made the difficulty modal *silent-default*,
  but the persisted value defaults to `'standard'` (Day 89/105 invariant), not null. Fixed the assertion.

## Source LOC

`css/style.css` +16 · `js/ui.js` +3 · `index.html` +11/−11 (cache-bust only) · `sw.js` +1/−1.
Net ≈ **+19 functional LOC** — inside Day 105's ±50 polish-day budget. PRUNE-week net-near-zero held
(the deeper net-negative pass was Day 120's −60; the merge that would have cut more is deferred).

**Open Bugs:** 0 → 0 (46-day streak since Day 76). **Latent observations:** 0 → 0.
**Day 122 next:** PRUNE Week Day 5 — Expert Panel + Validation (close Cycle 5, target ≥9.1).
