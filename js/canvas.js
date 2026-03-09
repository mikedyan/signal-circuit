// canvas.js — Canvas rendering and breadboard background

class CanvasRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Breadboard background
    this.drawBreadboard(ctx, width, height);

    // Wires (behind gates)
    this.gameState.wireManager.render(ctx);

    // Input/output nodes
    for (const node of this.gameState.inputNodes) {
      node.render(ctx);
    }
    for (const node of this.gameState.outputNodes) {
      node.render(ctx);
    }

    // Gates
    for (const gate of this.gameState.gates) {
      const isSelected = this.gameState.selectedGate === gate;
      gate.render(ctx, isSelected);
    }
  }

  drawBreadboard(ctx, width, height) {
    // Background
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    const gridSize = 20;
    ctx.fillStyle = '#d4d0c4';
    for (let x = gridSize; x < width; x += gridSize) {
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Central channel (like a real breadboard)
    const channelY = height / 2;
    ctx.fillStyle = '#c8c4b8';
    ctx.fillRect(0, channelY - 3, width, 6);

    // Power rails at top and bottom
    ctx.strokeStyle = '#cc3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(width, 30);
    ctx.stroke();

    ctx.strokeStyle = '#3333cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();

    // Rail labels
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = '#cc3333';
    ctx.textAlign = 'left';
    ctx.fillText('+', 5, 34);
    ctx.fillStyle = '#3333cc';
    ctx.fillText('−', 5, height - 26);
  }

  // Hit-test a pin near mouse position
  findPinAt(mx, my, threshold = 18) {
    const gs = this.gameState;

    // Check input node pins
    for (const node of gs.inputNodes) {
      const pin = node.getPin();
      const px = pin.x + 12; // pin circle offset
      const py = pin.y;
      if (Math.hypot(mx - px, my - py) < threshold) {
        return { gateId: node.id, pinIndex: 0, pinType: 'output', x: px, y: py };
      }
    }

    // Check output node pins
    for (const node of gs.outputNodes) {
      const pin = node.getPin();
      const px = pin.x - 12;
      const py = pin.y;
      if (Math.hypot(mx - px, my - py) < threshold) {
        return { gateId: node.id, pinIndex: 0, pinType: 'input', x: px, y: py };
      }
    }

    // Check gate pins
    for (const gate of gs.gates) {
      const inputPins = gate.getInputPins();
      for (let i = 0; i < inputPins.length; i++) {
        const pin = inputPins[i];
        const px = pin.x - 12;
        const py = pin.y;
        if (Math.hypot(mx - px, my - py) < threshold) {
          return { gateId: gate.id, pinIndex: i, pinType: 'input', x: px, y: py };
        }
      }

      const outputPins = gate.getOutputPins();
      for (let i = 0; i < outputPins.length; i++) {
        const pin = outputPins[i];
        const px = pin.x + 12;
        const py = pin.y;
        if (Math.hypot(mx - px, my - py) < threshold) {
          return { gateId: gate.id, pinIndex: i, pinType: 'output', x: px, y: py };
        }
      }
    }

    return null;
  }

  // Hit-test a gate body
  findGateAt(mx, my) {
    // Check in reverse order (topmost first)
    for (let i = this.gameState.gates.length - 1; i >= 0; i--) {
      if (this.gameState.gates[i].containsPoint(mx, my)) {
        return this.gameState.gates[i];
      }
    }
    return null;
  }

  getMousePos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
