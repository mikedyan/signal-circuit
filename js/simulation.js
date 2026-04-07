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

        // Day 37: Reset wire animation state for this row
        gs.wireManager.resetAllSignalFlow();

        // Evaluate circuit (computes signal values on wires)
        const outputs = this.evaluateOnce(row.inputs);
        const expected = row.outputs;
        const pass = outputs.every((v, idx) => v === expected[idx]);

        results.push({
          inputs: row.inputs,
          expectedOutputs: expected,
          actualOutputs: outputs,
          pass,
        });

        // Day 37 T4: Pulse input nodes at start of each row
        for (const node of gs.inputNodes) {
          node._signalPulse = performance.now();
        }

        // Day 37: Staggered signal flow animation
        await this.animateSignalFlow();

        // Day 37 T5: Flash output nodes when signal arrives
        for (const node of gs.outputNodes) {
          node._receiveFlash = performance.now();
        }

        if (onRowComplete) onRowComplete(results.slice(), i);

        // Pause between rows
        await new Promise(r => setTimeout(r, 400));

        // Reset for next row
        gs.wireManager.resetAllSignalFlow();
      }

      if (onDone) onDone(results);
    } finally {
      this.animating = false;
      this.animationRow = -1;
      gs.wireManager.resetAllSignalFlow();
    }
  }

  // Day 37: Compute topological depth for each wire
  _computeWireDepths() {
    const gs = this.gameState;
    const wires = gs.wireManager.wires;

    // Build node depth map: input nodes = depth 0
    const nodeDepth = {};
    for (const node of gs.inputNodes) {
      nodeDepth[node.id] = 0;
    }

    // BFS through sorted nodes to assign depths
    const order = this.topologicalSort();
    for (const nodeId of order) {
      if (nodeDepth[nodeId] === undefined) nodeDepth[nodeId] = 0;
      // All wires from this node go to the next depth
      for (const wire of wires) {
        if (wire.fromGateId === nodeId) {
          const targetDepth = nodeDepth[nodeId] + 1;
          if (nodeDepth[wire.toGateId] === undefined || targetDepth > nodeDepth[wire.toGateId]) {
            nodeDepth[wire.toGateId] = targetDepth;
          }
          wire._animDepth = nodeDepth[nodeId]; // wire depth = source node depth
        }
      }
    }

    // Find max depth for duration scaling
    let maxDepth = 0;
    for (const wire of wires) {
      if (wire._animDepth > maxDepth) maxDepth = wire._animDepth;
    }
    return maxDepth;
  }

  // Day 37: Animate signal flow through wires in topological order
  animateSignalFlow() {
    const gs = this.gameState;
    const wires = gs.wireManager.wires;

    // Compute depths
    const maxDepth = this._computeWireDepths();

    // T8: Performance guard — skip staggered animation for very complex circuits
    const skipStaggered = wires.length > 50;

    // T9: Scale duration with circuit depth (400ms min, 1200ms max)
    const depthDelay = 150; // ms between depth levels
    const wireTravelTime = 250; // ms for a signal to travel one wire
    const totalDuration = skipStaggered ? 300 : Math.min(1200, Math.max(400, (maxDepth + 1) * depthDelay + wireTravelTime));

    // Set up per-wire animation delays
    for (const wire of wires) {
      wire._animDelay = skipStaggered ? 0 : wire._animDepth * depthDelay;
      wire._animActive = true;
      wire._animPhase = 0;
    }

    return new Promise(resolve => {
      const start = performance.now();

      const animate = (now) => {
        const elapsed = now - start;
        let anyActive = false;

        for (const wire of wires) {
          if (!wire._animActive) continue;
          const wireElapsed = elapsed - wire._animDelay;
          if (wireElapsed < 0) {
            wire._animPhase = 0;
            anyActive = true;
          } else {
            wire._animPhase = Math.min(wireElapsed / wireTravelTime, 1);
            if (wire._animPhase < 1) anyActive = true;

            // T6: Notify gate when signal arrives at its input
            if (wire._animPhase >= 0.95) {
              const toNode = gs.findNode(wire.toGateId);
              if (toNode && toNode instanceof Gate && !toNode._signalArrived) {
                toNode._signalArrived = performance.now();
              }
            }
          }
        }

        // Update global animation progress for compatibility
        this.animationProgress = Math.min(elapsed / totalDuration, 1);
        gs.markDirty();

        if (anyActive && elapsed < totalDuration) {
          requestAnimationFrame(animate);
        } else {
          // Ensure all phases reach 1
          for (const wire of wires) {
            wire._animPhase = 1;
          }
          this.animationProgress = 1;
          gs.markDirty();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // Legacy: Animate a pulse through all wires (kept for backward compat)
  animatePulse() {
    return this.animateSignalFlow();
  }
}

// Day 42 T1: Trace signal paths for failing outputs
Simulation.prototype.traceFailurePath = function(inputValues, expectedOutputs) {
  const gs = this.gameState;
  const wires = gs.wireManager.wires;
  const actualOutputs = this.evaluateOnce(inputValues);
  const traces = [];

  for (let oi = 0; oi < gs.outputNodes.length; oi++) {
    const outNode = gs.outputNodes[oi];
    const expected = expectedOutputs[oi];
    const actual = actualOutputs[oi];
    if (actual === expected) continue;

    // T4: Check if output is disconnected
    const incomingWire = wires.find(w => w.toGateId === outNode.id);
    if (!incomingWire) {
      traces.push({
        outputLabel: outNode.label,
        outputNodeId: outNode.id,
        expected: expected,
        actual: actual,
        disconnected: true,
        path: [],
        gateIds: [],
        wireIds: [],
        message: 'Output ' + outNode.label + ' is not connected to any gate',
      });
      continue;
    }

    // Trace backward from output through gates, max depth 3
    var path = [];
    var gateIds = [];
    var wireIds = [incomingWire.id];
    var currentNodeId = incomingWire.fromGateId;
    var currentPinIndex = incomingWire.fromPinIndex;
    var depth = 0;
    var maxDepth = 3;

    while (depth < maxDepth) {
      var node = gs.findNode(currentNodeId);
      if (!node) break;

      if (node instanceof IONode) {
        path.unshift({
          nodeId: node.id,
          label: node.label,
          type: 'input',
          value: node.value,
        });
        break;
      }

      if (node instanceof Gate) {
        gateIds.push(node.id);
        var inputVals = node.inputValues ? node.inputValues.slice() : [];
        var outputVal = node.outputValues ? node.outputValues[currentPinIndex] : 0;
        path.unshift({
          nodeId: node.id,
          gateType: node.type,
          type: 'gate',
          inputValues: inputVals,
          outputValue: outputVal,
        });

        // Follow first input wire to go deeper
        var inWire = wires.find(function(w) { return w.toGateId === node.id && w.toPinIndex === 0; });
        if (inWire) {
          wireIds.push(inWire.id);
          currentNodeId = inWire.fromGateId;
          currentPinIndex = inWire.fromPinIndex;
          depth++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Build human-readable message
    var message = '';
    for (var pi = 0; pi < path.length; pi++) {
      var step = path[pi];
      if (step.type === 'input') {
        message += step.label + '=' + step.value;
      } else if (step.type === 'gate') {
        var ins = step.inputValues.map(function(v) { return String(v); }).join(',');
        message += ' \u2192 ' + step.gateType + '(' + ins + ') = ' + step.outputValue;
      }
    }
    message += ' \u2192 ' + outNode.label + ' gets ' + actual + ', but expected ' + expected;

    traces.push({
      outputLabel: outNode.label,
      outputNodeId: outNode.id,
      expected: expected,
      actual: actual,
      disconnected: false,
      path: path,
      gateIds: gateIds,
      wireIds: wireIds,
      message: message,
    });
  }

  return traces;
};

// Day 42 T5: Detect outputs that are always-0 or always-1
Simulation.prototype.detectConstantOutputs = function(results) {
  if (!results || results.length < 2) return {};
  var numOutputs = results[0].actualOutputs.length;
  var constants = {};
  for (var oi = 0; oi < numOutputs; oi++) {
    var firstVal = results[0].actualOutputs[oi];
    var isConstant = results.every(function(r) { return r.actualOutputs[oi] === firstVal; });
    if (isConstant) {
      constants[oi] = firstVal;
    }
  }
  return constants;
};
