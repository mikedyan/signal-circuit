// simulation.js — Circuit evaluation engine with animation support

class Simulation {
  constructor(gameState) {
    this.gameState = gameState;
    this.animating = false;
    this.animationRow = -1;
    this.animationProgress = 0; // 0-1 for wire glow animation
  }

  // Build a dependency graph and topologically sort gates
  topologicalSort() {
    const gs = this.gameState;
    const wires = gs.wireManager.wires;
    const gates = gs.gates;
    const nodeIds = [...gs.inputNodes.map(n => n.id), ...gates.map(g => g.id)];

    const inDegree = {};
    const adj = {};
    for (const id of nodeIds) {
      inDegree[id] = 0;
      adj[id] = [];
    }
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

    gs.inputNodes.forEach((node, i) => {
      node.value = inputValues[i] || 0;
    });

    for (const gate of gs.gates) {
      gate.inputValues = new Array(gate.def.inputs).fill(0);
    }

    for (const node of gs.outputNodes) {
      node.value = 0;
    }

    const order = this.topologicalSort();

    for (const nodeId of order) {
      const node = gs.findNode(nodeId);
      if (!node) continue;

      if (node instanceof Gate) {
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
        node.evaluate();
      } else if (node instanceof IONode && node.type === 'output') {
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

    return gs.outputNodes.map(n => n.value);
  }

  // Run all rows of the truth table (instant)
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

  // Animated run — evaluates rows one at a time with delays
  async runAnimated(onRowComplete, onDone) {
    const gs = this.gameState;
    const level = gs.currentLevel;
    if (!level) return;

    this.animating = true;
    const results = [];

    try {
      // Clear all wire signals first
      for (const wire of gs.wireManager.wires) {
        wire.signalValue = 0;
      }

      for (let i = 0; i < level.truthTable.length; i++) {
        this.animationRow = i;
        const row = level.truthTable[i];

        // Animate signal propagation for this row
        const outputs = this.evaluateOnce(row.inputs);
        const expected = row.outputs;
        const pass = outputs.every((v, idx) => v === expected[idx]);

        results.push({
          inputs: row.inputs,
          expectedOutputs: expected,
          actualOutputs: outputs,
          pass,
        });

        // Signal pulse animation
        await this.animatePulse();

        if (onRowComplete) onRowComplete(results.slice(), i);

        // Pause between rows
        await new Promise(r => setTimeout(r, 400));
      }

      if (onDone) onDone(results);
    } finally {
      this.animating = false;
      this.animationRow = -1;
    }
  }

  // Animate a pulse through all wires
  animatePulse() {
    return new Promise(resolve => {
      const duration = 300;
      const start = performance.now();

      const animate = (now) => {
        this.animationProgress = Math.min((now - start) / duration, 1);
        if (this.animationProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.animationProgress = 1;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
