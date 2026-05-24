# Day 86 — Module Split Foundation

**Cycle:** 3 BUILD Week, Day 5
**cycleDay:** 34
**Day:** 86
**Date:** 2026-05-24
**Cache bust target:** new timestamp (replacing `?v=1780070400`)
**SW version target:** `signal-circuit-v60`

## Goal

Lay the foundation for the long-deferred ES-module split without
attempting the migration itself. Direct ES-module conversion of ten
inter-referencing global-script files in one day is too risky for a
BUILD-week timebox. Instead, ship the **measurement** layer that any
future module-split work will need anyway — a reproducible
module-health report — and execute one safe, demonstrable coupling
reduction to validate the report's signal.

## Roadmap acceptance (cycle-3-build.md Day 86)

- A measurable reduction in monolithic coupling **or** a repeatable
  module-health report checked into `specs/`.
- No gameplay regressions.
- Cache-bust and service worker version updated.

Today's plan: **both** halves. Ship the report, and use it to delete
one dead global.

## Deliverables

### 1. `tools/module-health.js`

Pure-Node (no npm deps) script that scans `js/*.js` and emits
`specs/module-health.md`. Re-runnable any time with
`node tools/module-health.js`.

Metrics per file:

- **LOC** — total lines (including blanks/comments).
- **Globals defined** — count of top-of-line declarations:
  `^(class|function|const|let|var)\s+(\w+)`. Nested helpers and
  IIFE-scoped symbols are not counted because they aren't anchored at
  line start.
- **Classes exposed** — subset of the above with `kind === "class"`.
- **Fan-in symbols** — distinct globals defined in this file that any
  other file references.
- **Fan-in files** — distinct other files that reference at least one
  of this file's globals.
- **Fan-out symbols** — distinct globals from other files that this
  file references.
- **Fan-out files** — distinct other files whose globals appear here.

Per-symbol detail tables:

- For each file, "Fan-in detail" lists each defined symbol, kind,
  which other files reference it, and total reference count.
- For each file, "Fan-out detail" lists each cross-file global
  referenced and the source file, sorted by reference count desc.

Collisions table: any symbol declared as a top-of-line global in more
than one file (expected: 0 today).

### 2. `specs/module-health.md`

The generated report itself, committed to source. This becomes the
baseline; future days regenerate to see deltas.

### 3. One safe coupling reduction

Pick a target from the baseline report whose fan-in count is `0`
(defined but referenced nowhere outside the defining file) **and**
that is also unused within the defining file. That makes it dead
code, not just internal state — removal cannot affect runtime
behavior.

**Target chosen:** `WIRE_COLORS` in `js/wires.js`, line 43:

```js
const WIRE_COLORS = WIRE_COLORS_DEFAULT;
```

- Defined once, assigned to `WIRE_COLORS_DEFAULT`, then never read
  anywhere in the codebase (verified via `grep -n "\bWIRE_COLORS\b"
  js/*.js` returning only that single definition line).
- `WIRE_COLORS_DEFAULT` (which it aliases) is what's actually
  consumed by `js/ui.js:6061` and by `getWireColors()` in
  `wires.js`.
- Removing this line drops the global count from 111 → 110 and the
  wires.js globals count from 11 → 10. Zero behavioral effect.

This is intentionally the smallest possible reduction. The point is
to prove the report's signal end-to-end (baseline → change → rerun
shows the metric move), not to win a coupling fight on Day 86.

### 4. Cache-bust + service worker bump

- `index.html`: replace the 11 occurrences of `?v=1780070400` with a
  new unified timestamp.
- `sw.js`: bump `CACHE_NAME` from `signal-circuit-v59` to
  `signal-circuit-v60`.

## Methodology notes (so the report is honest)

- Regex parsing, not AST. A symbol mentioned inside a string literal
  or comment is counted as a reference. This **over-counts coupling
  on the margin and never under-counts**, which is the right
  direction for a coupling-trend metric.
- "Whole-word" matching via `\b<sym>\b`. This catches usages but also
  catches matches inside multi-line comments — accepted.
- The script intentionally only catches *top-of-line* declarations
  anchored at `^`. Symbols declared with leading whitespace are
  inside functions/blocks and therefore not on the module surface.
- The report is normative, not prescriptive — it does not flag any
  given metric as "too high." Threshold rules can be added in a
  future Polish/Prune day once we have a few baselines for trend.

## Acceptance criteria

- [ ] `tools/module-health.js` runs cleanly with `node tools/module-health.js`
      (zero stderr, zero non-zero exit).
- [ ] `specs/module-health.md` exists, is at least 200 lines, and
      includes Summary, Per-file metrics, Fan-in detail, Fan-out
      detail sections.
- [ ] Total globals BEFORE reduction: report shows 111.
- [ ] Total globals AFTER reduction: report shows 110.
- [ ] `wires.js` globals BEFORE: 11. AFTER: 10.
- [ ] `grep -c "\?v=" index.html` returns 11; the unified value is the
      new Day 86 timestamp.
- [ ] `sw.js` `CACHE_NAME = 'signal-circuit-v60'`.
- [ ] Browser QA on `localhost:8901` passes the full Day 86
      regression suite (build identity, cold-start button count,
      L1 entry/solve, Day 78 staircase, Day 83 tournament adapter,
      Day 84 Lab Bench II, Day 85 onboarding experiment) with 0
      console errors.

## Out of scope (deferred)

- ES-module migration (`import`/`export`) — requires a multi-day
  plan with explicit ordering, build pipeline, and SW path strategy.
- Wrapping wires.js internal helpers in an IIFE — bigger surgery
  than today's timebox warrants.
- Threshold rules / CI gating on module-health metrics — needs at
  least 3–4 baselines first to set credible thresholds.
- Renaming `_semanticColorMap` and friends to remove the
  underscore-as-private convention.
