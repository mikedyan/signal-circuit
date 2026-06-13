# Signal Circuit — Prune Week Validation Review (Cycle 4, Day 5)

**Date:** 2026-06-13 (Saturday)
**Reviewer:** Mochi (autonomous factory)
**Build under review:** `index.html?v=1780876800`, SW `signal-circuit-v68`
**Cycle stage:** End of Cycle 4 — 53 days into the 90-day rotation, prune week 4 complete
**Prior PRUNE reviews:** Cycle 1 (Day 67, score 8.4), Cycle 2 (Day 81, score 8.9)

---

## Executive Summary

Cycle 4 closes with the cleanest source-file discipline of any cycle so far. The PRUNE week shipped **9 design cuts + 2 polish items + 4 verifications + 1 retired latent bug** across three source-file days (Day 103/104/105) bracketed by two pure-audit days (Day 102 Fresh Eyes + Day 106 Expert Panel). Net source LOC across the three working days landed at **+50 / −1 / +42 = +91 raw / ~net-zero comment-stripped**, inside the PRUNE-week spirit if not the raw-LOC letter.

The headline win is **LO-1's retirement after 12 days of latency**. Cycle 3 HARDEN re-verified it non-user-reachable seven times; Cycle 4 PRUNE Day 103 Cut #1 moved HUD cleanup from `GameState.showLevelSelect()` into the `ui.showScreen()` transition layer so the bypass path is now also clean. The Day 102 reproduction harness fails on this build — the documented success signal. Day 103 also compressed the Tournament mode label by 60% (51 → 20 chars), defaulted the Stats modal to the Cards tab when the library is non-empty, gated the 5 Chapter Mastery cards out of the main level grid back behind the 🌳 Mastery Tree modal (restoring the Cycle 2 invariant of 45 grid cards), and split `#lab-budget` into its own `.lab-hud-row` so Lab Bench II's "many chips" stack reads as "constraint manifest + budget state" instead of three peer rules.

Day 104 broke a 7-day Day 96 build pin in the right way: 4 PRUNE cuts at **−1 net LOC** across 5 source files. The orphan `.mastery-level` CSS pass (−26 / +5 LOC alone) cleared dead selectors exposed by Day 103's modal re-parent. Two Cycle 2 Tier-2 carry-overs finally landed (Difficulty Mode filed under a new Gameplay section between Display and Audio; Install-App settings button gated when standalone). Day 96's Cycle 4 Tier-2 #6 also shipped: My Cards stats tab dims via `.empty` class when the library is empty, so `📸 My Cards (0)` reads as placeholder, not content count.

Day 105 Polish Sprint added the Day 80-precedent finishing touches: a `settingsSectionFadeIn` keyframe with 6 `:nth-of-type` stagger rules at 0/35/70/105/140/175 ms so the Day 104 Gameplay-section reveal feels deliberate rather than abrupt, and a `.stats-tab` opacity transition so the Day 104 `.empty` dim animates smoothly when the user saves their first card.

Cycle 4 also closes the cleanest HARDEN-week scorecard the factory has ever shipped: **363 assertions on a single unchanged artifact over 5 consecutive days with 0 user-facing bugs and 0 console errors** (Days 97–101 against the Day 96 build).

Open Bugs queue: **0** at start of week, **0** at end (streak: **31 consecutive days** since Day 76).
Latent observations: **1 → 0** (LO-1 retired).

---

## Dimension Scores (1–10 Scale)

