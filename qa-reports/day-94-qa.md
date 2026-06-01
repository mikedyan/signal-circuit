# Day 94 QA Report — Lab Bench II Composite Constraints

**Cycle:** 4 BUILD Week — Day 3 (cycleDay 42, factory day 94)
**Build under test:** `?v=1780444800` · `sw.js CACHE_NAME = 'signal-circuit-v63'`
**Harness:** `qa-reports/day-94-qa.cdp.js` (Day 86+ permissive-Chromium + raw-ws CDP pattern)
**Server:** `python3 -m http.server 8901` (localhost)
**Browser:** Chromium 146.0.7663.0 headless, `--remote-debugging-port=9301`, `--remote-allow-origins=*`

## Result

**31 / 31** assertions passed across 7 phases on **first run**. **0** new
user-facing bugs. **0** `console.error`. **0** `Runtime.exceptionThrown`.

Open Bugs queue: 0 at start of day, 0 at end of day. **19-day empty-queue
streak preserved** (unbroken since Day 76).

## Phases

### P1 — Build identity (5 / 5)

- P1.1: 11 `?v=1780444800` cache-bust refs unified across `index.html` HEAD link + `script` tags.
- P1.2: `sw.js` CACHE_NAME = `'signal-circuit-v63'`.
- P1.3: `index.html` declares `<span id="lab-constraint-2">` sibling chip.
- P1.4: `js/levels.js` declares `id: 44` ("NAND-Only Half Adder") and `id: 45` ("XOR-Heavy Multiplexer").
- P1.5: Chapter 10 levels array = `[41, 42, 43, 44, 45]`.

### P2 — Cold-start surface unchanged (4 / 4)

- P2.1: `#level-select-screen` visible after fresh navigation + storage clear.
- P2.2: 2 non-level buttons visible (`#how-to-play-btn` + `#open-settings-btn`).
- P2.3: 45 `.level-btn` cards rendered (was 43 — the +2 from L44/L45).
- P2.4: Onboarding variant `silent-standard` and localStorage `signal-circuit-difficulty-mode === 'standard'`.

### P3 — Day 84 single-constraint regression (5 / 5)

Confirms the validator rewrite preserves Day 84 message format byte-for-byte.

- P3.1: **L41 (NAND-only, single string constraint)** — `#lab-constraint` visible with text "🧱 NAND only — universal gate practice"; `#lab-constraint-2` hidden. `availableGates === ['NAND']`.
- P3.2: **L42 single hardCap violation** — placing 5 AND gates and calling `_validateLabConstraints()` returns `{ok: false, message: 'Submission rejected: 5 gates exceeds hard cap of 4.'}`. **Byte-equivalent to Day 84.**
- P3.3: **L43 single mustIncludeGate violation** — placing 2 NANDs (no XOR) returns `{ok: false, message: 'Submission rejected: blueprint must include an XOR gate.'}`. **Byte-equivalent to Day 84.**
- P3.4: L42 with exactly 4 AND gates passes validator.
- P3.5: L43 with 2 XOR gates passes validator.

### P4 — L44 NAND-Only Half Adder composite (6 / 6)

- P4.1: `level.labConstraint` is array of length 2 — `['🧱 NAND only', '🎯 Hard cap: 6 gates']`.
- P4.2: `gateHardCap === 6`.
- P4.3: `availableGates === ['NAND']`.
- P4.4: Both chips render — `#lab-constraint` text = "🧱 NAND only", `#lab-constraint-2` text = "🎯 Hard cap: 6 gates", both visible.
- P4.5: 5 NANDs (optimal-count placeholder) passes composite validator.
- P4.6: 7 NANDs → `{ok: false, message: 'Submission rejected: 7 gates exceeds hard cap of 6.'}` (single reason since NAND palette restriction is enforced by construction).

### P5 — L45 XOR-Heavy Multiplexer composite (6 / 6)

- P5.1: `level.labConstraint` is array of length 2 — `['✳️ Must include an XOR gate', '🎯 Hard cap: 5 gates']`.
- P5.2: `gateHardCap === 5`.
- P5.3: `mustIncludeGate === ['XOR']`.
- P5.4: Both chips render — `#lab-constraint` = "✳️ Must include an XOR gate", `#lab-constraint-2` = "🎯 Hard cap: 5 gates".
- P5.5: **Composite double-violation** — 6 NANDs (over cap, no XOR) returns `{ok: false, message: 'Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.'}`. **Both reasons present, joined by `;`.**
- P5.6: 3-gate XOR/AND/XOR build passes composite validator (≤5 gates, contains XOR).

### P6 — Regression (3 / 3)

- P6.1: `seedProgress(45, {stars:3})` → 45 visible `.level-overflow-btn` (was 40 at Day 78; the +5 from L41–L45 all sprout overflow menus once 3-starred).
- P6.2: `tournamentBackend.getMode() === 'local'`, `isLive() === false` (Day 83/93 shape intact).
- P6.3: L1 1-gate AND solve via `addGate('AND') + 3 wires + runQuickTest()` persists `progress.levels['1'].stars === 3`.

### P7 — Console hygiene (2 / 2)

- P7.1: 0 `Runtime.exceptionThrown` across all phases.
- P7.2: 0 `console.error` across all phases.

## Verification surface

- Test target: `http://localhost:8901/` served by `python3 -m http.server`.
- Browser: headless Chromium 146 connected via raw WebSocket on
  `ws://127.0.0.1:9301/devtools/page/<id>`.
- Each level transition uses `gs.startLevel(N)` to land on the lab level,
  followed by `window.ui.updateLabHud()` to force the chip strip render
  (the harness sets `gs.gates = []` to avoid carryover between L42/L43/L44/L45).
- Validator probes use direct `gs._validateLabConstraints()` calls, which
  is the same code path `runSimulation()` and `runQuickTest()` invoke after
  `_consumeLabAttempt()`. Both production call sites in `js/main.js`
  (line 3662 and line 3974) route through this helper, so message format
  is consistent between RUN and Quick Test paths.

## Open Bugs

**Zero** at start of day, **zero** at end of day. 19-day empty-queue streak
preserved. LO-1 latent observation remains deferred to Cycle 4 PRUNE Week
(`roadmaps/cycle-4-build.md` § Week Guardrails explicitly carves it out of
BUILD week).
