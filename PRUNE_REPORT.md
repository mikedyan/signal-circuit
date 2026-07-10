# PRUNE REPORT — Cycle 6, Prune Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-07-10 (Friday) · cycleDay 84 · Day 133
**Cycle:** 6
**Build under audit:** `index.html?v=1783036800`, SW `signal-circuit-v81` (Day 127 build — unchanged through the entire Cycle 6 HARDEN week, Days 128/129/130/131/132).
**Auditor pose:** First-time player landing on https://mikedyan.github.io/signal-circuit/ with `localStorage` wiped, then progressing through tier gates via `GameState.seedProgress()` at counts 0/3/6/12/18/50.
**Prior PRUNE_REPORT:** Cycle 5, 2026-06-25, clutterScore = 4/10 (Cycle 4 closed 4/10, Cycle 2 5/10, Cycle 1 baseline 8/10).
**Harness:** `qa-reports/day-133-qa.cdp.js` — **37/37 assertions, 0 console.error, 0 Runtime.exceptionThrown** (35/37 first run — 2 harness self-bugs on wrong element ids, fixed harness-side, 0 app changes).

---

## TL;DR

**The three-cycle-old nav plateau finally broke.** For three cycles running (2, 4, 5) the single heaviest clutter carry-over was five separate "what have I collected" nav buttons — `🏆 Achievements` / `🌳 Mastery Tree` / `🎨 Customize` / `🗂️ Collection` / `🧬 Logic Profile`. **Cycle 6 BUILD Day 124 shipped the merge**: those five buttons are now one `🗂️ Profile` hub with five tabs. The measurable result on the deployed build today:

```
seed= 0 → nav= 2  overflow= 0  cards=50   (cold start)
seed= 3 → nav= 2  overflow= 3  cards=50
seed= 6 → nav= 5  overflow= 6  cards=50
seed=12 → nav= 9  overflow=12  cards=50
seed=18 → nav=14  overflow=18  cards=50
seed=50 → nav=14  overflow=50  cards=50   (end-game)
```

**End-game nav dropped 18 → 14.** That is the biggest single reduction the nav bar has seen since the Day 78 staircase, and it retired the exact carry-over that held the clutter score at 4/10 for three cycles.

The Cycle 5 Tier-1 cuts also all held: a brand-new player opening Stats sees **exactly one tab** (`📊 Overview`) — the empty `My Cards (0)` and `Tournament (0)` tabs stay hidden (Day 119), and the Day 127 `📈 Progress` heatmap tab stays hidden until ≥1 level is complete. `⚠ Reset Progress` is behind the Day 119 typed-confirm. The core loop is the cleanest it's ever been.

**But the clutter migrated — again — this time into the Settings modal.** Cycle 5's new surfaces went into the Stats modal; Cycle 6's went into Settings. Day 125 added a **`Tournament (Online)` section with 4 buttons + 2 text inputs** (`🔌 Connect` / `🏠 Go Local` / `💾 Save Name` / `🖩 Anonymous` + a worker-URL field + a display-name field). Settings now renders **17 buttons** for a normal player. That whole section is inert for anyone who hasn't stood up their own Cloudflare Worker — i.e. ~100% of players. It's the single new clutter source this cycle.

Everything else Cycle 6 added is PRUNE-shaped already:
- **Day 123** (simulation.js → ES module): invisible, structural.
- **Day 126** (onboarding A/B cohort readout): correctly debug-gated — the Developer section stays hidden, cohort never leaks to normal players (verified: `getCohort()` resolves but the readout card is behind `signal-circuit-debug=1`).
- **Day 127** (Stats Progress heatmap): correctly hidden-when-empty; new players never see it.

## Clutter Score: **4 / 10**

(10 = unplayably overwhelming, 1 = monk-tier minimal). **Held at 4/10**, but the composition shifted in a healthy direction: the nav bar got materially lighter (the 18→14 Profile-hub merge is a genuine win in the surface where players spend the most attention), while the Settings modal absorbed a new power-user section that drags the number back. Net-neutral on the number, net-positive on where the weight sits — nav clutter is worse than settings clutter because the nav bar is always on screen and Settings is opt-in.

