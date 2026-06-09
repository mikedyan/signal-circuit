# PRUNE REPORT — Cycle 4, Prune Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-06-09 (Tuesday)
**Cycle:** 4
**Build under audit:** `index.html?v=1780617600`, SW `signal-circuit-v65` (Day 96 build — unchanged through the entire Cycle 4 HARDEN week, 6 consecutive days).
**Auditor pose:** First-time player landing on https://mikedyan.github.io/signal-circuit/ with `localStorage` wiped, then progressing through tier gates via `GameState.seedProgress()` at counts 0/3/6/9/12/15/18/45.
**Prior PRUNE_REPORT:** Cycle 2, 2026-05-15, clutterScore = 5/10 (Cycle 1 closed at 8/10).

---

## TL;DR

Cycle 2's Tier-1 cuts all held. The end-game level-select went from **98 buttons → 58** at Day 78; eleven months later it's **63** with five new Lab Bench II levels factored in (Day 84 added L41-L43, Day 94 added L44-L45). The Day 78 staircase smoothness assertion lands cleanly: today's reveal cadence is `nav 2 → 2 → 5 → 7 → 10 → 13 → 18` across `seed 0/3/6/9/12/15/18`, with overflow rising 1:1 against completed levels. The cliff is gone.

Three Cycle 2 carry-overs are **now shipped** (verified live in the audit):

