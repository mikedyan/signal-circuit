# PRUNE REPORT — Cycle 2, Prune Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-05-15 (Friday)
**Cycle:** 2
**Build under audit:** `index.html?v=1779465600`, SW `signal-circuit-v52` (Day 76 build)
**Auditor pose:** First-time player landing on https://mikedyan.github.io/signal-circuit/ with `localStorage` wiped, then progressing through tier gates via `GameState.seedProgress()` (the new Day 76 helper).
**Prior PRUNE_REPORT:** Cycle 1, 2026-04-28, clutterScore = 8/10.

---

## TL;DR

Cycle 1's prune work landed. The cold-start screen is now **2 buttons + 1 difficulty modal** (was 29 buttons + 2 modals), the level grid breathes, the placement test is gone, locked cards are properly de-emphasised. **Cold-start clutter is no longer the problem.**

The clutter has just **moved**. Three new shapes:

1. **The Tier 2 cliff** — once you hit 12 levels solved, the nav-strip jumps from 5 buttons to 18 in one transition. Cycle 1 ramped 29 → 5, but did not smooth the 5 → 18 reveal.
2. **Per-card sub-buttons at end-game** — every 3-starred level card sprouts two new buttons (`👁 Solution` + `🏆 Gate Limit`). At 40 completed levels that is **80 extra buttons** rendered on level-select. Day 45 + Day 51 built these in *after* the Cycle 1 audit.
3. **Mode sprawl at Tier 3** — 8 distinct competitive/procedural modes (Tournament, Daily, Adaptive, Infinite, Random, Blitz, Speedrun, Sandbox) all sitting flat on the nav strip. Cycle 1 proposed grouping them; that cut never shipped.

Plus two unshipped Cycle 1 cuts that are still real: (a) the "Hints won't reduce stars · No hints = Pure Logic badge" copy still greets a fresh player on Level 1, and (b) the four small icons in the gameplay top-left (`← Back / ? / 📚 / ⌨`) are still tooltip-less for new users.

## Clutter Score: **5 / 10**

(10 = unplayably overwhelming, 1 = monk-tier minimal)

| Stage | Visible buttons | Score |
|---|---|---|
| Cold start (0 levels) | 2 + 1 modal | 2/10 |
| Tier 1 (3 levels solved) | 8 | 3/10 |
| Tier 1.5 (6 levels — end Ch1) | 17 | 4/10 |
| Tier 2 (12 levels — end Ch2) | 42 | 6/10 |
| Tier 3 (18 levels — end Ch3) | 54 | 7/10 |
| End-game (40 levels — full) | 98 | 7/10 |

Weighted by where players spend time (most users live in the 6–18 level range), I land on **5/10**. We hit the ≤ 5 target set after Cycle 1, but the right tail is heavier than it needs to be.

---

## Headcount of UI (deployed build, fresh profile, all measured live)

**Cold start (`localStorage` cleared):**

- Onboarding modals before Level 1: **1** (down from 2 — placement test is gone)
- Game-mode entries on level-select: **0** (down from 9)
- Info/modal entries on level-select: **0** (down from 8)
- Settings entries on level-select: **0** (down from 12 — all 14 items live behind `⚙️ Settings`)
- Total visible non-level buttons: **2** (How to Play, Settings) — was 29 in Cycle 1.
- Level cards visible: 40 (unchanged, all locked except L1)

**After 12 completed levels (Tier 2 unlock):**

- Game-mode entries: **8** (Puzzle of the Week, Daily, Adaptive Novice, Infinite, Random, Blitz, Speedrun, Sandbox) + Creator
- Info entries: **6** (How to Play, Gate Encyclopedia, Achievements, Stats, Customize, Mastery Tree, Collection, Logic Profile — eight items)
- Per-level sub-buttons: **24** (12 cards × 2 buttons each: `👁 Solution`, `🏆 Gate Limit`)
- Total non-level visible buttons: **42**

**After 40 completed levels (end-game):**

