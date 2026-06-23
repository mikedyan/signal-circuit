# Day 116 QA — Cycle 5 HARDEN Week, Day 4: Fix Everything

**Date:** 2026-06-23  
**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged through HARDEN week).  
**Mode:** Fix Day — nothing to fix.  
**Harness:** `qa-reports/day-116-qa.cdp.js` (pure-CDP / `ws@8.x`).  
**Result:** **24 / 24** assertions across 14 phases. **0** console.error. **0** `Runtime.exceptionThrown`.

## Decision: Empty-Queue Confirmation Probe

The Open Bugs queue was empty at start of day and stayed empty. Per the Day 90 / Day 100 HARDEN precedent, Day 116 shipped no app source changes and instead ran a tight confirmation probe over the pinned Day 111 artifact.

## Confirmation Coverage

| # | Test | Result |
|---|------|--------|
| P1 | Build identity | 11 cache-bust refs at `?v=1781395200`; SW v73 |
| P2 | Cold-start invariants | 50 cards, 2 non-level buttons, Day 79 dead IDs absent |
| T1 | Rapid gate placement during simulation | no throw |
| T2 | Wire push while animation flag is active | no throw |
| T3 | 10x resize mid-gameplay | renders clean |
| T4 | Clear localStorage + reload | 50 cards, difficulty `standard` |
| T5 | Keyboard-only navigation | 14 focusable elements, focus lands |
| T6 | Colorblind mode toggle | on/off round-trip, colors resolve |
| T7 | Light/dark toggle | round-trip, both render |
| T8 | 40+ wires performance | 44 wires / 22 gates, 0.76 ms avg frame |
| T9 | Undo/redo stress | 20x undo + 20x redo, no throw |
| T10 | RUN + Quick Test spam | 10x each, no throw |
| P13 | Cycle 5 BUILD regression | D108-D111 all PASS |
| P14 | Console hygiene | 0 console.error / 0 uncaught exceptions |

## Cycle 5 BUILD Regression Sweep

- D107/D92 module bindings: `window.Gate`, 8 `GateTypes`, `window.Wire`, `window.WireManager` all live.
- D108 tournament backend: default mode `local`, label `Local leaderboard`.
- D109 Lab Bench III: L48 metadata has `maxFanOut:2`, `gateHardCap:3`, NAND palette; validator rejects 4 gates with byte-exact `Submission rejected: 4 gates exceeds hard cap of 3.`
- D110 personal-best badge: `#level-best-badge` remains suppressed on cold L1 entry.
- D111 Stats tournament tab: tab, pane, and `_switchStatsTab` all present.

## Bug Ledger

- **Open Bugs:** 0 -> 0 (streak: **41 consecutive days** since Day 76).
- **Latent observations:** 0 -> 0.
- **New bugs found today:** 0.
- **New bugs introduced today:** 0.
- **Source-file changes:** 0.

## Day 117 Plan

Cycle 5 HARDEN Week Day 5 — Regression Pass on the deployed GitHub Pages build. Verify the core loop, all major modes, build identity, and console hygiene; then write the HARDEN week summary.
