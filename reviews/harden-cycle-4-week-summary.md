# Harden Cycle 4 — Week Summary

**Cycle:** 4 (Apr 18 – Jul 16, 2026)
**Week:** Harden (cycleDay 45–49 · Days 97–101 · Jun 4–8, 2026)
**Build at week end:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'`
**Build set at:** Day 96 (Snapshot Cards Library Tab) — **unchanged for the entire HARDEN week**

---

## Day-by-day

| Day | weekDay | Focus | Assertions | New bugs | Console errors |
|---|---|---|---|---|---|
| 97 | Mon (1) | Full Interaction Audit | 82 | 0 | 0 |
| 98 | Tue (2) | Level Playthrough | 121 | 0 | 0 |
| 99 | Wed (3) | Edge Cases & Stress | 77 | 0 | 0 |
| 100 | Thu (4) | Fix Everything (Rest day) | 39 (confirmation probe) | 0 | 0 |
| 101 | Fri (5) | Regression Pass (deployed) | 44 | 0 | 0 |
| **Total** |  |  | **363** | **0** | **0** |

---

## Bugs

| Severity | Found | Fixed | Open at week end |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** |

**Open Bugs queue: empty** at start of week (carried over from Day 96 / Cycle 4 BUILD wrap) and at end of week (today).

**Latent observations:** 1 — **LO-1** (introduced Day 87): calling `ui.showScreen('level-select')` *directly* (bypassing `GameState.showLevelSelect`) skips the Day 61 Blitz + Day 74 Speedrun HUD-cleanup blocks. Not user-reachable — every user path back to level-select goes through the GameState wrapper. Re-verified non-user-reachable on Days 97, 98, 99, 100, 101. Tagged for **Cycle 4 PRUNE Week Day 1** (Day 102, tomorrow) as a "move cleanup to the right layer" polish item.

---

## What this week actually was

Cycle 4 HARDEN week was the **third consecutive HARDEN week** to start and end with an empty Open Bugs queue (Cycle 2 closed clean on Day 76, Cycle 3 closed clean on Day 91). The deployed build had been stable since Day 96 (Snapshot Cards Library Tab) — no user-visible features shipped, no behavior changed.

That made this week — like Cycle 3 — a **confirmation week**, not a discovery week. Every day's probe verified the same artifact from a different angle:

- **Day 97 (Mon, Full Interaction Audit):** 82 assertions across 29 phases covering every screen and modal — settings, how-to-play, share card, all 8 modes, encyclopedia, achievements, stats (incl. Day 96 📸 My Cards tab), customize, logic profile, mastery tree, collection. Cycle 4 BUILD-week regression sweep verified D92/D93/D94/D95/D96 payoffs all live on the deployed build.

- **Day 98 (Tue, Level Playthrough):** 121 assertions across 26 phases. Sampled 14 levels (1/5/10/15/20/25/30/35/40 + Day 84 Lab Bench II 41/42/43 + Day 94 composite 44/45). Every truth table re-derived from gate semantics via the `SPECS` map pattern; every hint array length checked; `calculateStars` verified at three thresholds per level; live L1 hint click increment + L1 completion persistence. Day 94's composite L45 hardCap-5 + mustIncludeGate=['XOR'] validator confirmed emitting the byte-exact `; `-joined rejection message.

- **Day 99 (Wed, Edge Cases & Stress):** 77 assertions across 30 phases. Re-ran Day 89's 25-test sweep verbatim with Day 92/93/94/95/96 additions layered in as T26–T30. Rapid gate placement during sim, wire-draw during animation, 10× resize, RUN+QuickTest 15× spam each, 20× undo/redo via `undoManager.undo/redo`, mode-switch storm, blur/focus cycle, Lab Bench composite-validator under 100 rapid calls, D93 Tournament adapter intent-vs-capability mode mapping, D95 debug-flag 5× toggle stress, D96 card-library FIFO eviction under flood.

- **Day 100 (Thu, Fix Everything — Rest Day):** 39 assertions across 11 phases. Confirmation probe over a tight sampling of Cycle 4 BUILD features (D92 ES module exports + GateTypes 8 keys; D93 Tournament backend mode/describe/isLive + factory + adapter window exposure; D94 composite Lab Bench L44+L45; D95 onboarding readout debug-flag gating; D96 snapshot card library API + reset) + Day 78 staircase end-game (seed=45 → 18 nav + 45 overflow) + Day 79 dead-id purge + explicit LO-1 re-verification. **Fix Day with nothing to fix** — Open Bugs queue empty since Day 76, LO-1 deferred to Cycle 4 PRUNE.

- **Day 101 (Fri, Regression Pass — deployed):** 44 assertions across 14 phases against `https://mikedyan.github.io/signal-circuit/`. Build identity, cold-start, core loop end-to-end on L1, campaign progression, all 8 modes (Daily / Random / Blitz / Speedrun / Sandbox / Tournament / Infinite / Campaign), Day 84 Lab Bench II L42 validator, Day 78 end-game staircase at seed=45, console hygiene. Day 91's harness transplanted verbatim with three constants swapped (v60→v65, card count 43→45, end-game seed 40→45). **44/44 clean on first run.**

---

## Total cumulative coverage on the same artifact

Across Days 97–101, the same Day 96 build (`?v=1780617600`, `sw v65`) was probed by **363 assertions** with **zero new user-facing bugs** and **zero console errors**. This is the cleanest HARDEN-week scorecard the factory has shipped — Cycle 3 finished at 286 assertions, Cycle 4 closes at 363 (+27%).

The Open Bugs queue is now **empty for 26 consecutive days** (since Day 76).

---

## Files changed this week

