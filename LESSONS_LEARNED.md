# Lessons Learned

*This file grows over time. Every QA run adds patterns here. Every agent reads it.*

## Code Patterns
- **Two-click wire drawing** works better than drag for canvas-based pin connections — more precise
- **Grid snapping** (20px) gives a clean look without being restrictive
- **Topological sort** for circuit evaluation handles any gate arrangement correctly
- **IONode pins** have inverted types: input nodes have "output" pins (they feed into the circuit), output nodes have "input" pins (they receive from the circuit)
- **Screen state management** — use a `currentScreen` variable and show/hide DOM containers rather than full-page navigation
- **Canvas resize timing** — when switching from hidden to visible, schedule resize with `setTimeout(() => renderer.resize(), 50)` to let DOM layout settle

## Common Bugs
- **Pin hit-testing offset:** Pin circles are rendered at ±12px from the gate edge. Hit-testing must use the same offset.
- **Wire shadow rendering order:** Draw shadow first, then redraw wire on top. If reversed, shadow covers the wire.
- **Star thresholds:** Always verify optimal gate count by actually solving the puzzle. De Morgan levels need NOT+NOT+GATE+NOT = 4 gates minimum, not 3.
- **Undo after gate removal:** Must store associated wires to restore them on undo.

## Architecture Decisions
- Canvas-based rendering chosen over SVG/DOM for performance with many wires
- No framework — vanilla JS with class-based modules
- GameState is the central state object, accessible globally as `window.game` for debugging
- Script load order matters: gates.js → wires.js → simulation.js → levels.js → canvas.js → ui.js → main.js
- Undo/redo stores action objects with enough data to reverse them
- `roundRect()` utility function used for consistent rounded corner rendering
- Animated simulation uses async/await with requestAnimationFrame
- Wire hit-detection: point-to-segment distance at 8px threshold works well
- Progress stored in localStorage as JSON with level-keyed structure
- Level select uses DOM elements (not canvas) for better text rendering and accessibility
- Celebration particles use a separate overlay canvas with pointer-events: none
