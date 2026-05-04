# Day 68 Spec — Infinite Mode (Endless Skill-Adaptive Puzzles)

**Cycle:** 2 / Build / Day 1 (cycleDay 16, totalDay 68)
**Date:** 2026-05-04
**Goal:** Add a deep replayability "run" loop on top of the existing adaptive-challenge generator.

## User-facing flow

1. Player on level select (≥12 levels completed) sees a new **♾️ Infinite** button next to **🎯 Adaptive**.
2. Clicking opens **Infinite pre-screen** with:
   - Title: "♾️ Infinite Run"
   - Best run badge: "🔥 12 streak · 📊 18 solved · ⏱ 9:42"
   - Difficulty floor selector: Novice / Standard / Expert (default = current SkillTracker tier)
   - Big "▶ Start Run" button + brief rules: "3 lives · skip costs a life · streak grows skill"
3. Start → first puzzle generated via `SkillTracker.generateAdaptiveChallenge()` at the chosen floor.
4. Gameplay screen with extra HUD (top-left of canvas area): `❤️ ❤️ ❤️ · 🔥 0 · 🧮 0 · ⏱ 0:00`. RUN/Skip/Clear stay where they are.
5. Solve → 0.8s "Solved!" toast → next puzzle auto-loads. Streak +1, totalSolved +1. Every 5 streak, skill tier bumps up (max Expert).
6. Skip → -1 life, new puzzle at same tier. RUN with wrong circuit = no life lost (unlimited attempts on same puzzle).
7. 0 lives → **Run-summary** screen: streak, total, time, "🎉 New best!" banner if applicable, **▶ Run Again** + **🔗 Share** + **✓ Done** buttons.
8. State persists in localStorage as `signal_circuit_infinite_v1`.

## Acceptance criteria

- [x] `♾️ Infinite` button appears on level-select after 12+ campaign levels completed.
- [x] Pre-screen renders best run; first-time players see "—" placeholders.
- [x] Difficulty floor select pre-fills to current SkillTracker tier.
- [x] Run starts with `lives=3, streak=0, totalSolved=0, runStart=now()`.
- [x] HUD lives/streak/total/time updates live during gameplay.
- [x] Skip decrements lives by 1, generates fresh puzzle, breaks streak.
- [x] Solve increments streak + totalSolved, generates next puzzle, no life cost.
- [x] Wrong-circuit RUN does NOT decrement lives (just shows the usual fail truth table).
- [x] Skill tier bumps Novice → Intermediate (5 streak) → Advanced (10) → Expert (15).
- [x] Run-summary screen shows on 0 lives with all stats and best-update banner.
- [x] Best run persists across sessions and is shown on the pre-screen.
- [x] Two achievements (`infinite_marathon`, `pure_logic_run`) wired and earnable.
- [x] HUD is hidden on every other screen + outside infinite mode.
- [x] Exiting via Back during a run prompts confirm and saves a partial run as ended.
- [x] Cache bust to `?v=1778688000` and SW `signal-circuit-v46`.
- [x] 0 console errors on cold start, infinite pre-screen, run start, solve, skip, run-end.

## Implementation plan

### HTML (index.html)

- Add `#infinite-pre-screen` (sibling of `#challenge-config-screen`):
  ```
  <div id="infinite-pre-screen" class="screen">
    <div class="config-card">
      <h2>♾️ Infinite Run</h2>
      <p class="muted">Solve as many as you can. 3 lives. Skip costs a life. Streak builds skill.</p>
      <div id="infinite-best-row">…</div>
      <label>Starting tier:</label>
      <select id="infinite-tier"><option value="novice">Novice</option>…</select>
      <button id="infinite-start-btn" class="primary-btn">▶ Start Run</button>
      <button id="infinite-back-btn" class="secondary-btn">Back</button>
    </div>
  </div>
  ```
- Add `#infinite-hud` overlay (display none by default), placed inside `#gameplay-screen`:
  ```
  <div id="infinite-hud">
    <span id="ihud-lives">❤️ ❤️ ❤️</span>
    <span id="ihud-streak">🔥 0</span>
    <span id="ihud-total">🧮 0</span>
    <span id="ihud-time">⏱ 0:00</span>
  </div>
  ```
- Add `#infinite-summary-screen` for run end with summary + buttons.
- Add `<button id="infinite-mode-btn">♾️ Infinite</button>` next to adaptive button in level-select.
- Bump cache-bust query strings: `?v=1778688000`.

### CSS (css/style.css)

- `.infinite-card`, `#infinite-best-row`, `#infinite-hud { position:absolute; top:8px; left:8px; … }`.
- Tier select dropdown styled to match site palette.
- Summary screen styled like daily challenge result screen.
- Light-mode mirror.

### JS (js/main.js)

- Add `InfiniteRunManager` class:
  ```
  class InfiniteRunManager {
    constructor(game) { this.game = game; this.active = false; this._loadBest(); }
    startRun(tier) { lives=3, streak=0, total=0, runStart=now, tier=tier; }
    onSolve() { streak++; total++; if (streak%5===0) tier=bumpTier(tier); generateNext(); }
    onSkip() { lives--; if (lives<=0) endRun(); else { streak=0; generateNext(); } }
    endRun() { active=false; saveBestIfNeeded; show summary screen; }
    generateNext() { use SkillTracker.generateAdaptiveChallenge or fallback }
    updateHud() { paint lives/streak/total/time }
    onBackButton() { confirm dialog; if confirmed end run }
  }
  ```
- Integrate with `GameState`:
  - `infiniteRun` instance attached
  - `startInfiniteRun(tier)` → set `isInfiniteMode = true`, hide regular level UI, show HUD
  - `onLevelComplete` checks infiniteRun.active → calls `onSolve()` instead of celebration
  - Skip button delegates to `onSkip()` when in infinite mode
  - Back button asks confirmation
  - HUD timer interval updates ⏱ every second

### Achievements (js/achievements.js)

- Add `infinite_marathon` (50 streak in one run), tier=gold
- Add `pure_logic_run` (10 solves no hints in one run), tier=gold
- Add hooks in `InfiniteRunManager.onSolve()` and `onSkip()`:
  - track `_runHintsUsed` boolean (set on hint use during a puzzle, reset on next puzzle)
  - track `_pureLogicCount` and emit pure_logic_run when ≥10

### Service Worker

- `sw.js`: bump CACHE_NAME to `signal-circuit-v46`.
- index.html cache-bust: `?v=1778688000`.

## QA plan

1. Local: start http server (port 8901), open in browser, confirm cold start has no Infinite button.
2. Headless: load fresh + complete-12-levels mock state → confirm Infinite button appears.
3. Pre-screen renders, tier select default = current SkillTracker tier.
4. Start run → HUD visible, lives=3, streak=0.
5. Solve a generated puzzle → next puzzle loads automatically, streak=1.
6. Skip → lives=2, streak=0.
7. Skip 3 times → run ends → summary visible → best updated.
8. Restart run → previous best shows on pre-screen.
9. Back during run → confirm prompt; cancel keeps run, accept ends.
10. Console errors: 0 across the whole flow.

## Risk + Mitigation

- **SkillTracker may not exist on cold start** → Guard with optional chaining; fall back to default tier.
- **Adaptive generator may return invalid puzzles** → Reuse Random Challenge generator path as fallback.
- **HUD might overlap toolbox on small screens** → Use `top:8px; left:8px;` over canvas; CSS clamps.
- **Skipping during animation could break state** → Queue `onSkip()` after current animation frame (use existing `_animating` guard).
