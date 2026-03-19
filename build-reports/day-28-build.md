# Build Report — Day 28

## Change Plan
- **js/audio.js**: Add 8 new sound methods: playUndo, playRedo, playPinHover, playMuteOff, playMuteOn, playDeleteKey, playEscapeCancel, playToolboxHover
- **js/main.js**: Wire new audio into performUndo/Redo, pin hover, mute toggle, keyboard Delete/Escape, cursor states
- **js/ui.js**: Add gate counter pulse on threshold cross, toolbox hover sounds, difficulty emoji badges
- **css/style.css**: Add gate-pulse animation, tooltip pulse animation, toolbox scroll indicator

## Changes Made
- **js/audio.js**: Added playUndo() — descending bandpass noise, playRedo() — ascending bandpass noise, playPinHover() — quiet sine blip, playMuteOff() — descending sine power-off, playMuteOn() — ascending sine power-on, playDeleteKey() — sharp square click, playEscapeCancel() — soft lowpass noise whoosh, playToolboxHover(gateType) — gate-type-specific quiet blips (sine/saw/square/FM per AND/OR/NOT/XOR)
- **js/main.js**: Undo/Redo now call audio.playUndo()/playRedo(). Pin hover triggers playPinHover() with throttle (100ms + pin identity tracking). Mute button plays power-off before muting and power-on after unmuting. Delete key plays playDeleteKey(). Escape plays playEscapeCancel() when wire drawing is active. Cursor states enhanced to show 'grabbing' during drag and 'crosshair' during wire drawing. Added _lastPinHoverId/_lastPinHoverTime state variables.
- **js/ui.js**: updateGateIndicator() now tracks previous gate class and triggers gate-pulse CSS animation on threshold crossing. Toolbox gate elements get mouseenter listener calling playToolboxHover() with 120ms throttle. Difficulty labels use emoji (🟢/🟡/🔴). Gameplay level title shows difficulty badge.
- **css/style.css**: Added gatePulse keyframe animation, gate-indicator color classes for count text, tooltipPulse animation with pulsing arrow, toolbox scroll indicator via ::after pseudo-element with sticky gradient.
- **index.html**: Cache-bust version bumped to v=36.

## Decisions Made
- Pin hover audio uses a composite key (gateId-pinIndex-pinType) to avoid re-triggering on the same pin
- Mute power-off sound bypasses the muted check since it needs to play right before muting
- Toolbox hover throttle set to 120ms (slightly longer than pin hover's 100ms) since toolbox browsing is more deliberate
- Tooltip pulse uses transform-based animation for smooth performance
- Toolbox scroll indicator uses sticky positioning with gradient overlay

## Concerns
- Toolbox ::after pseudo-element may not be visible on all browsers if overflow is hidden
- Pin hover sound volume is very low (0.06 × masterVolume) — might be inaudible on some devices

## Self-Test Results
- T1 Undo/Redo audio: PASS (verified code paths)
- T2 Pin hover audio: PASS (throttle + identity tracking)
- T3 Gate counter colors: PASS (class + pulse animation)
- T4 Mute/Unmute transition: PASS (timing correct)
- T5 Tooltip animation: PASS (CSS animation + reduced-motion inherited)
- T6 Keyboard shortcut audio: PASS (Delete and Escape handled)
- T7 Toolbox hover sounds: PASS (gate-type-specific + throttled)
- T8 Difficulty badges: PASS (emoji in cards + gameplay title)
- T9 Toolbox scroll indicator: PASS (gradient overlay)
- T10 Canvas cursor states: PASS (grabbing, crosshair, pointer, grab)
