// levels.js — Level definitions, chapters, and star thresholds

const CHAPTERS = [
  {
    id: 1, title: 'Chapter 1: Basics', levels: [1, 2, 3, 4, 5, 6],
    narrative: 'Navigation Systems',
    storyIntro: 'The ship\'s navigation array is dark. These basic logic circuits need repair before we can steer.',
    storyComplete: '🛸 Navigation systems online! The ship can steer again.',
    gatesMastered: ['AND', 'OR', 'NOT'],
    color: '#00cc44',
    realWorld: {
      title: '🔌 In the Real World',
      fact: 'The AND, OR, and NOT gates you just mastered are inside every microchip. Your phone\'s processor contains billions of them, executing logic just like this — millions of times per second.',
      device: 'Smartphone CPU',
      icon: '📱',
    },
  },
  {
    id: 2, title: 'Chapter 2: Combinations', levels: [7, 8, 9, 10, 11, 12],
    narrative: 'Communications Array',
    storyIntro: 'Communications are jammed. These combination circuits route encrypted signals.',
    storyComplete: '📡 Communications restored! We can reach mission control.',
    gatesMastered: ['XOR', 'De Morgan\'s Laws'],
    color: '#00c8e8',
    realWorld: {
      title: '🔐 In the Real World',
      fact: 'XOR is the backbone of modern encryption. Every time you send a secure message, XOR operations scramble your data. De Morgan\'s Laws let chip designers optimize circuits to use fewer transistors.',
      device: 'Encryption Hardware',
      icon: '🔒',
    },
  },
  {
    id: 3, title: 'Chapter 3: Multi-Output', levels: [13, 14, 15, 16, 17],
    narrative: 'Life Support',
    storyIntro: 'Life support is failing. These multi-output circuits control oxygen, temperature, and pressure.',
    storyComplete: '🌬️ Life support fully operational! The crew is safe.',
    gatesMastered: ['Half Adder', 'Full Adder', 'MUX', 'Majority'],
    color: '#c050f0',
    realWorld: {
      title: '🧮 In the Real World',
      fact: 'The half and full adders you built are exactly how calculators add numbers. Stack 32 full adders together and you get a 32-bit ALU — the arithmetic brain of a computer.',
      device: 'Calculator / ALU',
      icon: '🧮',
    },
  },
  {
    id: 4, title: 'Chapter 3.5: Systems Check', levels: [18, 19, 20],
    narrative: 'Diagnostics',
    storyIntro: 'Before engaging the warp drive, run a full systems diagnostic. These bridge circuits verify your core skills under new conditions.',
    storyComplete: '✅ All diagnostics passed! Systems verified. You\'re ready for advanced engineering.',
    gatesMastered: ['Decoder Basics', 'Comparator', 'Selector'],
    color: '#9966cc',
    realWorld: {
      title: '🔍 In the Real World',
      fact: 'Before launching any spacecraft, engineers run exhaustive diagnostic tests on every subsystem. These bridge circuits are like pre-flight checks — simpler versions of the complex systems ahead.',
      device: 'Pre-Flight Diagnostic Systems',
      icon: '🔍',
    },
  },
  {
    id: 5, title: 'Chapter 4: Advanced Systems', levels: [21, 22, 23, 24, 25],
    narrative: 'Warp Drive',
    storyIntro: 'The warp drive controller needs advanced logic. Decoders, comparators, and arithmetic — the heart of faster-than-light travel.',
    storyComplete: '🚀 Warp drive online! The ship is ready for interstellar travel.',
    gatesMastered: ['Decoder', 'Comparator', 'MUX', 'Ripple Adder'],
    color: '#ff6644',
    realWorld: {
      title: '🖥️ In the Real World',
      fact: 'Decoders select which memory chip to read from in your computer\'s RAM. Multiplexers route data between components. These circuits are the traffic controllers of every digital system.',
      device: 'Computer Memory',
      icon: '💾',
    },
  },
  {
    id: 6, title: 'Chapter 5: Shield Systems', levels: [26, 27, 28, 29, 30],
    narrative: 'Defense Grid',
    storyIntro: 'The ship enters uncharted space. Cosmic debris and electromagnetic storms batter the hull. Build the shield logic to protect the crew.',
    storyComplete: '🛡️ Shields holding at maximum! The ship glides safely through the cosmic storm.',
    gatesMastered: ['Parity', 'Priority Encoder', 'Subtractor', 'Demux'],
    color: '#FFD700',
    realWorld: {
      title: '🌐 In the Real World',
      fact: 'Parity circuits detect data corruption in network transmissions. Priority encoders handle interrupt signals in CPUs. Every packet of internet data is protected by error-detection logic like yours.',
      device: 'Network Router',
      icon: '🌐',
    },
  },
  {
    id: 7, title: 'Chapter 6: Universal Gates', levels: [31, 32, 33, 34],
    narrative: 'Engine Core',
    storyIntro: 'Deep in the engine room, the core logic is built from universal gates. NAND and NOR can each build ANY other gate — master them to unlock the ship\'s true potential.',
    storyComplete: '⚛️ Engine core fully rebuilt! With universal gates, you can build anything. The ship is limitless.',
    gatesMastered: ['NAND', 'NOR', 'Universality'],
    color: '#cc6600',
    realWorld: {
      title: '🏭 In the Real World',
      fact: 'Modern chip fabrication uses only NAND gates. The Apollo Guidance Computer that flew astronauts to the moon was built entirely from ~5,600 NOR gates. Universal gates prove that simplicity is the ultimate sophistication.',
      device: 'Microprocessor',
      icon: '⚛️',
    },
  },
  {
    id: 8, title: 'Bonus: Dark Gate', levels: [35],
    narrative: 'Unknown Signal',
    storyIntro: 'A mysterious component has been detected in the ship\'s circuitry. Its behavior is unknown. Reverse-engineer it.',
    storyComplete: '🕵️ Mystery component identified! Your analytical skills saved the mission.',
    gatesMastered: ['Reverse Engineering'],
    color: '#666',
    isBonus: true,
    realWorld: {
      title: '🕵️ In the Real World',
      fact: 'Hardware reverse engineering is a real discipline. Engineers probe unknown chips with oscilloscopes and logic analyzers, testing input/output combinations — exactly what you just did.',
      device: 'Logic Analyzer',
      icon: '🔬',
    },
  },
  {
    id: 9, title: 'Chapter 8: Discovery Lab', levels: [36, 37, 38, 39, 40],
    narrative: 'Open Design',
    storyIntro: 'The lab doors open. No rules, no constraints — just truth tables and a full toolbox. Design your way.',
    storyComplete: '🧪 Discovery complete! You\'ve proven that engineering is as much art as science.',
    gatesMastered: ['Creative Design', 'Multi-Phase', 'Constraint Solving'],
    color: '#00E5FF',
    isBonus: true,
    realWorld: {
      title: '🧪 In the Real World',
      fact: 'Real chip designers face open-ended problems daily. There\'s no single right answer — just tradeoffs between speed, size, power, and cost. You\'re thinking like a real engineer now.',
      device: 'ASIC Design Lab',
      icon: '🧪',
    },
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
    postSolveInsight: '🔓 You just built an "inhibit" gate — it blocks signal B when control signal A is active. Used in priority circuits!\n🛸 Signal filters engaged. The comms array is next — and the crew needs to call for help.',
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
    postSolveInsight: '🔓 A→B = OR(NOT(A), B). Material implication is the foundation of formal logic and programming conditionals. Just 2 gates!\n📡 Conditional relay logic restored — one more module to go.',
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
    postSolveInsight: '🔓 Multi-output circuits share inputs but produce independent results. This is how real chips work — one input bus, many output signals!\n📡 Communications array fully operational! Distress signal broadcasting. But life support readings are critical...',
    hints: [
      'Two separate outputs need two separate circuits — but they can share the same inputs.',
      'Output X just needs to copy A directly. Output Y combines A and B.',
      'X = A (just wire it). Y = A OR B. Two tasks, one workspace.'
    ],
    hintHighlights: ['A', 'B', 'X', 'Y'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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
    postSolveInsight: '🔓 Full Adder: SUM = XOR(XOR(A,B), Cin), CARRY = OR(AND(A,B), AND(Cin, XOR(A,B))). Chain these together and you\'ve built a CPU\'s arithmetic unit!\n🌬️ Life support fully restored! The crew can breathe again. Now... let\'s get them home.',
    hints: [
      'Think of it as two half-adders chained together. What does a half adder (Level 11) produce?',
      '5 gates total. First, add A and B (like Level 11). Then add that partial result with Cin. The carries from both additions combine.',
      'SUM comes from XORing inputs step by step. CARRY is trickier — there are two situations that generate a carry. OR them together.'
    ],
    hintHighlights: ['A', 'B', 'Cin', 'SUM', 'CARRY'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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


  // ── Chapter 3.5: Systems Check (Bridge Levels) ──
  {
    id: 18,
    title: '2-Input Decoder',
    description: 'Route a 1-bit address to one of two outputs. When A=0, activate Y0. When A=1, activate Y1. But there\'s a twist: Y0 should also pass through B.',
    postSolveInsight: '🔓 You just built a simple decoder — the building block of address selection. The full 2-to-4 decoder in Chapter 4 extends this exact principle to 2-bit addresses.\n🔍 Diagnostic module 1: decoder circuit verified.',
    hints: [
      'Y0 should output B when A is 0, and 0 when A is 1. Y1 should output B when A is 1, and 0 when A is 0.',
      'Think of A as a selector. NOT(A) "enables" Y0, while A "enables" Y1. Both outputs are gated by B.',
      'Y0 = NOT(A) AND B. Y1 = A AND B. Three gates total: one NOT and two ANDs.'
    ],
    hintHighlights: ['A', 'B', 'Y0', 'Y1'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 3,
    goodGates: 4,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'Y0', x: 600, y: 140 },
      { label: 'Y1', x: 600, y: 260 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0, 0] },
      { inputs: [0, 1], outputs: [1, 0] },
      { inputs: [1, 0], outputs: [0, 0] },
      { inputs: [1, 1], outputs: [0, 1] },
    ],
  },
  {
    id: 19,
    title: 'Bit Comparator',
    description: 'Compare two single bits for equality. Output EQ=1 when A and B have the same value.',
    postSolveInsight: '🔓 XNOR — the equality gate! NOT(XOR(A,B)) checks if two bits match. Chain these together and you get the multi-bit comparator coming up in Chapter 4.\n🔍 Diagnostic module 2: comparator circuit verified.',
    hints: [
      'The output should be 1 when both inputs are the same (both 0 or both 1).',
      'XOR outputs 1 when inputs differ. You want the OPPOSITE of that.',
      'EQ = NOT(XOR(A, B)). Two gates: XOR then NOT.'
    ],
    hintHighlights: ['A', 'B', 'EQ'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'EQ', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  {
    id: 20,
    title: 'Data Selector',
    description: 'Route one of two data lines to the output based on a select signal. When S=0, output A. When S=1, output B.',
    postSolveInsight: '🔓 This is a 2-to-1 multiplexer — the fundamental data routing circuit. In Chapter 4, you\'ll build a wider version that selects between entire multi-bit numbers.\n🔍 Diagnostic module 3: selector circuit verified. All systems go!',
    hints: [
      'When S=0, the output should equal A. When S=1, the output should equal B. S acts as a switch.',
      'Create two "paths": one gates A with NOT(S), the other gates B with S. Then combine.',
      'OUT = OR(AND(A, NOT(S)), AND(B, S)). Four gates: one NOT, two ANDs, one OR.'
    ],
    hintHighlights: ['A', 'B', 'S', 'OUT'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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

  // ── Chapter 4: Advanced Systems (Warp Drive) ──
  {
    id: 21,
    title: '2-to-4 Decoder',
    description: 'Route a 2-bit address to exactly one of four output channels. Only the selected channel fires.',
    postSolveInsight: '🔓 Decoders convert binary addresses into one-hot signals. Every memory chip uses them to select which storage cell to read.\n🚀 Warp channel routing initialized.',
    hints: [
      'Each output should be 1 for exactly one combination of inputs. Y0 fires when both inputs are 0.',
      'You need to create both the normal and inverted versions of each input. Start with two NOT gates.',
      'Y0 = NOT(A) AND NOT(B). Y1 = NOT(A) AND B. Y2 = A AND NOT(B). Y3 = A AND B. Share the NOT outputs!'
    ],
    hintHighlights: ['A', 'B', 'Y0', 'Y1', 'Y2', 'Y3'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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
    id: 22,
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
    id: 23,
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
    id: 24,
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
    id: 25,
    title: '2-Bit Ripple Adder',
    description: 'The ultimate challenge! Add two 2-bit numbers (A1:A0 + B1:B0) and produce the 3-bit result (Cout:S1:S0).',
    postSolveInsight: '🔓 You just built a 2-bit ripple carry adder — chain four of these together and you have an 8-bit adder, the arithmetic heart of early CPUs like the Intel 8080.\n🚀 Warp drive arithmetic unit operational! The engines hum to life. Course plotted for home. Engage.',
    hints: [
      'Break it into two stages: add the low bits first (A0 + B0 → S0 and carry), then add the high bits with that carry.',
      'Stage 1 is a half adder: S0 = XOR(A0,B0), C0 = AND(A0,B0). Stage 2 is a full adder on A1, B1, and C0.',
      'Full adder: S1 = XOR(XOR(A1,B1), C0). Cout = OR(AND(A1,B1), AND(C0, XOR(A1,B1))). Seven gates total.'
    ],
    hintHighlights: ['A1', 'A0', 'B1', 'B0', 'S1', 'S0', 'Cout'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
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

  // ── Chapter 5: Shield Systems (Defense Grid) ──
  {
    id: 26,
    title: 'Error Detector',
    description: 'Detect transmission errors in shield data. Output 1 when an odd number of input bits are high — the signature of a corrupted signal.',
    postSolveInsight: '🔓 Parity checking is the oldest error detection trick in computing. Every byte transmitted over USB, Ethernet, and RAM includes parity bits built from circuits exactly like this one.\n🛡️ Shield data integrity monitor online.',
    hints: [
      'XOR naturally counts "oddness" — XOR(0,1)=1, XOR(1,1)=0. Chain them together.',
      'First XOR two inputs together. Then XOR that result with the third input. Two gates total.',
    ],
    hintHighlights: ['A', 'B', 'C', 'P'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 2,
    goodGates: 4,
    inputs: [
      { label: 'A', x: 60, y: 120 },
      { label: 'B', x: 60, y: 200 },
      { label: 'C', x: 60, y: 280 },
    ],
    outputs: [
      { label: 'P', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 1], outputs: [1] },
      { inputs: [0, 1, 0], outputs: [1] },
      { inputs: [0, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0], outputs: [1] },
      { inputs: [1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 0], outputs: [0] },
      { inputs: [1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 27,
    title: 'Shield Integrity Check',
    description: 'Validate 4-bit shield integrity codes. Output 1 when an even number of bits are high (including zero) — confirming the shields hold.',
    postSolveInsight: '🔓 Even parity is used in RAID storage, ECC memory, and TCP checksums. Your computer is running millions of these checks per second right now.\n🛡️ Shield integrity validator operational.',
    hints: [
      'Even parity is the opposite of odd parity. XOR gives you odd parity — what turns odd into even?',
      'XOR all four inputs together to get odd parity, then invert with NOT. Four gates: three XOR and one NOT.',
    ],
    hintHighlights: ['A', 'B', 'C', 'D', 'P'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 4,
    goodGates: 6,
    inputs: [
      { label: 'A', x: 60, y: 80 },
      { label: 'B', x: 60, y: 160 },
      { label: 'C', x: 60, y: 240 },
      { label: 'D', x: 60, y: 320 },
    ],
    outputs: [
      { label: 'P', x: 600, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0, 0], outputs: [1] },
      { inputs: [0, 0, 0, 1], outputs: [0] },
      { inputs: [0, 0, 1, 0], outputs: [0] },
      { inputs: [0, 0, 1, 1], outputs: [1] },
      { inputs: [0, 1, 0, 0], outputs: [0] },
      { inputs: [0, 1, 0, 1], outputs: [1] },
      { inputs: [0, 1, 1, 0], outputs: [1] },
      { inputs: [0, 1, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0, 0], outputs: [0] },
      { inputs: [1, 0, 0, 1], outputs: [1] },
      { inputs: [1, 0, 1, 0], outputs: [1] },
      { inputs: [1, 0, 1, 1], outputs: [0] },
      { inputs: [1, 1, 0, 0], outputs: [1] },
      { inputs: [1, 1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 1, 0], outputs: [0] },
      { inputs: [1, 1, 1, 1], outputs: [1] },
    ],
  },
  {
    id: 28,
    title: 'Threat Prioritizer',
    description: 'Multiple threats detected! Encode the highest-priority active sensor (I3=highest) as a binary index (Y1:Y0) and flag if any threat exists (V).',
    postSolveInsight: '🔓 Priority encoders are the backbone of interrupt controllers in every CPU. When multiple devices scream for attention simultaneously, this circuit decides who gets served first.\n🛡️ Threat prioritization matrix active.',
    hints: [
      'Y1 should be 1 when either of the top two inputs (I3 or I2) is active. That\'s just an OR gate.',
      'Y0 is trickier: it\'s 1 for I3 (index 11) and I1 (index 01), but NOT for I2 (index 10). So Y0 = I3 OR (I1 when I2 is off).',
      'Y0 = I3 OR (NOT(I2) AND I1). V = I3 OR I2 OR I1 OR I0. Share the I3 OR I2 computation.',
    ],
    hintHighlights: ['I3', 'I2', 'I1', 'I0', 'Y1', 'Y0', 'V'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 6,
    goodGates: 8,
    inputs: [
      { label: 'I3', x: 60, y: 80 },
      { label: 'I2', x: 60, y: 160 },
      { label: 'I1', x: 60, y: 240 },
      { label: 'I0', x: 60, y: 320 },
    ],
    outputs: [
      { label: 'Y1', x: 600, y: 100 },
      { label: 'Y0', x: 600, y: 200 },
      { label: 'V', x: 600, y: 300 },
    ],
    truthTable: [
      { inputs: [0, 0, 0, 0], outputs: [0, 0, 0] },
      { inputs: [0, 0, 0, 1], outputs: [0, 0, 1] },
      { inputs: [0, 0, 1, 0], outputs: [0, 1, 1] },
      { inputs: [0, 0, 1, 1], outputs: [0, 1, 1] },
      { inputs: [0, 1, 0, 0], outputs: [1, 0, 1] },
      { inputs: [0, 1, 0, 1], outputs: [1, 0, 1] },
      { inputs: [0, 1, 1, 0], outputs: [1, 0, 1] },
      { inputs: [0, 1, 1, 1], outputs: [1, 0, 1] },
      { inputs: [1, 0, 0, 0], outputs: [1, 1, 1] },
      { inputs: [1, 0, 0, 1], outputs: [1, 1, 1] },
      { inputs: [1, 0, 1, 0], outputs: [1, 1, 1] },
      { inputs: [1, 0, 1, 1], outputs: [1, 1, 1] },
      { inputs: [1, 1, 0, 0], outputs: [1, 1, 1] },
      { inputs: [1, 1, 0, 1], outputs: [1, 1, 1] },
      { inputs: [1, 1, 1, 0], outputs: [1, 1, 1] },
      { inputs: [1, 1, 1, 1], outputs: [1, 1, 1] },
    ],
  },
  {
    id: 29,
    title: 'Damage Calculator',
    description: 'Calculate shield damage with borrow propagation. Build a full subtractor: compute A minus B minus BorrowIn, producing the Difference and BorrowOut.',
    postSolveInsight: '🔓 Full subtractors are the mirror image of full adders. Chain them together and you get multi-bit subtraction — the basis of every comparison and negative number operation in a CPU.\n🛡️ Shield damage assessment module online.',
    hints: [
      'The difference bit works exactly like addition: D = A XOR B XOR Bin. Three values, odd-one-out.',
      'Borrow occurs when we need to "borrow" from the next column. It happens when A can\'t cover B + Bin.',
      'Bout = (D AND (B XOR Bin)) OR (B AND Bin). The deep insight: D already encodes NOT(A) when B XOR Bin is active — no NOT gate needed anywhere. Five gates total.',
    ],
    hintHighlights: ['A', 'B', 'Bin', 'D', 'Bout'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 5,
    goodGates: 7,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'Bin', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'D', x: 600, y: 140 },
      { label: 'Bout', x: 600, y: 260 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0, 0] },  // 0-0-0 = 0, no borrow
      { inputs: [0, 0, 1], outputs: [1, 1] },  // 0-0-1 = -1, borrow
      { inputs: [0, 1, 0], outputs: [1, 1] },  // 0-1-0 = -1, borrow
      { inputs: [0, 1, 1], outputs: [0, 1] },  // 0-1-1 = -2, borrow
      { inputs: [1, 0, 0], outputs: [1, 0] },  // 1-0-0 = 1, no borrow
      { inputs: [1, 0, 1], outputs: [0, 0] },  // 1-0-1 = 0, no borrow
      { inputs: [1, 1, 0], outputs: [0, 0] },  // 1-1-0 = 0, no borrow
      { inputs: [1, 1, 1], outputs: [1, 1] },  // 1-1-1 = -1, borrow
    ],
  },
  {
    id: 30,
    title: 'Shield Router',
    description: 'The ultimate defense puzzle! Route shield power to one of four hull sectors. When SEL selects a sector, that output gets the data signal — all others stay off.',
    postSolveInsight: '🔓 Demultiplexers are the inverse of multiplexers — one signal in, many possible destinations. Memory chips use them to route write data to the selected address. Your RAM is full of these.\n🛡️ Shield power routing grid operational! All sectors protected. The ship is battle-ready.',
    hints: [
      'Each output fires only for its specific select combination. Y0 fires when S1=0 AND S0=0, Y1 when S1=0 AND S0=1, etc.',
      'Every output needs D AND the right combination of S1/NOT(S1) and S0/NOT(S0). Share the NOT gates and the partial products.',
      'Compute D·NOT(S1) and D·S1 first, then AND each with NOT(S0) or S0 for the four outputs. Eight gates total.',
    ],
    hintHighlights: ['D', 'S1', 'S0', 'Y0', 'Y1', 'Y2', 'Y3'],
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 8,
    goodGates: 10,
    inputs: [
      { label: 'D', x: 60, y: 120 },
      { label: 'S1', x: 60, y: 200 },
      { label: 'S0', x: 60, y: 280 },
    ],
    outputs: [
      { label: 'Y0', x: 600, y: 60 },
      { label: 'Y1', x: 600, y: 150 },
      { label: 'Y2', x: 600, y: 250 },
      { label: 'Y3', x: 600, y: 340 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0, 0, 0, 0] },
      { inputs: [0, 0, 1], outputs: [0, 0, 0, 0] },
      { inputs: [0, 1, 0], outputs: [0, 0, 0, 0] },
      { inputs: [0, 1, 1], outputs: [0, 0, 0, 0] },
      { inputs: [1, 0, 0], outputs: [1, 0, 0, 0] },
      { inputs: [1, 0, 1], outputs: [0, 1, 0, 0] },
      { inputs: [1, 1, 0], outputs: [0, 0, 1, 0] },
      { inputs: [1, 1, 1], outputs: [0, 0, 0, 1] },
    ],
  },

  // ── Chapter 6: Universal Gates ──
  {
    id: 31,
    title: 'Meet NAND',
    description: 'NAND outputs 0 only when BOTH inputs are 1 — the opposite of AND. It\'s the most important gate in computing.',
    postSolveInsight: '🔓 NAND is called a "universal gate" because you can build ANY other gate using only NAND gates. Every modern CPU is ultimately made of NANDs.\n⚛️ Engine core logic unit #1 responding.',
    hints: [
      'NAND is like AND followed by NOT. It outputs 1 for everything except when both inputs are 1.',
      'You only need 1 gate.',
      'Connect both inputs to a single NAND gate and wire the output.',
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['NAND'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },
  {
    id: 32,
    title: 'Meet NOR',
    description: 'NOR outputs 1 only when BOTH inputs are 0 — the opposite of OR. Another universal gate!',
    postSolveInsight: '🔓 NOR is also universal — the Apollo Guidance Computer was built entirely from NOR gates. It navigated humans to the moon!\n⚛️ Engine core logic unit #2 online.',
    hints: [
      'NOR is like OR followed by NOT. It only outputs 1 when neither input is active.',
      'You only need 1 gate.',
      'A single NOR gate does the job — wire both inputs and the output.',
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['NOR'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [0] },
    ],
  },
  {
    id: 33,
    title: 'NOT from NAND',
    description: 'Build a NOT gate using ONLY NAND gates. Hint: what happens when you feed the same signal to both NAND inputs?',
    postSolveInsight: '🔓 NAND with both inputs tied together = NOT. This is the first step to proving NAND universality: NAND(A,A) = NOT(A).\n⚛️ Engine inverter circuits rebuilt from universal components.',
    hints: [
      'If both inputs of a NAND are the same value, NAND(A,A) = NOT(A). Think about why.',
      'You only need 1 NAND gate — wire input A to BOTH of its inputs.',
      'Connect A to pin 1 AND pin 2 of a single NAND gate.',
    ],
    hintHighlights: ['A', 'OUT'],
    availableGates: ['NAND'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 200 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0], outputs: [1] },
      { inputs: [1], outputs: [0] },
    ],
  },
  {
    id: 34,
    title: 'AND from NAND',
    description: 'Build an AND gate using ONLY NAND gates. This proves NAND can reproduce basic logic!',
    postSolveInsight: '🔓 NAND then NOT-via-NAND = AND. With NOT and AND proven, you can build OR (De Morgan\'s), XOR, and eventually any circuit — all from NAND alone. That\'s universality!\n⚛️ Engine core fully operational! Universal gate mastery achieved.',
    hints: [
      'AND = NOT(NAND). First NAND the inputs, then invert the result.',
      'You need 2 NAND gates: one for A NAND B, then feed that result into both inputs of a second NAND.',
      'Gate 1: NAND(A,B). Gate 2: NAND(result, result) = NOT(result) = AND.',
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['NAND'],
    optimalGates: 2,
    goodGates: 3,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
  },
  // ── Bonus: Dark Gate Level ──
  {
    id: 35,
    title: 'The Dark Gate',
    description: 'A mysterious gate has appeared. Its logic is unknown. Experiment with inputs to discover its behavior, then use it to solve the puzzle.',
    postSolveInsight: '🔓 The Dark Gate was XOR all along! By experimenting with inputs and observing outputs, you reverse-engineered its truth table — just like real engineers debugging unknown ICs.\n🕵️ Mystery solved. Your analytical skills are razor-sharp.',
    hints: [
      'Place the mystery gate and toggle the input nodes to observe its output. What pattern do you see?',
      'Test all four input combinations: 00, 01, 10, 11. The gate outputs 1 when inputs are DIFFERENT.',
      'It behaves like XOR! One mystery gate is all you need.',
    ],
    hintHighlights: ['A', 'B', 'OUT'],
    availableGates: ['MYSTERY'],
    optimalGates: 1,
    goodGates: 1,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ],
    isDarkGate: true,
  },

  // ── Chapter 8: Discovery Lab (Day 33 T1) ──
  {
    id: 36,
    title: 'Open Design: 3-Input Selector',
    description: 'Build any circuit that produces the given truth table. All gates available — no restrictions. Find YOUR solution.',
    postSolveInsight: '🔓 There are multiple valid solutions! Every designer finds a different path. That\'s the beauty of logic design.',
    hints: [
      'There are many ways to solve this. Think about which gate combinations feel natural to you.',
      'Try breaking the problem into smaller pieces — which input combinations produce 1?',
      'No single "right" approach. Experiment freely!',
    ],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 3,
    goodGates: 6,
    inputs: [
      { label: 'A', x: 60, y: 100 },
      { label: 'B', x: 60, y: 200 },
      { label: 'C', x: 60, y: 300 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0, 0], outputs: [0] },
      { inputs: [0, 0, 1], outputs: [1] },
      { inputs: [0, 1, 0], outputs: [1] },
      { inputs: [0, 1, 1], outputs: [0] },
      { inputs: [1, 0, 0], outputs: [0] },
      { inputs: [1, 0, 1], outputs: [0] },
      { inputs: [1, 1, 0], outputs: [1] },
      { inputs: [1, 1, 1], outputs: [1] },
    ],
    isDiscovery: true,
  },
  {
    id: 37,
    title: 'Open Design: Dual Output Logic',
    description: 'Two outputs, full gate palette. Design freely — there\'s no single right answer.',
    postSolveInsight: '🔓 Multi-output circuits often share intermediate signals. Elegant solutions reuse gates across both outputs.',
    hints: [
      'Think about each output independently first, then look for shared logic.',
      'The two outputs have different patterns — one responds to AND-like conditions, the other to XOR-like.',
      'Build and test one output at a time. Connect the second output once the first works.',
    ],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 3,
    goodGates: 6,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'X', x: 620, y: 140 },
      { label: 'Y', x: 620, y: 260 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0, 0] },
      { inputs: [0, 1], outputs: [0, 1] },
      { inputs: [1, 0], outputs: [0, 1] },
      { inputs: [1, 1], outputs: [1, 0] },
    ],
    isDiscovery: true,
  },
  {
    id: 38,
    title: 'Guided Expansion',
    description: 'Start with a pre-placed AND gate. Expand the circuit to match the target truth table. Build around what\'s given.',
    postSolveInsight: '🔓 Real engineering often means extending existing circuits. The constraint of pre-placed components forces creative thinking.',
    hints: [
      'The AND gate is already placed — use its output as part of your solution.',
      'You need to combine the AND result with something else to get the final output.',
      'Think about what the AND gate gives you, then decide how to modify its result.',
    ],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 2,
    goodGates: 4,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [1] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ],
    isDiscovery: true,
    preplacedGates: [
      { type: 'AND', x: 250, y: 170 },
    ],
  },

  // ── Chapter 8: Multi-Phase Discovery (Day 33 T2) ──
  {
    id: 39,
    title: 'Phase Shift: Evolving Requirements',
    description: 'Phase 1: Build a simple OR circuit. Once it works, Phase 2 will add new requirements on top.',
    postSolveInsight: '🔓 Multi-phase design mirrors real engineering — systems evolve and you must adapt without starting over.',
    hints: [
      'Phase 1 is straightforward — just an OR operation.',
      'When Phase 2 arrives, you\'ll need to add logic without breaking Phase 1.',
      'Think modular: keep your Phase 1 circuit clean so it\'s easy to extend.',
    ],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 2,
    goodGates: 4,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [1] },
    ],
    isMultiPhase: true,
    phases: [
      {
        phase: 1,
        description: 'Phase 1: Build an OR circuit.',
        truthTable: [
          { inputs: [0, 0], outputs: [0] },
          { inputs: [0, 1], outputs: [1] },
          { inputs: [1, 0], outputs: [1] },
          { inputs: [1, 1], outputs: [1] },
        ],
      },
      {
        phase: 2,
        description: 'Phase 2: Now make output 1 ONLY when exactly one input is 1 (XOR). Adapt your circuit!',
        truthTable: [
          { inputs: [0, 0], outputs: [0] },
          { inputs: [0, 1], outputs: [1] },
          { inputs: [1, 0], outputs: [1] },
          { inputs: [1, 1], outputs: [0] },
        ],
        optimalGates: 3,
        goodGates: 5,
      },
    ],
    isDiscovery: true,
  },
  {
    id: 40,
    title: 'Phase Shift: Growing Complexity',
    description: 'Phase 1: Simple AND gate. Phase 2 adds a second output. Don\'t tear down — build up!',
    postSolveInsight: '🔓 Incremental design is a core skill. Adding features to working systems without breaking them is what separates beginners from engineers.',
    hints: [
      'Phase 1 just needs AND — one gate, done.',
      'Phase 2 adds a second output. Your AND gate stays useful.',
      'The second output needs different logic — but the same inputs.',
    ],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 2,
    goodGates: 4,
    inputs: [
      { label: 'A', x: 60, y: 140 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'X', x: 620, y: 200 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ],
    isMultiPhase: true,
    phases: [
      {
        phase: 1,
        description: 'Phase 1: Build an AND gate circuit.',
        truthTable: [
          { inputs: [0, 0], outputs: [0] },
          { inputs: [0, 1], outputs: [0] },
          { inputs: [1, 0], outputs: [0] },
          { inputs: [1, 1], outputs: [1] },
        ],
        outputs: [{ label: 'X', x: 620, y: 200 }],
      },
      {
        phase: 2,
        description: 'Phase 2: A second output Y appears! Y = OR(A, B). Wire it without breaking X.',
        truthTable: [
          { inputs: [0, 0], outputs: [0, 0] },
          { inputs: [0, 1], outputs: [0, 1] },
          { inputs: [1, 0], outputs: [0, 1] },
          { inputs: [1, 1], outputs: [1, 1] },
        ],
        outputs: [
          { label: 'X', x: 620, y: 140 },
          { label: 'Y', x: 620, y: 260 },
        ],
        optimalGates: 2,
        goodGates: 4,
      },
    ],
    isDiscovery: true,
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
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

// ── Day 32 T3: Challenge a Friend URL encoding ──
function encodeFriendChallenge(level, senderScore) {
  const data = {
    t: level.truthTable.map(r => [...r.inputs, ...r.outputs]),
    i: level.inputs.length,
    o: level.outputs.length,
    s: senderScore,  // sender's gate count
    n: level.title || 'Challenge',
  };
  return '#friend=' + btoa(JSON.stringify(data));
}

function parseFriendChallenge() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#friend=')) return null;
    const encoded = hash.slice(8);
    const data = JSON.parse(atob(encoded));
    if (!data.t || !data.i || !data.o) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function buildFriendChallengeLevel(data) {
  const numInputs = data.i;
  const numOutputs = data.o;
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : Array.from({ length: numOutputs }, (_, i) => `Y${i}`);

  const canvasHeight = 500;
  const inputSpacing = canvasHeight / (numInputs + 1);
  const outputSpacing = canvasHeight / (numOutputs + 1);

  const inputs = inputLabels.map((label, i) => ({
    label, x: 60, y: Math.round(inputSpacing * (i + 1)),
  }));
  const outputs = outputLabels.map((label, i) => ({
    label, x: 600, y: Math.round(outputSpacing * (i + 1)),
  }));

  const truthTable = data.t.map(row => ({
    inputs: row.slice(0, numInputs),
    outputs: row.slice(numInputs),
  }));

  return {
    id: 'friend-challenge',
    title: `🤝 Friend's Challenge`,
    description: data.s ? `Your friend solved this in ${data.s} gates — can you beat them?` : 'A friend challenged you to solve this circuit!',
    hints: [],
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: data.s || numInputs + 1,
    goodGates: (data.s || numInputs + 1) + 2,
    inputs,
    outputs,
    truthTable,
    isChallenge: true,
    isFriendChallenge: true,
    friendScore: data.s || null,
    difficulty: getDifficultyLabel(numInputs, numOutputs),
    difficultyKey: `${numInputs}x${numOutputs}`,
  };
}

// ── Day 32 T7: Weekly Puzzle ──
const WEEKLY_PUZZLES = [
  {
    name: 'Mars Rover Fault Detector',
    story: 'The Mars rover\'s fault detection circuit is offline. Build a majority voter to protect critical systems.',
    inputs: 3, outputs: 1,
    table: [0,0,0,1,0,1,1,1], // Majority
    gates: ['AND', 'OR', 'NOT'],
  },
  {
    name: 'Submarine Depth Alarm',
    story: 'The submarine needs a depth alarm — trigger when at least 2 of 3 pressure sensors detect danger.',
    inputs: 3, outputs: 1,
    table: [0,0,0,1,0,1,1,1], // Majority (variant context)
    gates: ['AND', 'OR', 'NOT', 'XOR'],
  },
  {
    name: 'Space Station Airlock',
    story: 'Both inner AND outer door sensors must agree before the airlock cycles. Build the safety interlock.',
    inputs: 2, outputs: 1,
    table: [0,0,0,1], // AND (but with narrative)
    gates: ['AND', 'OR', 'NOT'],
  },
  {
    name: 'Train Signal Controller',
    story: 'A rail junction needs a signal controller: green when either track is clear, red when both are occupied.',
    inputs: 2, outputs: 1,
    table: [1,1,1,0], // NAND
    gates: ['AND', 'OR', 'NOT', 'NAND'],
  },
  {
    name: 'Satellite Error Corrector',
    story: 'Deep space signals are noisy. Build a parity checker to detect single-bit transmission errors.',
    inputs: 3, outputs: 1,
    table: [0,1,1,0,1,0,0,1], // XOR parity
    gates: ['AND', 'OR', 'NOT', 'XOR'],
  },
  {
    name: 'Nuclear Plant Safety Logic',
    story: 'Three independent sensors monitor reactor temperature. The shutdown triggers only if exactly one sensor reads normal.',
    inputs: 3, outputs: 1,
    table: [0,1,1,0,1,0,0,0], // Exactly-one
    gates: ['AND', 'OR', 'NOT', 'XOR', 'NAND'],
  },
  {
    name: 'Hospital Triage Sorter',
    story: 'An emergency triage system routes patients. Build the priority encoder that identifies the most urgent case.',
    inputs: 3, outputs: 1,
    table: [0,0,0,0,1,1,1,1], // A (highest bit) — priority
    gates: ['AND', 'OR', 'NOT'],
  },
  {
    name: 'Quantum Lab Interlock',
    story: 'The quantum computer\'s cooling system must activate when conditions differ — XOR the sensor readings.',
    inputs: 2, outputs: 1,
    table: [0,1,1,0], // XOR
    gates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
  },
];

function generateWeeklyPuzzle() {
  const now = new Date();
  // ISO week number
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
  const idx = weekNum % WEEKLY_PUZZLES.length;
  const puzzle = WEEKLY_PUZZLES[idx];

  const numInputs = puzzle.inputs;
  const numOutputs = puzzle.outputs;
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : ['X', 'Y'];
  const numRows = Math.pow(2, numInputs);

  const canvasHeight = 500;
  const inputSpacing = canvasHeight / (numInputs + 1);
  const outputSpacing = canvasHeight / (numOutputs + 1);

  const inputs = inputLabels.map((label, i) => ({
    label, x: 60, y: Math.round(inputSpacing * (i + 1)),
  }));
  const outputs = outputLabels.map((label, i) => ({
    label, x: 600, y: Math.round(outputSpacing * (i + 1)),
  }));

  const truthTable = [];
  for (let r = 0; r < numRows; r++) {
    const inVals = [];
    for (let j = numInputs - 1; j >= 0; j--) inVals.push((r >> j) & 1);
    const outVals = numOutputs === 1 ? [puzzle.table[r]] : puzzle.table[r];
    truthTable.push({ inputs: inVals, outputs: outVals });
  }

  return {
    id: 'weekly',
    title: `🏗️ Puzzle of the Week: ${puzzle.name}`,
    description: puzzle.story,
    hints: [],
    availableGates: puzzle.gates,
    optimalGates: numInputs + 1,
    goodGates: numInputs + 3,
    inputs,
    outputs,
    truthTable,
    isWeekly: true,
    weekNumber: weekNum,
  };
}

// ── Day 32 T4: Seasonal Themes ──
function getSeasonalTheme() {
  const month = new Date().getMonth(); // 0-11
  const themes = [
    { name: 'New Year Circuits', emoji: '🎆', accent: '#FFD700', month: 0 },
    { name: 'Logic of Love', emoji: '💝', accent: '#FF6B9D', month: 1 },
    { name: 'Spring Signals', emoji: '🌸', accent: '#FF9FD5', month: 2 },
    { name: 'April Logic', emoji: '🔬', accent: '#00E5FF', month: 3 },
    { name: 'May Circuits', emoji: '⚡', accent: '#76FF03', month: 4 },
    { name: 'Summer Solstice', emoji: '☀️', accent: '#FFAB40', month: 5 },
    { name: 'Digital Freedom', emoji: '🎆', accent: '#FF1744', month: 6 },
    { name: 'August Build', emoji: '🔧', accent: '#00B0FF', month: 7 },
    { name: 'Back to Logic', emoji: '📚', accent: '#7C4DFF', month: 8 },
    { name: 'Logic of Spooky', emoji: '🎃', accent: '#FF6D00', month: 9 },
    { name: 'November Bits', emoji: '🍂', accent: '#8D6E63', month: 10 },
    { name: 'Winter Circuits', emoji: '❄️', accent: '#80DEEA', month: 11 },
  ];
  return themes[month] || themes[0];
}


// ── Day 50: Adaptive Challenge Generator ──

function generateAdaptiveChallenge(skillScore) {
  let numInputs, numOutputs;

  if (skillScore <= 30) {
    // Novice: 2x1 curated
    numInputs = 2; numOutputs = 1;
  } else if (skillScore <= 60) {
    // Intermediate: 3x1 or 2x2
    if (Math.random() < 0.6) { numInputs = 3; numOutputs = 1; }
    else { numInputs = 2; numOutputs = 2; }
  } else if (skillScore <= 85) {
    // Advanced: 3x2
    numInputs = 3; numOutputs = 2;
  } else {
    // Expert: 4x1 or 4x2
    if (Math.random() < 0.6) { numInputs = 4; numOutputs = 1; }
    else { numInputs = 4; numOutputs = 2; }
  }

  const level = generateChallenge(numInputs, numOutputs);

  // Determine skill label
  let skillLabel;
  if (skillScore <= 30) skillLabel = 'Novice';
  else if (skillScore <= 60) skillLabel = 'Intermediate';
  else if (skillScore <= 85) skillLabel = 'Advanced';
  else skillLabel = 'Expert';

  level.title = `🎯 Adaptive: ${level.title}`;
  level.description = `Matched to your ${skillLabel} skill level. ${level.description}`;
  level.isAdaptive = true;
  level.skillLabel = skillLabel;
  level.skillScore = skillScore;

  return level;
}

function generatePushMyLimits(skillScore) {
  // One tier harder than current level
  let boostedScore;
  if (skillScore <= 30) boostedScore = 45; // Push Novice → Intermediate
  else if (skillScore <= 60) boostedScore = 75; // Push Intermediate → Advanced
  else if (skillScore <= 85) boostedScore = 95; // Push Advanced → Expert
  else boostedScore = 100; // Expert stays Expert (hardest)

  const level = generateAdaptiveChallenge(boostedScore);
  level.title = `💪 Push: ${level.title.replace('🎯 Adaptive: ', '')}`;
  level.description = `One tier harder than your current level! ${level.description}`;
  level.isPushMyLimits = true;

  return level;
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
    availableGates: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
    optimalGates: 0,
    goodGates: 0,
    inputs,
    outputs,
    truthTable,
    isSandbox: true,
  };
}

// ── Community Levels (Day 49) ──
function getCommunityDifficulty(level) {
  if (level.inputCount >= 4 || level.outputCount >= 3) return 'Hard';
  if (level.inputCount >= 3 || level.outputCount >= 2) return 'Medium';
  return 'Easy';
}

const COMMUNITY_LEVELS = [
  // === EASY (2-input, 1-output) ===
  {
    id: 'community_1', name: 'The Implication', creator: 'LogicLara',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,1],[0,1,1],[1,0,0],[1,1,1]],
    gates: ['AND','OR','NOT'], featured: false,
  },
  {
    id: 'community_2', name: 'Inverted AND', creator: 'ChipWizard',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,1],[0,1,1],[1,0,1],[1,1,0]],
    gates: ['AND','NOT'], featured: false,
  },
  {
    id: 'community_3', name: 'Either But Not A', creator: 'NandNinja',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,0],[0,1,1],[1,0,0],[1,1,0]],
    gates: ['AND','OR','NOT'], featured: false,
  },
  {
    id: 'community_4', name: 'Always Agree', creator: 'BitBuilder',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
    gates: ['XOR','NOT'], featured: false,
  },
  {
    id: 'community_5', name: 'One Hot', creator: 'GateCrafter',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,0],[0,1,1],[1,0,1],[1,1,0]],
    gates: ['XOR'], featured: false,
  },
  {
    id: 'community_6', name: 'Not Both', creator: 'CircuitSage',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,1],[0,1,1],[1,0,1],[1,1,0]],
    gates: ['NAND'], featured: false,
  },
  {
    id: 'community_7', name: 'Silent When Apart', creator: 'WirePuller',
    inputCount: 2, outputCount: 1,
    truthTable: [[0,0,0],[0,1,0],[1,0,0],[1,1,1]],
    gates: ['AND'], featured: false,
  },
  // === MEDIUM (3-input, 1-output or 2-input, 2-output) ===
  {
    id: 'community_8', name: 'Majority Vote', creator: 'LogicLara',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,1],[1,1,1,1]],
    gates: ['AND','OR'], featured: true,
  },
  {
    id: 'community_9', name: 'Odd Parity', creator: 'ParityPete',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,0],[0,0,1,1],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,1]],
    gates: ['XOR'], featured: false,
  },
  {
    id: 'community_10', name: 'All Or None', creator: 'BinaryBoss',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,1],[0,0,1,0],[0,1,0,0],[0,1,1,0],[1,0,0,0],[1,0,1,0],[1,1,0,0],[1,1,1,1]],
    gates: ['AND','OR','NOT','XOR'], featured: false,
  },
  {
    id: 'community_11', name: 'Half Adder Redux', creator: 'ChipWizard',
    inputCount: 2, outputCount: 2,
    truthTable: [[0,0,0,0],[0,1,1,0],[1,0,1,0],[1,1,0,1]],
    gates: ['AND','XOR'], featured: false,
  },
  {
    id: 'community_12', name: 'Two-Way Switch', creator: 'NandNinja',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,1,1],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,1]],
    gates: ['AND','OR','NOT'], featured: false,
  },
  {
    id: 'community_13', name: 'Comparator', creator: 'BitBuilder',
    inputCount: 2, outputCount: 2,
    truthTable: [[0,0,0,1],[0,1,0,0],[1,0,1,0],[1,1,0,1]],
    gates: ['AND','OR','NOT','XOR'], featured: false,
  },
  {
    id: 'community_14', name: 'At Least Two', creator: 'GateCrafter',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,1,1],[1,0,0,0],[1,0,1,1],[1,1,0,1],[1,1,1,1]],
    gates: ['AND','OR'], featured: false,
  },
  {
    id: 'community_15', name: 'Exactly One', creator: 'CircuitSage',
    inputCount: 3, outputCount: 1,
    truthTable: [[0,0,0,0],[0,0,1,1],[0,1,0,1],[0,1,1,0],[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,1,1,0]],
    gates: ['AND','OR','NOT','XOR'], featured: false,
  },
  // === HARD (4-input) ===
  {
    id: 'community_16', name: 'Even Parity Check', creator: 'ParityPete',
    inputCount: 4, outputCount: 1,
    truthTable: [
      [0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,1],
      [0,1,0,0,0],[0,1,0,1,1],[0,1,1,0,1],[0,1,1,1,0],
      [1,0,0,0,0],[1,0,0,1,1],[1,0,1,0,1],[1,0,1,1,0],
      [1,1,0,0,1],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,1]
    ],
    gates: ['XOR','NOT'], featured: false,
  },
  {
    id: 'community_17', name: 'Priority Encoder', creator: 'BinaryBoss',
    inputCount: 4, outputCount: 1,
    truthTable: [
      [0,0,0,0,0],[0,0,0,1,1],[0,0,1,0,1],[0,0,1,1,1],
      [0,1,0,0,1],[0,1,0,1,1],[0,1,1,0,1],[0,1,1,1,1],
      [1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,0,1,1,1],
      [1,1,0,0,1],[1,1,0,1,1],[1,1,1,0,1],[1,1,1,1,1]
    ],
    gates: ['AND','OR','NOT'], featured: false,
  },
  {
    id: 'community_18', name: 'Threshold 3', creator: 'LogicLara',
    inputCount: 4, outputCount: 1,
    truthTable: [
      [0,0,0,0,0],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,0],
      [0,1,0,0,0],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,1],
      [1,0,0,0,0],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,1],
      [1,1,0,0,0],[1,1,0,1,1],[1,1,1,0,1],[1,1,1,1,1]
    ],
    gates: ['AND','OR'], featured: false,
  },
  {
    id: 'community_19', name: 'Nibble Invert', creator: 'ChipWizard',
    inputCount: 4, outputCount: 1,
    truthTable: [
      [0,0,0,0,1],[0,0,0,1,1],[0,0,1,0,1],[0,0,1,1,0],
      [0,1,0,0,1],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,0],
      [1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,0],
      [1,1,0,0,0],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,0]
    ],
    gates: ['AND','OR','NOT'], featured: false,
  },
  {
    id: 'community_20', name: 'Quad Consensus', creator: 'NandNinja',
    inputCount: 4, outputCount: 1,
    truthTable: [
      [0,0,0,0,0],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,1,0],
      [0,1,0,0,0],[0,1,0,1,0],[0,1,1,0,0],[0,1,1,1,0],
      [1,0,0,0,0],[1,0,0,1,0],[1,0,1,0,0],[1,0,1,1,0],
      [1,1,0,0,0],[1,1,0,1,0],[1,1,1,0,0],[1,1,1,1,1]
    ],
    gates: ['AND'], featured: false,
  },
];
