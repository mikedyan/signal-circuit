# Day 85 — Onboarding Experiment Flag

**Cycle:** 3 BUILD Week, Day 4
**cycleDay:** 33
**Day:** 85
**Date:** 2026-05-23
**Cache bust:** `?v=1780070400`
**SW version:** `signal-circuit-v59`

## Goal

Introduce a tiny, analytics-free, local feature-flag surface for first-launch
onboarding experiments. The default behavior — Day 78's silent-default
`setDifficultyMode('standard')` + welcome toast — must remain unchanged for
all users on a default profile. QA can toggle alternate variants via URL query
string or localStorage. No external analytics are added; the feature only
stores small local counters for future inspection.

## Variants

| Variant            | Behavior                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `silent-standard`  | **Default.** Mirrors Day 78: silent `setDifficultyMode('standard')` + 4.5s informational toast. |
| `explicit-chooser` | Opens `ui.showDifficultySelector()` immediately on first launch. Records the player's pick. |
| `warm-toast`       | Silent `setDifficultyMode('standard')` + 4.5s **warmer** toast (different copy/emoji).        |

## Variant precedence (highest first)

1. URL query param `?onboarding=silent-standard | explicit-chooser | warm-toast`
   (also persists into localStorage for the current profile).
2. localStorage `signal-circuit-onboarding-experiment` value (`.variant`).
3. Default `"silent-standard"`.

Unknown variant strings fall through to the default. The query param wins on
each navigation; subsequent visits without the param honor the persisted
variant.

## Storage shape

LocalStorage key: `signal-circuit-onboarding-experiment`

```json
{
  "variant": "silent-standard",
  "assignedAt": "2026-05-23T08:06:00.000Z",
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

- `firstLaunches` increments **only when the onboarding decision actually
  fires** — i.e., the gate `!SafeStorage.getItem(DIFFICULTY_KEY)` was true at
  the time `applyFirstLaunch()` ran. Re-runs after the decision is recorded do
  not increment any counter.
- `toastShown` / `toastVariant` track the last toast that was displayed (incl.
  the warm variant copy id).
- `chooserShown` and the three `chooserPicked*` counters track the
  explicit-chooser flow.
- All counters default to zero and only ever increment locally. They are
  never sent anywhere; they exist for future inspection via the QA modal.

## UI surfaces

### Replaces

`js/main.js` "Day 78 Cut #5" silent-default block (~line 1902) now routes
through `this.onboardingExperiment.applyFirstLaunch()` instead of inlining
the silent-standard logic. The new manager handles all three variants
internally; preserving Day 78 behavior in the default case is part of the
acceptance criteria.

### Settings → "🧪 Onboarding Experiment" (debug-gated)

A new `#onboarding-experiment-btn` lives inside the existing Settings modal
under a "Developer" section. The section is hidden via `display:none` by
default and revealed only when `SafeStorage.getItem('signal-circuit-debug')
=== '1'`. This keeps cold-start chrome at 2 non-level buttons (the Settings
modal itself is gated behind `#open-settings-btn` regardless of debug flag).

Clicking the button opens a small modal listing:

- Current variant.
- Counters table (one row per counter).
- "Reset onboarding state" button — clears `DIFFICULTY_KEY` + the experiment
  key + reloads.

### `window.__onboardingExperiment`

Exposed for QA inspection:

- `getVariant() → string`
- `getCounters() → object` (shallow clone)
- `reset()` — clears `DIFFICULTY_KEY` + the experiment key. Does NOT reload;
  callers can call `applyFirstLaunch()` afterward to verify cold-state
  restoration.

## Counter semantics

- **`firstLaunches`** — incremented exactly once per cold profile, at the
  moment `applyFirstLaunch()` does the actual variant work. Idempotent on
  re-runs because the function guards on `DIFFICULTY_KEY`.
- **`chooserShown`** — incremented when the explicit-chooser modal is opened
  during onboarding (one increment per cold profile, same gate as above).
- **`chooserPicked{Relaxed,Standard,Hardcore}`** — incremented exactly once
  when the user clicks a difficulty option inside the cold-onboarding chooser.
  Subsequent visits to Settings → Difficulty Mode do NOT increment these
  counters (that flow does not go through `OnboardingExperiment`).
- **`toastShown` / `toastVariant`** — incremented + recorded whenever a
  cold-onboarding toast fires. Stores the last-seen variant name string.

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

## Verification matrix (CDP localhost:8901)

≥20 assertions. Highlights:

- Build identity: 11 `?v=1780070400` refs in `index.html`, SW v59 active.
- `window.__onboardingExperiment` exists; default variant is
  `"silent-standard"` on a cleared profile.
- Cold-start → `applyFirstLaunch()` fires →
  `localStorage[DIFFICULTY_KEY] === "standard"`, toast appears,
  `counters.firstLaunches === 1`, `counters.toastShown === 1`,
  `counters.toastVariant === "silent-standard"`.
- URL `?onboarding=warm-toast` on a clean profile → variant flips, warm copy
  is shown, `counters.toastVariant === "warm-toast"`.
- URL `?onboarding=explicit-chooser` on a clean profile → chooser modal
  visible, `counters.chooserShown === 1`. Clicking "Standard" →
  `counters.chooserPickedStandard === 1`, `DIFFICULTY_KEY === "standard"`.
- Re-running `applyFirstLaunch()` after the decision is recorded does NOT
  re-fire (counters do not double-count).
- localStorage `signal-circuit-onboarding-experiment` persists variant +
  counters across reload.
- `window.__onboardingExperiment.reset()` clears DIFFICULTY_KEY +
  experiment key; subsequent `applyFirstLaunch()` fires fresh.
- L1 normal gameplay path still works: RUN button, isAnimating, 4 truth rows.
- Cold-start non-level button count still 2 (debug section hidden).
- With `signal-circuit-debug=1` set, the Settings → "🧪 Onboarding
  Experiment" button is visible inside the settings modal (but does not bump
  the cold-start outer count).
- Day 84 regression: L41 Lab HUD + constraint chip still visible.
- 0 console errors across all paths.

## Out of scope

- Real network analytics. Counters are local-only.
- A/B traffic assignment. There is no random/hashed variant selection — every
  user defaults to silent-standard unless QA flips the flag.
- Multi-variant pop-up modals beyond the existing `showDifficultySelector`.