- Per-level sub-buttons: **80**
- Game-mode entries: **8** (`🏗️ Puzzle of the Week` → `🏆 Tournament` at tier 3)
- Total non-level visible buttons: **98**

**Settings modal contents (14 buttons, 4 sections):**

- DISPLAY & ACCESSIBILITY (6): Colorblind, Text size, Simplified, Accessible Wiring, Light Mode, Difficulty Mode
- AUDIO (2 sliders)
- NOTIFICATIONS (3): Daily, Weekly, Streak
- DATA (4): Export, Import, Install App, Reset Progress
- Plus Close

The settings drawer is *organised* (genuine improvement from Cycle 1), but `🔧 Difficulty Mode` is filed under "Display & Accessibility", which is a weird home for a gameplay-rules setting, and `📲 Install App` is always visible even on devices that already have the PWA installed or do not support `beforeinstallprompt`.

---

## Where the Eyes Snag (2026-05-15 walkthrough)

A first-time player today still meets:

1. **Difficulty modal as the first interaction.** It is still labelled with "Standard (Recommended)" — if Standard is right for most players, the modal is a tax. Day 64 removed the *second* onboarding modal but kept the first. ⚠️
2. **Level 1 hint copy.** Under the hint button, fresh L1 shows: `💡 Hints won't reduce stars · 🧠 No hints = Pure Logic badge`. This is a meta-rule explainer addressed to a player who has not yet been told there *are* stars. Cycle 1's Tier 2 cut #7. Still not shipped. ⚠️
3. **Top-left gameplay icons** (`← Back / ? / 📚 / ⌨`). Three of the four are unlabeled glyphs with no tooltip. `?` is shortcuts, `📚` is encyclopedia, `⌨` is keyboard wiring. None of these matter for someone halfway through Step 1/8 of the tutorial. Cycle 1's Tier 2 cut #9. Still not shipped. ⚠️
4. **Step 1/3, 2/3, 3/3 chips** on the first three level cards (Day 69 onboarding arc). They are valuable on cold start but stay rendered on locked cards too — L2 and L3 both still wear their step chip even when they're locked, which doubles the "you must do these next" signal next to the padlock.

A mid-game player (tier 2, 12 levels solved) meets:

5. **The Tier 2 cliff.** Going from 5→6 levels reveals 3 things (Daily, Encyclopedia, Stats). Going from 11→12 reveals **13 things at once**: Puzzle of the Week, Adaptive, Infinite, Random, Blitz, Speedrun, Sandbox, Creator, Achievements, Customize, Mastery Tree, Collection, Logic Profile. There is no warmup. The screen just gains a wall of buttons.
6. **`🎯 Adaptive Novice`.** Cycle 1's polish renamed this to "Adaptive" — but the **skill pill template** that re-renders after first use says "🎯 Adaptive Novice" again. The skill suffix leaks back into the label.
7. **`🏗️ Puzzle of the Week` and `🏆 Tournament` are both alive at Tier 2.** Tournament is supposed to *replace* Puzzle of the Week at Tier 3 (per Day 72 spec). Between Tier 2 and Tier 3 they coexist for 6 levels. They are extremely similar — a once-a-week shared puzzle with a leaderboard.

An end-game player (40 levels, 40 ⭐⭐⭐) meets:

8. **Per-card sub-buttons everywhere.** 80 extra buttons rendered. `🏆 Gate Limit` is a *replay challenge* (re-solve with the gate budget enforced). `👁 Solution` is a *replay viewer* (watch your own circuit play). Both are valuable, but they belong inside the level card on hover/tap or behind a single `⋯` (More) menu, not constantly on every card.
9. **Five info modals that all answer "what have I done"**: Achievements, Stats, Customize, Mastery Tree, Collection, Logic Profile. Achievements and Logic Profile mostly show the same numbers. Mastery Tree and Achievements both gate cosmetics. Collection (saved circuit previews) and Customize (unlocked cosmetics) are sibling "stuff I've collected" screens.

