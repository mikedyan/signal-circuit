# Day 111 — Stats Dashboard Tournament History Tab

**Cycle:** 5 BUILD Week, Day 5
**Roadmap line:** `roadmaps/cycle-5-build.md` § "Day 111 (Thu) — Stats Dashboard Enhancement: Tournament History Tab"
**Build identity:** `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'`

## Goal

Surface the player's tournament submissions across weeks inside the existing
Stats modal. New `🏆 Tournament` tab joins Day 96's Overview / My Cards tab
strip and gates on having at least one submission (cold-start = empty state +
dim).

## Acceptance (from roadmap)

| Requirement | Status |
|-------------|--------|
| New `#stats-tournament-tab` showing per-week weekKey / score / rank / percentile / podium / crowned | ✅ |
| Tab badge `🏆 Tournament (N)` shows submission count | ✅ |
| Empty state for players with no submissions | ✅ |
| `View Replay` button attempts to load saved circuit (no-op if not stored) | ✅ (launches archive puzzle; saved-circuit restore deferred) |
| CDP harness: cold tab shows empty state → submit one score → tab shows 1 row → submit another → 2 rows | ✅ (P4 / P5 / P6) |

## Data model

`WeeklyTournament.data.byWeek[weekKey]` already stores per-week submissions
with fields `{ gates, time, score, name, attempted, ts, rank, percentile,
podium, crowned }` (Day 72). The Day 111 helper `getSubmissionHistory()`
filters that map and recomputes `rank` + `percentile` defensively per render
so older persisted fields cannot leak into the UI:

```js
getSubmissionHistory() {
  const out = [];
  const byWeek = this.data.byWeek || {};
  const curKey = this.getCurrentWeekInfo().key;
  for (const key of Object.keys(byWeek)) {
    const entry = byWeek[key];
    if (!entry || typeof entry.score !== 'number') continue;
    const rank = this.getRank(key, entry.score);
    const percentile = this.getPercentile(key, entry.score);
    out.push({
      weekKey: key, gates: entry.gates, time: entry.time, score: entry.score,
      name: entry.name || 'You', rank, percentile,
      podium: rank <= 3, crowned: rank === 1,
      ts: entry.ts || 0, isCurrent: key === curKey,
    });
  }
  out.sort((a, b) => (b.ts - a.ts) || b.weekKey.localeCompare(a.weekKey));
  return out;
}
```

## UI surface

### Tab strip

`#stats-tabs` now contains three `.stats-tab` buttons. The third is added in
`index.html`:

```html
<button id="stats-tab-tournament" class="stats-tab" role="tab" aria-selected="false">🏆 Tournament (0)</button>
```

The companion pane sits next to `#stats-cards-pane`:

```html
<div id="stats-tournament-pane" style="display:none;"></div>
```

### Tab badge + dim

`UI._updateStatsTabsUI()` updates the tab text from
`_getTournamentSubmissions().length` and toggles the `.empty` class (Day 104
PRUNE Cut #4 vocabulary) so a Tournament-naive player reads the tab as inert
rather than as missed content.

### Switcher

`UI._switchStatsTab(which)` validates `which ∈ {'overview', 'cards', 'tournament'}`
and falls back to `'overview'` on unknown input — covers stale
`_activeStatsTab` values from older sessions and future refactors that pass
unexpected tab keys.

### Row renderer

`UI._renderTournamentHistoryGrid()` builds rows from
`getSubmissionHistory()`. Empty state mirrors My Cards (large emoji + lead
+ instruction copy). Each row carries:

- `.th-week` — `YYYY-Wxx` in purple (matches `.tarc-week`); inline `Live` chip
  when `isCurrent`
- `.th-stats` — one chip + one `.th-stat` text node
  - Chip: `👑 #1` (crowned, gold gradient), `🏅 #N` (podium ≤ 3, gold tint),
    or `#N` (neutral)
  - Stat: `N gates · m:ss · top X%` (singular handled, mm:ss formatted)
- `.th-replay` — `View Replay` button with `data-week-key` + `data-current`
  attributes

Replay click:
1. Hides `#stats-modal`
2. Calls `WeeklyTournament.startArchiveWeek(key)` (past weeks) or
   `startCurrentWeek()` (live week)

Saved-circuit restore is **not** implemented today. The roadmap calls out this
as acceptable: "attempts to load the saved circuit if available (no-op if not
stored)". Today's behavior is a uniform no-op — the player rebuilds from
scratch. Future Cycle 6/7 work can hook circuit snapshots through the existing
share-card library (Day 96).

## CSS

The `.tournament-history-*` block mirrors the existing tournament screen
language so a player switching surfaces reads them as one continuous story:

- `.tournament-history-row` — flex row, same padding/border-bottom as
  `.tournament-archive-row`
- `.th-week` — 92px purple-tinted column, matches `.tarc-week`
- `.th-chip-*` — rank chip variants (rank / podium / crowned / live)
- Light-mode mirrors for every chip variant

`#stats-tournament-pane` reuses the Day 96 `tFadeIn` keyframe for tab-switch
fade-in (same animation My Cards uses) — single shared keyframe stays cheap.

## Verification

`qa-reports/day-111-qa.cdp.js` — 35 assertions across 9 phases. **35/35 PASS
on first run.** 0 console.error, 0 Runtime.exceptionThrown.

See `qa-reports/day-111-qa.md` for full phase narrative.

## Build identity

- `index.html` cache-bust: `?v=1781308800` → `?v=1781395200` (11 refs)
- `sw.js` CACHE_NAME: `signal-circuit-v72` → `signal-circuit-v73`

## Risk callout

The new helper `getSubmissionHistory()` calls `getRank()` + `getPercentile()`
per row, which each rebuild the 50-entry seeded pseudo-board. For typical
players with O(10) submissions this is well under 1ms. If a player ever
accumulates years of submissions (52+ weeks), the linear-per-week cost may
become noticeable. The helper documents this — Cycle 6 PRUNE could memoize
the seeded board per weekKey if it surfaces, but today it's noise below the
floor.
