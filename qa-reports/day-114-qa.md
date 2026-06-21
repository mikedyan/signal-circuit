# Day 114 QA — Cycle 5 HARDEN Week Day 2: Level Playthrough

**Date:** 2026-06-21
**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged — HARDEN week ships no features).
**Result:** **32 / 32** assertions across 7 phases. First run was **28/32** with 4 harness-shape self-bugs (wrong selectors/API surface), all fixed harness-side with **zero app changes**; second run **32/32**.
**Console:** 0 `console.error`, 0 `Runtime.exceptionThrown`.

## Context: LO-2 resolved — test harness recovered

Day 113 logged **LO-2**: the Full Interaction Audit harness failed on the orchestrator because it tried to auto-launch a browser via `@puppeteer/browsers`, which isn't installed here. Day 113 took a no-codebase-change recovery day.

**Root cause:** the harness never needed puppeteer — it speaks raw CDP over `ws@8.x` (present in `/Users/openclaw/src/openclaw/node_modules`). The only missing piece was *launching* a Chromium binary on the CDP port. The OpenClaw browser tool ships one at `/Users/openclaw/Applications/Chromium.app/Contents/MacOS/Chromium` (Chrome/146), and a Playwright cache exists as a fallback.

**Fix:** new `tools/cdp-launch.sh` boots the static server (8901) + headless Chromium with `--remote-debugging-port=9301 --remote-allow-origins=*`, resolving the binary from a candidate list. Harness usage is now:

```
tools/cdp-launch.sh start
NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-114-qa.cdp.js
tools/cdp-launch.sh stop
```

This unblocks all future HARDEN/PRUNE browser QA. **LO-2 retired.**

## Coverage

**Phase 1 — Build identity:** 11 `?v=1781395200` refs, `sw.js` CACHE_NAME `signal-circuit-v73`.

**Phase 2 — Cold-start invariants:** 50 level cards (Day 109), 2 non-level nav buttons (Day 78), `window.Gate` function + `GateTypes` 8 keys (Day 92), `window.Wire`/`WireManager` bound (Day 107), `LEVELS` global = 50 + `getLevel` function, all 7 Day 79 dead identifiers `undefined`, `#weekly-puzzle-btn` DOM absent.

**Phase 3 — Level structural integrity + star monotonicity** (13 sampled levels: 1/5/10/15/20/25/30/35/40 campaign + 45/46/48/50 lab): every level has truth-table rows == 2^numInputs, every row's `inputs`/`outputs` arity matches the level's IO count, ≥1 hint (all sampled = 3), and `game.calculateStars(optimalGates)` === 3 while `calculateStars(goodGates+3)` < 3. Multi-output levels verified (L25 4-in/3-out, L30 3-in/4-out, L50 2-in/2-out). Lab-bench flag correct on L40/45/46/48/50.

**Phase 4 — Hands-on L1 solve:** placed 1 AND gate + 3 wires via `Gate`/`Wire` constructors, `runQuickTest()` → `progress.levels[1].stars === 3`.

**Phase 5 — Mode entries:** Daily pre-screen, Random config screen, Blitz gameplay (`blitzMode=true`) + HUD cleanup on back (Day 61), Speedrun gameplay (`speedrunMode=true`) + HUD cleanup on back (Day 74), Sandbox config screen.

**Phase 6 — Community levels:** 4 of 4 sampled `COMMUNITY_LEVELS` map cleanly through `buildCustomLevel` to a level with `2^inputCount` truth-table rows.

**Phase 7 — Console hygiene:** 0 errors across the full sweep.

## First-run harness self-bugs (no app changes)

1. `new Wire(node, gate, pin)` — actual signature is `new Wire(fromGateId, fromPinIndex, toGateId, toPinIndex, id)` (IDs, not objects). Fixed to the Day 107 pattern.
2. Speedrun button is `#speedrun-btn` (not `#speedrun-mode-btn`); Sandbox is `#sandbox-btn` (not `#sandbox-mode-btn`). Blitz is `#blitz-mode-btn`.
3. `buildCustomLevel` is a global function, not a `game` method; `COMMUNITY_LEVELS` entries use `inputCount/outputCount/truthTable/gates/name` and must be mapped to `{i,o,t,g,n}` first (the ui.js loader does this at line ~5060).

## Bug ledger

- **Open Bugs queue:** 0 → 0.
- **Latent observations:** 1 (LO-2) → **0** (LO-2 retired).
- **New bugs found today:** 0. **New bugs introduced:** 0.

Harness: `qa-reports/day-114-qa.cdp.js` (32 assertions / 7 phases).
Launcher: `tools/cdp-launch.sh`.

**Day 115 next:** Cycle 5 HARDEN Week Day 3 — Edge Cases & Stress (harness now reusable via `tools/cdp-launch.sh`).
