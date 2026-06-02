# Day 95 QA Report — Onboarding Experiment Readout UI

**Cycle:** 4 BUILD Week, Day 4
**cycleDay:** 43
**Day:** 95
**Date:** 2026-06-02
**Build under test:** `?v=1780531200` · `sw.js CACHE_NAME = 'signal-circuit-v64'`
**Harness:** `qa-reports/day-95-qa.cdp.js` (CDP over `ws@8.20.0`)
**Browser:** Chromium 146 headless, `--remote-debugging-port=9301 --remote-allow-origins=*`
**Server:** `python3 -m http.server 8901` against project root

## Result

**28 / 28 assertions passed across 8 phases.**
**0 `Runtime.exceptionThrown`. 0 `console.error`.**

First run had 5 noisy P4/P5 failures from incomplete localStorage clearing
in the harness — fixed by wiping all `signal-*` keys (not just the two
explicit ones) before reload because `signal-circuit-placement-done` was
short-circuiting `_checkPlacementTest()` and skipping `applyFirstLaunch()`
entirely. After that fix, the second harness run also re-shaped P5
assertions to match the actually-correct behavior: with
`?onboarding=explicit-chooser` persisted in the URL bar, `reset()` +
`applyFirstLaunch()` correctly re-fires the explicit-chooser variant
(chooserShown=1, picked=0). No app-side fix was needed.

## What shipped

A Settings → Developer **inline readout card** populated by
`UI.renderOnboardingReadoutCard()` on every settings-modal open. The card
surfaces the current variant, applied-at ISO timestamp (plus a relative-time
string), all 7 counter rows, and a Reset button that wipes the experiment
state and re-runs `applyFirstLaunch()` in place — no page reload.

The Day 85 `#onboarding-experiment-btn` modal-trigger button is preserved
for back-compat and now also surfaces `appliedAt`. The Day 85 storage shape
gains exactly one new optional field (`appliedAt: string | null`),
initialized to `null` and set to `new Date().toISOString()` the first time
`applyFirstLaunch()` actually fires (and re-set after `reset() + refire`).

## Files changed

| File         | Change                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `index.html` | +2 lines: `<div id="onboarding-readout-card" style="display:none;"></div>` placeholder + comment. All 11 `?v=` refs bumped `1780444800 → 1780531200`. |
| `js/main.js` | +12 lines: `appliedAt` field on `OnboardingExperiment._state`, set on first `applyFirstLaunch()` fire; `getAppliedAt()` accessor; wired into `window.__onboardingExperiment` facade. |
| `js/ui.js`   | +66 lines: new `renderOnboardingReadoutCard()` method (idempotent), called from `setupSettingsModal()` show handler when debug flag is on. Existing `showOnboardingExperimentPanel()` gains an applied-at row. |
| `sw.js`      | CACHE_NAME `signal-circuit-v63 → signal-circuit-v64`.                                              |

**LOC delta:** roughly **+80 / -10** net (mostly additive in `js/ui.js`).

## Verification matrix

### P1 — Build identity (3 / 3)

- **P1.1** ✅ `index.html` has exactly 11 `?v=1780531200` cache-bust refs (unified).
- **P1.2** ✅ `sw.js` declares `CACHE_NAME = 'signal-circuit-v64'`.
- **P1.3** ✅ `index.html` declares `#onboarding-readout-card` placeholder.

### P2 — Debug gate OFF (3 / 3)

- **P2.1** ✅ With debug flag cleared, Settings opens but Developer section stays hidden (`display: none`).
- **P2.2** ✅ Readout card stays hidden (parent section invisible).
- **P2.3** ✅ Cold-start 2 non-level buttons (`how-to-play-btn` + `open-settings-btn`).

### P3 — Debug gate ON (5 / 5)

- **P3.1** ✅ With `localStorage['signal-circuit-debug'] = '1'`, Developer section + readout card both visible on Settings open.
- **P3.2** ✅ Variant pill renders `silent-standard` (cold-start default).
- **P3.3** ✅ `appliedAt` set to a valid ISO timestamp on cold start (e.g. `2026-06-02T15:25:02.480Z`).
- **P3.4** ✅ Counters table has 7 rows (one per counter key).
- **P3.5** ✅ Reset button (`#onboarding-readout-reset`) present in the card.

### P4 — Counter wiring (5 / 5)

After wiping all `signal-*` keys + setting `?onboarding=explicit-chooser` + reload:

