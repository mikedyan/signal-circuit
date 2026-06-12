# Day 105 — Polish Sprint (Cycle 4 PRUNE Week, Day 4)

**Date:** 2026-06-12 (Friday)
**Build under audit going in:** `?v=1780790400`, `sw v67` (Day 104)
**Target build out:** `?v=1780876800`, `sw v68`
**LOC budget:** net-neutral or small-positive (~±50 LOC)
**Commits:** single (Day 65 + Day 79 + Day 80 polish-day precedent)

## Scope

Cycle 4 PRUNE Week Day 3 (Day 104) shipped 4 cuts including the new
`Gameplay` section in Settings (Cut #2). Day 105 polishes that and the
related Cycle 4 changes:

- Smoothness on the new Gameplay section reveal (Day 80 Item 1 pattern,
  applied to Settings instead of overflow popover).
- Focus-ring audit on the relocated `#difficulty-mode-btn` (Day 80
  Item 3 echo — verify the Day 29 universal button:focus-visible rule
  still applies through the new `#settings-gameplay-row` parent).
- Mobile-layout double-check on the now-stacked Settings sections
  (Day 80 Item 5 pattern).
- Smooth `.empty` opacity toggle on `#stats-tab-cards` (the Day 104
  Cut #4 dim was a hard snap; soften it).
- Tier-3 backlog from `PRUNE_REPORT.md` #11–#14 — audit only.
- Cold-start defaults audit before Day 106's Expert Panel.

## Cold-start defaults audit

| Default | Current value | Verdict | Action |
|---|---|---|---|
| SFX volume | 0.4 | Stable since Day 46 audit; KEEP per Day 80 | KEEP |
| Music volume | 0.2 | Stable since Day 46 audit; KEEP per Day 80 | KEEP |
| Theme | auto (prefers-color-scheme) | Day 35 auto-detect; KEEP | KEEP |
| Difficulty mode | Standard (silent-default since Day 78) | Day 78 Cut #5 holds | KEEP |
| Daily notification | on | Day 79 trimmed Weekly; KEEP | KEEP |
| Streak notification | on | Day 79; KEEP | KEEP |
| Cold-start non-level buttons | 2 | Day 78 invariant 30 days in | KEEP |

No defaults change. Day 80's audit verdicts all still hold; Day 105 is a
confirm-and-move-on pass.

## Polish items to ship

### Item 1 — Settings-section staggered fade-in
The Day 104 PRUNE Cut #2 added a new `Gameplay` section between
`Display & Accessibility` and `Audio`. The first time a returning user
opens Settings after the cache-bust, they see five sections paint
instantly with no visual signal that the layout changed. Add a subtle
220ms staggered fade-in on each section so the new Gameplay row reads
as deliberate.

Implementation:
- `@keyframes settingsSectionFadeIn` (opacity 0→1 + translateY 6px→0,
  220ms ease-out, both fill-modes so each section is invisible until
  its delay elapses).
- `#settings-modal.is-opening .settings-section` applies the animation.
- 6 `:nth-of-type(N)` stagger rules with delays
  `0/35/70/105/140/175ms` — total reveal completes in ~430ms.
- `setupSettingsModal()`'s `show()` adds `.is-opening` immediately,
  stores a 600ms `setTimeout` on `this._settingsOpeningTimer`, strips
  the class on timer fire so re-opens re-fire the animation.
- `hide()` strips the class and cancels the pending timer.
- `@media (prefers-reduced-motion: reduce)` short-circuits to `none`.

### Item 2 — `.stats-tab` opacity transition
Day 104 Cut #4 added `.empty` class to dim `#stats-tab-cards` to opacity
0.55 when the library is empty. But the `.stats-tab` `transition:` list
only included `color, border-color`, so saving the first card snapped
the tab from 0.55 to 1.0 instantly.

Implementation:
- Extend `.stats-tab` transition to include `opacity .15s` alongside
  `color .15s, border-color .15s`.
- Net effect: smooth 150ms fade when `.empty` is removed at first card
  save.

### Item 3 — Focus-ring audit on `#difficulty-mode-btn` (verification only)
Day 29 universal `button:focus-visible` rule still applies through the
new `#settings-gameplay-row` parent. No code change.

### Item 4 — Mobile-layout double-check (verification only)
Probe at 375 / 414 / 768 / 1024 px. Verify the Gameplay section header
doesn't collide with Audio's volume sliders; no horizontal scroll
triggered by the new section.

### Item 5 — Welcome-toast vs L1 tutorial overlap (verification only,
PRUNE_REPORT Tier-3 #12)
Audit whether `silent-standard` welcome toast (`🔧 Mode set to Standard.
Change anytime in Settings.`) competes with the L1 tutorial overlay.
Document finding rather than fix — toast and tutorial occupy different
screen regions and z-layers.

### Item 6 — PRUNE_REPORT Tier-3 #11 (difficulty modal copy trim) —
NOT APPLICABLE
Inspected `showDifficultySelector()` source. The chooser modal does not
contain "(Recommended) — You can change this anytime in Settings" — it
uses 1-line per-mode descriptions of the actual gameplay differences.
The Tier-3 #11 cut was speculative; no copy to trim. Documented in
`PRUNE_REPORT.md` for cycle 5.

### Item 7 — PRUNE_REPORT Tier-3 #14 (Reset Progress typed-confirmation)
DEFERRED
Adding a typed-RESET gate adds code, not polish. Defer to Cycle 5 PRUNE
Week's Tier-1 batch (Day 78 / Day 103 precedent).

## Verification matrix

| # | Check | Source |
|---|---|---|
| V1 | Build identity unified (?v=1780876800, sw v68) | Day 80 pattern |
| V2 | @keyframes settingsSectionFadeIn defined | new |
| V3 | #settings-modal.is-opening .settings-section rule present | new |
| V4 | 6 :nth-of-type(N) stagger rules present | new |
| V5 | prefers-reduced-motion guard present | new |
| V6 | .stats-tab transition includes opacity .15s | new |
| V7 | Modal click adds .is-opening; settings display: flex | new |
| V8 | Second .settings-section is "Gameplay" (Day 104 invariant) | Day 104 |
| V9 | Gameplay section animation-name = settingsSectionFadeIn | new |
| V10 | .is-opening stripped after ~600ms timer | new |
| V11 | Hide and re-open both work correctly | new |
| V12 | Universal button:focus-visible rule still in cascade | Day 29 |
| V13 | No #difficulty-mode-btn override breaks cascade | new |
| V14 | Difficulty button parent chain ends at #settings-gameplay-row | Day 104 |
| V15-V26 | 0 vertical overlaps + no horizontal scroll + Gameplay visible at 375/414/768/1024 | new |
| V27 | Default variant is silent-standard | Day 85 |
| V28 | _runSilentWithToast calls showWelcomeToast (documented) | new finding |
| V29 | Welcome toast z-index > tutorial overlay z-index | new finding |
| V30 | Tutorial overlay can still render at L1 | regression |
| V31-V37 | Cold-start defaults audit (Day 80 baseline holds) | Day 80 |
| V38-V41 | Day 104 invariants (5 sections in order, diff in Gameplay row, Install-App exists + visible) | Day 104 |
| V42-V48 | Day 79 dead-id purge intact | Day 79 |
| V49-V50 | 0 console errors / 0 exceptions across full run | always |

## Out of scope

- New gameplay features (PRUNE week).
- Re-tuning SFX/Music levels (audited as KEEP).
- Theme switching (auto-detect already works).
- Difficulty modal redesign (Day 78 silent-default holds).
- Reset Progress typed-confirmation (deferred to Cycle 5 PRUNE).
- Any code-removal pass (Day 104 already net-negative).

## Risk

Polish work historically introduces visual regressions. Mitigations:
- All animations gated by `prefers-reduced-motion`.
- `.is-opening` class is stripped both on timer-fire and on hide, so a
  rapid open→close→open sequence still re-triggers the animation.
- `.stats-tab` transition addition is additive — existing color/border
  transitions still fire identically.
- Cache-bust + SW bump together (Day 78 / Day 80 precedent).
- Single commit covers all changes (Day 80 polish-day precedent).
