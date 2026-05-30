# Day 92 — Module Split Phase 1: Extract `gates.js` as ES Module

**Cycle:** 4 BUILD Week, Day 1 (cycleDay 40)
**Date:** 2026-05-30 (Saturday)
**Roadmap:** `roadmaps/cycle-4-build.md` § Day 92
**Inputs:** `LESSONS_LEARNED.md`, `BUGS.md` (0 open), `specs/module-health.md` (Day 86 baseline), `reviews/prune-cycle-2-review.md`

## Goal

Convert `js/gates.js` from a classic-script global-leaking file into a true ES module. The 4 top-level declarations (`GateTypes`, `Gate`, `IONode`, `roundRect`) gain `export` keywords. A tail block rebinds them to `window` for the 8 classic-script consumers that still depend on globals. This is Module Split **Phase 1** — the foundation, not the finish line.

## Why `gates.js`

From `specs/module-health.md` (Day 86 baseline):

| File | LOC | Globals | Fan-in syms | Fan-in files | Fan-out syms | Fan-out files |
|------|----:|--------:|------------:|-------------:|-------------:|--------------:|
| `gates.js` | 782 | 4 | 4 | **8** | **0** | **0** |

- **Fan-out = 0:** `gates.js` references nothing from any other file. It is a true leaf in the dependency DAG.
- **Fan-in = 8 files:** Every other JS file references `Gate` / `GateTypes` / `IONode` / `roundRect`. Converting first to a module that re-installs globals breaks nothing.
- **Lowest-risk extraction.** No circular dependencies to disentangle. No reverse refactor needed in consumer files.

## Mechanism

Module scripts are deferred. Classic scripts execute eagerly during HTML parsing. The execution order becomes:

1. HTML parser hits `<script type="module" src="gates.js">` — defers the module.
2. HTML parser hits classic scripts (`wires.js`, `simulation.js`, ..., `main.js`) in order — executes each eagerly. Class declarations like `class WireManager {}` register their bindings, but method bodies don't run yet.
3. HTML parsing completes.
4. Module `gates.js` evaluates: declares `GateTypes`, `Gate`, `IONode`, `roundRect` in module scope, then runs `window.Gate = Gate; ...` to install globals.
5. `DOMContentLoaded` fires.
6. `main.js`'s `DOMContentLoaded` handler (line 6059) constructs `new Game()`, which constructs `GameState`, `UI`, `CanvasRenderer`, `Simulation`, `Tutorial`, `AchievementManager`, etc. All of those classes reference `Gate` / `GateTypes` inside method bodies — by now installed on `window`.

**Verified no-op for classic-script consumers.** A targeted grep confirms zero top-level (non-method-body, non-string-literal) references to `Gate`, `GateTypes`, `IONode`, or `roundRect` in any of the 8 classic-script files. All usage is inside methods or constructors, all of which run during user interaction (well after the module evaluates).

## Implementation

### 1. `js/gates.js` — add exports + global rebind

Edits:
- Line 3: `const GateTypes = {` → `export const GateTypes = {`
- Line 81: `class Gate {` → `export class Gate {`
- Line 622: `class IONode {` → `export class IONode {`
- Line 769: `function roundRect(...)` → `export function roundRect(...)`
- Append a tail block (after line ~782):
  ```js
  // Day 92: Module Split Phase 1 — re-install ES-module exports as globals
  // so the 8 classic-script consumers (wires.js, simulation.js, levels.js,
  // audio.js, achievements.js, canvas.js, ui.js, main.js) continue to
  // find `Gate`, `GateTypes`, `IONode`, `roundRect` on `window` during
  // their lifetime. Removable in a future cycle once all consumers are
  // converted to ES modules with explicit imports.
  if (typeof window !== 'undefined') {
    window.Gate = Gate;
    window.GateTypes = GateTypes;
    window.IONode = IONode;
    window.roundRect = roundRect;
  }
  ```

### 2. `index.html` — module-script tag for gates.js, cache-bust bump

Edits:
- Line 803: `<script src="js/gates.js?v=1780156800"></script>` → `<script type="module" src="js/gates.js?v=1780272000"></script>`
- Lines 804–812: bump 10 other `?v=1780156800` to `?v=1780272000`
- All 11 `?v=` refs unified at `1780272000` (2026-06-01T00:00:00Z).

### 3. `sw.js` — cache version bump

- Line 2: `const CACHE_NAME = 'signal-circuit-v60';` → `const CACHE_NAME = 'signal-circuit-v61';`

### 4. `tools/module-health.js` — recognize ESM modules