- **P4.1** ✅ Chooser modal renders 3 difficulty options; variant resolves to `explicit-chooser`.
- **P4.2** ✅ `firstLaunches` counter = 1 after `applyFirstLaunch()` fires.
- **P4.3** ✅ `chooserShown` counter = 1.
- **P4.4** ✅ `chooserPickedStandard` = 1 after clicking the "Standard" option.
- **P4.5** ✅ Re-opening Settings shows the updated counters in the card text — auto-refresh on settings-open works.

### P5 — Reset wipes state + re-renders in place (4 / 4)

After clicking the readout card's Reset button:

- **P5.1** ✅ All three `chooserPicked*` counters back to 0 (funnel-pick state cleared).
- **P5.2** ✅ `applyFirstLaunch()` re-fires for the persisted variant (`explicit-chooser` still in URL bar), so `firstLaunches=1`, `chooserShown=1`, `toastShown=0` — the funnel has correctly restarted from the top.
- **P5.3** ✅ `appliedAt` strictly different from the pre-reset value (verified with a 1.1s sleep between samples).
- **P5.4** ✅ Card re-renders in place (`display:block` still set, 7 rows still present, persisted variant intact) — **no page reload occurred**.

### P6 — L1 core loop regression (3 / 3)

- **P6.1** ✅ `startLevel(1)` brings `#gameplay-screen` to `display: block`.
- **P6.2** ✅ Truth table renders with 5 rows (header + 4 data rows).
- **P6.3** ✅ 1-gate AND solve via `runQuickTest()` persists `progress.levels['1'].stars === 3`.

### P7 — Day 78 + Day 94 regression (3 / 3)

After a full localStorage wipe + reload:

- **P7.1** ✅ Cold-start non-level button count = 2 (Day 78 staircase invariant).
- **P7.2** ✅ L42 hardCap rejection: `Submission rejected: 5 gates exceeds hard cap of 4.` (byte-equivalent to Day 84 and Day 94).
- **P7.3** ✅ L44 NAND-Only Half Adder composite: `gateHardCap === 6`, `availableGates === ['NAND']`, 7-NAND build rejects with hard-cap reason, 5-NAND build accepts.

### P8 — Console hygiene (2 / 2)

- **P8.1** ✅ `Runtime.exceptionThrown` count = 0 across the entire suite.
- **P8.2** ✅ `console.error` count = 0.

## Decisions / hiccups

1. **PLACEMENT_KEY blocks applyFirstLaunch.** First harness run had P4 fail
   because clearing only `signal-circuit-onboarding-experiment` and
   `signal-circuit-difficulty-mode` wasn't enough — `_checkPlacementTest()`
   sees `signal-circuit-placement-done === 'true'` and returns BEFORE
   `applyFirstLaunch()` runs. Fix: wipe ALL `signal-*` keys for a clean
   funnel walk. Documented in LESSONS_LEARNED.

2. **Reset doesn't reset the URL.** The Day 95 reset semantics are: wipe
   `DIFFICULTY_KEY` + `ONBOARDING_EXPERIMENT_KEY` + counters, then re-fire
   `applyFirstLaunch()` against the *currently-resolved* variant. The URL
   still says `?onboarding=explicit-chooser`, so the persisted variant
   stays the same and the chooser re-opens (chooserShown=1, picks=0).
   This is correct funnel-restart behavior; P5 assertions updated to
   match.

3. **`appliedAt` is `null` until applyFirstLaunch fires.** Deliberately
   initialized to `null` in `_normalize()` (not a fresh ISO at cold-load
   time) so the "Not yet applied" branch is reachable when the difficulty
   key is already set (e.g. returning user). `_normalize` preserves a
   previously-persisted `appliedAt` across reloads.

4. **Inline card vs modal preserved both.** The Day 85
   `#onboarding-experiment-btn` modal-trigger still works and now also
   surfaces `appliedAt` — Mike can open the bigger panel for a full view,
   or just glance at the card in Settings.

## Coverage summary

| Phase | Assertions | Pass | Notes                                                          |
| ----- | ---------- | ---- | -------------------------------------------------------------- |
| P1    | 3          | 3    | Build identity                                                  |
| P2    | 3          | 3    | Debug gate OFF                                                  |
| P3    | 5          | 5    | Debug gate ON, card render                                      |
| P4    | 5          | 5    | Counter wiring via explicit-chooser funnel                      |
| P5    | 4          | 4    | Reset wipes state + re-renders in place                         |
| P6    | 3          | 3    | L1 core loop regression                                         |
| P7    | 3          | 3    | Day 78 (2-button cold start) + Day 94 (L42 + L44) regression    |
| P8    | 2          | 2    | Console hygiene                                                 |
| **Total** | **28** | **28** | **100%**                                                    |

**Open bugs queue:** 0 at start of day, 0 at end of day (streak: **20
consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — still deferred to Cycle 4 PRUNE Week).
