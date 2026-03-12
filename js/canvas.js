// canvas.js — Canvas rendering and breadboard background

class CanvasRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.hoveredPin = null;
    this.sparkParticles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const container = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Store display dimensions for hit testing
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
  }

  render() {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

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

    // Hint highlight glow on I/O nodes
    if (this.gameState.activeHintHighlights) {
      const labels = this.gameState.activeHintHighlights;
      const allNodes = [...this.gameState.inputNodes, ...this.gameState.outputNodes];
      const pulse = 0.4 + 0.4 * Math.sin(performance.now() / 400);
      for (const node of allNodes) {
        if (labels.includes(node.label)) {
          const cx = node.x + node.width / 2;
          const cy = node.y + node.height / 2;
          // Outer glow ring
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 32);
          grad.addColorStop(0, `rgba(255, 200, 50, ${pulse * 0.35})`);
          grad.addColorStop(1, `rgba(255, 180, 0, 0)`);
          ctx.fillStyle = grad;
          ctx.fill();
          // Inner ring
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 200, 50, ${pulse * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // Gate glow during simulation
    const sim = this.gameState.simulation;
    if (sim && sim.animating) {
      for (const gate of this.gameState.gates) {
        if (gate.outputValues && gate.outputValues.some(v => v === 1)) {
          const pulse = 0.2 + 0.15 * Math.sin(performance.now() / 200);
          ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
          ctx.shadowBlur = 15;
          ctx.fillStyle = `rgba(0, 255, 100, ${pulse})`;
          ctx.fillRect(gate.x - 4, gate.y - 4, gate.def.width + 8, gate.def.height + 8);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }
      // IO node glow
      for (const node of this.gameState.inputNodes) {
        if (node.value === 1) {
          this._drawNodeGlow(ctx, node, 'rgba(0, 200, 100, 0.4)');
        }
      }
      for (const node of this.gameState.outputNodes) {
        if (node.value === 1) {
          this._drawNodeGlow(ctx, node, 'rgba(0, 200, 100, 0.4)');
        }
      }
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

    // Spark particles
    this._renderSparks(ctx);

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

    // Subtle copper trace lines (horizontal)
    ctx.strokeStyle = 'rgba(180, 160, 120, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Subtle copper trace lines (vertical)
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Grid holes with metallic sheen
    const gridSize = 20;
    for (let x = gridSize; x < width; x += gridSize) {
      for (let y = gridSize; y < height; y += gridSize) {
        // Outer ring
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#c8c4b4';
        ctx.fill();
        // Inner hole
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#b8b4a8';
        ctx.fill();
      }
    }

    // Central channel groove
    const channelY = height / 2;
    ctx.fillStyle = '#c8c4b4';
    ctx.fillRect(0, channelY - 4, width, 8);
    // Channel shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, channelY - 4, width, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, channelY + 2, width, 2);

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

  spawnSparks(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.sparkParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
      });
    }
  }

  _renderSparks(ctx) {
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const p = this.sparkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= p.decay;
      if (p.life <= 0) {
        this.sparkParticles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${Math.floor(150 + 105 * p.life)}, 50, ${p.life})`;
      ctx.fill();
    }
  }

  _drawNodeGlow(ctx, node, color) {
    const pulse = 0.5 + 0.3 * Math.sin(performance.now() / 180);
    ctx.beginPath();
    ctx.arc(node.x + 25, node.y + 20, 30, 0, Math.PI * 2);
    ctx.fillStyle = color.replace(/[\d.]+\)$/, pulse + ')');
    ctx.fill();
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

  findPinAt(mx, my, threshold) {
    if (!threshold) {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      threshold = isMobile ? 26 : 18;
    }
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