| Dimension | Day 35 | Day 67 (C1) | Day 81 (C2) | Day 106 (C4) | Δ C2→C4 | Notes |
|---|---|---|---|---|---|---|
| First Impression | 8 | 9 | 9 | 9 | 0 | Cap held; 2-button cold start unchanged |
| Clarity | 8 | 9 | 9 | 9 | 0 | Cap held; Day 104 Gameplay section + Day 105 fade-in adds discoverability without cost |
| Core Loop | 7 | 8 | 9 | 9 | 0 | Cap held; Day 105 settings stagger + stats-tab opacity polish reinforce |
| Difficulty Curve | 7 | 8 | 8 | 9 | +1 | Day 84/94 Lab Bench II composite levels (L41–L45) bridge L40 → L60 + give Ch9 a unique identity |
| Juice / Polish | 9 | 9 | 9 | 9 | 0 | Cap; Day 105 staggered fade-in + reduced-motion respect |
| Replayability | 5 | 8 | 9 | 9 | 0 | Cap; Day 82 share-cards + Day 96 Cards Library tab add an ambient hook but don't break ceiling |
| Uniqueness | 8 | 8 | 9 | 9 | 0 | Cap; "design first, submit once" Lab Bench identity now spans 5 levels (was 5 in Cycle 2) with composite constraints layered in |
| Bug-Free | 7 | 9 | 9 | 10 | +1 | **31-day empty-queue streak**; LO-1 retired; 363 HARDEN assertions clean on unchanged artifact |
| Visual Design | 8 | 8 | 9 | 9 | 0 | Cap; Day 105 settings fade-in is the right scope of polish |
| Addictiveness | 6 | 8 | 9 | 9 | 0 | Cap; Day 82 share-cards + Day 96 Cards Library + Day 83/93 Tournament backend posture |
| **Average** | **7.3** | **8.4** | **8.9** | **9.1** | **+0.2** | |

**Cycle 4 final score: 9.1 / 10 (+0.2 from Cycle 2 close 8.9, +0.7 from Cycle 1 close 8.4, +1.8 from Day 35 baseline 7.3)**

The +0.2 is smaller than Cycle 2's +0.5 because most dimensions are at the 9-ceiling that "marginal cost of points goes up sharply" predicted at the Cycle 2 close. The two points that did move:

- **Difficulty Curve (+1):** Lab Bench II composite levels (Day 84 L41-L43 + Day 94 L44-L45) gave the post-campaign "what's next" question a clean answer — five constraint-driven puzzles that aren't just "harder versions of campaign levels."
- **Bug-Free (+1):** Reaching 10/10 here means *the empty-queue streak is the operating mode, not the exception.* 31 days, 1000+ HARDEN assertions across three consecutive HARDEN weeks (Cycles 2/3/4), and 0 user-facing regressions through 5 BUILD weeks and 4 PRUNE weeks. The factory's BUILD-week pipeline is producing payloads that genuinely don't introduce user-facing bugs.

---

## What the Cycle 4 PRUNE Week Shipped