- Add an "ESM" column to the per-file metrics table.
- Detect ESM by scanning for `^export ` at line start (top-level export statement).
- Summary: include count of ESM-converted files (Day 92 baseline: 1 of 10).

### 5. `specs/module-health.md` — regenerate

Run `node tools/module-health.js`. Verify `gates.js` row shows ESM=yes; all others show ESM=no.

## Acceptance Tests (CDP harness)

The Day 92 harness runs against permissive headless Chromium at `http://localhost:8901/` on port 9301. Test phases:

- **P1 (4):** Build identity — 11 `?v=1780272000` refs in `index.html`, `sw.js` contains `CACHE_NAME='signal-circuit-v61'`, `js/gates.js` HTTP response is `text/javascript` with `export class Gate` substring, `<script type="module" src="js/gates.js?...">` is in the parsed `index.html`.
- **P2 (4):** Cold-start surface unchanged — 2 non-level buttons (How to Play + Settings), 43 level cards, onboarding variant `silent-standard`, difficulty silent-default `standard`.
- **P3 (5):** Module globals installed — `typeof window.Gate === 'function'`, `Gate.toString().startsWith('class Gate')`, `typeof window.GateTypes === 'object'`, `Object.keys(window.GateTypes).length >= 8` (AND/OR/NOT/XOR/NAND/NOR/XNOR/...), `typeof window.IONode === 'function'`, `typeof window.roundRect === 'function'`.
- **P4 (3):** Core loop end-to-end on L1 — gameplay screen visible, RUN button visible, 4 truth-table rows, 1 AND gate placed via `gs.addGate('AND', 400, 300)`, 3 wires via `gs.addWireFromData`, `runQuickTest()` persists `{stars: 3}`, `gs.progress.completed['1'].stars === 3`.
- **P5 (2):** Day 84 Lab Bench II L42 regression — `currentLevel.gateHardCap === 4`, validator rejects 5 gates with the exact `Submission rejected: 5 gates exceeds hard cap of 4.` message.
- **P6 (2):** Day 83 Tournament backend adapter — `tournament.getMode() === 'local'`, `tournament.describe()` is non-empty.
- **P7 (2):** Day 78 staircase end-game intact — `seedProgress(40, {stars:3})` produces 18 nav buttons + 40 overflow buttons.
- **P8 (2):** Console hygiene — 0 `Runtime.exceptionThrown`, 0 `console.error` across the entire harness.

**Total target: 24 assertions across 8 phases.**

## Risks & Mitigations

- **R1: A classic script references `Gate` at top level after all.** Mitigation — pre-implementation `grep` audit. Done. None found.
- **R2: Module evaluation order means globals install AFTER `DOMContentLoaded`.** Mitigation — module scripts evaluate BEFORE `DOMContentLoaded` (per HTML spec), so `main.js`'s init handler (the only place that exercises `Gate`/`GateTypes`) sees the globals. The CDP P4 test proves the end-to-end loop works.
- **R3: SW cache holds the old non-module gates.js.** Mitigation — bump `CACHE_NAME` to v61, which evicts the old cache on next activation. The Day 80 lesson ("CDP-driven SW eviction" — `unregister + caches.delete + fresh tab`) applies if the harness sees stale code; the harness preamble explicitly handles this.
- **R4: A future feature day forgets the module load and reverts to classic.** Mitigation — `tools/module-health.js` now reports ESM count in the summary line. Any future audit will see "ESM count: 1 of 10" and notice if that drops.

## Out of Scope

- Converting any other file (`wires.js`, `simulation.js`, etc.) to an ES module. Phase 2+ in Cycle 5.
- Removing the `window.Gate = Gate` shim. That stays until all consumers are ES modules.
- Adding `import` statements to consumer files. They continue to read globals.
- Bundler / build tooling. Phase 1 stays vanilla; Phase 3 can revisit if bundling earns its keep.

## Deliverables

- `js/gates.js` (modified, +12 LOC for tail block, 4 keyword adds)
- `index.html` (11 cache-bust bumps + 1 `type="module"` add)
- `sw.js` (1 line — CACHE_NAME bump)
- `tools/module-health.js` (ESM column + summary count)
- `specs/module-health.md` (regenerated)
- `qa-reports/day-92-qa.cdp.js` (harness)
- `qa-reports/day-92-qa.md` (report)
- `build-reports/day-92-build.md`
- `BUGS.md` — Day 92 section appended
- `LESSONS_LEARNED.md` — Day 92 lessons appended
- `FACTORY_STATE.json` — Day 92 entry, nextCycle for Day 93
- Single commit: `Day 92: Cycle 4 BUILD Day 1 — Module Split Phase 1 (gates.js as ES module)`
