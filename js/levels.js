// levels.js — Level definitions, chapters, and star thresholds

const CHAPTERS = [
  { id: 1, title: 'Chapter 1: Basics', levels: [1, 2, 3, 4, 5] },
  { id: 2, title: 'Chapter 2: Combinations', levels: [6, 7, 8, 9, 10] },
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
];

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
