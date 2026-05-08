# Cycle 2 — Build Week Summary

**Dates:** May 4 – May 8, 2026 (Days 68–72, cycleDay 16–20)
**Theme:** "Depth over breadth" — fewer features, each one earning its place.
**Score baseline:** 8.4 / 10 (end of Cycle 1)
**Target:** 8.7 / 10

---

## What shipped

| Day | Feature | Files touched | Achievements added |
|-----|---------|---------------|---------------------|
| 68 (Mon) | **Infinite Mode** — endless skill-adaptive run with 3 lives, streak, tier bumps every 5-streak | main.js (+InfiniteRunManager), ui.js, index.html, style.css, sw.js v46 | infinite_marathon (gold), pure_logic_run (gold) |
| 69 (Tue) | **Mobile Install Onramp** — welcome arc on first 3 wins + branded install modal + iOS instructions + 14d/90d snooze | main.js (NotificationManager rewrite), ui.js, index.html, style.css, sw.js v47 | — |
| 70 (Wed) | **Discovery Lab → Lab Bench: Blueprint Mode** — design-first, 3-submit constraint, blueprint hologram celebration, Lab Bench rebrand | main.js (lab state machine), ui.js, levels.js (lab flag), style.css, sw.js v48 | drafted_right (gold), lab_method (gold) |
| 71 (Thu) | **Rare/Epic Achievement Tier** — 5 mythic + 3 diamond chase achievements, tier metadata, mythic celebration overlay, mythic wire palette, tier-sorted modal | achievements.js, main.js, ui.js (renderAchievements rewrite), index.html (mythic-celebration), style.css, sw.js v49 | 8 (5 mythic + 3 diamond) + latent showAchievementToast bug fix |
| 72 (Fri) | **Weekly Tournament Mode** — seeded weekly puzzle, pseudo-leaderboard, single-shot scoring, last-8-week archive, tier3 gating | main.js (+WeeklyTournament), ui.js (tournament screen + tabs), achievements.js, index.html, style.css, sw.js v50 | tournament_podium (gold), tournament_crowned (gold) |

**Net achievement additions:** 14 (5 mythic + 3 diamond + 6 gold)
**Cache buckets shipped:** v46 → v47 → v48 → v49 → v50

---

## Replayability vs first impression

The cycle 1 review flagged **replayability (5/10)** and **addictiveness (6/10)** as the two biggest weaknesses. Cycle 2 attacks both:

- **Infinite Mode (Day 68)** turns the SkillTracker (Day 50) into a real chase loop. Every run produces a streak number that's worth pushing.
- **Tournament (Day 72)** adds a *weekly* chase loop on top of the daily and infinite ones. Same puzzle for everyone, single-shot scoring, podium / crowned achievements that take real effort.
- **Mythic tier (Day 71)** gives long-tail chase items: 100-streak Lightning, 30-day Eclipse Run, all-mastery Galaxy Brain. These are intentionally hard and visible — players will see locked mythic tiles in the achievements modal and feel pulled.

The conversion side gets the **install moment (Day 69)**: prompt fires when intent is highest (3rd solve), with a branded modal explaining offline + notification benefits. iOS gets explicit Add-to-Home-Screen instructions.

---

## Architecture notes

- `InfiniteRunManager` and `WeeklyTournament` follow the same shape: separate manager class, owns its own localStorage namespace, intercepts in BOTH `runSimulation` and `runQuickTest` before standard challenge / campaign branches.
- `WeeklyTournament` uses an ISO-week key (`YYYY-Www`) for archive determinism. Past weeks are reproduced by stubbing `Date` temporarily inside `buildPuzzle()` — keeps the archive deterministic without needing a separate seeded generator.
- Scoring: `score = gates × 100 + max(0, timeSec - 60)`. Lower wins. Speed only matters past 60s, so the budget stays "complete it cleanly first, optimize gates" — matches the rest of the game's design.
- Tier metadata on every achievement (Day 71) lets the modal sort + visualize (mythic prismatic, diamond icy, gold metallic). Migration was zero-downtime because tier defaults aren't required for unlock logic — only display.

---

## Lessons (full versions in LESSONS_LEARNED.md)

1. **Manager classes win in this codebase** — InfiniteRunManager + WeeklyTournament both followed the same pattern (ctor takes `game`, owns `_load/_save`, exposes `start*` methods, intercepts in both run paths). Less coupling than dropping logic into GameState directly.
2. **Latent bugs surface on co-occurring paths** (Day 71 finding) — the singular `showAchievementToast` call had been broken since Day 53 but only fired when Architect mythic landed alongside another unlock. Rule: when adding a new path that joins multiple existing paths, sanity-check the shared call sites.
3. **Cache bust + sw bump must be paired** — every Cycle 1 lesson reaffirmed: ship them together. Cycle 2 made it explicit in every spec.
4. **Tier gating beats hide-everything-by-default** (Day 64+72) — tier1/tier2/tier3 thresholds let secondary modes earn their slot. By tier3 (18+ levels), the player is committed enough that a Tournament button doesn't feel like clutter.

---

## Score forecast

The expert panel re-score happens during Cycle 2 prune week (Day 80). Based on shipped features:

- **Replayability (5 → 7):** Infinite + Tournament + mythic chase loops.
- **Addictiveness (6 → 7.5):** chase tier, podium achievement, weekly reset.
- **First impression (7 → 7.5):** install moment fires at peak intent; tier3 surface only opens after real engagement.
- **Other dimensions:** held flat to slightly up.

**Forecast:** 8.7 ± 0.1 — meeting target.

---

## Stats

- LOC added (Build week): ~+1,600 (target was +2,000; underran on purpose — Day 71 mostly added without removing, Day 72 added net new screen + class)
- Open bugs at end of Build week: **0**
- New achievements: 14
- New screens: 3 (infinite-pre-screen, infinite-summary-screen, tournament-screen)
- Cache buckets cycled: 5

---

## Going into Harden week (Cycle 2, Days 73–77)

The harden audit on Monday will exercise:
- Tournament button gating (cold start, tier2, tier3)
- Tournament screen tabs + archive + score submission + podium/crowned achievements
- Lab Bench attempt counter + Reset Lab + first-try achievements
- Infinite Mode pause/resume edge cases
- Mythic celebration overlay timing
- Install modal snooze + iOS fallback
- Mythic palette unlock + cosmetics modal

Expected open bug list: 1–3 P2s (per Cycle 1 baseline). No P0 / P1 introduced.
