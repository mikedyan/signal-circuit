# Day 107 QA Report — Cycle 5 BUILD Week, Day 1

**Date:** 2026-06-14 (Sunday)
**Cycle / Day:** Cycle 5, BUILD Week, Day 1 (cycleDay 55, Day 107)
**Feature:** Module Split Phase 2 — `wires.js` → ES module
**Build under test:** `?v=1781049600` / `sw v69`
**Harness:** `qa-reports/day-107-qa.cdp.js` against headless Chromium 146 on `localhost:9301` with the repo served at `localhost:8901`.

## Summary

**34/34 assertions passed** across 7 phases on the second harness pass. First pass had 3 self-bugs (vCount expected 11 scripts when in fact 10 scripts + 1 stylesheet = 11 total `?v=` refs; `startLevel` vs `loadLevel` — the campaign entry path is `startLevel(id)`, not bare `loadLevel(id)`; `gs.placedGates` vs the real field `gs.gates`). 0 console.error / 0 Runtime.exceptionThrown / 0 user-facing bugs.

## Day 92 Pattern Replication

Today follows the Day 92 precedent (gates.js → ES module) exactly:

| Step | Day 92 (gates.js) | Day 107 (wires.js) |
|---|---|---|
| Top-level `export` count | 4 (`GateTypes`, `Gate`, `IONode`, `roundRect`) | 5 (`WIRE_COLORS_DEFAULT`, `WIRE_COLORS_COLORBLIND`, `getWireColors`, `Wire`, `WireManager`) |
| Window-rebind names | 4 | 4 (omits internal-only `WIRE_COLORS_COLORBLIND`) |
| Classic-script consumers | 8 | 4 (`simulation.js`, `canvas.js`, `ui.js`, `main.js`) |
| Cache-bust + SW bump | v60 → v61 | v68 → v69 |

The 4 classic-script consumers reference the 4 window-rebound names only inside class methods or DOMContentLoaded handlers — never at module-evaluation time — so the module's defer-by-default loading is safe.

## Phase-by-phase

### P1 Build identity (3/3)
- 11 cache-bust refs at `?v=1781049600` (10 `<script>` + 1 `<link>` for css/style.css). Harness first run expected only the 10 scripts; corrected on second pass.
- `serviceWorker` API present.
- `window.game.wireManager` live (proves the module loaded + `new WireManager(this)` in `main.js#L1520` resolved through the window-rebind).

### P2 Module split contract (11/11) — the actual feature
- `wires.js` script tag has `type="module"`.
- src includes `?v=1781049600` (cache-bust unified with gates.js).
- `typeof window.Wire === 'function'`.
- `typeof window.WireManager === 'function'`.
- `Array.isArray(window.WIRE_COLORS_DEFAULT) && length === 10`.
- First wire color is `#4488ff` (breadboard blue — the original first palette entry, proving the export bound the canonical declaration not a stale window leak).
- `typeof window.getWireColors === 'function'`.
- `window.getWireColors()` returns an array of length ≥ 10 (returns `WIRE_COLORS_DEFAULT` in non-colorblind, non-cosmetic mode).
- `window.game.wireManager instanceof window.WireManager` — binding identity matches across the module/window boundary (this is the strongest signal that the rebind is canonical, not a re-export of a different class).
- `window.Wire.toString().startsWith('class Wire')`.
- `window.WireManager.toString().startsWith('class WireManager')`.

### P3 Cold-start sanity (3/3)
- Day 78 invariant holds: 2 non-level sidebar buttons (How to Play + Settings) on a cleared `localStorage` + reloaded build. Day 102 nav-button-filter primitive (offsetParent + visible + not inside overflow popover) reused here.
- Day 103 mastery-gating holds: 45 level cards in `#level-select-screen .level-btn` (the 5 Chapter Mastery cards remain inside the Mastery Tree modal, not the level-select grid).
- Day 78 Cut #5 silent-default difficulty: `localStorage['signal-circuit-difficulty-mode'] === 'standard'` set without any modal fire.

