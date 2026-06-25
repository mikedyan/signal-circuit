# PRUNE REPORT — Cycle 5, Prune Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-06-25 (Thursday) · cycleDay 69 · Day 118
**Cycle:** 5
**Build under audit:** `index.html?v=1781395200`, SW `signal-circuit-v73` (Day 111 build — unchanged through the entire Cycle 5 HARDEN week, Days 112/114/115/116/117).
**Auditor pose:** First-time player landing on https://mikedyan.github.io/signal-circuit/ with `localStorage` wiped, then progressing through tier gates via `GameState.seedProgress()` at counts 0/3/6/12/18/50.
**Prior PRUNE_REPORT:** Cycle 4, 2026-06-09, clutterScore = 4/10 (Cycle 2 closed at 5/10, Cycle 1 baseline 8/10).
**Harness:** `qa-reports/day-118-qa.cdp.js` — **44/44 assertions, 0 console.error, 0 Runtime.exceptionThrown.**

---

## TL;DR

The Day 78 staircase + Day 79 dead-code purge are still doing their job 40 days on. Cold start is **2 nav buttons + 50 cards**, the tier reveal cadence is smooth (`nav 2 → 2 → 5 → 10 → 18`, overflow rising 1:1 with completions), and the core loop is as clean as it's ever been. Cycle 4's Tier-1 cuts all held: LO-1 is retired, mastery cards stay out of the campaign grid (50 cards, not 55), Difficulty Mode is filed under a Gameplay section, the Tournament label is a tidy 20-char `🏠 Local leaderboard`.

**The clutter has migrated into the modals.** Three of this cycle's five BUILD-week features (Days 107–111) live behind existing surfaces, which is good PRUNE posture — but two of them created **duplication and empty-state noise inside the Stats modal and the Tournament screen**:

1. **Tournament history now lives in TWO places.** The Tournament screen has its own `This Week / My Best / Archive` tabs (Day 83/108), and the Stats modal *also* grew a `🏆 Tournament` tab (Day 111). A first-time player who finds their tournament standings under Stats has no way to know there's a whole separate Tournament screen, and vice versa. `My Best` (Tournament screen) and `🏆 Tournament` (Stats) answer the same question — "how have I done in tournaments?" — in two different modals.

2. **The Stats modal shows two `(0)` tabs to brand-new players.** `📸 My Cards (0)` and `🏆 Tournament (0)` both render as clickable tabs leading to empty grids before the player has ever saved a card or entered a tournament. Day 104 dimmed empty tabs with a `.empty` class, but they still occupy the tab strip and invite a dead-end click. A new player opening Stats sees three tabs, two of which are empty.

3. **Lab Bench is now a 15-level, 3-mini-chapter track** (Lab Bench I L36–40, II L41–45, III L46–50). That's **30% of the 50-card grid** that is post-campaign bonus content. Each BUILD cycle has bolted on another Lab Bench mini-chapter and another constraint axis (Day 84 hard-cap, Day 94 must-include, Day 109 fan-out). L48 now stacks **three constraint chips** (`🧱 NAND only` + `🎯 Hard cap: 3` + fan-out budget) side by side. This is intentional "constraint manifest" design, but the lab track's growth is worth a deliberate look before Lab Bench IV gets proposed in Cycle 6.

Plus the two long-standing carry-overs:

4. **`⚠ Reset Progress` is still a one-click button** at the bottom of Settings. One mis-tap wipes the save. Cycle 4 explicitly deferred the typed-confirm gate to **Cycle 5 PRUNE Tier-1** — that's now.

5. **18 nav buttons at Tier 3.** The five "what have I collected" modals (`🏆 Achievements` / `🌳 Mastery Tree` / `🎨 Customize` / `🗂️ Collection` / `🧬 Logic Profile`) are still five separate nav buttons. This is the heaviest remaining nav clutter and the same carry-over Cycle 2 and Cycle 4 both punted.

## Clutter Score: **4 / 10**

(10 = unplayably overwhelming, 1 = monk-tier minimal). Held at Cycle 4's 4/10 — the core loop and early/mid game got no worse, but the modal layer (Stats tabs, Tournament redundancy) absorbed the new BUILD-week surfaces. Weighted by where players spend time (most live in the L6–L18 range), the early experience is still notably tight.