- ✅ Top-left gameplay icons (Encyclopedia / Shortcuts / KB-Wiring) all carry both `title` AND `aria-label` attributes ("Gate Encyclopedia" / "Keyboard shortcuts" / "Keyboard Wiring Mode (K)").
- ✅ Step chips on locked cards: 0 visible (Cycle 2 cut #7 landed somewhere between Days 78–96).
- ✅ Onboarding readout (Day 95) ships behind `signal-circuit-debug=1` — the Developer section is HIDDEN by default, which is the right PRUNE-posture for an experiment surface.

**One Cycle 2 carry-over still real:** Difficulty Mode (`🔧 Mode: Standard`) sits inside the Settings modal but no section header walks up to it (my probe returned null for the section ancestor). It still feels misfiled — it is a gameplay-rules option, not a display option.

**The clutter has shifted again — three new shapes worth a Tier-1/2 cut:**

1. **LO-1 latent observation** (11th day re-verified today). `GameState.showLevelSelect()` cleans Blitz + Speedrun HUDs (Day 61 + Day 74); the lower-level `ui.showScreen('level-select')` transition does NOT. Today the bypass path is not user-reachable, but every new mode entry is one ill-routed call away from resurrecting the bug. **PRUNE Week's job is to move the cleanup to the right layer before that happens.** This is the canonical PRUNE cut: it doesn't remove a feature; it tightens a contract.

2. **Tournament mode label is a 60-character status line.** `🏠 Local leaderboard · same puzzle, deterministic bots` is what new players see at the top of the Tournament screen. The "same puzzle, deterministic bots" suffix is engineer metadata (Day 83 spec language), not user value. The Worker live mode (Day 93) will only widen this — `🌐 Live · offline (using local for now)` is 38 chars but adds a parenthetical apology. The whole label vocabulary needs to compress to icon + 1-2 word state.

3. **End-game total is 50 cards, not 45.** `seedProgress(45)` reveals 5 mastery challenges in addition to the 45 campaign + Lab Bench levels. The mastery tier (Chapter Mastery) is supposed to live behind the `🌳 Mastery Tree` modal entry, but the cards themselves co-appear in the main level-select grid at campaign-complete. New players hitting end-game see five cards they were not told about and that visually blend with the campaign cards. Either gate them behind the Mastery Tree modal or mark them with a distinct visual class (`.level-btn.mastery`) so the cohort separation is obvious.

Plus three secondary shapes:

4. **Snapshot Cards Library (Day 96) defaults to Overview tab forever.** The tab badge correctly shows `📸 My Cards (N)` but the default Stats-modal tab is hardcoded to Overview on every open. A user who has saved 12 cards still has to click the tab every time. Cheap win: if `library.length > 0`, default to Cards tab.

5. **Lab Bench II composite levels stack 3 chips at once.** L44/L45 show `#lab-constraint` + `#lab-constraint-2` + `#lab-budget` all in the same HUD strip. Visually it reads as "many rules" but the budget chip is a state, not a constraint. Either move the budget chip out of the constraint strip or merge it into the rightmost constraint chip with a divider.

6. **Settings audio sliders + 13 buttons is a lot of `⚙️ Settings`.** It is *organised* (Display & Accessibility / Audio / Notifications / Data / Developer) but 6 toggles + 2 sliders + 4 Data buttons + Close = 13 buttons + 2 sliders. Cycle 1 collapsed 12 top-level entries → 1 Settings modal; the modal is now where the bloat lives. Mostly fine, but `📲 Install App` is still always visible — Cycle 2 cut #9 unshipped.

## Clutter Score: **4 / 10**

(10 = unplayably overwhelming, 1 = monk-tier minimal). Cycle 2 closed at 5/10. Cycle 1 baseline 8/10.

| Stage | seed | Nav buttons | Overflow buttons | Level cards | Per-tier score |
|---|---|---|---|---|---|
| Cold start | 0 | 2 | 0 | 45 | 1/10 |
| Tier 1 | 3 | 2 | 3 | 45 | 2/10 |
| Tier 1.5 (end Ch1) | 6 | 5 | 6 | 45 | 3/10 |
| Tier 2 entrance | 9 | 7 | 9 | 45 | 4/10 |
| Tier 2 mid | 12 | 10 | 12 | 45 | 4/10 |
| Tier 2 late | 15 | 13 | 15 | 45 | 5/10 |
| Tier 3 | 18 | 18 | 18 | 45 | 5/10 |
| End-game | 45 | 18 | 45 | **50** | 6/10 |

Weighted by where players spend time (most users live in the 6–18 level range), I land on **4/10**. Cold-start and tier 1 are notably tighter than Cycle 2's (which had 2 cold but 8 at tier 1). The staircase is smoother. The right tail picked up 5 cards (mastery surprise) and the Settings modal grew a Developer section.

---

## Headcount Walk (deployed build, fresh profile, all measured live)

### Cold start (`localStorage` cleared, `?v=1780617600`)

- Onboarding modals before Level 1: **0** (silent-default difficulty per Day 78 cut #5 — variant `silent-standard`)
- Game-mode entries on level-select: **0**
- Info/modal entries on level-select: **0**
- Settings entries on level-select: **0** (all behind `⚙️ Settings`)
- Total visible non-level buttons: **2** (`how-to-play-btn`, `open-settings-btn`)
- Level cards visible: **45** (40 campaign + 3 Day 84 Lab + 2 Day 94 Lab)

### After 3 completed levels (Tier 1)

- Nav buttons: **2** (cold-state holds — Tier 1's only effect is to reveal 3 per-card overflow `⋯` menus)
- Overflow buttons: **3**

### After 6 completed levels (end of Chapter 1)

- Nav buttons: **5** (Daily Challenge + Encyclopedia + Stats reveal at L6)
- Overflow buttons: **6**

### After 12 completed levels (Tier 2 mid)

- Nav buttons: **10** (Random Challenge + Sandbox + Adaptive + Achievements + Customize unlock between L6 and L15)
- Overflow buttons: **12**

### After 18 completed levels (Tier 3)

- Nav buttons: **18** (Tournament + Infinite + Blitz + Speedrun + Creator + Mastery Tree + Logic Profile + Collection reveal between L15 and L18)
- Overflow buttons: **18**

### After 45 completed levels (end-game)

- Nav buttons: **18** (no further gates above Tier 3)
- Overflow buttons: **45** (one `⋯` per completed card — Day 78 cut #1)
- Level cards visible: **50** (the +5 are Chapter Mastery challenges that co-render in the level grid at campaign-complete — see Cut #4)

### Settings modal (13 buttons + 2 sliders + 6 sections)

- DISPLAY & ACCESSIBILITY (6 buttons): Colorblind, Text, Simplified, Accessible Wiring, Light Mode, **Mode: Standard** (Difficulty filing carry-over)
- AUDIO (2 sliders)
- NOTIFICATIONS (2 buttons): Daily, Streak (Weekly retired Day 79)
- DATA (4 buttons): Export, Import, Install App, Reset Progress
- DEVELOPER (Day 95, hidden by default — visible only with `signal-circuit-debug=1`): Onboarding Experiment readout card + reset button
- Plus Close

---

## What's New Since Cycle 2 PRUNE Closed (Day 81)

Sixteen factory days (Day 82 → Day 96) shipped Cycle 3 BUILD + Cycle 3 HARDEN + Cycle 4 BUILD before today. Six user-visible surfaces are new:

| # | Day | Surface | Cluttery? | Notes |
|---|-----|---------|-----------|-------|
| 1 | 82 | Snapshot share-card modal (`#share-card-btn` in completion flow) | No | Only renders after solve; not on level-select |
| 2 | 83 | Tournament backend adapter + `#tournament-mode-label` | **Yes** (verbose) | Cut #2 below |
| 3 | 84/94 | Lab Bench II (5 lab levels L41-L45) + `#lab-constraint`/`#lab-constraint-2` chips | Mild | Cut #5 below (3-chip stack) |
| 4 | 85/95 | Onboarding experiment + readout UI | No | Debug-gated by `signal-circuit-debug=1`; default hidden — correct PRUNE posture |
| 5 | 92 | ES module split for gates.js | No | Structural only; no UI change |
| 6 | 96 | Snapshot Cards Library tab inside Stats modal | Mild | Cut #3 below (default-tab inertia) |

The two structural items (D85/95 readout, D92 ES module) are PRUNE-shaped already — debug-gated or invisible. The three remaining (D83/93 mode label, D84/94 composite chips, D96 cards tab) each carry one cut.

---

## Cycle 2 Cuts Status Recap

For continuity, here is what Cycle 2's PRUNE_REPORT proposed and whether it shipped:

- ✅ Tier-1 #1: Per-card `⋯` overflow menu — shipped Day 78 (verified: 45 overflow buttons at end-game)
- ✅ Tier-1 #2: Smooth Tier-2 reveal — shipped Day 78 (verified: 2/5/7/10/13/18 staircase across seed 0/6/9/12/15/18)
- ✅ Tier-1 #3: Retire Puzzle of the Week — shipped Day 79 (verified: `#weekly-puzzle-btn` DOM absent + storage key cleaned)
- ✅ Tier-1 #4: Drop L1 hint-policy footer — shipped Day 78
- ✅ Tier-1 #5: Silent-default difficulty modal — shipped Day 78 (verified: variant `silent-standard`, no cold-start modal)
- ✅ Tier-2 #6: Tooltip top-left gameplay icons — shipped (verified: all 3 icons have `title` + `aria-label`)
- ✅ Tier-2 #7: Hide Step chips on locked cards — shipped (verified: 0 step chips on locked cards)
- ❌ Tier-2 #8: Move `🔧 Difficulty Mode` out of Display & Accessibility — **NOT SHIPPED** (re-proposed below as Tier 2 cut #7)
- ❌ Tier-2 #9: Hide `📲 Install App` when standalone — **NOT SHIPPED** (re-proposed below as Tier 3 cut #11)
- ❓ Tier-2 #10: Fix "Adaptive Novice" skill-pill re-leak — not probed today (seed counts didn't trigger Adaptive usage; carry forward)
- ❌ Tier-2 #11: Merge "what have I collected" pile — **NOT SHIPPED** (5 modals still distinct: Achievements / Mastery Tree / Customize / Collection / Logic Profile)
- ❌ Tier-3 #12–15: most still unshipped (low priority polish)

Cycle 2 hit ~7 of 11 cuts (64% landing rate, better than Cycle 1's 60%).

---

## Proposed Cuts (ranked by impact ÷ risk)

### 🔪 Tier 1 — Highest Impact, Lowest Risk (do Wednesday Day 103)

1. **LO-1 fix: move HUD cleanup from `GameState.showLevelSelect()` wrapper into `ui.showScreen('level-select')` transition layer.** This is the 11th day re-verifying LO-1 — today's audit confirms BOTH Speedrun AND Blitz HUDs leak via the bypass path (`gs.ui.showScreen('level-select')` leaves `speedrunMode=true` + `#speedrun-hud display=flex`, and symmetrically for Blitz). The cleanup currently lives in `js/main.js:2683` (Day 61 block) + `:2690` (Day 74 block), inside `GameState.showLevelSelect()`. Every new mode entry today (Tournament, Infinite, Sandbox, Lab Bench) routes through `GameState.showLevelSelect()` so users never see the bug — but as soon as any code path calls `ui.showScreen('level-select')` directly (e.g. a future error-recovery handler, or a Day 96-style new tab that wants to navigate back to level-select after rendering), the bug resurrects. Per the **Day 87 lesson** (`LESSONS_LEARNED.md` line ~118): HUD cleanup belongs at the screen-transition layer, not at the orchestrator wrapper. The right fix is a one-time block inside `UI.showScreen()` that runs when the destination is `level-select` — it cleans `blitzMode`/`blitzTimer`/`speedrunMode`/`speedrunTimer` + hides both HUDs. Then the duplicate blocks in `GameState.showLevelSelect()` can be removed entirely (or kept as defensive belt-and-braces, but the second pass becomes a no-op). **Net effect: tightens the screen-transition contract; LO-1 retires after 11 days of latency.**

2. **Trim the Tournament mode label to icon + 1-2 word state.** Today: `🏠 Local leaderboard · same puzzle, deterministic bots` (60 chars). Cut the "same puzzle, deterministic bots" engineer-prose. New labels:
   - `local` mode → `🏠 Local leaderboard`
   - `remote` mode → `🌐 Live leaderboard`
   - `remote-fallback` mode → `🌐 Live · offline`
   - `cloud-ready` mode → `🌐 Connecting…`
   *Net effect: the mode label becomes a glanceable state badge, not a paragraph. Day 93's three-mode machine cleanly fits the four labels; future Worker-go-live doesn't introduce paragraph apology copy.*

3. **Stats modal: default to Cards tab when library is non-empty.** Day 96's `_activeStatsTab='overview'` resets on every modal open. A user with 12 saved cards has to click `📸 My Cards (12)` every time they open Stats. Add a one-line check at the top of `setupStatsDashboard()`'s show handler: `if (gs.getCardLibrary().length > 0) this._activeStatsTab = 'cards'`. *Net effect: the snapshot library becomes a destination, not a hidden tab.*

4. **Gate the 5 mastery challenge cards behind the Mastery Tree modal entry, OR mark them with a `.level-btn.mastery` class.** At `seedProgress(45)` the level grid silently grows from 45 to 50 cards because Chapter Mastery levels (the 5 mastery challenges introduced Day 55) co-render in `#level-select-content` after campaign-complete. They are visually indistinguishable from campaign cards (same shape, same star strip), so a new end-game player sees five cards they were not narrated. Two viable fixes:
   - (a) Stop rendering mastery cards in the campaign grid; route them only through the `🌳 Mastery Tree` modal.
   - (b) Add a `.level-btn.mastery` class with a distinct purple/gold border so the cohort is obvious at first glance.
   Prefer (a) for the cleanest end-game; fall back to (b) if removing the cards from the grid breaks an existing achievement flow. *Net effect: end-game level count drops back to a clean 45; mastery becomes a destination ritual.*

5. **Lab Bench II composite levels: move `#lab-budget` out of the constraint chip strip OR merge it into the rightmost constraint chip.** At L44/L45 the HUD shows three chips abreast: `🧱 NAND only` + `🎯 Hard cap: 6 gates` + `≈ 5 gates · target 5`. The first two are constraints (rules to satisfy); the third is state (current count vs target). Mixing them in one strip dilutes the constraint-strip vocabulary that Day 94's lesson predicted would carry forward to Lab Bench III. Options:
   - (a) Move `#lab-budget` to a sibling row below the constraint strip (clearest separation; tiny CSS change).
   - (b) Inline the budget into the rightmost constraint chip with a `·` separator: `🎯 Hard cap: 6 gates · 5/6`.
   Prefer (a) — it preserves Lab Bench III's "constraint manifest" pattern. *Net effect: the HUD strip is single-purpose; the budget feedback gets its own row where it can pulse on over-cap without dragging the constraint chips into the animation.*

### 🪒 Tier 2 — Medium Impact (Thursday Day 104 Polish)

6. **Hide the `📸 My Cards (0)` tab when the library is empty.** When the user has never saved a card, the tab still renders with `(0)` and a clickable affordance leading to an empty grid. Two fixes: (a) hide the tab strip entirely when `library.length === 0`, OR (b) show the tab but degrade its `aria-disabled` + dim style + a single-line `"Save your first solve to start your gallery"` empty-state line in the pane. Prefer (b) — it's discoverable without nagging.

7. **Move `🔧 Difficulty Mode` out of DISPLAY & ACCESSIBILITY into a new GAMEPLAY section.** Cycle 2 carry-over #8. Today's audit could not walk up from the Difficulty button to a section header — it's filed under Display & Accessibility but that section header doesn't visually carry through to the button. Either give it its own GAMEPLAY section (with future room for Pure-logic mode toggles, undo limits) OR fold it under the cold-start difficulty-modal flow (so it's only entered by clicking "Want a different challenge level?" anchored from Difficulty Mode itself).

8. **`📲 Install App` should hide when the app is already standalone.** Cycle 2 carry-over #9, unshipped. `matchMedia('(display-mode: standalone)').matches` + iOS `navigator.standalone` already gate the install-prompt arc (Day 69) — Settings should respect the same gate.

9. **Merge the 5 "what have I collected" modals into one tabbed Profile screen.** Cycle 2 carry-over #11, unshipped. `🏆 Achievements` + `🌳 Mastery Tree` + `🎨 Customize` + `🗂️ Collection` + `🧬 Logic Profile` all answer "what have I done / collected." Merge into a single `🏛️ Profile` modal with tabs (Achievements / Mastery / Cosmetics / Saved Circuits / Stats). Tier-3 nav drops 5 buttons → 1. Tabs are cheap; nav buttons cost attention. The current 18-button tier3 nav strip is the heaviest remaining clutter source.

10. **Tournament screen mode label transitions need calm animation.** Day 93 ships a four-state machine but the transitions paint synchronously. When the reachability probe resolves from `cloud-ready` to `remote-fallback`, the label snap-changes mid-frame. Add a 250ms cross-fade so the badge feels like a status, not a flash.

### 🌿 Tier 3 — Polish (Friday Day 105 Polish Sprint)

11. **Trim difficulty modal copy.** "Standard (Recommended) — You can change this anytime in Settings" — kill the parenthetical apology. If we keep the chooser at all (debug variant `explicit-chooser` still does), the choice ceremony shouldn't undermine itself.

12. **Welcome toast vs tutorial Step 1/8 — verify they don't compete.** Day 78 silent-default fires a 4.5s welcome toast on cold start; the tutorial overlay also fires at L1 entry. Audit needed: are they ever simultaneously visible? If yes, defer the welcome toast until tutorial completes (or push the tutorial Step 1 onto the next animation frame).

13. **Card library storage budget audit.** Day 96 spec notes 20 × ~140KB = 2.8MB worst case; today's library is empty so I couldn't probe live, but at 20 saved cards we'd be consuming 56% of the 5MB localStorage budget on snapshots alone. PRUNE Week is a fine time to: (a) verify the FIFO eviction is correctly tail-preserving, (b) consider moving the library to IndexedDB (where 50MB+ quotas are routine), (c) downsample the cached PNG to 800×420 (40% of pixels = ~50% smaller) if quality after re-paint is acceptable.

14. **Reset Progress under a confirm modal with typed confirmation.** Cycle 2 Tier-3 #15, unshipped. `⚠ Reset Progress` is a one-click button at the bottom of Settings. One mis-tap wipes the save. Add a "type RESET to confirm" gate or a 5-second hold-to-confirm.

---

## Day 2 Plan (Day 103, Wednesday — Design Simplification)

Lock in the 5 Tier-1 cuts above as Day 103's deliverable. Order:

1. **Cut #1 first** (LO-1 fix in `ui.showScreen()`) — highest contract value, smallest source diff (~12 LOC moved, plus a deduplication pass on `GameState.showLevelSelect()`).
2. **Cut #2** (Tournament mode label compression) — string-only changes in `RemoteTournamentAdapter.describe()` + `LocalTournamentAdapter.describe()` plus one CSS pass for max-width on the badge.
3. **Cut #3** (Stats default-to-Cards-when-non-empty) — one-line change in `setupStatsDashboard()` show handler.
4. **Cut #4** (mastery cards gated) — either remove the render path in `renderLevelSelect()` for mastery levels, OR add the `.mastery` class + CSS. Prefer the removal path; verify Mastery Tree modal still surfaces them.
5. **Cut #5** (lab-budget chip move) — CSS + HTML structure tweak; move `#lab-budget` out of the constraint strip.

Build all 5 in one commit (Day 78 precedent: PRUNE Tuesday ships its full Tier-1 batch as atomic-per-cut commits + one wrap commit). Cache-bust + SW version bump together. Test with the Day 102 CDP harness re-run as the regression baseline (LO-1 reproduction phase should now FAIL because the bypass path is also clean — that's the success signal).

**Day 3 (Day 104) Polish:** ship Tier-2 cuts 6–10 + dead-code cleanup pass on any orphaned mode-label helpers.

**Day 4 (Day 105) Polish Sprint:** Tier-3 cuts 11–14 + cold-start defaults re-audit.

**Day 5 (Day 106) Expert Panel + Validation:** play 5 levels across chapters, re-score 10 dimensions, target ≥9.0 (Cycle 2 closed at 8.9).

---

## Where the Eyes Snag (2026-06-09 walkthrough)

A first-time player today meets:

1. **Zero onboarding ceremony.** Direct landing → 2 buttons + 45 cards. (Day 78 silent-default is doing its job.)
2. **L1 tutorial fires immediately on first-level entry** — tutorial overlay correctly highlights AND gate and runs Step 1 of 8. (Cycle 2's L1-hint-footer cut held.)
3. **Tooltips on top-left icons exist** — Encyclopedia + Shortcuts + KB-Wiring all have `title` AND `aria-label`. Cycle 2 carry-over #6 has landed.

A mid-game player (Tier 2, 12 levels) meets:

4. **Smooth tier reveal.** From L9→L12, two buttons appear (Random + Sandbox). From L12→L15, three more (Adaptive + Achievements + Customize). Day 78's cut #2 is doing its job — no cliff.
5. **One subtle thing:** Adaptive Challenge button label compression (Cycle 2 carry-over #10 — Adaptive vs "Adaptive Novice" skill-pill leak) wasn't exercised today because seed counts didn't engage Adaptive use. Carry forward.

A Tier 3 player (18 levels) meets:

6. **18 nav buttons all at once.** Plus 18 overflow buttons. The screen has 36 visible non-card buttons + 45 cards. This is the Cycle 4 equivalent of Cycle 2's Tier-2 cliff — at L18, every game mode becomes visible. Cut #9 (merge collection modals) addresses 5 of those 18 directly; the remaining 13 are competitive/procedural modes plus settings/info.

An end-game player (45 levels, 45 ⭐⭐⭐) meets:

7. **The mastery surprise** (Cut #4). Five extra cards appear at campaign-complete with no narration.
8. **Tournament mode label is verbose** (Cut #2). Six words plus dot-separator for "this is your local leaderboard."

A Lab Bench player (L44/L45 composite) meets:

9. **Three-chip HUD strip** (Cut #5). Constraint + Constraint + Budget. The budget chip muddies the constraint-strip vocabulary.

---

## Inside the Gameplay (Level 1 cold, with tutorial active)

Level 1 sidebar (verified live):

```
🟢 Level 1: AND Gate Basics
Output is 1 only when BOTH inputs are 1.
Gates: 0/1   ★★★
[truth table 4 rows]
[▶ RUN]  [⚡ Quick Test]  [Clear Circuit]  [💡 Hint (🪙3)]
Build your circuit, then press RUN
```

Tutorial overlay fires correctly (STEP 1 OF 8, AND gate highlighted, Skip Tutorial visible). The L1 hint-policy footer is correctly hidden (Cycle 2 cut #4 held — only resurfaces from L4 onward). `Used in: …` forward refs hidden (Day 64 fix held). Top-left icons all carry tooltips.

There is **no remaining cold-state issue on L1**. The L1 sidebar in Cycle 4 is as clean as the prompt asks for.

---

## Console Hygiene

**0 console.error** across 49 assertions / 6 navigations / 8 reload cycles.
**0 Runtime.exceptionThrown** across the full audit.

---

*End of Cycle 4 PRUNE_REPORT.*
*Clutter Score: 4/10 (Cycle 2 closed at 5/10, Cycle 1 baseline 8/10).*
*Three new clutter sources identified. One Cycle 2 carry-over re-proposed. Five Tier-1 cuts proposed, five Tier-2 cuts proposed, four Tier-3 cuts proposed.*
*LO-1 is the first Tier-1 cut, lands tomorrow as Day 103.*
