# Day 99 QA — Cycle 4 HARDEN Week, Day 3 (Edge Cases & Stress)

**Date:** 2026-06-06
**Cycle:** 4 (90-Day cycle started April 18, 2026)
**Week:** HARDEN (Cycle 4 / week 2)
**Day in week:** 3 (Edge Cases & Stress)
**cycleDay:** 47
**Day number:** 99

**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, unchanged through Days 97/98/99 — no source files modified during HARDEN week).

**Harness:** `qa-reports/day-99-qa.cdp.js`
**Result:** **77 / 77 assertions passed** across 30 phases. **0 console.error**. **0 Runtime.exceptionThrown**. **0 new user-facing bugs**.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **24 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails).

---

## Coverage

The Day 99 harness rebuilds Day 89's 25-test stress sweep template against the current build identity (`?v=1780617600`, `sw v65`, 45 level cards), then layers in **5 new Cycle 4 BUILD-week feature stress blocks (T26–T30)** corresponding to the 5 BUILD-week payoffs from Days 92–96:

### Base stress template (T1–T25 — Day 89 template)

| Phase | Test | Result |
|---|---|---|
| T1 | Rapid gate placement during simulation (14× addGate mid-animation) | ✅ no-throw |
| T2 | Wire drawing during animation (startWire mid-runSimulation) | ✅ no-throw |
| T3 | 10× rapid window resize event flood | ✅ no-throw |
| T4 | Cold-start sanity (clear localStorage + reload): screen, 2 buttons, **45 cards**, standard difficulty | ✅ 4/4 |
| T5 | Keyboard tab navigation on gameplay screen | ✅ 15 focusables |
| T6 | Colorblind + light/dark mode class toggle round-trip | ✅ 4/4 |
| T7 | Performance: 10× canvas render (avg <5ms) | ✅ **0.180ms/frame** |
| T8 | RUN spam (15× runSimulation) | ✅ no-throw |
| T9 | Quick Test spam (15× runQuickTest) | ✅ no-throw |
| T10 | Undo/redo storm (20×undo + 20×redo via undoManager) | ✅ no-throw |
| T11 | Mode-switch storm (10 steps: level-select ↔ daily/random/sandbox/tournament/infinite) | ✅ returns to level-select |
| T12 | blur/focus + visibilitychange cycle | ✅ no-throw |
| T13 | Lab Bench L36 attempt exhaustion (3 consumes → exhausted; resetLab → 0 attempts + firstTryLocked) | ✅ 2/2 |
| T14 | Tournament screen open: 3 tabs + adapter `local` + describe label | ✅ 4/4 |
| T15 | Mythic celebration overlay lazy-mounts via `ui.showMythicCelebration` | ✅ |
| T16 | localStorage 50×50KB capacity probe | ✅ |
| T17 | Day 84 L41 NAND-only palette enforcement | ✅ 2/2 |
| T18 | Day 84 L42 gateHardCap=4 enforcement (over-cap rejection + 4-gate accept) | ✅ 4/4 |
| T19 | Day 84 L43 mustIncludeGate=['XOR'] enforcement (no-XOR reject + with-XOR accept) | ✅ 4/4 |
| T20 | Day 85 onboarding default variant = silent-standard + standard difficulty | ✅ 3/3 |
| T21 | Day 85 URL override `?onboarding=warm-toast` resolves and persists | ✅ 2/2 |
| T22 | Day 85 URL override `?onboarding=explicit-chooser` resolves and persists | ✅ 2/2 |
| T23 | Day 86 module-health: dead identifiers undefined, WIRE_COLORS not redefined, `#weekly-puzzle-btn` absent | ✅ 4/4 |
| T24 | Day 78 staircase regression: cold=2, seed18=18 nav, seed45=18 nav + 45 overflow | ✅ 3/3 |
| T25 | Build identity unchanged: 11× cache-bust at `?v=1780617600` + `sw v65` | ✅ 2/2 |

### Cycle 4 BUILD-week feature stress (T26–T30, new today)

#### T26 — D92 ES module exports under stress
The Day 92 ES-module split exposed `Gate`, `GateTypes`, `IONode`, `roundRect` on `window` after module-side rebind. The stress probe:
1. Confirms all four are functions on `window`.
2. Confirms `window.GateTypes` has exactly the 8 expected keys: `AND, MYSTERY, MYSTERY3, NAND, NOR, NOT, OR, XOR`.
3. **Instantiates 50 Gate + 50 IONode objects** in a tight loop — verifies the rebound exports are not just typeof-function but actually constructible, with correct `type` field on instances.

All 3 assertions pass — `100× Gate+IONode instantiation no-throw`, sample types `AND` / `input`.

#### T27 — D93 Tournament adapter toggle stress
The Day 93 RemoteTournamentAdapter + LocalTournamentAdapter + selectTournamentBackend factory expose a 3-mode detection seam (`window override → localStorage → default`). The stress probe:
1. Toggles `localStorage('signal-circuit-tournament-backend')` between `local` and `remote` **5 times**.
2. After each toggle, calls `selectTournamentBackend()` and reads `getMode()` + `describe()`.
3. Confirms zero throws + all describe labels non-empty + mode resolution correct (`local→local`, `remote→cloud-ready` — the latter is the Day 83 spec semantic: remote selection with no Worker URL wired = `cloud-ready` state, NOT a regression).

All 4 assertions pass after harness correction. **First-run false alarm** on T27.4: the harness initially asserted `remote→remote` mode mapping, but Day 83's spec is `remote→cloud-ready` (it's a semantic intent-vs-capability split — see Day 83 lesson). Fixed in-harness with no app change.

