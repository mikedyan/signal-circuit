# Day 65 — Prune Week Day 3: Code Cleanup

**Date:** 2026-04-30 (Thursday)
**Cycle:** 1 | **Week:** Prune (week 3) | **Day:** 3 of 5
**Goal:** Remove dead code without changing any behavior. Net negative LOC.

## Audit Summary

A static-analysis pass over `js/` and `css/` (regex + cross-reference against all
JS + `index.html`) surfaced:

- **0** `console.log` calls left in shipping code (already clean).
- **0** commented-out code lines (already clean).
- **0** TODO / FIXME / HACK / XXX markers.
- **2** orphan top-level functions (declared, never called).
- **14** orphan class methods (declared, never called from anywhere — including
  no string references, no `window.game.*` exposure, no event handlers).
- **12** orphan CSS classes (defined, never appended via `classList`, never
  inlined as `class="…"`, never referenced via JS string).

## Cuts (this commit)

### `js/levels.js`
- Remove `getMasteryChallenge(id)` — singular helper. Only `getMasteryChallenges()`
  (plural) is used (4 call sites).

### `js/wires.js`
- Remove `WireManager.getActiveFlowCount()` — perf telemetry helper from Day 37
  that never wired into a UI.
- Remove top-level `distToSegment(...)` — left over from pre-Bezier hit-testing;
  the comment even reads "kept for compatibility". Nothing calls it.

### `js/canvas.js`
- Remove `CanvasRenderer.worldToScreen(wx, wy)` — inverse of `screenToWorld` that
  was never actually needed (we always go screen→world).
- Remove `CanvasRenderer.pan(dx, dy)` — manual pan API. The two-finger pinch flow
  in `main.js` writes to `viewTransform.x/y` directly.

### `js/audio.js`
- Remove `AudioEngine.setMute(muted)` — superseded by `setSfxVolume(0)` /
  `setMusicVolume(0)`; mute is now a derived state.
- Remove `AudioEngine.setMasterVolume(vol)` — Day 34 T8 helper that bundled three
  setters; replaced by independent SFX/Music sliders in Day 46.
- Remove `AudioEngine.playSimPulse()` — one-line wrapper around
  `playSimPulsePass()`. All callers use the explicit Pass/Fail variants.

### `js/achievements.js`
- Remove `AchievementManager.checkMasteryAchievement()` — Day 55 helper. The
  `master_logician` unlock is fired inline in `ui.js` (line 5688) on mastery
  completion. The duplicate path was never invoked.

### `js/main.js`
- Remove `GameState.showDailyConfig()` — replaced by `UI.showDailyScreen()` which
  the daily-challenge button click handler invokes directly.
- Remove `GameState.getAllPreviews()` — diagnostic accessor never referenced.
- Remove `GameState.isGateLocked(gateId)` — `_lockedGateIds.has(...)` is used at
  every call site directly.
- Remove `NotificationManager.getPreferences()` and `setPreference(type, enabled)` —
  external preference API that was never exposed (the in-modal toggles read/write
  `_prefs` directly via `_loadPrefs()` / `_savePrefs()`).
- Remove `SubCircuitManager.getById(id)` — never invoked; sub-circuits are looked
  up via `evaluateSubCircuit(type, inputs)`.

### `js/simulation.js`
- Remove `Simulation.animatePulse()` — comment marks it "Legacy: kept for
  backward compat". `animateSignalFlow()` is the only caller pattern.

### `js/ui.js`
- Remove `UI.hideChallengeFriendButton()` — challenge-friend feature was never
  enabled; helper is the last vestige.
- Remove `UI.updateGateCount()` — comment marks it "legacy for sandbox". The
  modern gate counter writes to `#gate-count-text` via `updateLiveGateCount()`.

### `css/style.css`
Remove orphan rules (none referenced from any JS string, classList, or HTML
attribute):

- `.daily-result-badge`
- `.discovery-badge`
- `.gamepad-cursor`
- `.logician-wire-preview`
- `.mastery-badge` (note: `.mastery-tab` is the live class)
- `.panel-collapsed` (note: `#info-panel.collapsed` is the live selector)
- `.phase-indicator`
- `.star-blocked`
- `.trace-expected`, `.trace-val-0`, `.trace-val-1` — superseded by Day 42's
  `.error-trace` styling
- `.tt-row-highlight` — superseded by `.row-highlight`

## Non-Goals

- No new features.
- No behavior changes.
- No file renames.
- No CSS reflow that could change rendering on existing classes.

## Verification

1. Headless cold-start: `level-select-screen` renders, no JS errors.
2. Headless tier-2 path (`onboarding.tier=tier2`): all challenge buttons appear.
3. Audio: at least one SFX (`playSimPulsePass`) plays on simulate.
4. No string `worldToScreen`, `getMasteryChallenge`, etc. left in source.
5. `index.html` cache-busted to `?v=1777824000` and `sw.js` `CACHE_NAME` bumped
   to `signal-circuit-v44`.

## Expected Diff

- ~120-140 LOC removed across 9 JS files.
- ~30-40 LOC removed from `style.css` (12 rules).
- 0 LOC added (besides cache-bust string changes).
- Net: strongly negative.
