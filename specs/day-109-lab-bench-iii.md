# Day 109 — Cycle 5 BUILD Week, Day 3: Lab Bench III mini-chapter (L46-L50) with fan-out budget

**Cycle:** 5 BUILD · **cycleDay:** 57 · **Day:** 109 · **Date:** 2026-06-16
**Build under test (target):** `?v=1781222400` · `sw.js CACHE_NAME = 'signal-circuit-v71'`
**Roadmap source:** `roadmaps/cycle-5-build.md` § Day 109

## Thesis

Lab Bench I (Day 70, L36-L40) introduced "design first, submit once". Lab Bench II (Days 84 + 94, L41-L45) added two constraint axes: palette restriction (NAND-only) + gate hard cap, then composite (palette + hard cap, or mustIncludeGate + hard cap). Lab Bench III (Day 109, L46-L50) adds the **third validator constraint axis: fan-out budget**, and ships the first **triple-composite** level (L48: palette + hard cap + fan-out).

Fan-out = count of wires emanating from a single source (input-node output OR gate output pin). The constraint forces players to **share intermediate signals** rather than duplicate gates feeding multiple destinations — a real-world chip-design discipline (one transistor, many destinations).

## Scope

1. **5 new lab-bench levels in Chapter 11** with `isLabBench:true` + `maxFanOut:N`.
2. **`_validateLabConstraints()` extended** to check fan-out per source, accumulating violations.
3. **HUD `#lab-constraint` chip strip** renders up to **3 chips side-by-side** for triple-composite levels.
4. **Cache-bust + SW bump**: `?v=1781136000 → ?v=1781222400`; `sw v70 → v71`.
5. **CDP harness** at `qa-reports/day-109-qa.cdp.js`.

## Fan-out semantics

For each wire `w` in `wireManager.wires`, the **source** is the pair `(w.fromGateId, w.fromPinIndex)`. Fan-out of a source = number of wires sharing that pair. Both **input node outputs** and **gate output pins** count uniformly (input nodes are `fromGateId` sources too).

A single physical wire connecting one source to one destination contributes **+1** to the source's fan-out. Two wires from the same source to two destinations = fan-out 2 from that source.

`maxFanOut: N` means **every source's fan-out must be ≤ N**. The validator rejects if any source exceeds the budget.

Rejection clause (byte-exact): `fan-out K exceeds budget of N` (where K is the highest violating fan-out observed). Plural pattern matches Day 84's `N gates exceeds hard cap of M` style.

## Validator change (`js/main.js _validateLabConstraints()`)

Extend the existing Day 94 multi-reason accumulator. After the `gateHardCap` and `mustIncludeGate` blocks, add a third block:

```js
// Day 109: maxFanOut — every wire source (input-node output OR gate output
// pin) must not emit more than `level.maxFanOut` wires. Forces signal sharing.
if (typeof level.maxFanOut === 'number') {
  const fanout = {};
  for (const w of this.wireManager.wires) {
    const k = `${w.fromGateId}:${w.fromPinIndex}`;
    fanout[k] = (fanout[k] || 0) + 1;
  }
  let maxSeen = 0;
  for (const k of Object.keys(fanout)) {
    if (fanout[k] > maxSeen) maxSeen = fanout[k];
  }
  if (maxSeen > level.maxFanOut) {
    reasons.push(`fan-out ${maxSeen} exceeds budget of ${level.maxFanOut}`);
  }
}
```

Day 94's join logic (`reasons.join('; ')`) handles the triple-composite naturally: the worst case message reads
`"Submission rejected: K gates exceeds hard cap of M; fan-out F exceeds budget of N; blueprint must include an XOR gate."`

## HUD third chip (`js/ui.js updateLabHud()`)

Today's render layer already iterates `lcList[0]` and `lcList[1]`. Add `lcList[2]` → `#lab-constraint-3` with the same show/hide pattern.

```js
const constraintEl3 = document.getElementById('lab-constraint-3');
if (constraintEl3) {
  if (lcList[2]) {
    constraintEl3.textContent = lcList[2];
    constraintEl3.style.display = '';
  } else {
    constraintEl3.textContent = '';
    constraintEl3.style.display = 'none';
  }
}
```

DOM: add `<span id="lab-constraint-3" class="lab-chip lab-constraint" style="display:none;"></span>` after `#lab-constraint-2` in `index.html`. No new CSS needed — `.lab-chip.lab-constraint` styling + flex-wrap parent handles 3-chip layout naturally.

## Level designs

### L46 — Triple Echo (single constraint: maxFanOut)

