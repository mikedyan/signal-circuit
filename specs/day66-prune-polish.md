# Day 66 — Cycle 1 Prune Week, Day 4: Polish Sprint

**Date:** 2026-05-01 (Friday)
**Week type:** prune | **Week day:** 4 (Polish Sprint)
**Scope reminder:** Net-negative or net-flat code only. Polish, not features.

## Goal

Sand the rough edges that the Day 63 Fresh-Eyes Audit (`PRUNE_REPORT.md`)
flagged in **Tier 2 / Tier 3**, but never got around to. None of these
remove functionality; each one removes *visual or cognitive friction*
on the cold-start path and inside the gameplay shell.

## Items

### Polish #1 — Subtitle compression (PRUNE Tier 3, cut #15)

`#game-narrative` currently reads **"Repair the ship's logic systems. One
circuit at a time."** The two sentences say the same thing; the second
half is filler.

- **Change:** "Repair the ship's logic systems. One circuit at a time." → **"Repair the ship's logic systems."**

### Polish #2 — Adaptive Challenge label tightening (PRUNE Tier 3, cut #11)

"🎯 Adaptive Challenge" with an inline "(Novice/Intermediate/…)" pill
runs to ~26 characters, making the challenge button the widest in the
row. The word "Challenge" is implied by section context ("Challenge
Mode"), and the skill pill carries the discriminator already.

- **Change:** Default label `🎯 Adaptive Challenge` → `🎯 Adaptive` in
  - `index.html` (button text)
  - `js/ui.js` `updateAdaptiveButtonBadge()` (both the no-skill fallback
    and the badge-with-pill template)
  - `aria-label` updated to "Adaptive Challenge" (full word kept for
    screen readers).

### Polish #3 — Locked level card visual de-emphasis (PRUNE Tier 2, cut #8)

Locked cards currently stand at `opacity: 0.55` with a `#333` border
and the same padding as unlocked cards. Visually they fight the eye
on a fresh profile (1 unlocked, 39 locked).

- **Change:** Drop opacity to `0.42` and add `filter: grayscale(0.5)`
  to push locked cards into the background. Light-mode mirror: keep
  `background: #f0f0f0` but add `filter: grayscale(0.5); opacity: 0.6`.
- **Rationale:** Same information, less visual tug. Hovering an unlocked
  card now feels distinctly more rewarding because the contrast jumps.

### Polish #4 — Hide "⭐ 0" on a fresh profile (PRUNE Tier 3, cut #12)

`#progress-stars` shows literal `⭐ 0` to a brand-new player who has not
earned a star yet. It's joyless and reads like a deficit. The progress
text already says `0/40 Levels`, so the zero star count is redundant.

- **Change:** In `UI.updateProgressBar()`, when `totalStars === 0`, set
  `starsEl.style.display = 'none'`. Reveal it the first time the
  player earns a star.

## Acceptance criteria

- Cold start (`localStorage` cleared) on the deployed build:
  - Subtitle is one sentence.
  - Adaptive button label is `🎯 Adaptive` with the colored skill pill.
  - Locked level cards visibly fade behind the unlocked card.
  - `⭐ 0` chip is gone; reappears as `⭐ 1` after first star.
- After completing Level 1: star chip reappears with `⭐ 1`.
- Light mode: locked cards still readable (not pure white-on-white).
- 0 console errors.
- `git diff --shortstat` insertions explainable in one sentence (cache-bust + 4 small edits).

## Cache bust

- `index.html` `?v=` → `1778083200`
- `sw.js` `CACHE_NAME` → `signal-circuit-v45`

## Out of scope today

- Tier 2 cuts #6 (collapse Daily/Weekly/Blitz/Speedrun) and #9 (gameplay
  top-left icon labeling) — bigger surgery, deferred to next cycle's
  prune week or rolled into a build-week UX day.
- Tier 3 cut #13 (Difficulty modal copy) — placement test is already
  opt-in (Day 64), so the modal rarely fires; low impact.

— *Mochi (Polish Sprint)*