## Inside the Gameplay (Level 1 cold, with tutorial active)

Level 1 sidebar now (verified live):

```
🟢 Level 1: AND Gate Basics
Output is 1 only when BOTH inputs are 1.
Gates: 0/1   ★★★
[truth table 4 rows]
[▶ RUN]  [⚡ Quick Test]  [Clear Circuit]  [💡 Hint (🪙3)]
💡 Hints won't reduce stars · 🧠 No hints = Pure Logic badge
Build your circuit, then press RUN
```

Tutorial overlay correctly fires (`STEP 1 OF 8`, AND gate highlighted, Skip Tutorial visible). `Used in: L4, L6…` forward references **are correctly hidden** (Day 64 fix #5 held).

The single remaining cold-state issue on L1 is the hint-policy meta-copy. Removing that line drops the right column to one fewer "you should know this" item for a player whose entire mission is "drag, draw three wires, RUN".

---

## Proposed Cuts (ranked by impact ÷ risk)

### 🔪 Tier 1 — Highest Impact, Lowest Risk (do Tuesday)

1. **Collapse per-card sub-buttons into a single `⋯ More` overflow on completed cards.** Tap-to-expand reveals `👁 Solution` + `🏆 Gate Limit` + (future "Pure-logic / hardcore retry"). *Net effect: end-game level-select drops from 98 → 18 visible buttons. Single biggest win available.*
2. **Smooth the Tier-2 reveal.** Instead of unlocking 13 buttons at level 12, stagger:
   - L 6 (already): Daily Challenge, Encyclopedia, Stats
   - L 9: Random Challenge + Sandbox (procedural / freeform pair)
   - L 12: Adaptive + Achievements + Customize
   - L 15: Mastery Tree + Logic Profile + Collection
   - L 18 (already): Tournament + Infinite + Blitz + Speedrun + Creator
   *Net effect: Tier-2 cliff disappears; players meet new modes as their need for them grows.*
3. **Drop `🏗️ Puzzle of the Week` once `🏆 Tournament` is live.** Tournament *is* the weekly puzzle plus leaderboard plus archive — Puzzle of the Week is the v1 that Tournament shipped to replace. Hide PotW immediately on Tier 3. Better: retire it now, alias the button on Tier 2 to "🏆 Tournament Preview" with a peek of this week's puzzle.
4. **Cut the Level 1 hint-policy footer line.** `💡 Hints won't reduce stars · 🧠 No hints = Pure Logic badge` belongs on level 4 (when the player first earns a hint token), not level 1 step 1.
5. **Silent-default the difficulty modal.** Default everyone to Standard on first launch; surface a one-time toast: "Mode set to Standard. Change anytime in ⚙️ Settings." That kills the last cold-start ceremony. Power users can still pick Hardcore via Settings.

### 🪒 Tier 2 — Medium Impact

6. **Tooltip the 4 top-left gameplay icons** (`?`, `📚`, `⌨`). Native `title=` attributes + `aria-label`. Trivial code. Cycle 1's cut #9 — still owed.
7. **Hide Step chips on locked cards.** "Step 1/3" makes sense on the actionable L1 card. On the locked L2/L3 cards, the chip + the padlock are double-counting the same "do these next" signal. Hide chips on `.level-btn.locked`.
8. **Move `🔧 Difficulty Mode` out of DISPLAY & ACCESSIBILITY and into a new GAMEPLAY section.** Or fold it under the difficulty-modal flow so it's only entered via "Want a different challenge level?". It is not a display option.
9. **Hide `📲 Install App` when the app is already standalone** (`matchMedia('(display-mode: standalone)').matches` or iOS `navigator.standalone`). Same gate already exists for the install prompt arc — Settings should respect it too.
10. **Fix the "Adaptive Novice" re-leak.** The skill-pill template needs to land *next to* the button label, not inside it. Verify across all four skill tiers (Novice → Intermediate → Advanced → Expert).
11. **Merge the "what have I collected" pile.** Combine `🏆 Achievements`, `🌳 Mastery Tree`, `🎨 Customize`, `🗂️ Collection`, `🧬 Logic Profile` into a single `🏛️ Profile` modal with tabs: Achievements / Mastery / Cosmetics / Saved Circuits / Stats. 5 buttons → 1. Tabs are cheap; nav buttons cost attention.

### 🌿 Tier 3 — Polish

12. **Trim "⏱ 0:30" on completed level cards.** Showing the *best time* on a card a player completed weeks ago is information they did not ask for. Either move time inside the `👁 Solution` overflow, or only show it when it is a personal best within the last week.
13. **Trim difficulty modal copy.** "You can change this anytime in Settings" undermines the choice ceremony. If we keep the modal, drop the apology.
14. **Drop the `⭐⭐⭐` glyph row from card meta on completed cards** — the gold star count is already implied by the gold-bordered "completed" state. Save a row of vertical space.
15. **Reset Progress under a confirm modal with typed confirmation.** Currently `⚠ Reset Progress` is a one-click button at the bottom of the Settings drawer. One mis-tap from any user wipes their save. Either type-to-confirm ("type RESET") or 5-second hold-to-confirm.

---

## Cycle 1 Cuts Status Recap

For continuity, here is what Cycle 1's PRUNE_REPORT proposed and whether it shipped:

- ✅ #1 Mode gating by progress — shipped Day 64
- ✅ #2 Merge Submit/Create → Creator — shipped Day 64
- ✅ #3 Consolidated Settings modal — shipped Day 64
- ✅ #4 Drop placement test from cold start — shipped Day 64
- ✅ #5 Hide forward-reference "Used in: …" — shipped Day 64
- ❌ #6 Collapse Daily/Blitz/Speedrun under "Timed" — **not shipped**, supersedes by Tier 1 cut #2 above
- ❌ #7 Trim L1 hint copy — **not shipped**, repeat as Tier 1 cut #4
- ✅ #8 Reduce padlock visual weight — shipped Day 66
- ❌ #9 Top-left 4 icons label/move — **not shipped**, repeat as Tier 2 cut #6
- ✅ #10 Hide streak chip on fresh profile — partial, shipped Day 69
- ✅ #11 Adaptive Challenge → Adaptive — shipped Day 66 (regression flagged above as Tier 2 cut #10)
- ✅ #12 Hide ⭐ 0 chip on fresh profile — shipped Day 66
- ❌ #13 Difficulty modal copy — **not shipped**, repeat as Tier 3 cut #13
- ❌ #14 Settings overflow polish — partial (organised, but Difficulty Mode misfiled)
- ✅ #15 Subtitle compression — shipped Day 66

Cycle 1 hit 9 of 15 cuts (60% landing rate). Cycle 2 should pick up the unshipped four (#6, #7, #9, #13) plus the three *new* clutter sources (per-card sub-buttons, Tier-2 cliff, info-modal sprawl).

---

## Day 2–4 Plan

- **Day 2 (Tue) — Simplification:** Execute Tier 1 cuts #1, #2, #3, #4, #5. Highest impact.
- **Day 3 (Wed) — Code Cleanup:** Net-negative code pass. Pull out any logic supporting Puzzle of the Week (subsumed by Tournament), dead cosmetic-modal panes from the merged Profile (if Tier 2 cut #11 lands).
- **Day 4 (Thu) — Polish:** Tier 2 cuts #6, #7, #8, #9, #10, #11 + any Tier 3 polish.
- **Day 5 (Fri) — Expert Panel + Validation:** Play 5 levels across chapters, re-score 10 dimensions, compare to Cycle 1 prune score (8.4) and Day 35 baseline (7.3). Target: ≥ 8.7.

---

*End of Cycle 2 PRUNE_REPORT. Clutter Score: 5/10. Three new clutter sources identified. Five Cycle 1 carry-overs. Twelve fresh cuts proposed in 3 tiers.*