- **Goal:** 1 input `A`, 3 outputs `X=A, Y=A, Z=A` (identity triple-echo).
- **Constraint:** `maxFanOut: 2`.
- **Why hard:** Naive routes A's output to all 3 destinations directly → fan-out 3, REJECTED.
- **Solve (2 gates):** A → X (1 wire), A → G1 (NOT), G1 → G2 (NOT), G2 → Y, G2 → Z. Fan-outs: A=2 (X, G1), G1=1, G2=2 (Y, Z). All ≤ 2. ✓
- `optimalGates: 2`, `goodGates: 3`.
- chip: `'🌐 Fan-out ≤ 2 per source'`

### L47 — Distributed AND (composite: maxFanOut + hardCap)

- **Goal:** 2 inputs `A, B`, 3 outputs `X=A AND B, Y=A AND B, Z=A AND B` (triple echo of AND).
- **Constraints:** `maxFanOut: 2`, `gateHardCap: 3`.
- **Why hard:** Naive 1-gate solve (single AND fanned out to X/Y/Z) has AND fan-out=3 → REJECTED.
- **Solve (3 gates):** AND(A,B) → G1; G1→X, G1→G2 (NOT); G2→G3 (NOT); G3→Y, G3→Z. Fan-outs: A=1, B=1, G1=2 (X, G2), G2=1, G3=2 (Y, Z). All ≤ 2. Gates=3 ≤ 3. ✓
- `optimalGates: 3`, `goodGates: 3`.
- chips: `['🌐 Fan-out ≤ 2 per source', '🎯 Hard cap: 3 gates']`

### L48 — NAND Triple Composite (TRIPLE: NAND-only palette + hardCap + maxFanOut)

- **Goal:** 2 inputs `A, B`, 1 output `OUT = A AND B`.
- **Constraints:** `availableGates: ['NAND']`, `gateHardCap: 3`, `maxFanOut: 2`.
- **Solve (2 NANDs):** G1 = NAND(A, B). G2 = NAND(G1, G1) → OUT. (G2 = NOT G1 = NOT NAND(A,B) = A AND B.)
  - Fan-outs: A=1 (G1), B=1 (G1), G1=2 (both pins of G2), G2=1 (OUT). All ≤ 2. ✓
  - Gates=2 ≤ 3. ✓
- `optimalGates: 2`, `goodGates: 3`.
- chips: `['🧱 NAND only', '🎯 Hard cap: 3 gates', '🌐 Fan-out ≤ 2 per source']`
- **This level is the harness probe for the 3-chip HUD and triple-composite validator path.**

### L49 — Required XOR under fan-out (composite: mustIncludeGate + maxFanOut)

- **Goal:** 2 inputs `A, B`, 2 outputs `X = A XOR B`, `Y = A XOR B` (double-echo of XOR).
- **Constraints:** `mustIncludeGate: ['XOR']`, `maxFanOut: 2`, `gateHardCap: 3`.
- **Why hard:** 1-XOR solve (XOR fan-out=2 to X+Y) works at maxFanOut=2 — but only one XOR. With strict 1-XOR + buffer:
- **Solve (1 gate):** G1 = XOR(A, B). G1 → X, G1 → Y. A fan-out=1, B fan-out=1, G1 fan-out=2. mustInclude XOR ✓. Gates=1 ≤ 3 ✓.
- `optimalGates: 1`, `goodGates: 2`.
- chips: `['✳️ Must include an XOR gate', '🌐 Fan-out ≤ 2 per source', '🎯 Hard cap: 3 gates']`

### L50 — NAND-only Tee Junction (composite: NAND-only palette + maxFanOut)

- **Goal:** 2 inputs `A, B`, 2 outputs `X = A NAND B`, `Y = A NAND B` (echo of NAND).
- **Constraints:** `availableGates: ['NAND']`, `maxFanOut: 2`, `gateHardCap: 2`.
- **Solve (1 gate):** G1 = NAND(A, B). G1 → X, G1 → Y. A fan-out=1, B fan-out=1, G1 fan-out=2 ✓. Gates=1 ≤ 2 ✓.
- `optimalGates: 1`, `goodGates: 2`.
- chips: `['🧱 NAND only', '🌐 Fan-out ≤ 2 per source', '🎯 Hard cap: 2 gates']`

## Chapter 11 metadata

```js
{
  id: 11, title: 'Chapter 11: Lab Bench III', levels: [46, 47, 48, 49, 50],
  narrative: 'Share signals. Spend less.',
  storyIntro: 'Five new briefs add a third design axis: fan-out budget. Every source — input or gate — has a cap on how many destinations it can drive. Buffer chains, signal sharing, and judicious palette use all matter now.',
  storyComplete: '📐 Three constraint axes, mastered. Real chip design is now within reach.',
  gatesMastered: ['Fan-out Budgeting', 'Signal Sharing', 'Triple-Composite Constraints'],
  color: '#A0F8FF',
  isBonus: true,
  realWorld: {
    title: '🔌 In the Real World',
    fact: 'Every transistor has a maximum fan-out — drive too many gates and the signal degrades. Real chip designers add buffer trees (chains of NOTs or non-inverting buffers) to fan signals out across millions of destinations without losing integrity.',
    device: 'Buffer Tree Synthesis',
    icon: '🔌',
  },
},
```

