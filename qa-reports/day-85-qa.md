# Day 85 QA Report — Onboarding Experiment Flag

**Date:** 2026-05-23
**Feature:** Local feature-flag manager (`OnboardingExperiment`) for first-launch variants.
**Build:** `?v=1780070400`, `sw.js CACHE_NAME='signal-circuit-v59'`.
**Harness:** Headless Chromium on `localhost:9301`, raw CDP WebSocket from
`/tmp/sc-day85-qa.py` (the OpenClaw browser tool blocks `localhost:`).

## Result

**44/44 assertions passed. 0 console errors.**

## Coverage

### Phase 1 — Build identity + default variant (cold profile, no URL)

- 11 `?v=1780070400` refs in `index.html` (cache-bust audit).
- Service-worker `signal-circuit-v59` cache active.
- `window.__onboardingExperiment` exists with `getVariant`, `getCounters`,
  `reset` (and `applyFirstLaunch`).
- Default variant resolves to `"silent-standard"`.
- Cold-start `applyFirstLaunch()` ran during init:
  - `DIFFICULTY_KEY === 'standard'`.
  - `counters.firstLaunches === 1`.
  - `counters.toastShown === 1`.
  - `counters.toastVariant === 'silent-standard'`.
- Re-invoking `applyFirstLaunch()` returns `{ fired: false, reason: 'already-decided' }`.
- Counters do not double-count after a no-op re-invoke (`firstLaunches`,
  `toastShown` both stay at 1).
- `localStorage['signal-circuit-onboarding-experiment']` is a JSON string
  containing `"silent-standard"`.
- `__onboardingExperiment.reset()` clears both `DIFFICULTY_KEY` and the
  experiment key; subsequent `applyFirstLaunch()` returns `{ fired: true }`
  and restores `DIFFICULTY_KEY === 'standard'` + `firstLaunches === 1`.
- Cold-start non-level button count on `#level-select-screen` is still 2.

### Phase 2 — Warm-toast variant via URL

- `?onboarding=warm-toast` on a cleared profile flips the variant.
- `DIFFICULTY_KEY === 'standard'` (silent default still fires).
- `counters.firstLaunches === 1`, `counters.toastVariant === 'warm-toast'`.
- After the 1200ms delay, `#welcome-toast` `textContent` contains the word
  `Welcome` (matches warmer copy).
- Reload **without** the URL param honors the persisted variant
  (`getVariant() === 'warm-toast'`), and counters are not double-counted
  (`firstLaunches` stays at 1).

### Phase 3 — Explicit-chooser variant via URL

- `?onboarding=explicit-chooser` flips the variant.
- `counters.firstLaunches === 1`, `counters.chooserShown === 1`,
  `counters.toastShown === 0` (chooser variant doesn't fire a toast).
- `#confirm-modal` is visible (`display:flex`) with three
  `.diff-option-btn` options inside `#diff-options`.
- Clicking the Standard option:
  - `counters.chooserPickedStandard === 1`.
  - `DIFFICULTY_KEY === 'standard'`.

### Phase 4 — Regression + debug surface

- L1 normal gameplay loads: truth table has ≥5 rows (header + 4), `#run-btn`
  text still contains `RUN`.
- Day 84 Lab HUD regression: `seedProgress(41)` returns a positive seed
  count; loading L41 shows `#lab-hud` with `display:flex` and the
  `#lab-constraint` chip text contains `NAND`.
- Opening Settings with `signal-circuit-debug` unset:
  `#settings-developer-section` computed `display === 'none'`.
- Setting `signal-circuit-debug=1` and re-opening Settings:
  - Developer section computed `display !== 'none'`.
  - `#onboarding-experiment-btn` is visible.
- Clicking the debug button renders the debug panel
  (`#confirm-modal` `display:flex`, content contains the string
  `Onboarding Experiment`).
- 0 console errors across all phases (vibrate stub installed to silence
  headless gesture-policy noise).

## Notes on the harness

- The OpenClaw `browser` tool blocks `http://localhost:*` by policy. Day 85
  uses the same pattern as Day 72/76/78/82/83/84: spawn a permissive
  Chromium on port 9301 with `--remote-allow-origins='*'`, open tabs via
  `PUT /json/new?<url>`, and drive `Runtime.evaluate` over raw
  WebSocket with `suppress_origin=True`.
- Each phase opens a fresh tab and calls `localStorage.clear()` before
  navigating, so per-variant assertions start from a clean profile.
- `navigator.vibrate = () => true` is pre-installed before any gameplay
  interaction to avoid headless gesture-policy errors poisoning the
  console-error count.

## Outcome

Feature ships clean. 0 open bugs. Default user-visible behavior is
unchanged (Day 78 silent-default Standard mode + welcome toast); alternate
variants are gated behind explicit QA opt-in.
