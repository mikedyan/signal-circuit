# Day 123 Spec — Module Split Phase 3: `simulation.js` → ES Module

**Cycle 6 BUILD Week, Day 1 (cycleDay 74, Day 123).**
**Precedent:** Day 92 (`gates.js` → ES module), Day 107 (`wires.js` → ES module).

## Goal

Convert `js/simulation.js` from a classic-script global-leaking file into a true ES module, the third module in the long-running module-split effort (Phase 3 of ~9). Net-functional change is zero — this is a structural conversion that pays down monolith debt while keeping every runtime contract byte-identical.

## Current state (verified Day 123)

- `js/simulation.js` (427 LOC) declares exactly one top-level symbol: `class Simulation`.
- Two augmentations follow: `Simulation.prototype.traceFailurePath` (Day 42) and `Simulation.prototype.detectConstantOutputs` (Day 42). Both reference `Simulation` in module scope.
- `Simulation` is referenced externally only by `js/main.js:1599` — `this.simulation = new Simulation(this)` inside the `Game` constructor. The `Game` is instantiated on `DOMContentLoaded`.
- `simulation.js` references `Gate` and `IONode` (from `gates.js`) only inside method bodies (`evaluateOnce`, `traceFailurePath`) — never at top level. Both are on `window` since Day 92.
- `simulation.js` references `Wire` / `WireManager` indirectly only via `gs.wireManager.wires` (a property access, not the symbol).

## Changes

### 1. `js/simulation.js`
- Line 3: `class Simulation {` → `export class Simulation {`.
- Append tail rebind block (mirrors Day 92/107):
  ```js
  // ── Day 123: Module Split Phase 3 — global rebind for classic-script consumers ──
  // simulation.js is now a true ES module. The 1 classic-script consumer
  // (main.js) still references `Simulation` as a bare global at construction
  // time (`new Simulation(this)` inside the Game constructor, which runs on
  // DOMContentLoaded — after this module evaluates). We install it on `window`
  // here so that consumer resolves the symbol at call time.
  //
  // Removal plan: this block can be deleted once main.js is converted to an
  // ES module with explicit imports (Cycle 7+).
  if (typeof window !== 'undefined') {
    window.Simulation = Simulation;
  }
  ```

### 2. `index.html`
- Line 843: `<script src="js/simulation.js?v=1782604800"></script>` → `<script type="module" src="js/simulation.js?v=1782691200"></script>`.
- Bump all 11 cache-bust refs `?v=1782604800` → `?v=1782691200`.

### 3. `sw.js`
- `CACHE_NAME = 'signal-circuit-v76'` → `'signal-circuit-v77'`.

## Why it's safe (timing analysis)

Module scripts are deferred by default and execute in order **after** the HTML is parsed but **before** `DOMContentLoaded`. Classic scripts (`simulation.js` was one; `main.js` still is) execute during parse. The ordering at runtime:

1. Parse reaches `gates.js` (module, deferred) — queued.
2. Parse reaches `wires.js` (module, deferred) — queued.
3. Parse reaches `simulation.js` (now module, deferred) — queued.
4. Parse reaches classic scripts (`levels.js` … `main.js`) — execute immediately during parse. `main.js` defines the `Game` class and registers a `DOMContentLoaded` listener, but does **not** call `new Simulation()` yet.
5. HTML parse finishes; deferred modules execute in order: `gates.js` (rebinds `window.Gate` etc.), `wires.js` (rebinds `window.Wire` etc.), `simulation.js` (rebinds `window.Simulation`).
6. `DOMContentLoaded` fires → `main.js`'s listener runs `new Game()` → `new Simulation(this)` resolves `window.Simulation`. ✅

Inside `Simulation` methods, `Gate` / `IONode` resolve via module-scope global fall-through to `window.Gate` / `window.IONode` (present since step 5 / Day 92). Identical mechanism to Day 107's `wires.js` resolving `Gate`/`IONode`.

## Acceptance criteria (CDP harness, `qa-reports/day-123-qa.cdp.js`)

- **P1 build identity:** 11 cache-bust refs unified at `?v=1782691200`; `sw.js` CACHE_NAME `signal-circuit-v77`.
- **P2 module binding:** `typeof window.Simulation === 'function'`; `window.game.simulation instanceof window.Simulation === true` (binding-identity proof — the rebind is canonical, not a re-export).
- **P3 evaluate path:** L1 AND-gate synthetic solve (`new window.Gate('AND', …)` + 3 × `new window.Wire(…)` + `runQuickTest()`) → `progress.levels[1].stars === 3` (exercises `evaluateOnce` + `runAll`).
- **P4 trace path:** a deliberately wrong/empty circuit on L1 → `simulation.traceFailurePath()` returns ≥1 trace with a `message`; `detectConstantOutputs()` callable.
- **P5 regression — prior modules:** Day 92 `window.Gate` / `window.GateTypes` (8 keys) / `window.IONode` / `window.roundRect`; Day 107 `window.Wire` / `window.WireManager` all present + correct shape.
- **P6 regression — Day 79 dead-id purge:** 7 identifiers undefined + `#weekly-puzzle-btn` DOM absent.
- **P7 cold-start invariants:** 2 nav buttons (Day 78), 50 level cards (Day 109), silent-default difficulty `standard`.
- **P8 console hygiene:** 0 `console.error`, 0 `Runtime.exceptionThrown`.

## Source LOC budget

`js/simulation.js` ≈ +14 / −1 (export keyword + tail rebind block). `index.html` +11/−11 (cache-bust only, +`type="module"`). `sw.js` +1/−1. Net ≈ +14 functional LOC — a structural day, not a feature day.
