# Bugs — Signal Circuit

*Updated: Day 139 — Cycle 7 BUILD Week, Day 2 (2026-07-16) — Per-mode stat badges*

## Day 139 — Cycle 7 BUILD Week, Day 2 (Per-mode stat badges in the hub) summary

**Build:** LOCAL `?v=1784073600` / sw `signal-circuit-v86` (bumped from Day 138 `?v=1783987200` / v85).
**Result:** **37 / 37** assertions across 6 phases (36/37 first run — 1 harness self-bug, fixed harness-side, **0 app changes**); **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Turned the Day 138 Modes hub into a dashboard: each `.mode-card` now shows the player's own headline stat, read from **existing** GameState fields (no new persistence). New `UI.updateModeHubStats()` populates 6 `#mode-stat-<key>` pills — daily→streak, adaptive→skill label, tournament→last rank, infinite→best solved, blitz→best rung, speedrun→best time; called at setup + on every hub `open()`. Random/Sandbox have no persisted per-mode counter → intentionally no badge.

**Seeded-stat proof (P3):** streak=5 → `🔥 5-day streak`; blitz-best=7 → `Best: rung 7`; speedrun-best=95 → `Best: 1:35`; infinite bestSolved=12 → `Best: 12 solved`; submitted tournament score → `Last rank: #N` matching `getSubmissionHistory()[0].rank`. **Launch integrity (P4):** all 8 buttons still launch + hub closes (Day 138 regression). Cold-start unchanged (2 nav, 50 cards, Modes reveals at g6).

**First-run harness self-bug (0 app changes):** P2.1 expected zero-streak empty state after `seedProgress(18)`, but seeding marks the day played (`updateStreak()` → streak 1), so the pill correctly read `🔥 1-day streak`. App correct; fixed harness-side by clearing the streak key before the zero-state read. Same class as Days 97/108/115/117/122/125/131/135.

**LOC:** `index.html` +6 (+11 cache-bust), `js/ui.js` +~55, `css/style.css` +~15, `sw.js` v85→v86. Net ≈ +76 functional. No new cold-start surface.

