# Build Report — Day 20 Item 4

## Changes Made
- js/ui.js: Added isTouchDevice detection in constructor
- js/ui.js: Added adaptCopyForPlatform() that swaps "Click"→"Tap" and "Right-click"→"Long press" on touch devices
- Onboarding tooltip already had platform detection (no change needed)

## Self-Test Results
- Touch devices get "Tap" copy: PASS
- Desktop keeps "Click" copy: PASS
- Shortcuts show "Long press" on mobile: PASS
