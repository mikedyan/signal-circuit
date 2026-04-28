# PRUNE REPORT — Cycle 1, Prune Week, Day 1 (Fresh Eyes Audit)

**Date:** 2026-04-28 (Tuesday)
**Cycle:** 1
**Auditor pose:** First-time player landing on https://mikedyan.github.io/signal-circuit/ with a clean profile (`localStorage` cleared).
**Build under audit:** `index.html?v=1777216661`, SW `signal-circuit-v42`.

---

## TL;DR

Signal Circuit is a *good* game burying itself under its own features. The level-select screen alone presents **29 visible buttons + 40 level cards + a streak/star header**, and a brand-new user must dismiss **two onboarding modals** before they ever see Level 1. Several modes overlap, several "settings" belong in a submenu, and the gameplay sidebar shows information that is meaningless before the campaign opens up.

The good news: most of the bloat is *cosmetic* (button density, premature info). Almost every cut here can be made without killing functionality — just gating, grouping, or hiding-by-default.

## Clutter Score: **8 / 10**

(10 = unplayably overwhelming, 1 = monk-tier minimal)

Anchor reasoning: a fresh user is asked to choose a difficulty, then faces 9 challenge-mode buttons, 8 info-modal buttons, 12 settings buttons, plus the campaign chapters — all on one scroll. Even *I* had to grep the DOM to be sure no buttons were duplicates; a human will not.

---

## Headcount of UI

Counted live on the deployed build, fresh `localStorage`:

- **Onboarding modals before Level 1:** 2 (Quick Placement Test → Choose Your Difficulty)
- **Game-mode entry points on Level Select:** 9
  - 🏗️ Puzzle of the Week
  - 🔬 Daily Challenge
  - 🎯 Adaptive Challenge (Novice)
  - 🎲 Random Challenge
  - 🔥 Blitz Ladder
  - 🏁 Speedrun
  - 🔧 Sandbox
  - ✏️ Submit Your Level
  - ✏️ Create Level
- **Info / modal buttons on Level Select:** 8
  - 📖 How to Play, 📚 Gate Encyclopedia, 🏆 Achievements, 📊 Stats, 🎨 Customize, 🌳 Mastery Tree, 🗂️ Collection, 🧬 Logic Profile
- **Settings buttons on Level Select:** 12
  - 👁 Colorblind, 🔤 Text size, 🧩 Simplified, 🔌 Accessible Wiring, ☀️ Light Mode, 🔧 Difficulty Mode, 🔔 Daily notif, 📅 Weekly notif, 🔥 Streak notif, 📤 Export, 📥 Import, Reset Progress
- **Top-level visible buttons on Level Select:** **29**
- **Level cards visible:** 40 (across 7 chapter sections incl. Chapter 3.5)
- **Top-left toolbar in gameplay:** 4 icons (Back + 3 small unlabeled)
- **Right sidebar buttons in gameplay (Level 1):** ~9 (Prev/Next, Truth Table toggle, RUN, Quick Test, Clear Circuit, Hint, +info chips)

## Where the Eyes Snag

When I first hit the site, the things I noticed *before I noticed Level 1* were:

1. The Quick Placement Test asked a question Level 1 itself answers ("Which gate outputs 1 only when both inputs are 1?"). It is teaching by quiz before it has taught anything.
2. The Difficulty modal called Standard "Recommended" — so why ask? Most users will click Standard and move on; the choice feels like ceremony.
3. The level grid's lock icons dominate visually. With 1/40 unlocked, ~38 cards are visually noisy padlocks.
4. Below the grid, the **block of 9 challenge buttons** competes for attention with the campaign that the user hasn't started yet. Nearly every challenge mode is unusable until later levels are cleared, but they are all rendered at full prominence.
5. **Submit Your Level** and **Create Level** sit next to each other with the same ✏️ icon and overlapping verbs.
6. The settings strip at the bottom is a wall of toggles. Light Mode, Difficulty Mode, three notification toggles, two file-IO buttons, and a Reset button all share the same row treatment as accessibility options.

## Inside the Gameplay (Level 1, Tutorial Step 1/8)

Level 1's right sidebar shows **"Used in: L4, L6, L10, L11, L12, L13, L14, L15 +20 more"** to a player who has not unlocked any of those. It's a forward-reference to nothing. Same screen also shows the verbose hint policy ("Hints won't reduce stars · No hints = Pure Logic badge") *before the player has built anything*. The sidebar is doing too much work for a level whose entire goal is "drag AND, draw 3 wires, click RUN".

---

## Proposed Cuts (ranked by impact ÷ risk)

### 🔪 Tier 1 — Highest Impact, Lowest Risk (do Tuesday)

