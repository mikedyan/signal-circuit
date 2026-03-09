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
    description: 'Combine AND and NOT to build NAND. Output is 0 ONLY when both inputs are 1.',
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
    description: 'Combine OR and NOT to build NOR. Output is 1 ONLY when both inputs are 0.',
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
    description: 'Meet the XOR gate! Output is 1 when inputs DIFFER. Connect it up.',
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
    description: 'Build XNOR: output 1 when both inputs are the SAME. Hint: XOR + NOT.',
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
    description: 'Build AND behavior using ONLY OR and NOT gates. Think De Morgan!',
    availableGates: ['OR', 'NOT'],
    optimalGates: 3,
    goodGates: 4,
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
    description: 'Build OR behavior using ONLY AND and NOT gates. De Morgan strikes again!',
    availableGates: ['AND', 'NOT'],
    optimalGates: 3,
    goodGates: 4,
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
    description: 'Build A → B (material implication): output is 0 ONLY when A=1 and B=0. Use any gates!',
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
