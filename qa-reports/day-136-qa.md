# Day 136 QA — Cycle 6 PRUNE Week, Day 4: Polish Sprint

**Date:** 2026-07-13 (Monday) · cycleDay 87 · Day 136
**Cycle:** 6 · PRUNE Week · Day 4 (Polish Sprint — Day 80/105/121 precedent)
**Build under test:** LOCAL `http://localhost:8901/` — bumped to `?v=1783900800` / `sw v84` (from Day 135 `?v=1783814400` / `sw v83`).
**Harness:** `qa-reports/day-136-qa.cdp.js` — **34/34 assertions, 0 console.error, 0 Runtime.exceptionThrown.**

First run 36/36 on an earlier body-appended `#phm-popover` implementation; that was
refactored to a leaner pure-CSS child popover to stay inside the polish-day LOC
budget (see below), then the harness was re-shaped to match (2 harness self-bugs
on the way — `\s` swallowed by a template literal, and opacity sampled mid-
transition — both fixed harness-side, 0 app changes). Final: **34/34.**

---

## What shipped

Two Tier-3 polish cuts from the Day 133 PRUNE_REPORT + a cold-start defaults
re-audit.

### Cut #6 — Tournament mode-label cross-fade

The Day 93 four-state connection label (`🏠 Local leaderboard` / `🌐 Live` /
`🌐 Live · offline` / `🌐 Connecting…`) used to **snap** when `describe()` flipped
state after the async reachability probe resolved (`cloud-ready → remote-fallback`).

New `UI._crossfadeLabel(el, text)`:
- No-op when the text is unchanged (avoids a gratuitous flash).
- Under `prefers-reduced-motion`, sets the text directly (no animation).
- Otherwise adds `.label-crossfade-out` (opacity → 0 over 130ms via CSS), swaps
  the text after 130ms, removes the class (fade back in) — a ~260ms cross-fade.

Wired into the **async repaints only**: `showTournamentScreen()`'s
`refreshReachability().then()` + `onBoardUpdate()` repaints, and
`updateTournamentConnectionStatus()`'s settings-modal repaint. The **first paint**
(screen/settings open) stays a direct `setText(...)` — no fade on open.

### Cut #7 — Progress-heatmap cell detail popover

The Day 127 `.phm-cell` tiles carried only a bare native `title` tooltip. Each
cell now also carries a pure-CSS `.phm-pop` child (chapter name + `N / M levels`
+ `★ earned / max`) shown on `:hover` / `:focus-within` / `:focus`. Cells gained
`tabindex="0"` + `role="button"` so the popover is discoverable via **tap
(mobile)** and **keyboard Tab**, not just mouse hover. The native `title` is
retained for a11y. No JS wiring, no orphaned body element — self-cleaning with
the cell.

### Cold-start defaults re-audit (Day 80/105 precedent)

SFX `0.4` / Music `0.2` / difficulty silent-default `standard` / no forced
onboarding modal / 2 cold nav buttons / 50 cards — **all unchanged.**

---

## Assertion log (34/34)

- **P1 build identity (4):** localhost · 11 unified `?v=1783900800` refs · `sw.js`
  CACHE_NAME `signal-circuit-v84` (no v83 residue).
- **P2 Cut #6 cross-fade (9):** `_crossfadeLabel` is a function; CSS opacity
  transition + `.label-crossfade-out { opacity:0 }` + reduced-motion guard all
  present; **behavioral** — unchanged text is a no-op (no fade class), changed
  text arms `.label-crossfade-out` immediately then settles to the new value with
  the class cleared; wired into ≥3 async repaint call sites; first-paint label
  stays direct.
- **P3 Cut #7 popover (7):** Progress pane visible + 11 cells; cells
  `tabindex=0` + `role=button`; `.phm-pop` child carries title + `N/M levels` +
  `★`; hidden by default (opacity 0); **opacity 1 on cell focus**; **opacity 0
  again on blur**; native `title` retained.
- **P4 cold-start defaults (4):** SFX 0.4, Music 0.2, difficulty `standard`, no
  forced onboarding modal.
- **P5 regression floor (8):** cold nav 2 (Day 78), 50 cards, Gate ESM + 8
  GateTypes (Day 92), Wire ESM (Day 107), Simulation ESM canonical binding
  (Day 123), LEVELS 50, 6 retired/dead ids absent, Profile hub modal + button
  present (Day 124).
- **P6 console hygiene (2):** 0 console.error, 0 Runtime.exceptionThrown.

Visual confirmation: `/tmp/heatmap-popover.png` — focused Chapter 1 cell shows
the styled detail popover above it, palette-native heatmap intact, not clipped.

---

## LOC delta (polish-day budget)

Functional source (excl. the 11 cache-bust bumps + sw v83→v84):
- `js/ui.js` **+26 / −3**
- `css/style.css` **+28 / −0**
- **Net ≈ +51** — at the Day 80/105 ±50 polish-day budget.

**Week ledger:** Day 134 (~+34 disclosure wrap) + Day 135 (−87 dead-id removal)
+ Day 136 (+51) = **−2 net** → the PRUNE net-negative mandate holds at the week
level. (The first body-popover implementation was +123; the pure-CSS refactor
brought it back inside budget without losing the feature — leaner AND simpler.)

Build bump: `?v=1783814400 → ?v=1783900800` (11 refs); `sw v83 → v84`.

Open Bugs 0 → 0 (**61-day empty-queue streak** since Day 76). Latent observations
0 → 0.

**Day 137 next:** Cycle 6 PRUNE Week Day 5 — Expert Panel + Validation (play 5
levels across chapters, re-score 10 dimensions, target ≥9.2, write
`reviews/prune-cycle-6-review.md`, close Cycle 6 PRUNE Week + the 90-day cycle
window).
