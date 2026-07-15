# Day 138 Spec — 🎮 Modes Hub (consolidation)

**Cycle 7 · BUILD Week · Day 1 · cycleDay 89 · Day 138 · 2026-07-15**

## Goal
Fold the 8 always-visible "Challenge Mode" buttons on the level-select into ONE `🎮 Modes` button that opens a `#modes-hub-modal`. Each mode becomes a `.mode-card` with the original button (as CTA) + a one-line description. Net: level-select challenge section 8 buttons → 1; every mode gains discoverability context.

## Non-negotiables (Day 124 "re-parent, don't rewrite" discipline)
- Move the **exact** `<button>` elements — preserve `id`, `class`, `aria-label`, label text — so all existing wiring survives untouched:
  - Click handlers: `setupChallengeConfig()` (random/daily/sandbox/adaptive/infinite/tournament) + `setupCompetitiveModes()` (blitz/speedrun).
  - Badge updaters: `updateDailyButtonBadge()`, `updateAdaptiveButtonBadge()`, `applySeasonalTheme()` — all read the button by id and set textContent/innerHTML/style (location-independent).
- **Tier-gating moves from buttons → card wrappers.** Replace the 8 `setVis('<btn-id>', gate)` calls with `setVis('mode-card-<key>', gate)`. The buttons themselves are always `display` (default) inside their card; the card is what's shown/hidden. This keeps the buttons visible whenever their card is, and keeps badge/text updates working.
- Remove the inline `style="display:none;"` from `#tournament-btn` (its card `#mode-card-tournament` now carries the gate).

## Cards (order = reveal staircase) — key · button id · gate · description
1. `daily` · `daily-challenge-btn` · g6 · "One fresh puzzle every day. Keep a daily streak alive."
2. `random` · `random-challenge-btn` · g9 · "A one-off randomized puzzle built to your specs."
3. `sandbox` · `sandbox-btn` · g9 · "Free-build canvas — no goal, just experiment with gates."
4. `adaptive` · `adaptive-challenge-btn` · g12 · "Puzzles that scale to your current skill level."
5. `tournament` · `tournament-btn` · g18 · "Compete on this week's featured puzzle leaderboard."
6. `infinite` · `infinite-mode-btn` · g18 · "Endless procedurally-generated puzzles — how far can you go?"
7. `blitz` · `blitz-mode-btn` · g18 · "Climb a ladder of puzzles against the clock."
8. `speedrun` · `speedrun-btn` · g18 · "Race to solve a fixed set as fast as you can."

## DOM changes (`index.html`)
- `#challenge-section` inner: replace the `#challenge-buttons` list with a single `<button id="modes-hub-btn" class="challenge-btn">🎮 Modes</button>` + retitle chapter-title to "More Ways to Play".
- New `#modes-hub-modal` (mirrors `#profile-hub-modal` shell): `#modes-hub-content` > h3 "🎮 Game Modes" + sub + `#modes-hub-list` (8 `.mode-card` wrappers, each = re-parented button + `<p class="mode-desc">`) + `#modes-hub-close`.

## JS changes (`js/ui.js`)
- `setVis` block (~L1009–1027): swap 8 button gates → 8 `mode-card-<key>` gates; add `setVis('modes-hub-btn', g6)`.
- New `setupModesHub()`: open/close/backdrop handlers (ONE consolidated backdrop handler, Day 61/74 discipline) + close-on-mode-pick (delegated click on `#modes-hub-list` → hide modal so the launched screen isn't behind the overlay). Call it alongside `setupProfileHub()`.

## CSS (`css/style.css`)
- `#modes-hub-modal` / `#modes-hub-content` mirror `#profile-hub-modal` shell. `.mode-card` (row: button + desc), `.mode-desc` muted subtext. Light-mode mirror.

## Cache-bust
`?v=1783900800` → `?v=1783987200` (11 refs); `sw.js` v84 → v85.

## QA (CDP, `qa-reports/day-138-qa.cdp.js`)
- P1 build identity: 11× `?v=1783987200`, sw v85, `#modes-hub-modal` + `#modes-hub-btn` present, 8 mode buttons live inside `#modes-hub-list`, old `#challenge-buttons` container gone.
- P2 cold-start: 2 nav buttons (How to Play + Settings), Modes button hidden cold (g6 gate), 50 cards.
- P3 tier reveal: seed 6 → Modes button visible, open hub → only Daily card visible; seed 9 → +Random/Sandbox; seed 12 → +Adaptive; seed 18 → all 8 cards visible.
- P4 launch integrity: from inside the hub, each of the 8 buttons still triggers its flow (click daily → daily screen; sandbox → sandbox config; tournament → tournament screen; blitz/speedrun start; random/adaptive/infinite entry) and the hub closes.
- P5 badge integrity: `updateDailyButtonBadge()` / `updateAdaptiveButtonBadge()` still mutate the re-parented buttons.
- P6 close paths: close button + backdrop both hide the modal.
- P7 regression floor: Day 79 dead-ids absent, Day 124 Profile hub intact, ESM bindings (Gate/Wire/Simulation), LEVELS=50.
- P8 console hygiene: 0 console.error, 0 Runtime.exceptionThrown.
