# Signal Circuit — Product Requirements Document
*Generated: 2026-03-09 | Interviewer: Mochi | Interviewee: Mike Yan*

## 1. Problem Statement
We're building a logic gate puzzle game as the first test payload for an autonomous AI software factory. The game needs to be genuinely good — fun, polished, educational — but its primary purpose is to prove that a multi-agent pipeline (PM → Builder → QA) can autonomously develop a real product.

## 2. Goals & Success Criteria
- **Primary goal**: A playable, polished logic gate puzzle game hosted on GitHub Pages
- **Secondary goal**: Prove the factory pipeline can take a PRD and produce working software through structured agent handoffs
- **Success criteria**:
  - Game loads and runs in browser (desktop + mobile)
  - At least 10 curated tutorial levels that teach gate concepts progressively
  - Sandbox/challenge mode with procedurally generated truth tables
  - Skeuomorphic breadboard aesthetic that looks professional
  - All interactions work: drag gates, draw wires, run simulation, see results

## 3. Game Design

### Core Gameplay
Player sees a **truth table** showing desired inputs → outputs. They must build a circuit using logic gates to match that truth table exactly. Drag gates from a toolbox onto a breadboard canvas, wire inputs/outputs together, then hit "Run" to simulate.

### Gate Progression (Curated Campaign)
- **Chapter 1: Basics** (Levels 1-5) — AND, OR, NOT gates only. Teach one gate per level.
- **Chapter 2: Combinations** (Levels 6-10) — Combine basic gates. Introduce XOR as a reward unlock.
- **Chapter 3: Advanced** (Levels 11-15) — NAND, NOR gates. Show how NAND is universal.
- **Chapter 4: Complex Circuits** (Levels 16-20) — MUX, half-adder challenges. Multi-output circuits.
- **Bonus/Challenge levels** — "Build X using only NAND gates" style constraints.

### Challenge Mode (Procedural)
- Generate random truth tables with N inputs and M outputs
- Player builds any circuit that satisfies the table
- Scoring: fewer gates = better score, fewer wire crossings = bonus
- Difficulty slider: 2-input/1-output (easy) → 4-input/2-output (hard)

### Interaction Model
- **Drag & drop** gates from a toolbox onto the breadboard
- **Click & drag** to draw wires between gate pins
- **Click gate** to rotate or delete
- **Run button** animates signal flow through the circuit (signals light up as 0/1)
- **Truth table** displayed on the side, rows light up green/red as circuit is tested
- **Step mode** for debugging: advance one input combination at a time

## 4. Aesthetic: Skeuomorphic Breadboard
- Background looks like a real white breadboard with grid holes
- Gates look like IC chips (black rectangles with pin legs)
- Wires look like colored jumper wires (red=1/high, blue=0/low during simulation)
- Toolbox looks like a parts bin on the side
- LED indicators at outputs glow red/green
- Optional: subtle PCB trace patterns, component shadows, slight 3D depth

## 5. Requirements

### Must-Have (P0)
- Drag-and-drop gate placement on canvas
- Wire drawing between gate pins
- Circuit simulation (evaluate truth table)
- At least 5 curated levels with progressive difficulty
- Visual feedback: signal flow animation, correct/incorrect indicators
- Works on desktop browsers (Chrome, Firefox, Safari)
- Hosted on GitHub Pages

### Should-Have (P1)
- 15+ curated campaign levels across 3+ chapters
- Challenge mode with procedural truth table generation
- Gate unlocking progression
- Mobile touch support
- Score/star rating per level
- Undo/redo

### Nice-to-Have (P2)
- Sound effects (click, wire connect, success jingle)
- Level select screen with progress tracking (localStorage)
- "Build with only NAND gates" constraint challenges
- Share circuit as URL
- Dark mode PCB variant aesthetic

## 6. Technical Constraints
- **Hosting**: GitHub Pages (static files only, no backend)
- **Format**: Multi-file web app (HTML/CSS/JS, no frameworks required but allowed)
- **Repo**: New repo under mikedyan GitHub account
- **State**: localStorage for progress persistence
- **No dependencies on npm/build tools** — should work with just static file serving
- **Performance**: Must handle circuits with 20+ gates smoothly

## 7. Architecture (Suggested)
```
signal-circuit/
├── index.html          # Entry point
├── css/
│   └── style.css       # Breadboard aesthetic
├── js/
│   ├── main.js         # App initialization
│   ├── canvas.js       # Breadboard canvas & rendering
│   ├── gates.js        # Gate definitions & logic
│   ├── wires.js        # Wire drawing & routing
│   ├── simulation.js   # Circuit evaluation engine
│   ├── levels.js       # Level definitions & progression
│   └── ui.js           # Toolbox, menus, HUD
├── assets/
│   └── (gate sprites, breadboard textures if needed)
└── README.md
```

## 8. Open Questions
- Canvas renderer: HTML5 Canvas vs SVG vs DOM elements? (Canvas probably best for performance with many wires)
- Wire routing: free-form drawing or snap-to-grid Manhattan routing?
- Should gates be resizable or fixed size?
- Multi-bit buses in later levels or always single-wire?
