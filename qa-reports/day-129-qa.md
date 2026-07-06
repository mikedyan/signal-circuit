# Day 129 QA — Cycle 6 HARDEN Week Day 2: Level Playthrough

**Date:** 2026-07-06 (cycleDay 80, Day 129)
**Week type:** HARDEN · **Week day:** 2 (Level Playthrough)
**Build under test:** Day 127 `?v=1783036800` / sw `signal-circuit-v81` — **unchanged** (HARDEN policy: zero new features, no code change on a playthrough day)
**Harness:** `qa-reports/day-129-qa.cdp.js` (cloned from Cycle 5 day-114 Level Playthrough)
**Result:** **40/40 assertions across 8 phases on the FIRST run** · 0 console.error · 0 Runtime.exceptionThrown · 0 new user-facing bugs · 0 harness self-bugs

## How to reproduce
```
tools/cdp-launch.sh start
NODE_PATH=/Users/openclaw/src/openclaw/node_modules node qa-reports/day-129-qa.cdp.js
tools/cdp-launch.sh stop
```

## Coverage

### Phase 1 — Build identity (pinned)
- 11× `?v=1783036800` cache-bust refs in index.html
- sw.js `CACHE_NAME = 'signal-circuit-v81'`

### Phase 2 — Cold-start invariants
- 50 level cards (Day 109 invariant)
- 2 non-level nav buttons (Day 78 invariant)
- Day 92 `window.Gate` fn + `GateTypes` 8 keys
- Day 107 `window.Wire` + `window.WireManager` bound
- **Day 123 `window.Simulation` bound (ESM)** — added to the playthrough floor this cycle
- LEVELS global = 50 + `getLevel` + `getChapters` functions present
- Day 79: 7 dead identifiers undefined + `#weekly-puzzle-btn` DOM absent

### Phase 3 — Level structural integrity + star monotonicity (13 levels sampled)
Sampled campaign 1/5/10/15/20/25/30/35/40 + Lab Bench 45/46/48/50. For each:
truth-table row count == 2^numInputs, per-row input/output arity matches level IO,
≥1 hint (all 3), `calculateStars(optimal)==3` and `calculateStars(goodGates+3)<3`.
All 13 pass. Notable arities verified: L25 (4-in/3-out, 16 rows), L30 (3-in/4-out, 8 rows),
L46 Lab Bench (1-in/3-out, 2 rows).

### Phase 4 — Hands-on L1 solve
Placed AND gate + 3 wires (in0→A, in1→B, out) → `runQuickTest()` → **3 stars persisted**
to `progress.levels[1]`.

### Phase 5 — Challenge/sandbox mode entries
- Daily Challenge → pre-screen opens
- Random Challenge → config screen opens
- Blitz Mode → gameplay + `blitzMode=true`; **HUD cleaned to `display:none` on back (Day 61)**
- Speedrun Mode → gameplay + `speedrunMode=true`; **HUD cleaned on back (Day 74)**
- Sandbox Mode → config screen opens

### Phase 6 — Community levels
4/4 sampled `COMMUNITY_LEVELS` (of 20) load via `buildCustomLevel` with correct
truth-table row counts.

### Phase 7 — Day 127 Progress heatmap reflection (NEW this playthrough)
- **7a** empty profile → heatmap empty-state (`.progress-heatmap-empty`, no `.progress-heatmap-meta`), `_progressCompletedTotal()===0`
- **7b** seed 10@3★ → `_progressCompletedTotal()===10`; meta reads **"10 / 50 levels · ★ 30 / 150"**; 11 chapter cells rendered, ≥1 lit (`.phm-done`)
- **7c** full-seed 50@3★ → `_progressCompletedTotal()===50`; meta reads **"50 / 50 levels · ★ 150 / 150"**; all 11 cells complete (`done===cells`)
- Profile reset to cold after phase

### Phase 8 — Console hygiene
0 console.error / 0 uncaught exceptions across the entire suite.

## Verdict
Clean playthrough. Every sampled level is structurally sound with monotonic star rating;
the core loop (place gate → wire → Quick Test → stars persist) works hands-on; all 5
challenge/sandbox entries reachable with Blitz/Speedrun HUD cleanup intact; community
levels load; the Day 127 Progress heatmap correctly reflects completed levels across
empty/partial/full states. No source-file changes — build pinned at Day 127.

**Open Bugs:** 0 → 0 (54-day empty-queue streak since Day 76). **Latent observations:** 0 → 0.
**Day 130 next:** Cycle 6 HARDEN Week Day 3 — Edge Cases & Stress.
