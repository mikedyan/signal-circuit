// simulation.js — Circuit evaluation engine

class Simulation {
  constructor(gameState) {
    this.gameState = gameState;
  }

  // Build a dependency graph and topologically sort gates
  topologicalSort() {
    const gs = this.gameState;
    const wires = gs.wireManager.wires;
    const gates = gs.gates;
    const nodeIds = [...gs.inputNodes.map(n => n.id), ...gates.map(g => g.id)];

    // Build adjacency: who depends on whom
    const inDegree = {};
    const adj = {};
    for (const id of nodeIds) {
      inDegree[id] = 0;
      adj[id] = [];
    }
    // Add output nodes
    for (const n of gs.outputNodes) {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    }

    for (const wire of wires) {
      if (!(wire.toGateId in inDegree)) continue;
      if (!(wire.fromGateId in adj)) continue;
      adj[wire.fromGateId].push(wire.toGateId);
      inDegree[wire.toGateId]++;
    }

    // Kahn's algorithm
    const queue = [];
    const allIds = [...nodeIds, ...gs.outputNodes.map(n => n.id)];
    for (const id of allIds) {
      if (inDegree[id] === 0) queue.push(id);
    }

    const sorted = [];
    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);
      for (const neighbor of (adj[node] || [])) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  // Evaluate circuit for a single set of input values
  evaluateOnce(inputValues) {
    const gs = this.gameState;
    const wires = gs.wireManager.wires;

    // Set input node values
    gs.inputNodes.forEach((node, i) => {
      node.value = inputValues[i] || 0;
    });

    // Reset all gate inputs
    for (const gate of gs.gates) {
      gate.inputValues = new Array(gate.def.inputs).fill(0);
    }

    // Reset output nodes
    for (const node of gs.outputNodes) {
      node.value = 0;
    }

    // Get evaluation order
    const order = this.topologicalSort();

    // Propagate signals in order
    for (const nodeId of order) {
      const node = gs.findNode(nodeId);
      if (!node) continue;

      if (node instanceof Gate) {
        // First, collect inputs from wires
        for (const wire of wires) {
          if (wire.toGateId === node.id) {
            const fromNode = gs.findNode(wire.fromGateId);
            if (fromNode instanceof Gate) {
              node.inputValues[wire.toPinIndex] = fromNode.outputValues[wire.fromPinIndex];
              wire.signalValue = fromNode.outputValues[wire.fromPinIndex];
            } else if (fromNode instanceof IONode) {
              node.inputValues[wire.toPinIndex] = fromNode.value;
              wire.signalValue = fromNode.value;
            }
          }
        }
        // Evaluate gate
        node.evaluate();
      } else if (node instanceof IONode && node.type === 'output') {
        // Collect value from wire
        for (const wire of wires) {
          if (wire.toGateId === node.id) {
            const fromNode = gs.findNode(wire.fromGateId);
            if (fromNode instanceof Gate) {
              node.value = fromNode.outputValues[wire.fromPinIndex];
              wire.signalValue = fromNode.outputValues[wire.fromPinIndex];
            } else if (fromNode instanceof IONode) {
              node.value = fromNode.value;
              wire.signalValue = fromNode.value;
            }
          }
        }
      }
    }

    // Read output values
    return gs.outputNodes.map(n => n.value);
  }

  // Run all rows of the truth table
  runAll() {
    const gs = this.gameState;
    const level = gs.currentLevel;
    if (!level) return [];

    const results = [];

    for (const row of level.truthTable) {
      const outputs = this.evaluateOnce(row.inputs);
      const expected = row.outputs;
      const pass = outputs.every((v, i) => v === expected[i]);
      results.push({
        inputs: row.inputs,
        expectedOutputs: expected,
        actualOutputs: outputs,
        pass,
      });
    }

    return results;
  }
}
