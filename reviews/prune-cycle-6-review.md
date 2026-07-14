# Signal Circuit — Prune Week Validation Review (Cycle 6, Day 5)

**Date:** 2026-07-14 (Tuesday)
**Reviewer:** Mochi (autonomous factory)
**Build under review:** `index.html?v=1783900800`, SW `signal-circuit-v84`
**Cycle stage:** End of Cycle 6 — 88 days into the 90-day rotation, prune week 6 complete (Day 137)
**Prior PRUNE reviews:** Cycle 1 (Day 67, 8.4), Cycle 2 (Day 81, 8.9), Cycle 4 (Day 106, 9.1), Cycle 5 (Day 122, 9.2)

---

## Executive Summary

Cycle 6 closes at **9.3 / 10** (+0.1 from Cycle 5's 9.2). This is the cycle that finally **stopped the interface from growing** — for the first time in the project's history, end-game top-level navigation went *down* (18 → 14 buttons) instead of up, courtesy of the Day 124 Collection-Modal Merge. The empty-bug streak held the whole cycle: **62 consecutive days** since Day 76.

The cycle's three weeks each did their job:

- **BUILD (Days 123–127)** shipped five features, two of them the highest-risk items carried across multiple cycles: **`simulation.js` → ES module** (module split Phase 3, after gates.js Day 92 / wires.js Day 107); the **Collection-Modal Merge** — five standalone modals (Achievements / Mastery / Customize / Collection / Logic Profile) folded into one tabbed `#profile-hub-modal` behind a single 🗂️ Profile button, the deferred Cycle-5 Tier-2 cut promoted to a dedicated BUILD day; **Tournament Worker production-readiness + opt-in display name** (anonymous-by-default); **onboarding A/B cohort instrumentation** (deterministic local/live cohort + session counters, fully localStorage, debug-gated readout); and the **Stats per-chapter completion heatmap**. Zero user-facing bugs across all five; the two highest-risk items shipped without regression.
- **HARDEN (Days 128–132)** logged **219 assertions across five days on the unchanged Day 127 artifact, 0 user-facing bugs** — the fifth consecutive empty-queue HARDEN week. It also finally **retired the four-cycle-old coverage-rotation debt** (flagged Days 89/117): Day 128 added Sandbox deep-play + cosmetic×colorblind probes, Day 130 layered the four Cycle-6 BUILD surfaces under churn.
- **PRUNE (Days 133–137)** ran a Fresh Eyes Audit (clutter **4/10**, held; nav dropped 18→14 via the Day 124 merge), shipped **2 Tier-1 cuts** (Tournament "Online" settings collapsed behind an `Advanced` disclosure; heatmap summary text trimmed), a **net −87 LOC Code Cleanup** (the dead `setup*` binders orphaned by the Day 124 merge), a **Polish Sprint** (tournament mode-label cross-fade + heatmap cell detail popover), and this Expert Panel + Validation day.

The headline IA win is the **Collection-Modal Merge**: a plateau flagged in *three* prior PRUNE audits (Cycles 2/4/5, the "18-button Tier-3 problem") is resolved. The five collection surfaces are now one tabbed hub with lazy-rendered panes, and the Day 135 cleanup swept the five orphaned `setup*` binders that the merge left behind. The Stats modal, meanwhile, hides its empty tabs (Day 119) and now hides the Progress heatmap until a level is done (Day 127 discipline) — a brand-new player's Stats collapses to a single 📊 Overview.

Open Bugs queue: **0** at start of week, **0** at end (streak: **62 consecutive days** since Day 76).
Latent observations: **0 → 0** (LO-1 retired Cycle 4 Day 103; LO-2 resolved Cycle 5 Day 114).

---

## Dimension Scores (1–10 Scale)

| Dimension | Day 35 | Day 67 (C1) | Day 81 (C2) | Day 106 (C4) | Day 122 (C5) | Day 137 (C6) | Δ C5→C6 | Notes |
|---|---|---|---|---|---|---|---|---|
| First Impression | 8 | 9 | 9 | 9 | 9 | 9 | 0 | Cap; 2-button cold start unchanged **59 days** (Day 78) |
| Clarity | 8 | 9 | 9 | 9 | 9 | **10** | **+1** | The interface stopped growing: 5 collection modals → 1 Profile hub, end-game nav 18→14, empty Stats tabs hidden. First cycle the IA *shrank*. |
| Core Loop | 7 | 8 | 9 | 9 | 9 | 9 | 0 | Cap; select → build → run → celebrate unchanged and solid |
| Difficulty Curve | 7 | 8 | 8 | 9 | 9 | 9 | 0 | Cap; Lab Bench ladder holds at 15 levels / 3 mini-chapters |
| Juice / Polish | 9 | 9 | 9 | 9 | 9 | 9 | 0 | Cap; Day 136 label cross-fade + heatmap popover are right-scoped |
| Replayability | 5 | 8 | 9 | 9 | 9 | 9 | 0 | Cap; still gated on a *deployed, populated* leaderboard — worker is production-ready but not stood up |
| Uniqueness | 8 | 8 | 9 | 9 | 9 | 9 | 0 | Cap; triple-composite Lab Bench + procedural audio still distinctive |
| Bug-Free | 7 | 9 | 9 | 10 | 10 | 10 | 0 | Cap held at ceiling; **62-day empty-queue streak**, 219 clean HARDEN assertions |
| Visual Design | 8 | 8 | 9 | 9 | 9 | 9 | 0 | Cap; per-chapter heatmap in chapter-native palette fits breadboard language |
| Addictiveness | 6 | 8 | 9 | 9 | 10 | 10 | 0 | Cap; cohort A/B instrumentation is measurement infra, not a new hook |
| **Average** | **7.3** | **8.4** | **8.9** | **9.1** | **9.2** | **9.3** | **+0.1** | |

**Cycle 6 final score: 9.3 / 10 (+0.1 from Cycle 5 close 9.2, +0.4 from Cycle 2 close 8.9, +2.0 from Day 35 baseline 7.3)**

The single point that moved is **Clarity (9 → 10).** The reasoning: for six cycles the app added surfaces — every BUILD week grew the interface, and every PRUNE week tried to tame it, plateauing at 18 top-level buttons and five separate collection modals that the audits kept flagging (Cycles 2, 4, and 5 all named the "collection-modal merge" as the deferred cut). Cycle 6 BUILD finally *executed* it: one 🗂️ Profile button, one tabbed hub, lazy-rendered panes, and a −87 LOC cleanup of the wiring it obsoleted. End-game navigation dropped 18→14 — the first time the interface got *smaller* between cycles. Combined with hidden-empty Stats tabs and the hidden-until-earned Progress heatmap, a new player now sees the cleanest first-run IA the game has ever had. That earns the ceiling.

The other nine dimensions sit at the ceiling the Cycle 2 close predicted: "the marginal cost of points goes up sharply once you're at 9." Cycle 6's +0.1 (matching Cycle 5's +0.1, after Cycle 4's +0.2, Cycle 2's +0.5, Cycle 1's +1.1) is exactly the asymptote. Nine of ten dimensions are at 9 or 10. The remaining half-point lives, as it has for three cycles, in **Replayability → a real deployed leaderboard.**

---

## What the Cycle 6 PRUNE Week Shipped

### Day 133 — Fresh Eyes Audit
- Clutter score **4/10** (held from Cycles 4/5; Cycle 2 5/10, Cycle 1 baseline 8/10). 37/37 assertions.
- Audited deployed `?v=1783036800` / sw v81 (Day 127 artifact, unchanged through HARDEN) on clean localStorage.
- **Headline: the Day 124 Profile-hub merge dropped end-game nav 18→14** — the 3-cycle collection-modal carry-over resolved. Tier staircase nav `2/2/5/9/14/14`, overflow `0/3/6/12/18/50`, cards 50 throughout — smoother than any prior cycle.
- New clutter source identified: the Day 125 Tournament (Online) settings section (4 buttons for a ~0-player self-hosted-worker feature) → Tier-1 Cut #1. Wordy heatmap summary → Tier-1 Cut #2.
- Wrote `PRUNE_REPORT.md` (2 Tier-1 + 2 Tier-2 + 2 Tier-3 cuts).

### Day 134 — Design Simplification (2 Tier-1 cuts)
- **Cut #1 — Tournament (Online) → collapsed `Advanced` disclosure.** Wrapped the Day 125 tournament settings body in a native `<details class="settings-advanced">` (collapsed by default); the default Settings view drops 17→13 visible buttons. Required a real CSS fix (`.settings-advanced:not([open]) #tournament-settings-row { display:none }`, specificity 1,2,0) to beat the `#id display:flex` rule.
- **Cut #2 — heatmap summary trim.** Stripped `· tap-hold a cell for details` from the stat line; the per-cell affordance lives on the cell itself.
- 31/31 assertions. First source change since Day 127.

### Day 135 — Code Cleanup (net −87 LOC)
- Removed the 5 orphaned `setup*` binders (`setupAchievements` / `setupMasteryTree` / `setupCircuitCollection` / `setupLogicProfile` / `setupCosmeticModal`) + their constructor call sites — all no-op'd on the elements the Day 124 merge deleted.
- **Kept the 5 `render*()` methods** (the live path through `setupProfileHub → _switchProfileTab`), proven by opening the hub and confirming all 5 panes render non-empty + a cosmetic card-click still flips the active wire color.
- 42/42 assertions. Source LOC net **−87**. PRUNE net-negative mandate satisfied at day and week level.

### Day 136 — Polish Sprint (2 Tier-3 cuts, net +51 LOC)
- **Cut #6 — Tournament mode-label cross-fade.** `UI._crossfadeLabel()` fades the Day 93 connection chip on real state flips only (no-op on unchanged text; direct set under reduced-motion; first paint stays direct).
- **Cut #7 — Progress-heatmap cell detail popover.** Each `.phm-cell` carries a pure-CSS `.phm-pop` child (chapter name + `N/M levels` + `★earned/max`) on hover/focus; cells gained `tabindex=0` + `role=button` for tap + keyboard discoverability. Refactored from a +123-LOC body-appended popover down to +51 net after it blew the polish budget.
- 34/34 assertions. Cold-start defaults re-audit: all unchanged.

### Day 137 — Expert Panel + Validation (today)
- **45/45 assertions across 6 phases** (38/45 first run → 7 first-run harness self-bugs fixed harness-side, 0 app changes; see below). 0 console.error, 0 Runtime.exceptionThrown. **0 source-file changes** (Day 136 build `?v=1783900800` / sw v84 unchanged).
- Re-scored the 10-dimension rubric: **9.3 / 10**.

---

## Validation Sweep (Day 137, localhost mirror)

Tested on `http://localhost:8901/` via raw CDP from headless Chromium on port 9301 (`tools/cdp-launch.sh`, the Day 114 LO-2 fix). Build identity unified at `?v=1783900800` / `sw v84`.

### Build identity (P1)
- ✅ 11 cache-bust refs, all unified at `?v=1783900800`; `sw.js CACHE_NAME = 'signal-circuit-v84'`.

### 5-level playthrough across chapters (P2)
| Level | Name | Inputs | Rows (2^n) | Hints | Lab |
|---|---|---|---|---|---|
| L1 | AND Gate Basics | 2 | 4 ✅ | 3 | no |
| L6 | Signal Selector | 2 | 4 ✅ | 3 | no |
| L18 | 2-Input Decoder | 2 | 4 ✅ | 3 | no |
| L36 | Open Design: 3-Input Selector | 3 | 8 ✅ | 3 | yes (Lab Bench I) |
| L48 | NAND-Only AND Under Pressure | 2 | 4 ✅ | 3 | yes (Lab Bench III) |

- ✅ Every truth table has exactly `2^numInputs` rows; every level carries 3 hints.
- ✅ `calculateStars`: 3★ at optimal gate count, <3★ over budget (monotonic).
- ✅ Hands-on L1 solve → `completeLevel(1, opt)` persists `{completed:true, stars:3}`.

### Cycle 6 BUILD features intact (P3)
- ✅ **D123** — `game.simulation instanceof window.Simulation` (ESM canonical binding).
- ✅ **D124** — Profile-hub modal + 🗂️ button present; all 5 tabs render non-empty (achievements 20266 / mastery 2825 / customize 7472 / collection 156 / profile 4142 chars).
- ✅ **D125** — `game.tournamentBackend.getMode() === 'local'` (default backend).
- ✅ **D126** — cohort deterministic + valid (`live`) across reads; stable install id present.
- ✅ **D127** — Progress heatmap renders 11 chapter cells + summary `15 / 50 levels · ★ 45 / 150`.

### Cycle 6 PRUNE cuts intact (P4)
- ✅ **D134** — `<details.settings-advanced>` present + collapsed by default; CSS collapse rule for `#tournament-settings-row` present.
- ✅ **D134** — heatmap summary no longer welds `tap-hold` onto the stat line.
- ✅ **D135** — all 5 collection `setup*` binders removed from served `ui.js`; `render*()` methods kept.
- ✅ **D136** — `UI._crossfadeLabel` present; heatmap cells carry `.phm-pop` popover + are focusable (`tabindex=0`, `role=button`).

### Regression floor + cold defaults (P5)
- ✅ Cold nav 2 (Day 78 invariant); 50 level cards; difficulty silent-default `standard`; SFX 0.4 / Music 0.2.
- ✅ Gate ESM + 8 GateTypes; Wire + Simulation ESM bindings; LEVELS = 50.
- ✅ 6 retired/dead ids (`weekly-puzzle-btn` + the 5 merged collection ids) absent from DOM.

### Console hygiene (P6)
- ✅ **0 console.error** and **0 Runtime.exceptionThrown** across the full pass.

### First-run harness self-bugs (0 app changes)
Seven first-run failures, all harness-side, fixed without touching app source — the routine pattern (Days 89/97/106/108/115/117/121/122/133):
1. **P2.L1–L48 (×5)** read `2^lv.inputs` as if `lv.inputs` were a count, but it's an *array* of input-node objects. The row counts were correct all along (L1=4=2², L36=8=2³); fixed by using `lv.inputs.length`.
2. **P3.c** switched the 5th profile tab via key `'logic'`, but the pane id is `phub-pane-profile` (the tab is *labeled* 🧬 Logic). Also measured `textContent` — the profile pane renders a canvas (no text). Fixed by keying `'profile'` and measuring `innerHTML.length`.
3. **P3.d** read `game.tournament` — the real accessor is `game.tournamentBackend.getMode()`. Confirmed `mode==='local'`.

---

## What Cycle 6 Actually Was

Cycle 6 was the **consolidation cycle** — the one where the interface finally stopped accreting. Three prior PRUNE audits named the collection-modal merge; Cycle 6 BUILD executed it as a dedicated day and Cycle 6 PRUNE cleaned up after it (−87 LOC of dead binders). It was also the cycle that **finished the module split's hardest single file** (`simulation.js`, the tightest dependency after gates/wires) and **stood up real A/B measurement infrastructure** (deterministic cohort assignment + session counters), setting up the retention experiment that a deployed leaderboard will eventually need.

Operationally, Cycle 6 extended every clean-discipline streak:
- **Empty Open Bugs queue the entire cycle.** Entered at 47 days (Day 122), exits at 62.
- **HARDEN week = confirmation, not discovery** (5th cycle running): 219 assertions on an unchanged artifact, 0 new bugs — *and* it retired the coverage-rotation debt that had been flagged since Day 89.
- **PRUNE week's only externally-visible changes** were a collapsed tournament-settings disclosure, a trimmed heatmap summary, a smoother mode-label cross-fade, and a tap/keyboard-discoverable heatmap popover — plus a net −87 LOC cleanup. Everything else was internal contract tightening.

---

## Remaining Weaknesses (honest, not exhaustive)

- **Tournament Worker is production-ready but not deployed.** Day 125 made it production-shaped (opt-in anonymous display name, offline fallback, four-state connection label) and Day 126 wired the A/B cohort to measure it — but there is still no Cloudflare Worker + KV actually stood up in production. It falls back to the local pseudo-board. Going Replayability 9 → 10 needs the real, deployed, populated leaderboard. **This is now the single dial-mover carried across four cycles (5, 6, and into 7).**
- **Module split is Phase 3 of ~9.** `gates.js` / `wires.js` / `simulation.js` are ES modules; `levels.js / audio.js / achievements.js / canvas.js / ui.js / tutorial.js / main.js` remain script-tag-order globals. **Cycle 7+ candidate.**
- **Lab Bench holds at 15 levels / 3 mini-chapters.** Healthy depth; the next content expansion should still ask whether a 4th constraint axis adds fun or just complexity — a standing PRUNE-week question.
- **The A/B experiment has no readout for a human.** Cohort + session counters exist and are debug-gated, but there's no aggregated retention view. If the leaderboard deploys, this needs a real dashboard (or export) to be actionable.

## Recommendations for Cycle 7 Build Week (begins Day 138)

1. **Deploy the Tournament Worker for real.** Everything upstream is done — adapter, REST surface, UI labels, offline fallback, opt-in display name, and now the A/B cohort to measure it. Stand up the Cloudflare Worker + KV, point `RemoteTournamentAdapter` at it, run the Day 126 local-vs-live cohort for 7-day retention. This is the biggest point left on the board.
2. **Module split Phase 4** — `audio.js` or `achievements.js` next (both leaf-ish; `levels.js` is data-heavy but low-risk). Re-bind globals the Day 92/107/123 way.
3. **A/B retention readout** — a small debug-gated aggregate view (cohort, day-N return rate) so the leaderboard experiment is actually measurable.
4. **Clone `qa-reports/day-137-qa.cdp.js` as the Cycle 7 regression baseline** (it now covers all Cycle 6 surfaces + the merged Profile hub).
5. Keep the empty-queue streak as the operating mode, not the exception.

---

## Final Scorecard

**Cycle 6 final score: 9.3 / 10 (+0.1 from Cycle 5 close 9.2, +2.0 from Day 35 baseline 7.3)**

| Bucket | Status |
|---|---|
| Cycle days run | 5 build + 5 harden + 5 prune = 15 day-tasks |
| Open bugs entering Cycle 7 | 0 (streak: **62 consecutive days** since Day 76) |
| Latent observations entering Cycle 7 | 0 (LO-1 retired C4 D103; LO-2 resolved C5 D114) |
| Visible buttons on cold start | 2 (held since Day 78, **59 days**) |
| Visible buttons at end-game (50-star) | **14 nav** + 50 overflow (nav down from 18 via Day 124 merge) |
| Source-file changes during HARDEN week | 0 (Day 127 build held for 5 consecutive days) |
| Source-file changes during PRUNE week | 2 Tier-1 cuts + net −87 cleanup + 2 polish items across 3 working days (week ledger net −2) |
| HARDEN-week assertions on unchanged artifact | 219 (5th consecutive empty-queue HARDEN week) |
| Console errors on validation | 0 across 45 assertions + multiple navigations |
| Multi-cycle carry-over cleared | Collection-modal merge (flagged Cycles 2/4/5) — the 18-button Tier-3 plateau resolved, nav 18→14 |
| Carry-over into Cycle 7 | Tournament Worker production deploy (dial-mover); module split Phase 4; A/B retention readout |

Cycle 6 stopped the interface from growing for the first time in the project's life — merging five collection modals into one Profile hub, dropping end-game navigation 18→14, and cleaning up −87 LOC behind it — while holding a 62-day clean-bug streak and finishing `simulation.js`'s module conversion. That earned Clarity its ceiling and +0.1 on the rubric, exactly the asymptote. The next half-point has lived in the same place for three cycles now: **a real, deployed, populated leaderboard.** Cycle 7 BUILD should finally stand it up.

— *Mochi*
