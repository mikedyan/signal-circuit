# Day 70 — Discovery Lab Redesign: Blueprint Mode

**Cycle:** 2 / Build Week / Day 3 (Wed, May 6 2026)
**Roadmap item:** roadmaps/cycle-2-build.md → Day 70

## Why
Cycle 1 expert review (8.4/10) flagged Chapter 8 (Discovery Lab) as feeling "bolted on": same UX as the rest of the campaign, just with `isDiscovery:true` and a slightly different post-solve message. Today gives Lab Bench a *unique rule* — you design first, submit once, and have a finite number of tries. The friction makes the open-design ethos feel earned.

## What ships (10 items, surgical)

1. **Lab Bench rebrand** — Chapter 8 title becomes `Chapter 8: Lab Bench` (was *Discovery Lab*) and storyIntro/Complete tweaked to match the "design first, test once" framing. New `isLabBench:true` flag on levels 36–40 (kept alongside `isDiscovery:true` so old code paths still work).

2. **Submit Blueprint CTA** — In `updateLevelInfo()`, when `isLabBench`, the `#run-btn` text becomes `📐 Submit Blueprint`. Quick Test is hidden (you can't iteratively poke; you submit). Status bar: *"Lab Bench: design first, submit when ready."*

3. **Pre-submit budget chip** — A new `#lab-budget-chip` near the run button shows `≈ {gates} / target {optimal}` and updates whenever the gate list changes (same hook as `markDirty`).

4. **Three-try counter + Reset Lab** — `_lab = { attempts, max:3, exhausted, firstTry, used }`. Each `runSimulation`/`runQuickTest` invocation in lab mode increments `attempts`. After 3 failed submits, the run button locks and a `🔬 Reset Lab` button appears that restores 3 fresh tries (counts as "non-first-try" forever for that level — kills the achievement chase by reset spam).

5. **One-shot evaluation** — In lab mode, `runSimulation` skips the row-by-row animated reveal and uses `simulation.runAll()` directly, then renders all rows in a single update with a small "blueprint development" delay (~600ms). Feels like a printout coming back, not a real-time scope.

6. **Blueprint hologram celebration** — New chapter branch in `_getCelebrationConfig` for chapterId=9: cyan/white particles plus a `📐` `🔬` `📊` emoji burst, distinct from chapter 1–6 chapter-themed celebrations.

7. **Lab Bench tutorial overlay (first entry)** — On first load of any `isLabBench` level for a profile, show a small `#lab-tutorial-overlay` modal: *"In Lab Bench, you design first, test once."* Gated by `localStorage.signal-circuit-lab-tutorial-seen` so it fires once per profile.

8. **Stats** — New stats fields on `achievements.stats`: `blueprintsSubmitted`, `blueprintsFirstTrySolved`, `blueprintLevelsCleared`. Tracked at `_consumeLabAttempt` (submit count) and at completion (first-try / cleared). New row in stats dashboard: *"📐 Lab Bench: X submitted · Y first-try wins · Z levels cleared"*.

9. **Two new achievements (gold)**:
   - `drafted_right` — *Drafted Right* — 3 first-try blueprint solves
   - `lab_method` — *The Method* — 10 lab-level clears (counts re-clears once)

10. **Cache bust + service worker v48** — `?v=1779120000` across all asset references; `CACHE_NAME = 'signal-circuit-v48'`.

## Files touched
- `js/levels.js` — chapter 9 title rename + `isLabBench:true` on 5 levels
- `js/main.js` — `loadLevel` lab init; `runSimulation` + `runQuickTest` lab intercept; `_consumeLabAttempt`, `_resetLab`, `_isLabBench` helpers
- `js/ui.js` — `updateLevelInfo` lab branch; `_renderLabHud`; `updateGateIndicator` budget hook; tutorial overlay; stats row; celebration cyan branch
- `js/achievements.js` — 2 new achievements + stats defaults + first-try / cleared trackers
- `index.html` — `#lab-hud`, `#lab-tutorial-overlay`, cache-bust ?v=1779120000
- `css/style.css` — lab hud + tutorial overlay styles (light + dark)
- `sw.js` — `CACHE_NAME` v47 → v48

## Out of scope
- No rebalancing of existing Discovery Lab levels (truth tables, gate budgets unchanged).
- No notebook iconography on cards (deferred to polish day if time permits — chapter narrative copy is the placeholder for now).
- No first-try success rate chart in stats dashboard (added counter; chart could land in next prune week).

## QA plan (CDP)
1. Cold-start fresh profile + force-unlock chapter 8 via test seed.
2. Open Level 36; verify run-btn = 📐 Submit Blueprint, lab hud visible, budget chip = `≈ 0 / 3`.
3. Verify lab tutorial overlay opens once on first lab-level entry; closes on click.
4. Submit blueprint with wrong circuit: counter → 1/3, status bar updates, run button still enabled.
5. Submit two more wrong: counter exhausts; run button disabled; reset button visible.
6. Click Reset Lab: tries restored to 3, run button re-enabled, `firstTry` flag locked false for level.
7. Solve on first try (fresh profile reload): achievements.stats.blueprintsFirstTrySolved increments, drafted_right unlock fires after 3rd first-try across L36/L37/L38.
8. Solve 10 lab levels (some replay) → lab_method unlocks.
9. Console must be clean across all paths.
10. Smoke test campaign Level 1: lab hud hidden, RUN button works as before.
