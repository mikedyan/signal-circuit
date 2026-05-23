# Day 85 Build Report — Onboarding Experiment Flag

**Cycle:** 3 BUILD Week, Day 4
**cycleDay:** 33
**Day:** 85
**Date:** 2026-05-23
**Feature:** Onboarding Experiment Flag (local feature-flag manager for first-launch variants)
**Cache bust:** `?v=1780070400`
**SW version:** `signal-circuit-v59`
**Verification:** 44 CDP assertions on `localhost:8901`, 0 console errors.

## What shipped

A tiny, analytics-free, local feature-flag surface for first-launch
onboarding variants. The default behavior — Day 78's silent
`setDifficultyMode('standard')` + 4.5s welcome toast — is preserved
unchanged. QA can flip variants via URL query string or localStorage; no
external analytics are added.

### Variants

| Variant            | Behavior                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `silent-standard`  | **Default.** Silent `setDifficultyMode('standard')` + 4.5s informational toast.                |
| `explicit-chooser` | Opens `ui.showDifficultySelector()` immediately on first launch. Records the player's pick.    |
| `warm-toast`       | Silent `setDifficultyMode('standard')` + warmer toast copy ("👋 Welcome — Standard mode is on").|

### Precedence

1. URL `?onboarding=silent-standard|explicit-chooser|warm-toast` (persists into
   localStorage when seen).
2. localStorage `signal-circuit-onboarding-experiment` value (`.variant`).
3. Default `"silent-standard"`.

Unknown variant strings fall through to default. The query param wins on each
navigation; subsequent visits without the param honor the persisted variant.

### Storage shape

LocalStorage key: `signal-circuit-onboarding-experiment`

```json
{
  "variant": "silent-standard",
  "assignedAt": "<ISO8601>",
  "counters": {
    "firstLaunches": 0,
    "chooserShown": 0,
    "chooserPickedRelaxed": 0,
    "chooserPickedStandard": 0,
    "chooserPickedHardcore": 0,
    "toastShown": 0,
    "toastVariant": ""
  }
}
```

All counters start at 0 and only ever increment locally; nothing is sent off
the device.

### QA / Debug surfaces

- `window.__onboardingExperiment` exposes `getVariant()`, `getCounters()`,
  `reset()`, and `applyFirstLaunch()`.
- A new Settings → "🧪 Onboarding Experiment" entry sits inside a
  `#settings-developer-section` that is `display:none` by default and only
  revealed when `localStorage.signal-circuit-debug === '1'`. Cold-start
  chrome is unaffected (Settings itself is gated behind `#open-settings-btn`).
- The debug panel renders the current variant, a counters table, and a
  "Reset onboarding state" button that clears DIFFICULTY_KEY + the experiment
  key and reloads.

## Files touched

- `js/main.js` — new `OnboardingExperiment` class (~150 LOC), constants
  (`ONBOARDING_EXPERIMENT_KEY`, `ONBOARDING_VARIANTS`,
  `ONBOARDING_DEFAULT_VARIANT`, `ONBOARDING_TOAST_COPY`); GameState
  instantiates it and exposes `window.__onboardingExperiment`; the Day 78
  silent-default block in `_checkPlacementTest` now routes through
  `applyFirstLaunch()` (+185 / −16 LOC).
- `js/ui.js` — `setupSettingsModal()` toggles the developer section on each
  open based on the debug flag; new `showOnboardingExperimentPanel()` renders
  the debug modal (+48 / 0 LOC).
- `index.html` — new `#settings-developer-section` with
  `#onboarding-experiment-btn`; 11 `?v=` refs bumped to `?v=1780070400`
  (+17 / −11 LOC).
- `sw.js` — `CACHE_NAME = 'signal-circuit-v59'` (+1 / −1 LOC).
- `BUGS.md` — Day 85 entry, queue closed (+16 / −2 LOC).
- `LESSONS_LEARNED.md` — 7 new Day 85 lessons (+10 / 0 LOC).
- `specs/day-85-onboarding-experiment-flag.md` — new spec (+~220 LOC).

**Net JS:** +217 LOC (BUILD week — net adds explicitly allowed by Day 80
prompt for build days that introduce a feature class).

## Variant selection table

| Cold profile + URL                  | localStorage variant | Resolved variant   |
| ----------------------------------- | -------------------- | ------------------ |
| (none)                              | (none)               | `silent-standard`  |
| `?onboarding=warm-toast`            | (none)               | `warm-toast`       |
| `?onboarding=explicit-chooser`      | (none)               | `explicit-chooser` |
| `?onboarding=garbage`               | (none)               | `silent-standard`  |
| (none)                              | `"warm-toast"`       | `warm-toast`       |
| `?onboarding=silent-standard`       | `"warm-toast"`       | `silent-standard`  |
| (none)                              | `"garbage"`          | `silent-standard`  |

## Acceptance criteria (roadmap)

- [x] Default remains current Day 78 silent-default behavior (silent
  Standard mode + 4.5s welcome toast on cold start).
- [x] Flag can be toggled via query param/localStorage for QA.
- [x] No external analytics; local counters only.
- [x] Cache bust + SW version bumped together.
- [x] Cold-start non-level button count still 2 (verified).
- [x] Day 84 regression (L41 Lab HUD + constraint chip) holds.

## Risks / known limitations

- Variant assignment is purely opt-in via URL/localStorage. There is no
  random/hashed assignment — every real user defaults to silent-standard
  unless QA flips the flag. This is intentional for Day 85; randomized
  assignment would invite analytics scope creep.
- Counters are never displayed to the player. They exist solely for future
  QA inspection via the debug panel.
