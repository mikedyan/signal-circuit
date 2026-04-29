# Spec — Day 64 (Prune Week, Day 2): Tier 1 Simplifications

**Date:** 2026-04-29 (Wednesday)
**Cycle:** 1, Prune Week, Day 2 (Design Simplification)
**Source:** `PRUNE_REPORT.md` Tier 1 cuts #1–#5

## Scope

Net code cuts > additions where possible. No new features. Only consolidate, gate by progress, and hide premature info.

## 1. Settings Modal Consolidation (Cut #3)

Replace the four settings rows on level select (`#settings-row`, `#ls-volume-row`, `#notif-settings-row`, `#sync-row`, `#reset-progress-btn`) with a single `⚙️ Settings` button that opens a modal containing all of those controls.

- Add `#settings-modal` and `#settings-content` to `index.html` and move the four rows + reset button **inside** that modal as the modal body, preserving every existing button id (so existing wiring keeps working).
- Add `#open-settings-btn` to the level-select stack (placed where the settings row used to live).
- New CSS sized after `#how-to-play-content` (overlay + dark modal panel).
- Bind open/close in `setupSettingsModal()` (called from `setupLevelSelect`).
- Volume sliders (`#ls-sfx-slider`, `#ls-music-slider`) live inside the modal; they continue to update the audio engine via existing handlers.

## 2. Mode Gating by Progress (Cut #1)

Use `completedCount` (campaign completed levels) to set the visibility of secondary entries on level-select.

- `completedCount === 0` (cold start): only campaign grid + `How to Play` + `⚙️ Settings` visible.
- `completedCount >= 6` (Ch1 done): also reveal `📅 Daily Challenge`, `📚 Gate Encyclopedia`, `📊 Stats`.
- `completedCount >= 12` (Ch2 done): reveal everything (Adaptive, Random, Blitz, Speedrun, Sandbox, Weekly, Customize, Achievements, Mastery Tree, Collection, Logic Profile, Community).

Implementation: at the end of `renderLevelSelect`, compute `completedCount` and toggle a small allow-list of element ids by tier.

## 3. Merge Submit / Create (Cut #2)

Hide `#community-submit-btn` permanently (Creator screen handles both flows). Update the visible `#create-level-btn` label to read `✏️ Creator`. Keep the JS handler — only the duplicate UI is gone.

## 4. Skip Placement Test on Cold Start (Cut #4)

`_checkPlacementTest()` no longer auto-shows the modal on first launch. The first-launch difficulty modal still runs (it is fast and sets a useful default). The placement test code path remains reachable via `?placement` query flag for power users / QA.

## 5. Hide "Used in: …" Until a Downstream Level is Unlocked (Cut #5)

In `renderLevelInfo()`, filter `getForwardReferences(level.id)` against `gameState.isLevelUnlocked(refId)` before formatting. If 0 unlocked refs, hide the element entirely. As soon as the player unlocks a downstream level, the info reappears.

## Cache Bust

- `index.html` query strings: `?v=1777737600`
- `sw.js`: `CACHE_NAME = 'signal-circuit-v43'`

## QA Checklist

1. Cold-start with cleared `localStorage`:
   - No placement test modal.
   - First-launch difficulty modal still appears.
   - Level select shows only campaign + How to Play + Settings.
2. Open `⚙️ Settings`: every setting (colorblind, text size, simplified, accessible wiring, light mode, difficulty, volumes, notifications, export/import, reset) is reachable inside the modal.
3. Complete L1–L6: confirm Daily Challenge, Encyclopedia, Stats appear.
4. Complete through L12: confirm everything else appears.
5. Level 1 sidebar: no "Used in: …" until at least one downstream level is unlocked.
6. Console: 0 errors.

## Net Lines (estimate)

Adds: ~80 (settings modal HTML + CSS + open/close JS + tier-gating helper).
Removes: ~10 (placement test auto-call, community-submit duplicate). 

Net add of ~70 lines but cuts surface area dramatically (29 → 5 visible buttons on cold start). Code-cleanup (Day 3) will reclaim more.
