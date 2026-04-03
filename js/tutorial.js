// ── Interactive Wire-Drawing Tutorial (Day 38) ──
// Step-by-step guided tutorial for Level 1
// Steps: 0=place gate, 1=click input A pin, 2=click AND input pin 0,
//        3=click input B pin, 4=click AND input pin 1,
//        5=click AND output pin, 6=click OUT input pin, 7=press RUN

class InteractiveTutorial {
  constructor(gameState) {
    this.gameState = gameState;
    this.active = false;
    this.step = 0;
    this.totalSteps = 8; // 0-7
    this._animStart = performance.now();
    this._overlay = document.getElementById('tutorial-overlay');
    this._textEl = document.getElementById('tutorial-text');
    this._skipBtn = document.getElementById('tutorial-skip-btn');
    this._stepIndicator = document.getElementById('tutorial-step-indicator');

    if (this._skipBtn) {
      this._skipBtn.addEventListener('click', () => this.skip());
    }
  }

  // Check if tutorial should be shown
  static shouldShow(gameState) {
    try {
      if (localStorage.getItem('signal-circuit-tutorial-done') === 'true') return false;
      // Don't show if level 1 is already completed
      const progress = gameState.progress && gameState.progress.levels && gameState.progress.levels[1];
      if (progress && progress.completed) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  start() {
    this.active = true;
    this.step = 0;
    this._animStart = performance.now();
    if (this._overlay) this._overlay.style.display = 'flex';
    this._updateStep();
    this.gameState.markDirty();
  }

  isActive() {
    return this.active;
  }

  getCurrentStep() {
    return this.step;
  }

  // Get the world-space position to highlight for the current step
  getHighlightTarget() {
    if (!this.active) return null;
    const gs = this.gameState;

    switch (this.step) {
      case 0: {
        // Highlight toolbox — return null for canvas (toolbox is DOM)
        return { type: 'toolbox' };
      }
      case 1: {
        // Input A's output pin
        const nodeA = gs.inputNodes.find(n => n.label === 'A');
        if (!nodeA) return null;
        const pin = nodeA.getPin();
        return { type: 'pin', x: pin.x + 12, y: pin.y, label: 'Input A' };
      }
      case 2: {
        // AND gate's first input pin (top)
        const gate = gs.gates[0];
        if (!gate) return null;
        const pins = gate.getInputPins();
        if (pins.length === 0) return null;
        return { type: 'pin', x: pins[0].x - 12, y: pins[0].y, label: 'AND input' };
      }
      case 3: {
        // Input B's output pin
        const nodeB = gs.inputNodes.find(n => n.label === 'B');
        if (!nodeB) return null;
        const pin = nodeB.getPin();
        return { type: 'pin', x: pin.x + 12, y: pin.y, label: 'Input B' };
      }
      case 4: {
        // AND gate's second input pin (bottom)
        const gate = gs.gates[0];
        if (!gate) return null;
        const pins = gate.getInputPins();
        if (pins.length < 2) return null;
        return { type: 'pin', x: pins[1].x - 12, y: pins[1].y, label: 'AND input' };
      }
      case 5: {
        // AND gate's output pin
        const gate = gs.gates[0];
        if (!gate) return null;
        const pins = gate.getOutputPins();
        if (pins.length === 0) return null;
        return { type: 'pin', x: pins[0].x + 12, y: pins[0].y, label: 'AND output' };
      }
      case 6: {
        // OUT node's input pin
        const outNode = gs.outputNodes[0];
        if (!outNode) return null;
        const pin = outNode.getPin();
        return { type: 'pin', x: pin.x - 12, y: pin.y, label: 'Output' };
      }
      case 7: {
        // RUN button
        return { type: 'run-btn' };
      }
      default:
        return null;
    }
  }

  _updateStep() {
    if (!this.active) return;
    this._animStart = performance.now();

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const tap = isMobile ? 'Tap' : 'Click';
    const drag = isMobile ? 'Drag' : 'Drag';

    const messages = [
      `${drag} the <strong>AND</strong> gate from the toolbox onto the board`,
      `${tap} on <strong>Input A's</strong> pin to start a wire`,
      `${tap} on the <strong>AND gate's top input</strong> to connect`,
      `${tap} on <strong>Input B's</strong> pin to start another wire`,
      `${tap} on the <strong>AND gate's bottom input</strong> to connect`,
      `${tap} on the <strong>AND gate's output</strong> pin to start the final wire`,
      `${tap} on the <strong>Output</strong> pin to complete the circuit`,
      `Press <strong>▶ RUN</strong> to test your circuit!`,
    ];

    if (this._textEl) {
      this._textEl.innerHTML = messages[this.step] || '';
    }

    if (this._stepIndicator) {
      this._stepIndicator.textContent = `Step ${this.step + 1} of ${this.totalSteps}`;
    }

    // Toolbox highlight
    this._updateToolboxHighlight();
    // RUN button highlight
    this._updateRunBtnHighlight();

    this.gameState.markDirty();
  }

  _updateToolboxHighlight() {
    const toolGates = document.querySelectorAll('.tool-gate');
    toolGates.forEach(el => el.classList.remove('tutorial-highlight'));
    if (this.step === 0) {
      toolGates.forEach(el => el.classList.add('tutorial-highlight'));
    }
  }

  _updateRunBtnHighlight() {
    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
      if (this.step === 7) {
        runBtn.classList.add('tutorial-highlight');
      } else {
        runBtn.classList.remove('tutorial-highlight');
      }
    }
  }

  advance() {
    if (!this.active) return;
    this.step++;
    if (this.step >= this.totalSteps) {
      this._complete();
      return;
    }
    this._updateStep();
  }

  // Called by GameState when relevant actions happen
  onGatePlaced() {
    if (!this.active || this.step !== 0) return;
    this.advance();
  }

  onWireStarted(gateId, pinIndex, pinType) {
    if (!this.active) return;
    const gs = this.gameState;

    // Step 1: Started wire from Input A
    if (this.step === 1) {
      const nodeA = gs.inputNodes.find(n => n.label === 'A');
      if (nodeA && gateId === nodeA.id) {
        this.advance();
      }
    }
    // Step 3: Started wire from Input B
    else if (this.step === 3) {
      const nodeB = gs.inputNodes.find(n => n.label === 'B');
      if (nodeB && gateId === nodeB.id) {
        this.advance();
      }
    }
    // Step 5: Started wire from AND gate output
    else if (this.step === 5) {
      const gate = gs.gates[0];
      if (gate && gateId === gate.id && pinType === 'output') {
        this.advance();
      }
    }
  }

  onWireCompleted(fromGateId, toGateId, toPinIndex) {
    if (!this.active) return;
    const gs = this.gameState;

    // Step 2: Completed wire to AND gate input 0
    if (this.step === 2) {
      const gate = gs.gates[0];
      if (gate && toGateId === gate.id && toPinIndex === 0) {
        this.advance();
      }
    }
    // Step 4: Completed wire to AND gate input 1
    else if (this.step === 4) {
      const gate = gs.gates[0];
      if (gate && toGateId === gate.id && toPinIndex === 1) {
        this.advance();
      }
    }
    // Step 6: Completed wire to OUT node
    else if (this.step === 6) {
      const outNode = gs.outputNodes[0];
      if (outNode && toGateId === outNode.id) {
        this.advance();
      }
    }
  }

  onRunPressed() {
    if (!this.active || this.step !== 7) return;
    this._complete();
  }

  _complete() {
    this.active = false;
    if (this._overlay) this._overlay.style.display = 'none';
    this._updateToolboxHighlight();
    this._updateRunBtnHighlight();
    try {
      localStorage.setItem('signal-circuit-tutorial-done', 'true');
    } catch (e) {}
    this.gameState.markDirty();
  }

  skip() {
    this._complete();
  }

  destroy() {
    this.active = false;
    if (this._overlay) this._overlay.style.display = 'none';
    this._updateToolboxHighlight();
    this._updateRunBtnHighlight();
  }

  // Render tutorial highlights on the canvas (called from Renderer.render())
  renderHighlights(ctx) {
    if (!this.active) return;
    const target = this.getHighlightTarget();
    if (!target || target.type === 'toolbox' || target.type === 'run-btn') return;

    const t = (performance.now() - this._animStart) / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4); // ~2Hz pulse

    const { x, y } = target;

    // Outer pulsing ring
    const outerR = 18 + 4 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.4 + 0.5 * pulse})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner glow
    const grad = ctx.createRadialGradient(x, y, 2, x, y, outerR);
    grad.addColorStop(0, `rgba(255, 200, 50, ${0.25 * pulse})`);
    grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.beginPath();
    ctx.arc(x, y, outerR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Animated arrow pointing at the pin (small downward arrow above)
    const arrowY = y - outerR - 8 - 4 * Math.sin(t * 3);
    ctx.beginPath();
    ctx.moveTo(x, arrowY + 10);
    ctx.lineTo(x - 6, arrowY);
    ctx.lineTo(x + 6, arrowY);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 200, 50, ${0.6 + 0.4 * pulse})`;
    ctx.fill();
  }
}
