# Day 94 — Lab Bench II Composite Constraints (Lab Bench III seed)

**Cycle:** 4 BUILD Week — Day 3 (cycleDay 42, factory day 94)
**Date:** 2026-06-01
**Roadmap reference:** `roadmaps/cycle-4-build.md` § Day 94

## Thesis

Day 84 (Cycle 3) shipped Lab Bench II with three single-axis constraint puzzles
(L41 NAND-only palette, L42 `gateHardCap=4`, L43 `mustIncludeGate=['XOR']`).
Day 94 extends Lab Bench II to support **composite** constraints — a single
level can now carry TWO active constraint axes simultaneously, and the
validator surfaces ALL violations in a single rejection message instead of
short-circuiting on the first one. Two new Chapter-10 puzzles (L44, L45)
demonstrate the composite shape and seed the future Lab Bench III lift
(multi-stage / two-window constraints, deferred to Cycle 5+).

## What Ships

### 1. Validator — `_validateLabConstraints()` accumulates ALL violations

**File:** `js/main.js` (~`_validateLabConstraints`)

Before Day 94 the validator returned on the first matching violation. Day 94
rewrites the function to push each violation reason onto a `reasons[]` array,
then joins all reasons with `; ` into one rejection message.

Single-violation messages remain **byte-equivalent** to Day 84:
- `Submission rejected: 5 gates exceeds hard cap of 4.`
- `Submission rejected: blueprint must include an XOR gate.`

Composite-violation messages add a second clause:
- `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.`

### 2. HUD chip strip — supports up to 2 chips

**Files:** `index.html`, `js/ui.js` (`UI.updateLabHud`)

`index.html` now declares a second sibling chip `<span id="lab-constraint-2">`
right after `#lab-constraint`. Both spans carry the same `.lab-chip
.lab-constraint` CSS so no style work is required.

`UI.updateLabHud()` normalises `level.labConstraint` into an array:
- A `string` value (Day 84 levels L41/L42/L43) → `[s]` → first chip only.
- An `Array` value (Day 94 composite levels L44/L45) → first 2 entries → both chips.
- Falsy / empty array → both chips hidden.

### 3. Two new composite levels

**File:** `js/levels.js`

| ID | Title | Constraints | Optimal |
|---|---|---|---|
| L44 | NAND-Only Half Adder | `availableGates: ['NAND']` + `gateHardCap: 6` | 5 NANDs (SUM + CARRY) |
| L45 | XOR-Heavy Multiplexer | `mustIncludeGate: ['XOR']` + `gateHardCap: 5` | 3 gates: XOR / AND / XOR |

Both carry `labConstraint` as a 2-element array so the HUD lights up both
chips. Chapter 10 (`Chapter 9: Lab Bench II`) extends its `levels` array
from `[41, 42, 43]` to `[41, 42, 43, 44, 45]` and updates its `storyIntro`
copy to reflect five briefs.

**L44 truth table** (1-bit half adder, outputs `[SUM, CARRY]`):

| A | B | SUM | CARRY |
|---|---|-----|-------|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

**L44 reference solve (5 NANDs):**
- `N1 = NAND(A, B)`
- `N2 = NAND(A, N1)`
- `N3 = NAND(B, N1)`
- `SUM = NAND(N2, N3)` (= A XOR B)
- `CARRY = NAND(N1, N1)` (= NOT(N1) = A AND B)

**L45 truth table** (2-to-1 MUX, `OUT = A` when `S=0`, `OUT = B` when `S=1`,
inputs `[S, A, B]`):

| S | A | B | OUT |
|---|---|---|-----|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 1 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 0 |
| 1 | 1 | 1 | 1 |

**L45 reference solve (3 gates, satisfies mustIncludeGate=[XOR] + cap≤5):**
- `X = XOR(A, B)`
- `Y = AND(X, S)`
- `OUT = XOR(A, Y)`

## Out of Scope

- **Lab Bench III** (multi-stage / two-submit-window constraints) — deferred
  to Cycle 5 BUILD or later. Today's composite shape is the seed; multi-stage
  needs a state-machine extension that touches `_lab.attempts`, the HUD
  layout, and the score economy. Premature today.
- **More than 2 simultaneous chips** — the HTML supports exactly two slots.
  Levels carrying a 3+-entry `labConstraint` array would render only the
  first 2. No level today does this; if/when a 3-way composite ships, add
  `#lab-constraint-3` then.
- **NAND-only enforcement in the validator** — palette restriction is
  enforced by construction (the toolbox simply doesn't render non-NAND gates
  for `availableGates: ['NAND']`), so the validator doesn't need a
  redundant palette check. The chip exists only to surface the rule for the
  player.

## Acceptance

- [x] `_validateLabConstraints()` accumulates ALL violations and joins them
      with `; ` in one message.
- [x] Single-violation message format is byte-equivalent to Day 84
      (covered by P3.2 and P3.3 of the QA harness).
- [x] L44 and L45 defined in `js/levels.js` with composite constraints.
- [x] Chapter 10 `levels` array = `[41, 42, 43, 44, 45]`.
- [x] HUD chip strip renders 2 chips when `labConstraint` is an array.
- [x] HUD chip strip renders 1 chip + hides the second when `labConstraint`
      is a string (Day 84 backwards compat).
- [x] Cache-bust `?v=1780358400` → `?v=1780444800` (11 refs unified).
- [x] SW CACHE_NAME `signal-circuit-v62` → `signal-circuit-v63`.
- [x] 0 console errors / 0 Runtime.exceptionThrown across the QA harness.
- [x] Day 78 staircase scales from 43 → 45 cards at full unlock.

## Risk Notes

- The L44 reference solve uses **5** NANDs against a hard cap of **6** —
  comfortable headroom but the simplest correct shape isn't trivial to
  discover blind. The hint chain walks the player there.
- The L45 reference solve uses **3** gates against a hard cap of **5** —
  ample room, but the player has to override their MUX instinct (NOT/AND/OR
  shape is 4 gates without XOR and would be rejected by `mustIncludeGate`).
- The validator change is the only place rejection messages are minted.
  Both call sites (`runSimulation` Lab Bench branch, `runQuickTest` Lab
  Bench branch) call into the same helper, so message format remains
  consistent between RUN and Quick Test (Day 84 contract).
