// canvas.js — Canvas rendering and breadboard background

class CanvasRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.hoveredPin = null;
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

    ctx.clearRect(0, 0, width, height);

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

    // Compatible pin highlighting during wire drawing
    if (this.gameState.wireManager.drawing && this.gameState.wireManager.drawFrom) {
      const drawFrom = this.gameState.wireManager.drawFrom;
      const targetType = drawFrom.pinType === 'output' ? 'input' : 'output';
      const compatiblePins = this._getCompatiblePins(targetType);
      const pulse = 0.4 + 0.3 * Math.sin(performance.now() / 200);

      for (const cp of compatiblePins) {
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 0, ${pulse * 0.3})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 255, 0, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Hovered pin highlight
    if (this.hoveredPin) {
      ctx.beginPath();
      ctx.arc(this.hoveredPin.x, this.hoveredPin.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawBreadboard(ctx, width, height) {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#ece8d8');
    bgGrad.addColorStop(1, '#e0dcd0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid holes
    const gridSize = 20;
    for (let x = gridSize; x < width; x += gridSize) {
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ccc8bc';
        ctx.fill();
      }
    }

    // Central channel
    const channelY = height / 2;
    ctx.fillStyle = '#c8c4b4';
    ctx.fillRect(0, channelY - 3, width, 6);

    // Power rails
    ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(width, 30);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(50, 50, 200, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();

    // Rail labels
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'rgba(200, 50, 50, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('+', 5, 34);
    ctx.fillStyle = 'rgba(50, 50, 200, 0.5)';
    ctx.fillText('−', 5, height - 26);
  }

  _getCompatiblePins(targetType) {
    const gs = this.gameState;
    const pins = [];

    if (targetType === 'input') {
      // Show all input pins on gates and output nodes
      for (const gate of gs.gates) {
        const inputPins = gate.getInputPins();
        for (const pin of inputPins) {
          pins.push({ x: pin.x - 12, y: pin.y });
        }
      }
      for (const node of gs.outputNodes) {
        const pin = node.getPin();
        pins.push({ x: pin.x - 12, y: pin.y });
      }
    } else {
      // Show all output pins on gates and input nodes
      for (const gate of gs.gates) {
        const outputPins = gate.getOutputPins();
        for (const pin of outputPins) {
          pins.push({ x: pin.x + 12, y: pin.y });
        }
      }
      for (const node of gs.inputNodes) {
        const pin = node.getPin();
        pins.push({ x: pin.x + 12, y: pin.y });
      }
    }

    return pins;
  }

  findPinAt(mx, my, threshold = 18) {
    const gs = this.gameState;

    for (const node of gs.inputNodes) {
      const pin = node.getPin();
      const px = pin.x + 12;
      const py = pin.y;
      if (Math.hypot(mx - px, my - py) < threshold) {
        return { gateId: node.id, pinIndex: 0, pinType: 'output', x: px, y: py };
      }
    }

    for (const node of gs.outputNodes) {
      const pin = node.getPin();
      const px = pin.x - 12;
      const py = pin.y;
      if (Math.hypot(mx - px, my - py) < threshold) {
        return { gateId: node.id, pinIndex: 0, pinType: 'input', x: px, y: py };
      }
    }

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

  findGateAt(mx, my) {
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
