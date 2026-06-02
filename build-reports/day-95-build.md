# Day 95 Build Report — Onboarding Experiment Readout UI

**Cycle:** 4 BUILD Week, Day 4
**cycleDay:** 43
**Day:** 95
**Date:** 2026-06-02
**Feature:** Onboarding Experiment Readout UI (Settings → Developer inline card)
**Cache bust:** `?v=1780531200` (11 refs unified)
**SW version:** `signal-circuit-v64`
**Verification:** 28 CDP assertions on `localhost:8901`, 0 console errors.

## What shipped

The Day 85 `OnboardingExperiment` counters — previously only accessible via
`window.__onboardingExperiment.getCounters()` in the dev console — now
render as a polished inline card inside the existing Settings → Developer
section. The card auto-refreshes on every settings-modal open, so a
synthetic funnel walk reflects immediately without a manual reload.

Mike's intended workflow: clear the profile, flip the
`signal-circuit-debug` flag, run the game on `?onboarding=explicit-chooser`
(or any variant), complete an arc, and read off the variant + applied-at +
counters in Settings.

### Card layout

```
🧪 Onboarding Experiment              local readout — no analytics sent

Variant: [silent-standard]
Applied: 2026-06-02T15:25:02.480Z · 3m ago

firstLaunches              1
chooserShown               0
chooserPickedRelaxed       0
chooserPickedStandard      0
chooserPickedHardcore      0
toastShown                 1
toastVariant               silent-standard

                                      [↻ Reset experiment state]
```

### Reset semantics

Clicking the card's Reset button:

1. Wipes `DIFFICULTY_KEY` + `ONBOARDING_EXPERIMENT_KEY` from localStorage
   (via `OnboardingExperiment.reset()`).
2. Re-runs `applyFirstLaunch()`, which re-resolves the variant from the
   current URL/localStorage chain, increments `firstLaunches` to 1, sets
   `appliedAt` to a fresh ISO timestamp, and fires the variant's behavior
   (silent toast / explicit chooser / warm toast).
3. Re-renders the card in place — **no page reload, no modal close**.

This is "funnel restart" semantics: the user is back at the top of the
funnel for whatever variant is currently resolved (URL still wins).

### Storage shape (Day 85 + `appliedAt`)

```json
{
  "variant": "silent-standard",
  "assignedAt": "2026-05-23T08:06:00.000Z",
  "appliedAt": "2026-06-02T15:25:02.480Z",
  "counters": {
    "firstLaunches": 1,
    "chooserShown": 0,
    "chooserPickedRelaxed": 0,
    "chooserPickedStandard": 0,
    "chooserPickedHardcore": 0,
    "toastShown": 1,
    "toastVariant": "silent-standard"
  }
}
```

`appliedAt` is `null` until the first `applyFirstLaunch()` fire actually
runs (i.e., `DIFFICULTY_KEY` was absent). On returning users with the
difficulty already set, `appliedAt` stays `null` and the card surfaces
"Not yet applied (DIFFICULTY_KEY already set)".

## File diff summary

| File         | LOC delta | Change                                                                                          |
| ------------ | --------- | ----------------------------------------------------------------------------------------------- |
| `index.html` | +2        | `<div id="onboarding-readout-card" style="display:none;"></div>` placeholder. 11 `?v=` refs bumped. |
| `js/main.js` | +12       | `appliedAt` field on state, `getAppliedAt()` accessor, wired into `__onboardingExperiment` facade. |
| `js/ui.js`   | +66       | `renderOnboardingReadoutCard()` method + call from `setupSettingsModal()` show handler. Modal panel gains an applied-at row. |
| `sw.js`      | ±0        | `CACHE_NAME` bumped v63 → v64.                                                                  |

Net: roughly **+80 / -10** lines, all additive in shape (no destructive
edits to Day 85 behavior).

## Surgical-edit discipline

- Used `edit` tool with 3 targeted blocks in `js/main.js` (one each for
  `_normalize`, `getVariant/getCounters` site, `applyFirstLaunch` body).
- Used `edit` tool with 3 targeted blocks in `js/ui.js` (settings-show
  handler, new `renderOnboardingReadoutCard()` method block, existing
  modal `content.innerHTML` block).
- Used `edit` tool with 3 targeted blocks in `index.html` (placeholder
  div, css `?v=` ref, script `?v=` refs as a single block).
- Used `edit` tool with 1 block in `sw.js`.

No file was rewritten in whole. No JS file was reflowed.

## Verification

`qa-reports/day-95-qa.cdp.js` (~530 LOC, modeled on Day 94's harness)
exercises 28 assertions across 8 phases:

1. Build identity (3): cache-bust + SW + placeholder.
2. Debug gate OFF (3): default profile keeps section + card hidden,
   cold-start 2 non-level buttons hold.
3. Debug gate ON (5): card renders with variant pill, applied-at line,
   7-row counters table, reset button.
4. Counter wiring (5): `?onboarding=explicit-chooser` reload → click
   "Standard" → counters reflect funnel walk on settings re-open.
5. Reset (4): wipes pick counters, re-fires applyFirstLaunch,
   appliedAt refreshes, card re-renders in place.
6. L1 core loop regression (3): gameplay-screen visible after
   `startLevel(1)`, 4 truth rows, 1-gate AND solve persists 3 stars.
7. Day 78 + Day 94 regression (3): cold-start 2 non-level buttons hold
   after wipe + reload, L42 hardCap rejection byte-equivalent
   (`Submission rejected: 5 gates exceeds hard cap of 4.`), L44 NAND-only
   + hard cap 6 composite enforcement intact.
8. Console hygiene (2): 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Result: 28 / 28 passed. 0 exceptions. 0 console errors.**

## First-run hiccups

1. **PLACEMENT_KEY blocks applyFirstLaunch.** P4's first run had
   `firstLaunches=0` after the reload because the harness only cleared
   `signal-circuit-onboarding-experiment` and `signal-circuit-difficulty-mode`,
   missing `signal-circuit-placement-done`. `_checkPlacementTest()` returns
   *before* it routes through `OnboardingExperiment.applyFirstLaunch()` when
   the placement key is `'true'` from a previous test run. Fix: harness now
   wipes ALL `signal-*` keys.

2. **Reset preserves URL-resolved variant.** P5's first run asserted
   variant should return to `silent-standard` after reset, but
   `?onboarding=explicit-chooser` was still in the URL bar from P4's
   navigation. The correct semantics: reset wipes counters and re-fires
   `applyFirstLaunch()`, but URL precedence in `_resolveVariant()` keeps
   the variant pinned. P5 assertions corrected to expect a "funnel
   restart" at the top of the currently-resolved variant.

Both were harness-side fixes; no app code changed after the initial
implementation.

## Day 96 next (Snapshot Cards Library Tab)

Day 96 closes Cycle 4 BUILD Week with the **Snapshot Cards Library Tab**
per `roadmaps/cycle-4-build.md`:

- Generated share cards persist in a capped library (last 20).
- Stats screen gains a "📸 My Cards" tab with a grid of thumbnails.
- Click a thumbnail → re-open the share-card modal pre-populated.
- 21st card evicts the oldest. Reset Game wipes the library.
- CDP harness solves L1 twice, asserts 2 cards in library, floods to 21,
  asserts cap.