1. **Hide secondary modes until Chapter 1 is cleared.**
   On a fresh profile, show only: campaign grid + How to Play. Once `levelsCompleted >= 6` (end of Ch 1), reveal Daily Challenge + Encyclopedia. Once `>= 12` (end of Ch 2), reveal everything else. *Net effect: drops first-launch button count from 29 to ~5.*

2. **Merge "Submit Your Level" and "Create Level" into one button: "✏️ Create / Submit"** (or just **Creator**). The Creator screen already handles both flows.

3. **Move the 12 settings buttons into a single "⚙️ Settings" modal.** Keep one ⚙️ button visible on level select; everything else (colorblind, text size, simplified, accessible wiring, light mode, difficulty mode, notifications, export/import, reset) lives inside.

4. **Drop the Quick Placement Test from the cold-start flow.**
   The campaign already gates difficulty by progress, and we have the Difficulty modal. The Placement Test asks a question Level 1 teaches — let Level 1 teach it. Keep the test code reachable from Settings → "Recalibrate skill" for power users.

5. **On Level 1 sidebar, hide "Used in: …" until at least one downstream level is unlocked.** Forward references to locked content add anxiety, not insight.

### 🪒 Tier 2 — Medium Impact

6. **Collapse "Daily / Weekly / Blitz / Speedrun" under a "Timed" group.** Keep Daily as the headline (it is the most-engaged), tuck the other three behind a "More timed modes ▾" expander. Same for "Random / Adaptive" → "Procedural" group.

7. **Trim Level 1 hint copy.** The two-line "Hints won't reduce stars · No hints = Pure Logic badge" is a meta-rule explainer that belongs in How to Play, not on a player's first level.

8. **Reduce padlock visual weight.** Locked cards still take full color and full padding; greyscale + 60% opacity would push the eye to the unlocked card without removing information.

9. **The four icons in the top-left of gameplay** (Back, ?, 🎓, 🌙) need labels or tooltips. Two of them are unrecognisable on first sight. At minimum: only show back during gameplay; move 🎓 (Tutorial) and 🌙 (theme) to the Settings modal from cut #3.

10. **Streak header on a fresh profile** shows "🔥3 🧊1" (3-day streak, 1 freeze token) **before the user has played anything**. That's a stat the system invented to greet the user. Either remove the seed or hide the streak chip until the player has 2+ days of activity.

### 🌿 Tier 3 — Polish

11. **"Adaptive Challenge Novice"** label is two words too long. Rename to **"Adaptive"** with the level-tag inside (e.g., a small "Novice" pill next to it).

12. **Star header "⭐ 0"** on a fresh profile is honest but joyless. Either omit until the first star, or replace with a "Start Chapter 1 →" CTA in that slot.

13. **Difficulty modal "You can change this anytime in Settings"** copy is reassuring but undermines the choice. If we're going to ask, we shouldn't apologise; if we're going to apologise, we should default and not ask. Lean toward defaulting silently.

14. **Reset Progress** button on the *main* settings strip is a nuke that doesn't need front-page real estate. Move into Settings → Data → "Reset…" with a confirm dialog.

15. **Subtitle "Repair the ship's logic systems. One circuit at a time."** is two sentences that say the same thing. One is enough.

---

## Items I am *not* proposing to cut

These came up but earned their keep:

- **Mastery Tree, Collection, Logic Profile** — niche but cheap, valuable for retention. Group them under the campaign-progress sidebar instead of removing.
- **Encyclopedia** — the educational case for this game; keep prominent, but maybe a single icon in a header bar instead of in the button stack.
- **All accessibility toggles** — keep functionality, just stop displaying them as front-row buttons. Inside Settings → Accessibility they are perfect.
- **Achievements / Stats / Customize** — earned features from prior cycles; just demote into a "Profile" sub-area.

---

## Bytes-on-the-floor estimate

Without writing a line of code yet, the cuts above should:

- Drop level-select visible buttons from **29 → ~6** for new users (and ~10–12 for veterans).
- Drop time-to-Level-1 from **2 modal taps + 1 click → 1 click** (Skip Placement Test removal alone saves a screen).
- Trim ~150 lines of CSS related to the settings strip layout (style.css now 6,250 lines).
- Trim 1–2 KB of JS where Submit/Create branched into the same Creator entry.

We'll measure for real on Wednesday (Code Cleanup day).

---

## Day 2 (Wednesday) Plan Preview

Execute Tier 1, items 1–5, in this order:
1. Settings modal consolidation (cut #3) — most code, biggest visual win.
2. Mode gating by progress (cut #1) — biggest cognitive win.
3. Merge Submit/Create (cut #2) — easy.
4. Skip Placement Test by default (cut #4) — flag-toggle.
5. Hide "Used in" on Level 1 sidebar (cut #5) — one-liner.

If time remains, start Tier 2 items 6–7.

— *Mochi*
