# Day 96 Build Report — Snapshot Cards Library Tab

**Cycle 4 BUILD Week Day 5 · cycleDay 44 · Day 96 · 2026-06-03**

## What shipped

A persistent, capped (20-entry) library of share-card snapshots, surfaced as a `📸 My Cards` tab inside the Stats modal. Day 82 generated cards and forgot them; Day 96 keeps them. Closes the loop on Cycle 3 BUILD's third forward-looking seed.

## Files touched

| File | Change |
|------|--------|
| `js/main.js` | + `CARD_LIBRARY_KEY`, `CARD_LIBRARY_CAP=20`; + 5 GameState methods (`loadCardLibrary`, `saveCardLibrary`, `addSnapshotCard`, `getCardLibrary`, `resetCardLibrary`); `resetProgress()` now wipes the library |
| `js/ui.js` | `generateShareCard()` captures `canvas.toDataURL()` into the library; `setupStatsDashboard()` wires the new tab strip + defaults to Overview on every open; + 4 new methods (`_switchStatsTab`, `_updateStatsTabsUI`, `_renderCardLibraryGrid`, `_openCachedShareCard`) |
| `index.html` | + `<div id="stats-tabs">` with 2 buttons + `<div id="stats-cards-pane">` inside `#stats-content`; cache-bust ?v=1780531200 → ?v=1780617600 (11 refs) |
| `sw.js` | CACHE_NAME signal-circuit-v64 → signal-circuit-v65 |
| `css/style.css` | + 52 lines: `#stats-tabs`, `.stats-tab`, `.card-thumb` hover/focus, light-mode mirrors |
| `qa-reports/day-96-qa.cdp.js` | + 28-assertion CDP harness across 8 phases |
| `specs/day-96-snapshot-cards-library.md` | + spec |
| `build-reports/day-96-build.md` | + this report |
| `qa-reports/day-96-qa.md` | + QA report |
| `BUGS.md` | Day 96 summary appended (0 open at start, 0 open at end) |
| `LESSONS_LEARNED.md` | 6 new Day 96 lessons |
| `FACTORY_STATE.json` | cycleDay 43 → 44, nextDay 96 → 97, lastRun stamp |

## How it works

### Storage

`SafeStorage.setItem('signal-circuit-card-library', JSON.stringify(library))` where `library` is an array of card records. Each record carries:

```js
{
  id: 'card-{ts}-{rand}',
  levelId: 1,
  levelTitle: 'AND Gate Basics',
  stars: 3,
  gateCount: 1,
  savedAt: 1717434780123,
  dataUrl: 'data:image/png;base64,iVBOR…',
  title: 'Signal Circuit — Level 1',
  text: 'I solved Signal Circuit Level 1: AND Gate Basics with 1 gate and 3/3 stars.',
  fileName: 'signal-circuit-l1-snapshot.png',
}
```

### Capture point

Inside `generateShareCard()`, right after `_lastShareCardMeta` is populated:

```js
if (!this._suppressShareCardCapture) {
  const dataUrl = canvas.toDataURL('image/png');
  const stored = this.gameState.addSnapshotCard({ levelId, levelTitle, stars, gateCount, dataUrl, title, text, fileName });
  if (stored) this._lastShareCardMeta.libraryId = stored.id;
}
```

The `_suppressShareCardCapture` flag is for future use; Day 96's re-open path bypasses `generateShareCard()` entirely (paints directly onto the canvas via `_openCachedShareCard()`).

### Eviction

`addSnapshotCard()` pushes the new entry onto the tail, then slices to keep the last 20: `lib.slice(lib.length - CARD_LIBRARY_CAP)`. "Newest at tail" semantics; oldest evicted first. The grid renders newest-first by sorting descending on `savedAt`.

### Tab UI

Two buttons (`#stats-tab-overview`, `#stats-tab-cards`) above the existing `#stats-grid`. The cards tab shows `📸 My Cards (N)` with a live count badge updated by `_updateStatsTabsUI()`. Tab switching toggles `display` on `#stats-grid` (overview pane) vs `#stats-cards-pane` (cards pane). Every modal open resets to Overview.

### Click-to-reopen

`_openCachedShareCard(card)` constructs an `Image`, sets `img.onload` to paint onto `#share-card-canvas` at the cached image's native dimensions (1200×630 for real captures), populates `_lastShareCardMeta` from the cached metadata, then shows the share-card modal. The existing Save / Copy / Share buttons act on the freshly re-painted canvas — no special-cased re-share path needed.

### Reset Game

`GameState.resetProgress()` now calls `this.resetCardLibrary()` (try/catch wrapped for safety). Any path that wipes progress wipes the library too.

## Cold-start invariant

Non-level button count remains 2 (How to Play + Settings). No new top-level button; the tab is nested inside the existing Stats modal. Day 78 invariant intact.

## Cache identity

- `index.html`: 11 × `?v=1780617600` (was 1780531200).
- `sw.js`: `CACHE_NAME = 'signal-circuit-v65'` (was v64).
- Both bumped together (Day 80+ Cycle 2 lesson).

## QA result

28 / 28 assertions ✅ · 0 Runtime.exceptionThrown · 0 console.error. See `qa-reports/day-96-qa.md`.

## Cycle 4 BUILD Week status

Day 92 (gates.js ESM) → Day 93 (tournament worker) → Day 94 (composite lab constraints) → Day 95 (onboarding readout) → **Day 96 (snapshot cards library)** ✅. Build week complete. Cycle 4 HARDEN Week begins Day 97.
