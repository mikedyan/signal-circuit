# Day 84 Build Report — Lab Bench II Seed Pack

**Cycle:** 3 BUILD Week, Day 3  
**cycleDay:** 32  
**Day:** 84  
**Date:** 2026-05-22  
**Feature:** Lab Bench II Seed Pack (Levels 41, 42, 43)  
**Cache bust:** `?v=1779984000`  
**SW version:** `signal-circuit-v58`  
**Verification:** 49 CDP assertions on `localhost:8901`, 0 console errors.

## What shipped

Three new advanced Lab Bench puzzles in a new chapter (id 10, "Chapter 9: Lab
Bench II"), each layering one extra constraint on top of the existing Day 70
Lab Bench machinery (3-submission budget, Reset Lab, single-shot Submit
Blueprint).

### Levels

- **L41 — Pure NAND Builder.** Rebuild AND from only NAND gates.
  `availableGates: ['NAND']`, optimal 2 (NAND then NAND-as-NOT).  
  Constraint chip: `🧱 NAND only — universal gate practice`.

- **L42 — Budgeted Selector.** Build a 2-to-1 MUX with a strict 4-gate hard cap.
  `gateHardCap: 4`, optimal 4 (NOT S, AND·A, AND·B, OR).  
  Constraint chip: `🎯 Hard cap: 4 gates`.

- **L43 — Parity Mandate.** Build 3-input XOR using at least one XOR gate.
  `mustIncludeGate: ['XOR']`, optimal 2 (two XORs back-to-back).  
  Constraint chip: `✳️ Must include an XOR gate`.

### New optional level fields

- `labConstraint: string` — one-line copy surfaced in the lab HUD.
- `gateHardCap: number` — strict ceiling on non-locked gate count.
- `mustIncludeGate: string[]` — array of gate types that must be placed.

### Enforcement

A new helper `_validateLabConstraints()` runs immediately after
`_consumeLabAttempt()` in both `runSimulation` and `runQuickTest`. A constraint
violation aborts the animation, surfaces a precise status message
(`Submission rejected: …`), and still counts as a submission (attempt is
already debited). This preserves the "design first, submit once" discipline.

### UI

- New `#lab-constraint` chip in the lab HUD strip, amber accent.
- `#lab-budget` gains an `.over-cap` class (red, pulses once via existing
  `tierRevealPulse` keyframe) when gate count exceeds `gateHardCap`.
- Legacy lab levels 36–40 omit the optional fields, so the chip stays hidden
  and the validator returns `{ok:true}`.

## Files touched

- `js/levels.js` — new chapter + 3 levels (+118 LOC).
- `js/main.js` — `_validateLabConstraints()` + post-attempt hooks in
  `runSimulation` and `runQuickTest` (+40 LOC).
- `js/ui.js` — constraint chip + over-cap toggle in `updateLabHud()` (+17 LOC).
- `index.html` — `<span id="lab-constraint">` + 11 cache-bust refs.
- `css/style.css` — `.lab-constraint` + `.over-cap` (dark + light mode) (+25 LOC).
- `sw.js` — bumped to `signal-circuit-v58`.
- `BUGS.md`, `LESSONS_LEARNED.md`, `specs/day-84-lab-bench-ii-seed-pack.md`,
  `build-reports/day-84-build.md`, `qa-reports/day-84-qa.md`.

## Risk surface

- Legacy lab levels 36–40 still pass through the constraint validator; their
  outcome is `{ok:true}` because the fields are absent. Verified.
- `LEVELS.length` grew from 40 to 43. Achievements that walk `LEVELS` use the
  array dynamically (mythic_galaxy_brain, mythic_logicians_path). The new lab
  levels are part of "every campaign level" and will require completion +
  3-star + Pure Logic for those mythics. That tightens the goal naturally;
  no broken unlock paths were detected.
- `lab_method` achievement threshold (`blueprintLevelsCleared >= 5`) is
  unchanged. With 8 lab levels now (5 legacy + 3 new), the unlock still fires
  on the 5th distinct lab clear.
- Cold-start non-level button count regression verified at 2 — no new
  top-level surface added.

## Acceptance

- ✅ 3 new Lab Bench levels with truth tables, titles, and one extra constraint
  surfaced in copy + HUD per level.
- ✅ Existing Lab HUD and 3-submission budget work unchanged on legacy lab
  levels (verified L36).
- ✅ Level select remains uncluttered (chapter renders only after L40 is
  bookmarked/completed in normal play; cold-start chrome unchanged).
- ✅ Cache bust + SW version bumped together.