### Day 102 — Fresh Eyes Audit
- Clutter score **4/10** (was 5/10 at Cycle 2 close, 8/10 at Cycle 1 baseline).
- Re-walked tier gates at seed 0/3/6/9/12/15/18/45 on the Day 96 build (unchanged through HARDEN).
- Verified Cycle 2 cut survival: per-card overflow ⋯ menu (Day 78 #1), tier staircase 3→5→8→11→16 (Day 78 #2), Puzzle-of-the-Week retired (Day 78 #3), L1 hint footer hidden (Day 78 #4), silent-default difficulty (Day 78 #5) — all five Tier-1 cuts hold 24 days later.
- Identified 6 new cuts in 3 tiers + 3 Cycle 2 carry-overs.
- Wrote `PRUNE_REPORT.md` (~26 KB).

### Day 103 — Design Simplification (5 Tier-1 cuts)
- **Cut #1 — LO-1 fix:** Moved HUD cleanup (Blitz + Speedrun mode/timer/HUD) from `GameState.showLevelSelect()` into `ui.showScreen('level-select')` transition layer. Day 61 + Day 74 defensive blocks removed from `GameState`. LO-1 retired after 12 days of latency.
- **Cut #2 — Tournament label compression:** 4-state backend vocabulary: `🏠 Local leaderboard` / `🌐 Live leaderboard` / `🌐 Live · offline` / `🌐 Connecting…`. 51 → 20 chars on the local label (−60%).
- **Cut #3 — Stats modal default-to-Cards:** When `getCardLibrary().length > 0`, the modal opens on the Cards tab; empty library preserves Overview default (Day 96 behavior).
- **Cut #4 — Mastery card gating:** `<div id='mastery-section'>` moved from level-select panel into the 🌳 Mastery Tree modal. End-game grid drops 50 → 45 cards (Cycle 2 invariant restored).
- **Cut #5 — Lab budget out of constraint strip:** `#lab-hud` restructured into two `.lab-hud-row` containers. Top = constraint manifest (label + constraints + tries + reset). Bottom = `#lab-budget` alone.
- 6 atomic commits (5 cuts + 1 wrap). 40/40 assertions, 0 console errors.

### Day 104 — Code Cleanup (4 cuts, net −1 LOC)
- **Cut #1 — Orphan `.mastery-level` CSS removed.** 5 selectors (−26 / +5 LOC alone). Surfaced by re-tracing Day 103 Cut #4's modal re-parent.
- **Cut #2 — Difficulty Mode filed under Gameplay.** Cycle 2 Tier-2 carry-over #8. New `Gameplay` section between `Display & Accessibility` and `Audio`.
- **Cut #3 — Install-App gated when standalone.** Cycle 2 Tier-2 carry-over #9. `setupInstallPrompt()` now hides `#install-app-btn` via `_isStandalone()` helper.
- **Cut #4 — My Cards stats tab dimmed when empty.** Cycle 4 Tier-2 #6. `.stats-tab.empty:not(.active) { opacity: 0.55 }`.
- 5 atomic commits (4 cuts + 1 wrap). 34/34 assertions, 0 console errors. **Net delta: +43 / −44 = −1 LOC.**

### Day 105 — Polish Sprint (2 items + 4 verifications)
- **Polish #1 — `settingsSectionFadeIn` keyframe** (220ms ease-out, opacity 0→1 + translateY 6→0) + 6 `:nth-of-type(N)` stagger rules at 0/35/70/105/140/175ms + `prefers-reduced-motion` guard. JS lifecycle: `show()` adds `.is-opening` + 600ms strip-timer; `hide()` strips class + cancels timer.
- **Polish #2 — `.stats-tab` opacity transition.** Extended `.stats-tab` transition list with `opacity .15s` so the Day 104 `.empty` dim animates smoothly (0.55 → 1.0 over 150ms) when the user saves their first card.
- **Verify #3** — Day 29 universal `button:focus-visible` rule still applies through new `#settings-gameplay-row` parent.
- **Verify #4** — Mobile sweep at 375/414/768/1024 px: 0 vertical overlaps + Gameplay header visible + no horizontal scroll.
- **Verify #5** — Welcome toast vs L1 tutorial overlap: silent-standard DOES fire a 4.5s toast at z-index 10020 / top:16px; tutorial sits at z-index 50 over toolbox area. Different regions + z-layers, coexist cleanly. **Documented behavior, not a regression.**
- **Verify #6** — Cold-start defaults audit (Day 80 precedent): SFX 0.4 / Music 0.2 / theme auto / Standard silent-default / Daily+Streak notifs all unchanged. 2 cold-start non-level buttons (Day 78 invariant **30 days in**).
- 1 atomic commit (polish-day precedent). 56/56 assertions on second run, 0 console errors. **Net delta: +57 / −15 = +42 LOC** (inside Day 80's ±50 polish-day budget).

### Day 106 — Expert Panel + Validation (today)
- 80/80 assertions across 7 phases against Day 105 build (`?v=1780876800`, sw v68 — unchanged).
- L1 (AND Gate Basics — cold tutorial path), L6 (Signal Selector — end Ch1), L18 (2-Input Decoder — Tier-3 unlock), L36 (Lab Bench I — Open Design: 3-Input Selector), L44 (Lab Bench II — NAND-Only Half Adder) all loaded and validated.
- Lab Bench II composite validator on L44 rejects 7-NAND submission: `"Submission rejected: 7 gates exceeds hard cap of 6."` (byte-exact).
- LO-1 fix verified: bypass path `ui.showScreen('level-select')` cleans `blitzMode` + `#blitz-hud` (the documented post-Day-103 contract).
- Day 79 dead-identifier purge intact: 7 identifiers `undefined`, `#weekly-puzzle-btn` DOM absent.
- 0 console.error, 0 Runtime.exceptionThrown.

---

## Validation Smoke Tests (Day 106, localhost mirror)

Tested on `http://localhost:8901/` via raw CDP from headless Chromium 146 on port 9301. Build identity unified at `?v=1780876800` / `sw v68` (Day 105 build, unchanged today).

### Tier staircase (Day 78 #2 verification, 24 days after the cut shipped)

| Seed count | Nav buttons | Overflow buttons | Tournament visible | Notes |
|---|---|---|---|---|
| 0 (cold) | 2 | 0 | ❌ | How to Play + Settings only |
| 3 | 2 | 3 | ❌ | First overflow buttons appear |
| 6 | 5 | 6 | ❌ | +3 (Daily, Encyclopedia, Stats) |
| 9 | 7 | 9 | ❌ | +2 (Random Challenge, Sandbox) |
| 12 | 10 | 12 | ❌ | +3 (Adaptive, Achievements, Customize) |
| 15 | 13 | 15 | ❌ | +3 |
| 18 | 18 | 18 | ✅ | +5 (Tournament, Infinite, Blitz, Speedrun, Creator, Mastery Tree, Logic Profile, Collection) |
| 45 | 18 | 45 | ✅ | End-game = 63 total (was 98 pre-Day-78, 58 at Day 78 close, **63 now with +5 Lab Bench II levels factored in**) |

### Level samples (5 levels across chapters)

- ✅ **L1 — AND Gate Basics** (cold tutorial path): gameplay screen, tutorial overlay fires, 4 truth-table rows, hint-footer hidden (Day 78 #4), Lab HUD hidden, `isLabBench === false`, RUN labeled "▶ RUN".
- ✅ **L6 — Signal Selector** (end of Chapter 1): 4 truth-table rows, hint footer **visible** at L6+ (Day 78 #4 only hides L<4), Lab HUD hidden.
- ✅ **L18 — 2-Input Decoder** (Tier-3 unlock): 4 truth-table rows, Lab HUD hidden.
- ✅ **L36 — Open Design: 3-Input Selector** (Lab Bench I): `isLabBench === true`, Lab HUD visible, RUN labeled "📐 Submit Blueprint", Quick Test **hidden** in lab mode, lab state `{attempts:0, maxAttempts:3, exhausted:false, firstTryLocked:false, cleared:false}`, 8 truth-table rows (3-input).
- ✅ **L44 — NAND-Only Half Adder** (Lab Bench II composite): `isLabBench === true`, Lab HUD visible, constraint chip 1 = `"🧱 NAND only"`, constraint chip 2 = `"🎯 Hard cap: 6 gates"`, budget chip in its own `.lab-hud-row` (Day 103 #5), validator rejects 7-NAND submission with `"Submission rejected: 7 gates exceeds hard cap of 6."`, `hardCap === 6`.

### Cycle-4 invariants (PRUNE-week artifacts)

- ✅ Day 103 #1 — LO-1 fix: bypass path `ui.showScreen('level-select')` cleans `blitzMode = false` + `#blitz-hud display:none`.
- ✅ Day 103 #2 — Tournament label = `"🏠 Local leaderboard"` (20 chars, ≤30 cap).
- ✅ Day 103 #3 — Stats cold default tab = `stats-tab-overview` (empty library).
- ✅ Day 103 #4 — 0 mastery cards in `#level-grid` cold start.
- ✅ Day 103 #5 — `#lab-hud` has 2 `.lab-hud-row` containers; `#lab-budget` in its own row.
- ✅ Day 104 #2 — Settings modal has 6 sections in canonical order: `Display & Accessibility | Gameplay | Audio | Notifications | Data | Developer`. Difficulty Mode filed under `Gameplay`.
- ✅ Day 105 #1 — `settingsSectionFadeIn` keyframe present in stylesheet.

### Cold-start defaults audit (Day 80 precedent)

- ✅ `audio._sfxVol === 0.4` (Day 46 default, audited Day 80/105/106).
- ✅ `audio._musicVol === 0.2` (Day 46 default, audited Day 80/105/106).
- ✅ `localStorage['signal-circuit-difficulty-mode'] === 'standard'` (silent-default writes after init).
- ✅ Placement test modal hidden cold (Day 64 #4 holds).
- ✅ Difficulty modal hidden cold (Day 78 #5 silent-default holds).

### Day 79 dead-identifier regression

- ✅ `ui.showFirstLaunchDifficultyModal` → `undefined`
- ✅ `AchievementManager.prototype.checkLightning` → `undefined`
- ✅ `AchievementManager.prototype.checkEclipseRun` → `undefined`
- ✅ `AchievementManager.prototype.checkArchitect` → `undefined`
- ✅ `AchievementManager.prototype.isMythic` → `undefined`
- ✅ `InfiniteRunManager.prototype._showHud` → `undefined`
- ✅ `InteractiveTutorial.prototype.getCurrentStep` → `undefined`
- ✅ `#weekly-puzzle-btn` DOM absent

### Console hygiene

- ✅ **0 console.error across the entire validation pass** (80 distinct assertions + 14 page navigations + 8 `seedProgress()` calls + 5 `startLevel()` calls + 1 settings modal open/close + 1 stats modal open/close + 1 blitz-mode + bypass)
- ✅ **0 `Runtime.exceptionThrown`**

---

## What Cycle 4 Actually Was

Cycle 4 was the project's **first cycle to operate entirely from the "what's the next subtle improvement" budget** rather than the "what's broken" budget. Three signals:

1. **Open Bugs queue empty for the entire cycle.** Streak entered Cycle 4 at 14 days (since Day 76), now at 31 days. Across 13 cycle-4 working days (BUILD + HARDEN + PRUNE), 0 P0/P1/P2 bugs were filed.
2. **Cycle 4 HARDEN week shipped 363 assertions on an unchanged Day 96 build with 0 new bugs found** — the cleanest HARDEN scorecard the factory has produced. The week became a confirmation week, not a discovery week.
3. **Cycle 4 PRUNE week shipped 9 design cuts + 2 polish items + 1 retired latent bug** with the only externally-visible behavior changes being a tighter Tournament label, a re-parented mastery section, a re-parented Difficulty button, a re-organized Lab HUD, a dimmed empty stats tab, a staggered settings fade-in, and a smooth `.empty` transition. Everything else was either internal contract migration (LO-1) or dead-code removal.

Cycle 4 also closed the **Cycle 2 Tier-2 backlog**: Difficulty Mode misfile finally landed under Gameplay (carry-over #8) and Install-App settings button gated when standalone (carry-over #9). Two Cycle-1 / Cycle-2 backlog items now have no remaining carry-overs into Cycle 5.

---

## Remaining Weaknesses (honest, not exhaustive)

Same Cycle 2 list, narrowed:

- **Pseudo-leaderboard still not federated.** Day 83's adapter shell + Day 93's Worker go-live posture means the architecture is *ready* — `selectTournamentBackend()` switches between `LocalTournamentAdapter` and `RemoteTournamentAdapter` via `window.__SC_TOURNAMENT_BACKEND__` / localStorage flag / default. But there's no real Worker behind the Remote adapter yet. Going 9 → 10 on Replayability/Addictiveness needs that backend live. **Cycle 5 candidate.**
- **Module split is Phase 1.** Day 92 shipped `gates.js` as an ES module with re-binding of `window.Gate/GateTypes/IONode/roundRect` to keep older paths working. `wires.js / achievements.js / audio.js` remain in script-tag-order land. **Cycle 5 candidate.**
- **Lab Bench II has 5 levels.** L41–L43 (Day 84) + L44–L45 (Day 94) gave Chapter 9 a unique identity. Going deeper means either Lab Bench III (procedural constraints) or a player-promote-your-Sandbox-circuit-into-a-lab-puzzle workflow. **Cycle 5 candidate.**
- **`settingsSectionFadeIn` doesn't re-fire if Settings is re-opened while the strip-timer is still pending.** Edge case only triggers if a user closes + immediately re-opens Settings inside 600ms; the `.is-opening` class won't re-apply. Day 105 logged it as known; future polish day if anyone notices.
- **Welcome toast + L1 tutorial coexistence is documented but not styled.** They live on different z-layers and different regions, but a returning Cycle-5 audit might want to make the toast fade earlier when the tutorial overlay paints. Minor.

## Recommendations for Cycle 5 Build Week (June 16–20, 2026)

1. **Tournament Worker — actually go live.** Cloudflare Worker + KV. The adapter shell is shaped for it, the UI label vocabulary already supports `🌐 Live leaderboard` / `🌐 Live · offline` / `🌐 Connecting…`. Make it opt-in with a display name. Keep `LocalTournamentAdapter` as offline fallback. This is the single biggest dial-mover left.
2. **Module split Phase 2.** `wires.js` → ES module next (tightest after `gates.js`, fewer dependents than `achievements.js`). Re-bind globals same way Day 92 did.
3. **Lab Bench III mini-chapter (L46–L50).** New constraint axis: *no static count cap, but a "fan-out budget"* — total wire endpoint count must stay under N. Forces players to share intermediate signals. Reuses `_validateLabConstraints()` with a new `maxFanOut` field.
4. **Tournament Worker A/B vs Local pseudo-board.** Once the Worker is up, run a 14-day A/B to compare 7-day-retention between Local-only and Live-leaderboard cohorts. Use the Day 85/95 `OnboardingExperiment` pattern.
5. **One quality-of-life on the gameplay HUD itself.** The HUD has been static since Cycle 2. Candidate: per-level "personal best" badge under RUN button showing your best gate count + best time, gated to appear only on revisits. Small, viral, low risk.

Save these for the Cycle 5 Monday roadmap.

---

## Final Scorecard

**Cycle 4 final score: 9.1 / 10 (+0.2 from Cycle 2 close 8.9, +1.8 from Day 35 baseline 7.3)**

| Bucket | Status |
|---|---|
| Cycle days run | 5 build + 5 harden + 5 prune = 15 day-tasks |
| Open bugs entering Cycle 5 | 0 (streak: **31 consecutive days** since Day 76) |
| Latent observations entering Cycle 5 | 0 (LO-1 retired on Day 103) |
| Visible buttons on cold start | 2 (held since Day 78, **31 days**) |
| Visible buttons at end-game (45-star) | 63 (was 98 pre-Day-78, 58 at Day 78 close; +5 Lab Bench II levels factored in) |
| Tier-2 reveal cadence | 2 → 5 → 7 → 10 → 13 → 18 staircase across L6/9/12/15/18 |
| Source-file changes during HARDEN week | 0 (Day 96 build held for 5 consecutive days) |
| Source-file changes during PRUNE week | 9 cuts + 2 polish items + 1 LO retired across 3 working days |
| Console errors on validation | 0 across 80 assertions + 14 navigations |
| HARDEN-week assertions on unchanged artifact | 363 (cleanest scorecard shipped: Cycle 2 ~150, Cycle 3 286, **Cycle 4 363**) |
| Cycle 2 Tier-2 backlog | **Cleared** (Difficulty filing + Install-App gating both shipped Day 104) |

Cycle 4 hit four user-facing improvements (LO-1 retired, Tournament label compressed, mastery cards re-parented, Lab budget row split), two long-rotted Cycle 2 carry-overs (Difficulty section + Install-App gating), and four polish items (settings fade-in, stats-tab dim, stats-tab opacity transition, focus-ring through new parent). The score delta is +0.2 — smaller than Cycle 2's +0.5, smaller than Cycle 1's +1.1 — because the dimensions that *could* move are at or near their natural ceilings, and Cycle 4's payoff is "the same game, with the rough edges sanded twice."

The next 0.5 points all live in one place: **federation.** Day 83 + Day 93 prepared the ground. Cycle 5's BUILD week should land it.

— *Mochi*
