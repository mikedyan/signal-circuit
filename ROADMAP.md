# Signal Circuit — Development Roadmap

## Day 1: Foundation
**Goal:** Playable core — canvas, 3 basic gates (AND, OR, NOT), wire drawing, basic simulation
- Breadboard canvas with grid
- Gate rendering (AND, OR, NOT as IC chips)
- Drag gates from toolbox to canvas
- Draw wires between gate pins
- Basic circuit evaluation (propagate signals)
- 2 tutorial levels: "Use an AND gate" and "Use a NOT gate"
- Visual feedback: inputs/outputs show 0/1 state

## Day 2: Polish & Interaction
**Goal:** Make it feel like a real game
- Signal flow animation (watch signals travel through wires)
- Truth table display on the side
- Run button with pass/fail feedback per row
- Delete gates and wires
- Undo/redo
- 3 more levels introducing OR gate and basic combinations
- Gate rotation
- Skeuomorphic visual polish (shadows, IC chip labels, colored wires)

## Day 3: Level System & Progression
**Goal:** Campaign structure with unlocks
- Level select screen
- Chapter system (Chapter 1: Basics)
- Star rating (1-3 stars based on gate count)
- localStorage progress persistence
- 5 more levels (10 total) with increasing complexity
- XOR gate unlock at level 6
- Level completion celebration animation

## Day 4: Challenge Mode
**Goal:** Infinite replayability
- Procedural truth table generator
- Sandbox mode (free build, no target)
- Difficulty slider (2-4 inputs, 1-2 outputs)
- Score: fewer gates = better
- Leaderboard (localStorage only)

## Day 5: Advanced Gates & Chapter 2
**Goal:** Expand the puzzle space
- NAND, NOR gates
- Chapter 2 unlock after completing Chapter 1
- 5 new levels for Chapter 2
- "Build X using only NAND" constraint levels
- Gate count display and optimization hints

## Day 6: Mobile Support
**Goal:** Touch-friendly gameplay
- Touch event handlers for drag/drop and wire drawing
- Responsive layout for phone/tablet
- Pinch to zoom on canvas
- Touch-friendly gate pin targets (larger hit areas)
- Test on iOS Safari and Android Chrome

## Day 7: Audio & Juice
**Goal:** Game feel
- Click sounds for gate placement
- Wire connection snap sound
- Success jingle on level complete
- Fail buzz on incorrect circuit
- Subtle animations: gate placement bounce, wire draw trail
- Background hum (optional toggle)

## Day 8-10: Chapter 3 & Complex Circuits
**Goal:** Deep puzzle content
- MUX (multiplexer) gate
- Half-adder challenge levels
- Multi-output circuits
- 10 more levels (20 total)
- Difficulty curve tuning

## Day 11-14: Polish & Ship
**Goal:** Release quality
- Performance optimization (20+ gate circuits)
- Cross-browser testing
- README with screenshots
- Share circuit as URL (encode state in hash)
- Dark mode PCB variant
- Final bug sweep

## Day 15-17: Push to 90+ (Extended)
**Goal:** Tighten core loop, add juice, increase uniqueness

### Day 15: Core Loop Tightening & Wire Polish
- Real-time gate count + optimality indicator (projected stars while building)
- Smooth bezier curved wires (replace L-shaped Manhattan routing)
- Per-row micro-celebrations during simulation (green flash/red shake)
- Wire color coding (unique colors per wire like real jumper wires)

### Day 16: Dark Mode PCB Theme & Advanced Visuals
- Toggle between breadboard and PCB green theme
- Component labels on IC chips (pin numbers)
- Wire routing intelligence (offset overlapping wires)
- Ambient background animation (subtle circuit pulse)

### Day 17: Content & Retention
- 5 new bonus "constraint" levels (NAND-only, NOT-free, etc.)
- Streak tracking for daily challenges
- Stats page (total time played, favorite gate, etc.)
- Social sharing improvements (screenshot of circuit)
