# Day 126 — Onboarding A/B readout: Local-only vs Live cohort (engagement instrumentation)

**Cycle 6 BUILD Week Day 4** · cycleDay 77 · build `?v=1782950400` / `sw v80`

## Goal

Turn the Day 85/95 `OnboardingExperiment` flag + debug readout into a real,
measurable A/B: assign every install a deterministic **Local-only vs Live**
cohort, track a lightweight 7-day-retention proxy (return-session count) locally,
and surface it in the existing debug-gated Settings → Developer readout. No
external analytics — everything is localStorage. No new cold-start surface.

## What shipped

### 1. Stable per-install token (`signal-circuit-install-id`)
- `getOrCreateInstallId()` (module fn in `main.js`): reads the key, or mints a
  random `sc-<base36>` token via `crypto.getRandomValues` (fallback
  `Date.now()+Math.random()`), persists it, returns it.
- Created once in the `OnboardingExperiment` constructor. **Never wiped by
  `reset()`** — the cohort is a property of the install, not the experiment run.

### 2. Deterministic cohort assignment
- `cohortForInstallId(id)`: FNV-1a hash → parity → `'local'` (even) / `'live'` (odd).
  50/50 split, deterministic for a given install id.
- `_resolveCohort()` precedence: **URL `?cohort=` override > persisted value >
  deterministic hash**. Persists on first assignment and on a URL-forced change
  (mirrors the Day 85 variant-override pattern exactly).
- `?cohort=local` / `?cohort=live` forces + persists the bucket (QA + manual
  override). Case-insensitive.

### 3. Return-session counter (once per UTC day)
- `_recordSession()` runs on every cold load (constructor). Pure localStorage, no
  timers.
  - `firstSessionDay` set on the very first load.
  - `sessionDays` increments **at most once per UTC calendar day**: only when
    `lastSessionDay !== todayUTC`, then `lastSessionDay = todayUTC`.
- `getDaysActive()` = inclusive calendar span between `firstSessionDay` and today
  (UTC), in days. (`sessionDays` = distinct active days; `daysActive` = span —
  the two together give an engagement-density read.)

### 4. Debug-gated readout (extends Day 95 card)
- `UI.renderOnboardingReadoutCard()` gains a cohort block (`#onboarding-readout-cohort`)
  rendered only when `signal-circuit-debug=1`:
  - `#onboarding-readout-cohort-badge` (text + `data-cohort` attr, color-coded
    live=cyan / local=amber) + truncated install id.
  - `#onboarding-readout-session-days` / `#onboarding-readout-days-active` rows +
    `firstSessionDay` / `lastSessionDay`.
- Lives entirely inside the existing Developer section — **no new cold-start
  surface** (cold nav-button count holds at 2, Day 78 invariant).

### Accessors (window alias, Day 85 `__onboardingExperiment` pattern)
`getCohort()`, `getInstallId()`, `getSessionStats()` (`{cohort, cohortAssignedAt,
sessionDays, lastSessionDay, firstSessionDay, daysActive}`), `getDaysActive()`.

## Files touched
- `js/main.js`: `INSTALL_ID_KEY` + `ONBOARDING_COHORTS` constants,
  `getOrCreateInstallId()` + `cohortForInstallId()` + `utcDayString()` helpers;
  `OnboardingExperiment` constructor + `_normalize()` + `reset()` extended;
  `_readUrlCohort` / `_resolveCohort` / `_recordSession` / `getDaysActive` /
  `getSessionStats` / `getCohort` / `getInstallId` methods; window alias +4 fns.
- `js/ui.js`: cohort/session block in `renderOnboardingReadoutCard()`.
- `index.html`: 11× cache-bust `?v=1782864000` → `?v=1782950400`.
- `sw.js`: `signal-circuit-v79` → `signal-circuit-v80`.

## QA
`qa-reports/day-126-qa.cdp.js` — **44/44 assertions across 8 phases on the FIRST
run**; 0 console.error; 0 Runtime.exceptionThrown.

- P1 build identity (11 refs, sw v80, 4 accessors exposed)
- P2 cold assignment (install id persisted; cohort in {local,live}; blob persist;
  ISO cohortAssignedAt; **cohort == harness-independent FNV-1a parity** of the id)
- P3 determinism (install id + cohort stable across reload; **reset keeps install
  id + re-derives same cohort**)
- P4 URL override (`?cohort=live` / `?cohort=local` force + persist)
- P5 session counter (cold=1; same-day reload no double-count; simulated new UTC
  day +1 exactly once; daysActive 6-day span; settle reload holds)
- P6 debug readout (hidden without flag; cohort badge + rows match `getSessionStats()`
  with flag; developer section reveals)
- P7 regression (Day 78 2 nav / Day 109 50 cards / Day 79 dead-ids / Day 92+107+123
  ESM bindings / Day 125 cold backend local / Day 85 variant default / SW active)
- P8 console hygiene

## Notes
- The simulated-day test rewrites `lastSessionDay`/`firstSessionDay` in the blob to
  N days ago, reloads, and asserts the constructor's `_recordSession()` bumps by
  exactly one — the canonical way to test a once-per-day counter without a clock.
- Reset semantics are deliberate: wiping experiment state re-derives the *same*
  cohort (stable install id) but re-stamps today's session — the readout stays
  populated and the A/B assignment is not accidentally re-rolled.
