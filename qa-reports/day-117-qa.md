# Day 117 QA — Cycle 5 HARDEN Week, Day 5 (Regression Pass)

**Date:** 2026-06-24
**Week type:** HARDEN (Cycle 5) · weekDay 5
**Target:** **DEPLOYED** GitHub Pages — `https://mikedyan.github.io/signal-circuit/`
**Build under test:** `?v=1781395200` · `sw.js CACHE_NAME = 'signal-circuit-v73'` (Day 111 build — unchanged for the entire HARDEN week, ZERO new features per HARDEN policy)
**Harness:** `qa-reports/day-117-qa.cdp.js` (pure-CDP, ws@8.x; `tools/cdp-launch.sh start` → run → `stop`)
**Result:** **22 / 22 assertions across 12 phases** (21/22 first run — 1 harness self-bug, see below). **0** console.error. **0** `Runtime.exceptionThrown`. **0** new user-facing bugs. **0** source-file changes.

---

## Deployment confirmation

GitHub Pages has caught up to the pinned Day 111 artifact:

- Deployed `index.html`: **11** cache-bust refs at `?v=1781395200` ✅
- Deployed `sw.js`: `CACHE_NAME = 'signal-circuit-v73'` ✅

Local and deployed bytes match — no deploy lag.

---

## Phase-by-phase

| Phase | Coverage | Result |
|---|---|---|
| P1 | Deployed build identity (11× `?v=1781395200` + sw v73) | ✅ 2/2 |
| P2 | Cold-start invariants (50 cards, 2 nav buttons, D92/D107 ESM bindings, Day 79 dead-IDs) | ✅ 4/4 |
| P3 | Core loop: load L1 → place gate → 3 wires → Quick Test → RUN → completeLevel persists 3★ | ✅ 2/2 |
| P4 | Mode: Daily Challenge reaches gameplay | ✅ 1/1 |
| P5 | Mode: Random Challenge reaches challenge-config | ✅ 1/1 |
| P6 | Mode: Blitz immediate-start + HUD cleanup on return (Day 61/103 fix) | ✅ 2/2 |
| P7 | Mode: Speedrun immediate-start + HUD cleanup on return (Day 74/103 fix) | ✅ 2/2 |
| P8 | Mode: Sandbox reaches config/gameplay | ✅ 1/1 |
| P9 | Mode: Tournament backend `local` + `🏠 Local leaderboard` + isLive=false (Day 83/108) | ✅ 1/1 |
| P10 | Mode: Adaptive/Infinite tier-gated entry after seedProgress(18) | ✅ 1/1 |
| P11 | Cycle 5 BUILD regression D107-D111 (L48 composite validator, PB badge cold-suppress, Stats tournament tab) | ✅ 4/4 |
| P12 | Console hygiene (0 error / 0 exception) | ✅ 1/1 |

**Total: 22/22.**

---

## Cycle 5 BUILD feature regression (D107-D111) — all PASS on deployed build

- **D107 (wires.js ESM):** `window.Wire` + `window.WireManager` both functions; core loop drew 3 `new window.Wire(...)` cleanly.
- **D108 (Tournament Worker go-live):** backend default `getMode()='local'`, `describe()='🏠 Local leaderboard'`, `isLive()===false`.
- **D109 (Lab Bench III fan-out):** L48 metadata `isLabBench:true, maxFanOut:2, hardCap:3`; validator rejects 4 NAND gates with byte-exact `"Submission rejected: 4 gates exceeds hard cap of 3."`.
- **D110 (PB badge):** `#level-best-badge` present and `display:none` on a truly cold L1 (storage cleared).
- **D111 (Stats Tournament History tab):** `#stats-tab-tournament` + `#stats-tournament-pane` + `ui._switchStatsTab` all present.

---

## Harness self-bug (first run only — no app change)

First run scored 21/22. The single miss was the D110 PB-badge cold-suppression probe returning `display:flex`. Root cause: **harness ordering**, not an app bug. P3 completes L1 (3★) earlier in the same session, and `localStorage` persists that progress. When the D110 probe re-entered L1, the PB badge *correctly* rendered — exactly the Day 110 spec (badge visible on completed-campaign revisits). Fix: clear `localStorage` + reload before the cold-suppression probe so L1 is genuinely no-progress. Second run: badge `display:none` ✅. **Zero app-side changes.**

This is the same class of HARDEN self-bug seen on Days 97/98/99/107/108/115 — the harness over-assumed state shape, the app behaved correctly.

---

## Status roll-up

- **Open Bugs queue:** 0 → 0 (streak: **42 consecutive days** since Day 76)
- **Latent observations:** 0 → 0
- **New bugs found:** 0 · **introduced:** 0 · **source-file changes:** 0
- **Cache-bust / SW:** unchanged (`?v=1781395200` / `signal-circuit-v73`) — no bump on a no-code day (Cycle 3/4 rule)

**Cycle 5 HARDEN Week complete.** Next: Cycle 5 PRUNE Week Day 1 (Fresh Eyes Audit) — Day 118.
