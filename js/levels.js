// levels.js — Level definitions, chapters, and star thresholds

const CHAPTERS = [
  {
    id: 1, title: 'Chapter 1: Basics', levels: [1, 2, 3, 4, 5, 6],
    narrative: 'Navigation Systems',
    storyIntro: 'The ship\'s navigation array is dark. These basic logic circuits need repair before we can steer.',
    storyComplete: '🛸 Navigation systems online! The ship can steer again.',
    gatesMastered: ['AND', 'OR', 'NOT'],
    color: '#00cc44',
  },
  {
    id: 2, title: 'Chapter 2: Combinations', levels: [7, 8, 9, 10, 11, 12],
    narrative: 'Communications Array',
    storyIntro: 'Communications are jammed. These combination circuits route encrypted signals.',
    storyComplete: '📡 Communications restored! We can reach mission control.',
    gatesMastered: ['XOR', 'De Morgan\'s Laws'],
    color: '#00c8e8',
  },
  {
    id: 3, title: 'Chapter 3: Multi-Output', levels: [13, 14, 15, 16, 17],
    narrative: 'Life Support',
    storyIntro: 'Life support is failing. These multi-output circuits control oxygen, temperature, and pressure.',
    storyComplete: '🌬️ Life support fully operational! The crew is safe.',
    gatesMastered: ['Half Adder', 'Full Adder', 'MUX', 'Majority'],
    color: '#c050f0',
  },
  {
    id: 4, title: 'Chapter 4: Advanced Systems', levels: [18, 19, 20, 21, 22],
    narrative: 'Warp Drive',
    storyIntro: 'The warp drive controller needs advanced logic. Decoders, comparators, and arithmetic — the heart of faster-than-light travel.',
    storyComplete: '🚀 Warp drive online! The ship is ready for interstellar travel.',
    gatesMastered: ['Decoder', 'Comparator', 'MUX', 'Ripple Adder'],
    color: '#ff6644',
  },
];

