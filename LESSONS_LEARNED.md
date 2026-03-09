# Lessons Learned

*This file grows over time. Every QA run adds patterns here. Every agent reads it.*

## Code Patterns
- **Two-click wire drawing** works better than drag for canvas-based pin connections — more precise
- **Grid snapping** (20px) gives a clean look without being restrictive
- **Topological sort** for circuit evaluation handles any gate arrangement correctly
- **IONode pins** have inverted types: input nodes have "output" pins (they feed into the circuit), output nodes have "input" pins (they receive from the circuit)

## Common Bugs
- **Pin hit-testing offset:** Pin circles are rendered at ±12px from the gate edge. Hit-testing must use the same offset.
- **Wire shadow rendering order:** Draw shadow first, then redraw wire on top. If reversed, shadow covers the wire.

## Architecture Decisions
- Canvas-based rendering chosen over SVG/DOM for performance with many wires
- No framework — vanilla JS with class-based modules
- GameState is the central state object, accessible globally as `window.game` for debugging
- Script load order matters: gates.js → wires.js → simulation.js → levels.js → canvas.js → ui.js → main.js
- Wire class uses plain objects in some places (push literal objects) — should standardize to Wire class instances
- Undo/redo stores action objects with enough data to reverse them (gate type, position, associated wires)
- `roundRect()` utility function used for consistent rounded corner rendering
- Animated simulation uses async/await with requestAnimationFrame for smooth visuals
- Wire hit-detection: point-to-segment distance at 8px threshold works well for 3px wide wires
