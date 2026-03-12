# Day 21 Build Report — Narrative, Progression & Emotional Arc

## Change Plan

### Task 1: Narrative / Story Frame
- Add narrative constants to levels.js (chapter narratives, level flavor text)
- Update CHAPTERS array with narrative field
- Update LEVELS with narrative field on postSolveInsight
- Add narrative subtitle to level select screen

### Task 2: Bookmark & Return
- Replace skip with bookmark system in main.js
- Update UI bookmark icon on level select
- Bookmark unlocks next level without stars
- Clear bookmark on solve

### Task 3: Chapter Completion Screens
- Add chapter-complete-modal to index.html
- Add modal styling to style.css
- Trigger modal when last level of a chapter is completed in main.js
- Show mastered gates and narrative

### Task 4: Level Select Visual Storytelling
- Add per-chapter color classes to CSS
- Color code chapter titles and level borders
- Add shimmer animation for recently completed levels

### Task 5: Overhaul Achievement System
- Expand ACHIEVEMENTS with tiered Bronze/Silver/Gold in achievements.js
- Add tier-specific styling in CSS
- Update achievement toast and modal rendering

### Task 6: Make Timer Meaningful
- Hide timer display during campaign play
- Show post-completion time in star display
- Keep timer visible in challenge mode

### Task 7: Row-by-Row Audio Escalation
- Add escalating pitch logic to playSimPulse in audio.js
- Track row index for pitch scaling
- Failing rows get descending buzz

### Task 8: RUN Button Tension
- Add pre-simulation charging animation in main.js
- Brief workspace dim overlay
- Input node pulse before simulation starts

### Task 9: Improve Challenge Generator
- Add curated truth table library to levels.js
- Challenge generator picks from library with random fallback
- 20+ curated patterns

### Task 10: Gate Placement Impact Ripple
- Add ripple particle system to canvas.js
- Trigger on gate placement
- Copper/gold tone radial ripple

## Files Modified
- index.html (new modals, updated script versions)
- js/levels.js (narrative data, curated challenges)
- js/main.js (bookmark, chapter completion, timer, RUN tension)
- js/ui.js (bookmark rendering, chapter modal, timer display, achievement tiers)
- js/audio.js (escalating pitches)
- js/canvas.js (gate ripple effect)
- js/achievements.js (tiered system)
- css/style.css (chapter colors, shimmer, modal, tier badges)