| Stage | seed | Nav buttons | Overflow buttons | Level cards | Per-tier score | Δ vs Cycle 5 |
|---|---|---|---|---|---|---|
| Cold start | 0 | 2 | 0 | 50 | 1/10 | — |
| Tier 1 | 3 | 2 | 3 | 50 | 2/10 | — |
| Tier 1.5 (end Ch1) | 6 | 5 | 6 | 50 | 3/10 | — |
| Tier 2 mid | 12 | 9 | 12 | 50 | 3/10 | −1 nav (was 10) |
| Tier 3 | 18 | 14 | 18 | 50 | 4/10 | **−4 nav (was 18)** |
| End-game | 50 | 14 | 50 | 50 | 5/10 | **−4 nav (was 18)** |

The staircase is smoother than any prior cycle — no cliff, and the Tier-3 plateau that Cycle 2/4/5 all flagged is now a 14-button plateau instead of 18. Cards hold at 50 (mastery gated out of the grid since Day 103).

---

## Headcount Walk (deployed build, fresh profile, all measured live)

### Cold start (`localStorage` cleared, `?v=1783036800`)

- Onboarding modals before Level 1: **0** (silent-default difficulty, variant `silent-standard`)
- Total visible non-level buttons: **2** (`how-to-play-btn`, `open-settings-btn`)
- Level cards visible: **50** (40 campaign + Lab Bench I/II/III L36–50)
- Overflow `⋯` menus: **0**

### Settings modal (17 buttons + 2 sliders + 7 sections)

Sections (canonical order): **Display & Accessibility / Gameplay / Audio / Notifications / Tournament (Online) / Data / Developer**.

