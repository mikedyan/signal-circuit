# Day 69 Spec — Mobile Install Moment + Welcome Onramp

**Cycle 2 / Build Week / Day 2 (cycleDay 17, 2026-05-05).**

Reframe the PWA install prompt around the player's first three wins instead of a passive session counter, and stitch in a welcome onramp so a brand-new player feels rewarded each step of the way before getting asked to install.

## Goals

1. Move install trigger from "3 sessions opened" → "3 levels completed" (peak intent).
2. Welcome toast arc on L1/L2/L3 completion: celebrate, celebrate, install pitch.
3. Replace the inline `#install-prompt` banner with a branded **modal** that explains the value (offline play, daily notifications, 1-tap launch) and respects user choice (Maybe Later 14d / No Thanks 90d).
4. iOS Safari fallback (no `beforeinstallprompt`) → show "Add to Home Screen" instructions modal.
5. Suppress entirely when already running standalone (`display-mode: standalone` or iOS `navigator.standalone`).
6. Onboarding step counter (1/3, 2/3, 3/3) on the L1–L3 cards while completed < 3.
7. Hide the streak chip on a truly fresh profile (no completed levels) — the seed `🔥1` shouldn't show before the player has earned anything.
8. Settings → "📲 Install App" entry that opens the modal on demand.

## Implementation

### 1. `index.html`

- New `#install-modal` modal markup with H3 `📲 Install Signal Circuit`, three benefit bullets, primary `Install` button, `Maybe Later` (14d), `No Thanks` (90d).
- New `#ios-install-modal` modal with iOS Safari instructions (Share → Add to Home Screen).
- Add `<button id="install-app-btn" class="settings-btn">📲 Install App</button>` inside Settings → Data section.
- Cache-bust query strings → `?v=1778774400` (Day 69 timestamp).

### 2. `css/style.css`

Add modal styles `#install-modal`, `#install-modal-content`, `.install-benefits` list, primary/secondary install button colors, light-mode mirror. Also `#ios-install-modal` styles.

### 3. `js/main.js`

- `NotificationManager`:
  - New constants: `INSTALL_LATER_KEY` (snooze epoch), `INSTALL_NEVER_KEY` (90d snooze epoch).
  - `_isStandalone()` helper.
  - `_isIOS()` helper (UA detect that excludes Android).
  - `_completedLevelCount()` reads `signal-circuit-progress` and counts `completed: true` entries (no game-state coupling).
  - `_installSnoozedUntil()` returns the latest of the two snooze keys.
  - `setupInstallPrompt()` no longer auto-opens on session count. It just captures `beforeinstallprompt`. The trigger is `maybeShowInstallModal()`, which is now called from `onLevelCompleted(levelId)`.
  - `onLevelCompleted(levelId)` — new method called from `completeLevel`. Shows the welcome toast for L1/L2/L3 first-time completions and calls `maybeShowInstallModal()` after L3.
  - `maybeShowInstallModal({ source })` — shows branded modal when (a) not standalone, (b) snooze expired, (c) `_deferredInstallPrompt` available OR iOS Safari; otherwise no-op (and on iOS, opens iOS modal instead).
  - `showWelcomeToast(text, durationMs)` — reusable toast renderer (`#welcome-toast`).
  - Wire Settings `#install-app-btn` to `maybeShowInstallModal({ source: 'settings', force: true })` (`force` ignores snooze and surfaces the iOS modal even after dismissal so users can opt in later).

- `GameState.completeLevel`:
  - At end (after `_checkChapterCompletion`), if `existing` was undefined (first-time completion), notify `window._notifManager` via `onLevelCompleted(levelId)`.

### 4. `js/ui.js`

- `renderLevelSelect`: when a level (1, 2, or 3) is **unlocked but not completed** *and* the total completed-count < 3, append a small `<span class="onboard-step">Step N/3</span>` chip in the header area of that card.
- `updateStreakDisplay(streakData)`: bail out early if the player has no completed levels (`Object.values(progress.levels).every(l => !l.completed)`), regardless of streak value. The `🔥1` seed never renders until the player earns something real.

### 5. `sw.js`

- Bump `CACHE_NAME` to `signal-circuit-v47`.

## Acceptance Tests (CDP / headless)

- Cold start (clean localStorage):
  - No streak chip on level select.
  - L1, L2, L3 cards each show `Step 1/3`, `Step 2/3`, `Step 3/3` chip.
  - No install modal.
- Complete L1 → toast `🎉 First circuit lit!` appears, Step chip on L1 disappears, no install modal yet.
- Complete L2 → toast `⚡ Two down — flowing!` appears, no install modal.
- Complete L3 → toast `🚀 You're flowing — install for offline + notifications` then install modal appears (only if `_deferredInstallPrompt` was captured; otherwise iOS modal on iOS).
- Click `Maybe Later` → modal closes, snooze stored 14d.
- Refresh → no modal (still snoozed).
- Settings → `📲 Install App` → modal reappears (force).
- Click `No Thanks` → 90d snooze.
- Standalone display mode → modal is never auto-shown but Settings entry still surfaces it.
- 0 console errors at every transition.

## Files Touched

- `index.html`
- `css/style.css`
- `js/main.js`
- `js/ui.js`
- `sw.js`
- `specs/day-69-mobile-install-onramp.md` (this file)
- `LESSONS_LEARNED.md`
- `FACTORY_STATE.json`
