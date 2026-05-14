# Day 76 — `GameState.seedProgress()` Dev Helper + `runSimulation()` Re-entry Doc

**Cycle:** 2 · **Week:** Harden · **Day:** 4 (cycleDay 24)
**Build:** `?v=1779465600`, `sw.js CACHE_NAME = 'signal-circuit-v52'`

## Why

Day 75 (Cycle 2 Harden Day 3) closed with 0 new bugs but logged two verification-only learnings:

1. Tier3-gated UI (Tournament, Random Challenge config, Adaptive, Infinite, Customize, Mastery Tree, Profile, Collection, Stats, …) is hidden until 18 levels are completed. Future Harden weeks need a fast-forward into that state without 18 manual solves.
2. `runSimulation()` re-entry semantics are verified empirically every Harden but never codified — a future feature could quietly depend on the inverse and ship a regression.

Day 76 opened with an empty Open Bugs queue, so we close both learnings in one day and wrap Harden Week one day early.

## What

### 1. `GameState.seedProgress(count = 18, opts = {})` — `js/main.js`

Inserted immediately after `resetProgress()`.

```js
seedProgress(count = 18, opts = {}) {
  const stars = Math.max(1, Math.min(3, opts.stars ?? 3));
  const pureLogic = !!opts.pureLogic;
  const hardcore = !!opts.hardcore;
  if (opts.clear) {
    this.resetProgress();
  }
  const max = Math.min(count, getLevelCount());
  let seeded = 0;
  const now = Date.now();
  for (let id = 1; id <= max; id++) {
    const level = getLevel(id);
    if (!level) continue;
    const existing = this.progress.levels[id];
    if (existing && existing.completed && (existing.stars || 0) >= stars) {
      continue; // monotonic: never downgrade
    }
    const bestGates = level.optimalGates || 1;
    this.progress.levels[id] = {
      completed: true,
      stars,
      bestGateCount: existing?.bestGateCount ?? bestGates,
      bestTime: existing?.bestTime ?? 30,
      pureLogic: pureLogic || !!existing?.pureLogic,
      hardcoreCompleted: hardcore || !!existing?.hardcoreCompleted,
      lastPlayed: now,
      completedAt: existing?.completedAt || now,
      attempts: existing?.attempts || 1,
      _seeded: true, // marker — never written by real completion
    };
    seeded++;
  }
  this.saveProgress();
  if (this.ui && typeof this.ui.renderLevelSelect === 'function') {
    try { this.ui.renderLevelSelect(); } catch (e) {}
    try { this.ui.applyProgressGating?.(); } catch (e) {}
    try { this.ui.updateProgressBar?.(); } catch (e) {}
  }
  return { seeded, requested: count, max, stars, pureLogic, hardcore };
}
```

**Contract:**
- Synthetic entries carry `_seeded: true`. Real `completeLevel()` never writes this key.
- Non-destructive on real play: if a level is already completed at ≥ requested stars, leave it.
- Defaults to `stars: 3`, `bestGateCount: level.optimalGates`, `bestTime: 30`, `attempts: 1`.
- Re-runs `renderLevelSelect()` + `applyProgressGating()` + `updateProgressBar()` so tier-gated UI appears immediately.

**Usage:**
```js
window.game.seedProgress(18);                     // unlock tier3 (Tournament, …)
window.game.seedProgress(40, {stars: 3});         // 3★ every campaign level
window.game.seedProgress(40, {pureLogic: true});  // also flag Logician's Path
window.game.seedProgress(0, {clear: true});       // wipe back to cold start
```

### 2. `runSimulation()` re-entry contract — `js/main.js`

Inserted as a comment block directly above the existing `if (this.isAnimating) return;` guard:

```
Re-entry contract: while a simulation animation is in flight
(`isAnimating === true`), additional `runSimulation()` invocations are
no-ops (early return). After completion the flag is cleared in the
`finally` block, so subsequent clicks always start a *fresh* sim — there
is no debounce beyond "one in flight at a time". RUN-spam is therefore
idempotent at the simulation layer; any future feature that depends on
rate-limiting (e.g. submission throttling) must add its own guard.
```

This codifies the empirical property Day 75's RUN-spam test (T10) verified.

## Cache bust

- `index.html` `?v=1779465600` (11 refs)
- `sw.js` `CACHE_NAME = 'signal-circuit-v52'`

## Verification (live, localhost:8901 via CDP)

| # | Test | Pass? |
|---|---|---|
| 1 | Build identity — 11 cache-bust refs unified at `1779465600` | ✅ |
| 2 | `typeof window.game.seedProgress === 'function'` | ✅ |
| 3 | Cold-start: 16 tier-gated buttons all hidden | ✅ |
| 4 | `seedProgress(18)` returns `{seeded:18, requested:18, max:18, stars:3}` | ✅ |
| 5 | After seed: 13 tier3+ buttons visible | ✅ |
| 6 | Progress shape: 18 entries, all `_seeded:true`, all 3★, bestGates = optimal | ✅ |
| 7 | Tournament screen opens via `tournament-btn` (display:flex, 3 tabs) | ✅ |
| 8 | `showLevelSelect()` returns currentScreen to `level-select` | ✅ |
| 9 | Re-seed at `stars:1` leaves existing 3★ entries unchanged (monotonic) | ✅ |
| 10 | `seedProgress(0, {clear:true})` empties `progress.levels` | ✅ |
| 11 | Level 1 entry after seed clear: gameplay screen, '▶ RUN' label | ✅ |
| 12 | 10 rapid `runSimulation()` calls: 0 errors, guard holds (`isAnimating=true`) | ✅ |
| 13 | Console errors: 0 | ✅ |

## Files touched

- `js/main.js` — `+66 LOC` (58 helper + 8 contract comment)
- `index.html` — 11 cache-bust bumps `1779379200` → `1779465600`
- `sw.js` — `CACHE_NAME` v51 → v52
- `BUGS.md` — Day 76 summary appended
- `LESSONS_LEARNED.md` — Day 76 lessons inserted at top
- `reviews/harden-cycle-2-week-summary.md` — new week summary

## Net impact

- **Public surface for players:** zero change (helper is dev-only on `window.game`).
- **Verification surface for the factory:** future Harden weeks can hit tier3 UI in one CDP call instead of 18 manual solves.
- **Documentation surface:** `runSimulation()` re-entry contract is now in-source.
