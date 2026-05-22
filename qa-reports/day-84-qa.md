# Day 84 QA Report — Lab Bench II Seed Pack

**Date:** 2026-05-22  
**Feature:** Lab Bench II Seed Pack (L41/L42/L43 + constraint chip).  
**Build:** `?v=1779984000`, `sw.js CACHE_NAME='signal-circuit-v58'`.  
**Harness:** Headless Chromium on `localhost:9301`, raw CDP WebSocket from
`/tmp/sc-day84-qa.py` (OpenClaw browser tool blocks `localhost:`).

## Result

**49/49 assertions passed. 0 console errors.**

## Coverage

### Static data (13 checks)
- `LEVELS.length === 43`.
- `getLevelCount() === 43`.
- Chapter id 10 exists, title contains "Lab Bench II", levels `[41,42,43]`.
- Each of L41/L42/L43 has `isLabBench:true` and a non-empty `labConstraint` string.
- L41 `availableGates === ['NAND']`.
- L42 `gateHardCap === 4`.
- L43 `mustIncludeGate === ['XOR']`.

### Setup
- `seedProgress(43, {stars:3}).seeded === 43` from a clean localStorage.

### L41 — NAND-only (8 checks)
- `_isLabBench()` true; `#lab-hud` `display:flex`.
- `#lab-constraint` visible; text `🧱 NAND only — universal gate practice`.
- RUN button reads `📐 Submit Blueprint`.
- Toolbox renders only NAND.
- Empty submit costs an attempt (`_lab.attempts === 1`).
- After building NAND→NAND-as-NOT (2 gates, 5 wires), `simulation.runAll()`
  reports all 4 truth rows pass.

### L42 — Hard cap 4 (8 checks)
- Constraint chip text `🎯 Hard cap: 4 gates`.
- Staging 5 gates + Quick Test → attempt consumed (1/3); result text contains
  `exceeds hard cap`.
- `#lab-budget` gains `.over-cap` class at 5 gates.
- Reset Lab restores `_lab.attempts === 0`.
- Building 4-gate MUX (NOT S, AND·A, AND·B, OR) → `runAll()` all 8 truth rows
  pass; `_validateLabConstraints().ok === true`.
- `.over-cap` class clears after re-render at 4 gates.

### L43 — Must-include XOR (6 checks)
- Constraint chip text `✳️ Must include an XOR gate`.
- Staging AND+OR (no XOR) + Quick Test → attempt consumed (1/3); result text
  contains `XOR`.
- Reset Lab restores tries.
- Building 2-XOR chain → `runAll()` all 8 truth rows pass;
  `_validateLabConstraints().ok === true`.

### Regression (6 checks)
- L36 legacy lab level: `#lab-constraint` `display:none`; `#lab-hud` still
  `flex`; RUN still `📐 Submit Blueprint`.
- L1 normal level: `#lab-hud` hidden; RUN `▶ RUN`; constraint chip hidden.

### Build identity + chrome (3 checks)
- `main.js` script src includes `1779984000`.
- Cold-start non-level button count (after `localStorage.clear()`,
  `progress.levels={}`, fresh render): **2** (matches Day 78/80/81 baseline).

### Console
- 0 JS errors across all 49 assertions.

## Method notes

- Built a `window.__addWire(fromId, fromPin, toId, toPin)` helper at QA start
  because `Wire` is ID-based (`fromGateId, fromPinIndex, toGateId, toPinIndex`),
  not pin-object-based. Future QA harnesses should reuse this helper rather
  than re-discover the wiring shape.
- Initial visibility check via `offsetParent !== null` returned false for the
  constraint chip in headless mode even though it was correctly laid out;
  switched to `style.display === ''` (matches the toggle path) which is the
  honest check for inline-style controlled visibility.
- Cleared `localStorage` + reloaded between the static-data pass and the
  per-level pass to avoid stale `seedProgress` returns from prior runs.
