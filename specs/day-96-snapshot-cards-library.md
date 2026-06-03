# Day 96 Spec — Snapshot Cards Library Tab

**Cycle 4 BUILD Week Day 5 · cycleDay 44 · Day 96**

## Problem

Day 82 shipped per-level "📸 Share Card" generation — a 1200×630 PNG snapshot of the solved circuit, complete with stars, gate count, and a snippet of the actual placed gates/wires. The user could save, copy, or natively share the card from a modal — and then the card was discarded forever. No history, no gallery, no way to re-share a snapshot from yesterday without re-solving the level.

Day 96 closes that loop.

## Solution

A capped (20 entries) Snapshot Cards library, surfaced as a **`📸 My Cards`** tab inside the existing Stats modal. Every time `generateShareCard()` paints a card, the resulting `canvas.toDataURL('image/png')` is persisted into `localStorage` along with the card's metadata. The Stats modal grows a 2-tab strip — `📊 Overview` (default, current Day 54 dashboard) and `📸 My Cards (N)` — and the new tab renders a grid of thumbnails. Clicking any thumbnail re-paints the cached image onto `#share-card-canvas` and re-opens the share-card modal with the same Save / Copy / Share affordances Day 82 wired. Reset Game wipes the library.

This is a pure follow-up day — no new gameplay surface, no new top-level button, no cold-start clutter delta. The cold-start non-level button count stays pinned at 2 (Day 78 invariant), and the share-card modal itself is byte-identical to Day 82.

## Scope

### In
- New library on `GameState`: `loadCardLibrary()`, `saveCardLibrary()`, `addSnapshotCard()`, `getCardLibrary()`, `resetCardLibrary()`.
- New storage key `CARD_LIBRARY_KEY = 'signal-circuit-card-library'`, cap `CARD_LIBRARY_CAP = 20`.
- LRU eviction: 21st card evicts the oldest entry (FIFO tail-preservation policy — newest at array tail).
- `resetProgress()` now also calls `resetCardLibrary()` so "Reset Game" wipes the gallery.
- `generateShareCard()` captures the rendered canvas's `dataURL` and calls `gameState.addSnapshotCard(...)`.
- Stats modal gains a 2-button tab strip (`#stats-tab-overview` / `#stats-tab-cards`) and a new pane (`#stats-cards-pane`).
- New UI methods: `_switchStatsTab()`, `_updateStatsTabsUI()`, `_renderCardLibraryGrid()`, `_openCachedShareCard()`.
- Tab badge updates live ("📸 My Cards (N)").
- Click-to-reopen flow paints the cached PNG onto `#share-card-canvas` via `Image.onload`, then surfaces the existing share-card modal with its Save/Copy/Share/Close buttons intact. `_lastShareCardMeta` is populated with the cached title/text/fileName so downstream Save/Copy/Share work without re-solving.
- Modest CSS (≈50 lines, light-mode mirrors) for tab strip + thumbnail grid + hover/focus rings.

### Out (deferred)
- IndexedDB migration (localStorage suffices at 20 × ~140KB compressed PNG ≈ 2.8MB worst case; well under the 5MB default).
- Per-level share-card re-render from seed instead of pixel cache (would be cheaper but Day 96 prefers preservation fidelity).
- "Pin" / "Favorite" / "Delete this card" individual-entry controls (deferred to Cycle 4 PRUNE).
- Export library as a ZIP or single composite PNG.
- Sharing the whole gallery as a series in social posts.

## Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | A freshly captured share card persists into `GameState.getCardLibrary()` as a `{id, levelId, levelTitle, stars, gateCount, savedAt, dataUrl, title, text, fileName}` record. | P3 |
| 2 | Stats modal opens with `📊 Overview` selected by default. | P2 |
| 3 | Clicking `📸 My Cards` swaps the visible pane to `#stats-cards-pane` and renders the empty-state copy when no cards exist. | P2 |
| 4 | After solving L1 twice and capturing both, library length is 2 and the grid renders 2 `.card-thumb` buttons. | P3 |
| 5 | Tab badge updates live to `📸 My Cards (N)` matching `library.length`. | P3, P4, P6 |
| 6 | Flooding to >20 entries caps the library at 20; the oldest entries are evicted; the newest entry is preserved at the tail. | P4 |
| 7 | Clicking a thumbnail re-paints the cached image onto `#share-card-canvas` at the source PNG's native resolution and shows the share-card modal. `_lastShareCardMeta.libraryId` matches the clicked card. | P5 |
| 8 | `resetProgress()` wipes the card library (`getCardLibrary().length === 0` after). | P6 |
| 9 | Cold-start non-level button count stays at 2 (Day 78 invariant). | P2, P7 |
| 10 | Day 84/94 L42 hardCap rejection + Day 95 onboarding default `silent-standard` + L1 core loop all unaffected. | P7 |
| 11 | Zero `Runtime.exceptionThrown` + zero `console.error` across full harness. | P8 |

## Implementation Notes

### `_openCachedShareCard()` design

The cached card is a PNG `data:` URL. `_openCachedShareCard()` constructs an `Image`, sets `img.onload` to paint onto the canvas at the source dimensions (`canvas.width = img.width || 1200; ...drawImage(img, 0, 0)`), then sets `_lastShareCardMeta` so the existing Save / Copy / Share buttons in the modal can act on the re-painted canvas without modification. This means:

- The download button's filename comes from `_lastShareCardMeta.fileName` (preserved from the original capture).
- The native-share button shares the cached title/text/file (preserved).
- The copy button calls `canvas.toBlob()` on the freshly re-painted canvas (no data-URL round-trip needed).

The `_suppressShareCardCapture` flag exists for future use (e.g. if `_openCachedShareCard` ever wanted to recreate via the full `generateShareCard()` pipeline), but Day 96 deliberately bypasses that pipeline — the cached pixel image is the source of truth, not a re-render.

### Eviction policy

`addSnapshotCard()` pushes the new entry onto the tail of the array (`lib.push(entry)`), then trims via `lib.slice(lib.length - CARD_LIBRARY_CAP)`. That gives "preserve the newest 20" semantics — exactly what the user expects: a rolling window of their most recent shares. The tab badge update (`📸 My Cards (N)`) reflects the cap accurately.

### Reset Game integration

Hooking `resetCardLibrary()` into `GameState.resetProgress()` (rather than into the UI-level "Reset Game" handler) is intentional — every path that wipes progress (Settings → Reset, programmatic, future debug routes) gets the library wipe for free.

### Storage budget

20 cards × ~140KB (1200×630 PNG, base64-encoded, lightly compressed) ≈ 2.8MB upper bound. Day 60's localStorage stress test verified 5MB capacity holds for `50 × 50KB` writes; this fits comfortably. If a user ever hits quota, `SafeStorage.setItem`'s warn-once fallback keeps the rest of the game functional.

## Verification Approach

Day 86+ permissive-Chromium + raw-CDP-over-WS pattern. Harness at `qa-reports/day-96-qa.cdp.js`. Phases:

- **P1 (3)** Build identity — 11 ?v=1780617600 refs, sw v65, stats tab scaffold in `index.html`.
- **P2 (4)** Empty-state — fresh profile, switch to My Cards tab, empty-state copy renders, badge `(0)`, 2 non-level buttons.
- **P3 (5)** Capture flow — solve L1 twice, library = 2, dataUrl present, record shape correct, grid + badge `(2)`.
- **P4 (4)** Cap — flood 23 synthetic cards, total 25 → capped at 20, oldest evicted, newest tail preserved, badge `(20)`.
- **P5 (3)** Click-to-reopen — fresh real card captured to be the newest thumbnail; click it; modal opens; canvas is 1200×630; meta carries fileName.
- **P6 (3)** Reset — `resetProgress()`, length back to 0, empty-state returns, badge `(0)`.
- **P7 (4)** Regression — Day 78 cold-start invariant, Day 95 onboarding default, Day 84/94 L42 hardCap message byte-equivalent, L1 entry.
- **P8 (2)** Console hygiene — 0 exceptions + 0 console.error.

**Result:** 28 / 28 ✅
