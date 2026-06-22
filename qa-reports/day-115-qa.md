# Day 115 QA — Cycle 5 HARDEN Week, Day 3: Edge Cases & Stress

**Date:** 2026-06-22
**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, **unchanged** — HARDEN week = ZERO new features).
**Harness:** `qa-reports/day-115-qa.cdp.js` (pure-CDP / `ws@8.x`, LO-2 recovery path via `tools/cdp-launch.sh`).
**Result:** **24 / 24** assertions across 14 phases. **0** console.error. **0** `Runtime.exceptionThrown`.

First run: 23/24 — one harness-shape self-bug (P13 D109 probe read `res.reason` but `_validateLabConstraints()` returns the rejection string in `res.message`). Fixed harness-side, **zero app changes**. Second run: 24/24.

## Edge Cases & Stress coverage (HARDEN Wednesday spec)

| # | Test | Result |
|---|------|--------|
| T1 | Rapid gate placement during simulation (25× push + render while `isAnimating`) | ✅ no throw, 25 gates |
| T2 | Wire drawing while animation plays (10× wire push with `isAnimating=true`) | ✅ no throw, 10 wires |
| T3 | Window resize mid-gameplay (10 device-metric overrides + `resize` event + `renderer.resize()`) | ✅ renders clean, screen intact |
| T4 | Clear localStorage + reload | ✅ 50 cards, silent-default difficulty `standard`, clean key set |
| T5 | Keyboard-only navigation | ✅ 14 focusable elements on gameplay, programmatic focus lands |
| T6 | Colorblind mode toggle + gameplay | ✅ on→off round-trip, `getWireColors()` resolves under `.colorblind-mode` |
| T7 | Light mode vs dark mode | ✅ start→toggle→toggle round-trips, both render |
| T8 | 40+ wires on one level (performance) | ✅ 44 wires / 22 gates, **0.76 ms avg frame** (budget < 16 ms) |
| T9 | Undo/redo stress (20× undo + 20× redo) | ✅ no throw |
| T10 | RUN + Quick Test spam (10× each) | ✅ no throw (idempotent re-entry contract holds) |

## Cycle 5 BUILD regression sweep (Days 107–111)

- **D107/D92 bindings:** `window.Gate` function + 8 `GateTypes`; `window.Wire` + `window.WireManager` classes — PASS.
- **D108 Tournament Worker:** default backend `getMode()==='local'`, `describe()` → `🏠 Local leaderboard` — PASS.
- **D109 Lab Bench III:** L48 metadata `isLabBench` + `maxFanOut:2` + `gateHardCap:3` + `availableGates:['NAND']`; validator rejects 4 placed gates with byte-exact `Submission rejected: 4 gates exceeds hard cap of 3.` — PASS.
- **D110 PB badge:** `#level-best-badge` suppressed (`display:none`) on cold L1 entry — PASS.
- **D111 Stats tournament tab:** `#stats-tab-tournament` + `#stats-tournament-pane` + `ui._switchStatsTab` present — PASS.

## Cold-start invariants

- 50 level cards (Day 109), 2 non-level nav buttons (Day 78), 7 Day 79 dead identifiers `undefined`, `#weekly-puzzle-btn` DOM absent, `LEVELS` global = 50.

## Bug ledger

- **Open Bugs:** 0 → 0 (streak: **40 consecutive days** since Day 76).
- **Latent observations:** 0 → 0.
- **New bugs found today:** 0. **New bugs introduced today:** 0.
- **Source-file changes:** 0 (build pinned at Day 111 `?v=1781395200` / sw v73).

**Day 116 next:** Cycle 5 HARDEN Week Day 4 — Fix Everything (open queue empty → Day 90/100 rest-day precedent likely: confirmation probe unless a fresh observation surfaces).
