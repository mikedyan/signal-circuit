# Day 92 Build Report — Module Split Phase 1 (gates.js as ES module)

**Cycle:** 4 BUILD Week, Day 1 (cycleDay 40)
**Date:** 2026-05-30 (Saturday)
**Roadmap item:** `roadmaps/cycle-4-build.md` § Day 92
**Spec:** `specs/day-92-module-split-gates-esm.md`
**QA:** `qa-reports/day-92-qa.md` (24/24 pass, 0 exceptions, 0 console errors)
**Cache-bust:** `?v=1780156800` → `?v=1780272000` (11 refs unified)
**SW version:** `signal-circuit-v60` → `signal-circuit-v61`

## What shipped

`js/gates.js` is now a true ES module. The 4 top-level declarations (`GateTypes`, `Gate`, `IONode`, `roundRect`) are now `export`-prefixed, the file loads via `<script type="module" src="js/gates.js?v=...">` in `index.html`, and a tail block in the same file rebinds the 4 names to `window` so the 8 classic-script consumers (`wires.js`, `simulation.js`, `levels.js`, `audio.js`, `achievements.js`, `canvas.js`, `ui.js`, `main.js`) continue to find them as bare globals at call time.

This is the **first ES-module conversion** in the project. Day 86 laid the foundation (`tools/module-health.js` + `specs/module-health.md` baseline); Day 92 actually ships a module.

## Why now / why gates.js

From the Day 86 module-health baseline:

| File | LOC | Fan-in syms | Fan-in files | Fan-out syms | Fan-out files |
|------|----:|------------:|-------------:|-------------:|--------------:|
| `gates.js` | 782 | 4 | **8** | **0** | **0** |

- **Fan-out = 0** — gates.js imports nothing from any other file. It's a true dependency-DAG leaf.
- **Fan-in = 8 files** — every other JS file references `Gate` / `GateTypes` / `IONode` / `roundRect`. Converting first and re-installing globals breaks no consumer.
- **Lowest-risk extraction.** No circular deps. No consumer-file refactors needed.

Two consecutive Prune reviews (Cycle 1 + Cycle 2) flagged "module split" as the top deferred backlog item. Doing it Day 1 of BUILD means the rest of the week can rest on the now-half-converted-but-stable boundary, and Cycle 4 PRUNE can audit it before Phase 2.

## Implementation summary

### `js/gates.js` (4 keyword adds + 12 LOC tail)

```diff
-const GateTypes = {
+export const GateTypes = {
...
-class Gate {
+export class Gate {
...
-class IONode {
+export class IONode {
...
-function roundRect(ctx, x, y, w, h, r) {
+export function roundRect(ctx, x, y, w, h, r) {
...
+// ── Day 92: Module Split Phase 1 — global rebind for classic-script consumers ──
+// gates.js is now a true ES module (loaded via `<script type="module">`).
+// The 8 other JS files (wires.js, simulation.js, levels.js, audio.js,
+// achievements.js, canvas.js, ui.js, main.js) still load as classic scripts
+// and reference `Gate` / `GateTypes` / `IONode` / `roundRect` as bare globals
+// inside method bodies. We install them on `window` here so those consumers
+// continue to resolve the symbols at call time.
+//
+// Removal plan: this block can be deleted once all 8 consumer files have
+// been converted to ES modules with explicit imports (Cycle 5+).
+if (typeof window !== 'undefined') {
+  window.Gate = Gate;
+  window.GateTypes = GateTypes;
+  window.IONode = IONode;
+  window.roundRect = roundRect;
+}
```

### `index.html` (1 module tag + 11 cache-bust bumps)

```diff
-  <link rel="stylesheet" href="css/style.css?v=1780156800">
+  <link rel="stylesheet" href="css/style.css?v=1780272000">
...
-  <script src="js/gates.js?v=1780156800"></script>
+  <script type="module" src="js/gates.js?v=1780272000"></script>
-  <script src="js/wires.js?v=1780156800"></script>
+  <script src="js/wires.js?v=1780272000"></script>
... (8 more bumps)
```

### `sw.js` (1 line)

```diff
-const CACHE_NAME = 'signal-circuit-v60';
+const CACHE_NAME = 'signal-circuit-v61';
```

