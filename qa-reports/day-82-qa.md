# Day 82 QA Report — Shareable Circuit Snapshot Cards

**Date:** 2026-05-20  
**Build under test:** `?v=1779811200`, `sw.js CACHE_NAME = 'signal-circuit-v56'`  
**Harness:** raw CDP against OpenClaw-managed Chromium on port 18800 + localhost server `:8901`  
**Result:** PASS

## Verification

- ✅ Syntax: `node -c js/ui.js` passed.
- ✅ Syntax: `node -c js/main.js` passed.
- ✅ Build identity: 11 `?v=` refs all updated to `1779811200`.
- ✅ Cold start: visible non-level buttons remain exactly 2 (`how-to-play-btn`, `open-settings-btn`).
- ✅ Level 1 solve path:
  - Started campaign Level 1.
  - Programmatically built AND solution: 1 AND gate, 3 wires.
  - Ran Quick Test.
  - Result display: `✓ CIRCUIT CORRECT!`.
  - Star display visible.
- ✅ Preview persistence: `gameState.getPreview(1)` exists with 1 gate, 3 wires, 3 IO nodes, `gc=1`.
- ✅ Share-card button visible after solve.
- ✅ Share-card modal opens.
- ✅ Canvas dimensions remain social-card-ready: 1200×630.
- ✅ Snapshot panel is non-empty and circuit-colored:
  - sampled right-side panel pixels: `nonDark=4750`, `tealish=977`.
- ✅ Modal controls exist and are visible:
  - `share-card-download`
  - `share-card-copy`
  - `share-card-native`
  - `share-card-close`
- ✅ Status text: `Snapshot ready — save, copy, or share it.`
- ✅ Share metadata generated:
  - title: `Signal Circuit — Level 1`
  - text includes level title, gate count, and stars.
- ✅ Console: 0 JS errors / exceptions.

## Notes

The QA harness stubs `navigator.vibrate()` because headless/programmatic solves otherwise produce browser policy warnings unrelated to game correctness (“Blocked call to navigator.vibrate because user hasn't tapped…”). With that test-only haptic stub, console error count is 0.
