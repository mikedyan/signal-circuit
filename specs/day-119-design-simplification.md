# Day 119 — Cycle 5 PRUNE Week, Day 2: Design Simplification

**Date:** 2026-06-26 (Friday) · cycleDay 70 · Day 119
**Build:** `?v=1781395200` / sw v73 → **`?v=1782432000` / sw v74** (first source-file change since Day 111)
**Harness:** `qa-reports/day-119-qa.cdp.js` — **35/35 assertions, 6 phases, 0 console.error, 0 Runtime.exceptionThrown (first run)**
**Result:** Shipped the 3 Tier-1 cuts from the Day 118 `PRUNE_REPORT.md`.

---

## Cut #1 — De-duplicate tournament history

**Problem (PRUNE_REPORT Tier-1 #1):** The Tournament screen had `This Week / My Best / Archive` tabs, and the Day 111 Stats modal *also* grew a `🏆 Tournament` tab. `My Best` and Stats → Tournament answer the same question ("how have I done in tournaments?") in two different modals.

**Fix:** Tournament screen is now *competition only* (This Week leaderboard + Archive leaderboards). Personal history is canonical in **Stats → 🏆 Tournament** (Day 111).

- `index.html`: removed the `My Best` tab button and the entire `#tournament-tab-my-best` pane (`#tournament-mybest` container). Added a one-line muted pointer under the tab strip: *"📊 Your personal tournament history lives in Stats → 🏆 Tournament."*
- `js/ui.js`: removed the `if (which === 'my-best') this._renderTournamentMyBest();` dispatch from the tournament-tab click handler.
- `_renderTournamentMyBest()` is now **orphaned** (no caller). Left in place for the **Day 120 (Code Cleanup)** dead-code sweep per the Day 119 plan — not removed today to keep this commit a clean IA change.

**Net:** Tournament screen drops 3 tabs → 2. No data lost. One clear home for "my history."

## Cut #2 — `⚠ Reset Progress` typed-confirm gate

**Problem (PRUNE_REPORT Tier-1 #2, promoted from Cycle 4 Tier-3 #14):** One-click `⚠ Reset Progress` at the bottom of Settings wiped the entire save on a single mis-tap.

**Fix:** New `UI.showTypedConfirmModal(message, confirmWord, onConfirm)` reuses the existing `#confirm-modal` DOM with a newly-added (default-hidden) `#confirm-modal-input`. The OK button stays `disabled` (visually disarmed via `.is-disabled`) until the user types `RESET` (case-insensitive, trimmed). Enter-to-confirm supported. Cancel aborts and re-hides the input. Falls back to plain `showConfirmModal` if the input element is absent.

- `index.html`: added `<input id="confirm-modal-input" … style="display:none;">` inside `#confirm-modal-content`.
- `js/ui.js`: added `showTypedConfirmModal()`; rewired the `reset-progress-btn` handler to use it with `'RESET'`.
- `css/style.css`: styling for `#confirm-modal-input` (centered, uppercase, red border) + the disarmed `#confirm-modal-ok.is-disabled` / `:disabled` state.

**Safety invariant verified:** clicking OK while disarmed is a **no-op** — modal stays open, progress untouched (P3.f). The plain `showConfirmModal` keeps the input hidden, so non-destructive confirms (End Run, Clear Scores, etc.) are unaffected (P3.k).

## Cut #3 — Hide zero-count Stats tabs

**Problem (PRUNE_REPORT Tier-1 #3):** A brand-new player opening Stats saw three tabs, two of them `(0)` empty (`📸 My Cards (0)` + `🏆 Tournament (0)`). The Day 104/111 `.empty` dim still let them occupy the strip and invite a dead-end click.

**Fix:** `_updateStatsTabsUI()` now toggles `style.display = 'none'` on each count-gated tab when its count is `0` (superseding the `.empty` class, which is removed). The tab reveals the first time its count goes positive. `_switchStatsTab()` gained a defensive guard: routing to `cards`/`tournament` while that count is `0` falls back to `overview` so a hidden tab can never be the active pane.

**Net:** A new player's Stats modal collapses to a single `📊 Overview` tab. The Day 103 default-to-Cards behavior still applies for players who *do* have cards.

---

## Verification (35/35, first run)

| Phase | Coverage | Assertions |
|---|---|---|
| P1 | Build identity (local, ?v=1782432000 / sw v74) | 3 |
| P2 | Cut #1 — 2 tabs, no My Best tab/pane, pointer present, Archive + This Week work | 7 |
| P3 | Cut #2 — input shown, OK disarmed until RESET, arms on match (case-insensitive), disarmed click no-op, Cancel aborts, RESET wipes, plain confirm unaffected | 11 |
| P4 | Cut #3 — both count-gated tabs hidden cold, only Overview visible, no strand, reveal on card add | 6 |
| P5 | Regression — cold 2 nav / 50 cards, Day 79 dead-ids, end-game 18 nav + 50 overflow + 50 cards | 6 |
| P6 | Console hygiene | 2 |

**Source LOC:** `+121 / −24` across 4 files (`index.html`, `js/ui.js`, `css/style.css`, `sw.js`). Cuts #1 + #3 remove surfaces (net-negative); Cut #2's typed-confirm modal (`showTypedConfirmModal` + input + CSS) is the additive piece — anticipated by the PRUNE_REPORT ("Cut #2 adds a small confirm modal — net should land at or below zero"). Comment-stripped, the functional delta is dominated by the genuine safety feature. Day 103 precedent: Design-Simplification day lands net-positive-but-comment-stripped-near-neutral.

**Open Bugs:** 0 → 0 (44-day streak since Day 76). **Latent observations:** 0 → 0.

---

## Day 120 plan (Code Cleanup)

- Remove the orphaned `_renderTournamentMyBest()` helper (dead since Cut #1).
- Sweep for any other tournament-`my-best` references (CSS `.tournament-mybest*`, `.tournament-best-card`).
- Tier-2 Cut #4 groundwork: collection-modal merge scaffolding (18-button Tier-3 plateau).