### `tools/module-health.js` (+18 LOC)

- `DECL_RE` upgraded to optionally match `^export\s+(class|function|const|let|var)\s+...` so the scanner picks up both classic globals AND ES-module exports.
- New `ESM_RE = /^export\s+/m` detects ESM files by presence of any top-level `export ` statement.
- Per-file metrics record `esm: true|false`.
- Summary section adds: `- **ES-module-converted files:** N of M (`...`)` and the per-file table grows an `ESM` column.
- Stdout summary line appends `, ESM=N/M`.

After Day 92 run:
```
module-health: 10 files, 21225 LOC, 110 globals, biggest fan-out=ui.js (25 syms), collisions=0, ESM=1/10. Wrote specs/module-health.md.
```

### `specs/module-health.md` (regenerated)

| File | LOC | Globals | Classes | ESM |
|------|----:|--------:|--------:|:---:|
| `achievements.js` | 642 | 5 | 1 | — |
| `audio.js` | 1421 | 1 | 1 | — |
| `canvas.js` | 1038 | 1 | 1 | — |
| `gates.js` | 799 | 4 | 2 | ✅ |
| `levels.js` | 2556 | 26 | 0 | — |
| `main.js` | 6838 | 60 | 14 | — |
| `simulation.js` | 428 | 1 | 1 | — |
| `tutorial.js` | 306 | 1 | 1 | — |
| `ui.js` | 6601 | 1 | 1 | — |
| `wires.js` | 596 | 10 | 2 | — |

## Why this is safe

Module scripts are deferred. Classic scripts execute eagerly during HTML parsing. The execution order becomes:

1. HTML parser hits `<script type="module" src="gates.js">` → defers.
2. HTML parser hits 9 classic scripts (`wires.js` ... `main.js`) → executes each eagerly. Class declarations like `class WireManager {}` register their bindings, but method bodies don't run yet, and no top-level code in any of them references `Gate`/`GateTypes`/`IONode`/`roundRect`.
3. HTML parsing completes.
4. Module `gates.js` evaluates → declares the 4 symbols in module scope, then installs them on `window`.
5. `DOMContentLoaded` fires.
6. `main.js`'s DOMContentLoaded handler (line 6059) constructs `new Game()` → `new GameState()` → `new UI()` → ... All method bodies that reference `Gate`/`GateTypes` see them on `window`.

**Verified empirically** by the CDP harness: P4.2 synthetic L1 solve places an AND gate via `gs.addGate('AND', 400, 300)` — which internally calls `new Gate(type, x, y, this.nextId++)` — and the gate is created, wired, and the level solved with 3 stars.

## What this enables

1. **Phase 2 conversion of leaf-ish modules.** `wires.js` (fan-out=2, fan-in=5) and `simulation.js` (fan-out=2, fan-in=2) are the natural next targets. Each can be converted the same way: add `export`, install globals on `window`, change `<script>` to `<script type="module">`.

2. **Eventual removal of the global rebind shim.** Once all 10 files are ESM and use explicit `import` statements, the tail `window.X = X` block in each can be deleted. That's a Cycle-7+ project.

3. **Bundler-ready surface.** A future Day-N can run `esbuild --bundle js/main.js` (after main.js itself is a module) and get a single deduplicated bundle. Not in scope today.

## What was deliberately NOT done

- **No bundler.** Vanilla ES modules only.
- **No `import` statements in consumer files.** They still read globals — that's the entire purpose of the shim.
- **No conversion of any other file.** Phase 1 is one file: gates.js.
- **No removal of the `window.X = X` shim.** It stays until all consumers are ESM with explicit imports.
- **No LO-1 fix.** LO-1 is explicitly deferred to Cycle 4 PRUNE Week per BUGS.md.

## Cache-bust note

Cache-bust bumped from `1780156800` (Day 86 baseline) to `1780272000` (2026-06-01T00:00:00Z) because real code shipped today. SW version v60 → v61 forces stale-cache eviction on next activation. The HARDEN-week precedent of NOT bumping these stays intact (Day 87 through Day 91 all kept the same artifact pinned).

## QA evidence

```
Day 92 QA: 24/24 assertions passed
Exceptions: 0 · console.error: 0
```

Full harness output: `qa-reports/day-92-qa.md`.
