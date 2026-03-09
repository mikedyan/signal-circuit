// levels.js — Level definitions and progression

const LEVELS = [
  {
    id: 1,
    title: 'AND Gate Basics',
    description: 'Connect the two inputs through an AND gate to the output. The output should be 1 only when BOTH inputs are 1.',
    availableGates: ['AND'],
    inputs: [
      { label: 'A', x: 60, y: 120 },
      { label: 'B', x: 60, y: 260 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 190 },
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
    description: 'Connect the input through a NOT gate to the output. The output should be the OPPOSITE of the input.',
    availableGates: ['NOT'],
    inputs: [
      { label: 'A', x: 60, y: 190 },
    ],
    outputs: [
      { label: 'OUT', x: 600, y: 190 },
    ],
    truthTable: [
      { inputs: [0], outputs: [1] },
      { inputs: [1], outputs: [0] },
    ],
  },
];

function getLevel(id) {
  return LEVELS.find(l => l.id === id) || null;
}

function getLevelCount() {
  return LEVELS.length;
}
