# Build Report — Item 15: Fix Intro Screen Race Condition

## Changes
- **js/main.js**: Added returning player detection using `signal-circuit-visited` localStorage key (same key set in Item 10). Returning players skip intro entirely (immediate removal). First-time players still see the animation with animationend event and fallback timeout.

## Files Modified
- js/main.js (1 edit)
