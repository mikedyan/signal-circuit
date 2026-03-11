// levels.js — Level definitions, chapters, and star thresholds

const CHAPTERS = [
  { id: 1, title: 'Chapter 1: Basics', levels: [1, 2, 3, 4, 5] },
  { id: 2, title: 'Chapter 2: Combinations', levels: [6, 7, 8, 9, 10] },
  { id: 3, title: 'Chapter 3: Multi-Output', levels: [11, 12, 13, 14, 15] },
];

const LEVELS = [
  // ── Chapter 1: Basics ──
  {
    id: 1,
    title: 'AND Gate Basics',
    description: 'Connect the two inputs through an AND gate to the output. Output is 1 only when BOTH inputs are 1.',
    hints: [
      'Drag an AND gate from the toolbox onto the breadboard.',
      'Connect input A to the top pin of the AND gate, and B to the bottom pin.',
      'Connect the AND gate\'s output (right side) to the OUT node.'
    ],
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
    description: 'Connect the input through a NOT gate to the output. Output is the OPPOSITE of the input.',
    hints: [
      'NOT gates flip the signal: 0 becomes 1, and 1 becomes 0.',
      'Place a NOT gate between input A and the output.',
      'Wire: A → NOT input, NOT output → OUT.'
    ],
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
    description: 'Use an OR gate. Output is 1 when ANY input is 1. Output is 0 only when both are 0.',
    hints: [
      'OR gate: if either input is 1, the output is 1.',
      'Place an OR gate and connect both inputs to it.',
      'Wire: A → OR top, B → OR bottom, OR output → OUT.'
    ],
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
    description: 'Build NAND: the opposite of AND. Look at the truth table — it\'s AND but with every output flipped! NAND = NOT(AND). You need TWO gates for this.',
    hints: [
      'NAND means "NOT AND" — first compute AND, then flip the result.',
      'Place an AND gate, connect both inputs to it. Then place a NOT gate after it.',
      'Wire: A,B → AND → NOT → OUT. The NOT flips the AND result to get NAND.'
    ],
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
    description: 'Build NOR: the opposite of OR. Compare the truth table to level 3 — every output is flipped! NOR = NOT(OR). Same trick as NAND, different gate.',
    hints: [
      'NOR means "NOT OR" — compute OR first, then invert with NOT.',
      'Place an OR gate for the inputs, then a NOT gate on its output.',
      'Wire: A,B → OR → NOT → OUT. Same pattern as NAND but with OR instead of AND.'
    ],
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
    description: 'XOR (exclusive or) outputs 1 when the inputs are DIFFERENT. Same inputs = 0, different inputs = 1. Simple one-gate solution.',
    hints: [
      'XOR is like OR but excludes the case where both are 1.',
      'This is a single-gate level — just connect through the XOR gate.',
      'Wire: A → XOR top, B → XOR bottom, XOR output → OUT.'
    ],
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
    description: 'Build XNOR: outputs 1 when both inputs are the SAME. It\'s the opposite of XOR — same pattern as NAND/NOR: combine a gate with NOT.',
    hints: [
      'XNOR = NOT(XOR). Same pattern you learned in levels 4 and 5!',
      'Place a XOR gate, then invert its output with NOT.',
      'Wire: A,B → XOR → NOT → OUT.'
    ],
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
    description: 'Build AND using ONLY OR and NOT gates. De Morgan\'s law says: AND(A,B) = NOT(OR(NOT(A), NOT(B))). Invert both inputs, OR them, then invert the result.',
    hints: [
      'De Morgan\'s law: AND(A,B) = NOT(OR(NOT(A), NOT(B))).',
      'First invert each input with NOT gates: NOT(A) and NOT(B). Then OR them together.',
      'Finally, invert the OR result with a third NOT: NOT(A),NOT(B) → OR → NOT → OUT. Total: 4 gates.'
    ],
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
    description: 'Build OR using ONLY AND and NOT gates. De Morgan\'s other law: OR(A,B) = NOT(AND(NOT(A), NOT(B))). Same pattern as level 8 but swapped!',
    hints: [
      'De Morgan\'s law: OR(A,B) = NOT(AND(NOT(A), NOT(B))).',
      'Invert each input with NOT gates, then AND the results together.',
      'Finally, invert the AND result: NOT(A),NOT(B) → AND → NOT → OUT. Mirror of level 8.'
    ],
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
    description: 'Build A → B (material implication): output is 0 ONLY when A=1 and B=0. Think: "if A then B" — it\'s false only when A is true but B isn\'t.',
    hints: [
      'A → B is the same as OR(NOT(A), B). If A is false, the implication is always true.',
      'Invert A with NOT, then OR the result with B.',
      'Wire: A → NOT → OR (top pin), B → OR (bottom pin), OR → OUT. Just 2 gates!'
    ],
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
    description: 'Build a half adder: compute SUM (XOR) and CARRY (AND) from two input bits. This is how computers add numbers!',
    hints: [
      'A half adder has two outputs: SUM = A XOR B, CARRY = A AND B.',
      'You need two gates: one XOR for the sum, one AND for the carry.',
      'Wire A,B → XOR → SUM. Also wire A,B → AND → CARRY.'
    ],
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
    description: 'Build a 3-input AND gate. Output is 1 only when ALL THREE inputs are 1. Chain two AND gates together!',
    hints: [
      'With 2-input gates, you need to chain: AND(A, B) first, then AND that result with C.',
      'Place two AND gates. Wire A,B into the first AND.',
      'Wire first AND output + C into second AND → OUT.'
    ],
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
    description: 'Build a majority detector: output 1 when 2 or more of the 3 inputs are 1. Think: "at least 2 out of 3."',
    hints: [
      'Majority(A,B,C) = (A AND B) OR (B AND C) OR (A AND C).',
      'Check each pair: AND(A,B), AND(B,C), AND(A,C). If ANY pair is both 1, majority passes.',
      'Wire: A,B→AND₁, B,C→AND₂, A,C→AND₃, then OR all three results together.'
    ],
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
    description: 'Build a 2:1 multiplexer: when S=0 output A, when S=1 output B. The selector S chooses which input passes through.',
    hints: [
      'MUX = (A AND NOT(S)) OR (B AND S). When S=0, A passes; when S=1, B passes.',
      'You need: NOT(S), AND(A, NOT(S)), AND(B, S), then OR the two AND results.',
      'Wire: S→NOT. A+NOT(S)→AND₁. B+S→AND₂. AND₁+AND₂→OR→OUT.'
    ],
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
    description: 'The boss level! Build a full adder: add A + B + Cin and produce SUM and CARRY outputs. This is the building block of all CPU arithmetic.',
    hints: [
      'Full adder: SUM = A XOR B XOR Cin. CARRY = (A AND B) OR (Cin AND (A XOR B)).',
      'First compute A XOR B. Then XOR that with Cin for SUM. For CARRY, AND(A,B) OR AND(Cin, A XOR B).',
      'Wire: A,B→XOR₁. XOR₁+Cin→XOR₂→SUM. A,B→AND₁. XOR₁+Cin→AND₂. AND₁+AND₂→OR→CARRY.'
    ],
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

function generateChallenge(numInputs, numOutputs) {
  const numRows = Math.pow(2, numInputs);
  const inputLabels = ['A', 'B', 'C', 'D'].slice(0, numInputs);
  const outputLabels = numOutputs === 1 ? ['OUT'] : ['X', 'Y'];

  // Generate truth table with random but non-degenerate outputs
  let truthTable;
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
    title: `${difficultyLabel} Challenge`,
    description: `Build a circuit matching this ${numInputs}-input, ${numOutputs}-output truth table.`,
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