const LEVELS = [
  // ── Chapter 1: Basics ──
  {
    id: 1,
    title: 'AND Gate Basics',
    description: 'Output is 1 only when BOTH inputs are 1.',
    postSolveInsight: '🔓 The AND gate is the foundation of digital logic — like a series circuit where both switches must be ON for current to flow.\n🛸 Navigation sensor #1 responding.',
    hints: [
      'This gate only outputs 1 when BOTH inputs are 1. Which gate does that?',
      'You only need 1 gate for this level.',
      'Focus on connecting both inputs to your gate and routing the result out.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['AND'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 2,
    title: 'NOT Gate — Inversion',
    description: 'Output is the OPPOSITE of the input.',
    postSolveInsight: '🔓 NOT (also called an inverter) is the simplest gate — built from a single transistor. It flips 0→1 and 1→0.\n🛸 Signal inverter calibrated.',
    hints: [
      'The output is always the opposite of the input. What operation flips a signal?',
      'A single gate is all you need here.',
      'The signal flows from left to right — input to output, through one gate.'
    ],
    hintHighlights: ['A', 'OUT'],
    availableGates: ['NOT'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 200 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0], outputs: [1] },
      { inputs: [1], outputs: [0] },
    ],
  },
  {
    id: 3,
    title: 'OR Gate — Any Will Do',
    description: 'Output is 1 when ANY input is 1. Only 0 when both inputs are 0.',
    postSolveInsight: '🔓 OR is like a parallel circuit — if ANY path is active, current flows through. Fundamental to decision-making in hardware.\n🛸 Backup navigation path established.',
    hints: [
      'The output is 1 if ANY input is 1. Only 0 when everything is 0.',
      'One gate handles this directly.',
      'Both inputs need to reach the same gate, and its result goes to the output.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['OR'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 4,
    title: 'Build a NAND',
    description: 'Study the truth table carefully — compare it to Level 1. What\'s different about every single output?',
    postSolveInsight: '🔓 NAND = NOT(AND). The NAND gate is special — it\'s "universal," meaning you can build ANY other gate from just NANDs!\n🛸 Course correction circuit online.',
    hints: [
      'Compare this truth table to Level 1\'s AND. What\'s different about every single output?',
      'You need 2 gates — one to compute, one to transform the result.',
      'Think about what happens when you chain two operations in sequence.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['AND', 'NOT'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },
  {
    id: 5,
    title: 'Build a NOR',
    description: 'Study the truth table carefully. What pattern do you notice when you compare each output to what you\'d expect?',
    postSolveInsight: '🔓 NOR = NOT(OR). Like NAND, NOR is also a universal gate — all of digital logic can be built from NOR gates alone!\n🛸 Navigation array fully operational!',
    hints: [
      'Compare this truth table to Level 3\'s OR. Every output is flipped!',
      'Same pattern as Level 4 — 2 gates in sequence.',
      'Apply the same chaining trick you used before, but with a different starting gate.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['OR', 'NOT'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },

  // ── Bridge: Basics → Combinations ──
  {
    id: 6,
    title: 'Signal Selector',
    description: 'Use AND and NOT together: output B only when A is 0. When A is 1, output 0.',
    postSolveInsight: '🔓 You just built an "inhibit" gate — it blocks signal B when control signal A is active. Used in priority circuits!\n🛸 Signal filtering ready for comms array.',
    hints: [
      'When A=0, the output should equal B. When A=1, the output should always be 0.',
      'You need to "gate" B based on A. What if you inverted A first?',
      'NOT(A) gives you a control signal. AND that with B to get the answer.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['AND', 'OR', 'NOT'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },

  // ── Chapter 2: Combinations ──
  {
    id: 7,
    title: 'XOR — Exclusive Or',
    description: 'Output is 1 when the inputs are DIFFERENT. Same inputs give 0, different inputs give 1.',
    postSolveInsight: '🔓 XOR (exclusive or) is the "difference detector" — fundamental to binary addition and error-checking in data transmission.\n📡 Signal differentiator back online.',
    // renumbered from 6
    hints: [
      'Output is 1 when inputs DIFFER. Same inputs give 0, different give 1.',
      'You have one new gate that does exactly this. Single gate solution.',
      'Just connect both inputs through your gate to the output — straightforward routing.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['XOR'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },
  {
    id: 8,
    title: 'XNOR — Same Detector',
    description: 'Study this truth table. When does the output turn on?',
    postSolveInsight: '🔓 XNOR = NOT(XOR). Also called an "equivalence gate" — it checks if two signals match. Used in comparator circuits.\n📡 Signal verification module repaired.',
    hints: [
      'The opposite of XOR — outputs 1 when inputs are the SAME.',
      'You\'ve seen this pattern before: compute something, then flip it. 2 gates.',
      'Remember what you learned in Levels 4 and 5 about inverting a gate\'s result.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['XOR', 'NOT'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 9,
    title: 'AND from OR + NOT',
    description: 'You recognize this truth table from Level 1 — but your toolbox is different this time.',
    postSolveInsight: '🔓 De Morgan\'s Law: AND(A,B) = NOT(OR(NOT(A), NOT(B))). Augustus De Morgan proved these gate equivalences in the 1800s!\n📡 Encrypted channel decoder restored.',
    hints: [
      'De Morgan\'s insight: you can build AND using only OR and NOT gates.',
      'You need 4 gates total. Think about what needs to happen to EACH input before combining.',
      'What if you transformed both inputs individually, combined the results, then transformed one more time?'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['OR', 'NOT'],
    optimalGates: 4,
    goodGates: 5,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 10,
    title: 'OR from AND + NOT',
    description: 'Another familiar truth table, another unfamiliar toolbox. What will you discover?',
    postSolveInsight: '🔓 De Morgan\'s Other Law: OR(A,B) = NOT(AND(NOT(A), NOT(B))). AND and OR are duals — each can be built from the other plus NOT.\n📡 Redundant signal path established.',
    hints: [
      'De Morgan\'s other law: you can build OR using only AND and NOT gates.',
      'Same structure as Level 8 but with different gates — 4 gates total.',
      'Mirror what you did in Level 8, swapping the combining gate type.'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['AND', 'NOT'],
    optimalGates: 4,
    goodGates: 5,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 11,
    title: 'The Implication',
    description: 'Most of this truth table outputs 1. Study the one exception carefully.',
    postSolveInsight: '🔓 A→B = OR(NOT(A), B). Material implication is the foundation of formal logic and programming conditionals. Just 2 gates!\n📡 Communications array fully operational!',
    hints: [
      'A→B is only false when A is true but B isn\'t. All other cases are true.',
      'Just 2 gates needed. What if you transformed one input before combining?',
      'Only one of the two inputs needs modification — which one makes the pattern work?'
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },

  // ── Bridge: Combinations → Multi-Output ──
  {
    id: 12,
    title: 'Dual Output Router',
    description: 'Two outputs from two inputs. Route input A to output X, and compute A OR B to output Y. Your first multi-output puzzle!',
    postSolveInsight: '🔓 Multi-output circuits share inputs but produce independent results. This is how real chips work — one input bus, many output signals!\n📡 Multi-channel router calibrated for life support.',
    hints: [
      'Two separate outputs need two separate circuits — but they can share the same inputs.',
      'Output X just needs to copy A directly. Output Y combines A and B.',
      'X = A (just wire it). Y = A OR B. Two tasks, one workspace.'
    ],
    hintHighlights: ['A', 'B', 'X', 'Y'],
    availableGates: ['AND', 'OR', 'NOT'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'X', x: 600, y: 130 },
      { label: 'Y', x: 600, y: 270 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0, 0] },
      { inputs: [0, 1], outputs: [0, 1] },
      { inputs: [1, 0], outputs: [1, 1] },
      { inputs: [1, 1], outputs: [1, 1] },
    ],
  },

  // ── Chapter 3: Multi-Output ──
  {
    id: 13,
    title: 'Half Adder',
    description: 'Add two single-bit numbers. SUM is the single-digit result, CARRY is what overflows to the next column. Two outputs!',
    postSolveInsight: '🔓 Half Adder: SUM = XOR(A,B), CARRY = AND(A,B). This is literally how computers add numbers at the hardware level!\n🌬️ Oxygen regulator calculations restored.',
    hints: [
      'Two outputs! Think of binary addition: what\'s the single-digit result, and what carries over?',
      'You need 2 gates — one for each output. Each gate type matches a different output.',
      'Both gates share the same two inputs but produce different aspects of addition.'
    ],
    hintHighlights: ['A', 'B', 'SUM', 'CARRY'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'SUM', x: 600, y: 130 },
      { label: 'CARRY', x: 600, y: 270 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0, 0] },
      { inputs: [0, 1], outputs: [1, 0] },
      { inputs: [1, 0], outputs: [1, 0] },
      { inputs: [1, 1], outputs: [0, 1] },
    ],
  },
  {
    id: 14,
    title: '3-Input AND',
    description: 'Output is 1 only when ALL THREE inputs are 1. You have three inputs but your gates only take two...',
    postSolveInsight: '🔓 Chaining 2-input gates to handle more inputs is how real CPUs scale up — daisy-chaining is everywhere in hardware design.\n🌬️ Triple-sensor safety interlock engaged.',
    hints: [
      'All three inputs must be 1 for the output to be 1. But your gates only take 2 inputs...',
      'You need 2 gates. Chain them together to handle all 3 inputs.',
      'Combine two inputs first, then combine that intermediate result with the third.'
    ],
    hintHighlights: ['A', 'B', 'C', 'OUT'],
    availableGates: ['AND'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'C', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 1], outputs: [0] },
      { inputs: [0, 1, 0], outputs: [0] },
      { inputs: [0, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0], outputs: [0] },
      { inputs: [1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 0], outputs: [0] },
      { inputs: [1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 15,
    title: 'Majority Vote',
    description: 'Output 1 when 2 or more of the 3 inputs are 1. Think: "at least 2 out of 3 agree."',
    postSolveInsight: '🔓 Majority(A,B,C) = OR(AND(A,B), AND(B,C), AND(A,C)). Majority voting is used in fault-tolerant systems like spacecraft computers!\n🌬️ Fault-tolerant temperature control online.',
    hints: [
      'Output is 1 when at least 2 of 3 inputs agree. Think about checking pairs.',
      'You need 5 gates — check each possible pair, then combine all the pair results.',
      'Three pairs exist among three inputs. If any pair is both 1, the majority passes.'
    ],
    hintHighlights: ['A', 'B', 'C', 'OUT'],
    availableGates: ['AND', 'OR'],
    optimalGates: 5,
    goodGates: 6,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'C', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 1], outputs: [0] },
      { inputs: [0, 1, 0], outputs: [0] },
      { inputs: [0, 1, 1], outputs: [1] },
      { inputs: [1, 0, 0], outputs: [0] },
      { inputs: [1, 0, 1], outputs: [1] },
      { inputs: [1, 1, 0], outputs: [1] },
      { inputs: [1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 16,
    title: 'Multiplexer',
    description: 'Three inputs, one output. The third input changes which of the other two reaches the output.',
    postSolveInsight: '🔓 MUX = OR(AND(A, NOT(S)), AND(B, S)). Multiplexers are the "railroad switches" of digital circuits — they route data.\n🌬️ Pressure valve selector repaired.',
    hints: [
      'Think about what happens when S=0: only A matters. When S=1: only B matters. How can you use S to "enable" one path and "disable" the other?',
      'You need 4 gates. One gate prepares S, two gates each handle one input path, and one gate combines the results.',
      'Each input (A and B) needs its own AND gate to be "gated" by S or its inverse. Then combine both paths.'
    ],
    hintHighlights: ['A', 'B', 'S', 'OUT'],
    availableGates: ['AND', 'OR', 'NOT'],
    optimalGates: 4,
    goodGates: 5,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'S', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 1], outputs: [0] },
      { inputs: [0, 1, 0], outputs: [0] },
      { inputs: [0, 1, 1], outputs: [1] },
      { inputs: [1, 0, 0], outputs: [1] },
      { inputs: [1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 0], outputs: [1] },
      { inputs: [1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 17,
    title: 'Full Adder',
    description: 'The boss level! Add three single-bit numbers (A + B + carry-in) and produce SUM and CARRY outputs.',
    postSolveInsight: '🔓 Full Adder: SUM = XOR(XOR(A,B), Cin), CARRY = OR(AND(A,B), AND(Cin, XOR(A,B))). Chain these together and you\'ve built a CPU\'s arithmetic unit!\n🌬️ Life support fully operational! All systems go.',
    hints: [
      'Think of it as two half-adders chained together. What does a half adder (Level 11) produce?',
      '5 gates total. First, add A and B (like Level 11). Then add that partial result with Cin. The carries from both additions combine.',
      'SUM comes from XORing inputs step by step. CARRY is trickier — there are two situations that generate a carry. OR them together.'
    ],
    hintHighlights: ['A', 'B', 'Cin', 'SUM', 'CARRY'],
    availableGates: ['AND', 'OR', 'XOR'],
    optimalGates: 5,
    goodGates: 6,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'Cin', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'SUM', x: 600, y: 130 },
      { label: 'CARRY', x: 600, y: 270 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0, 0] },
      { inputs: [0, 0, 1], outputs: [1, 0] },
      { inputs: [0, 1, 0], outputs: [1, 0] },
      { inputs: [0, 1, 1], outputs: [0, 1] },
      { inputs: [1, 0, 0], outputs: [1, 0] },
      { inputs: [1, 0, 1], outputs: [0, 1] },
      { inputs: [1, 1, 0], outputs: [0, 1] },
      { inputs: [1, 1, 1], outputs: [1, 1] },
    ],
  },

  // ── Chapter 4: Advanced Systems (Warp Drive) ──
  {
    id: 18,
    title: '2-to-4 Decoder',
    description: 'Route a 2-bit address to exactly one of four output channels. Only the selected channel fires.',
    postSolveInsight: '🔓 Decoders convert binary addresses into one-hot signals. Every memory chip uses them to select which storage cell to read.\n🚀 Warp channel routing initialized.',
    hints: [
      'Each output should be 1 for exactly one combination of inputs. Y0 fires when both inputs are 0.',
      'You need to create both the normal and inverted versions of each input. Start with two NOT gates.',
      'Y0 = NOT(A) AND NOT(B). Y1 = NOT(A) AND B. Y2 = A AND NOT(B). Y3 = A AND B. Share the NOT outputs!'
    ],
    hintHighlights: ['A', 'B', 'Y0', 'Y1', 'Y2', 'Y3'],
    availableGates: ['AND', 'OR', 'NOT'],
    optimalGates: 6,
    goodGates: 8,
    inputs: [
      { label: 'A', x: 60, y: 160 },
      { label: 'B', x: 60, y: 240 },
    ],
    outputs: [
      { label: 'Y0', x: 600, y: 70 },
      { label: 'Y1', x: 600, y: 160 },
      { label: 'Y2', x: 600, y: 250 },
      { label: 'Y3', x: 600, y: 340 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1, 0, 0, 0] },
      { inputs: [0, 1], outputs: [0, 1, 0, 0] },
      { inputs: [1, 0], outputs: [0, 0, 1, 0] },
      { inputs: [1, 1], outputs: [0, 0, 0, 1] },
    ],
  },
  {
    id: 19,
    title: 'Equality Comparator',
    description: 'Compare two 2-bit numbers. Output 1 if they\'re equal, 0 if they\'re different.',
    postSolveInsight: '🔓 Equality comparison is the backbone of conditional logic — every "if (x == y)" in code compiles down to circuits like this one.\n🚀 Sensor calibration comparator online.',
    hints: [
      'Two numbers are equal when EVERY bit matches. Compare bit-by-bit, then combine the results.',
      'XOR outputs 1 when bits differ. So NOT(XOR) tells you when two bits match.',
      'EQ = NOT(XOR(A1,B1)) AND NOT(XOR(A0,B0)). Five gates total.'
    ],
    hintHighlights: ['A1', 'A0', 'B1', 'B0', 'EQ'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 5,
    goodGates: 7,
    inputs: [
      { label: 'A1', x: 60, y: 80 },
      { label: 'A0', x: 60, y: 160 },
      { label: 'B1', x: 60, y: 250 },
      { label: 'B0', x: 60, y: 330 },
    ],
    outputs: [
      { label: 'EQ', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0, 0], outputs: [1] },
      { inputs: [0, 0, 0, 1], outputs: [0] },
      { inputs: [0, 0, 1, 0], outputs: [0] },
      { inputs: [0, 0, 1, 1], outputs: [0] },
      { inputs: [0, 1, 0, 0], outputs: [0] },
      { inputs: [0, 1, 0, 1], outputs: [1] },
      { inputs: [0, 1, 1, 0], outputs: [0] },
      { inputs: [0, 1, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0, 0], outputs: [0] },
      { inputs: [1, 0, 0, 1], outputs: [0] },
      { inputs: [1, 0, 1, 0], outputs: [1] },
      { inputs: [1, 0, 1, 1], outputs: [0] },
      { inputs: [1, 1, 0, 0], outputs: [0] },
      { inputs: [1, 1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 1, 0], outputs: [0] },
      { inputs: [1, 1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 20,
    title: 'Greater-Than Comparator',
    description: 'Compare two 2-bit numbers A and B. Output GT=1 when A is strictly greater than B.',
    postSolveInsight: '🔓 Magnitude comparators chain bit-by-bit from most significant to least. CPUs use cascaded comparators for sorting and branching.\n🚀 Power level comparator calibrated.',
    hints: [
      'A > B happens in two cases: the high bit of A wins (A1=1, B1=0), OR the high bits match and the low bit of A wins.',
      'First check the high bits: A1 AND NOT(B1) means A\'s MSB is bigger. For the "tie" case, use XNOR on the high bits.',
      'GT = (A1 AND NOT(B1)) OR (NOT(XOR(A1,B1)) AND A0 AND NOT(B0)). The textbook uses 8 gates — but AND(A, XOR(A,B)) = A·NOT(B), saving a NOT gate.'
    ],
    hintHighlights: ['A1', 'A0', 'B1', 'B0', 'GT'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 7,
    goodGates: 9,
    inputs: [
      { label: 'A1', x: 60, y: 80 },
      { label: 'A0', x: 60, y: 160 },
      { label: 'B1', x: 60, y: 250 },
      { label: 'B0', x: 60, y: 330 },
    ],
    outputs: [
      { label: 'GT', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 0, 1], outputs: [0] },
      { inputs: [0, 0, 1, 0], outputs: [0] },
      { inputs: [0, 0, 1, 1], outputs: [0] },
      { inputs: [0, 1, 0, 0], outputs: [1] },
      { inputs: [0, 1, 0, 1], outputs: [0] },
      { inputs: [0, 1, 1, 0], outputs: [0] },
      { inputs: [0, 1, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0, 0], outputs: [1] },
      { inputs: [1, 0, 0, 1], outputs: [1] },
      { inputs: [1, 0, 1, 0], outputs: [0] },
      { inputs: [1, 0, 1, 1], outputs: [0] },
      { inputs: [1, 1, 0, 0], outputs: [1] },
      { inputs: [1, 1, 0, 1], outputs: [1] },
      { inputs: [1, 1, 1, 0], outputs: [1] },
      { inputs: [1, 1, 1, 1], outputs: [0] },
    ],
  },
  {
    id: 21,
    title: '2-Bit Multiplexer',
    description: 'Select between two 2-bit numbers. When SEL=0, output A. When SEL=1, output B.',
    postSolveInsight: '🔓 Wide multiplexers route entire data buses based on a control signal. This is how CPUs choose between register values, memory paths, and ALU results.\n🚀 Warp field data bus selector active.',
    hints: [
      'Each output bit follows the same pattern: pass A\'s bit when SEL=0, pass B\'s bit when SEL=1.',
      'For each output: (NOT(SEL) AND A_bit) OR (SEL AND B_bit). You can share the NOT(SEL) signal.',
      'Y1 = (NOT(SEL) AND A1) OR (SEL AND B1). Same pattern for Y0. Seven gates total — share the NOT.'
    ],
    hintHighlights: ['A1', 'A0', 'B1', 'B0', 'SEL', 'Y1', 'Y0'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 7,
    goodGates: 8,
    inputs: [
      { label: 'A1', x: 60, y: 60 },
      { label: 'A0', x: 60, y: 130 },
      { label: 'B1', x: 60, y: 210 },
      { label: 'B0', x: 60, y: 280 },
      { label: 'SEL', x: 60, y: 360 },
    ],
    outputs: [
      { label: 'Y1', x: 600, y: 130 },
      { label: 'Y0', x: 600, y: 270 },
    ],
    truthTable: [
      // SEL=0: output A (A1,A0). SEL=1: output B (B1,B0)
      // Inputs: A1, A0, B1, B0, SEL
      { inputs: [0, 0, 0, 0, 0], outputs: [0, 0] },
      { inputs: [0, 0, 0, 0, 1], outputs: [0, 0] },
      { inputs: [0, 0, 0, 1, 0], outputs: [0, 0] },
      { inputs: [0, 0, 0, 1, 1], outputs: [0, 1] },
      { inputs: [0, 0, 1, 0, 0], outputs: [0, 0] },
      { inputs: [0, 0, 1, 0, 1], outputs: [1, 0] },
      { inputs: [0, 0, 1, 1, 0], outputs: [0, 0] },
      { inputs: [0, 0, 1, 1, 1], outputs: [1, 1] },
      { inputs: [0, 1, 0, 0, 0], outputs: [0, 1] },
      { inputs: [0, 1, 0, 0, 1], outputs: [0, 0] },
      { inputs: [0, 1, 0, 1, 0], outputs: [0, 1] },
      { inputs: [0, 1, 0, 1, 1], outputs: [0, 1] },
      { inputs: [0, 1, 1, 0, 0], outputs: [0, 1] },
      { inputs: [0, 1, 1, 0, 1], outputs: [1, 0] },
      { inputs: [0, 1, 1, 1, 0], outputs: [0, 1] },
      { inputs: [0, 1, 1, 1, 1], outputs: [1, 1] },
      { inputs: [1, 0, 0, 0, 0], outputs: [1, 0] },
      { inputs: [1, 0, 0, 0, 1], outputs: [0, 0] },
      { inputs: [1, 0, 0, 1, 0], outputs: [1, 0] },
      { inputs: [1, 0, 0, 1, 1], outputs: [0, 1] },
      { inputs: [1, 0, 1, 0, 0], outputs: [1, 0] },
      { inputs: [1, 0, 1, 0, 1], outputs: [1, 0] },
      { inputs: [1, 0, 1, 1, 0], outputs: [1, 0] },
      { inputs: [1, 0, 1, 1, 1], outputs: [1, 1] },
      { inputs: [1, 1, 0, 0, 0], outputs: [1, 1] },
      { inputs: [1, 1, 0, 0, 1], outputs: [0, 0] },
      { inputs: [1, 1, 0, 1, 0], outputs: [1, 1] },
      { inputs: [1, 1, 0, 1, 1], outputs: [0, 1] },
      { inputs: [1, 1, 1, 0, 0], outputs: [1, 1] },
      { inputs: [1, 1, 1, 0, 1], outputs: [1, 0] },
      { inputs: [1, 1, 1, 1, 0], outputs: [1, 1] },
      { inputs: [1, 1, 1, 1, 1], outputs: [1, 1] },
    ],
  },
  {
    id: 22,
    title: '2-Bit Ripple Adder',
    description: 'The ultimate challenge! Add two 2-bit numbers (A1:A0 + B1:B0) and produce the 3-bit result (Cout:S1:S0).',
    postSolveInsight: '🔓 You just built a 2-bit ripple carry adder — chain four of these together and you have an 8-bit adder, the arithmetic heart of early CPUs like the Intel 8080.\n🚀 Warp drive arithmetic unit operational! Ready for light speed.',
    hints: [
      'Break it into two stages: add the low bits first (A0 + B0 → S0 and carry), then add the high bits with that carry.',
      'Stage 1 is a half adder: S0 = XOR(A0,B0), C0 = AND(A0,B0). Stage 2 is a full adder on A1, B1, and C0.',
      'Full adder: S1 = XOR(XOR(A1,B1), C0). Cout = OR(AND(A1,B1), AND(C0, XOR(A1,B1))). Seven gates total.'
    ],
    hintHighlights: ['A1', 'A0', 'B1', 'B0', 'S1', 'S0', 'Cout'],
    availableGates: ['AND', 'OR', 'XOR'],
    optimalGates: 7,
    goodGates: 9,
    inputs: [
      { label: 'A1', x: 60, y: 80 },
      { label: 'A0', x: 60, y: 170 },
      { label: 'B1', x: 60, y: 260 },
      { label: 'B0', x: 60, y: 350 },
    ],
    outputs: [
      { label: 'Cout', x: 600, y: 90 },
      { label: 'S1', x: 600, y: 200 },
      { label: 'S0', x: 600, y: 310 },
    ],
    truthTable: [
      // A1 A0 B1 B0 → Cout S1 S0  (matches 3-bit result order)
      { inputs: [0, 0, 0, 0], outputs: [0, 0, 0] },  // 0+0=000
      { inputs: [0, 0, 0, 1], outputs: [0, 0, 1] },  // 0+1=001
      { inputs: [0, 0, 1, 0], outputs: [0, 1, 0] },  // 0+2=010
      { inputs: [0, 0, 1, 1], outputs: [0, 1, 1] },  // 0+3=011
      { inputs: [0, 1, 0, 0], outputs: [0, 0, 1] },  // 1+0=001
      { inputs: [0, 1, 0, 1], outputs: [0, 1, 0] },  // 1+1=010
      { inputs: [0, 1, 1, 0], outputs: [0, 1, 1] },  // 1+2=011
      { inputs: [0, 1, 1, 1], outputs: [1, 0, 0] },  // 1+3=100
      { inputs: [1, 0, 0, 0], outputs: [0, 1, 0] },  // 2+0=010
      { inputs: [1, 0, 0, 1], outputs: [0, 1, 1] },  // 2+1=011
      { inputs: [1, 0, 1, 0], outputs: [1, 0, 0] },  // 2+2=100
      { inputs: [1, 0, 1, 1], outputs: [1, 0, 1] },  // 2+3=101
      { inputs: [1, 1, 0, 0], outputs: [0, 1, 1] },  // 3+0=011
      { inputs: [1, 1, 0, 1], outputs: [1, 0, 0] },  // 3+1=100
      { inputs: [1, 1, 1, 0], outputs: [1, 0, 1] },  // 3+2=101
      { inputs: [1, 1, 1, 1], outputs: [1, 1, 0] },  // 3+3=110
    ],
  },
];

// ── Daily Challenge Generator ──
function generateDailyChallenge() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Simple seeded PRNG
  let s = seed;
  function rand() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  }

  const numInputs = Math.floor(rand() * 2) + 2; // 2-3 inputs
  const numOutputs = 1;
  const numRows = Math.pow(2, numInputs);

  // Generate random truth table
  const truthTable = [];
  for (let i = 0; i < numRows; i++) {
    const inputs = [];
    for (let j = numInputs - 1; j >= 0; j--) {
      inputs.push((i >> j) & 1);
    }
    const outputs = [Math.round(rand())];
    truthTable.push({ inputs, outputs });
  }

  const labels = ['A', 'B', 'C', 'D'];
  const inputs = [];
  for (let i = 0; i < numInputs; i++) {
    inputs.push({ label: labels[i], x: 60, y: 100 + i * 120 });
  }

  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    id: 'daily',
    title: `Daily Challenge — ${dateStr}`,
    description: `Today's unique puzzle! Build the circuit that matches this truth table. New puzzle every day.`,
    hints: [],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: numInputs + 1,
    goodGates: numInputs + 3,
    inputs,
    outputs: [{ label: 'OUT', x: 600, y: 100 + ((numInputs - 1) * 120) / 2 }],
    truthTable,
    isDaily: true,
  };
}

function getLevel(id) {
  return LEVELS.find(l => l.id === id) || null;
}

function getLevelCount() {
  return LEVELS.length;
}

function getChapters() {
  return CHAPTERS;
}

// #91: Cross-level "Used In" forward references
function getForwardReferences(levelId) {
  const level = getLevel(levelId);
  if (!level || !level.availableGates) return [];
  const gates = new Set(level.availableGates);
  const refs = [];
  for (const other of LEVELS) {
    if (other.id <= levelId) continue;
    if (other.availableGates && other.availableGates.some(g => gates.has(g))) {
      refs.push(other.id);
    }
  }
  return refs;
}

// ── Procedural Challenge Generator ──

// Curated challenge patterns — interesting logic functions
const CURATED_CHALLENGES = {
  '2x1': [
    { name: 'NAND', table: [1,1,1,0] },
    { name: 'NOR', table: [1,0,0,0] },
    { name: 'XNOR', table: [1,0,0,1] },
    { name: 'Implication', table: [1,1,0,1] },
    { name: 'Converse', table: [1,0,1,1] },
    { name: 'Inhibition', table: [0,0,1,0] },
  ],
  '2x2': [
    { name: 'Half Adder', table: [[0,0],[1,0],[1,0],[0,1]] },
    { name: 'Comparator', table: [[1,0],[0,1],[1,0],[1,0]] },
    { name: 'Swap Detect', table: [[0,0],[1,1],[1,1],[0,0]] },
    { name: 'Priority', table: [[0,0],[0,1],[1,0],[1,1]] },
  ],
  '3x1': [
    { name: 'Majority', table: [0,0,0,1,0,1,1,1] },
    { name: 'Parity', table: [0,1,1,0,1,0,0,1] },
    { name: 'Threshold-2', table: [0,0,0,1,0,1,1,1] },
    { name: 'Any-Two', table: [0,0,0,1,0,1,1,1] },
    { name: 'Exactly-One', table: [0,1,1,0,1,0,0,0] },
    { name: 'Carry-Out', table: [0,0,0,1,0,1,1,1] },
    { name: 'Odd-Parity', table: [0,1,1,0,1,0,0,1] },
    { name: 'Mux-Select', table: [0,0,1,1,0,1,0,1] },
  ],
  '3x2': [
    { name: 'Full Adder', table: [[0,0],[1,0],[1,0],[0,1],[1,0],[0,1],[0,1],[1,1]] },
    { name: 'Compare & Flag', table: [[0,0],[0,1],[0,1],[0,0],[1,0],[0,0],[0,0],[0,0]] },
    { name: 'Encode', table: [[0,0],[0,1],[1,0],[1,1],[0,0],[0,1],[1,0],[1,1]] },
  ],
  '4x1': [
    { name: 'Even Parity', table: [1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1] },
    { name: 'Majority-4', table: [0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1] },
    { name: 'At-Least-3', table: [0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,1] },
    { name: 'Exactly-Two', table: [0,0,0,1,0,1,1,0,0,1,1,0,1,0,0,0] },
  ],
  '4x2': [
    { name: '2-Bit Adder', table: [[0,0],[0,1],[1,0],[1,1],[0,1],[1,0],[1,1],[0,0],[1,0],[1,1],[0,0],[0,1],[1,1],[0,0],[0,1],[1,0]] },
  ],
};

function generateChallenge(numInputs, numOutputs) {
  const numRows = Math.pow(2, numInputs);
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : ['X', 'Y'];

  // Try curated patterns first
  const key = `${numInputs}x${numOutputs}`;
  const curated = CURATED_CHALLENGES[key];
  let truthTable;
  let challengeName = null;

  if (curated && curated.length > 0 && Math.random() < 0.7) {
    const pick = curated[Math.floor(Math.random() * curated.length)];
    challengeName = pick.name;
    truthTable = [];
    for (let r = 0; r < numRows; r++) {
      const inputs = [];
      for (let i = numInputs - 1; i >= 0; i--) {
        inputs.push((r >> i) & 1);
      }
      const outputs = numOutputs === 1
        ? [pick.table[r]]
        : pick.table[r];
      truthTable.push({ inputs, outputs });
    }
  } else {
    // Fallback to random generation
    let attempts = 0;
    do {
      truthTable = [];
      const outputColumns = [];
      for (let o = 0; o < numOutputs; o++) {
        outputColumns.push(generateNonDegenerateColumn(numRows, numInputs));
      }

      for (let r = 0; r < numRows; r++) {
        const inputs = [];
        for (let i = numInputs - 1; i >= 0; i--) {
          inputs.push((r >> i) & 1);
        }
        const outputs = outputColumns.map(col => col[r]);
        truthTable.push({ inputs, outputs });
      }
      attempts++;
    } while (!isValidTruthTable(truthTable, numInputs) && attempts < 100);
  }

  // Position I/O nodes based on count
  const canvasHeight = 500;
  const inputSpacing = canvasHeight / (numInputs + 1);
  const outputSpacing = canvasHeight / (numOutputs + 1);

  const inputs = inputLabels.map((label, i) => ({
    label,
    x: 60,
    y: Math.round(inputSpacing * (i + 1)),
  }));

  const outputs = outputLabels.map((label, i) => ({
    label,
    x: 600,
    y: Math.round(outputSpacing * (i + 1)),
  }));

  // Estimate optimal gates based on complexity
  const complexity = numInputs * numOutputs;
  const optimalGates = Math.max(1, complexity);
  const goodGates = optimalGates + 2;

  const difficultyLabel = getDifficultyLabel(numInputs, numOutputs);

  return {
    id: 'challenge',
    title: challengeName ? `${difficultyLabel}: ${challengeName}` : `${difficultyLabel} Challenge`,
    description: challengeName
      ? `Build a "${challengeName}" circuit — ${numInputs} inputs, ${numOutputs} output${numOutputs > 1 ? 's' : ''}.`
      : `Build a circuit matching this ${numInputs}-input, ${numOutputs}-output truth table.`,
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates,
    goodGates,
    inputs,
    outputs,
    truthTable,
    isChallenge: true,
    difficulty: difficultyLabel,
    difficultyKey: `${numInputs}x${numOutputs}`,
  };
}

function generateNonDegenerateColumn(numRows, numInputs) {
  let column;
  let valid = false;
  while (!valid) {
    column = [];
    for (let i = 0; i < numRows; i++) {
      column.push(Math.random() < 0.5 ? 1 : 0);
    }
    // Not all-0 or all-1
    const sum = column.reduce((a, b) => a + b, 0);
    if (sum === 0 || sum === numRows) continue;

    // Not identical to any single input column
    let matchesInput = false;
    for (let inp = 0; inp < numInputs; inp++) {
      let matchNormal = true;
      let matchInverted = true;
      for (let r = 0; r < numRows; r++) {
        const inputBit = (r >> (numInputs - 1 - inp)) & 1;
        if (column[r] !== inputBit) matchNormal = false;
        if (column[r] !== (1 - inputBit)) matchInverted = false;
      }
      if (matchNormal || matchInverted) {
        matchesInput = true;
        break;
      }
    }
    if (!matchesInput) valid = true;
  }
  return column;
}

function isValidTruthTable(truthTable, numInputs) {
  // Check each output column is non-degenerate
  const numOutputs = truthTable[0].outputs.length;
  for (let o = 0; o < numOutputs; o++) {
    const col = truthTable.map(r => r.outputs[o]);
    const sum = col.reduce((a, b) => a + b, 0);
    if (sum === 0 || sum === col.length) return false;
  }
  return true;
}

function getDifficultyLabel(numInputs, numOutputs) {
  const key = `${numInputs}x${numOutputs}`;
  const labels = {
    '2x1': 'Easy',
    '2x2': 'Medium',
    '3x1': 'Medium',
    '3x2': 'Hard',
    '4x1': 'Hard',
    '4x2': 'Expert',
  };
  return labels[key] || 'Medium';
}

function generateSandboxLevel(numInputs, numOutputs) {
  numInputs = numInputs || 2;
  numOutputs = numOutputs || 1;
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : ['X', 'Y'];

  const canvasHeight = 500;
  const inputSpacing = canvasHeight / (numInputs + 1);
  const outputSpacing = canvasHeight / (numOutputs + 1);

  const inputs = inputLabels.map((label, i) => ({
    label,
    x: 60,
    y: Math.round(inputSpacing * (i + 1)),
  }));

  const outputs = outputLabels.slice(0, numOutputs).map((label, i) => ({
    label,
    x: 600,
    y: Math.round(outputSpacing * (i + 1)),
  }));

  const numRows = Math.pow(2, numInputs);
  const truthTable = [];
  for (let r = 0; r < numRows; r++) {
    const inVals = [];
    for (let j = numInputs - 1; j >= 0; j--) {
      inVals.push((r >> j) & 1);
    }
    truthTable.push({ inputs: inVals, outputs: new Array(numOutputs).fill(0) });
  }

  return {
    id: 'sandbox',
    title: 'Sandbox Mode',
    description: `Free build — ${numInputs} inputs, ${numOutputs} output${numOutputs > 1 ? 's' : ''}. Place any gates and test your circuit.`,
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 0,
    goodGates: 0,
    inputs,
    outputs,
    truthTable,
    isSandbox: true,
  };
}
