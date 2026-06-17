# Day 110 — Gameplay HUD Personal-Best Badge

**Cycle:** 5 BUILD Week Day 4
**cycleDay:** 58
**Date:** 2026-06-17 (Wed)
**Roadmap:** `roadmaps/cycle-5-build.md` (Day 110 row)

## Problem

Players currently see no signal on level revisits that they've already beaten a level. The gameplay HUD treats every entry as a cold attempt. There's no visible "your best" target inside the gameplay surface, so the natural improvement-loop motivator is missing.

## Solution

Add a persistent `#level-best-badge` to the gameplay info panel (inside `#level-info`, immediately below `#gate-indicator`). On level revisits where `gameState.progress.levels[levelId]` is non-empty AND `.completed === true`, the badge renders:

```
🏆 Your best: 3 gates · 0:18 · ⭐⭐⭐
       📈 Try to beat
```

On the first entry of a level (no prior data, or data exists but `completed:false`), the badge is suppressed. Same suppression applies to sandbox / challenge / daily / infinite / tournament / mastery / community level shapes (only campaign + lab-bench gates apply).

The badge updates live after `completeLevel()` writes a new best — so finishing a 5-gate run when the prior best was 7 gates replaces the badge text immediately, without requiring an exit-and-re-enter cycle.

## Acceptance

1. New `#level-best-badge` div in `#level-info` after `#gate-indicator`.
2. `UI.updateLevelBestBadge()` reads `gs.progress.levels[level.id]` and renders gate count, time (`mm:ss`), star count.
3. Suppression cases: undefined progress, `!completed`, sandbox, challenge, daily, infinite, tournament, mastery flagged levels — all hide the badge.
4. Called at end of `UI.updateLevelInfo()` (level load path).
5. Called at end of `GameState.completeLevel()` after `saveProgress()` (live update on improvement).
6. CSS: cyan-tinted background, gold ⭐ icons, subtle `📈 Try to beat` subtext.
7. Light-mode mirror.
8. Cache-bust + SW bump: `?v=1781308800`, `signal-circuit-v72`.
9. CDP harness:
   - L1 cold entry: badge hidden.
   - Solve L1 in 1 gate (3 stars).
   - Exit to level-select.
   - Re-enter L1: badge visible with `1 gates · 0:NN · ⭐⭐⭐`.
   - Solve L1 again (same 1-gate run, no improvement): badge unchanged.
   - Sandbox mode: badge hidden.
   - Daily mode: badge hidden.

## Risk callout

- Badge runs at every `updateLevelInfo()` call, but `updateLevelInfo()` only fires on `loadLevel()` (not on every gate placement), so cost is negligible.
- `completeLevel()` already calls `saveProgress()` before the new hook; the badge read sees the just-written values.
- DOM insertion is inside the existing `#level-info` flow box, so layout impact is minimal (one additional row between `#gate-indicator` and `#level-nav`).

## Suppression scope (cold-start invariants)

- Cold-start non-level button count (Day 78 invariant): **unchanged at 2**. The badge lives inside the gameplay screen, not on level-select.
- Level card count: **50** (Day 109 invariant).
- Day 79 dead-IDs: still undefined.
- Day 92 / Day 107 `window.Gate` / `window.Wire` bindings: untouched.

## File changes (planned)

- `index.html`: +1 DOM row inside `#level-info`; 11 cache-bust refs `?v=1781222400 → ?v=1781308800`.
- `css/style.css`: +1 selector block for `#level-best-badge` + `body.light-mode` mirror (~30 LOC).
- `js/ui.js`: +1 method `updateLevelBestBadge()`; +1 call from `updateLevelInfo()` tail (~50 LOC).
- `js/main.js`: +1 call from `completeLevel()` tail (~3 LOC).
- `sw.js`: CACHE_NAME `signal-circuit-v71 → v72`.

Net LOC: approx +85 / -0.
