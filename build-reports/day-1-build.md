# Day 1 Build Report

## Change Plan
1. **index.html** — Page structure: canvas area, left toolbox sidebar, right info panel with truth table and run button
2. **css/style.css** — Full skeuomorphic styling: breadboard texture, IC chip look, toolbox styling, truth table formatting
3. **js/canvas.js** — Canvas manager: render loop, breadboard grid drawing, gate rendering, wire rendering, coordinate transforms
4. **js/gates.js** — Gate class definitions (AND, OR, NOT) with logic, pin positions, IC chip rendering
5. **js/wires.js** — Wire management: click-to-start on output pin, drag preview, connect to input pin, wire storage
6. **js/simulation.js** — Topological sort evaluation, truth table row testing, result collection
7. **js/levels.js** — Level definitions with truth tables, input/output node specs, 2 tutorial levels
8. **js/ui.js** — Toolbox rendering, drag-from-toolbox, run button handler, truth table display, result feedback
9. **js/main.js** — App init, event routing, game state management, render loop

## Architecture Decisions
- Canvas-based rendering for performance
- All game state in a central `GameState` object managed by main.js
- Grid size: 20px per cell
- Gates snap to grid
- Pin positions are relative to gate position
- Wire drawing: click output pin → click input pin (two-click, not drag)
- Level inputs/outputs are special nodes rendered at fixed positions
