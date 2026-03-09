// main.js — App initialization and game state

class GameState {
  constructor() {
    this.gates = [];
    this.inputNodes = [];
    this.outputNodes = [];
    this.nextId = 1000;
    this.currentLevel = null;
    this.selectedGate = null;
    this.wireManager = new WireManager(this);
    this.simulation = new Simulation(this);
    this.renderer = null;
    this.ui = null;
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new CanvasRenderer(canvas, this);
    this.ui = new UI(this);

    this.setupCanvasEvents(canvas);
    this.loadLevel(1);
    this.startRenderLoop();
  }

  findNode(id) {
    const gate = this.gates.find(g => g.id === id);
    if (gate) return gate;
    const inp = this.inputNodes.find(n => n.id === id);
    if (inp) return inp;
    const out = this.outputNodes.find(n => n.id === id);
    if (out) return out;
    return null;
  }

  addGate(type, x, y) {
    const gate = new Gate(type, x, y, this.nextId++);
    this.gates.push(gate);
    this.ui.updateStatusBar(`Placed ${type} gate`);
    return gate;
  }

  removeGate(gate) {
    this.wireManager.removeWiresForGate(gate.id);
    this.gates = this.gates.filter(g => g.id !== gate.id);
    if (this.selectedGate === gate) this.selectedGate = null;
    this.ui.updateStatusBar(`Removed ${gate.type} gate`);
  }

  loadLevel(id) {
    const level = getLevel(id);
    if (!level) return;

    this.currentLevel = level;
    this.gates = [];
    this.inputNodes = [];
    this.outputNodes = [];
    this.wireManager.clear();
    this.selectedGate = null;

    // Create input nodes
    for (const inp of level.inputs) {
      const node = new IONode('input', inp.label, inp.x, inp.y, this.nextId++);
      this.inputNodes.push(node);
    }

    // Create output nodes
    for (const out of level.outputs) {
      const node = new IONode('output', out.label, out.x, out.y, this.nextId++);
      this.outputNodes.push(node);
    }

    this.ui.updateLevelInfo();
    this.ui.updateToolbox();
    this.ui.updateTruthTable(null);
    this.ui.updateResultDisplay('idle', 'Build your circuit, then press RUN');
    this.ui.updateStatusBar(`Level ${level.id}: ${level.title}`);
  }

  clearCircuit() {
    this.gates = [];
    this.wireManager.clear();
    this.selectedGate = null;

    // Reset wire signal values
    for (const node of this.inputNodes) node.value = 0;
    for (const node of this.outputNodes) node.value = 0;

    this.ui.updateTruthTable(null);
  }

  runSimulation() {
    const results = this.simulation.runAll();
    const allPass = results.every(r => r.pass);

    this.ui.updateTruthTable(results);

    if (allPass) {
      this.ui.updateResultDisplay('pass', '✓ CIRCUIT CORRECT!');
      this.ui.updateStatusBar('Level complete! All truth table rows match.');
    } else {
      const passCount = results.filter(r => r.pass).length;
      this.ui.updateResultDisplay('fail', `✗ ${passCount}/${results.length} rows correct`);
      this.ui.updateStatusBar('Some rows don\'t match. Check your circuit.');
    }

    // Re-render with final state (last test case visible)
    this.renderer.render();
  }

  setupCanvasEvents(canvas) {
    let isDraggingGate = false;
    let dragGate = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    canvas.addEventListener('mousedown', (e) => {
      const pos = this.renderer.getMousePos(e);

      // Check for pin click (start wire drawing)
      const pin = this.renderer.findPinAt(pos.x, pos.y);
      if (pin) {
        if (this.wireManager.drawing) {
          // Finish wire
          this.wireManager.finishDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
        } else {
          // Start wire
          this.wireManager.startDrawing(pin.gateId, pin.pinIndex, pin.pinType, pin.x, pin.y);
        }
        return;
      }

      // Cancel wire drawing if clicking empty space
      if (this.wireManager.drawing) {
        this.wireManager.cancelDrawing();
        return;
      }

      // Check for gate click (select/drag)
      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.selectedGate = gate;
        isDraggingGate = true;
        dragGate = gate;
        dragOffsetX = pos.x - gate.x;
        dragOffsetY = pos.y - gate.y;
        return;
      }

      // Clicked empty space — deselect
      this.selectedGate = null;
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = this.renderer.getMousePos(e);

      if (this.wireManager.drawing) {
        this.wireManager.updateMouse(pos.x, pos.y);
      }

      if (isDraggingGate && dragGate) {
        const gridSize = 20;
        dragGate.x = Math.round((pos.x - dragOffsetX) / gridSize) * gridSize;
        dragGate.y = Math.round((pos.y - dragOffsetY) / gridSize) * gridSize;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      isDraggingGate = false;
      dragGate = null;
    });

    // Right-click to delete gate
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const pos = this.renderer.getMousePos(e);
      const gate = this.renderer.findGateAt(pos.x, pos.y);
      if (gate) {
        this.removeGate(gate);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedGate) {
          this.removeGate(this.selectedGate);
        }
      }
      if (e.key === 'Escape') {
        this.wireManager.cancelDrawing();
        this.selectedGate = null;
      }
    });
  }

  startRenderLoop() {
    const loop = () => {
      this.renderer.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameState();
  game.init();
  window.game = game; // For debugging
});