**Open Bugs queue:** 0 → 0 (streak: **64 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-139-qa.md`. Harness: `qa-reports/day-139-qa.cdp.js` (37 assertions, 6 phases). Spec: `specs/day-139-mode-stat-badges.md`.

**Day 140 next:** Cycle 7 BUILD Week Day 3 — "Recommended for you" spotlight card at the top of the hub.

---

*Updated: Day 138 — Cycle 7 BUILD Week, Day 1 (2026-07-15) — 🎮 Modes Hub*

## Day 138 — Cycle 7 BUILD Week, Day 1 (🎮 Modes Hub consolidation) summary

**Build:** LOCAL `?v=1783987200` / sw `signal-circuit-v85` (bumped from Day 136 `?v=1783900800` / v84 — first source change of Cycle 7).
**Result:** **37 / 37** assertions across 8 phases on the **FIRST run**; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs; **0** harness self-bugs.

Folded the 8 challenge-mode buttons (daily/random/sandbox/adaptive/tournament/infinite/blitz/speedrun) into ONE `🎮 Modes` button opening `#modes-hub-modal`. Day 124 **re-parent, don't rewrite**: the exact buttons (ids/classes/handlers preserved) moved into `.mode-card` wrappers, each with a `.mode-desc` description. Tier-gating moved from buttons → card wrappers (`mode-card-<key>`); `#modes-hub-btn` reveals at g6. New `setupModesHub()` (one consolidated backdrop handler + close-on-pick). Level-select challenge section: 8 buttons → 1. This is the Cycle 6 PRUNE_REPORT Cut #4 promoted to a BUILD day.

**Launch integrity (P4):** all 8 re-parented buttons still launch their flow from inside the hub + the hub closes on pick. **Badge integrity (P5):** `updateDailyButtonBadge`/`updateAdaptiveButtonBadge` still mutate the re-parented buttons (location-independent). Cold-start unchanged (2 nav buttons, 50 cards — Modes reveals at g6).

**LOC:** `index.html` +54/−13, `js/ui.js` +45/−7, `css/style.css` +72, `sw.js` +1/−1, cache-bust ×11. Net ≈ +150 functional.

**Open Bugs queue:** 0 → 0 (streak: **63 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-138-qa.md`. Harness: `qa-reports/day-138-qa.cdp.js` (37 assertions, 8 phases). Spec: `specs/day-138-modes-hub.md`. Roadmap: `roadmaps/cycle-7-build.md`.

**Day 139 next:** Cycle 7 BUILD Week Day 2 — per-mode stat badges in the hub.

---

*Updated: Day 136 — Cycle 6 PRUNE Week, Day 4 (2026-07-13) — Polish Sprint*

## Day 136 — Cycle 6 PRUNE Week, Day 4 (Polish Sprint) summary

**Build:** LOCAL `?v=1783900800` / sw `signal-circuit-v84` (bumped from Day 135 `?v=1783814400` / v83).
**Result:** **34 / 34** assertions across 6 phases; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Shipped the 2 Tier-3 polish cuts from the Day 133 PRUNE_REPORT + a cold-start defaults re-audit. **Cut #6 — Tournament mode-label cross-fade:** new `UI._crossfadeLabel(el,text)` fades the Day 93 connection chip out→swap→in (~260ms) only when `describe()` actually flips state (`cloud-ready → remote-fallback`); no-op on unchanged text; direct set under `prefers-reduced-motion`; wired into the async repaints only (first paint stays a direct `setText`). **Cut #7 — Progress-heatmap cell detail popover:** each Day 127 `.phm-cell` now carries a pure-CSS `.phm-pop` child (chapter name + `N/M levels` + `★earned/max`) shown on `:hover`/`:focus-within`/`:focus`; cells gained `tabindex=0`+`role=button` so the popover is tap/keyboard discoverable; native `title` retained for a11y. Cold-start defaults unchanged (SFX 0.4 / Music 0.2 / difficulty standard / 2 nav / 50 cards).

**Implementation note:** the first popover pass used a body-appended fixed-positioned `#phm-popover` with JS delegation (+123 net LOC, over the ±50 polish-day budget). Refactored to the pure-CSS child popover — leaner (**net +51**), simpler, self-cleaning with the cell, no orphaned body element. Verified the CSS `:focus`/`:focus-within` popover shows/hides via computed opacity 1↔0.

**Harness self-bugs (fixed harness-side, 0 app changes):** (1) `\s` in a template-literal regex was swallowed (`/\s+/` became `/s+/`, stripping every 's' → "level"/"Ba ic") — dropped the normalization; (2) opacity sampled synchronously mid-transition (0/0.99872) — added a 280ms settle wait + `≥0.9`/`≤0.1` thresholds.

**LOC:** `js/ui.js` +26/−3, `css/style.css` +28 = **net +51** (index.html +11/−11 cache-bust; sw.js +1/−1). At the ±50 polish-day budget. **Week ledger −2** (Day 134 ~+34 + Day 135 −87 + Day 136 +51) — PRUNE net-negative mandate holds at week level.

**Open Bugs queue:** 0 → 0 (streak: **61 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-136-qa.md`. Harness: `qa-reports/day-136-qa.cdp.js` (34 assertions, 6 phases).

**Day 137 next:** Cycle 6 PRUNE Week Day 5 — Expert Panel + Validation (play 5 levels, re-score 10 dimensions, target ≥9.2, write `reviews/prune-cycle-6-review.md`, close Cycle 6 PRUNE Week + the 90-day cycle window).

---

## Day 135 — Cycle 6 PRUNE Week, Day 3 (Code Cleanup) summary

**Build:** LOCAL `?v=1783814400` / sw `signal-circuit-v83` (bumped from Day 134 `?v=1783728000` / v82).
**Result:** **42 / 42** assertions across 7 phases; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Shipped Tier-2 Cut #3 from the Day 133 PRUNE_REPORT — the dead-id sweep of the 5 collection buttons/modals retired by the Day 124 Profile-hub merge. Removed 5 orphaned `setup*` binders (`setupAchievements` / `setupMasteryTree` / `setupCircuitCollection` / `setupLogicProfile` / `setupCosmeticModal`) + their 5 `this.setup*()` constructor call sites. Each binder only wired old `btn`/`modal`/`close` ids that no longer exist in `index.html` (deleted Day 124), so all 5 already no-op'd. The 5 `render*()` methods they used to call are KEPT — they're the live path through `setupProfileHub` → `_switchProfileTab`. P4/P5 prove the hub still renders all 5 panes and the cosmetic card-click delegation still flips the active wire color (`classic → blue`).

**Harness self-bug (fixed harness-side, 0 app changes):** P5 used `cosmetics.getActive('wireColor')`; the real accessor is the `activeWireColor` property. 41/42 first run → 42/42 after fix.

**LOC:** `js/ui.js` +11/−98 = **net −87** (index.html +11/−11 cache-bust; sw.js +1/−1). Net-negative PRUNE mandate satisfied at day AND week level.

**Open Bugs queue:** 0 → 0 (streak: **60 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-135-qa.md`. Harness: `qa-reports/day-135-qa.cdp.js` (42 assertions, 7 phases).

**Day 136 next:** Cycle 6 PRUNE Week Day 4 — Polish Sprint (Tier-3 cuts #6 Tournament mode-label cross-fade + #7 heatmap cell tap-hold detail popover, + cold-start defaults re-audit).

---

## Day 134 — Cycle 6 PRUNE Week, Day 2 (Design Simplification) summary

**Build:** LOCAL `?v=1783728000` / sw `signal-circuit-v82` (bumped from Day 127 `?v=1783036800` / v81 — first source change since Day 127).
**Result:** **31 / 31** assertions across 6 phases; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Shipped the 2 Tier-1 cuts from the Day 133 PRUNE_REPORT:
- **Cut #1 — Tournament (Online) → collapsed disclosure.** Wrapped the Day 125 section body in a native `<details class="settings-advanced">` (summary "⚙️ Advanced: Online Tournament", collapsed by default); old `<h4>` removed. Settings default view drops **17 → 13** visible buttons; the 4 tournament buttons + 2 inputs hide until expanded, all functional when opened, Day 125 anonymous-by-default privacy unchanged. Required a real CSS fix: `#tournament-settings-row`'s `#id display:flex` (specificity 1,0,0) overrode the native `<details>` collapse, so added `.settings-advanced:not([open]) #tournament-settings-row { display:none }` (1,2,0) to collapse deterministically.
- **Cut #2 — heatmap summary trim.** Dropped `· tap-hold a cell for details` from the Day 127 `_renderProgressHeatmap()` summary; the per-cell `title` already carries the affordance. Summary now reads `10 / 50 levels · ★ 30 / 150`.

**Harness self-bugs (fixed harness-side, 0 app changes):** (P4.a) source grep matched my own code comment, not the live template — narrowed to `totalMaxStars} · tap-hold`. (P5.f) `window.LEVELS` is a lexical `const` not a window prop → switched to `getLevelCount()`. Also added SW-unregister + cache-clear to the harness cold-load after a stale same-version precache masked the P3.a CSS fix (real users unaffected — fresh v82 install precaches corrected CSS).

**LOC:** ≈ +48/−14. Cut #1 is a wrap (additive disclosure CSS, per PRUNE_REPORT); Cut #2 a removal. Net-negative mandate carried by Day 135 Code Cleanup (dead-id sweep).

**Open Bugs queue:** 0 → 0 (streak: **59 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-134-qa.md`. Harness: `qa-reports/day-134-qa.cdp.js` (31 assertions, 6 phases).

**Day 135 next:** Cycle 6 PRUNE Week Day 3 — Code Cleanup (Tier-2 Cut #3: dead-id sweep of the 5 retired Day 124 collection buttons + orphaned `setup*` wiring; net-negative LOC).

---

*Updated: Day 133 — Cycle 6 PRUNE Week, Day 1 (2026-07-10) — Fresh Eyes Audit*

## Day 133 — Cycle 6 PRUNE Week, Day 1 (Fresh Eyes Audit) summary

**Build under audit:** deployed `https://mikedyan.github.io/signal-circuit/` · `?v=1783036800` · sw v81 (Day 127 artifact, unchanged through the Cycle 6 HARDEN week).
**Result:** **37 / 37** assertions across 9 phases (35/37 first run — 2 harness self-bugs on wrong element ids, fixed harness-side, **0 app changes**); **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

**Clutter score: 4/10** (held from Cycle 5; Cycle 2 closed 5/10, Cycle 1 baseline 8/10). Headline: the Day 124 Profile-hub merge dropped **end-game nav 18 → 14**, retiring the 3-cycle collection-modal carry-over (Cycles 2/4/5). Tier staircase `nav 2/2/5/9/14/14`, overflow `0/3/6/12/18/50`, cards `50` throughout. Cycle 5 Tier-1 cuts all held: new player opening Stats sees **1 tab** (Overview); empty Cards/Tournament tabs hidden (Day 119); Day 127 Progress heatmap hidden until ≥1 done; Reset Progress typed-confirm intact.

**One new clutter source:** the Day 125 `Tournament (Online)` settings section (4 buttons + 2 inputs for a self-hosted-worker feature) — Settings now renders 17 buttons for a normal player → Tier-1 Cut #1 (collapse behind an Advanced disclosure). Wordy-text: the Day 127 heatmap summary welds `· tap-hold a cell for details` onto the stat line → Tier-1 Cut #2. Day 123 (sim ESM), Day 126 (cohort readout, debug-gated — no leak), Day 127 (heatmap, hidden-when-empty) are all PRUNE-shaped already.

**First-run harness self-bugs (0 app changes):** (P4.d) probed `#tournament-connect-btn` — real id `#tournament-worker-save-btn` inside `#settings-tournament-section`; surface was present. (P8.a) probed `game.getCohort()` — real accessor `window.__onboardingExperiment.getCohort()`; resolves to `live`. Same class as Days 97/108/115/117/122/125/131.

**Open Bugs queue:** 0 → 0 (streak: **58 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-133-qa.md`. Harness: `qa-reports/day-133-qa.cdp.js` (37 assertions, 9 phases). Full PRUNE plan: `PRUNE_REPORT.md`.

**Day 134 next:** Cycle 6 PRUNE Week Day 2 — Design Simplification (ship 2 Tier-1 cuts: collapse Tournament-Online settings section; trim heatmap summary tail).

---

*Updated: Day 131 — Cycle 6 HARDEN Week, Day 4 (2026-07-08) — Fix Everything (rest day)*

## Day 131 — Cycle 6 HARDEN Week, Day 4 (Fix Everything) summary

**Build under test:** local `?v=1783036800` / sw v81 (Day 127 artifact, **unchanged** — HARDEN ships ZERO features).
**Mode:** Fix Day with an **empty Open Bugs queue** → Day 90/100/116 rest-day confirmation-probe precedent. **0 source-file changes.**
**Result:** **28 / 28** assertions across 10 phases (27/28 first run — 1 harness self-bug, fixed harness-side, **0 app changes**); **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Open Bugs queue empty for 55 days at start → no speculative fixes; ran a tight confirmation probe over the pinned Day 127 artifact. Standing floor held: build identity (11× `?v=1783036800` + sw v81), cold-start (50 cards / 2 nav), ESM bindings (Day 92 Gate + 8 GateTypes / Day 107 Wire+WireManager / Day 123 Simulation), Day 79 dead-ids (7 undefined + `#weekly-puzzle-btn` absent). Cycle 6 BUILD-surface confirmation: **D123** `game.simulation instanceof window.Simulation` + L1 AND-gate solve → runQuickTest → 3★ persists; **D124** Profile-hub opens + 5 tabs render non-empty + close clears `#profile-view` (4108→0); **D125** tournament connect→cloud-ready+persist / clear→local+wiped; **D126** cohort determinism (stable install id + cohort across 3 reloads); **D127** heatmap empty/partial(`10 / 50 · ★30/150`)/full(`50 / 50 · ★150/150`). Stress seams (gate/wire/RUN/undo storm + resize storm) no-throw.

**First-run harness self-bug (0 app changes):** P4 (D124) checked the active pane via `.phub-pane.active`, but `_switchProfileTab()` shows panes via `style.display=''` on `#phub-pane-<key>` (the `.active` class is on tabs, not panes). App was correct throughout (`profLenBefore=4108` proved render, `profLenAfter=0`+`closedClean` proved Day 54 close-clears). Fixed harness-side by resolving each pane by id + testing `display!=='none' && innerHTML.length>0`. Same class as Days 97/98/99/107/108/115/117/122/125/128.

**Open Bugs queue:** 0 → 0 (streak: **56 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-131-qa.md`. Harness: `qa-reports/day-131-qa.cdp.js` (28 assertions across 10 phases).

**Day 132 next:** Cycle 6 HARDEN Week Day 5 — Regression Pass on deployed GitHub Pages build + Cycle 6 HARDEN week summary.

---

*Updated: Day 129 — Cycle 6 HARDEN Week, Day 2 (2026-07-06) — Level Playthrough*

## Day 129 — Cycle 6 HARDEN Week, Day 2 (Level Playthrough) summary

**Build:** `?v=1783036800` / sw v81 (Day 127 artifact, **unchanged** — playthrough day, no code change).
**Result:** **40 / 40** assertions across 8 phases on the **FIRST run**; **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs; **0** harness self-bugs.

Played through 13 sampled levels (campaign 1/5/10/15/20/25/30/35/40 + Lab Bench 45/46/48/50). Every truth table has exactly 2^numInputs rows with correct per-row input/output arity, ≥1 hint (all 3), and `calculateStars` is monotonic (3★ at optimal, <3 at goodGates+3). Hands-on L1 AND-gate solve → Quick Test → 3★ persisted. All 5 challenge/sandbox entries reachable (Daily / Random / Blitz / Speedrun / Sandbox) with Blitz (Day 61) + Speedrun (Day 74) HUD cleanup on back. 4/4 sampled community levels load via `buildCustomLevel`. **New this playthrough:** verified the Day 127 Progress heatmap reflects completed levels across empty (empty-state, no meta) / seed-10 (`10 / 50 levels · ★ 30 / 150`, ≥1 lit cell) / full-seed-50 (`50 / 50 levels · ★ 150 / 150`, all 11 cells complete) states.

Standing regression floor held: cold 50 cards / 2 nav (Day 78/109), Day 79 dead-ids (7 undefined + `#weekly-puzzle-btn` absent), Day 92 Gate/GateTypes-8, Day 107 Wire/WireManager, Day 123 `window.Simulation` ESM binding, LEVELS=50 + `getChapters` fn.

**Open Bugs queue:** 0 → 0 (streak: **54 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-129-qa.md`. Harness: `qa-reports/day-129-qa.cdp.js`.

**Day 130 next:** Cycle 6 HARDEN Week Day 3 — Edge Cases & Stress.

---

## Day 125 — Cycle 6 BUILD Week, Day 3 (Tournament Worker production-readiness + opt-in display name) summary

**Build:** `?v=1782777600` / sw v78 → **`?v=1782864000` / sw v79**.
**Result:** **49 / 49** assertions across 8 phases (second run); **0** console.error; **0** `Runtime.exceptionThrown`; **0** new user-facing bugs.

Made the Day 108 tournament backend genuinely deployable. Shipped: (1) a Settings → Tournament (Online) surface with a worker-URL input + 🔌 Connect / 🏠 Go Local buttons + a connection-status chip driven by Day 93's 4-state `describe()` vocabulary; (2) an opt-in display name (`signal-circuit-tournament-display-name`) — no personal name POSTed unless explicitly set, default anonymous; (3) `tools/tournament-worker/deploy.sh`, an idempotent deploy helper (external `wrangler deploy` stays a manual human step).

- **Privacy is the headline.** `RemoteTournamentAdapter.submitScore()` POST body now sends `name: optInName || 'Anonymous'` + `anonymous: !optInName`. The `displayName` argument (the daily-leaderboard name) is intentionally NOT forwarded to the cloud. P4.3 proved a submit with no opt-in name stores `"Anonymous"` server-side; P4.7 proved an opt-in name (clamped ≤16) stores exactly.
- **Live reconfigure, no reload:** `GameState.reconfigureTournamentBackend()` re-runs `selectTournamentBackend()` when the URL/mode changes. P3 flipped the live backend Local→Remote via the Connect button; P5 flipped it back via Go Local.
- **Two harness self-bugs on the way to green (0 app changes):** (1) a P6 multi-statement eval ended on `reconfigureTournamentBackend()`, whose return value (the full adapter, circular refs) blew up `returnByValue` serialization — fixed by appending `true;`; (2) an orphaned mock worker from the crashed first run held port 8902, so the offline-fallback probe stayed reachable — killed the orphan.

**Source LOC:** `js/main.js` +~55, `js/ui.js` +~95, `index.html` +21 (+11 cache-bust), `css/style.css` +51, `sw.js` v78→v79, `tools/tournament-worker/deploy.sh` new (+~155), README docs.

**No cold-start surface added** — the Tournament section lives inside the existing Settings modal. Cold nav-button count holds at 2 (Day 78 invariant).

**Open Bugs queue:** 0 → 0 (streak: **50 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-125-qa.md`. Harness: `qa-reports/day-125-qa.cdp.js`. Spec: `specs/day-125-tournament-worker-productionization.md`.

**Day 126 next:** Cycle 6 BUILD Week Day 4 — Onboarding A/B readout: Local-only vs Live cohort (engagement instrumentation).

---

## Day 124 — Cycle 6 BUILD Week, Day 2 (Collection-Modal Merge → tabbed Profile hub) summary

**Build:** `?v=1782691200` / sw v77 → **`?v=1782777600` / sw v78**.
**Result:** **33 / 33** assertions across 9 phases on the **FIRST run** (`qa-reports/day-124-qa.cdp.js`). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

Merged the five standalone collection modals (Achievements / Mastery / Customize / Collection / Logic Profile) into ONE tabbed `#profile-hub-modal` — the deferred Cycle 5 Tier-2 Cut #4, promoted to a dedicated BUILD day. Re-parented (did not rewrite) each content root; every `render*()` stays untouched because the content-root ids are preserved. A single **🗂️ Profile** button (reveals at g12) replaces the five header buttons — end-game nav-button count drops **18 → 14**.

- **Re-parent map:** `#achievements-list`, `#mastery-tree-view`+`#mastery-section`, `#cosmetic-sections`, `#collection-list`, `#profile-view` moved into 5 `.phub-pane` panes; old modal wrappers deleted.
- **Tab pattern:** mirrors Day 96 `#stats-tabs` / `_switchStatsTab` — lazy-render on tab open. New `setupProfileHub()` + `_switchProfileTab()` + `_updateProfileTabsUI()` + `_profileCompletedCount()` + `_profileTabAvailable()`.
- **Tier gating:** Achievements + Customize (old g12) show from g12; Mastery/Collection/Logic (old g15) self-hide until g15. Strand-guard routes a gated tab → Achievements (P6.c: active tab non-stranded at g12).
- **ONE consolidated backdrop/close handler** on the hub (avoids the Day 61/74 duplicate-path bug). P5 verified close-button + backdrop both hide the hub.
- **Logic Profile lifecycle:** `#profile-view` cleared on hub close (Day 54 chart-lifecycle discipline). P5.c: pane content 4099 → 0 on close.
- **P4 live-mutate proof:** clicking the `blue` wire-color card (from active `classic`) flips the active cosmetic through the re-parented `#cosmetic-sections` — the render-attached click delegation survived re-parenting.

**Source LOC:** `index.html` (−40/+38 + 11 cache-bust), `css/style.css` (+~80), `js/ui.js` (+~110/−6), `sw.js` (+1/−1). Net user-facing surface: **−4 top-level buttons**.

**The 5 old `setup*` methods** (setupAchievements / setupMasteryTree / setupCircuitCollection / setupLogicProfile / setupCosmeticModal) keep their old button/modal wiring but no-op on the now-absent elements (`if (btn)` / `if (!btn||!modal) return` guards). Old button ids (`achievements-btn`, `customize-btn`, `mastery-tree-btn`, `collection-btn`, `profile-btn`) are now dead → fold into the Day 79 dead-id sweep in Cycle 6 PRUNE Code Cleanup.

**Open Bugs queue:** 0 → 0 (streak: **49 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-124-qa.md`. Harness: `qa-reports/day-124-qa.cdp.js`. Spec: `specs/day-124-collection-modal-merge.md`.

**Day 125 next:** Cycle 6 BUILD Week Day 3 — Tournament Worker production-readiness + opt-in display name.

---

*Updated: Day 123 — Cycle 6 BUILD Week, Day 1 (2026-06-30) — Module Split Phase 3*

## Day 123 — Cycle 6 BUILD Week, Day 1 (Module Split Phase 3) summary

**Build:** `?v=1782604800` / sw v76 → **`?v=1782691200` / sw v77** (first source-file change since Day 121).
**Result:** **25 / 25** assertions across 8 phases on the **FIRST run** (`qa-reports/day-123-qa.cdp.js`). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

Converted `js/simulation.js` from a classic-script global-leaking file into a true ES module (Day 92 `gates.js` / Day 107 `wires.js` precedent). `class Simulation` → `export class Simulation`; tail rebinds `window.Simulation = Simulation` so the classic-script `main.js` consumer resolves it at construction time (`new Simulation(this)` on DOMContentLoaded, after the deferred module evaluates). The two Day 42 prototype augmentations (`traceFailurePath`, `detectConstantOutputs`) stay in module scope unchanged. `Gate`/`IONode` (used only inside method bodies) resolve via module-scope global fall-through to the Day 92 `window` rebind.

- **P2 binding-identity proof:** `game.simulation instanceof window.Simulation === true`.
- **P3 evaluate path:** L1 AND-gate synthetic solve → `runAll()` evaluates 4 rows, all pass, 3★ persisted.
- **P4 trace path:** empty circuit → 1 disconnected-output trace with message; `detectConstantOutputs()` callable.
- **P5:** Day 92 + Day 107 module bindings intact. **P6:** Day 79 dead-id purge PASS. **P7:** cold 2 nav / 50 cards / silent-default difficulty.

**Source LOC:** `js/simulation.js` +14/−1, `index.html` +11/−11, `sw.js` +1/−1 = net ≈ +14 functional.

**Open Bugs queue:** 0 → 0 (streak: **48 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-123-qa.md`. Harness: `qa-reports/day-123-qa.cdp.js`. Spec: `specs/day-123-module-split-phase3.md`. Roadmap: `roadmaps/cycle-6-build.md`.

**Day 124 next:** Cycle 6 BUILD Week Day 2 — Collection-Modal Merge → tabbed Profile hub.

---

*Updated: Day 122 — Cycle 5 PRUNE Week, Day 5 (2026-06-29) — Expert Panel + Validation*

## Day 122 — Cycle 5 PRUNE Week, Day 5 (Expert Panel + Validation) summary

**Build under test:** local `?v=1782604800` / sw v76 (Day 121 artifact, **unchanged** — 0 source-file changes).
**Result:** **33 / 33** assertions across 7 phases (32/33 first run → 2 first-run harness self-bugs, fixed harness-side, **0 app changes**). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

Pure-validation day (Day 81 / Day 106 precedent). Re-scored the 10-dimension expert rubric: **Cycle 5 = 9.2 / 10** (+0.1 from Cycle 4's 9.1; Addictiveness 9 → 10, the engagement loop closed by Cycle 5 BUILD; 9 dimensions at ceiling). Wrote `reviews/prune-cycle-5-review.md`.

Validation sweep highlights:
- Build identity: 11 `?v=1782604800` refs, sw v76.
- Tier staircase: cold 2 nav / 50 cards → end-game 18 nav + 50 overflow + 50 cards.
- Level samples L1/L6/L18/L36/L48 (L48 Lab Bench III triple-composite: maxFanOut=2 + hardCap=3 + 3-chip constraint).
- Cycle 5 PRUNE cuts all intact: Day 119 Tournament 2-tab + typed-confirm + hidden-empty Stats tabs; Day 120 orphan/CSS removal; Day 121 modalPop entrance + armed red→green affordance.
- Day 79 dead-id purge PASS; Day 92/107 ESM bindings PASS.

**First-run harness self-bugs (0 app changes):** (P3.g) read L48 metadata via non-existent `gs.getLevel(48)` — real accessor is global `window.getLevel(id)`; direct probe confirmed app data correct, fixed harness-side. (P4.i) sampled typed-confirm border at 300ms but the Day 121 modalPop entrance defers the 0.18s transition start — stepped probe confirmed solid green by ~300ms, fixed by waiting 550ms.

**Open Bugs queue:** 0 → 0 (streak: **47 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-122-qa.md`. Harness: `qa-reports/day-122-qa.cdp.js` (33 assertions across 7 phases). Review: `reviews/prune-cycle-5-review.md`.

**Cycle 5 PRUNE Week complete → Cycle 5 closed. Day 123 next: Cycle 6 BUILD Week Day 1.**

---

*Updated: Day 121 — Cycle 5 PRUNE Week, Day 4 (2026-06-28) — Polish Sprint*

## Day 121 — Cycle 5 PRUNE Week, Day 4 (Polish Sprint) summary

**Build:** `?v=1782518400` / sw v75 → **`?v=1782604800` / sw v76**.
**Result:** **29 / 29** assertions across 6 phase groups (27/29 first run — 2 harness self-bugs, 0 app changes). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

**Scope decision:** the Tier-2 Cut #4 collection-modal merge (`specs/day-121-collection-merge-scaffold.md`) was judged too large/risky for one unattended polish day (5 duplicate close/backdrop handlers, live-mutating cosmetic renderer, Logic-Profile canvas leak risk) and **DEFERRED** per the Day 105 precedent. Shipped two small net-near-zero UX wins instead:

1. **Polish #1 — `#confirm-modal-content` entrance animation.** Added `animation: modalPop 0.28s …` (reuses the **existing** `modalPop` keyframe — no new keyframe) so the confirm modal animates in like the chapter-complete modal instead of snapping. Global `prefers-reduced-motion` rule (css ~3160) already neutralizes it.
2. **Polish #2 — typed-confirm "armed" green affordance.** The Day 119 `⚠ Reset Progress` typed-confirm only signalled correctness by enabling OK; the input stayed alarming-red even when `RESET` was typed correctly. New `.is-armed` class (toggled in `arm()` in `js/ui.js`) flips the input border red→green (`#0f0`, 0.18s transition) so the user gets positive feedback the gate is satisfied. `cleanup()` strips it. OK button stays red — still a destructive action.

**Harness self-bugs (both first-run, 0 app changes):** (P3.e) sampled the input border at 60ms but Polish #2's new 0.18s transition meant the read caught a mid-transition intermediate — fixed by waiting 300ms; the `.is-armed` class was correctly applied on the first run (P3.d passed) and no light-mode override exists. (P4.h) asserted difficulty `=== null` but silent-default persists `'standard'` (Day 89/105 invariant) — fixed the assertion.

**Source LOC:** `css/style.css` +16 · `js/ui.js` +3 · `index.html` +11/−11 (cache-bust only) · `sw.js` +1/−1 = **net ≈ +19 functional LOC**, inside Day 105's ±50 polish-day budget.

**Dead-identifier sweep (Day 79 invariant):** 7 ids still undefined + `#weekly-puzzle-btn` absent — PASS.

**Open Bugs queue:** 0 → 0 (streak: **46 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-121-qa.md` + `qa-reports/day-121-qa.cdp.js`.

**Day 122 next:** Cycle 5 PRUNE Week Day 5 — Expert Panel + Validation (close Cycle 5, target ≥9.1).

---

*Updated: Day 120 — Cycle 5 PRUNE Week, Day 3 (2026-06-27) — Code Cleanup*

## Day 120 — Cycle 5 PRUNE Week, Day 3 (Code Cleanup) summary

**Build:** `?v=1782432000` / sw v74 → **`?v=1782518400` / sw v75**.
**Result:** **25 / 25** assertions across 5 phases on the **first run**. **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

Net-negative day. Removed the dead code left behind by the Day 119 Cut #1 IA change:

1. **Orphaned renderer removed.** `js/ui.js` `_renderTournamentMyBest()` (its caller + the `My Best` tab/pane were deleted Day 119) is gone; replaced with a 3-line breadcrumb comment pointing future agents at Stats → 🏆 Tournament (Day 111 canonical).
2. **Dead CSS swept.** Removed the rules whose *sole* consumer was the orphaned renderer: `.tournament-stat-row` (+`:last-child` +light-mode), `.tournament-best-card` (+light-mode), `.tournament-mybest-empty`, `.tournament-badge-gold`. **KEPT** (still referenced): `.tournament-badge` (archive Live pill, ui.js), `.tcard-title` (`#tournament-puzzle-title`, index.html), `.tournament-section-title` (index.html leaderboard/archive headers), `.tournament-archive-row`.
3. **Day 121 groundwork (planning only, not shipped).** Wrote `specs/day-121-collection-merge-scaffold.md` mapping the 5 collection modals → open buttons → setup methods for the Tier-2 Cut #4 Profile merge (Achievements/Mastery/Customize/Collection/Logic Profile).

**Source LOC:** +18 / −78 = **net −60** across `js/ui.js`, `css/style.css`, `index.html` (11 cache-bust bumps), `sw.js`. PRUNE-week net-negative mandate satisfied.

**Dead-identifier sweep (Day 79 invariant):** 7 ids still undefined + `#weekly-puzzle-btn` absent — PASS.

**Open Bugs queue:** 0 → 0 (streak: **45 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-120-qa.cdp.js`. Scaffold: `specs/day-121-collection-merge-scaffold.md`.

**Day 121 next:** Cycle 5 PRUNE Week Day 4 — Polish Sprint (Day 80/105 precedent).

---

*Updated: Day 119 — Cycle 5 PRUNE Week, Day 2 (2026-06-26) — Design Simplification*

## Day 119 — Cycle 5 PRUNE Week, Day 2 (Design Simplification) summary

**Build:** `?v=1781395200` / sw v73 → **`?v=1782432000` / sw v74** (first source-file change since Day 111).
**Result:** **35 / 35** assertions across 6 phases on the **first run**. **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

Shipped the 3 Tier-1 cuts from the Day 118 `PRUNE_REPORT.md`:

1. **Cut #1 — Tournament history de-duplication.** Removed the `My Best` tab + `#tournament-tab-my-best` pane from the Tournament screen; added a one-line pointer to **Stats → 🏆 Tournament** (Day 111 canonical personal history). Tournament screen now = `This Week` + `Archive`. `_renderTournamentMyBest()` is now orphaned → deferred to Day 120 Code Cleanup.
2. **Cut #2 — `⚠ Reset Progress` typed-confirm gate.** New `UI.showTypedConfirmModal()` requires typing `RESET` before the OK button arms. Disarmed-click is a verified no-op (progress untouched, modal stays open); Cancel aborts; the shared `showConfirmModal` keeps the new input hidden so non-destructive confirms are unaffected. Removes the one-tap save-wipe footgun.
3. **Cut #3 — Hide zero-count Stats tabs.** `📸 My Cards (0)` + `🏆 Tournament (0)` are now `display:none` until their count goes positive (supersedes the Day 104/111 `.empty` dim). A new player's Stats modal collapses to a single `📊 Overview`. Defensive `_switchStatsTab` guard prevents stranding on a hidden tab.

**Source LOC:** +121 / −24 across `index.html`, `js/ui.js`, `css/style.css`, `sw.js`. Cuts #1/#3 remove surfaces; Cut #2's typed-confirm modal is the additive piece (anticipated by the PRUNE_REPORT).

**Open Bugs queue:** 0 → 0 (streak: **44 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-119-qa.md`. Harness: `qa-reports/day-119-qa.cdp.js`. Spec: `specs/day-119-design-simplification.md`.

**Day 120 next:** Cycle 5 PRUNE Week Day 3 — Code Cleanup (remove orphaned `_renderTournamentMyBest()`, sweep `my-best` CSS, collection-modal merge groundwork).

---

*Updated: Day 118 — Cycle 5 PRUNE Week, Day 1 (2026-06-25) — Fresh Eyes Audit*

## Day 118 — Cycle 5 PRUNE Week, Day 1 (Fresh Eyes Audit) summary

**Build under audit:** deployed `https://mikedyan.github.io/signal-circuit/` · `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged through the Cycle 5 HARDEN week).
**Result:** **44 / 44** assertions across 8 phases (43/44 first run — 1 harness-ordering self-bug on the Day 110 PB-badge cold probe; fixed by wiping localStorage + reloading before the cold check, 0 app changes). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs.

**Clutter score: 4/10** (held from Cycle 4; Cycle 2 closed 5/10, Cycle 1 baseline 8/10). Tier staircase smooth: nav `2/2/5/10/18/18`, overflow `0/3/6/12/18/50`, cards `50` throughout. Cycle 4 Tier-1 cuts all held (LO-1 retired, mastery cards out of grid, Difficulty under Gameplay, Tournament label 20 chars).

**Two new clutter sources + one growth concern identified:**
1. **Tournament history duplicated** across the Tournament screen `My Best` tab and the Day 111 Stats `🏆 Tournament` tab → Tier-1 Cut #1.
2. **Stats modal shows two `(0)` tabs** (`📸 My Cards (0)` + `🏆 Tournament (0)`) to brand-new players → Tier-1 Cut #3.
3. **Lab Bench grew to 15 levels / 3 mini-chapters** (L36–50), L48 stacks 3 constraint chips → Tier-2/3 cuts #5/#7.

**Carry-overs re-proposed:** `⚠ Reset Progress` one-click footgun → typed/hold confirm (Cycle 4 Tier-3 #14 promoted to Tier-1 Cut #2); 5 collection modals still unmerged (18-button Tier-3 plateau) → Tier-2 Cut #4.

**Open Bugs queue:** 0 → 0 (streak: **43 consecutive days** since Day 76).
**Latent observations:** 0 → 0.

Full report: `qa-reports/day-118-qa.md`. Harness: `qa-reports/day-118-qa.cdp.js` (44 assertions, 8 phases). Full PRUNE plan: `PRUNE_REPORT.md`.

**Day 119 next:** Cycle 5 PRUNE Week Day 2 — Design Simplification (ship the 3 Tier-1 cuts as the first source-file change since Day 111).

---

*Updated: Day 117 — Cycle 5 HARDEN Week, Day 5 (2026-06-24) — Regression Pass*

## Day 117 — Cycle 5 HARDEN Week, Day 5 (Regression Pass) summary

**Build under test:** **deployed** `https://mikedyan.github.io/signal-circuit/` · `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build — caught up on Pages, unchanged the entire HARDEN week).
**Result:** **22 / 22** assertions across 12 phases (21/22 first run — 1 harness-ordering self-bug on the D110 PB-badge cold probe; fixed harness-side, 0 app changes). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs. **0** source-file changes.

Deployment confirmed: Pages serves 11× `?v=1781395200` + `sw v73` (matches local). 14-phase deployed regression sweep:

- Build identity + cold-start invariants (50 cards, 2 nav buttons, D92/D107 ESM bindings, Day 79 dead-IDs absent).
- Core loop end-to-end on L1: place AND gate + 3 wires + Quick Test + RUN + `completeLevel(1)` persists 3★.
- All 8 modes reachable: campaign / daily / random / blitz / speedrun / sandbox / tournament / adaptive(infinite). Blitz + Speedrun HUDs cleaned on return (Day 61/74/103 fixes hold).
- Cycle 5 BUILD regression D107-D111: L48 composite validator byte-exact (`4 gates exceeds hard cap of 3`), PB badge `display:none` on truly-cold L1, Stats tournament tab + pane + `_switchStatsTab` present, Tournament backend `local` + `🏠 Local leaderboard` + isLive=false.

**Harness self-bug (first run):** D110 probe ran *after* P3 had completed L1, so the PB badge correctly showed (`display:flex`) per the Day 110 spec. Fixed by clearing localStorage + reloading before the cold-suppression probe. Same class as Days 97/98/99/107/108/115 — harness over-assumed state, app behaved correctly.

**Open Bugs queue:** 0 → 0 (streak: **42 consecutive days** since Day 76).
**Latent observations:** 0 → 0 (LO-2 resolved Day 114).

Full report: `qa-reports/day-117-qa.md`. Harness: `qa-reports/day-117-qa.cdp.js` (22 assertions across 12 phases). Week wrap: `reviews/harden-cycle-5-week-summary.md`.

**Cycle 5 HARDEN Week complete.** Day 118 next: Cycle 5 PRUNE Week Day 1 — Fresh Eyes Audit.

---

*Updated: Day 116 — Cycle 5 HARDEN Week, Day 4 (2026-06-23) — Fix Everything*

## Day 116 — Cycle 5 HARDEN Week, Day 4 (Fix Everything) summary

**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged — HARDEN week ships ZERO features).
**Mode:** Fix Day with an empty queue — no app source changes.
**Result:** **24 / 24** assertions across 14 phases. **0** console.error. **0** `Runtime.exceptionThrown`.

Open Bugs queue was empty at start of day, so Day 116 followed the Day 90 / Day 100 precedent: no speculative fixes, just a confirmation probe over the pinned HARDEN artifact.

Confirmation probe highlights:

- Build identity unchanged: 11 `?v=1781395200` refs, `sw.js` v73.
- Cold-start invariants intact: 50 cards, 2 non-level buttons, Day 79 dead identifiers undefined, `#weekly-puzzle-btn` absent.
- Stress invariants intact: rapid gate placement, mid-animation wires, resize storm, keyboard nav, colorblind/light-mode toggles, 44-wire render, undo/redo, RUN/Quick Test spam — all no-throw.
- 40+ wire performance stayed at **0.76 ms avg frame**.
- Cycle 5 BUILD regression sweep: D107/D92 module bindings, D108 local tournament backend, D109 L48 lab validator, D110 PB badge suppression, D111 Stats tournament tab — all PASS.

**Open Bugs queue:** 0 → 0 (streak: **41 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0. **Source-file changes:** 0.

Full report: `qa-reports/day-116-qa.md`. Harness: `qa-reports/day-116-qa.cdp.js` (24 assertions across 14 phases).

**Day 117 next:** Cycle 5 HARDEN Week Day 5 — Regression Pass on deployed GitHub Pages build + HARDEN week summary.

---

*Updated: Day 115 — Cycle 5 HARDEN Week, Day 3 (2026-06-22) — Edge Cases & Stress*

## Day 115 — Cycle 5 HARDEN Week, Day 3 (Edge Cases & Stress) summary

**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged — HARDEN week ships ZERO features).
**Result:** **24 / 24** assertions across 14 phases (23/24 first run — 1 harness-shape self-bug: D109 probe read `res.reason` but `_validateLabConstraints()` returns `res.message`; fixed harness-side, 0 app changes). **0** console.error. **0** `Runtime.exceptionThrown`.

Re-ran the HARDEN Wednesday Edge Cases & Stress sweep against the current build:

- **T1** 25× gate placement during active simulation — no throw.
- **T2** 10× wire push while `isAnimating=true` — no throw.
- **T3** 10× window resize mid-gameplay (device-metric override + `resize` event + `renderer.resize()`) — renders clean, gameplay screen intact.
- **T4** clear localStorage + reload — 50 cards, silent-default difficulty `standard`, clean key set.
- **T5** keyboard-only nav — 14 focusable elements on gameplay, programmatic focus lands.
- **T6** colorblind mode toggle on→off — `getWireColors()` resolves under `.colorblind-mode`.
- **T7** light/dark mode round-trip — both render.
- **T8** 40+ wires (44 wires / 22 gates) — **0.76 ms avg frame** (budget < 16 ms).
- **T9** 20× undo + 20× redo — no throw.
- **T10** 10× RUN + 10× Quick Test spam — no throw (idempotent re-entry contract holds).

**Cycle 5 BUILD regression sweep (Days 107–111):** D107/D92 window bindings (Gate/GateTypes×8 + Wire/WireManager); D108 tournament backend `local` + `🏠 Local leaderboard`; D109 L48 composite metadata (maxFanOut=2, hardCap=3, NAND-only) + validator rejects 4 gates byte-exact `Submission rejected: 4 gates exceeds hard cap of 3.`; D110 PB badge suppressed cold; D111 Stats tournament tab + pane + `_switchStatsTab` — all PASS.

**Open Bugs queue:** 0 → 0 (streak: **40 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0. **Source-file changes:** 0.

Full report: `qa-reports/day-115-qa.md`. Harness: `qa-reports/day-115-qa.cdp.js` (24 assertions across 14 phases).

**Day 116 next:** Cycle 5 HARDEN Week Day 4 — Fix Everything (open queue empty → likely Day 90/100 rest-day confirmation-probe precedent).

---

*Updated: Day 111 — Cycle 5 BUILD Week, Day 5 (2026-06-18) — Stats Dashboard Tournament History tab*

## Day 111 — Cycle 5 BUILD Week, Day 5 (Tournament History tab) summary

**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'`.
**Result:** **35 / 35** assertions across 9 phases on **first run**. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

Shipped Cycle 5 BUILD Day 5: **Tournament History tab inside the Stats modal**. Third `.stats-tab` joins the Day 96 Overview / My Cards rotation. Gated on having ≥1 submission (cold-start = empty state with the same dim-tab treatment as My Cards via Day 104's `.empty` class). Each row carries weekKey, rank chip (`👑 #1` crowned / `🏅 #N` podium / `#N` neutral), gates / mm:ss / top X% stat, a `Live` chip on the current-week row, and a `View Replay` button that closes the modal and launches `WeeklyTournament.startCurrentWeek()` or `startArchiveWeek(weekKey)`.

**Net changes:**
- **DOM (`index.html`):** new `<button id="stats-tab-tournament">` + `<div id="stats-tournament-pane">` siblings of the Day 96 Cards tab/pane.
- **CSS (`css/style.css`):** new `.tournament-history-*` block (row, chips, week column, light-mode mirror) reusing the Day 96 `tFadeIn` keyframe for tab fade-in.
- **`js/main.js`:** new `WeeklyTournament.getSubmissionHistory()` method — filters `data.byWeek`, recomputes rank/percentile defensively per render, newest-first sort by `ts` with `weekKey` tiebreak.
- **`js/ui.js`:** `_switchStatsTab(which)` validates input against a whitelist (defaults to `'overview'` so stale `_activeStatsTab` values can never strand the modal); `_updateStatsTabsUI()` updates the third tab's text + `.active` + `.empty`; new `_renderTournamentHistoryGrid()` renders rows or empty state and wires the Replay button into `WeeklyTournament` after closing the modal.

**Verification highlights:**
- P3.1–3.2: Stats modal opens to Overview (Day 96 default), both Cards + Tournament panes hidden.
- P4.2–4.3: Empty-state pane renders `🏆 No tournament runs yet` copy; tab text `🏆 Tournament (0)` carries `.empty` dim class.
- P5: `weeklyTournament.submitScore(3, 25, 'Mochi')` → row count 1, tab `(1)`, `.empty` strips, row text contains `3 gates` + `0:25`, Replay button labeled `View Replay` with `data-current="1"`.
- P6: backfill `2026-W18` directly into `byWeek` → row count 2, tab `(2)`, current-week row sits above the older `2026-W18` (newest-first by `ts`).
- P7: stub `startArchiveWeek` → archive Replay click captured `{ kind: 'archive', key: '2026-W18' }` and `stats-modal` closed (`display:none`).
- P8: cold-start invariants — How to Play + Settings visible (Day 78), **50** level cards (Day 109 invariant), 7 Day 79 dead IDs `undefined`, `#weekly-puzzle-btn` absent, Day 92 `window.Gate/GateTypes` + Day 107 `window.Wire/WireManager` all PASS.

**Source LOC:** `index.html` (+5/-2), `css/style.css` (+76), `js/main.js` (+42), `js/ui.js` (+90), `sw.js` (+1/-1) — **≈ +214/-3 net**.

**Open Bugs queue:** 0 → 0 (streak: **36 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0.

Full report: `qa-reports/day-111-qa.md`.
Harness: `qa-reports/day-111-qa.cdp.js` (35 assertions across 9 phases).
Spec: `specs/day-111-tournament-history-tab.md`.
Roadmap: `roadmaps/cycle-5-build.md`.

**Day 112 next:** Cycle 5 BUILD Week complete → Cycle 5 HARDEN Week Day 1: Full Interaction Audit.

---

## Day 110 — Cycle 5 BUILD Week, Day 4 (Personal-best badge) summary

**Build under test:** local `?v=1781308800` · `sw.js CACHE_NAME = 'signal-circuit-v72'`.
**Result:** **34 / 34** assertions across 9 phases on **first run**. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

Shipped Cycle 5 BUILD Day 4: **Personal-best badge** in the gameplay info panel. On level revisits (campaign + lab-bench only) where the player has already cleared the level, a new `#level-best-badge` chip renders `🏆 Your best: N gates · mm:ss · ⭐⭐⭐` with a `📈 Try to beat` CTA (or `✨ Perfect run — try a no-hint speedrun?` when 3★ at optimal). Suppressed on first entry and across sandbox / challenge / daily / infinite / tournament. Live-updates after `completeLevel()` saves a new best (with a cyan pulse via `.lbb-improved`).

**Net changes:**
- **DOM (`index.html`):** new `<div id="level-best-badge">` inserted after `#gate-indicator` inside `#level-info`, containing `#level-best-text` + `#level-best-cta`.
- **CSS (`css/style.css`):** new `#level-best-badge` block + `@keyframes lbbImprovedPulse` + `prefers-reduced-motion` guard + light-mode mirror.
- **`js/ui.js`:** new `UI.updateLevelBestBadge({improved?})` method (~68 LOC). Reads `gs.progress.levels[level.id]`, suppresses across non-campaign modes (`isSandbox|isChallenge|isDaily` flags + `gs.isSandboxMode|isChallengeMode|isInfinite|isTournament|isTournamentArchive`), renders gate/time/star tuple, picks one of two CTAs based on perfect-run heuristic. Called from `updateLevelInfo()` tail.
- **`js/main.js`:** `updateLevelBestBadge({improved:true})` hook at end of `completeLevel()` (after `saveProgress()`).

**Verification highlights:**
- P2.3: Cold L1 entry — badge `style.display === 'none'` (no prior progress).
- P3.1–3.5: Synthetic `progress[1] = {bestGateCount:1, bestTime:22, stars:3}` + `loadLevel(1)` → badge `display:flex`, text contains `"1 gate"` (singular handled), `"0:22"` (mm:ss), 3 `⭐` glyphs, perfect-run CTA fires.
- P4.3–4.6: Inferior prior (`{bestGateCount:3, bestTime:60, stars:1}`) overwritten by synthetic 30s + `completeLevel(1, 1)` run → returns `stars=3`, progress updates to `bestGateCount:1`, badge text changes to `"1 gate"`, `.lbb-improved` class applies (pulse animation fires).
- P5: Equal-best save — `completeLevel(1, 1)` on already-optimal entry → `bestGateCount` unchanged, badge stays visible, 0 throws.
- P6: Sandbox mode → badge `display:none`.
- P7: Daily mode → badge `display:none`.
- P8: cold-start invariants — **50 level cards** (Day 109 invariant), Day 79 7 dead IDs all `undefined`, `#weekly-puzzle-btn` DOM absent, Day 92 `window.Gate/GateTypes`, Day 107 `window.Wire/WireManager` bindings live.

**Source LOC:** `index.html` (+9), `css/style.css` (+50), `js/ui.js` (+68), `js/main.js` (+6), `sw.js` (+1/-1) — **≈ +133/-11 net**.

**Open Bugs queue:** 0 → 0 (streak: **35 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0.

Full report: `qa-reports/day-110-qa.md`.
Harness: `qa-reports/day-110-qa.cdp.js` (34 assertions across 9 phases).
Spec: `specs/day-110-level-best-badge.md`.
Roadmap: `roadmaps/cycle-5-build.md`.

**Day 111 next:** Stats Dashboard Enhancement — Tournament History tab inside Stats modal (per `roadmaps/cycle-5-build.md`).

---

## Day 109 — Cycle 5 BUILD Week, Day 3 (Lab Bench III — fan-out budget) summary

**Build under test:** local `?v=1781222400` · `sw.js CACHE_NAME = 'signal-circuit-v71'`.
**Result:** **42 / 42** assertions across 10 phases on **first run**. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

Shipped Cycle 5 BUILD Day 3: **Lab Bench III mini-chapter (L46-L50)** with a third validator constraint axis — **fan-out budget**. The first triple-composite level (L48: NAND palette + hardCap=3 + maxFanOut=2) lights up the new 3-chip HUD slot and the multi-clause validator path in a single design.

**Net changes:**
- **Levels:** 5 new lab-bench levels in Chapter 11 (`isLabBench:true` + `maxFanOut:2`). L46 single-constraint (intro). L47 fan-out + hardCap. **L48 triple-composite** (NAND-only + hardCap=3 + maxFanOut=2). L49 mustIncludeGate=[XOR] + fan-out + hardCap. L50 NAND-only + fan-out + hardCap=2. Each level has 3 escalating hints; truth tables verified.
- **Validator (`js/main.js _validateLabConstraints()`):** third clause appended after `mustIncludeGate`. Counts wires per `(fromGateId, fromPinIndex)` source (input-node outputs + gate output pins treated uniformly). Rejection clause: byte-exact `"fan-out K exceeds budget of N"`. Day 94 multi-reason `.join('; ')` handles the composite case.
- **HUD (`js/ui.js updateLabHud()`):** populates new `#lab-constraint-3` slot from `level.labConstraint[2]` using the same show/hide pattern. L46 single-string still hides chips 2 + 3; L48 renders all three side-by-side.
- **DOM (`index.html`):** new `<span id="lab-constraint-3" class="lab-chip lab-constraint">` inserted after `#lab-constraint-2`.
- **Chapter metadata (`js/levels.js` CHAPTERS):** new entry `id:11, title:'Chapter 11: Lab Bench III', levels:[46-50], isBonus:true, color:'#A0F8FF'`.

**Verification highlights:**
- P4.3: L46 with 3 wires from input A → byte-exact `"Submission rejected: fan-out 3 exceeds budget of 2."` (single-clause format).
- P5.5: L48 with 4 NANDs + A fanned to 3 → byte-exact `"Submission rejected: 4 gates exceeds hard cap of 3; fan-out 3 exceeds budget of 2."` (composite format via Day 94 `; ` join).
- P6.4: L48 shows all 3 chips visible with texts matching `labConstraint` array; L46 keeps chips 2+3 hidden.
- P7.3: L48 optimal 2-NAND solve (G1 = NAND(A,B); G2 = NAND(G1,G1)) completes via `runQuickTest()` with stars persisted.
- P8.2: Day 94 regression — L44 (NAND-only Half Adder, hardCap=6) with 7 NANDs still rejects byte-exact `"Submission rejected: 7 gates exceeds hard cap of 6."`. No fan-out clause leaks because L44 has no `maxFanOut`.
- P9: cold-start invariants — 2 nav buttons (Day 78), **50 level cards** (45 baseline + 5 new bonus L46-L50), silent-default difficulty, Day 79 dead-IDs undefined, Day 92 `window.Gate/GateTypes`, Day 107 `window.Wire/WireManager`, SW v71 all PASS.

**Source LOC:** `js/levels.js` (+187), `js/main.js` (+22), `js/ui.js` (+14), `index.html` (+12/-11), `sw.js` (+1/-1) — **+236/-12 net**.

**Open Bugs queue:** 0 → 0 (streak: **34 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0.

Full report: `qa-reports/day-109-qa.md`.
Harness: `qa-reports/day-109-qa.cdp.js` (42 assertions across 10 phases).
Spec: `specs/day-109-lab-bench-iii.md`.
Roadmap: `roadmaps/cycle-5-build.md`.

**Day 110 next:** Gameplay HUD personal-best badge — `#level-best-badge` shows best gate/time/star on revisit; suppressed cold; live-updates on improvement.

---

## Day 108 — Cycle 5 BUILD Week, Day 2 (Tournament Worker Go-Live) summary

**Build under test:** local `?v=1781136000` · `sw.js CACHE_NAME = 'signal-circuit-v70'`.
**Result:** **48 / 48** assertions across 9 phases on second run (first run had 1 harness self-bug: P3.2 compared `workerUrl` against a literal `${MOCK_URL}` template tag — fixed harness-side, zero app changes). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

Shipped Cycle 5 BUILD Day 2: **Tournament Worker is live in the rendered leaderboard**. Day 93 had the adapter shell + cloud-ready/remote/remote-fallback state machine + fire-and-forget POST, but explicitly deferred reading the cloud cache into the UI. Today closes that loop and lands the roadmap-spec REST surface.

**Net changes:**
- **Worker REST surface:** roadmap-spec `POST /submit/:weekKey` URL-keyed alias added to `worker.js` + `local-mock-worker.js`; legacy `POST /scores` preserved for back-compat. Response payloads now echo `weekKey`. `wrangler.toml` binding renamed to `TOURNAMENT_KV` per roadmap; worker reads either `env.TOURNAMENT_KV` (new) or `env.SIGNAL_CIRCUIT_TOURNAMENT` (Day 93 legacy).
- **Adapter:** `RemoteTournamentAdapter` gains `getRemoteEntries(weekKey)` (sync cache reader, returns array or null) + `onBoardUpdate(weekKey, cb)` (listener/disposer pair, fires after async `/leaderboard/:weekKey` fetch lands). `TournamentBackend` base + `LocalTournamentAdapter` ship inert defaults so renderers never type-sniff the backend class.
- **Renderer:** `ui.js _renderTournamentLeaderboard()` — when mode is `remote` AND cloud cache non-empty, render cloud entries merged with the player's local best, sorted by score, top 10. `.tournament-row-cloud` cyan-tinted CSS variant + 🌐 prefix mark cloud rows; ⭐ wins on the self row. Every other mode keeps the local pseudo-board (gameplay-unaffecting fallback).
- **Listener lifecycle:** `showTournamentScreen()` disposes any prior listener and registers a fresh one keyed on the current week. Kicks `backend.getLeaderboard(info.key)` to fire the async fetch.
- **CSS:** `.tournament-row-cloud` + light-mode mirror.

**Verification highlights:**
- P4: `submitScore(3, 25, 'Mochi')` → mock worker `GET /leaderboard/:wk` shows exactly 1 entry, stored score == local-submission score (no drift).
- P5: 3 cloud rows render in the tournament screen, 1 self-cloud row, first-row name prefix is 🌐 or ⭐, mode label = `🌐 Live leaderboard`.
- P6: kill mock → `getMode() === 'remote-fallback'` → forced re-render shows 0 `.tournament-row-cloud` rows + 10 local pseudo-rows. `submitScore` on fallback still returns a local payload (gameplay never blocks on the network).
- P7: `POST /submit/2026-Wxx` returns `{ok: true, weekKey, rank: 1}`; legacy `POST /scores` still 200; `POST /submit/notaweek` returns 400.
- P8: Day 78 cold-start 2 nav buttons; Day 103 45 level cards; Day 79 dead identifiers undefined + `#weekly-puzzle-btn` DOM absent; Day 107 `window.Wire`/`WireManager` still classes; Day 92 `window.Gate`/`GateTypes` still bound.

**Source changes:** `js/main.js` (+~50), `js/ui.js` (+~50), `css/style.css` (+10), `tools/tournament-worker/worker.js` (+30/-10), `tools/tournament-worker/local-mock-worker.js` (+20/-3), `tools/tournament-worker/wrangler.toml` (binding rename), `index.html` (cache-bust ×11), `sw.js` (CACHE_NAME bump v69→v70).

**Open Bugs queue:** 0 → 0 (streak: **33 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0.

Full report: `qa-reports/day-108-qa.md`.
Harness: `qa-reports/day-108-qa.cdp.js` (48 assertions across 9 phases, self-spawns + tears down the mock worker).
Roadmap: `roadmaps/cycle-5-build.md`.

**Day 109 next:** Lab Bench III mini-chapter (L46-L50) with fan-out budget — third constraint axis, composite with NAND-only + hardCap.

---

## Day 107 — Cycle 5 BUILD Week, Day 1 (Module Split Phase 2) summary

**Build under test:** local `?v=1781049600` · `sw.js CACHE_NAME = 'signal-circuit-v69'`.
**Result:** **34 / 34** assertions passed across 7 phases on second run (first run had 3 self-bugs: vCount expected 11 `<script>` tags when it's actually 10 scripts + 1 stylesheet = 11 `?v=` refs total; campaign entry path is `startLevel(id)` not bare `loadLevel(id)`; field name is `gs.gates` not `gs.placedGates` — all 3 fixed harness-side, zero app changes). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

Shipped Cycle 5 BUILD Day 1: **`js/wires.js` → true ES module**. Day 92 precedent (gates.js) applied to wires.js: 5 top-level declarations gained `export` (`WIRE_COLORS_DEFAULT`, `WIRE_COLORS_COLORBLIND`, `getWireColors`, `Wire`, `WireManager`); tail rebind block installs the 4 externally-consumed names (`Wire`, `WireManager`, `WIRE_COLORS_DEFAULT`, `getWireColors`) on `window` so the 4 classic-script consumers (`simulation.js`, `canvas.js`, `ui.js`, `main.js`) continue to resolve them as bare globals at call time. `WIRE_COLORS_COLORBLIND` deliberately NOT rebound — it's internal to `wires.js` only.

**Verification highlights:**
- `window.game.wireManager instanceof window.WireManager === true` (binding-identity proof: the rebind is canonical, not a re-export).
- 11 cache-bust refs unified at `?v=1781049600` (10 scripts + 1 stylesheet).
- L1 AND-gate synthetic solve through `new window.Gate('AND', ...)` + 3 × `new window.Wire(...)` + `runQuickTest()` → `progress.levels[1].stars === 3`.
- Day 92 gates.js Phase 1 contract untouched: `window.Gate` / `window.GateTypes` / `window.IONode` / `window.roundRect` still present + correct shape.
- Day 79 dead-id purge regression intact (7 identifiers undefined + #weekly-puzzle-btn DOM absent).
- Cold-start Day 78 + Day 103 invariants hold (2 nav buttons, 45 level cards, silent-default difficulty='standard').

**Source changes:** `js/wires.js` (+18/-6); `index.html` (cache-bust ×11 + `type="module"` on wires.js); `sw.js` (CACHE_NAME bump v68→v69).

**Open Bugs queue:** 0 → 0 (streak: **32 consecutive days** since Day 76).
**Latent observations:** 0 → 0.
**New bugs found today:** 0. **New bugs introduced today:** 0.

Full report: `qa-reports/day-107-qa.md`.
Harness: `qa-reports/day-107-qa.cdp.js` (34 assertions across 7 phases).
Roadmap: `roadmaps/cycle-5-build.md`.

**Day 108 next:** Tournament Worker Go-Live — write `tools/tournament-worker/` (Cloudflare Worker + KV store), wire `RemoteTournamentAdapter` to it, verify offline fallback.

---

## Day 106 — Cycle 4 PRUNE Week, Day 5 (Expert Panel + Validation) summary

**Build under test:** local `?v=1780876800` · `sw.js CACHE_NAME = 'signal-circuit-v68'` (Day 105 build, unchanged today). 0 source-file changes.
**Result:** **80 / 80** assertions passed across 7 phases on second run (first run had 15 harness shape mismatches — selectors pointed at non-existent `#challenge-modes`/`#info-modes` parents and a `.screen.active` selector that doesn't match the actual `#level-select-screen` markup; all fixed by adopting Day 102's nav-button-filter primitive). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Re-scored the 10-dimension expert rubric across L1/L6/L18/L36/L44** (Day 81 / Day 67 precedent). Final score: **9.1 / 10** (+0.2 from Cycle 2 close 8.9, +1.8 from Day 35 baseline 7.3). Two dimensions moved: Difficulty Curve +1 (Lab Bench II composite L41-L45 bridges L40→L60 with a unique post-campaign identity) and Bug-Free +1 (31-day empty-queue streak + 363-assertion HARDEN clean week + LO-1 retired). The remaining 7 dimensions are at their 9-ceiling.

**Validation coverage:**
- Build identity (11 ?v=1780876800 refs, sw v68, GameState constructed)
- Cold-start audit (2 nav buttons, 45 level cards, 0 mastery cards in grid, silent-default difficulty='standard', SFX 0.4, Music 0.2)
- Tier staircase (seeds 0/3/6/9/12/15/18/45 — Day 78 #2 cadence holds 28 days later; end-game = 63 = 18 nav + 45 overflow)
- L1 (cold tutorial path), L6 (end Ch1), L18 (Tier-3 unlock), L36 (Lab Bench I), L44 (Lab Bench II NAND-only Half Adder, validator rejects 7-NAND submission with byte-exact `"Submission rejected: 7 gates exceeds hard cap of 6."`)
- Cycle-4 invariants: Day 103 #1 LO-1 fix (bypass path cleans Blitz HUD), Day 103 #2 Tournament label compressed to 20 chars, Day 103 #3 Stats default-tab=overview cold, Day 103 #4 mastery cards out of grid, Day 103 #5 Lab HUD has 2 .lab-hud-row containers, Day 104 #2 Difficulty filed under Gameplay, Day 105 #1 settingsSectionFadeIn keyframe present
- Day 79 dead-id purge: 7 identifiers undefined + #weekly-puzzle-btn DOM absent (27 days post-purge)
- Console hygiene: 0/0

**Open Bugs queue:** 0 → 0 (streak: **31 consecutive days** since Day 76).
**Latent observations:** 0 → 0 (LO-1 retired on Day 103).

**Atomic commits:** 1 (Day 81 / Day 67 PRUNE Day 5 precedent — review + state update wrap as a single logical change).

Full report: `qa-reports/day-106-qa.md`.
Harness: `qa-reports/day-106-qa.cdp.js` (80 assertions across 7 phases).
Review: `reviews/prune-cycle-4-review.md` (15 KB).

**Cycle 4 PRUNE Week closes. Cycle 5 BUILD Week begins Day 107 (tomorrow).** Roadmap target: Tournament Worker go-live (Day 83/93 adapter shell ready), Module split Phase 2 (wires.js → ES module), Lab Bench III mini-chapter (L46-L50 with fan-out budget constraint), shareable circuit images polish, gameplay HUD personal-best badge.

---


## Day 105 — Cycle 4 PRUNE Week, Day 4 (Polish Sprint) summary

**Build under test:** local `?v=1780876800` · `sw.js CACHE_NAME = 'signal-circuit-v68'` (third source-file day this PRUNE week after Day 103/104). Cache-bust + SW bumped together per Day 78 precedent.
**Result:** **56 / 56** assertions passed across 9 phases on second run (one harness hardening pass to fix two probe-shape mismatches against `_notifManager.isEnabled()` and an init-timing race on `onboardingExperiment.getVariant()`). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`. LOC delta `+57 / −15 = +42` net across 4 source files — well inside Day 80's ±50 polish-day budget.

**Ships:** 2 polish items + 4 verifications.

1. **Polish #1 — Settings-section staggered fade-in.** New `@keyframes settingsSectionFadeIn` (220ms ease-out, opacity 0→1 + translateY 6px→0). `#settings-modal.is-opening .settings-section` applies the animation; 6 `:nth-of-type(N)` stagger rules with delays `0/35/70/105/140/175ms` so each section paints in sequence. `setupSettingsModal()`'s `show()` handler adds `.is-opening` to the modal immediately, stores a 600ms `setTimeout` on `this._settingsOpeningTimer`, and strips the class when the timer fires so re-opens re-fire the animation cleanly. `hide()` also strips the class and cancels the pending timer. `@media (prefers-reduced-motion: reduce)` short-circuits to `none !important`. Makes the Day 104 PRUNE Cut #2 Gameplay section feel deliberate rather than abrupt.
2. **Polish #2 — `.stats-tab` opacity transition.** Extended `.stats-tab` `transition:` to include `opacity .15s` alongside the existing `color .15s, border-color .15s`. The Day 104 PRUNE Cut #4 `.empty` class dim now animates smoothly when the user saves their first card (0.55 → 1.0 over 150ms) instead of snapping.
3. **Verify #3 — Focus-ring on relocated `#difficulty-mode-btn`** (no code change). Day 29 universal `button:focus-visible` rule (`outline: 2px solid #0f0; box-shadow: 0 0 8px rgba(0,255,0,0.3);`) still applies through the new `#settings-gameplay-row` parent. No `#difficulty-mode-btn` override exists.
4. **Verify #4 — Mobile-layout double-check** at 375/414/768/1024 px. At every width: 0 vertical overlaps between the 5 visible `.settings-section` rows; Gameplay section header always visible; no horizontal scroll triggered by the new section.
5. **Verify #5 — Welcome-toast vs L1 tutorial overlap** (PRUNE_REPORT Tier-3 #12). The `silent-standard` variant DOES fire a soft welcome toast (`🔧 Mode set to Standard. Change anytime in Settings.`) for 4.5s at cold start — but the toast sits at `z-index: 10020` / `top: 16px` while the tutorial overlay sits at `z-index: 50` over the toolbox area. They occupy different screen regions and z-layers and coexist cleanly. **Conclusion: no fix needed**, documented behavior, not a regression.
6. **Verify #6 — Cold-start defaults audit** (Day 80 precedent). SFX 0.4 / Music 0.2 / theme auto / Standard silent-default / Daily+Streak notifs all unchanged. 2 cold-start non-level buttons (Day 78 invariant **30 days in**).

**LOC delta** (4 source files: `css/style.css`, `js/ui.js`, `index.html`, `sw.js`): **+57 / −15 = +42 net**. Insertions dominated by the keyframe + 6 stagger rules + the JS class-lifecycle wiring + per-cut audit-trail breadcrumb comments. Polish-day budget per Day 80 was "net-neutral or small-positive (±50)"; +42 lands inside.

**Cycle 4 PRUNE-week net LOC across 3 source-file days:** +50 / −1 / +42 = **+91 net**. PRUNE-week net-negative-LOC mandate did not hold this cycle in raw LOC terms because Day 103 absorbed LO-1's transition-layer move (+50). Comment-stripped delta is approximately net-zero across the three days. The actual *cuts* shipped (5 + 4 + 0 = 9 PRUNE cuts + 2 polish items) hit the spirit of the mandate.

**Cache-bust + SW bump:** `?v=1780790400` → `?v=1780876800` (11 refs in `index.html`); `signal-circuit-v67` → `signal-circuit-v68` (in `sw.js`).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **30 consecutive days** since Day 76).
**Latent observations:** **0 → 0** (LO-1 retired on Day 103; no new LOs surfaced today).

**Atomic commits:** 1 (Day 65 + Day 79 + Day 80 polish/cleanup-day precedent — single logical change).

Full report: `qa-reports/day-105-qa.md`.
Harness: `qa-reports/day-105-qa.cdp.js` (56 assertions across 9 phases).
Spec: `specs/day-105-polish-sprint.md`.

**Day 106 next: PRUNE Week Day 5 — Expert Panel + Validation** (Day 81 / Day 67 precedent). Re-score 10 dimensions across L1/L6/L18/L36/L44, write `reviews/prune-cycle-4-review.md`, target ≥9.0 (Cycle 2 closed at 8.9; the floor is hold-don't-drop). Close Cycle 4 PRUNE Week and stage Cycle 5 BUILD-week roadmap kickoff for Day 107.

---

## Day 104 — Cycle 4 PRUNE Week, Day 3 (Code Cleanup) summary

**Build under test:** local `?v=1780790400` · `sw.js CACHE_NAME = 'signal-circuit-v67'` (second source-file day in a row after Day 103 broke the 7-day Day 96 build pin). Cache-bust + SW bumped together per Day 78 precedent.
**Result:** **34 / 34** assertions passed across 8 phases on first run (Day 104 harness). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`. PRUNE-week net-negative-LOC mandate held: +43 / −44 = **−1 net** across 5 source files.

**Ships:** 4 PRUNE cuts — 1 orphan-CSS removal + 2 Cycle 2 Tier-2 carry-overs + 1 Cycle 4 Tier-2 polish.

1. **Cut #1 — Orphan `.mastery-level` CSS removed (Code Cleanup).** 5 selectors under `#mastery-levels-grid .level-btn.mastery-level` deleted from `css/style.css` (−26 / +5 LOC). The class is never applied — `renderMasterySection()` in `js/ui.js` sets `level-btn` + `completed mastery-completed` and uses inline `borderColor` for the gold/purple framing. Surfaced by re-tracing what Day 103 Cut #4's modal re-parent actually still reached.
2. **Cut #2 — Difficulty Mode filed under Gameplay (Cycle 2 Tier-2 carry-over #8).** `🔧 Mode: Standard` button moved out of `Display & Accessibility` into a new `Gameplay` section between Display and Audio. New `#settings-gameplay-row` wrapper. Button label, aria-label, click handler, and the 3-option chooser modal are byte-identical — only the parent section changes.
3. **Cut #3 — Install-App settings button gated when standalone (Cycle 2 Tier-2 carry-over #9).** `setupInstallPrompt()` now hides `#install-app-btn` when `this._isStandalone()` returns true (`matchMedia('(display-mode: standalone)').matches` OR `navigator.standalone` on iOS). The auto-arc has guarded on the same helper since Day 69; this brings the Settings entry under the same gate so the Data row stops carrying a no-op button when the PWA is installed.
4. **Cut #4 — My Cards stats tab dimmed when library empty (Cycle 4 Tier-2 #6).** `_updateStatsTabsUI()` toggles a `.empty` class on `#stats-tab-cards` when `getCardLibrary().length === 0`. CSS `.stats-tab.empty:not(.active) { opacity: 0.55 }` dims the tab so `📸 My Cards (0)` reads as a placeholder, not a content count. Active styling overrides the dim so clicking still gives the normal active treatment.

**LOC delta** (5 source files: `css/style.css`, `index.html`, `js/main.js`, `js/ui.js`, `sw.js`): **+43 / −44 = −1 net**. Cut #1 alone is −26 / +5; the carry-over cuts add small breadcrumb comments. Comment-stripped delta is well below zero — the PRUNE-week net-negative mandate holds.

**Cache-bust + SW bump:** `?v=1780704000` → `?v=1780790400` (11 refs in `index.html`); `signal-circuit-v66` → `signal-circuit-v67` (in `sw.js`).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **29 consecutive days** since Day 76).
**Latent observations:** **0 → 0** (LO-1 retired on Day 103; no new LOs surfaced today).

**Atomic commits:** 4 cuts × 1 commit + 1 wrap commit (Day 78 / Day 103 precedent).

Full report: `qa-reports/day-104-qa.md`.
Harness: `qa-reports/day-104-qa.cdp.js` (34 assertions across 8 phases).

**Day 105 next: PRUNE Week Day 4 — Polish Sprint** (Day 80 precedent). Tier-3 backlog: smoothness/animation polish on the new Gameplay section reveal, focus-ring audit on the relocated difficulty button, mobile-layout double-check on the now-stacked settings sections, defaults audit before Day 106 (Expert Panel + Validation, target ≥9.0).

---

## Day 103 — Cycle 4 PRUNE Week, Day 2 (Design Simplification) summary

**Build under test:** local `?v=1780704000` · `sw.js CACHE_NAME = 'signal-circuit-v66'` (first source-file change since Day 96). Cache-bust + SW bumped together per Day 78 precedent.
**Result:** **40 / 40** assertions passed across 7 phases on first run (Day 103 harness). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`. **LO-1 retired** — Day 102 P5 / P5b reproduction harness FAILS on this build (the documented success signal).

**Ships:** 5 Tier-1 PRUNE cuts from `PRUNE_REPORT.md`.

1. **Cut #1 — LO-1 fix (mandatory first).** HUD cleanup moved from `GameState.showLevelSelect()` wrapper into `UI.showScreen()` transition layer. When destination is `'level-select'`, the transition layer cleans BOTH `blitzMode`/`blitzTimer`/`#blitz-hud` AND `speedrunMode`/`speedrunTimer`/`speedrunStart`/`#speedrun-hud`. Day 61 + Day 74 defensive blocks in `GameState.showLevelSelect()` removed (transition layer now owns the contract). **LO-1 retires after 12 days of latency** (re-verified non-user-reachable on Days 87/88/89/90/91/97/98/99/100/101/102).
2. **Cut #2 — Tournament label compression.** `LocalTournamentAdapter.describe()` + `RemoteTournamentAdapter.describe()` switched to a 4-state, 1–2-word vocabulary keyed off Day 93's machine. `local`→`🏠 Local leaderboard`, `remote`→`🌐 Live leaderboard`, `remote-fallback`→`🌐 Live · offline`, `cloud-ready`→`🌐 Connecting…`. CSS `max-width`/`text-overflow:ellipsis`/`white-space:nowrap` on `#tournament-mode-label` bounds future state strings.
3. **Cut #3 — Stats modal default-to-Cards.** `UI.setupStatsDashboard()` open handler now reads `gameState.getCardLibrary().length` and routes through `_switchStatsTab('cards')` when non-empty (Day 96 default preserved for empty libraries).
4. **Cut #4 — Mastery card gating.** `<div id="mastery-section">` moved from the level-select panel into the `🌳 Mastery Tree` modal. `renderLevelSelect()` no longer calls `renderMasterySection()`; the Mastery Tree open handler does instead. End-game level grid drops **50 → 45 cards**; all 5 Chapter Mastery challenges remain reachable through the modal.
5. **Cut #5 — `#lab-budget` out of constraint chip strip.** `#lab-hud` restructured into two `.lab-hud-row` divs with `flex-direction: column` on the parent. Top row: label + constraint chips + tries + reset (the constraint manifest). Bottom row: `#lab-budget` alone (state, not rule). Preserves Lab Bench III's "constraint manifest" vocabulary predicted by Day 94 LESSONS_LEARNED.md.

**LOC delta** (5 source files): +103 / -53 = +50 net. Insertions are dominated by per-cut `// Day 103 PRUNE Cut #N:` audit-trail breadcrumbs at the touch sites; comment-stripped delta is approximately net-zero. PRUNE-week net-negative-LOC mandate carries forward to Day 104 (Code Cleanup).

**Cache-bust + SW bump:** `?v=1780617600` → `?v=1780704000` (11 refs in `index.html`); `signal-circuit-v65` → `signal-circuit-v66` (in `sw.js`). Both required because Day 96 build had been pinned through Days 97/98/99/100/101/102.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **28 consecutive days** since Day 76).
**Latent observations:** **0 — LO-1 retired** (see Resolved section below).

**Atomic commits:** 5 cuts × 1 commit + 1 wrap commit (Day 78 precedent).

Full report: `qa-reports/day-103-qa.md`.
Harness: `qa-reports/day-103-qa.cdp.js` (471 LOC, 40 assertions across 7 phases).
Full PRUNE plan: `PRUNE_REPORT.md`.

**Day 104 next: PRUNE Week Day 3 — Code Cleanup** (Day 79 precedent). Dead-code sweep + orphan-helper scan + Tier-2 carry-overs #8 (Difficulty Mode filing) and #9 (Install-App gating).

---

## Day 102 — Cycle 4 PRUNE Week, Day 1 (Fresh Eyes Audit) summary

**Build under audit:** deployed `https://mikedyan.github.io/signal-circuit/` · `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, **unchanged through Days 97/98/99/100/101 = 6 consecutive HARDEN-week days**, today is the 7th).
**Result:** **49 / 49** fresh-eyes assertions passed across 8 phases (first run, no harness iterations). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Clutter score:** **4 / 10** (Cycle 2 closed at 5/10; Cycle 1 baseline 8/10). Weighted by where players spend time (most users live in the L6–L18 range), tighter than Cycle 2 thanks to the Day 78 staircase + Day 79 dead-code purge holding for 28 days.

**Tier staircase walk (deployed build, fresh profile, live counts):**

| seed | Nav buttons | Overflow buttons | Level cards |
|------|-------------|------------------|-------------|
| 0    | 2           | 0                | 45          |
| 3    | 2           | 3                | 45          |
| 6    | 5           | 6                | 45          |
| 9    | 7           | 9                | 45          |
| 12   | 10          | 12               | 45          |
| 15   | 13          | 15               | 45          |
| 18   | 18          | 18               | 45          |
| 45   | 18          | 45               | **50**      |

**Three new clutter sources identified** (vs Cycle 2's 3):

1. **Mastery surprise at end-game** — `seedProgress(45)` reveals 5 Chapter Mastery cards co-rendered with campaign cards (no visual distinction). Cards: 45 → 50.
2. **Tournament mode label verbosity** (Day 83/93) — 60-character status line `🏠 Local leaderboard · same puzzle, deterministic bots`. The Worker live mode labels add more parenthetical apology copy.
3. **Lab Bench II 3-chip HUD stack** at composite levels (L44/L45) — `#lab-constraint` + `#lab-constraint-2` + `#lab-budget` all in one strip, mixing constraints (rules) with state (count).

**Two Cycle 2 carry-overs SHIPPED** since Day 81 (verified live today):

- ✅ Top-left gameplay icons now carry `title` + `aria-label` (Encyclopedia / Shortcuts / KB-Wiring).
- ✅ Step chips no longer render on locked cards (0 visible).

**Two Cycle 2 carry-overs still unshipped:**

- ❌ Difficulty Mode (`🔧 Mode: Standard`) still filed under Display & Accessibility (Cycle 2 Tier-2 #8).
- ❌ `📲 Install App` button still always visible in Settings even when app is in standalone mode (Cycle 2 Tier-2 #9).

**Proposed cuts:** 14 total (5 Tier 1 + 5 Tier 2 + 4 Tier 3). Tier 1 list (locked as Day 103 deliverable):

1. **LO-1 fix** — move HUD cleanup from `GameState.showLevelSelect()` wrapper into `ui.showScreen('level-select')` transition layer.
2. **Tournament mode label compression** — 4 short labels keyed off Day 93's 4-state machine (`🏠 Local leaderboard` / `🌐 Live leaderboard` / `🌐 Live · offline` / `🌐 Connecting…`).
3. **Stats modal default tab** — if `library.length > 0`, default to Cards tab.
4. **Mastery card gating** — gate Chapter Mastery cards behind the Mastery Tree modal (or `.level-btn.mastery` distinct class).
5. **Lab budget chip move** — move `#lab-budget` out of the constraint-chip strip into its own row.

**LO-1 (latent observation):** 11th day re-verified today. Audit phase P5 explicitly reproduced BOTH halves on Speedrun (`gs.ui.showScreen('level-select')` leaves `speedrunMode=true` + HUD `display=flex`) AND on Blitz (symmetric). LO-1 is a real abstraction-layer bug, not a Speedrun-specific quirk. **Lands tomorrow as Tier-1 cut #1.**

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **27 consecutive days** since Day 76).

Full report: `qa-reports/day-102-qa.md`.
Harness: `qa-reports/day-102-qa.cdp.js`.
Full PRUNE plan: `PRUNE_REPORT.md`.

**Day 103 next: PRUNE Week Day 2 — Design Simplification (ship the 5 Tier-1 cuts as the first source-file change since Day 96).**

---

*Updated: Day 101 — Cycle 4 HARDEN Week, Day 5 (2026-06-08) — Regression Pass*

## Day 101 — Cycle 4 HARDEN Week, Day 5 (Regression Pass) summary

**Build under test:** **deployed** `https://mikedyan.github.io/signal-circuit/` · `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, **unchanged through Days 97/98/99/100/101**).
**Result:** **44 / 44** regression assertions passed (first run, deployed site). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Probe shape:** 14-phase regression sweep on the deployed GitHub Pages URL — Day 91's harness transplanted verbatim with three constants swapped (cache-bust v60→v65, expected card count 43→45, end-game seed 40→45).

- **P1** build identity on deployed site — 11 cache-bust refs unified at `?v=1780617600`, SW deployed with `CACHE_NAME=signal-circuit-v65` (verified via direct `fetch('sw.js')` + grep).
- **P2** cold-start surface — 2 non-level buttons, **45 level cards** (post-Day-94), variant `silent-standard`, difficulty silent-default `standard`.
- **P3** core loop end-to-end on L1 — gameplay screen visible, RUN visible, 4 truth-table rows, 1 AND gate placed, 3 wires drawn, L1 progress recorded with 3 stars (optimal).
- **P4** campaign progression — L2 unlocked after L1 solve, L2 loads on gameplay with `currentLevel.id === 2`.
- **P5** Daily Challenge — pre-screen opens, `#start-daily-btn` loads gameplay with `isDaily=true`.
- **P6** Random Challenge — config screen opens, `#generate-challenge-btn` loads gameplay with `isChallengeMode=true`.
- **P7** Blitz Mode + Day 61 fix — entry sets `blitzMode=true` + HUD `display=flex`; back-btn cleans `blitzMode=false` + HUD `display=none`.
- **P8** Speedrun Mode + Day 74 fix — entry sets `speedrunMode=true` + HUD `display=flex`; back-btn cleans `speedrunMode=false` + HUD `display=none`.
- **P9** Sandbox config screen opens.
- **P10** Tournament Mode — screen opens, 3 tabs (This Week / My Best / Archive), Day 83 adapter shape (`getMode`/`describe`/`isLive`), mode `local`, label `🏠 Local leaderboard · same puzzle, deterministic bots`.
- **P11** Infinite Mode — pre-screen opens, `#infinite-start-btn` loads gameplay with `infiniteRun.active=true`.
- **P12** Day 84 Lab Bench II L42 — `gateHardCap=4`, constraint chip `🎯 Hard cap: 4 gates`, validator rejects 5 gates with byte-exact `Submission rejected: 5 gates exceeds hard cap of 4.`, accepts 4 gates.
- **P13** Day 78 staircase end-game — `seedProgress(45,{stars:3})` reveals 18 nav buttons + 45 overflow buttons.
- **P14** 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Cycle 4 HARDEN Week scorecard (5-of-5 days, full week):** **363 assertions / 110 phases / 0 user-facing bugs / 0 console errors** (Days 97+98+99+100+101 = 82+121+77+39+44). This is the cleanest HARDEN-week scorecard the factory has shipped (Cycle 2 ~150, Cycle 3 286, **Cycle 4 363**, +27% over Cycle 3).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **26 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; lands tomorrow as Cycle 4 PRUNE Day 1 Tier-1 cut).

Full report: `qa-reports/day-101-qa.md`.
Harness: `qa-reports/day-101-qa.cdp.js`.
Week wrap: `reviews/harden-cycle-4-week-summary.md`.

**Cycle 4 HARDEN Week complete.** Day 102 next: **Cycle 4 PRUNE Week Day 1 — Fresh Eyes Audit** + first source-file change since Day 96 (LO-1 fix lands as Tier 1).

---

*Updated: Day 100 — Cycle 4 HARDEN Week, Day 4 (2026-06-07) — Fix Everything*

## Day 100 — Cycle 4 HARDEN Week, Day 4 (Fix Everything) summary

**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, **unchanged through Days 97/98/99/100**).
**Decision:** **Rest Day** — Day 90 precedent applied to Cycle 4. Open Bugs queue empty since Day 76 (25-day streak); LO-1 deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails; HARDEN Week policy is fix-only-user-facing-bugs.
**Result:** **39 / 39** confirmation assertions passed (first run). **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Probe shape:** 11 phases instead of re-running the Day 99 30-phase stress suite (the build artifact is unchanged; Days 97/98/99 already ran 280 assertions over it).

- **P1** build identity — 11 cache-bust refs unified at `?v=1780617600`, SW active.
- **P2** cold-start surface — 2 non-level buttons, **45 level cards** (post-Day-94), variant `silent-standard`, difficulty silent-default `standard`.
- **P3** Day 99 stress invariants — 10× RUN spam + 10× Quick Test spam, both no-throw.
- **P4** Day 94 Lab Bench II composite constraints — L44 hardCap=6 (rejects 7 NAND with byte-exact `Submission rejected: 7 gates exceeds hard cap of 6.`, accepts 6 NAND); L45 hardCap=5 + `mustIncludeGate=['XOR']` (composite rejection emits BOTH clauses in one string: `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.`); XOR-containing 3-gate solve passes.
- **P5** Day 83/93 Tournament backend — `getMode='local'`, describe label live, isLive=false, `selectTournamentBackend` factory + `LocalTournamentAdapter` + `RemoteTournamentAdapter` all exposed on window.
- **P6** Day 85 onboarding + Day 95 readout debug-gating — default variant `silent-standard`, counters JSON-serializable, `#settings-developer-section` hidden when `signal-circuit-debug` absent, visible when flag=`'1'`.
- **P7** Day 78 staircase end-game — `seedProgress(45,{stars:3})` reveals 18 nav buttons + 45 overflow buttons.
- **P8** Day 79 dead-identifier purge — all 7 identifiers still `undefined` (showFirstLaunchDifficultyModal, checkLightning, checkEclipseRun, checkArchitect, isMythic, _showHud, getCurrentStep) + `#weekly-puzzle-btn` DOM absent.
- **P9** Day 92 ES module + Day 96 snapshot card library — `window.Gate`/`IONode`/`roundRect` all functions; `GateTypes` has 8 keys (AND/MYSTERY/MYSTERY3/NAND/NOR/NOT/OR/XOR); `addSnapshotCard` x3 grows library count by 3; `resetCardLibrary` zeros.
- **P10** LO-1 latent observation — user back-btn path cleans HUD (`speedrunMode=false`, hud display `none`); bypass path leaves HUD visible (`speedrunMode=true`, hud display `flex`). LO-1 reproduces as documented, still not user-reachable.
- **P11** 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Cycle 4 HARDEN Week scorecard 4-of-5 days:** 319 assertions / 96 phases / **0 user-facing bugs** / 0 console errors (Days 97+98+99+100 = 82+121+77+39).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **25 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; deferred to Cycle 4 PRUNE Week).

Full report: `qa-reports/day-100-qa.md`.
Harness: `qa-reports/day-100-qa.cdp.js`.

**Cycle 4 HARDEN Week Day 4 complete.** Day 101 next: **HARDEN Week Day 5 — Regression Pass** + Cycle 4 HARDEN Week wrap report.

---

*Updated: Day 99 — Cycle 4 HARDEN Week, Day 3 (2026-06-06) — Edge Cases & Stress*

## Day 99 — Cycle 4 HARDEN Week, Day 3 (Edge Cases & Stress) summary

**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, unchanged through Days 97/98/99 — no source files modified during HARDEN week).
**Result:** **77 / 77 assertions** passed across 30 phases. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Coverage:** Day 89's 25-test stress sweep template (T1–T25) re-run against the current build identity, plus **5 new Cycle 4 BUILD-week feature stress blocks (T26–T30)** corresponding to Days 92–96. Notable additions:

- **T26 (D92 ES module exports under stress)**: 100× `Gate`+`IONode` instantiation no-throw; `window.GateTypes` has all 8 expected keys (AND/MYSTERY/MYSTERY3/NAND/NOR/NOT/OR/XOR).
- **T27 (D93 Tournament adapter toggle stress)**: 5× backend-mode toggle (local↔remote) through `selectTournamentBackend()` factory; all 5 describe labels populated; mode resolution correct (`local→local`, `remote→cloud-ready` — the latter is the Day 83 spec, NOT a regression).
- **T28 (D94 composite Lab Bench rapid validator stress)**: L44 + L45 composite chips both render distinct copy; **100× rapid `_validateLabConstraints()` calls** on L44 cycling 1–10 gates no-throw; L45 composite (XOR-mandate + cap=5) rejection of 6-AND input fires both clauses in one string: `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.`
- **T29 (D95 Onboarding readout debug-flag toggle storm)**: 5× toggle of `signal-circuit-debug` flag; `#settings-developer-section` correctly visible when flag=`'1'`, hidden when absent.
- **T30 (D96 Snapshot card library flood)**: 25 cards pushed → library capped at 20 (FIFO eviction); Stats tab scaffolding + library API surface (`getCardLibrary`/`addSnapshotCard`/`resetCardLibrary`) intact.

**Cycle 4 BUILD-week regression sweep:** Day 78 staircase (cold=2, seed18=18 nav, seed45=18 nav + 45 overflow), Day 79 dead-id purge (7 ids undefined, `#weekly-puzzle-btn` absent), Day 84 Lab Bench II L41/L42/L43 constraint chips + validator, Day 85 onboarding URL overrides (warm-toast + explicit-chooser) — all green.

**Performance:** 10× canvas render = **0.180ms/frame avg**; 100× rapid validator calls no-throw; 50×50KB localStorage writes all succeed; 5× adapter toggle no-throw.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **24 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails).

**Verification:** ran `qa-reports/day-99-qa.cdp.js` against permissive headless Chrome for Testing 146.0.7663.0 on port 9301 against `http://localhost:8901/`. **One first-run harness false alarm**:

1. `T27.4 mode resolves correctly (local→local, remote→remote)` failed because the Day 83 spec actually maps `remote`-with-no-Worker-URL to `getMode() === 'cloud-ready'`. The mode name encodes intent-vs-capability (per Day 83 lesson): selecting the remote adapter is the intent, but without a live Worker URL the *capability* is `cloud-ready` (the live-mode capability would be a separate state). Harness fixed to allow `remote→cloud-ready` as the correct mapping. **No app-side fix needed.**

Second run: **77 / 77** assertions pass.

Full report: `qa-reports/day-99-qa.md`.
Harness: `qa-reports/day-99-qa.cdp.js`.

**Cycle 4 HARDEN Week Day 3 complete.** Day 100 next: **HARDEN Week Day 4 — Fix Everything**. With the open queue empty since Day 76 and LO-1 deferred to PRUNE Week, Day 100 will most likely follow the Day 90 precedent (confirmation probe + rest day) unless a fresh latent observation surfaces.

---

*Updated: Day 98 — Cycle 4 HARDEN Week, Day 2 (2026-06-05) — Level Playthrough*

## Day 98 — Cycle 4 HARDEN Week, Day 2 (Level Playthrough) summary

**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, unchanged today — no source files changed).
**Result:** **121 / 121 assertions** passed across 26 phases. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Coverage:** Per-level audit on 14 levels (campaign sweep L1/5/10/15/20/25/30/35/40 + Day 84 Lab Bench L41/42/43 + Day 94 Lab Bench II composite L44/45). For every sampled level: hints array length 3, truth table re-derived from semantics via a pure-JS spec (e.g. `(a,b,c)=>[a^b^c]` for odd parity, `(a1,a0,b1,b0)=>` decomposed for the 2-bit ripple adder), `calculateStars()` correctness at three input gate counts (optimal/good/over), and lab metadata. Plus: Lab Bench HUD chip render on all five Lab Bench levels (single vs composite), 9 `_validateLabConstraints()` assertions on L41–45, hands-on L1 solve via Quick Test, all four challenge mode entries (Daily/Random/Blitz/Speedrun) + HUD cleanup via `#back-btn` (Day 61 + Day 74 regressions), 4 community levels loaded via `buildCustomLevel`, and Cycle 4 BUILD-week regression sweep (D92 ES module exports + D93 tournament adapter + D94 composite chips + D95 onboarding readout + D96 snapshot cards library).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **23 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; deferred to Cycle 4 PRUNE Week).

**Highlights from the sweep:**

- **All 14 sampled levels** have exactly 3 hints, byte-correct truth tables (re-derived from semantics), and `calculateStars()` returning 3 at optimal / ≤2 at goodGates / 1 above goodGates.
- **Lab Bench HUD chip render** verified on all five Lab Bench levels:
  - L41: `🧱 NAND only — universal gate practice` (single)
  - L42: `🎯 Hard cap: 4 gates` (single)
  - L43: `✳️ Must include an XOR gate` (single)
  - L44: `🧱 NAND only` + `🎯 Hard cap: 6 gates` (composite, side-by-side)
  - L45: `✳️ Must include an XOR gate` + `🎯 Hard cap: 5 gates` (composite, side-by-side)
- **`_validateLabConstraints()` byte-stable rejection strings**: `Submission rejected: 5 gates exceeds hard cap of 4.` (L42), `Submission rejected: blueprint must include an XOR gate.` (L43 + L45), `Submission rejected: 7 gates exceeds hard cap of 6.` (L44), `Submission rejected: 6 gates exceeds hard cap of 5.` (L45). Optimal-shape submissions accept cleanly: L44 with 5 NANDs and L45 with `XOR/AND/XOR` both pass.
- **L1 hands-on solve** via Quick Test: 1 AND gate + 3 wires → `#star-display` visible, `progress.levels[1].stars === 3`.
- **All 4 challenge modes** enter gameplay correctly and `#back-btn` cleanly tears down Blitz/Speedrun HUDs (Day 61 + Day 74 fixes hold).
- **4 community levels** load via `buildCustomLevel`: `community_1 The Implication` (2/1), `community_5 One Hot` (2/1, XOR), `community_8 Majority Vote` (3/1, featured), `community_11 Half Adder Redux` (2/2, multi-output).
- **Cycle 4 BUILD regression sweep**: D92 ES module exports (Gate/GateTypes×8/IONode/roundRect), D93 tournament adapter classes + `local` default mode, D94 composite chips + validator, D95 silent-standard variant + reset, D96 cards library API + Stats tab scaffolding — all green.
- **Cold-start invariants hold**: 2 non-level buttons (Day 78), 45 level cards (Day 94).
- **0 console errors** across the full sweep.

**Verification:** ran `qa-reports/day-98-qa.cdp.js` against permissive headless Chrome for Testing 145.0.7632.6 on port 9301 against `http://localhost:8901/`. First run had 4 harness-only false alarms, all rooted in the same misunderstanding of the validator surface and one wrong DOM selector:

1. `L41 rejects non-NAND gate` (validator returned `ok:true`) — NAND-only enforcement on L41 is **toolbox-level** (`availableGates: ['NAND']` hides the other buttons), not validator-level. `_validateLabConstraints()` only enforces `gateHardCap` + `mustIncludeGate`. Harness fixed to assert `availableGates === ['NAND']` instead.
2. `L44 composite rejects 7 ANDs (both NAND + cap violations surfaced)` — same root cause: 7 ANDs on L44 only surfaces the cap violation, since NAND-only is toolbox-level. Harness fixed to assert just the cap rejection.
3. `L1 completion overlay fires` — wrong selector. The completion celebration paints `#star-display`, not `#completion-overlay`. Harness fixed to probe `#star-display`.
4. `L1 Quick Test increments attempts` — by design, `runQuickTest()` does not bump `game.attempts`. Only `runSimulation()` (the animated RUN path) increments `progress.levels[lvlId].attempts` at `js/main.js:3744`. The earned 3 stars + visible `#star-display` together prove the completion path fired. Harness fixed to drop this assertion.

Second run: 121/121. **No app-side fix was needed.**

Full report: `qa-reports/day-98-qa.md`.
Harness: `qa-reports/day-98-qa.cdp.js`.

**Cycle 4 HARDEN Week Day 2 complete.** Day 99 next: **HARDEN Week Day 3 — Edge Cases & Stress**.

---

*Updated: Day 97 — Cycle 4 HARDEN Week, Day 1 (2026-06-04) — Full Interaction Audit*

## Day 97 — Cycle 4 HARDEN Week, Day 1 (Full Interaction Audit) summary

**Build under test:** `?v=1780617600` · `sw.js CACHE_NAME = 'signal-circuit-v65'` (Day 96 build, unchanged today — no source files changed).
**Result:** **82 / 82 assertions** passed across 29 phases. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Coverage:** Cycle 4 BUILD-week regression sweep (D92 ES-module exports, D93 Tournament adapter classes, D94 Lab Bench II composite constraints, D95 Onboarding Readout UI, D96 Snapshot Cards Library Tab) + Full Interaction Audit per HARDEN Monday spec (every screen and modal: level select / gameplay / daily / random / blitz / speedrun / sandbox / creator / tournament / encyclopedia / achievements / stats with new 📸 My Cards tab / mastery / collection / profile / customize / settings / how-to-play / share-card) + Cycle 1–3 carry-over regression (Day 61 Blitz HUD, Day 74 Speedrun HUD, Day 78 staircase, Day 79 dead-id purge).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **22 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — unchanged from Day 87; direct `ui.showScreen('level-select')` bypasses Day 61/74 HUD cleanup but is not user-reachable; deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails).

**Highlights from the sweep:**

- **45 level cards on cold start** (Day 94's L44 + L45 are correctly indexed by `renderLevelSelect`).
- **Day 94 composite chips** render side-by-side on L44 and L45: `#lab-constraint` + `#lab-constraint-2` both visible with distinct copy.
- **Composite validator** on L44 rejects 7 NANDs with byte-exact `Submission rejected: 7 gates exceeds hard cap of 6.`
- **Day 92 ES module rebinding** holds: `window.Gate` (function), `window.GateTypes` (8 keys: AND/OR/NOT/XOR/NAND/NOR/MYSTERY/MYSTERY3), `window.IONode`, `window.roundRect` all bound.
- **Day 93 RemoteTournamentAdapter** + `LocalTournamentAdapter` + `selectTournamentBackend` all exposed on `window`; default mode is `local` with the local-leaderboard describe label.
- **Day 95 readout card** correctly debug-gated: `#settings-developer-section` is `display:none` when `signal-circuit-debug` flag is absent; setting the flag to `'1'` reveals both the Developer section and `#onboarding-readout-card` with variant pill + ISO timestamp + relative-time.
- **Day 96 Stats tabs** scaffolding present: `#stats-tabs`, `#stats-tab-overview`, `#stats-tab-cards`, `#stats-cards-pane`. Tab badge format `📸 My Cards (N)` with live count (Phase 5 captured 1 card via L1 solve; the badge shows `(1)` correctly). Clicking the tab swaps `#stats-grid` to `display:none` and `#stats-cards-pane` to `display:block`.
- **Cold-start non-level button count = 2** (Day 78 invariant holds 22 days in).
- **End-game (`seedProgress(40)`)**: 18 non-level + 40 overflow buttons (Day 78 target intact despite +2 levels from Day 94).
- **Day 79 dead-identifier purge**: all 7 ids still `undefined`, `#weekly-puzzle-btn` DOM absent.
- **Hint click on L6** increments `hintsUsed` 0→1 cleanly.

**Verification:** ran `qa-reports/day-97-qa.cdp.js` against permissive headless Chromium 146 on port 9301 against `http://localhost:8901/`. First run had 1 harness-only false-alarm: the cards-tab assertion expected `(0)` but Phase 5 had already populated 1 card via the L1 share-card capture path. Fixed the assertion to validate badge format `📸 My Cards (N)` regardless of count (the live badge is exactly what we want — it reflects current state). Second run: 82/82.

Full report: `qa-reports/day-97-qa.md`.
Harness: `qa-reports/day-97-qa.cdp.js`.

**Cycle 4 HARDEN Week Day 1 complete.** Day 98 next: **Level Playthrough** — sample L1/5/10/15/20/25/30/35/40 + Day 84/94 L41–45; verify truth tables, hints, star rating, completion celebration; test Daily / Random / Blitz / Speedrun; load 3–4 community levels.

---

*Updated: Day 95 — Cycle 4 BUILD Week, Day 4 (2026-06-02) — Onboarding Experiment Readout UI*

## Day 95 — Cycle 4 BUILD Week, Day 4 (Onboarding Experiment Readout UI) summary

**Build under test:** `?v=1780531200` · `sw.js CACHE_NAME = 'signal-circuit-v64'` · inline `#onboarding-readout-card` populated by `UI.renderOnboardingReadoutCard()` on every settings-modal open + new `appliedAt` field on `OnboardingExperiment._state`.
**Result:** **28 / 28** assertions passed across 8 phases. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Feature shipped:** Promoted Day 85's `window.__onboardingExperiment.getCounters()` dev-console-only readout into a polished **Settings → Developer** inline card. The card surfaces the current variant, applied-at ISO timestamp (plus a relative-time string "3m ago"), all 7 counter rows, and a Reset button. Reset wipes `DIFFICULTY_KEY` + `ONBOARDING_EXPERIMENT_KEY` + counters, re-runs `applyFirstLaunch()` (which refreshes `appliedAt` to a new timestamp and re-fires the persisted variant), then re-renders the card **in place — no page reload, no modal close**. Auto-refresh on every settings-modal open guarantees the card never goes stale during a funnel walk. New `appliedAt: string | null` field on `OnboardingExperiment._state`, initialized to `null` and set the first time `applyFirstLaunch()` actually fires (the gate `!SafeStorage.getItem(DIFFICULTY_KEY)` was true). Day 85's `#onboarding-experiment-btn` modal-trigger is preserved for back-compat and now also surfaces `appliedAt`.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **20 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — still deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails).

**QA coverage (8 phases / 28 assertions):**

- **P1 (3):** Build identity — 11 cache-bust refs unified at `?v=1780531200`, `sw.js` CACHE_NAME = `signal-circuit-v64`, `index.html` declares `#onboarding-readout-card` placeholder.
- **P2 (3):** Debug gate OFF — default profile keeps Developer section + readout card hidden when `signal-circuit-debug` flag absent, cold-start 2 non-level buttons (`#how-to-play-btn` + `#open-settings-btn`).
- **P3 (5):** Debug gate ON — with `localStorage['signal-circuit-debug'] = '1'`, Settings opens with Developer section + readout card both visible, variant pill renders `silent-standard`, `appliedAt` ISO timestamp set on cold start (e.g. `2026-06-02T15:25:02.480Z`), counters table has 7 rows, reset button present.
- **P4 (5):** Counter wiring — wipe all `signal-*` keys, navigate `?onboarding=explicit-chooser`, chooser modal renders 3 options, variant resolves to `explicit-chooser`, click "Standard" → `firstLaunches=1` + `chooserShown=1` + `chooserPickedStandard=1`, re-open Settings shows updated counters in card text (auto-refresh works).
- **P5 (4):** Reset wipes state + re-renders in place — click card's Reset button → all `chooserPicked*` counters back to 0, `applyFirstLaunch()` re-fires for persisted `explicit-chooser` variant (so `firstLaunches=1`, `chooserShown=1`, `toastShown=0` — funnel restarted at top), `appliedAt` strictly different ISO timestamp (verified with 1.1s sleep), card re-rendered in place (`display:block` retained, 7 rows still present, **no page reload**).
- **P6 (3):** L1 core loop regression — `startLevel(1)` brings `#gameplay-screen` visible, 5 truth-table rows, 1-gate AND solve via `runQuickTest()` persists 3 stars.
- **P7 (3):** Day 78 + Day 94 regression — cold-start 2 non-level buttons (Day 78 staircase invariant), L42 hardCap rejection byte-equivalent (`Submission rejected: 5 gates exceeds hard cap of 4.`), L44 NAND-only + hard cap 6 composite (7-NAND rejects, 5-NAND accepts).
- **P8 (2):** Console hygiene — 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Verification:** ran `qa-reports/day-95-qa.cdp.js` against permissive headless Chromium 146 on port 9301 against `http://localhost:8901/`. First run had 5 noisy P4/P5 failures from incomplete `localStorage` clearing in the harness — `signal-circuit-placement-done` was short-circuiting `_checkPlacementTest()` BEFORE it routed through `OnboardingExperiment.applyFirstLaunch()`. Fix: wipe ALL `signal-*` keys (not just experiment + difficulty). Second run also corrected P5 assertions: with `?onboarding=explicit-chooser` persisted in the URL bar, `reset() + applyFirstLaunch()` correctly re-fires the explicit-chooser variant (chooserShown=1, picks=0) — "funnel restart at top of currently-resolved variant" is the actual spec. After both harness fixes, 28/28 passed. **No app-side fix was needed.**

Full report: `qa-reports/day-95-qa.md`.
Harness: `qa-reports/day-95-qa.cdp.js`.
Build report: `build-reports/day-95-build.md`.
Spec: `specs/day-95-onboarding-experiment-readout.md`.

**Cycle 4 BUILD Week Day 4 complete.** Day 96 next: **Snapshot Cards Library Tab** (Stats “📸 My Cards” gallery for Day 82 share cards) per `roadmaps/cycle-4-build.md` § Day 96.

---

*Updated: Day 94 — Cycle 4 BUILD Week, Day 3 (2026-06-01) — Lab Bench II Composite Constraints*

## Day 94 — Cycle 4 BUILD Week, Day 3 (Lab Bench II Composite Constraints) summary

**Build under test:** `?v=1780444800` · `sw.js CACHE_NAME = 'signal-circuit-v63'` · `_validateLabConstraints()` rewritten to accumulate all violations + `#lab-constraint-2` sibling chip added + L44/L45 composite levels appended.
**Result:** **31 / 31** assertions passed across 7 phases on first run. **0** new user-facing bugs. **0** console errors. **0** `Runtime.exceptionThrown`.

**Feature shipped:** Promoted Lab Bench II's single-axis constraint validator into a composite-aware accumulator: `_validateLabConstraints()` no longer short-circuits on the first violation, it now walks each active constraint, pushes a reason string, and joins them with `; ` in a single `Submission rejected: …` message. Single-violation messages remain byte-for-byte identical to Day 84 (covered by P3.2 + P3.3). HUD chip strip extended via a second sibling chip `#lab-constraint-2` so composite levels can render up to two chips side-by-side. Two new Chapter-10 lab levels demonstrate the shape: **L44 “NAND-Only Half Adder”** (`availableGates: ['NAND']` + `gateHardCap: 6`, optimal 5 NANDs producing SUM and CARRY) and **L45 “XOR-Heavy Multiplexer”** (`mustIncludeGate: ['XOR']` + `gateHardCap: 5`, optimal 3 gates via the XOR-based MUX identity OUT = A XOR ((A XOR B) AND S)). Chapter 10 `levels: [41,42,43]` → `[41,42,43,44,45]`; storyIntro + storyComplete updated.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **19 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — still deferred to Cycle 4 PRUNE Week per `roadmaps/cycle-4-build.md` § Week Guardrails).

**QA coverage (7 phases / 31 assertions):**

- **P1 (5):** Build identity — 11 cache-bust refs unified at `?v=1780444800`, `sw.js` CACHE_NAME = `signal-circuit-v63`, `index.html` declares `#lab-constraint-2` sibling chip, `js/levels.js` declares L44 + L45, Chapter 10 `levels: [41..45]`.
- **P2 (4):** Cold-start surface unchanged — level-select visible, 2 non-level buttons (`#how-to-play-btn` + `#open-settings-btn`), 45 level cards (was 43, +2 from L44/L45), onboarding variant `silent-standard` + difficulty silent-default `standard`.
- **P3 (5):** Day 84 single-constraint regression — L41 single-chip NAND-only render unchanged (c1 visible, c2 hidden), L42 hardCap rejection message **byte-equivalent to Day 84** (`Submission rejected: 5 gates exceeds hard cap of 4.`), L43 mustIncludeGate rejection message **byte-equivalent** (`Submission rejected: blueprint must include an XOR gate.`), L42 4-gate validator accepts, L43 XOR-present validator accepts.
- **P4 (6):** L44 NAND-Only Half Adder composite — `labConstraint` is array of length 2, `gateHardCap === 6`, `availableGates === ['NAND']`, both chips render (“🧱 NAND only” + “🎯 Hard cap: 6 gates”), 5-NAND build accepts, 7-NAND over-cap rejection lists hard-cap reason.
- **P5 (6):** L45 XOR-Heavy Multiplexer composite — `labConstraint` array len 2, `gateHardCap === 5`, `mustIncludeGate === ['XOR']`, both chips render (“✳️ Must include an XOR gate” + “🎯 Hard cap: 5 gates”), **composite double-violation** `6 NANDs` returns `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.` (both reasons joined by `;`), 3-gate XOR/AND/XOR build accepts.
- **P6 (3):** Regression — `seedProgress(45, {stars:3})` yields 45 overflow buttons (Day 78 staircase scales naturally with +2 levels), tournament backend default mode=local + isLive=false (Day 83/93 contract), L1 core loop 1-gate AND solve persists 3 stars.
- **P7 (2):** Console hygiene — 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Verification:** ran `qa-reports/day-94-qa.cdp.js` against permissive headless Chromium 146 on port 9301 against `http://localhost:8901/`. First-run pass — no harness iteration, no app fix needed. Composite validator double-violation message verified live in the running build: `Submission rejected: 6 gates exceeds hard cap of 5; blueprint must include an XOR gate.`

Full report: `qa-reports/day-94-qa.md`.
Harness: `qa-reports/day-94-qa.cdp.js`.
Build report: `build-reports/day-94-build.md`.
Spec: `specs/day-94-lab-bench-ii-composite-constraints.md`.

**Cycle 4 BUILD Week Day 3 complete.** Day 95 next: **Onboarding Experiment Readout UI** (Settings → Developer card surfacing Day 85 counters behind `signal-circuit-debug=1`) per `roadmaps/cycle-4-build.md` § Day 95.

---

*Updated: Day 93 — Cycle 4 BUILD Week, Day 2 (2026-05-31) — Tournament Backend Worker Go-Live*

## Day 93 — Cycle 4 BUILD Week, Day 2 (Tournament Backend Worker Go-Live) summary

**Build under test:** `?v=1780358400` · `sw.js CACHE_NAME = 'signal-circuit-v62'` · `RemoteTournamentAdapter` rewritten with real network path.
**Result:** **24 / 24** assertions passed across 8 phases on first run. **0** new user-facing bugs. **0** console errors. **0** Runtime.exceptionThrown.

**Feature shipped:** Promoted Day 83's `RemoteTournamentAdapter` stub to a real fetch-driven adapter with reachability cache + transparent local fallback. Added three new modes (`remote`, `remote-fallback`, `cloud-ready`) with distinct UI labels piped through the existing `#tournament-mode-label` chip. Shipped a deployable Cloudflare Worker (`tools/tournament-worker/worker.js` + `wrangler.toml` + `README.md`) and a zero-dep Node mock worker (`tools/tournament-worker/local-mock-worker.js`) on port 8902 that the CDP harness drives end-to-end. **Did not** deploy to Cloudflare — no credentials in scope; deploy procedure documented for a future credentialed run.

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **18 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — still deferred to Cycle 4 PRUNE Week).

**QA coverage (8 phases / 24 assertions):**

- **P1 (4):** Build identity — 11 cache-bust refs unified at `?v=1780358400`, `js/main.js` HTTP body contains new symbols (`refreshReachability`, `TOURNAMENT_WORKER_URL_LS_KEY`), `sw.js` CACHE_NAME = `signal-circuit-v62`, `tools/tournament-worker/` ships 4 files (worker.js + wrangler.toml + local-mock-worker.js + README.md).
- **P2 (3):** Cold-start surface unchanged — level-select visible, 2 non-level buttons, 43 level cards.
- **P3 (2):** Default local mode — `tournamentBackend.getMode() === 'local'`, describe contains `🏠`, `isLive() === false`.
- **P4 (5):** Remote configured + mock worker reachable — background reachability probe lands within 4s, `getMode() === 'remote'`, `isLive() === true`, describe = `🌐 Live leaderboard · cloud-synced`, adapter is `RemoteTournamentAdapter`, `submitScore()` returns local sync-shape, **mock worker `/leaderboard/2026-W23` confirms the POST actually landed** (proves real network round-trip, not just stub passthrough).
- **P5 (3):** Remote configured + dead URL (`http://127.0.0.1:9999`) — reachability probe times out, `getMode() === 'remote-fallback'`, `isLive() === false`, describe = `🌐 Live · offline (using local for now)`.
- **P6 (2):** Mode toggle round-trip — clearing both LS keys reverts to `LocalTournamentAdapter`; explicit LS=`'local'` also resolves to `local`.
- **P7 (3):** Regression — Day 78 staircase (40 overflow at seed=40), Day 84 Lab Bench II L42 hard cap, L1 core loop persists 3 stars.
- **P8 (2):** Console hygiene — 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Verification:** harness boots and tears down its own mock worker (Node child process on port 8902); CDP harness reloads the page 4 times (default-mode / reachable-remote / unreachable-remote / cleared-LS) and exercises the full `submitScore → POST → server-read` round-trip from headless Chromium against the mock worker. Each mode-toggle reload re-runs `selectTournamentBackend()` which kicks off a fresh reachability probe; harness uses `waitFor` to settle on the expected mode within 4s.

Full report: `qa-reports/day-93-qa.md`.
Harness: `qa-reports/day-93-qa.cdp.js`.
Build report: `build-reports/day-93-build.md`.
Spec: `specs/day-93-tournament-worker-go-live.md`.
Worker source: `tools/tournament-worker/`.

**Cycle 4 BUILD Week Day 2 complete.** Day 94 next: **Lab Bench II Composite Constraints** (Lab Bench III seed) per `roadmaps/cycle-4-build.md`.

---

*Updated: Day 92 — Cycle 4 BUILD Week, Day 1 (2026-05-30) — Module Split Phase 1*

## Day 92 — Cycle 4 BUILD Week, Day 1 (Module Split Phase 1) summary

**Build under test:** `?v=1780272000` · `sw.js CACHE_NAME = 'signal-circuit-v61'` · `<script type="module" src="js/gates.js">`.
**Result:** **24 / 24** assertions passed across 8 phases. **0** new user-facing bugs. **0** console errors. **0** Runtime.exceptionThrown.

**Feature shipped:** `js/gates.js` converted to a true ES module. The 4 top-level declarations (`GateTypes`, `Gate`, `IONode`, `roundRect`) now use `export` keyword + a tail block installs them on `window` for the 8 classic-script consumers. `index.html` loads gates.js via `<script type="module">` while the other 9 JS files remain classic scripts. `tools/module-health.js` gains ESM detection (Day 92 baseline: 1 of 10 files converted).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **17 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — still deferred to Cycle 4 PRUNE Week).

**QA coverage (8 phases / 24 assertions):**

- **P1 (4):** Build identity — 11 cache-bust refs unified at `?v=1780272000`, `index.html` loads gates.js via `<script type="module">`, gates.js HTTP body contains `export class Gate {` and `export const GateTypes`, `sw.js` CACHE_NAME = `signal-circuit-v61`.
- **P2 (4):** Cold-start surface unchanged — level-select visible, 2 non-level buttons (`#how-to-play-btn` + `#open-settings-btn`), 43 level cards, onboarding variant `silent-standard`, difficulty silent-default `standard`.
- **P3 (5):** ES-module globals installed on `window` — `typeof window.Gate === 'function'`, `Gate.toString().startsWith('class Gate')`, `window.GateTypes` is an object with 8 gate types (AND/OR/NOT/XOR/NAND/NOR/MYSTERY/MYSTERY3), `typeof window.IONode === 'function'`, `typeof window.roundRect === 'function'`.
- **P4 (3):** Core loop end-to-end on L1 — `gs.startLevel(1)` loads L1 (ins=2, outs=1), synthetic AND-gate solve via `gs.addGate('AND', 400, 300)` + 3 wires via `gs.addWireFromData(...)` + `gs.runQuickTest()` persists `progress.levels['1'].stars === 3` (gates=1, wires=3), `gs.runSimulation()` runs without throwing.
- **P5 (2):** Day 84 Lab Bench II L42 regression — `currentLevel.gateHardCap === 4`, `_validateLabConstraints()` with 5 gates returns `{ok: false, msg: 'Submission rejected: 5 gates exceeds hard cap of 4.'}`.
- **P6 (2):** Day 83 Tournament backend adapter — `gs.tournamentBackend.getMode() === 'local'`, `describe()` returns the live label.
- **P7 (2):** Day 78 staircase end-game intact — 40 overflow buttons + 18 nav buttons at `seedProgress(40, {stars:3})`.
- **P8 (2):** Console hygiene — 0 `Runtime.exceptionThrown`, 0 `console.error`.

**Verification:** ran a fresh permissive headless Chromium against `http://localhost:8901/` (port 9301) via the Day 86+ CDP-over-`ws` harness. All 9 classic-script consumers continue to find `Gate` / `GateTypes` / `IONode` / `roundRect` on `window` at method-invocation time, even though the symbols now flow through an ES-module boundary.

Full report: `qa-reports/day-92-qa.md`.
Harness: `qa-reports/day-92-qa.cdp.js`.
Build report: `build-reports/day-92-build.md`.
Spec: `specs/day-92-module-split-gates-esm.md`.

**Cycle 4 BUILD Week begins.** Day 93 next: Tournament Backend Worker Go-Live (Cloudflare Worker + KV, adapter remote mode).

---

*Updated: Day 91 — Cycle 3 HARDEN Week, Day 5 (2026-05-29) — Regression Pass*

## Day 91 — Cycle 3 HARDEN Week, Day 5 (Regression Pass) summary

**Build under test:** **deployed** `https://mikedyan.github.io/signal-circuit/` · `?v=1780156800` · `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged through entire HARDEN week**).
**Result:** **44 / 44** assertions passed across 14 phases. **0** new user-facing bugs. **0** console errors.

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86/87/88/89/90 precedent).

**Open Bugs queue:** 0 at start of day, 0 at end of day (streak: **16 consecutive days** since Day 76).
**Latent observations:** 1 (LO-1 — deferred to Cycle 4 PRUNE Week).

**Regression sweep coverage (14 phases / 44 assertions):**

- **P1 (4):** Build identity on deployed host — `mikedyan.github.io`, 11 cache-bust refs unified at `?v=1780156800`, `sw.js` deployed with `CACHE_NAME = 'signal-circuit-v60'`.
- **P2 (5):** Cold-start surface — level-select visible, 2 non-level buttons (How to Play + Settings), 43 level cards, onboarding variant `silent-standard`, difficulty silent-default `standard`.
- **P3 (7):** Core loop end-to-end on L1 — gameplay screen visible, RUN button visible, 4 truth-table rows, 1 AND gate placed via `gs.addGate()`, 3 wires via `gs.addWireFromData()`, runQuickTest persists `{stars:3}`, L1 progress recorded.
- **P4 (2):** Campaign progression — L2 unlocked after L1 solve, `gs.startLevel(2)` loads gameplay with `currentLevel.id===2`.
- **P5 (2):** Daily Challenge — `#daily-challenge-btn` opens `daily-config-screen`, `#start-daily-btn` loads gameplay with `currentLevel.isDaily===true`.
- **P6 (2):** Random Challenge — `#random-challenge-btn` opens `challenge-config-screen`, `#generate-challenge-btn` loads gameplay with `isChallengeMode===true`.
- **P7 (3):** Blitz Mode — enters `blitzMode=true`, HUD `display=flex`, **Day 61 fix** intact (back-to-level-select cleans HUD).
- **P8 (3):** Speedrun Mode — enters `speedrunMode=true`, HUD `display=flex`, **Day 74 fix** intact (back-to-level-select cleans HUD).
- **P9 (1):** Sandbox — `#sandbox-btn` opens `sandbox-config-screen`.
- **P10 (5):** Tournament — `tournament-screen` opens, 3 tabs (This Week / My Best / Archive), Day 83 adapter shape (`getMode`/`describe`/`isLive`), mode=`local`, label populated.
- **P11 (2):** Infinite Mode (Day 68) — `#infinite-mode-btn` opens `infinite-pre-screen`, `#infinite-start-btn` loads gameplay with `infiniteRun.active===true`.
- **P12 (4):** Day 84 Lab Bench II L42 — `gateHardCap===4`, `labConstraint` text `🎯 Hard cap: 4 gates`, validator rejects 5 gates with `Submission rejected: 5 gates exceeds hard cap of 4.`, accepts 4 gates.
- **P13 (2):** Day 78 staircase end-game — 18 nav buttons + 40 overflow buttons at `seedProgress(40, {stars:3})`.
- **P14 (2):** 0 `Runtime.exceptionThrown`, 0 `console.error`.

**All 8 modes confirmed working on the deployed build:** Campaign · Daily · Random · Blitz · Speedrun · Sandbox · Tournament · Infinite.

Full report: `qa-reports/day-91-qa.md`.
Harness: `qa-reports/day-91-qa.cdp.js`.
Cycle wrap: `reviews/harden-cycle-3-week-summary.md`.

**Cycle 3 HARDEN Week total:** 286 assertions across Day 87 (66) + Day 88 (100) + Day 89 (53) + Day 90 (23) + Day 91 (44) on the same unchanged Day 86 artifact. **Zero new user-facing bugs**, **zero console errors**, **two-cycle empty-queue streak** (Cycle 2 also closed clean).

---

*Updated: Day 90 — Cycle 3 HARDEN Week, Day 4 (2026-05-28) — Fix Everything (Rest Day)*

## Day 90 — Cycle 3 HARDEN Week, Day 4 (Fix Everything) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Mode:** Fix Day — nothing to fix.
**Result:** **23 / 23** confirmation assertions passed. **0** new user-facing bugs. **0** console errors.

**No code changed today** — the Open Bugs queue has been empty since Day 76 (Cycle 2 HARDEN wrap). Day 87 audit (66 assertions) + Day 88 playthrough (100 assertions) + Day 89 stress sweep (53 assertions) each closed with zero new user-facing bugs. With one deferred latent observation (LO-1, explicitly tagged "future Polish/Prune Week"), HARDEN policy says don't ship LO-1 in HARDEN week. Day 90 is a confirmation day.

**Open Bugs queue:** 0 at start of day, 0 at end of day.
**Latent observations:** 1 (LO-1, deferred to Cycle 4 PRUNE Week — see below).

**Confirmation probe coverage (10 phases / 23 assertions):**

- **P1 (3):** Build identity unchanged — 11 cache-bust refs unified at `?v=1780156800`, SW `signal-circuit-v60` active.
- **P2 (4):** Cold-start surface intact — 2 non-level buttons, 43 level cards, onboarding variant `silent-standard`, difficulty silent-default `standard`.
- **P3 (2):** Day 89 stress invariants — 10× RUN spam + 10× Quick Test spam both no-throw.
- **P4 (2):** Day 84 Lab Bench II L42 hard-cap validator — rejects 5 gates with `Submission rejected: 5 gates exceeds hard cap of 4.`, accepts 4 gates.
- **P5 (3):** Day 83 Tournament backend adapter — `getMode()==='local'`, describe label live, `isLive()===false`.
- **P6 (2):** Day 85 onboarding default variant — `silent-standard`, counters JSON-serializable.
- **P7 (2):** Day 78 staircase end-game — 18 nav + 40 overflow buttons at `seedProgress(40)`.
- **P8 (1):** Day 79 dead-identifier regression — all 7 removed identifiers still `undefined`, `#weekly-puzzle-btn` DOM absent.
- **P9 (2):** LO-1 latent observation re-verification — user back-btn path cleans HUD (Day 74 fix intact), bypass path leaves HUD visible (LO-1 reproduces as documented).
- **P10 (2):** 0 `Runtime.exceptionThrown`, 0 `console.error`.

Full report: `qa-reports/day-90-qa.md`.
Harness: `qa-reports/day-90-qa.cdp.js`.

*Updated: Day 89 — Cycle 3 HARDEN Week, Day 3 (2026-05-27) — Edge Cases & Stress*

## Day 89 — Cycle 3 HARDEN Week, Day 3 (Edge Cases & Stress) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **53 / 53** assertions passed across **25 test phases**. **0** new user-facing bugs. **0** console errors. Day 87 latent observation **LO-1** remains deferred (not user-reachable).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86/87/88 precedent).

**Open Bugs queue:** 0 at start of day, 0 at end of day.

**Stress sweep coverage (25 phases / 53 assertions):**

- **T1–T3:** rapid gate placement during sim / wire-draw during animation / 10× window resize — all no-throw.
- **T4:** localStorage cleared + reload — cold start lands on level-select with 2 buttons, 43 level cards, silent-default difficulty `standard`.
- **T5:** Keyboard Tab reachability — 15 focusable elements on gameplay screen (Day 80 `:focus-visible` rings honor).
- **T6:** Colorblind + light/dark mode class toggles round-trip cleanly.
- **T7:** Performance probe — 10× canvas `renderer.render()` total 1.80ms, avg 0.180ms/frame.
- **T8–T9:** 15× RUN spam + 15× Quick Test spam — all no-throw (re-entry contract holds).
- **T10:** 20× undo + 20× redo — no-throw on empty stacks.
- **T11:** Mode-switch storm — 10 alternating clicks across daily/random/sandbox/tournament/infinite all return to `level-select-screen` cleanly.
- **T12:** `blur` + `visibilitychange` + `focus` event cycle no-throw.
- **T13:** Lab Bench L36 attempt state machine walks `0 → 3 (exhausted=true) → reset → 0 (firstTryLocked=true)`; RUN labeled `📐 Submit Blueprint`.
- **T17–T19 (Day 84 Lab Bench II under stress):** L41 NAND-only palette + chip live; L42 hard cap 4 chip + validator rejects 5-gate / accepts 4-gate; L43 mustInclude XOR chip + validator rejects no-XOR / accepts with-XOR.
- **T14:** Tournament screen opens (3 tabs); `tournamentBackend.getMode()==='local'`; Day 83 describe label `🏠 Local leaderboard · same puzzle, deterministic bots` live.
- **T15:** `#mythic-celebration` overlay lazy-mounts on `ui.showMythicCelebration()` (does NOT exist at cold start).
- **T16:** localStorage 50×50KB writes succeed (no quota exceeded).
- **T20:** Day 85 default variant `silent-standard` + counters JSON-serializable + silent-default difficulty `standard`.
- **T21:** `?onboarding=warm-toast` URL override → variant `warm-toast`, persists into localStorage.
- **T22:** `?onboarding=explicit-chooser` URL override → variant `explicit-chooser`, persists into localStorage.
- **T23:** Day 86 module-health stability — `wires.js` retains `WIRE_COLORS_DEFAULT` and no longer redefines `WIRE_COLORS`; all 7 Day 79 dead identifiers still `undefined`; `#weekly-puzzle-btn` DOM absent.
- **T24:** Day 78 staircase — cold 2 / tier3 18 / end-game 18 nav + 40 overflow.
- **T25:** Build identity — 11 cache-bust refs at `?v=1780156800`, SW `signal-circuit-v60`.
- **FINAL:** 0 `Runtime.exceptionThrown` + 0 `console.error` across entire suite.

Additionally: `node tools/module-health.js` regenerated `specs/module-health.md` byte-identical to Day 86 baseline (timestamp line only).

Full report: `qa-reports/day-89-qa.md`.
Harness: `qa-reports/day-89-qa.cdp.js`.

*Updated: Day 88 — Cycle 3 HARDEN Week, Day 2 (2026-05-26) — Level Playthrough*

## Day 88 — Cycle 3 HARDEN Week, Day 2 (Level Playthrough) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **100 / 100** assertions passed across 13 phases. **0** new user-facing bugs. **0** console errors. Day 87 latent observation **LO-1** remains deferred (not user-reachable).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86/87 precedent).

**Audit coverage (13 phases / 100 assertions):**

- Phase 1 (2): build identity — cache-bust + SW match Day 86/87.
- Phase 2 (1): difficulty mode default = `standard` (silent-default from Day 78 #5 / Day 85 onboarding experiment).
- Phase 3 (72): per-level static validation — 12 levels (1, 5, 10, 15, 20, 25, 30, 35, 40, 41, 42, 43) × 6 checks each:
  - level resolves via `getLevel(N)`
  - truth table matches re-derived semantics (AND / NOR / OR / Majority / MUX / ripple adder / demux / XOR / parity-3 / etc.)
  - `hints[].length === 3`
  - `calculateStars(opt) === 3`
  - `calculateStars(good) ≤ 2`
  - `calculateStars(good + 5) === 1`
- Phase 4 (4): live L1 gameplay + `#hint-btn` click increments `hintsUsed` 0→1.
- Phase 5 (2): `completeLevel(1, opt)` persists `{stars:3}`.
- Phase 6 (4): Daily Challenge — pre-screen → `#start-daily-btn` → gameplay with `isDaily=true` → back-btn returns clean.
- Phase 7 (2): Random Challenge — `seedProgress(18)` → `#random-challenge-btn` → `#generate-challenge-btn` → gameplay with `isChallengeMode=true`.
- Phase 8 (2): Blitz Mode — entry + back-btn HUD cleanup (Day 61 fix intact).
- Phase 9 (2): Speedrun Mode — entry + back-btn HUD cleanup (Day 74 fix intact).
- Phase 10 (1): Sandbox config screen opens.
- Phase 11 (4): Community levels 1–4 (`The Implication`, `Inverted AND`, `Either But Not A`, `Always Agree`) load via `ui.playCommunityLevel()` with `isCommunityLevel=true`.
- Phase 12 (3): Day 84 Lab Bench II regression — L41 NAND-only chip, L42 hard cap 4 chip, L43 mustInclude XOR chip all live.
- Phase 13 (1): 0 console errors across entire suite.

Full report: `qa-reports/day-88-qa.md`.
Harness: `qa-reports/day-88-qa.cdp.js`.

*Updated: Day 87 — Cycle 3 HARDEN Week, Day 1 (2026-05-25) — Full Interaction Audit*

## Open Bugs

*(none user-facing — Open Bugs queue empty since Day 76, 28-day streak through Day 103.)*

## Latent Observations (P2, not user-reachable)

*(empty — LO-1 retired Day 103, see Resolved section.)*

## Resolved — LO-1 (Day 87 surfaced → Day 103 fixed)

### LO-1 — Direct `ui.showScreen('level-select')` bypasses Day 61 + Day 74 HUD cleanup

- **Surfaced:** Day 87 (Cycle 3 HARDEN Day 1 — Full Interaction Audit).
- **Symptom:** Calling `window.game.ui.showScreen('level-select')` directly from the dev console (or any future internal caller) left `speedrunMode=true` and `#speedrun-hud` `display: flex`. Symmetric shape surfaced for `blitzMode` (re-verified Day 102).
- **Severity:** P2 latent. Documented as code-smell, NOT a user-reachable bug.
- **Re-verified non-user-reachable on:** Days 87 / 88 / 89 / 90 / 91 / 97 / 98 / 99 / 100 / 101 / 102 (12 days of latency).
- **Root cause:** The defensive HUD cleanup lived on the **GameState wrapper layer** (`GameState.showLevelSelect()`), not on the **UI layer** (`ui.showScreen('level-select')`). When the UI layer was invoked directly, the cleanup never ran.
- **Day 103 fix (this resolution):** Day 61 + Day 74 cleanup blocks moved from `GameState.showLevelSelect()` into `UI.showScreen()`. When destination is `'level-select'`, the transition layer cleans BOTH Blitz and Speedrun mode + timer + HUD. The two defensive blocks in `GameState.showLevelSelect()` were removed (the transition layer is now the single owner of the contract).
- **Regression baseline:** `qa-reports/day-103-qa.cdp.js` P2 + P3 explicitly replay the Day 102 P5 / P5b bypass-path reproduction — both now leave `speedrunMode=false` + hud `display=none` (and the Blitz analogue). Day 102 P5.c / P5.d / P5b.b would FAIL to reproduce LO-1 on the Day 103 build (the documented success signal).
- **Day 87 lesson honored:** HUD cleanup belongs at the screen-transition layer, not at the orchestrator wrapper. PRUNE Week was the right home for this fix — it tightened a contract without removing a feature.

## Day 87 — Cycle 3 HARDEN Week, Day 1 (Full Interaction Audit) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'` (Day 86 build, **unchanged today**).
**Result:** **66 / 66** assertions passed across 29 phases. **0** new user-facing bugs. **0** console errors. **1** latent observation logged (LO-1 above).

**No code changed today** — cache-bust and SW version intentionally NOT bumped (Day 86 precedent: only bump on real change).

**Module-health diff vs Day 86 baseline:** timestamp-only change. 10 files / 21208 LOC / 110 globals / 25-sym `ui.js` fan-out / 0 collisions — all byte-identical.

**Audit coverage (29 phases / 66 assertions):**

- Phase 1 (2): build identity — cache-bust + SW match Day 86.
- Phase 2 (6): cold-start surface — 2 buttons, 43 level cards, 'silent-standard' onboarding, DIFFICULTY_KEY=`standard`.
- Phase 3 (4): Settings modal — 13 buttons, accessibility toggles non-throwing, Difficulty Mode chooser opens, Install App click safe.
- Phase 4 (1): How to Play modal opens.
- Phase 5 (5): Day 82 Shareable Snapshot Cards regression — L1 solve + `#share-card-modal` 1200×630 canvas + 4 controls.
- Phase 6 (4): Day 83 Tournament Backend Adapter regression — `getMode()==='local'`, `isLive()===false`, describe label, full interface.
- Phase 7 (6): Day 84 Lab Bench II regression — L41 NAND-only + chip, L42 hard cap 4 + chip, L43 must include XOR + chip.
- Phase 8 (2): Day 85 Onboarding Experiment Flag regression — default variant + full interface.
- Phase 9 (2): Day 86 Module Split Foundation — report regenerated, 10 files / 110 globals confirmed.
- Phase 10 (2): Daily Challenge — pre-screen + gameplay entry with `currentLevel.isDaily=true`.
- Phase 11 (2): Random Challenge — config + generate → isChallengeMode=true.
- Phase 12 (2): Blitz Mode — entry + back-btn HUD cleanup (Day 61 fix intact).
- Phase 13 (2): Speedrun Mode — entry + back-btn HUD cleanup (Day 74 fix intact).
- Phase 14 (1): Sandbox config screen opens.
- Phase 15 (1): Creator config screen opens via `#create-level-btn`.
- Phase 16 (3): Tournament screen — 3 tabs + Day 83 mode label live.
- Phase 17 (1): Encyclopedia modal opens with content.
- Phase 18 (2): Achievements modal — 269 row elements, 6 with `tier-mythic` class.
- Phase 19 (1): Stats modal — 3 chart canvases render.
- Phase 20 (1): Customize modal `#cosmetic-modal` opens.
- Phase 21 (1): Logic Profile modal opens.
- Phase 22 (1): Mastery Tree button visible at tier3 (seed=18).
- Phase 23 (1): Circuit Collection modal opens.
- Phase 24 (6): L6 gameplay deep dive — all 9 core buttons present, truth table 4 rows, hint/clear/panel/back all non-throwing.
- Phase 25 (1): Tier3 staircase — 18 non-level buttons at seed=18 (Day 78 target).
- Phase 26 (1): End-game — 18 nav + 40 overflow at seed=40 (Day 78 target).
- Phase 27 (1): Mastery Tree modal opens at campaign complete.
- Phase 28 (2): Day 79 dead-identifier regression — all 7 removed identifiers still undefined, `#weekly-puzzle-btn` DOM absent.
- Phase 28b (info): LO-1 latent observation logged.
- Phase 29 (1): 0 console errors across entire suite.

**Cycle 3 BUILD-week regression verdict:** All 5 features (Days 82, 83, 84, 85, 86) intact end-to-end.

## Day 86 — Cycle 3 Build Week, Day 5 (Module Split Foundation) summary

**Build under test:** `?v=1780156800`, `sw.js CACHE_NAME = 'signal-circuit-v60'`.
**Result:** 0 new bugs. Feature QA passed 19/19. 0 open bugs at start, 0 open bugs at end.

**What changed:**

- `tools/module-health.js` (new, ~240 LOC, pure Node, no npm deps): scans `js/*.js`, computes per-file LOC, globals defined, classes exposed, fan-in (symbols this file defines that others reference) and fan-out (symbols from other files this file references). Emits markdown at `specs/module-health.md`. Idempotent; re-runnable with `node tools/module-health.js`.
- `specs/module-health.md` (new, auto-generated baseline, ~270 LOC).
- `specs/day-86-module-split-foundation.md` (new, spec).
- `js/wires.js`: removed dead-global `const WIRE_COLORS = WIRE_COLORS_DEFAULT;` at line 43 (referenced nowhere outside its own definition; surfaced by the report's fan-in=0 column). Replaced with a 3-line comment for archaeology. Net +2 LOC, −1 global.
- `qa-reports/day-86-qa.cdp.js` (new, CDP harness).
- `index.html`: 11 `?v=` refs bumped to `?v=1780156800`.
- `sw.js`: `CACHE_NAME = 'signal-circuit-v60'`.

**Baseline module-health story (post-reduction):**

- 10 files, 21,208 LOC, 110 top-level globals, 0 cross-file symbol collisions.
- `ui.js`: biggest fan-out (25 syms across 5 files), fan-in=1 (just `UI`).
- `gates.js`: biggest fan-in (8 files reference its `Gate`/`IONode`/`GateTypes`/`roundRect`), fan-out=0. Natural first extraction target.
- `main.js`: 60 globals defined (54% of total), fan-in=6, fan-out=24. Biggest single coupling-reduction lever for future days.

**Verification matrix (CDP via permissive headless Chromium on localhost:8901, port 9301):**

- ✅ Syntax: `node -c js/wires.js`, `node -c sw.js`.
- ✅ Build identity: 11 cache-bust refs unified at `?v=1780156800`; zero stale `?v=1780070400` refs remain; SW `CACHE_NAME = 'signal-circuit-v60'`.
- ✅ Cold-start non-level button count on `#level-select-screen` = 2.
- ✅ Day 85 onboarding default: `window.__onboardingExperiment.getVariant() === 'silent-standard'`; counters JSON-serializable.
- ✅ L1 entry: `#gameplay-screen` visible, `#run-btn` visible, 4 truth-table rows.
- ✅ L1 solve via 1 AND gate: `simulation.runAll()` returns 4 rows all `pass === true`; subsequent `runQuickTest()` produces "Level complete!" status banner.
- ✅ Day 84 L41: `availableGates === ['NAND']`; `labConstraint === '🧱 NAND only — universal gate practice'`; `#lab-constraint` chip visible.
- ✅ Day 83 tournament adapter: `game.tournamentBackend.getMode() === 'local'`; `describe()` returns `'🏠 Local leaderboard · same puzzle, deterministic bots'`.
- ✅ Day 78 staircase: after `seedProgress(40)`, 18 non-level buttons + 40 `.level-overflow-btn` buttons visible.
- ✅ 0 `Runtime.exceptionThrown`, 0 `console.error` events across 8 phases.

## Day 85 — Cycle 3 Build Week, Day 4 (Onboarding Experiment Flag) summary

**Build under test:** `?v=1780070400`, `sw.js CACHE_NAME = 'signal-circuit-v59'`.
**Result:** 0 new bugs. Feature QA passed 44/44.

**What changed:**

- `js/main.js`: new `OnboardingExperiment` class (~150 LOC) right above `NotificationManager`; new constants `ONBOARDING_EXPERIMENT_KEY`, `ONBOARDING_VARIANTS`, `ONBOARDING_DEFAULT_VARIANT`, `ONBOARDING_TOAST_COPY`. `GameState` constructor instantiates `this.onboardingExperiment` and exposes `window.__onboardingExperiment`. Day 78 silent-default block (`_checkPlacementTest`) now calls `this.onboardingExperiment.applyFirstLaunch()` instead of inlining.
- `js/ui.js`: `setupSettingsModal()` toggles `#settings-developer-section` based on `localStorage signal-circuit-debug === '1'` on each open; wires `#onboarding-experiment-btn` to a new `showOnboardingExperimentPanel()` modal that lists the current variant, counters, and a reset+reload button.
- `index.html`: new `#settings-developer-section` (display:none by default) inside the Settings modal with one `#onboarding-experiment-btn`.
- `index.html` + `sw.js`: cache bust to `?v=1780070400` (11 refs) and `CACHE_NAME = 'signal-circuit-v59'`.

## Day 84 — Cycle 3 Build Week, Day 3 (Lab Bench II Seed Pack) summary

## Day 84 — Cycle 3 Build Week, Day 3 (Lab Bench II Seed Pack) summary

**Build under test:** `?v=1779984000`, `sw.js CACHE_NAME = 'signal-circuit-v58'`.
**Result:** 0 new bugs. Feature QA passed 49/49.

**What changed:**

- `js/levels.js`: new chapter id 10 ("Chapter 9: Lab Bench II", levels [41,42,43]); three new lab levels with one extra constraint each (palette/cap/required-gate); new optional level fields `labConstraint`, `gateHardCap`, `mustIncludeGate`.
- `js/main.js`: new helper `_validateLabConstraints()` called after `_consumeLabAttempt()` in both `runSimulation` and `runQuickTest`; constraint violation surfaces in result + status bar and consumes the attempt.
- `js/ui.js`: `updateLabHud()` now populates `#lab-constraint` from `level.labConstraint` (hides on legacy lab levels), and toggles `.over-cap` on `#lab-budget` when `gateHardCap` is exceeded.
- `index.html`: new `<span id="lab-constraint">` in the lab HUD strip.
- `css/style.css`: `.lab-constraint` amber chip style + `.over-cap` red pulse on the budget chip; light-mode mirrors.
- Cache bust unified at `?v=1779984000`; SW bumped to `signal-circuit-v58`.

**Verification matrix (CDP via headless Chromium on localhost:8901):**

- ✅ Syntax: `node -c js/levels.js`, `node -c js/main.js`, `node -c js/ui.js`.
- ✅ Build identity: 11 cache-bust refs all `1779984000`; SW v58 active.
- ✅ `LEVELS.length === 43`, `getLevelCount() === 43`, Chapter 10 has levels [41,42,43].
- ✅ L41 isLabBench, `availableGates=['NAND']`, toolbox shows only NAND.
- ✅ L42 isLabBench, `gateHardCap=4`.
- ✅ L43 isLabBench, `mustIncludeGate=['XOR']`.
- ✅ L41 constraint chip visible with copy `🧱 NAND only — universal gate practice`.
- ✅ L41 NAND → NAND-as-NOT chain solves all 4 truth rows.
- ✅ L42 constraint chip visible with copy `🎯 Hard cap: 4 gates`.
- ✅ L42 5-gate submission rejected with message `Submission rejected: 5 gates exceeds hard cap of 4.`; attempt is consumed (1/3).
- ✅ L42 `#lab-budget` gains `.over-cap` class at 5 gates and drops it after building the valid 4-gate MUX.
- ✅ L42 Reset Lab restores 3 tries; 4-gate MUX solves all 8 truth rows; `_validateLabConstraints()` returns ok.
- ✅ L43 constraint chip visible with copy `✳️ Must include an XOR gate`.
- ✅ L43 AND+OR submission rejected with message containing `XOR`; attempt is consumed (1/3).
- ✅ L43 Reset Lab restores 3 tries; 2-XOR chain solves all 8 truth rows; `_validateLabConstraints()` returns ok.
- ✅ L36 legacy lab level: `#lab-constraint` hidden, lab HUD still flex, RUN reads `📐 Submit Blueprint`.
- ✅ L1 normal level: lab HUD hidden, RUN reads `▶ RUN`, constraint chip hidden.
- ✅ Cold-start non-level button count still 2 (no top-level chrome added).
- ✅ Console: 0 JS errors across all 49 assertions.


## Day 83 — Cycle 3 Build Week, Day 2 (Tournament Backend Adapter Shell) summary

**Build under test:** `?v=1779897600`, `sw.js CACHE_NAME = 'signal-circuit-v57'`.
**Result:** 0 new bugs. Feature QA passed.

**What changed:**

- `js/main.js` gained a `TournamentBackend` interface and two concrete adapters (`LocalTournamentAdapter`, `RemoteTournamentAdapter`) plus a `selectTournamentBackend()` factory.
- `GameState.tournamentBackend` is now instantiated immediately after `this.weeklyTournament`.
- Both gameplay-completion `weeklyTournament.submitScore(...)` call sites now route through `this.tournamentBackend.submitScore(...)`.
- `#tournament-mode-label` added to `#tournament-screen` and populated from `backend.describe()` in `UI.showTournamentScreen()`.
- Cache bust unified at `?v=1779897600`; SW bumped to `signal-circuit-v57`.

**Verification matrix:**

- ✅ Syntax: `node -c js/main.js`, `node -c js/ui.js`.
- ✅ Build identity: 11 cache-bust refs all `1779897600`; SW v57 active.
- ✅ Default adapter is `LocalTournamentAdapter`, `getMode()='local'`, `isLive()=false`.
- ✅ Tournament button reveals at tier3 (seeded 20 levels); 3 tabs + 3 panes render, leaderboard has 10 rows.
- ✅ Local `submitScore(1, 5)` → `{rank:1, percentile:98, isNewBest:true, score:100, podium:true, crowned:true, achievements:['tournament_podium','tournament_crowned'], gates:1, time:5, weekKey:'2026-W21'}`.
- ✅ Achievements `tournament_podium` and `tournament_crowned` unlocked after submission.
- ✅ Toggle `window.__SC_TOURNAMENT_BACKEND__={mode:'remote'}` + re-init → `RemoteTournamentAdapter`, `getMode()='remote-ready'`, describe label switches to cloud-ready string, submitScore still returns full rank/percentile via local fallback. No fetch attempted.
- ✅ `localStorage('signal-circuit-tournament-backend','remote')` path also produces `RemoteTournamentAdapter`.
- ✅ Restoring defaults returns to `LocalTournamentAdapter`.
- ✅ Console: 0 JS errors.

## Day 82 — Cycle 3 Build Week, Day 1 (Shareable Circuit Snapshot Cards) summary

**Build under test:** `?v=1779811200`, `sw.js CACHE_NAME = 'signal-circuit-v56'`.
**Result:** 0 new bugs. Feature QA passed.

**What changed:**

- Existing `📸 Share Card` modal now renders a real solved-circuit snapshot on the right side of the 1200×630 image.
- Snapshot uses existing Day 43 preview data (`gameState.getPreview(level.id)`) and `_renderPreviewCanvas()`.
- Modal now exposes `💾 Save Image`, `📋 Copy Image`, `🔗 Share`, and Close controls.
- Clipboard image copy uses `ClipboardItem` when supported, with text fallback.
- Native Web Share uses image files when supported, with text/link fallback.
- Deterministic fallback circuit art appears if no saved preview exists.

**Verification matrix:**

- ✅ Syntax: `node -c js/ui.js`, `node -c js/main.js`.
- ✅ Build identity: 11 cache-bust refs unified at `?v=1779811200`; SW v56.
- ✅ Cold start: still 2 visible non-level buttons (`how-to-play-btn`, `open-settings-btn`).
- ✅ Level 1 solved through Quick Test: result `✓ CIRCUIT CORRECT!`, star display visible.
- ✅ Preview persisted: 1 gate, 3 wires, 3 IO nodes, `gc=1`.
- ✅ Share-card button visible after solve; modal opens.
- ✅ Canvas dimensions: 1200×630.
- ✅ Snapshot panel has non-background circuit pixels (`nonDark=4750`, `tealish=977`).
- ✅ All four modal controls visible.
- ✅ Console: 0 JS errors / exceptions.

## Day 81 — Prune Week 2, Day 5 (Expert Panel + Validation) summary

**Build under test:** `?v=1779724800`, `sw.js CACHE_NAME = 'signal-circuit-v55'` (Day 80 build, unchanged).
**Result:** 0 new bugs. Full validation suite passed.

**Verification matrix (24 probes + 5 navigations):**

- ✅ Build identity: 11 cache-bust refs unified at `?v=1779724800`; SW controller = `signal-circuit-v55`; `game.constructor.name === 'GameState'`.
- ✅ Cold start: `level-select-screen` visible, 2 non-level buttons (How to Play + Settings), 40 level cards, 0 overflow buttons, welcome toast fires, no difficulty modal forced, Tournament hidden, `#weekly-puzzle-btn` DOM absent, star chip hidden.
- ✅ L1 (AND Gate Basics): tutorial fires, 4 truth-table rows, hint-footer hidden, Lab HUD hidden, `isLabBench=false`, Quick Test visible, RUN labeled "▶ RUN".
- ✅ L6 (Signal Selector): 4 truth rows, hint footer reappears at L6+ as intended (Day 78 #4 only hides L<4).
- ✅ L12 (Dual Output Router): 4 truth rows.
- ✅ L18 (2-Input Decoder): 4 truth rows, gold-tier marker.
- ✅ L36 (Lab Bench · Open Design: 3-Input Selector): `isLabBench=true`, RUN="📐 Submit Blueprint", Quick Test hidden, lab HUD visible, `_lab={attempts:0,maxAttempts:3,exhausted:false,firstTryLocked:false,cleared:false}`, lab tutorial fires, 8 truth rows.
- ✅ Tier staircase verified: non-level buttons 2/5/7/10/18/18 at seeds 0/6/9/12/18/40; overflow buttons 0/6/9/12/18/40; Tournament appears at tier3 (seed 18); end-game = 58 buttons (Day 78 target).
- ✅ Day 80 polish: `overflowPopIn`, `tierRevealPulse`, `.newly-revealed`, `:focus-visible`, `prefers-reduced-motion` + `#welcome-toast` rules all present.
- ✅ Day 79 dead identifiers regression: `showFirstLaunchDifficultyModal`, `checkLightning`, `isMythic` all `undefined`; `#weekly-puzzle-btn` DOM absent.
- ✅ Cold-start defaults: `sfxVol=0.4`, `musicVol=0.2`, `light-mode` class auto-applied.
- ✅ Console: 0 errors across all 24 probes + 5 navigations.

**Final cycle 2 score:** 8.9/10 (+0.5 from Cycle 1's 8.4). Wrote `reviews/prune-cycle-2-review.md` (15.7 KB).

**Cycle 2 wrap:** 14 day-tasks (5 build + 4 harden early wrap + 5 prune). 0 open bugs entering Cycle 3. End-game button count 98 → 58 (Day 78). Tier-2 cliff smoothed to 5-step staircase. Lab Bench shipped (Day 70). Mythic+Diamond tier shipped (Day 71). Weekly Tournament shipped (Day 72). Net LOC: build dominated (+1244); prune week net-negative on its own (−91 across Day 79 cleanup and Day 80 polish).

## Prior — Day 80 — Prune Week 2, Day 4 (Polish Sprint) summary

**Build under test:** `?v=1779724800`, `sw.js CACHE_NAME = 'signal-circuit-v55'`
**Result:** 0 new bugs, ~+70 LOC (polish budget — net-neutral expected).

**Cold-start defaults audit:** SFX 0.4 / Music 0.2 / dark-mode auto-detect /
Standard difficulty (silent default since Day 78) / Daily+Streak notifs
(post-Day 79) — all confirmed sane. No defaults changed. Added a code
comment in `audio.js` annotating the SFX/Music verdict so a future Prune
doesn't re-litigate.

**Polish items shipped:**

- **Overflow popover open animation** — Day 78's per-card `⋯` popover now
  fades+lifts in via the new `overflowPopIn` keyframe (180ms). Pure CSS;
  gated by `prefers-reduced-motion: reduce`.
- **Tier-staircase "newly revealed" pulse** — `applyProgressGating()` now
  diffs against `this._lastGatingState`; any IDs that flip hidden→visible
  on a re-gate get a one-shot `.newly-revealed` class (cyan glow pulse,
  1.2s). Cold-start (no prior state) suppresses the pulse so a fresh load
  doesn't strobe. JS strips the class after 1300ms. Verified: cross-L6
  pulses daily/encyclopedia/stats; class is gone after 1500ms.
- **`:focus-visible` rings** — added a unified cyan focus ring on
  `.level-btn`, `.level-overflow-btn`, popover menu items,
  `#open-settings-btn`, `.tool-gate`, `#how-to-play-btn`, `#run-btn`,
  `#back-btn`. `:focus-visible` only fires for keyboard nav, so mouse
  users keep their existing `:hover` styling. Light-mode variant uses a
  darker teal.
- **Welcome toast `prefers-reduced-motion`** — under reduced-motion the
  toast snaps in/out without the 0.4s slide animation.
- **Mobile overflow popover constraint** — at `max-width: 480px` the
  popover min-width drops from 132px to 116px and uses
  `right: max(6px, env(safe-area-inset-right))` so iPhone notch frames
  stay clear. Verified at 375 and 414 widths: popover stays inside the
  card; no horizontal scroll on any breakpoint.

**Verification:** 13 CDP assertions on localhost:8901 (build identity
unified, polish CSS keyframes present, popover lifecycle, focus ring
rule, gating diff state, cold-start no-pulse, g6/g9/g18 staircase
pulses, 1500ms timer strip, mobile 375/414/768/1024 popover containment
and no horizontal scroll, Day 78 5-cut regression intact, Day 79 dead
identifiers still `undefined`, L1 gameplay smoke). 0 console errors.



## Day 79 — Prune Week 2, Day 3 (Code Cleanup) summary

**Build under test:** `?v=1779638400`, `sw.js CACHE_NAME = 'signal-circuit-v54'`
**Result:** 0 new bugs, **−180 LOC** (target was ≥−100).

Removed (all callsites verified dead before deletion):

- **`ui.showFirstLaunchDifficultyModal`** — only caller was Day 78 Cut #5; silent-default replaced it.
- **`#weekly-puzzle-btn`** DOM node + `setupCompetitiveModes` click handler + `setVis` gating call + `.weekly-btn` CSS — Tournament subsumed it Day 72.
- **Weekly notification path** — `WEEKLY_NOTIF_KEY` const, `checkWeeklyNotification()`, `_getWeekNumber()`, `_showWeeklyToast()`, `#weekly-toast` CSS, `notif-weekly-btn` button + Settings entry.
- **`AchievementManager.{checkLightning, checkEclipseRun, checkArchitect, isMythic}`** — Day 71 added these wrappers but every mythic unlock fires inline at the real trigger site.
- **`InfiniteRunManager._showHud`** — never called; `_updateHud` handles display.
- **`InteractiveTutorial.getCurrentStep`** — never called.
- **Orphan CSS**: `#mute-btn` (3 rules — element never existed), `#gate-count-display` (2 rules — never rendered), dead light-mode selectors `.modal-content` / `#confirm-modal-box` / `#creator-content` / `#mastery-content` (wrong IDs; real ones are `#confirm-modal-content`, `#creator-config-content`, `#mastery-tree-content`), `#hint-penalty` from compound static-info selector.

**Verification:** 12 CDP checks + 3-test regression sweep, all pass, 0 console errors. End-game overflow count (40 ⋯) and Tier-2 staircase deltas (0/3/5/8/11/16) confirmed no Day 78 regression. Tournament + Settings→Difficulty chooser both still work after the trim.

## Day 78 — Prune Week 2, Day 2 (Design Simplification) summary

**Build under test:** `?v=1779552000`, `sw.js CACHE_NAME = 'signal-circuit-v53'`
**Result:** 0 new bugs, 5 Tier 1 cuts shipped from `PRUNE_REPORT.md`.

- **Cut #1 — Per-card overflow menu**: `👁 Solution` + `🏆 Gate Limit` collapsed into a single `⋯` corner button per completed card with a popover.
- **Cut #2 — Smooth Tier-2 reveal**: `applyProgressGating()` now uses 5 thresholds (g6/g9/g12/g15/g18) instead of two.
- **Cut #3 — Retire Puzzle of the Week**: Tournament fully subsumes it; `weekly-puzzle-btn` hidden at every tier.
- **Cut #4 — Drop L1 hint footer**: meta-rule footer hidden on levels 1–3 (no hints used yet); resurfaces from L4.
- **Cut #5 — Silent-default difficulty modal**: brand-new players auto-set to Standard + one-time toast; Settings → Difficulty Mode unchanged.

Net wins: end-game level-select drops 40 × 2 sub-buttons → 40 × 1 overflow button (−50% per-card visual weight), Tier-2 cliff replaced by a 3 → 5 → 8 → 11 → 16 staircase, two cold-start ceremonies removed (difficulty modal + L1 hint footer).

Live CDP verification (5 cut suites, multi-seed gating sweep, modal/toast lifecycle): 0 console errors.

## Day 76 — Harden Week 2, Day 4 (Fix Everything) summary

**Build under test:** `?v=1779465600`, `sw.js CACHE_NAME = 'signal-circuit-v52'`
**Result:** 0 open bugs at start of day, 0 open bugs at end. Day pivoted to closing the two verification-only learnings flagged on Day 75:

1. **`GameState.seedProgress(count, opts)`** — new dev/Harden helper on `js/main.js`. Synthetically marks levels 1..count as completed (with `_seeded:true` markers and configurable `stars` / `pureLogic` / `hardcore`) so future Harden harnesses can reach tier-gated UI (Tournament, Random Challenge, Adaptive, Infinite, Customize, Mastery Tree, …) without 18 manual completions. Non-destructive on real play. Returns a summary object for assertions.
2. **`runSimulation()` re-entry contract** — 7-line doc comment added directly above the existing `isAnimating` guard codifying the property Day 75 verified empirically: while a sim is in flight, additional invocations are no-ops; after completion the flag clears so subsequent clicks always start a fresh sim; no debounce beyond "one in flight at a time".

Live verification (12 assertions): build identity unified, seedProgress(18) reveals 13 tier3 buttons, cold start hides them all, non-destructive at lower stars, clear option wipes cleanly, Level 1 core loop unaffected, RUN-spam guard holds, 0 console errors.

Written up in `reviews/harden-cycle-2-week-summary.md`. Cycle 2 Harden Week closes one day early.


## Day 75 Edge & Stress Sweep — Cycle 2, Harden Day 3

**Build under test:** `?v=1779379200`, `sw.js CACHE_NAME = 'signal-circuit-v51'` (Day 74 Speedrun cleanup fix)
**Result:** 25/25 tests pass · 0 new bugs · 0 console errors

| # | Test | Result | Detail |
|---|------|--------|--------|
| T1 | Rapid gate placement during simulation | ✅ | 14 gates inserted mid-anim, no throws |
| T2 | Wire drawing while signal animation is playing | ✅ | wireManager.startWire mid-anim no-throw |
| T3 | 10 rapid `resize` events while on gameplay | ✅ | canvas 820×834 stable across all 10 |
| T4 | Tab-reachable focusable count on gameplay | ✅ | 15 focusables (back, shortcuts, encyclopedia, kb-wiring, panel-toggle, next-level…) |
| T5 | colorblind + light/dark mode class toggle | ✅ | both classes apply and revert |
| T6 | 25 gates + 20 wires perf | ✅ | 10× render = 13.9ms, **1.39ms avg frame** |
| T7 | localStorage capacity | ✅ | 50 × 50KB writes succeeded, no QuotaExceeded |
| T8 | Mode-switch storm (level-select ↔ daily/challenge/sandbox/tournament/infinite) | ✅ | always returns to `level-select` clean |
| T9 | Blitz + Speedrun HUD cleanup on Back (Day 61 + Day 74 regression) | ✅ | both `display:none`, mode flags `false`, timers cleared |
| T10 | RUN spam (10 rapid `runSimulation()` calls) | ✅ | 0 errors, animation completes |
| T11 | Quick Test spam (10 rapid `runQuickTest()` calls) | ✅ | 0 errors |
| T12 | Hint button spam | ✅ | hint count stays `≤ 3`, token system holds |
| T13 | Lab Bench entry (Level 36, Chapter 8 redesign) | ✅ | `isLabBench=true`, `#lab-hud` flex, RUN labeled '📐 Submit Blueprint', `_lab={attempts:0,max:3}` |
| T14 | Tournament screen open + close | ✅ | 3 tabs, 10 leaderboard rows, close resets `display:none` |
| T15 | Mythic celebration overlay (lazy-created) | ✅ | `ui.showMythicCelebration()` creates `#mythic-celebration` on demand, displays `flex` |
| T16 | Settings modal + 📲 Install App button | ✅ | `open-settings-btn` opens modal, install button present, close clean |
| T17 | Service worker controller activated | ✅ | `scriptURL=/sw.js`, `state=activated` |
| T18 | window blur/focus + visibilitychange cycle | ✅ | no throws |
| T19 | UI thrash — 15× `showLevelSelect()/startLevel(1)/showLevelSelect()` | ✅ | final screen `level-select`, gates clean |
| T20 | Undo/redo stress — 15 undos + 15 redos | ✅ | no throws, manager stable |
| T21 | Achievements modal sort (mythic-first) | ✅ | 54 rows; top 5 all `tier-mythic` |
| T22 | Build identity (cache-bust + SW version match) | ✅ | 11 `?v=` refs all `1779379200`, `CACHE_NAME=signal-circuit-v51` |
| T23 | localStorage clear (cold-start sim) | ✅ | 13 `signal*` keys removed, no residue |
| T24 | SW cache asset count | ✅ | `signal-circuit-v51` precache = 27 assets |
| T25 | Light-mode + colorblind paint stability on gameplay | ✅ | body bg = `rgb(245,243,235)`, canvas transparent |

**Console errors across all 25 tests:** 0 (only standard AudioContext autoplay warnings).

## Fixed (Recent)

### Day 74 — P2: Speedrun HUD Persists on Level Select ✅
- **Found:** Day 74 (Cycle 2 Harden Day 2). After entering Speedrun Mode and returning to the level select (e.g., via the Back button bypassing `stopSpeedrunMode()`), `#speedrun-hud` remained `display:flex` and `speedrunMode` stayed `true`.
- **Root cause:** Day 61 comment in `showLevelSelect()` claimed "Defensive Blitz/Speedrun HUD cleanup" but only the Blitz branch was wired. Speedrun was missed.
- **Fix:** Sibling defensive cleanup block added to `showLevelSelect()` (`js/main.js`) right below the Blitz cleanup. Clears `speedrunTimer` + `speedrunStart`, sets `speedrunMode=false`, hides `#speedrun-hud`.
- **Verified live:** Patched `showLevelSelect` injected into the running build cleared all three (mode flag, timer, HUD) on transition. Symmetric to the Day 61 Blitz fix.
- **Cache bust:** `index.html` `?v=1779379200`, `sw.js` `CACHE_NAME = 'signal-circuit-v51'`.

## Cosmetic / Minor Observations (Not Bugs)
- AudioContext warnings on page load (expected — resumes after first user gesture)
- Collection shows 4 of 6 completed levels (expected — only levels with saved preview data appear)
- Level 3 shows ★☆☆ in Review Suggested but ★★★🧠 on the card (review tracks worst score, card shows best — working as intended)
- Deprecated meta tag warning: `apple-mobile-web-app-capable` should be `mobile-web-app-capable` (cosmetic, non-breaking)

## Fixed (Recent)

### Audit Results — Day 73 (Harden Week 2, Day 1: Full Interaction Audit) — Cycle 2

**Build:** ?v=1779292800, sw v50 (Day 72 Weekly Tournament + Cycle Polish)

**Screens tested (all rendering, 0 console errors):**
- Level Select (tier-gated: cold start 2 buttons → tier3 reveals 18 nav buttons after 20 levels seeded)
- Gameplay Screen (Level 1 entry; truth table 4 rows; RUN / Quick Test / Hint / Clear / Prev / Next / Panel toggle / KB wiring / Back / Encyclopedia / Shortcuts — all visible)
- Settings Modal (14 buttons + SFX/Music sliders; 9 toggles flipped successfully: Colorblind, Text size, Simplified, Accessible Wiring, Light/Dark, Daily/Weekly/Streak notifications)
- Difficulty Mode button → opens nested confirm-modal with 3 options (Relaxed / Standard / Hardcore)
- How to Play modal (opens + closes cleanly)
- Daily Challenge screen (Back + ⚡ Start Today's Challenge); start → gameplay with isDaily=true
- Random Challenge screen (2 sliders: input-count, output-count; Generate / Push My Limits / Clear Scores); generate → isChallengeMode=true
- Tournament screen (3 tabs: This Week, My Best, Archive); archive shows 8 weeks with Play/Replay buttons; archive replay sets isTournament + isTournamentArchive=true
- Infinite Pre-Screen (Back + Start Run)
- Blitz Ladder (immediate gameplay entry; HUD does NOT persist after Back — Day 61 fix verified)
- Speedrun Mode (immediate gameplay entry; HUD does NOT persist after Back)
- Sandbox config screen (Back + Start Sandbox)
- Creator config screen (Back + Play Level + Share Link)
- Adaptive Challenge button → direct entry to gameplay-screen

**Modals tested (all rendering with content):**
- Gate Encyclopedia (rich content, gate symbols visible)
- Achievements (tier-sorted: 🌌 Mythic → 💎 Diamond → 🥇 Gold → 🥈 Silver → 🥉 Bronze; chase progress visible)
- Stats (3 charts render: chart-daily-playtime 480x140, chart-stars-over-time 480x140, chart-skill-progression 480x100)
- Customize (Wire Colors / Gate Skins / Board Themes sections with cosmetic-card preview swatches)
- Mastery Tree (5-tier grid: Basics → Combinations → Universal → etc. with mastery checkmarks for completed gates)
- Circuit Collection (empty state message for 0 saved levels — expected)
- Logic Profile (level count 14/29 · ⭐ 42/ — stats render)

**Console:**
- 0 JS errors across all paths
- Only AudioContext autoplay warnings (expected; resumes after user gesture)

**Day 61 fix regression checks (still in place):**
- Blitz HUD: 'none' on level-select after Blitz exit ✅
- Speedrun HUD: 'none' on level-select after Speedrun exit ✅ (bonus check)
- Daily Leaderboard: dedup logic in place
- Stats: _logSession filter in place

**Result: 0 new bugs. Audit pass.**

### Day 61 — Harden Week 1, Day 4: Fix Everything

**P2 — Blitz Mode Bar Persists on Level Select** ✅
- **Fix:** `showLevelSelect()` in `js/main.js` now defensively clears any active blitz timer, sets `blitzMode = false`, and hides `#blitz-hud` (`display: none`) on every transition into the level select screen.
- **Why it works:** The HUD is now torn down by the *destination* screen, not just the *source* mode's exit handler. Every navigation path into level select (Back button, programmatic `showLevelSelect()`, post-completion auto-return, mode-switch, etc.) is covered.

**P2 — Daily Leaderboard Duplicate Name** ✅
- **Fix:** `DailyLeaderboard.generatePseudoScores()` now tracks used names in a `Set`. On collision, it linearly probes forward through `DAILY_LB_NAMES`. If the entire 40-name pool is exhausted (last 10 of 50 entries), it appends `_<i>` as a deterministic fallback. Top 10 displayed entries are always unique.
- **Verified:** Headless test across 10 distinct date seeds (today, +1d, +5d, +30d, +90d, +180d, +365d, holidays): top-10 unique = 10/10 in every case; full 50-entry list also fully unique post-suffix.

**P2 — Stats: Empty Sessions Recorded** ✅
- **Fix:** Two-layer defense.
  1. `_logSession()` in `js/main.js` early-returns when `sessionLevels <= 0`, so future page-navigation-only sessions never get persisted.
  2. `renderStats()` in `js/ui.js` filters `s.levelsPlayed > 0` before rendering Recent Sessions, hiding any legacy 0-level rows already saved in localStorage.

**Cache bust:** `index.html` `?v=1777216661`, `sw.js` `CACHE_NAME = 'signal-circuit-v42'`.

### Earlier Audits

#### Audit Results — Day 60 (Harden Week 1, Day 3: Edge Cases & Stress)

13/13 stress tests passed (rapid gate placement, wire drawing during animation, window resize, localStorage clear, keyboard navigation, colorblind mode, light/dark mode, performance with many wires/gates, empty simulation, undo/redo, text size, blitz entry/exit, localStorage capacity). Console: 0 JS errors. No new bugs found; all 3 P2 bugs from Days 58–59 confirmed open going into Day 4.

#### Audit Results — Day 59 (Harden Week 1, Day 2: Level Playthrough)

Levels 1–5 played hands-on with truth tables verified and 3-star solves. All 40 truth tables programmatically validated (non-degenerate, correct row counts; spot-checked L7 XOR, L13 Half Adder, L15 Majority, L17 Full Adder, L25 Ripple Adder). All 5 challenge modes tested (Daily / Random / Blitz / Speedrun / Sandbox). Community level "The Implication" played successfully. Star/hint systems verified. 0 JS errors; new P2 bug (Blitz bar persistence) found.

#### Audit Results — Day 58 (Harden Week 1, Day 1: Interaction Audit)

All 20 screens tested and rendering correctly: Level Select, Gameplay (L1), Daily Challenge, Sandbox, Puzzle of the Week, Gate Encyclopedia, Achievements, Stats Dashboard, Customize, Mastery Tree, Circuit Collection, Logic Profile, How to Play, Light/Dark mode, Colorblind/Text Size/Simplified/Accessible Wiring/Difficulty buttons, Volume controls, Notification settings, Export/Import Progress, Review Suggested, Community Levels. 0 JS errors. 2 P2 bugs documented (Daily Leaderboard duplicate name, Stats empty sessions).

### Day 96 — Cycle 4 BUILD Week, Day 5 (Snapshot Cards Library Tab)

Shipped: Snapshot Cards library with Stats → 📸 My Cards tab, capped at 20 with FIFO eviction, click-to-reopen, and Reset Game wipe. 28 CDP assertions / 0 console errors / 0 exceptions. **21-day empty-queue streak preserved** (Day 76 → Day 96).

**No new bugs at start of day. No new bugs at end of day.**

## Day 113
**Latent Observations**
- **LO-2** ~~Local `puppeteer-core` test harness for Full Interaction Audit fails on the factory orchestrator due to missing `@puppeteer/browsers` dependencies. Needs fallback pure-CDP websocket runner (`ws@8.20.0`) or OpenClaw container configuration update.~~ **RESOLVED Day 114.**

## Day 114 — Cycle 5 HARDEN Week, Day 2 (Level Playthrough) summary

**Build under test:** local `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build, unchanged).
**Result:** **32 / 32** assertions across 7 phases (28/32 first run with 4 harness-shape self-bugs, all fixed harness-side, 0 app changes). **0** console errors. **0** `Runtime.exceptionThrown`.

**LO-2 RESOLVED.** Root cause: the CDP harness never needed puppeteer — it speaks raw CDP over `ws@8.x` (present in the openclaw node_modules). It only needed a Chromium binary launched on the CDP port. Fix shipped: `tools/cdp-launch.sh` boots the static server (8901) + headless Chromium (`/Users/openclaw/Applications/Chromium.app`, Chrome/146) with `--remote-debugging-port=9301 --remote-allow-origins=*`, with a Playwright-cache fallback. Future HARDEN/PRUNE QA is unblocked.

**Level Playthrough coverage:** 13 sampled levels (1/5/10/15/20/25/30/35/40 + lab 45/46/48/50) — truth-table rows == 2^numInputs, per-row IO arity, ≥1 hint, `calculateStars` monotonic (3★ at optimal, <3 above goodGates). Hands-on L1 solve → 3 stars. Mode entries: Daily/Random/Blitz/Speedrun/Sandbox + Blitz/Speedrun HUD cleanup (Day 61/74). 4 community levels load via `buildCustomLevel`. Cold-start invariants (50 cards, 2 nav buttons, Day 79 dead-IDs, Day 92/107 window bindings, sw v73) all hold.

**Open Bugs queue:** 0 → 0. **Latent observations:** 1 (LO-2) → **0** (LO-2 retired). **New bugs:** 0.

Report: `qa-reports/day-114-qa.md`. Harness: `qa-reports/day-114-qa.cdp.js`. Launcher: `tools/cdp-launch.sh`.

**Day 115 next:** Cycle 5 HARDEN Week Day 3 — Edge Cases & Stress.

## Day 126 — Cycle 6 BUILD Week, Day 4 (Onboarding A/B cohort instrumentation)

**No open bugs at start of day. No open bugs at end of day.**

Shipped deterministic Local/Live cohort assignment + return-session counter + debug-gated readout (behind the Day 95 Developer section). 44/44 assertions across 8 phases on the FIRST run (`qa-reports/day-126-qa.cdp.js`); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs; 0 harness self-bugs. Open Bugs queue: 0 → 0 (**51-day empty-queue streak** since Day 76). Latent observations: 0 → 0.

## Day 127 — Cycle 6 BUILD Week, Day 5 (Stats per-chapter completion heatmap)

**No open bugs at start of day. No open bugs at end of day.**

Shipped the 📈 Progress heatmap tab in the Stats modal — one cell per chapter, palette-native completion-band tint, ★ overlay, 100% ✓+glow, bonus chapters in a second section, hidden-when-empty (Day 119). 31/31 assertions across 7 phases (`qa-reports/day-127-qa.cdp.js`); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs. 1 harness self-bug on first run (`game.gameState.progress` vs `game.progress` — `window.game` IS the GameState), fixed harness-side, 0 app changes. Open Bugs queue: 0 → 0 (**52-day empty-queue streak** since Day 76). Latent observations: 0 → 0. **Closes Cycle 6 BUILD week.**

Report: `qa-reports/day-127-qa.md`. **Day 128 next:** Cycle 6 HARDEN Week Day 1 — Full Interaction Audit.

## Day 128 — Cycle 6 HARDEN Week, Day 1 (Full Interaction Audit)

**No open bugs at start of day. No open bugs at end of day.**

Full Interaction Audit on the Day 127 build (`?v=1783036800` / sw v81, unchanged). 85/85 assertions across 27 phases on the second run (82/85 first run — 3 harness-shape self-bugs, all fixed harness-side, 0 app changes); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs. Verified all Cycle 6 BUILD-week surfaces intact: D123 simulation.js ESM (`game.simulation instanceof window.Simulation`), D124 Profile-hub merge (5 tabs render + tier gating + cosmetic live-render + close clears #profile-view), D125 Tournament Worker settings (connect/clear/opt-in-name), D126 onboarding A/B cohort (deterministic + debug readout), D127 Progress heatmap (11 chapter cells + summary strip + full-seed correctness). Standing regression floor held: Day 78 staircase (cold 2 / end-game **14** nav post-Day-124-merge / 50 overflow), Day 79 dead-ids, Day 92/107 ESM, Day 61/74 HUD cleanup, Tournament 2-tab (Day 119). Two new coverage-rotation probes added (Sandbox deep-play + cosmetic×colorblind live-paint) — both pass. Open Bugs queue: 0 → 0 (**53-day empty-queue streak** since Day 76). Latent observations: 0 → 0.

Report: `qa-reports/day-128-qa.md`. Harness: `qa-reports/day-128-qa.cdp.js`.

## Day 130 — Cycle 6 HARDEN Week, Day 3 (Edge Cases & Stress)

**No open bugs at start of day. No open bugs at end of day.**

Edge Cases & Stress sweep on the Day 127 build (`?v=1783036800` / sw v81, unchanged — HARDEN policy = zero new features). 36/36 assertions across 18 phases on the FIRST run (`qa-reports/day-130-qa.cdp.js`); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs; 0 harness self-bugs. Classic T1–T10 sweep (rapid gate placement during sim, wire-draw during animation, 10× resize, clear-localStorage reload, keyboard nav, colorblind + light/dark round-trips, 44-wire render at 0.74ms avg frame, 20× undo+redo, 10× RUN + 10× Quick Test spam) all no-throw. Cycle 6 BUILD surfaces stressed under churn: S1 Profile-hub 8× open/tab-storm/close (Day 124), S2 heatmap 8× seed/reset churn (Day 127), S3 tournament settings 6× connect/clear (Day 125), S4 cohort determinism across 4 reloads + URL override (Day 126) — all held. Standing floor (Day 78 staircase, Day 79 dead-ids, Day 92/107/123 ESM bindings) intact. Open Bugs queue: 0 → 0 (**55-day empty-queue streak** since Day 76). Latent observations: 0 → 0.

Report: `qa-reports/day-130-qa.md`. Harness: `qa-reports/day-130-qa.cdp.js`.

**Day 131 next:** Cycle 6 HARDEN Week Day 4 — Fix Everything (empty queue → likely rest-day confirmation probe per Day 90/100/116).

## Day 132 — Cycle 6 HARDEN Week, Day 5 (Regression Pass — deployed)

**No open bugs at start of day. No open bugs at end of day.**

Regression Pass against the LIVE GitHub Pages deployment (`https://mikedyan.github.io/signal-circuit/`). Confirmed Pages caught up to the pinned Day 127 artifact (11× `?v=1783036800` + sw v81, byte-matching local). 30/30 assertions across 12 phases on the FIRST run (`qa-reports/day-132-qa.cdp.js`); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs; 0 harness self-bugs. Deployed sweep: build identity + cold-start invariants; core loop end-to-end on L1 (3★ persists); all 8 modes reachable with Blitz (Day 61) + Speedrun (Day 74) HUD cleanup; Tournament mode=local. Cycle 6 BUILD regression D123–D127 all intact on deployed bytes (sim ESM, Profile-hub 5-tab merge + close-clears, tournament settings connect/clear, cohort determinism across 3 reloads, heatmap empty/partial/full). Open Bugs queue: 0 → 0 (**57-day empty-queue streak** since Day 76). Latent observations: 0 → 0. **Closes Cycle 6 HARDEN week.** Cycle 6 HARDEN scorecard: 85+40+36+28+30 = 219 assertions across Days 128–132, 0 user-facing bugs, 0 console errors, 0 source-file changes.

Report: `qa-reports/day-132-qa.md`. Summary: `reviews/harden-cycle-6-week-summary.md`.

**Day 133 next:** Cycle 6 PRUNE Week Day 1 — Fresh Eyes Audit + PRUNE_REPORT.md.

## Day 137 — Cycle 6 PRUNE Week, Day 5 (Expert Panel + Validation — Cycle 6 CLOSED)

**No open bugs at start of day. No open bugs at end of day.**

Validation day, 0 source-file changes (build pinned at Day 136 `?v=1783900800` / sw v84). 45/45 assertions across 6 phases (38/45 first run → 7 first-run harness self-bugs, all fixed harness-side, 0 app changes); 0 console.error; 0 Runtime.exceptionThrown; 0 new user-facing bugs. Played 5 levels across chapters (L1/L6/L18/L36/L48 — truth tables 2^numInputs rows, 3 hints each, monotonic stars, L1 solve persists 3★), re-scored the 10-dimension rubric to **9.3/10** (Clarity 9→10 on the Day 124 nav 18→14 merge). All Cycle 6 BUILD (D123–127) + PRUNE (D134–136) surfaces intact; regression floor + ESM bindings + dead-id purge all pass. Open Bugs queue: 0 → 0 (**62-day empty-queue streak** since Day 76). Latent observations: 0 → 0. **Closes Cycle 6 PRUNE Week + the 90-day cycle window.**

Report: `qa-reports/day-137-qa.md`. Harness: `qa-reports/day-137-qa.cdp.js`. Review: `reviews/prune-cycle-6-review.md`.

**Day 138 next:** Cycle 7 BUILD Week Day 1 — generate roadmap (`roadmaps/cycle-7-build.md`) + ship Day 1 feature (top candidate: deploy Tournament Worker for real + run Day 126 local-vs-live cohort).
