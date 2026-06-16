# Day 109 QA — Cycle 5 BUILD Week, Day 3: Lab Bench III mini-chapter (L46-L50) with fan-out budget

**Date:** 2026-06-16
**Build under test:** local `?v=1781222400` · `sw.js CACHE_NAME = 'signal-circuit-v71'`
**Harness:** `qa-reports/day-109-qa.cdp.js` (42 assertions across 10 phases)
**Result:** **42 / 42 assertions passed on first run.** 0 console.error, 0 Runtime.exceptionThrown.
**Spec:** `specs/day-109-lab-bench-iii.md`

## What shipped

1. **5 new lab-bench levels (L46-L50) in Chapter 11.** Each has `isLabBench: true` + `maxFanOut: 2`. Composite mix:
   - **L46 — Triple Echo** (single constraint: fan-out only). 1 input → 3 outputs, all = A. Naive 3-wire route from A → fan-out 3 → REJECT. Solve = 2 NOT gates as buffer chain.
   - **L47 — Distributed AND** (composite: fan-out + hardCap=3). 2 inputs → 3 outputs, all = A AND B. Naive 1-AND solve has AND fan-out 3 → REJECT. Solve = AND + 2-NOT buffer chain.
   - **L48 — NAND-Only AND Under Pressure** (TRIPLE: NAND palette + hardCap=3 + maxFanOut=2). 2 inputs → 1 output A AND B. Solve = 2 NANDs (G1 = NAND(A,B); G2 = NAND(G1,G1) → OUT). G1 fans out to 2 (both pins of G2).
   - **L49 — XOR Tee** (composite: mustIncludeGate=[XOR] + maxFanOut=2 + hardCap=3). 2 inputs → 2 outputs, both = A XOR B. Solve = 1 XOR fanned out to both outputs.
   - **L50 — NAND Tee Junction** (composite: NAND palette + maxFanOut=2 + hardCap=2). 2 inputs → 2 outputs, both = A NAND B. Solve = 1 NAND fanned to both outputs.

2. **`_validateLabConstraints()` extended (js/main.js)** with a third clause for `level.maxFanOut`. Counts wires per `(fromGateId, fromPinIndex)` source (input-node outputs AND gate output pins treated uniformly), takes the max, rejects with byte-exact `"fan-out K exceeds budget of N"`. Day 94's multi-reason accumulator handles the join: the L48 triple-composite rejection reads `"Submission rejected: 4 gates exceeds hard cap of 3; fan-out 3 exceeds budget of 2."` in a single string.

3. **HUD `#lab-constraint-3` chip slot** added to `index.html` after `#lab-constraint-2`. `ui.updateLabHud()` extended to populate the third slot from `level.labConstraint[2]`, with the same show/hide pattern as the first two chips. L46 (single-string) still hides chips 2 + 3; L47/L50 show 2; L48/L49 show all 3. No new CSS — existing `.lab-chip.lab-constraint` + flex-wrap parent handle 3-chip layout.

4. **Chapter 11 metadata** in `js/levels.js` `CHAPTERS` array: `id: 11, title: 'Chapter 11: Lab Bench III', levels: [46-50], isBonus: true`. Color `#A0F8FF` continues the cyan Lab Bench palette family. `realWorld` cites buffer tree synthesis (the real silicon analog).

5. **Cache-bust + SW bump.** 11 `?v=1781136000 → ?v=1781222400` refs in `index.html`; `sw.js CACHE_NAME signal-circuit-v70 → v71`.

## Verification highlights

- **P4.3** L46 with 3 wires from A → byte-exact `"Submission rejected: fan-out 3 exceeds budget of 2."` (single-clause format preserved when only one constraint axis violates).
- **P5.5** L48 with 4 NAND gates + A fanned to 3 of them → byte-exact `"Submission rejected: 4 gates exceeds hard cap of 3; fan-out 3 exceeds budget of 2."` (composite format with `; ` join — Day 94 lesson #1 preserved byte-for-byte).
- **P6.4** L48 renders ALL THREE chips visible (`#lab-constraint` + `#lab-constraint-2` + `#lab-constraint-3`), with texts matching the level's 3-element `labConstraint` array.
- **P7.1-3** L48 optimal 2-NAND solve passes validator AND `runQuickTest()` completes with stars persisted.
- **P8.2** L44 (Day 94's NAND-only Half Adder) with 7 NAND gates still rejects byte-exact `"Submission rejected: 7 gates exceeds hard cap of 6."` — no fan-out clause leaks because L44 has no `maxFanOut`.
- **P9.2** cold-start level card count: **50** (Day 103's 45 + 5 new bonus chapter levels). The +5 is expected and tracked.
- **P9.5-7** Day 92 `window.Gate/GateTypes`, Day 107 `window.Wire/WireManager`, SW v71 — all regression invariants hold.
- **P10** 0 console.error, 0 Runtime.exceptionThrown across the entire suite.

## Pipeline

1. `python3 -m http.server 8901` (kill after harness run).
2. Permissive headless Chromium on port 9301 (`--remote-allow-origins=*` quoted to bypass zsh glob expansion).
3. `node qa-reports/day-109-qa.cdp.js` — raw WebSocket CDP, no Playwright dependency.

## LOC delta

| File | Insertions | Deletions |
|---|---|---|
| `js/levels.js` | +187 | 0 |
| `js/main.js` | +22 | 0 |
| `js/ui.js` | +14 | 0 |
| `index.html` | +12 | -11 (cache-bust + 1 new span) |
| `sw.js` | +1 | -1 |
| **Total source** | **+236** | **-12** |

Atomic commit: 1 (Day 92 / Day 107 / Day 108 BUILD-Day precedent — one logical change covering source + cache-bust + SW + spec + qa + state).

## Bug discipline

- Open Bugs: 0 → 0 (streak: **34 consecutive days** since Day 76).
- Latent observations: 0 → 0.
- New bugs found today: 0. New bugs introduced today: 0.

## Day 110 next

Per `roadmaps/cycle-5-build.md`: **Gameplay HUD personal-best badge** — `#level-best-badge` shows best gate count / time / star count on revisit; suppressed on first entry; live-updates on improvement.
