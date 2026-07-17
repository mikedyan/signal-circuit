# Day 140 — "Recommended for you" spotlight (Cycle 7 BUILD Week Day 3)

**Build:** `?v=1784160000` / sw `signal-circuit-v87`
**Roadmap item:** cycle-7-build.md Day 140 — *A single highlighted card at the top of the hub suggesting one mode based on player state.*

## What shipped
A `#modes-hub-spotlight` card at the **top** of the Day 138 Modes hub (above the
`#modes-hub-list`) that recommends ONE mode via a deterministic heuristic over
**existing** player state — no new persistence, no new data.

### New surface
- `index.html`: `<div id="modes-hub-spotlight">` between `.modes-hub-sub` and `#modes-hub-list`.
- `css/style.css`: `.spotlight-label` / `.spotlight-card` / `.spotlight-emoji` /
  `.spotlight-body` / `.spotlight-title` / `.spotlight-reason` / `.spotlight-cta`
  (+ light-mode mirrors). Gold-tinted gradient card to distinguish it from the
  regular `.mode-card`s.

### New JS (js/ui.js)
- `UI._modeButtonId(key)` — maps a mode key to its (re-parented, unchanged) launch
  button id, so the spotlight fires the exact same handler the card uses.
- `UI._recommendMode()` — deterministic, top-wins precedence. Every branch only
  recommends an **unlocked** mode (hub opens at g6, so daily is always valid):
  1. campaign 100% & Blitz unrun → **blitz** "Campaign conquered"
  2. g18 & no tournament runs → **tournament** "Enter the arena"
  3. g18 & Infinite unrun → **infinite** "How far can you go?"
  4. g18 & Blitz unrun → **blitz** "Beat the clock"
  5. g18 & Speedrun unrun → **speedrun** "Set a time trial"
  6. g12 → **adaptive** "Sized to your skill" (uses skill label when available)
  7. g9 → **random** "Mix it up"
  8. default g6 → **daily**: returning player (app-open streak ≥2) →
     "Keep your streak going"; first-timer → "Start here"
- `UI.renderModeSpotlight()` — paints the card; the Play button hides the hub then
  `.click()`s the recommended mode's real button. Re-innerHTML on every call, so no
  listener ever accumulates.
- Wired into `setupModesHub()` (initial paint) and the hub `open()` (re-resolves on
  every open so it reacts to progress made this session).

## Key design note (surfaced during QA)
`GameState.updateStreak()` runs on **every app load** (main.js `initialize`), so
`lastPlayDate` is always "today" and `streak` is always ≥1 by the time the hub
renders. It's an **app-open** streak, not a per-daily-completion flag. The heuristic
therefore treats the streak purely as an engagement signal (≥2 ⇒ returning player)
and never as a "you still owe today's daily" trigger — that state is unreachable
post-load. This replaced an earlier draft that (incorrectly) branched on
`!playedToday`.

## LOC
index.html +14/−13 (spotlight div + 11 cache-bust), css/style.css +53,
js/ui.js +~140, sw.js +1/−1. Net ≈ +195 functional.

## QA
`qa-reports/day-140-qa.cdp.js` — **40/40 assertions across 6 phases**, 0 console.error,
0 Runtime.exceptionThrown. Visual confirmation screenshot captured (`/tmp/day140-hub.png`):
spotlight renders gold "✨ Recommended for you" + "🏆 Enter the arena" card with Play ▸
CTA above the mode list.