| Stage | seed | Nav buttons | Overflow buttons | Level cards | Per-tier score |
|---|---|---|---|---|---|
| Cold start | 0 | 2 | 0 | 50 | 1/10 |
| Tier 1 | 3 | 2 | 3 | 50 | 2/10 |
| Tier 1.5 (end Ch1) | 6 | 5 | 6 | 50 | 3/10 |
| Tier 2 mid | 12 | 10 | 12 | 50 | 4/10 |
| Tier 3 | 18 | 18 | 18 | 50 | 5/10 |
| End-game | 50 | 18 | 50 | 50 | 6/10 |

The staircase smoothness assertion lands cleanly again — no cliff between tiers, just the same 18-button Tier-3 plateau (Cut #5 territory). Cards hold at 50 across every seed (mastery gated out of the grid since Day 103 holds).

---

## Headcount Walk (deployed build, fresh profile, all measured live)

### Cold start (`localStorage` cleared, `?v=1781395200`)

- Onboarding modals before Level 1: **0** (silent-default difficulty, variant `silent-standard`)
- Total visible non-level buttons: **2** (`how-to-play-btn`, `open-settings-btn`)
- Level cards visible: **50** (40 campaign + 5 Lab Bench I/II + 5 Lab Bench III)
- Overflow `⋯` menus: **0**

### Tier staircase (live `seedProgress` readings)

```
seed= 0 → nav= 2  overflow= 0  cards=50
seed= 3 → nav= 2  overflow= 3  cards=50
seed= 6 → nav= 5  overflow= 6  cards=50
seed=12 → nav=10  overflow=12  cards=50
seed=18 → nav=18  overflow=18  cards=50
seed=50 → nav=18  overflow=50  cards=50
```

### Settings modal (13 buttons + 2 sliders + 6 sections)

Sections (canonical order, Day 104): **Display & Accessibility / Gameplay / Audio / Notifications / Data / Developer**.

- DISPLAY & ACCESSIBILITY (5 buttons): Colorblind, Text, Simplified, Accessible Wiring, Light Mode
- GAMEPLAY (1 button): **🔧 Mode: Standard** (Day 104 carry-over fix landed — now correctly filed here)
- AUDIO (2 sliders)
- NOTIFICATIONS (2 buttons): Daily, Streak
- DATA (4 buttons): Export, Import, **📲 Install App**, **⚠ Reset Progress**
- DEVELOPER (hidden by default; visible only with `signal-circuit-debug=1`)
- Plus Close

`📲 Install App` was visible in the headless (non-standalone) audit — that is correct behavior; the Day 104 `_isStandalone()` gate only hides it once the PWA is actually installed.

### Stats modal (3 tabs)

`📊 Overview` · `📸 My Cards (0)` · `🏆 Tournament (0)` — see Cut #2 (two empty `(0)` tabs for new players).

### Tournament screen (3 tabs + mode label)

`This Week` · `My Best` · `Archive`, header label `🏠 Local leaderboard` (20 chars) — see Cut #1 (`My Best` duplicates Stats → Tournament).

---

## What's New Since Cycle 4 PRUNE Closed (Day 106)

Eleven factory days (Day 107 → Day 117) shipped Cycle 5 BUILD + Cycle 5 HARDEN. Five user-relevant surfaces are new:

| # | Day | Surface | Cluttery? | Notes |
|---|-----|---------|-----------|-------|
| 1 | 107 | `wires.js` → ES module | No | Structural only; no UI change (verified `window.Wire`/`WireManager` rebind) |
| 2 | 108 | Tournament Worker live leaderboard | Mild | Offline-fallback default `local`; label stayed compact at 20 chars |
| 3 | 109 | Lab Bench III (L46–50) + fan-out budget + L48 3-chip HUD | **Yes** | Cut #3 — lab track now 15 levels / 3 mini-chapters |
| 4 | 110 | Personal-best badge (`#level-best-badge`) | No | Correctly suppressed cold; shows on revisit only |
| 5 | 111 | Stats → `🏆 Tournament` history tab | **Yes** | Cut #1 (duplicates Tournament screen) + Cut #2 (empty `(0)` tab) |

The two structural/contained items (D107 ES module, D110 PB badge) are PRUNE-shaped already — invisible or properly gated. The three remaining (D108 label, D109 lab track, D111 Stats tab) each carry a cut.

---

## Cycle 4 Cuts Status Recap

- ✅ Tier-1 #1: LO-1 fix (HUD cleanup → transition layer) — shipped Day 103, **LO-1 retired**, re-verified absent today
- ✅ Tier-1 #2: Tournament mode label compression — shipped Day 103 (`🏠 Local leaderboard`, 20 chars, verified)
- ✅ Tier-1 #3: Stats default-to-Cards when non-empty — shipped Day 103
- ✅ Tier-1 #4: Mastery cards gated out of grid — shipped Day 103 (50 cards, not 55, verified)
- ✅ Tier-1 #5: Lab budget chip on own row — shipped Day 103
- ✅ Tier-2 #7: Difficulty Mode → Gameplay section — shipped Day 104 (verified `diffSection = "Gameplay"`)
- ✅ Tier-2 #8: Install-App gated when standalone — shipped Day 104 (`_isStandalone()` gate)
- ❌ Tier-2 #9: Merge 5 collection modals — **NOT SHIPPED** (re-proposed below as Tier 2 cut #4)
- ❌ Tier-3 #14: Reset Progress typed-confirm — **DEFERRED to Cycle 5 PRUNE Tier-1** (now Cut #2 below)

Cycle 4 landed ~7 of 9 proposed cuts.

---

## Proposed Cuts (ranked by impact ÷ risk)

### 🔪 Tier 1 — Highest Impact, Lowest Risk (do Friday-equivalent Day 119, Design Simplification)

1. **De-duplicate tournament history: drop `My Best` from the Tournament screen, keep Stats → `🏆 Tournament` as the canonical personal history.** Today both surfaces answer "how have I done in tournaments?":
   - Tournament screen tabs: `This Week` (live play + leaderboard) / `My Best` (your past submissions) / `Archive` (past-week leaderboards)
   - Stats modal: `🏆 Tournament` tab (Day 111) = your past submissions with rank/percentile/replay
   `My Best` and the Stats Tournament tab are the same data in two modals. **Recommendation:** the Tournament screen should be about *competition* (This Week leaderboard + Archive leaderboards); your *personal* history belongs in Stats. Remove the `My Best` tab from the Tournament screen and point it (one line of copy + a button) at Stats → Tournament. Net: Tournament screen drops to 2 tabs, no data lost, one clear home for "my history." *Tightens information architecture; removes a duplicate surface.*

2. **`⚠ Reset Progress` behind a typed/hold confirm** (Cycle 4 Tier-3 #14, promoted to Tier-1 per the cycle plan). One-click save-wipe at the bottom of Settings is a footgun. Add a "type RESET to confirm" input or a 3-second hold-to-confirm. ~15 LOC + a tiny modal. *Removes a destructive one-tap; pure safety win.*

3. **Hide zero-count Stats tabs until they have content.** `📸 My Cards (0)` and `🏆 Tournament (0)` should not render as clickable tabs leading to empty grids for a player who has never saved a card or played a tournament. Replace the dim-`.empty` treatment (Day 104) with full suppression: hide the tab when count === 0, reveal it the first time the count goes positive. For a new player the Stats modal collapses to a single `📊 Overview` — no dead-end tabs. (Keeps the Day 103 default-to-Cards behavior for players who *do* have cards.) *Net: the Stats modal stops advertising features the player hasn't unlocked yet.*

### 🪒 Tier 2 — Medium Impact (Day 120 Code Cleanup / Day 121 Polish)

4. **Merge the 5 "what have I collected" modals into one tabbed `🏛️ Profile`.** Cycle 2 + Cycle 4 carry-over, still the single heaviest nav-clutter source: `🏆 Achievements` + `🌳 Mastery Tree` + `🎨 Customize` + `🗂️ Collection` + `🧬 Logic Profile` are five Tier-3 nav buttons all answering "what have I done / collected." Fold them into one Profile modal with tabs (Achievements / Mastery / Cosmetics / Saved Circuits / Stats). Tier-3 nav drops **18 → 14**. Tabs are cheap; nav buttons cost attention. This is the biggest dent available in the 18-button Tier-3 plateau.

5. **Lab Bench III L48 3-chip HUD — verify wrap/legibility at narrow widths and iconify.** L48 renders `🧱 NAND only` + `🎯 Hard cap: 3 gates` + the fan-out budget chip in one row. At 375px the three text chips risk overflow. Either shorten to glyph+number (`🧱` / `🎯3` / `⑂2`) with the full text in `title`, or allow the strip to wrap to a second line gracefully. Verify on mobile breakpoints.

6. **Personal-best badge vs L-hint footer / tutorial — confirm no vertical-space competition.** Day 110's `#level-best-badge` adds a row to `#level-info` on revisits. On lower levels that also show the hint footer (L4+), confirm the info panel doesn't get crowded on short viewports. Likely fine (badge only shows on completed-level revisit, tutorial only on first L1 entry), but worth a Polish-day check.

### 🌿 Tier 3 — Polish (Day 121 Polish Sprint)

7. **Consider a collapsed "Lab Bench" group in the end-game level grid.** With 15 lab levels (3 mini-chapters) the end-game grid reads as 50 flat cards. A collapsible Lab Bench chapter-group header (collapsed by default once campaign is done) would keep the grid scannable and make the bonus track feel like a deliberate destination rather than a long tail. Pairs naturally with the chapter metadata already present (Chapter 11 = Lab Bench III).

8. **Tournament mode-label cross-fade.** Day 93's four-state machine still paints synchronously; when reachability resolves `cloud-ready → remote-fallback` the 20-char badge snap-changes. A 250ms cross-fade makes it read as a status, not a flash. (Carry-over from Cycle 4 Tier-2 #10.)

9. **Coverage-rotation debt (3 cycles old).** The HARDEN harness keeps converging on its own greatest hits. Cycle 6 should rotate one HARDEN day onto a less-covered surface (suggested: the Customize/Cosmetics modal cosmetic-unlock flow, or the Replay viewer, neither of which has had a dedicated audit since Day 51/40).

---

## Day 2 Plan (Day 119, Design Simplification)

Lock in the 3 Tier-1 cuts as Day 119's deliverable, atomic-per-cut + one wrap commit (Day 78/103 precedent), cache-bust + SW bump together:

1. **Cut #1 first** (de-dup tournament history) — remove `My Best` tab from the Tournament screen, add a one-line pointer to Stats → Tournament. Verify Stats Tournament tab still renders history correctly and the Tournament screen drops cleanly to 2 tabs.
2. **Cut #2** (Reset Progress typed/hold confirm) — small modal + handler in `setupSettingsModal()` / the Data-section reset wiring.
3. **Cut #3** (hide zero-count Stats tabs) — extend `_updateStatsTabsUI()` to toggle `display:none` on `(0)` tabs instead of the `.empty` dim; reveal on first positive count.

Re-run the Day 118 CDP harness as the regression baseline. **PRUNE week = net-negative code; remove more than you add.** Cuts #1 and #3 are net-negative (removing a tab + a duplicate render path); Cut #2 adds a small confirm modal — net should land at or below zero.

**Day 3 (Day 120) Code Cleanup:** dead-code sweep on any orphaned `My Best` tournament-tab render helpers exposed by Cut #1; Tier-2 cut #4 groundwork (collection-modal merge scaffolding).
**Day 4 (Day 121) Polish Sprint:** Tier-2 cuts #5/#6 + Tier-3 polish + cold-start defaults re-audit.
**Day 5 (Day 122) Expert Panel + Validation:** play 5 levels across chapters, re-score 10 dimensions, target ≥9.1 (Cycle 4 closed at 9.1 — hold-don't-drop), write `reviews/prune-cycle-5-review.md`, close Cycle 5 PRUNE Week.

---

## Where the Eyes Snag (2026-06-25 walkthrough)

A **first-time player** today meets: zero onboarding ceremony → 2 buttons + 50 cards. L1 tutorial fires correctly. Top-left icons carry tooltips. **Clean.**

A **mid-game player** (Tier 2, 12 levels) meets: smooth tier reveal, no cliff. **Clean.**

A **Tier-3 player** (18 levels) meets: **18 nav buttons at once** — five of them collection modals that could be one (Cut #4). The same plateau Cycle 2 and Cycle 4 flagged.

An **end-game player** (50 levels) meets: a 50-card grid where 15 cards are a 3-mini-chapter Lab Bench bonus track (Cut #7), and a Tournament screen whose `My Best` tab duplicates the Stats Tournament tab (Cut #1).

A player **opening Stats for the first time** meets: three tabs, two of them `(0)` empty (Cut #3).

A player **at the bottom of Settings** meets: a one-click `⚠ Reset Progress` (Cut #2).

A **Lab Bench III player** (L48) meets: a three-chip constraint strip (Cut #5).

---

## Console Hygiene

**0 console.error** across 44 assertions / 8 navigations / 7 reload cycles.
**0 Runtime.exceptionThrown** across the full audit.

---

*End of Cycle 5 PRUNE_REPORT.*
*Clutter Score: 4/10 (held from Cycle 4; Cycle 2 closed 5/10, Cycle 1 baseline 8/10).*
*Two new clutter sources (tournament-history duplication, empty Stats tabs) + one growth concern (Lab Bench track) identified. Two carry-overs re-proposed (Reset confirm → Tier-1, collection-modal merge → Tier-2). Three Tier-1 cuts, three Tier-2 cuts, three Tier-3 cuts proposed.*
*Tournament-history de-duplication is the first Tier-1 cut, lands Day 119.*
