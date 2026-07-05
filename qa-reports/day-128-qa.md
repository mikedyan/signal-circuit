# Day 128 QA — Cycle 6 HARDEN Week Day 1: Full Interaction Audit

**Date:** 2026-07-05
**Build under test:** `?v=1783036800` · `sw.js CACHE_NAME = 'signal-circuit-v81'` (Day 127 — Stats per-chapter completion heatmap, last BUILD-day of Cycle 6, **unchanged today**).
**Harness:** `qa-reports/day-128-qa.cdp.js` (cloned from Cycle 5's `day-112-qa.cdp.js`, updated for Cycle 6 BUILD surfaces).
**Result:** **85 / 85 assertions across 27 phases on the second run** (82/85 first run — 3 harness-shape self-bugs, all fixed harness-side, **0 app changes**). **0** console.error. **0** `Runtime.exceptionThrown`. **0 new user-facing bugs.**

## Coverage

Full Interaction Audit per HARDEN Monday spec — every screen exercised on the deployed-equivalent local build:

- **Build identity** (P1): 11× `?v=1783036800`, sw v81, all three ES-module script tags (gates.js/wires.js/simulation.js).
- **Cold-start surface** (P2): 2 nav buttons (Day 78 invariant), 50 level cards, 0 overflow, Profile hub button correctly hidden cold, `silent-standard` variant, `standard` difficulty.
- **Settings** (P3): modal opens, accessibility toggles (colorblind/text-size/simplified/accessible-wiring/light-mode) round-trip without throw, difficulty chooser opens.
- **Day 125 Tournament Worker settings** (P4): connection section + URL/name inputs present; Connect persists worker URL + flips backend off pure-local; opt-in display name blank-by-default and persists when set; Go Local reverts to `local` + clears URL; Anonymous clears name.
- **Day 126 Onboarding A/B cohort** (P5): cohort ∈ {local, live}; stable persisted install id; session stats + daysActive readable; deterministic across reads; debug=1 reveals Developer section + readout card mentioning cohort.
- **How to Play** (P6).
- **Day 123 simulation.js ESM** (P7): `window.Simulation` is a function; `game.simulation instanceof window.Simulation` (canonical binding); Day 42 `traceFailurePath` prototype augmentation intact.
- **Day 92/107 ESM bindings** (P8): gates.js (Gate/GateTypes≥8/IONode/roundRect) + wires.js (Wire/WireManager/WIRE_COLORS_DEFAULT/getWireColors).
- **L1 solve + Shareable Snapshot Card** (P9): AND-gate solve via Quick Test exercises the sim engine; share modal opens; canvas 1200×630.
- **Tournament backend adapter** (P10): mode `local`, `isLive() === false`, submitScore + getLeaderboard present.
- **Lab Bench** (P11): L41 NAND-only chip, L44 composite (NAND + hard cap 6), L48 Lab Bench III triple-composite (maxFanOut=2, hardCap=3); validator rejects over-hard-cap submission.
- **Daily / Random / Blitz / Speedrun** (P12–15): all enter gameplay; Blitz + Speedrun HUD cleanup via back-btn (Day 61/74).
- **Sandbox deep-play** (P16, *new coverage-rotation probe*): config screen opens; 3 gates added; `simulation.evaluateOnce()` runs over the freeform circuit without throw.
- **Creator** (P17), **Tournament screen** (P18: 2 tabs — This Week + Archive, Day 119 My Best removal held), **Encyclopedia** (P19).
- **Day 124 Profile Hub** (P20): button visible at seed=18; hub opens with 5 tabs; all 5 panes render non-empty on switch; cosmetic card click live-updates active wire color (re-parenting intact); close hides modal + clears `#profile-view` (Day 54 discipline).
- **Profile Hub tier gating** (P20b): at g12 only 2 tabs (Achievements/Customize) available, strand-guard keeps active tab non-gated.
- **Stats modal 4 tabs** (P21): overview/cards/tournament/progress all present; Progress tab visible at seed=18.
- **Day 127 Progress heatmap** (P22): grid hides / heatmap pane shows; 11 chapter cells render; summary strip `"18 / 50 levels · ★ 54 / 150 …"`; full-seed (50@3★) lights all 11 chapter cells complete.
- **Cosmetic × colorblind live-paint** (P23, *new coverage-rotation probe*): colorblind toggle + cosmetic wire render pass without throw.
- **Gameplay surface** (P24): core buttons present, 4 truth-table rows, hint + clear no-throw.
- **Staircase end-game** (P25): 14 nav buttons (**Day 124 merge: 18→14 held**) + 50 overflow.
- **Day 79 dead-id regression** (P26): 7 identifiers undefined + `#weekly-puzzle-btn` absent.
- **Console hygiene** (P27): 0 errors.

## First-run harness self-bugs (all fixed harness-side, 0 app changes)

1. **Settings toggles used stale day-112 ids** (`#colorblind-btn` etc.). Real ids are `#colorblind-toggle-btn`, `#fontsize-toggle-btn`, `#simplified-visual-btn`, `#light-mode-btn`. The app buttons exist and work.
2. **Sandbox probe called `simulation.evaluateOnce()` with no argument.** `evaluateOnce(inputValues)` is an internal method that reads `inputValues[i]` per input node — it must be passed an array sized to `inputNodes.length`. Fixed to pass `new Array(inputNodes.length).fill(0)`.
3. **Heatmap summary selector wrong.** The summary strip class is `.progress-heatmap-meta`, not the guessed `.phm-summary`. The strip renders correctly (`"18 / 50 levels · ★ 54 / 150"`).

All three are the recurring HARDEN-day class: verify the *actual* DOM id / method signature / class name before asserting, not the shape a prior harness assumed.

## Coverage-rotation debt — addressed

Days 89/117 flagged that HARDEN weeks kept re-testing the same 12 surfaces. Day 128 adds **two novel probes**: Sandbox deep-play (P16) and cosmetic × colorblind live-paint (P23). Both pass. Remaining untested surfaces for future rotation: community-loader edge cases, audio-engine state across mode switches, SW stale-cache fallback.

## Bugs

**Open Bugs queue:** 0 → 0 (**53-day empty-queue streak** since Day 76).
**Latent observations:** 0 → 0.
**New bugs:** 0.

**Day 129 next:** Cycle 6 HARDEN Week Day 2 — Level Playthrough.
