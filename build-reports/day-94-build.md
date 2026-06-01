# Day 94 Build Report — Lab Bench II Composite Constraints

**Cycle:** 4 BUILD Week — Day 3 (cycleDay 42, factory day 94)
**Date:** 2026-06-01
**Cache-bust:** `?v=1780358400` → `?v=1780444800`
**SW version:** `signal-circuit-v62` → `signal-circuit-v63`

## Files Changed

| File | Δ |
|---|---|
| `js/main.js` | `_validateLabConstraints()` rewrites to accumulate ALL violations into one `Submission rejected: …; …` message. Single-violation format preserved byte-for-byte. |
| `js/levels.js` | Chapter 10 levels array `[41,42,43]` → `[41,42,43,44,45]`. Chapter 10 storyIntro/Complete copy updated. Two new lab levels appended: L44 NAND-Only Half Adder, L45 XOR-Heavy Multiplexer — each carrying `labConstraint` as a 2-string array. |
| `js/ui.js` | `UI.updateLabHud()` normalises `level.labConstraint` to an array, then renders first entry into `#lab-constraint` and second entry into the new `#lab-constraint-2` sibling chip. Day 84 string-valued constraints render unchanged. |
| `index.html` | Added `<span id="lab-constraint-2" class="lab-chip lab-constraint" style="display:none;">` next to the existing `#lab-constraint` span. 11 `?v=…` cache-bust refs bumped to `1780444800`. |
| `sw.js` | CACHE_NAME `signal-circuit-v62` → `signal-circuit-v63`. |

## Why Now

Day 84 (Cycle 3 BUILD Day 3) shipped the Lab Bench II machinery — `_lab`
state machine, 3-submit attempt budget, `_consumeLabAttempt()` helper,
post-attempt `_validateLabConstraints()` hook, single `#lab-constraint`
chip, and three single-axis puzzles. That was a deliberately bounded slice;
Cycle 4 BUILD week (Day 92 module split, Day 93 worker go-live, Day 94 lab
bench composite, Day 95 onboarding readout, Day 96 share-card library)
harvests one user-facing reward from each Cycle 3 seed plus pays down
strategic debt. Day 94 is the lab-bench harvest day.

## Implementation Notes

### Validator change is non-breaking by construction

The new `_validateLabConstraints()` only short-circuits on `_isLabBench() ===
false` (and on `level` being null). For valid lab levels it walks the
constraint list, pushes reason strings into a local array, then either
returns `{ok: true}` (empty reasons) or `{ok: false, message: 'Submission
rejected: ' + reasons.join('; ') + '.'}`. When there's exactly one reason
the joined output is byte-identical to Day 84:

```
single hardCap:    'Submission rejected: 5 gates exceeds hard cap of 4.'
single mustInclude:'Submission rejected: blueprint must include an XOR gate.'
```

P3.2 and P3.3 of the QA harness assert these exact strings.

### HUD chip strip — two slots, normalised once

`UI.updateLabHud()` already runs on every `runSimulation` re-render, every
`runQuickTest`, and on Lab Bench level entry. The normalisation step is a
single `Array.isArray(...) ? ... : (typeof === 'string' ...)` ternary at the
top of the constraint block, after which the rest of the code reads from
`lcList[0]` and `lcList[1]` uniformly. Backwards compat is structural — the
Day 84 string path collapses to `[s]` so `lcList[0]` is the chip and
`lcList[1]` is undefined (chip 2 hidden).

### Why two static sibling chips instead of a dynamic container

Considered three approaches:

1. Replace `#lab-constraint` with a flex container that dynamically appends
   chip spans on each `updateLabHud()` call.
2. Keep `#lab-constraint` as a single chip; add `#lab-constraint-2` as a
   second sibling chip in the same `#lab-hud` flex row.
3. Encode multiple constraints as a single chip with a `·`-separator.

Option 2 wins because:
- It changes the DOM shape for Day 94 levels only — Day 84 levels keep an
  empty hidden `#lab-constraint-2` so their visible chip strip is identical
  byte-for-byte.
- No new CSS rule needed (`.lab-chip.lab-constraint` already styles the
  second chip).
- The HUD flex row handles spacing naturally between `#lab-budget`,
  `#lab-constraint`, `#lab-constraint-2`, and `#lab-tries`.
- Future Lab Bench III multi-stage UI will need a different chip-row shape
  anyway (per-stage tabs / steppers), so over-engineering today's flex
  container with N slots would be premature.

### L44 truth-table arithmetic check

The half-adder reference truth table was hand-verified against the 5-NAND
solve before committing. Each row:

- `(0,0)`: `N1=NAND(0,0)=1`, `N2=NAND(0,1)=1`, `N3=NAND(0,1)=1`, `SUM=NAND(1,1)=0` ✓, `CARRY=NAND(1,1)=0` ✓.
- `(0,1)`: `N1=NAND(0,1)=1`, `N2=NAND(0,1)=1`, `N3=NAND(1,1)=0`, `SUM=NAND(1,0)=1` ✓, `CARRY=NAND(1,1)=0` ✓.
- `(1,0)`: `N1=NAND(1,0)=1`, `N2=NAND(1,1)=0`, `N3=NAND(0,1)=1`, `SUM=NAND(0,1)=1` ✓, `CARRY=NAND(1,1)=0` ✓.
- `(1,1)`: `N1=NAND(1,1)=0`, `N2=NAND(1,0)=1`, `N3=NAND(1,0)=1`, `SUM=NAND(1,1)=0` ✓, `CARRY=NAND(0,0)=1` ✓.

All four rows match the declared truth table.

### L45 XOR-MUX identity check

- `S=0,A=0,B=0`: X=0, Y=0, OUT=A XOR 0=0 ✓
- `S=0,A=0,B=1`: X=1, Y=0, OUT=0 ✓
- `S=0,A=1,B=0`: X=1, Y=0, OUT=1 ✓
- `S=0,A=1,B=1`: X=0, Y=0, OUT=1 ✓
- `S=1,A=0,B=0`: X=0, Y=0, OUT=0 ✓
- `S=1,A=0,B=1`: X=1, Y=1, OUT=0 XOR 1=1 ✓
- `S=1,A=1,B=0`: X=1, Y=1, OUT=1 XOR 1=0 ✓
- `S=1,A=1,B=1`: X=0, Y=0, OUT=1 XOR 0=1 ✓

## QA — see `qa-reports/day-94-qa.md`

31 / 31 assertions passed across 7 phases on first run. 0 console errors,
0 Runtime.exceptionThrown.
