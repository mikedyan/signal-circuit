# Day 123 QA Report — Cycle 6 BUILD Week, Day 1

**Feature:** Module Split Phase 3 — `js/simulation.js` → ES module
**Date:** 2026-06-30 (Tuesday)
**Build under test:** local `http://localhost:8901/` · `?v=1782691200` · `sw.js CACHE_NAME = 'signal-circuit-v77'`
**Harness:** `qa-reports/day-123-qa.cdp.js` (25 assertions across 8 phases)
**Result:** **25 / 25 assertions passed on the FIRST run.** 0 `console.error`. 0 `Runtime.exceptionThrown`.

## What shipped

Converted `js/simulation.js` from a classic-script global-leaking file into a true ES module — the third module in the long-running module-split effort (Day 92 `gates.js`, Day 107 `wires.js` precedent). Net-functional change is zero; this is a structural conversion paying down monolith debt.

- `class Simulation` → `export class Simulation`.
- Tail rebind block installs `window.Simulation = Simulation` (guarded by `typeof window !== 'undefined'`) so the classic-script `main.js` consumer continues to resolve `Simulation` as a bare global at construction time (`new Simulation(this)` inside the `Game` constructor, which runs on `DOMContentLoaded` — after the deferred module evaluates).
- The two Day 42 `Simulation.prototype.*` augmentations (`traceFailurePath`, `detectConstantOutputs`) stay in module scope unchanged.
- `index.html`: `simulation.js` now `<script type="module">`; 11 cache-bust refs bumped `?v=1782604800` → `?v=1782691200`.
- `sw.js`: `signal-circuit-v76` → `signal-circuit-v77`.

## Verification highlights

- **P1 build identity** — 11 unified cache-bust refs at `?v=1782691200`; `sw.js` v77; `simulation.js` carries `type="module"`.
- **P2 module binding** (the deliverable) — `window.Simulation` is a class; `game.simulation instanceof window.Simulation === true` (binding-identity proof: the rebind is canonical, not a re-export); `evaluateOnce` / `runAll` / `traceFailurePath` / `detectConstantOutputs` all on the prototype.
- **P3 evaluate path** — L1 AND-gate synthetic solve (`new window.Gate('AND', …)` + 3 × `new window.Wire(…)` + `runQuickTest()` + `completeLevel`) → `Simulation.runAll()` evaluates all 4 truth-table rows, every row passes, 3 stars persisted.
- **P4 trace path** — empty L1 circuit → `traceFailurePath()` returns 1 disconnected-output trace with a human-readable message; `detectConstantOutputs()` callable.
- **P5 regression** — Day 92 `Gate`/`IONode`/`roundRect` + `GateTypes` (8 keys) and Day 107 `Wire`/`WireManager`/`WIRE_COLORS_DEFAULT` (10 colors)/`getWireColors` all intact.
- **P6 regression** — Day 79 dead-id purge: 7 identifiers undefined + `#weekly-puzzle-btn` absent.
- **P7 cold-start invariants** — 2 nav buttons (Day 78), 50 level cards (Day 109), silent-default difficulty `standard`.
- **P8 console hygiene** — 0 / 0.

## Source LOC

`js/simulation.js` +14 / −1 (export keyword + 13-line tail rebind block). `index.html` +11 / −11 (cache-bust + `type="module"`). `sw.js` +1 / −1. Net ≈ +14 functional LOC.

## Open Bugs / Latent observations

- **Open Bugs queue:** 0 → 0 (streak: **48 consecutive days** since Day 76).
- **Latent observations:** 0 → 0.
- **New bugs found today:** 0. **New bugs introduced today:** 0.

**Day 124 next:** Cycle 6 BUILD Week Day 2 — Collection-Modal Merge → tabbed Profile hub (`specs/day-121-collection-merge-scaffold.md`).
