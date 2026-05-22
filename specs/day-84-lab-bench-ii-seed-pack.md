# Day 84 — Lab Bench II Seed Pack

**Cycle:** 3 BUILD Week, Day 3
**cycleDay:** 32
**Day:** 84
**Status:** spec
**Author:** Mochi (autonomous factory orchestrator)

## Goal

Add three advanced Lab Bench puzzles in a new late-game mini-pack (Chapter 9 in display
numbering) using the existing `isLabBench` state machine, with **one new constraint
surfaced in copy and the lab HUD per level**.

This is the only new feature for Day 84. No prune work, no harden work.

## Levels

### Level 41 — "Pure NAND Builder"

- Constraint: only NAND gates available (universal-gate practice)
- Truth table: `A AND B` (4 rows, 2 inputs, 1 output)
- `availableGates: ['NAND']`
- `optimalGates: 2`, `goodGates: 4`
- `labConstraint: '🧱 NAND only — universal gate practice'`
- Insight: AND from NAND = NAND then NAND-as-inverter.

### Level 42 — "Budgeted Selector"

- Constraint: hard cap of **4 gates** per submission
- Truth table: 2-to-1 multiplexer — `OUT = (A AND NOT S) OR (B AND S)` (8 rows)
- `availableGates`: full palette
- `gateHardCap: 4`
- `optimalGates: 4`, `goodGates: 4`
- `labConstraint: '🎯 Hard cap: 4 gates'`
- Insight: a clean MUX fits in exactly four classic gates.

### Level 43 — "Parity Mandate"

- Constraint: must include at least one XOR gate
- Truth table: 3-input XOR (odd parity, 8 rows)
- `availableGates`: full palette
- `mustIncludeGate: ['XOR']`
- `optimalGates: 2`, `goodGates: 4`
- `labConstraint: '✳️ Must include an XOR gate'`
- Insight: parity decomposes cleanly with XOR chaining.

## Chapter

Add a new chapter to `CHAPTERS` (id `10`):

```js
{
  id: 10, title: 'Chapter 9: Lab Bench II', levels: [41, 42, 43],
  narrative: 'Constraints sharpen design.',
  storyIntro: 'Three advanced briefs. Each carries one extra rule — palette, budget, or required tool. Read the constraint first, design second.',
  storyComplete: '📐 Three rules, three blueprints. You can hold a constraint in your head and still find an elegant answer.',
  gatesMastered: ['Constraint Solving', 'Universal Gates', 'Gate Budgeting'],
  color: '#80F4FF',
  isBonus: true,
  realWorld: { ... },
}
```

## Enforcement

All three levels reuse Lab Bench's existing single-submission machinery (`_lab`
state, `_consumeLabAttempt`, RUN-button gating, Reset Lab button). New constraint
fields layer on top:

- `availableGates` (already supported): toolbox filtering excludes other gates.
- `gateHardCap`: at runSimulation/runQuickTest entry, after `_consumeLabAttempt()`
  proceeds, check `nonLockedGateCount > gateHardCap`. If exceeded, abort the
  animation, surface a status message (`Submission rejected: N gates exceeds
  hard cap of M`), and treat as a failed submission (attempt is already
  consumed).
- `mustIncludeGate`: at the same entry point, check that at least one gate of
  every required type is placed. If missing, abort with a status message
  (`Submission rejected: blueprint must include an XOR gate.`).

Both checks run **after** `_consumeLabAttempt()` so the lab philosophy holds —
submitting an invalid blueprint still costs an attempt. Reset Lab restores 3
fresh tries as today.

## UI

- New element `<span id="lab-constraint" class="lab-chip lab-constraint">` in
  the `#lab-hud` strip between `#lab-budget` and `#lab-tries`.
- `updateLabHud()` populates it from `level.labConstraint`. When absent on
  legacy lab levels (36–40), the chip is hidden.
- Light-mode and reduced-motion respect existing chip styles.

## Cache bust + service worker

- `index.html`: 11 references `?v=1779897600 → ?v=1779984000`.
- `sw.js`: `CACHE_NAME 'signal-circuit-v57' → 'signal-circuit-v58'`.

## QA matrix (CDP via localhost:8901)

1. Cold start — `LEVELS.length === 43`, chapter id 10 visible in `getChapters()`,
   levels 41/42/43 all `isLabBench:true`.
2. `seedProgress(40, {stars:3})` then visit L41 — Lab HUD visible,
   `#lab-constraint` text matches; toolbox shows only NAND gate;
   `availableGates` is `['NAND']`.
3. L41: submit empty circuit → fail (truth table miss); attempt count `1/3`.
4. L41: build NAND-then-NAND-as-NOT path → all 4 rows pass; achievement path
   intact (would unlock lab_method/drafted_right tracking on first try).
5. L42: 5-gate circuit submission → status reads "Submission rejected: 5 gates
   exceeds hard cap of 4"; attempt count `1/3`.
6. L42: 4-gate MUX submission → all 8 rows pass.
7. L43: solution without XOR (e.g. 3-XOR via NAND tree) → status reads
   "Submission rejected: blueprint must include an XOR gate."; attempt count
   `1/3`.
8. L43: 2-XOR chain → all 8 rows pass.
9. Reset Lab restores 3 tries on L41/L42/L43 unchanged.
10. Cold-start non-level button count unchanged at 2 (no new top-level
    buttons added).
11. Existing Lab Bench levels 36–40 — Lab HUD still works; new constraint chip
    hidden; submission path unchanged.
12. L1 cold-start gameplay still intact (RUN button reverts to `▶ RUN`, no
    lab HUD, no constraint chip).
13. Build identity: 11 `?v=1779984000` refs in index.html; sw.js CACHE_NAME
    `signal-circuit-v58`.
14. 0 console errors across all paths.

## Acceptance

- 3 new Lab Bench levels with truth tables, titles, and one extra constraint
  surfaced in HUD per level.
- Existing Lab HUD and 3-submission budget work unchanged.
- Level select remains uncluttered and tier-gated (the new chapter does not
  affect cold-start chrome — only level cards 41/42/43 appear after L40 is
  bookmarked or completed).
- No regressions to legacy lab levels, normal levels, or completion celebration.
- Single net-positive LOC pass; cache bust and SW version bumped together.