- DISPLAY & ACCESSIBILITY (5): Colorblind, Text, Simplified, Accessible Wiring, Light Mode
- GAMEPLAY (1): `🔧 Mode: Standard`
- AUDIO (2 sliders)
- NOTIFICATIONS (2): Daily, Streak
- **TOURNAMENT (ONLINE) (4 buttons + 2 inputs): `🔌 Connect` / `🏠 Go Local` / `💾 Save Name` / `🖩 Anonymous` + worker-URL field + display-name field** ← Day 125, **new clutter (Cut #1)**
- DATA (4): Export, Import, `📲 Install App`, `⚠ Reset Progress` (typed-confirm since Day 119)
- DEVELOPER: hidden by default; visible only with `signal-circuit-debug=1` (Day 126 cohort readout lives here — correctly gated)
- Plus Close

### Stats modal — new player sees **1 visible tab**

`📊 Overview` only. `📸 My Cards (0)` + `🏆 Tournament (0)` hidden until non-empty (Day 119); `📈 Progress` heatmap hidden until ≥1 level done (Day 127). After 10 completions: Overview + Progress visible (2 tabs), heatmap summary reads `10 / 50 levels · ★ 30 / 150 · tap-hold a cell for details`, 11 chapter cells render. **This is exemplary hidden-when-empty discipline — the 4-tab Stats modal never shows 4 tabs to someone who hasn't earned them.**

### Profile hub — Day 124 merge (5 → 1)

Single `🗂️ Profile` button (reveals at g12) opens a modal with 5 tabs: `🏆 Achievements` / `🌳 Mastery` / `🎨 Customize` / `🗂️ Collection` / `🧬 Logic`. The 5 old top-level buttons (`achievements-btn`, `customize-btn`, `mastery-tree-btn`, `collection-btn`, `profile-btn`) are gone from the nav.

---

## What's New Since Cycle 5 PRUNE Closed (Day 122)

Ten factory days (Day 123 → Day 132) shipped Cycle 6 BUILD + Cycle 6 HARDEN. Five user-relevant surfaces are new:

| # | Day | Surface | Cluttery? | Notes |
|---|-----|---------|-----------|-------|
| 1 | 123 | `simulation.js` → ES module | No | Structural only; no UI change (`game.simulation instanceof window.Simulation` verified) |
| 2 | 124 | 5 collection modals → 1 `🗂️ Profile` hub | **De-clutter** | Nav 18 → 14. Retires the 3-cycle carry-over. |
| 3 | 125 | `Tournament (Online)` settings section | **Yes** | Cut #1 — 4 buttons + 2 inputs for a self-hosted-worker feature |
| 4 | 126 | Onboarding A/B cohort readout | No | Debug-gated; Developer section hidden by default (verified no leak) |
| 5 | 127 | Stats `📈 Progress` heatmap tab | No | Hidden-when-empty; new player never sees it |

Day 124 is a rare BUILD-week surface that *reduces* clutter. Only Day 125 carries a cut this cycle.

---

## Cycle 5 Cuts Status Recap

- ✅ Tier-1 #1: De-dup tournament history (drop `My Best` from Tournament screen) — shipped Day 119, verified
- ✅ Tier-1 #2: `⚠ Reset Progress` typed-confirm — shipped Day 119, verified (still armed today)
- ✅ Tier-1 #3: Hide zero-count Stats tabs — shipped Day 119, **verified today: new player sees 1 tab**
- ✅ Tier-2 #4: **Merge 5 collection modals** — **SHIPPED Day 124** (promoted to a dedicated BUILD day; the carry-over that outlived Cycles 2, 4, and 5 is finally done)
- ❌ Tier-3 #7: Lab Bench collapsible chapter group — **NOT SHIPPED** (re-proposed below)

Cycle 5's three Tier-1 cuts landed on schedule, and its heaviest Tier-2 carry-over got promoted and shipped in Cycle 6 BUILD. The best cut-completion cycle so far.

---

## Proposed Cuts (ranked by impact ÷ risk)

### 🔪 Tier 1 — Highest Impact, Lowest Risk (do Day 134, Design Simplification)

1. **Collapse the Settings `Tournament (Online)` section behind an "Advanced" disclosure (collapsed by default), or relocate it into the debug-gated Developer section.** This is the single new clutter source in Cycle 6. The Connect / Go Local / Save Name / Anonymous buttons + worker-URL input + display-name input only do anything if the player has stood up their own Cloudflare Worker and has a URL to paste — effectively a developer feature, sitting inline in Settings between Notifications and Data. **Recommendation:** wrap the section body in a collapsed `<details>`-style disclosure ("⚙️ Advanced: Online Tournament") so a normal player sees a one-line header they can ignore, and only power-users expand it. Net: Settings drops from **17 → 13 visible buttons** for the ~100% of players who never touch it. The opt-in display-name (the privacy-positive Day 125 piece) rides along inside the disclosure. *Removes 4 always-visible buttons + 2 inputs from the default Settings view; zero feature loss.*

2. **Trim the Progress-heatmap summary instructional tail.** The Day 127 summary line renders `10 / 50 levels · ★ 30 / 150 · tap-hold a cell for details` on **every** render. The `· tap-hold a cell for details` is a persistent how-to instruction baked into a stat line — it belongs in a `title`/tooltip or a one-time first-open hint, not permanently welded to the numbers. Trim the summary to `10 / 50 levels · ★ 30 / 150` and move the affordance hint to the cell `title` attribute (or a single dismissible hint row). *Wordy-text cut; makes the stat read as data, not a manual.*

### 🪒 Tier 2 — Medium Impact (Day 135 Code Cleanup / larger refactor)

3. **Day 79 dead-id sweep for the 5 retired collection buttons (Day 124 fallout).** The Day 124 merge left five now-dead button ids (`achievements-btn`, `customize-btn`, `mastery-tree-btn`, `collection-btn`, `profile-btn`) and five `setup*` methods (`setupAchievements` / `setupMasteryTree` / `setupCircuitCollection` / `setupLogicProfile` / `setupCosmeticModal`) that now no-op on absent elements. Fold the dead ids into the Day 79 dead-identifier sweep and remove the orphaned wiring. Natural Day-135 Code-Cleanup work; **net-negative LOC** (satisfies the PRUNE mandate). Verify the 5 render methods still reachable through the hub before deleting any setup scaffolding.

4. **Consider a `🎮 Modes` hub for the challenge-mode buttons (the next nav plateau).** At end-game, 7 of the 14 nav buttons are "play a variant": `tournament` / `daily-challenge` / `adaptive-challenge` / `infinite-mode` / `random-challenge` / `blitz-mode` / `speedrun`. The Day 124 Profile-hub merge is the proven pattern — a single `🎮 Modes` (or "More Ways to Play") hub could fold those 7 into one, dropping nav **14 → ~8**. Higher risk than the Profile merge (each mode has its own pre-screen/config flow and tier-gate), so this is a **dedicated BUILD-scale item, not a quick PRUNE cut** — flag it for Cycle 7 BUILD rather than forcing it into this week. Noting it here so the next BUILD roadmap picks it up.

5. **Lab Bench collapsible chapter group (Cycle 5 Tier-3 #7 carry-over).** With 15 lab levels across 3 mini-chapters (Lab Bench I/II/III, L36–50), the end-game grid reads as 50 flat cards, 30% of which are post-campaign bonus. A collapsible "Lab Bench" chapter-group header (collapsed by default once the campaign is cleared) keeps the grid scannable and frames the bonus track as a deliberate destination. Pairs with the existing chapter metadata (Chapters 9/10/11 = Lab Bench I/II/III).

### 🌿 Tier 3 — Polish (Day 136 Polish Sprint)

6. **Tournament mode-label cross-fade** (carry-over from Cycle 4 Tier-2 / Cycle 5 Tier-3 #8). Day 93's four-state label still snaps; a 250ms cross-fade on `cloud-ready → remote-fallback` reads as a status, not a flash.

7. **Progress-heatmap cell tap-hold detail affordance.** Once the summary instruction (Cut #2) moves off the stat line, give the cells a proper hover/tap-hold detail popover (chapter name + N/M + ★earned/max) so the interaction the summary currently advertises is actually discoverable and polished.

8. **Coverage-rotation debt — RETIRED.** The 4-cycle-old note (flagged Days 89/117) about the HARDEN harness converging on its own greatest hits was addressed in Cycle 6 HARDEN (Day 128 Sandbox deep-play + cosmetic×colorblind probes; Day 130 four BUILD-surface churn tests). No longer a standing concern; removing from the backlog.

---

## Day 2 Plan (Day 134, Design Simplification)

Ship the 2 Tier-1 cuts, atomic-per-cut + one wrap commit (Day 78/103/119 precedent), cache-bust + SW bump together:

1. **Cut #1 (Tournament Online → collapsed disclosure)** — wrap `#settings-tournament-section` body in a collapsed disclosure; header stays, buttons/inputs hide until expanded. Verify Connect/Go Local/Save Name still work when expanded, and that the Day 125 privacy behavior (Anonymous by default) is unchanged.
2. **Cut #2 (heatmap summary trim)** — strip the `· tap-hold a cell for details` tail from `_renderProgressHeatmap()`'s summary; move the hint to the cell `title`.

Re-run the Day 133 CDP harness as the regression baseline. **PRUNE week = net-negative code; remove more than you add.** Cut #1 is a wrap (near-neutral), Cut #2 is a removal — net should land at or below zero.

**Day 3 (Day 135) Code Cleanup:** Tier-2 Cut #3 — dead-id sweep for the 5 retired collection buttons + orphaned `setup*` wiring.
**Day 4 (Day 136) Polish Sprint:** Tier-3 cuts #6/#7 + cold-start defaults re-audit.
**Day 5 (Day 137) Expert Panel + Validation:** play 5 levels across chapters, re-score 10 dimensions, target ≥9.2 (Cycle 5 closed 9.2 — hold-don't-drop), write `reviews/prune-cycle-6-review.md`, close Cycle 6 PRUNE Week (and the 90-day cycle window).

---

## Where the Eyes Snag (2026-07-10 walkthrough)

A **first-time player** meets: zero onboarding ceremony → 2 buttons + 50 cards, L1 tutorial fires. **Clean.**

A **mid-game player** (Tier 2, 12 levels) meets: smooth reveal, 9 nav buttons (was 10 pre-merge). **Clean.**

A **Tier-3 player** (18 levels) meets: **14 nav buttons** — down from 18, with the five collection modals now one `🗂️ Profile` hub. The three-cycle plateau is materially lighter.

An **end-game player** (50 levels) meets: 14 nav buttons, a 50-card grid with 15 Lab Bench bonus cards (Cut #5), and 7 "play a variant" buttons that could one day be a `🎮 Modes` hub (Cut #4).

A player **opening Stats for the first time** meets: **one tab** (Overview). Exemplary.

A player **in Settings** meets: a **`Tournament (Online)` section with 4 buttons + 2 inputs** for a self-hosted-worker feature they will almost certainly never use (Cut #1) — the one place clutter grew this cycle.

A player **reading the Progress heatmap** meets: a stat line with a permanent how-to instruction welded to it (Cut #2).

---

## Console Hygiene

**0 console.error** across 37 assertions / multiple navigations / 6 reload cycles.
**0 Runtime.exceptionThrown** across the full audit.

---

*End of Cycle 6 PRUNE_REPORT.*
*Clutter Score: 4/10 (held from Cycle 5; Cycle 2 closed 5/10, Cycle 1 baseline 8/10).*
*The 3-cycle collection-modal carry-over is RETIRED (Day 124 Profile-hub merge, nav 18→14). One new clutter source (Day 125 Tournament-Online settings section) → Tier-1 Cut #1. One wordy-text cut (heatmap summary) → Tier-1 Cut #2. Two Tier-2 items (dead-id sweep, future Modes-hub), two Tier-3 polish items. Coverage-rotation debt retired.*
*Collapsing the Tournament-Online settings section is the first Tier-1 cut, lands Day 134.*