### P4 L1 gameplay smoke (4/4)
- After `window.game.startLevel(1)`, `#gameplay-screen` `style.display === 'flex'` (canonical campaign entry path is `startLevel`, which calls `ui.showScreen('gameplay')` + `loadLevel(id)` — bare `loadLevel(id)` only sets state, doesn't transition).
- `window.game.wireManager` is empty at cold entry and `findWireAt` is a callable instance method.
- Synthetic AND-gate solve: 1 gate + 3 wires placed via `new window.Gate('AND', 400, 400, gateId)` + 3 × `new window.Wire(...)` — both classes resolved through the window-rebind. `w1 instanceof window.Wire === true`.
- `runQuickTest()` triggered the `allPass` → `completeLevel` path; `progress.levels[1].stars === 3` in memory.

### P5 Day-79 dead-id regression (6/6)
All 7 Day 79 dead identifiers still `undefined` on this build (28 days post-purge): `showFirstLaunchDifficultyModal`, `checkLightning`, `checkEclipseRun`, `checkArchitect`, `isMythic` + DOM-absent `#weekly-puzzle-btn`.

### P6 Day-92 gates.js Phase 1 regression (5/5)
`window.Gate` + `window.GateTypes` + `window.IONode` + `window.roundRect` all still present and the right shape; `GateTypes` keys include `AND`. Module Split Phase 1 untouched by Phase 2 — exactly as the Day 92 risk-callout pattern requires.

### P7 Console hygiene (2/2)
0 `console.error` / 0 `Runtime.exceptionThrown` over the full harness run, including a full localStorage-clear reload, a cold-start sanity sweep, a campaign entry, an AND-gate solve, and a window-rebind probe.

## Build identity

- `index.html` cache-bust: `?v=1780876800 → ?v=1781049600` (11 refs unified).
- `sw.js` CACHE_NAME: `signal-circuit-v68 → v69`.
- `js/wires.js`: +18/-6 lines (5 `export` keywords + tail rebind block + comment headers).
- `index.html`: 11 cache-bust replacements + `type="module"` added to the wires.js script tag.

## Risk notes

- The 4 classic-script consumers (`simulation.js`, `canvas.js`, `ui.js`, `main.js`) load and parse before the module evaluates (modules are deferred). All references to `Wire` / `WireManager` / `WIRE_COLORS_DEFAULT` / `getWireColors` in those files live inside class methods or DOMContentLoaded handlers, so resolution happens after the module's tail rebind has run. The `WIRE_COLORS_DEFAULT` reference in `ui.js#L6383` uses a `typeof X !== 'undefined'` guard so it would degrade gracefully even on a load-order regression.
- `WIRE_COLORS_COLORBLIND` is `export`ed but intentionally NOT rebound to window — it's internal to `wires.js` and not referenced elsewhere. Keeping the `export` for future ES-module consumers; not the window-rebind to avoid polluting global namespace.
- Cycle 5 BUILD-week guardrail "one module per BUILD week" honored: only wires.js converted today. Phase 3 (`simulation.js`) waits for Cycle 6.

## Bugs queue

- **Open Bugs:** 0 → 0 (streak: **32 consecutive days** since Day 76).
- **Latent observations:** 0 → 0 (LO-1 retired on Day 103).
- **New bugs found today:** 0.
- **New bugs introduced today:** 0.

## Day 108 plan

Cycle 5 BUILD Week Day 2 — Tournament Worker Go-Live (per `roadmaps/cycle-5-build.md`). Write `tools/tournament-worker/` (Cloudflare Worker + wrangler.toml + KV-backed score storage + README + deploy script); update `RemoteTournamentAdapter` to call the worker URL when `localStorage('signal-circuit-tournament-worker-url')` is set; verify offline fallback to `LocalTournamentAdapter` in the same CDP harness. Local mode remains the default and must continue to work with the worker URL unset.