## CDP probes (qa-reports/day-109-qa.cdp.js)

Reuse Day 107/108 harness skeleton (CDP via raw WebSocket on port 9301; `python3 -m http.server 8901` server). Phases:

1. **P1 Build identity** — 11 cache-bust refs at `?v=1781222400`; sw v71 active.
2. **P2 Levels exist** — `LEVELS` array contains L46-L50; all 5 have `isLabBench:true` + `maxFanOut`; L48 has 3-element `labConstraint` array; L48 palette = NAND-only.
3. **P3 Chapter 11 metadata** — `getChapters()` returns chapter id 11 with levels [46,47,48,49,50].
4. **P4 Validator fan-out reject** — Load L46 via `startLevel(46)`. Place wires that violate maxFanOut=2 (e.g., place 0 gates, route input A → 3 output pins). `runQuickTest()` → rejection message exact match `"Submission rejected: fan-out 3 exceeds budget of 2."`.
5. **P5 Validator triple composite reject** — Load L48. Place 4 NAND gates with input A wired to 3 of them (fanout violation + hardCap violation). `runQuickTest()` → rejection contains BOTH `"4 gates exceeds hard cap of 3"` AND `"fan-out 3 exceeds budget of 2"` joined by `; ` in a single message.
6. **P6 HUD 3-chip render** — On L48, `#lab-constraint-3` is visible with text matching the third chip. All 3 chips text-match the level's `labConstraint` array. L46 (single-string) shows `#lab-constraint-3` hidden.
7. **P7 Optimal solve passes** — Load L48 in fresh state (via resetLab + clear wires). Place 2 NANDs as the optimal solve (G1=NAND(A,B); G2=NAND(G1,G1)); `runQuickTest()` → completes with stars.
8. **P8 Regression — Day 94 composite still passes** — Load L44 (NAND-only Half Adder, hardCap=6). Place 7 NAND gates and probe rejection: byte-exact `"Submission rejected: 7 gates exceeds hard cap of 6."` (Day 94 string preserved — no fan-out clause because L44 has no maxFanOut).
9. **P9 Cold-start invariants** — Day 78 (2 nav buttons cold), Day 103 (45 level cards cold — Note: with 5 new bonus-chapter levels, cards may bump to 50; the cold-start grid renders ALL levels via `renderLevelSelect()`. Verify expected new count). Day 79 dead-IDs undefined. Day 92 `window.Gate`/`GateTypes`. Day 107 `window.Wire`/`WireManager`. SW active.
10. **P10 Console hygiene** — 0 console.error, 0 Runtime.exceptionThrown.

**Note on level-card count:** Day 94 added L44+L45 → 45 cards. L46-L50 add 5 → expected **50 cards** at cold start (no progress required for bonus chapters? — need to verify). If bonus chapters are tier-locked, the cold count stays 45 and the new cards reveal only after campaign completion. Probe both shapes.

## Risk callout

- `_validateLabConstraints()` is called AFTER `_consumeLabAttempt()` debits the attempt counter. CDP probes that test rejection must either (a) call `resetLab()` between probes, or (b) use a fresh `startLevel()` between probes. The harness resets attempts via `gs._lab.attempts=0; gs._lab.exhausted=false` between failed-submit probes.
- `availableGates` is a **palette** constraint enforced by the toolbox, not the validator. The validator does NOT reject a circuit just because a non-NAND gate is present — the toolbox prevents placing non-NAND gates in the first place. The CDP harness can bypass this by directly pushing gates via `gs.gates.push(new window.Gate('AND', ...))` — but the resulting circuit will still NOT trigger a "palette violation" clause from the validator. The triple-composite test uses hardCap + maxFanOut violations only.

## Acceptance

- All P1-P10 CDP probes pass.
- 0 console.error, 0 Runtime.exceptionThrown.
- Empty Open Bugs queue preserved (target streak: **34 days**).
- Single atomic commit (Day 92/107/108 BUILD-Day precedent).
- LOC delta: ~+200 (5 levels × ~30 LOC each + ~15 LOC validator extension + ~10 LOC ui chip + 1 LOC HTML + 1 chapter entry).

## Day 110 next

Per `roadmaps/cycle-5-build.md`: **Gameplay HUD personal-best badge** — `#level-best-badge` shows best gate count / time / star count on revisit; suppressed on first entry; live-updates on improvement.
