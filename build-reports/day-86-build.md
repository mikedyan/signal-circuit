# Day 86 Build Report — Module Split Foundation

**Cycle:** 3 BUILD Week, Day 5
**cycleDay:** 34
**Day:** 86
**Date:** 2026-05-24
**Feature:** Module Split Foundation (repeatable module-health report + first safe coupling reduction)
**Cache bust:** `?v=1780156800`
**SW version:** `signal-circuit-v60`
**Verification:** 19 CDP assertions on `localhost:8901`, 19/19 passed, 0 console errors.

## What shipped

A foundation layer for the long-deferred ES-module migration, sized for a
single BUILD-week timebox:

1. **`tools/module-health.js`** — a pure-Node script (no npm deps) that
   scans `js/*.js`, finds top-of-line globals via regex, cross-references
   their usage across files, and emits a markdown report at
   `specs/module-health.md`. Rerunnable any time with
   `node tools/module-health.js`. The report quantifies per-file LOC,
   globals defined, classes exposed, fan-in (symbols here that others
   reference) and fan-out (symbols here that pull from others).

2. **`specs/module-health.md`** — the generated baseline report,
   committed to source. Future days can regenerate to see deltas.

3. **One safe coupling reduction** — deleted the dead-global
   `const WIRE_COLORS = WIRE_COLORS_DEFAULT;` in `js/wires.js`. It was
   defined at module load, aliased to `WIRE_COLORS_DEFAULT`, and never
   referenced anywhere else. Surfaced by the report's fan-in=0 column.
   Drops total globals from 111 → 110 and `wires.js` globals from
   11 → 10.

4. **Cache-bust + SW bump** — `?v=1780070400` → `?v=1780156800` (11
   refs in `index.html`); `signal-circuit-v59` → `signal-circuit-v60`
   in `sw.js`.

## Module-health baseline (post-reduction)

- **Files scanned:** 10 (`js/*.js`)
- **Total LOC:** 21,208
- **Total top-level globals:** 110
- **Biggest fan-out file:** `ui.js` (25 distinct cross-file globals
  referenced, across 5 files)
- **Cross-file symbol collisions:** 0

| File | LOC | Globals | Classes | Fan-in syms | Fan-in files | Fan-out syms | Fan-out files |
|------|----:|--------:|--------:|------------:|-------------:|-------------:|--------------:|
| `achievements.js` | 642 | 5 | 1 | 5 | 2 | 7 | 3 |
| `audio.js` | 1421 | 1 | 1 | 1 | 1 | 4 | 4 |
| `canvas.js` | 1038 | 1 | 1 | 1 | 1 | 5 | 2 |
| `gates.js` | 782 | 4 | 2 | 4 | 8 | 0 | 0 |
| `levels.js` | 2556 | 26 | 0 | 22 | 3 | 2 | 2 |
| `main.js` | 6838 | 60 | 14 | 6 | 3 | 24 | 9 |
| `simulation.js` | 428 | 1 | 1 | 1 | 2 | 2 | 1 |
| `tutorial.js` | 306 | 1 | 1 | 1 | 1 | 2 | 2 |
| `ui.js` | 6601 | 1 | 1 | 1 | 3 | 25 | 5 |
| `wires.js` | 596 | 10 | 2 | 3 | 5 | 2 | 1 |

### Coupling story the baseline tells

- **`gates.js` is the natural first extraction target.** Fan-in=4
  symbols (`Gate`, `IONode`, `GateTypes`, `roundRect`) referenced by
  8 of the 10 files; fan-out=0 (depends on nothing). It is the
  graph's purest leaf.
- **`ui.js` is the natural last extraction target.** Fan-out=25
  symbols, fan-in=1 (just `UI`). It's the consumer-of-everything.
- **`main.js` is the orchestrator** — 60 globals defined here (54%
  of the total), fan-in=6 to fan-out=24. Splitting `main.js` is the
  biggest single coupling-reduction lever available.
- **`levels.js` is high-fan-in, low-fan-out** — 22 of its 26
  globals are referenced externally (mostly `LEVELS`, `CHAPTERS`,
  curated puzzle data, and pure helpers). Could be extracted as a
  data module without much surgery.

### Reduction executed (before/after)

| Metric                     | Before | After | Δ   |
|----------------------------|-------:|------:|----:|
| Total top-level globals    |   111  |  110  |  −1 |
| `wires.js` globals defined |    11  |   10  |  −1 |
| `wires.js` fan-in symbols  |     3  |    3  |   0 |

Symbol removed: `WIRE_COLORS` (`js/wires.js:43`, pre-reduction). A 3-line
comment was left in its place explaining why it was deleted and which
Day surfaced it.

## Files touched

- `tools/module-health.js` — **new** (~240 LOC, pure Node).
- `specs/module-health.md` — **new** (auto-generated baseline,
  ~270 LOC).
- `specs/day-86-module-split-foundation.md` — **new** spec.
- `qa-reports/day-86-qa.cdp.js` — **new** CDP regression harness.
- `js/wires.js` — removed dead-global `WIRE_COLORS`, added 3-line
  comment (net 0 globals' worth of behavior change; +2 LOC).
- `index.html` — 11 `?v=` refs bumped to `?v=1780156800`.
- `sw.js` — `CACHE_NAME = 'signal-circuit-v60'`.
- `BUGS.md` — Day 86 section appended.
- `LESSONS_LEARNED.md` — 7 new Day 86 lessons appended.
- `build-reports/day-86-build.md` — this file.
- `qa-reports/day-86-qa.md` — Day 86 QA report.

**Net JS delta:** +2 LOC (one dead `const` removed, replaced with a
3-line comment). No new gameplay code.

## Acceptance criteria (roadmap)

- [x] Repeatable module-health report checked into `specs/`.
- [x] A measurable reduction in monolithic coupling (1 fewer
      top-level global, 1 fewer in the wires.js surface).
- [x] No gameplay regressions (19/19 CDP assertions passed,
      0 console errors).
- [x] Cache-bust + SW version bumped together.

## Risks / known limitations

- The report is regex-based, not AST-based. Identifiers mentioned
  in strings or comments are counted as references. This
  over-counts coupling on the margin and never under-counts —
  conservative direction for a trend metric.
- The script only catches top-of-line declarations. Globals
  assigned in unusual ways (e.g. `window.foo = …` inside a
  function) are not detected. That's an acceptable false-negative
  for now — none of the current files use that pattern.
- Today's reduction was deliberately tiny (one dead `const`). The
  intent was to prove the report's signal end-to-end, not to win
  a coupling fight in one day. Future Polish/Prune days can
  target higher-fan-out hotspots once the baseline trends accumulate.
