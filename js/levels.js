// levels.js — Level definitions, chapters, and star thresholds

const CHAPTERS = [
  {
    id: 1, title: 'Chapter 1: Basics', levels: [1, 2, 3, 4, 5],
    narrative: 'Navigation Systems',
    storyIntro: 'The ship\'s navigation array is dark. These basic logic circuits need repair before we can steer.',
    storyComplete: '🛸 Navigation systems online! The ship can steer again.',
    gatesMastered: ['AND', 'OR', 'NOT'],
    color: '#00cc44',
  },
  {
    id: 2, title: 'Chapter 2: Combinations', levels: [6, 7, 8, 9, 10],
    narrative: 'Communications Array',
    storyIntro: 'Communications are jammed. These combination circuits route encrypted signals.',
    storyComplete: '📡 Communications restored! We can reach mission control.',
    gatesMastered: ['XOR', 'De Morgan\'s Laws'],
    color: '#00c8e8',
  },
  {
    id: 3, title: 'Chapter 3: Multi-Output', levels: [11, 12, 13, 14, 15],
    narrative: 'Life Support',
    storyIntro: 'Life support is failing. These multi-output circuits control oxygen, temperature, and pressure.',
    storyComplete: '🌬️ Life support fully operational! The crew is safe.',
    gatesMastered: ['Half Adder', 'Full Adder', 'MUX', 'Majority'],
    color: '#c050f0',
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

  // ── Chapter 2: Combinations ──
  {
    id: 6,
    title: 'XOR — Exclusive Or',
    description: 'Output is 1 when the inputs are DIFFERENT. Same inputs give 0, different inputs give 1.',
    postSolveInsight: '🔓 XOR (exclusive or) is the "difference detector" — fundamental to binary addition and error-checking in data transmission.\n📡 Signal differentiator back online.',
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
    id: 7,
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
    id: 8,
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
    id: 9,
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
    id: 10,
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

  // ── Chapter 3: Multi-Output ──
  {
    id: 11,
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
    id: 12,
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
    id: 13,
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
    goodGates: 7,
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
    id: 14,
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
    id: 15,
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
    goodGates: 7,
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

function generateSandboxLevel() {
  return {
    id: 'sandbox',
    title: 'Sandbox Mode',
    description: 'Free build — place any gates and test your circuit.',
    availableGates: ['AND', 'OR', 'NOT', 'XOR'],
    optimalGates: 0,
    goodGates: 0,
    inputs: [
      { label: 'A', x: 60, y: 170 },
      { label: 'B', x: 60, y: 330 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 250 },
    ],
    truthTable: [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [0] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [0] },
    ],
    isSandbox: true,
  };
}
