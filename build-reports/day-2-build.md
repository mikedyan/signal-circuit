# Day 2 Build Report

## Changes Implemented

### T1: Signal Flow Animation
- Added `runAnimated()` method to Simulation class that evaluates rows sequentially with delays
- Each truth table row evaluates with a ~300ms pulse animation + 400ms gap
- Glowing yellow pulse dot travels along wires during animation
- Truth table rows light up one at a time
- RUN button is disabled during animation (isAnimating flag)

### T2: Wire Deletion
- Added `findWireAt()` to WireManager using point-to-segment distance calculation
- Clicking near a wire selects it (yellow highlight + glow effect)
- Delete/Backspace removes selected wire
- Right-clicking a wire deletes it immediately
- Wire hover highlighting (blue glow on mouseover)

### T3: Undo/Redo System
- New `UndoManager` class with undo/redo stacks (50 action limit)
- Tracked actions: addGate, removeGate, addWire, removeWire
- Gate removal also tracks associated wires for proper undo restoration
- Ctrl+Z / Cmd+Z for undo, Ctrl+Shift+Z / Cmd+Shift+Z for redo
- Stack clears on level change or circuit clear

### T4: 3 New Levels
- Level 3: OR Gate Basics — introduce OR gate
- Level 4: Build a NAND — combine AND + NOT
- Level 5: Build a NOR — combine OR + NOT
- All with correct truth tables and clear descriptions

### T5: Visual Polish
- IC chip body now uses gradient fill (dark to darker) for depth
- Rounded corners on gate bodies and IO nodes
- Active pins have red glow effect
- Output nodes get LED-style radial glow when value is 1
- Wire hover/selection with glow effects
- Pin hover highlight (green circle)
- Cursor changes contextually (crosshair / grab / pointer)
- Wire drawing preview now routes like real wires (3-segment path)
- Power rails made more subtle (lower opacity)
- Breadboard background gradient

## Architecture Notes
- `runSimulation()` is now async (awaits animation)
- `finishDrawing()` returns the created Wire object (for undo tracking)
- `removeWire()` method added to WireManager for clean deletion
- `roundRect()` utility function added to gates.js