#### T28 — D94 Composite Lab Bench rapid validator stress
The Day 94 composite Lab Bench levels L44 + L45 expose **two simultaneous constraints** with side-by-side HUD chips and a composite (`; `-joined) rejection message. The stress probe:
1. Opens L44 (NAND palette + cap=6): confirms both chips render distinct copy.
2. **100× rapid `_validateLabConstraints()` calls** cycling gate counts 1–10 — no-throw.
3. Confirms L44 validator rejects 7 NANDs with byte-exact `Submission rejected: 7 gates exceeds hard cap of 6.`
4. Opens L45 (XOR mandate + cap=5): confirms composite rejection of 6-AND input fires both clauses in one string: `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.`
5. Confirms L45 accepts `XOR/AND/AND` shape (under cap + has XOR).

All 9 assertions pass. The composite validator's `; `-joined message format is the **only place** in the codebase where two violations surface in one submission — this is L45's unique property (L44's NAND-only is toolbox-level, not validator-level; L45 is XOR-mandate (validator) + cap (validator)). Day 99 is the first day to exercise that composite message at scale (100 rapid calls).

#### T29 — D95 Onboarding readout debug-flag toggle storm
The Day 95 onboarding readout UI lives in `#settings-developer-section` and is gated by `localStorage('signal-circuit-debug') === '1'`. The stress probe:
1. Toggles the debug flag **5 times** (alternating present/absent).
2. After each toggle, opens Settings, reads `getComputedStyle(#settings-developer-section).display`, closes Settings.
3. Confirms section visible exactly when flag=`'1'`, hidden when flag absent.

All 3 assertions pass. Day 95's "re-evaluate visibility on every settings-open" pattern (vs. timer/observer) holds under the 5× toggle storm.

#### T30 — D96 Snapshot card library flood + retrieval
The Day 96 snapshot card library caps at 20 entries with FIFO eviction. The stress probe:
1. Resets the library.
2. **Floods with 25 fake snapshot cards** (placeholder 1×1 PNG data URLs to avoid eating localStorage).
3. Confirms library length capped at 20 (FIFO eviction kicked in after entry 20).
4. Confirms Stats tab scaffolding (`#stats-tabs`, `#stats-cards-pane`) + library API surface (`getCardLibrary`, `addSnapshotCard`, `resetCardLibrary`) all present.

All 5 assertions pass. The 5MB localStorage budget never approaches saturation during the stress test (placeholder PNGs are <100 bytes each).

---

## Final tally

- **77 / 77 assertions passed** across 30 phases.
- **0 console.error / Runtime.exceptionThrown** across the full sweep.
- **0 new user-facing bugs**.
- **Open Bugs queue: 0 → 0** (streak now **24 consecutive days** since Day 76).
- **Latent observations: 1** (LO-1, unchanged, deferred to Cycle 4 PRUNE Week).
- **Single first-run harness false alarm** (T27.4: mode-mapping assertion was naive vs Day 83 spec); fixed in-harness with no app change.

## Performance snapshot

- 10× canvas render: **0.180ms / frame avg** (1.80ms total) with empty circuit on gameplay screen.
- 100× rapid `_validateLabConstraints()` calls on L44: no-throw at all 100 iterations.
- 50× 50KB localStorage writes: all 50 succeed (well under 5MB ceiling).
- 5× backend toggle + selectTournamentBackend() factory invocations: no-throw, all 5 describe labels populated.

## Build identity confirmation

```
?v=1780617600 — 11 cache-bust refs in index.html (unchanged from Day 96)
sw.js CACHE_NAME = 'signal-circuit-v65' (unchanged from Day 96)
```

No source-file changes during Days 97/98/99 — cache-bust + SW pinned at the Day 96 build through all of HARDEN Week. This matches the Day 87/88/89/90 precedent from Cycle 3 (HARDEN-week days do not bump cache-bust unless a real fix lands).

## Verification environment

- Local server: `python3 -m http.server 8901` (root = `factory/projects/signal-circuit`)
- Headless browser: Chrome for Testing 146.0.7663.0, port 9301, `--remote-allow-origins=*`
- Harness: `qa-reports/day-99-qa.cdp.js` via `NODE_PATH=/Users/openclaw/src/openclaw/node_modules node …`

## Cycle 4 HARDEN week scorecard (Days 97 + 98 + 99)

| Day | Phase | Phases | Assertions | Console errors | New bugs |
|---|---|---|---|---|---|
| 97 | Full Interaction Audit | 29 | 82 | 0 | 0 |
| 98 | Level Playthrough | 26 | 121 | 0 | 0 |
| 99 | Edge Cases & Stress | 30 | 77 | 0 | 0 |
| **Total** | | **85** | **280** | **0** | **0** |

Cycle 4 HARDEN week is now 3 of 5 days complete with **280 assertions / 85 phases / 0 user-facing bugs / 0 console errors**. Day 100 is **Fix Day** — and since the open queue is empty (24 days running), Day 100 will likely be either a rest day or an LO-1 polish-style fix (the same shape as Day 90 in Cycle 3).

## What's next

**Day 100 — HARDEN Week Day 4 (Fix Everything).** With the open bug queue empty since Day 76 and LO-1 explicitly deferred to PRUNE Week per `roadmaps/cycle-4-build.md`, Day 100 has two viable shapes:

1. **Rest day** (Day 90 precedent): run a confirmation probe across a tight sample of Days 92–98 features, log "nothing to fix," document the pattern.
2. **LO-1 polish fix**: ship the user-unreachable HUD-cleanup hardening for `ui.showScreen('level-select')` direct-call path (deferred from Day 87).

The decision will hinge on whether Day 100's pre-flight check surfaces any new latent observations during a final regression sweep. Most likely outcome (matching Day 90's pattern): rest day with a tight 20–25 assertion confirmation probe.