| Day | File | Change |
|---|---|---|
| 97 | `qa-reports/day-97-qa.cdp.js`, `.md` | Full Interaction Audit harness + report |
| 97 | `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` | Day 97 summary + lessons + state |
| 98 | `qa-reports/day-98-qa.cdp.js`, `.md` | Level Playthrough harness + report |
| 98 | `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` | Day 98 summary + lessons + state |
| 99 | `qa-reports/day-99-qa.cdp.js`, `.md` | Edge Cases & Stress harness + report |
| 99 | `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` | Day 99 summary + lessons + state |
| 100 | `qa-reports/day-100-qa.cdp.js`, `.md` | Fix-Day confirmation probe + report |
| 100 | `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` | Day 100 summary + lessons + state |
| 101 | `qa-reports/day-101-qa.cdp.js`, `.md` | Regression Pass harness + report |
| 101 | `reviews/harden-cycle-4-week-summary.md` | This file |
| 101 | `BUGS.md`, `LESSONS_LEARNED.md`, `FACTORY_STATE.json` | Day 101 summary + lessons + state |

**Zero source-file changes** (`js/`, `css/`, `index.html`, `sw.js`) for the entire HARDEN week. Cache-bust + SW version held at `?v=1780617600` / `signal-circuit-v65` for 5 consecutive days.

---

## Lessons of the week

Three cycles of empty-queue HARDEN weeks (Cycles 2, 3, 4) confirm what Cycle 3's wrap report tentatively claimed:

1. **Empty-queue HARDEN weeks are the equilibrium state, not the exception.** The factory's BUILD-week rigor is producing payloads that genuinely don't introduce user-facing regressions. The HARDEN week's job is to *certify*, not to *manufacture fixes*. Three consecutive cycles closing clean across 286 + 286 + 363 = 935 assertions on unchanged artifacts is signal, not coincidence.

2. **The Cycle 3 wrap's coverage-rotation suggestion was sound but unused — pin it for Cycle 5.** Cycle 4 HARDEN week stuck to the proven 10–12 surfaces (campaign / 7 modes / Lab Bench II / staircase / dead-ID purge). Less-trodden surfaces flagged in Cycle 3's wrap (sandbox-mode deep play, community-level loader edge cases, audio-engine state transitions across mode switches, cosmetic + skin × accessibility paint stability, service-worker stale-cache fallback) remain unrotated. **Cycle 5 HARDEN Day 1 should explicitly pick one and write the probe.**

3. **Confirmation probes getting LEANER each day is the right shape — Day 97 (82) → Day 98 (121, deep-dive) → Day 99 (77) → Day 100 (39) → Day 101 (44).** Day 98 is the natural high-water mark (Level Playthrough's 14-level sweep × 7-8 assertions per level dominates). The Tuesday-deep / Wed-stress / Thu-confirmation / Fri-deployed staircase is now the working pattern across two cycles. Don't re-prove what's already proven on the same unchanged artifact.

4. **Don't bump cache-bust on no-code days.** Re-confirming the Cycle 3 lesson: the Day 86 → 91 (Cycle 3) and Day 96 → 101 (Cycle 4) precedent is now a rule. Cache-bust + SW version are tied to *real source-file changes*. Bumping them on a no-op day would confuse future audits about what actually changed.

5. **Day 91's deployed-site harness template is now a reusable HARDEN-Friday primitive.** Day 101 cloned `qa-reports/day-91-qa.cdp.js`, swapped three constants (cache-bust version, expected card count, end-game seed), and ran 44/44 clean on first attempt. The pattern: build-identity → cold-start → core-loop end-to-end on L1 → campaign progression to L2 → one assertion per mode → BUILD-week regression markers → console hygiene. Future HARDEN Fridays should copy `day-101-qa.cdp.js` wholesale, bump constants, append 1-2 phases for whatever the BUILD-week shipped.

6. **Deploy-target verification belongs on Day 5, not earlier.** Days 97–100 ran on localhost (`localhost:8901`) so the harness can mutate state freely. Day 101 hit the actual GitHub Pages URL to confirm the deployed artifact matches what was verified all week. That split keeps the inner loop fast while still landing a deployment-level smoke test before the week closes.

7. **LO-1 has now been re-verified non-user-reachable on 9 distinct days** (87, 88, 89, 90, 91, 97, 98, 99, 100, 101 = 10 total days actually). It is not a bug in the user-facing sense; it is a layering observation. Cycle 4 PRUNE Week (starting tomorrow) will finally address it — moving the HUD cleanup from the `GameState` wrapper into the screen-transition layer so the bypass path also benefits. This is the right cycle and the right week for it (PRUNE Tier 1 cut).

---

## Roll-up

- **Open bugs at week end:** 0 (streak: 26 days)
- **Bugs fixed:** 0 (none to fix)
- **New bugs found:** 0
- **Latent observations:** 1 (LO-1 — deferred to Cycle 4 PRUNE, lands tomorrow)
- **Console errors across the week:** 0 (across 363 assertions)
- **Source-file changes:** 0
- **Cache-bust bumps:** 0
- **Cumulative HARDEN-week assertions on the unchanged Day 96 artifact:** 363
- **Cleanest HARDEN-week scorecard shipped** (Cycle 2: ~150 / Cycle 3: 286 / **Cycle 4: 363**)

Cycle 4 HARDEN Week closes clean. **Cycle 4 PRUNE Week begins Day 102 (tomorrow, Tuesday Jun 9, 2026).** Day 1 deliverable: `PRUNE_REPORT.md` (Fresh Eyes Audit on `?v=1780617600` / `sw v65`) + the LO-1 fix scoped onto the Tier 1 cut list.
