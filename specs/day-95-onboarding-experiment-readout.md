# Day 95 — Onboarding Experiment Readout UI

**Cycle:** 4 BUILD Week, Day 4
**cycleDay:** 43
**Day:** 95
**Date:** 2026-06-02
**Cache bust:** `?v=1780531200`
**SW version:** `signal-circuit-v64`

## Goal

Promote the Day 85 `OnboardingExperiment` counters from
`window.__onboardingExperiment.getCounters()` dev-console-only surface into a
polished, always-visible **Settings → Developer** card. The card auto-renders
inline when the Developer section opens (no extra click needed), shows the
current variant + applied-at timestamp + a live counter table + a Reset
button, and re-reads state fresh on every settings-modal open so a synthetic
funnel walk reflects immediately.

This is the user-visible payoff for Day 85's groundwork: Mike can run the
game on a fresh profile, complete an arc, and read off the funnel by opening
Settings — no DevTools required.

## Why this shape

Day 85 already shipped:

- An `OnboardingExperiment` manager class with variant resolution, counters,
  reset, and `applyFirstLaunch()`.
- A `#settings-developer-section` div in `index.html`, gated by
  `signal-circuit-debug=1` in `ui.setupSettingsModal()`'s show handler.
- An `#onboarding-experiment-btn` inside that section that opens a modal via
  `ui.showOnboardingExperimentPanel()` showing variant + counters table + a
  "Reset onboarding state" button.

Day 95's upgrade keeps the existing button (back-compat — clicking it still
opens a fuller modal view) but **also** renders the same info inline as a
permanent card inside the Developer section. That way the readout is visible
the moment the Developer section opens, without an extra click. Counter
auto-refresh on settings-open guarantees the card never goes stale during a
funnel walk.

`appliedAt` is a new field on `OnboardingExperiment._state` — set the first
time `applyFirstLaunch()` actually fires (i.e., the gate
`!SafeStorage.getItem(DIFFICULTY_KEY)` was true), persisted via `_persist()`,
and surfaced as an ISO timestamp + a relative-time string in the card.
Resetting via the button re-runs `applyFirstLaunch()` so the timestamp
refreshes to "just now".

## File diffs planned

### `index.html`

1. Inside `#settings-developer-section`, after the existing `#developer-row`
   div, append a new `<div id="onboarding-readout-card">` placeholder. The
   placeholder has zero static content — it's populated by JS on
   settings-modal open. Default `display:none;` so it stays empty until JS
   either populates it or the debug flag is off.
2. Bump all 11 `?v=` references from `?v=1780444800` to `?v=1780531200`.

### `js/main.js`

3. `OnboardingExperiment` class:
   a. `_normalize(s)`: add `appliedAt` to the normalized state object. Default
      to whatever was already persisted, otherwise `null` (NOT a fresh
      timestamp — `appliedAt` should only be set when the variant ACTUALLY
      applies, not on cold-load).
   b. `applyFirstLaunch()`: after the gate check passes and counters
      increment, set `this._state.appliedAt = new Date().toISOString()` if
      not already set. Persist as part of the existing `_persist()` call.
   c. New method `getAppliedAt()` returns `this._state.appliedAt`.
   d. Wire `getAppliedAt` into `window.__onboardingExperiment` (the small
      facade in `GameState`'s constructor block).

### `js/ui.js`

4. `setupSettingsModal()`: in the existing `show` handler, after revealing
   the developer section, call a new
   `this.renderOnboardingReadoutCard()` (idempotent — replaces the card
   contents each time).
5. New method `renderOnboardingReadoutCard()`:
   a. Returns silently if the card placeholder div doesn't exist or the
      debug flag is off.
   b. Reads variant + counters + appliedAt fresh from
      `this.gameState.onboardingExperiment`.
   c. Populates the card with a header, current variant pill, applied-at
      line ("Applied: 2026-06-02T15:11:43Z · 3 minutes ago" or "Not yet
      applied"), counters table (each row a name → value), and a Reset
      button.
   d. The card's Reset button:
      - Calls `oe.reset()` (which wipes DIFFICULTY_KEY +
        ONBOARDING_EXPERIMENT_KEY and re-normalizes state with `appliedAt:
        null`).
      - Re-runs `oe.applyFirstLaunch()` so the variant fires fresh and
        `appliedAt` is set to "just now".
      - Re-renders the card in place (no reload).
6. Existing `showOnboardingExperimentPanel()` modal stays — for back-compat
   and a fuller view. It also gets a row for `appliedAt`.

### `sw.js`

7. Bump `CACHE_NAME` from `signal-circuit-v63` to `signal-circuit-v64`.

## Acceptance

- `#settings-developer-section` reveals (along with the embedded readout
  card) iff `localStorage['signal-circuit-debug'] === '1'` on settings-open.
- Default profile (no debug flag): Developer section + readout card both
  hidden. Cold-start non-level button count stays at 2.
- Debug flag ON: opening Settings shows Developer section with the card
  fully rendered, containing variant, applied-at, all 7 counter rows
  (firstLaunches / chooserShown / chooserPickedRelaxed / chooserPickedStandard
  / chooserPickedHardcore / toastShown / toastVariant), and a Reset button.
- Synthetic funnel: setting `?onboarding=explicit-chooser` + reloading +
  picking "Standard" in the chooser populates the counters; re-opening
  Settings shows the updated counters in the card without a manual refresh.
- Reset button: clicking it wipes counters back to zeros, re-runs
  applyFirstLaunch (refreshing appliedAt to "just now"), and re-renders
  the card in place.
- L1 normal gameplay path still works: RUN, isAnimating, 4 truth rows.
- Day 94 L42 composite L44 regression: NAND-only + hard cap 6 still
  enforced.
- 0 `Runtime.exceptionThrown` + 0 `console.error` across all paths.

## Verification matrix (CDP localhost:8901)

Target: ~28 assertions across 8 phases.

- **P1 Build identity (3):** 11 cache-bust refs at `?v=1780531200`, sw v64,
  `#onboarding-readout-card` placeholder in index.html.
- **P2 Debug surface gated OFF (3):** with debug flag cleared, settings
  opens → Developer section hidden, readout card hidden, 2 cold-start
  non-level buttons.
- **P3 Debug surface ON (5):** with `signal-circuit-debug=1`, settings
  opens → Developer section visible, readout card visible + has variant,
  appliedAt line, counters table with 7 rows, Reset button.
- **P4 Counter wiring (5):** `?onboarding=explicit-chooser` reload + click
  "Standard" in chooser → counters update; re-opening Settings shows
  `chooserShown=1`, `chooserPickedStandard=1`, `firstLaunches=1`,
  `appliedAt` non-null.
- **P5 Reset (4):** click Reset → counters all zero again, appliedAt
  refreshes (new ISO timestamp non-null), card re-renders in place
  (no reload), variant resolves fresh.
- **P6 L1 regression (3):** L1 loads, RUN works, 4 truth rows.
- **P7 Day 94 + Day 78 regression (3):** Cold-start 2 non-level buttons +
  L42 hardCap=4 rejection byte-equivalent + L44 NAND-only + hard cap 6 still
  enforced.
- **P8 Console hygiene (2):** 0 Runtime.exceptionThrown + 0 console.error.

## Out of scope

- Network analytics. Counters remain local-only.
- A/B traffic assignment. No randomization or hashing.
- Adding new variants. The variant set is unchanged (silent-standard /
  warm-toast / explicit-chooser).
- Modifying the existing `showOnboardingExperimentPanel()` modal beyond
  adding an `appliedAt` row.
