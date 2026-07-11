# Day 134 QA — Cycle 6 PRUNE Week, Day 2: Design Simplification

**Date:** 2026-07-11 (Saturday) · cycleDay 85 · Day 134
**Cycle:** 6 · PRUNE Week · Day 2
**Build under test:** LOCAL `http://localhost:8901/` — `?v=1783728000` / sw `signal-circuit-v82` (bumped from Day 127 `?v=1783036800` / v81).
**Harness:** `qa-reports/day-134-qa.cdp.js` — **31/31 assertions across 6 phases**, **0 console.error**, **0 Runtime.exceptionThrown**.

---

## What shipped

Two Tier-1 cuts from the Day 133 `PRUNE_REPORT.md`, atomic-per-cut, cache-bust + SW bumped together.

### Cut #1 — Collapse the Settings "Tournament (Online)" section behind a disclosure

The Day 125 `Tournament (Online)` section rendered **4 always-visible buttons** (`🔌 Connect` / `🏠 Go Local` / `💾 Save Name` / `🖩 Anonymous`) **+ 2 text inputs** (worker URL, display name) inline in Settings between Notifications and Data. That whole surface is inert for anyone who hasn't stood up their own Cloudflare Worker — i.e. ~100% of players. Settings rendered 17 buttons for a normal player.

**Change:** the section body is now wrapped in a native `<details class="settings-advanced">` disclosure with a `<summary>` reading **"⚙️ Advanced: Online Tournament"**, collapsed by default. The old `<h4>Tournament (Online)</h4>` is replaced by the summary. A normal player sees one ignorable line; power-users expand it. Settings drops from **17 → 13** visible buttons for the default view. Zero feature loss — the Day 125 privacy behavior (anonymous by default, opt-in name) rides along inside the disclosure.

**Implementation note (real fix, not just markup):** `#tournament-settings-row` carries an explicit `#id { display:flex }` rule whose specificity `(1,0,0)` overrides the UA `<details>` collapse mechanism, so the native collapse alone left the content visible. Added an explicit author rule `.settings-advanced:not([open]) #tournament-settings-row { display:none }` (specificity `(1,2,0)`) that wins when collapsed and drops out when `[open]`, restoring the base flex layout. Verified both states in-browser (P3.a collapsed = all 6 controls hidden; P3.b expanded = all 6 visible).

### Cut #2 — Trim the Progress-heatmap summary instructional tail

The Day 127 heatmap summary rendered `10 / 50 levels · ★ 30 / 150 · tap-hold a cell for details` on **every** render — a permanent how-to instruction welded to a stat line. The per-cell affordance already lives in each `.phm-cell` `title` attribute (`"Chapter 1: Basics — 6/6 levels, 18/18★"`), so the tail was redundant. Trimmed the summary to `10 / 50 levels · ★ 30 / 150`. The stat line now reads as data, not a manual.

---

## Results (31/31)

- **P1 — build identity (4/4):** local host; 11 unified `?v=1783728000` refs; sw `signal-circuit-v82` (v81 gone).
- **P2 — Cut #1 structure (6/6):** section intact; wrapped in `<details>`; collapsed by default (no `open`); summary label correct; old `<h4>` removed; settings row nested inside the disclosure.
- **P3 — Cut #1 behavior + Day 125 regression (5/5):** collapsed → all 4 buttons + 2 inputs hidden; expanded → all 6 visible; display name blank by default (anonymous); persists when set; clears back to anonymous.
- **P4 — Cut #2 (5/5):** live heatmap-meta template no longer carries the tail; heatmap renders 11 cells; summary shows stats only (`10 / 50 levels · ★ 30 / 150`); per-cell `title` retains the detail affordance.
- **P5 — regression floor (9/9):** cold nav 2 (Day 78); 50 cards; Gate ESM + 8 GateTypes; Wire ESM (Day 107); Simulation canonical binding (Day 123); LEVELS 50; 5 retired/dead ids absent; Profile hub present (Day 124); Stats Progress tab hidden cold (Day 127).
- **P6 — console hygiene (2/2):** 0 console.error; 0 Runtime.exceptionThrown.

## Harness self-bugs (first run → fixed harness-side, 0 app changes)

1. **P3.a (real fix required, not a self-bug):** collapsed buttons initially still visible — traced to the `#tournament-settings-row` ID-specificity `display:flex` overriding native `<details>` collapse. Fixed in **app CSS** (the explicit `:not([open])` rule above), not the harness. After the fix, a second failure appeared purely from a **stale service-worker precache**: the earlier same-version run had cached the pre-fix `style.css` under CACHE_NAME v82. Added `caches.delete` + SW `unregister()` to the harness cold-load so it reads fresh source. Real users are unaffected — a fresh v82 SW install precaches the corrected CSS from the server.
2. **P4.a:** first-run source grep for `tap-hold a cell for details` matched my own explanatory **code comment**, not the live template. Narrowed the probe to the exact template fragment `totalMaxStars} · tap-hold`.
3. **P5.f:** `window.LEVELS` returned length 0 — `LEVELS` is a top-level `const` (lexical global, not a `window` property). Switched to `getLevelCount()` (a real global function). App was always correct (P5.b card count = 50 confirmed it).

## LOC delta

`index.html` +8/−1 (details/summary wrapper + comment, minus `<h4>`), `css/style.css` +36 (disclosure styling + the explicit-collapse fix), `js/ui.js` +5/−1 (comment + tail trim), `sw.js` v81→v82. Net **≈ +48/−14**. Cut #1 is a wrap (additive disclosure CSS, as the PRUNE_REPORT anticipated); Cut #2 is a removal. The net-negative PRUNE mandate is carried by **Day 135 Code Cleanup** (Tier-2 Cut #3 — dead-id sweep of the 5 retired Day 124 collection buttons + orphaned `setup*` wiring).

## State

- **Open Bugs:** 0 → 0 (**59-day empty-queue streak** since Day 76).
- **Latent observations:** 0 → 0.
- **Day 135 next:** Cycle 6 PRUNE Week Day 3 — Code Cleanup (Tier-2 Cut #3 dead-id sweep; net-negative LOC).
