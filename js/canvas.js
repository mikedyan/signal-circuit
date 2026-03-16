// canvas.js — Canvas rendering and breadboard background

class CanvasRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.hoveredPin = null;
    this.sparkParticles = [];
    this.ripples = [];
    this.viewTransform = { x: 0, y: 0, scale: 1 };
    this.minScale = 0.3;
    this.maxScale = 3.0;
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
    // Setting canvas.width clears the buffer — must re-render
    if (this.gameState) this.gameState.markDirty();
  }

  // ── View Transform (Zoom/Pan) ──

  screenToWorld(sx, sy) {
    const vt = this.viewTransform;
    return {
      x: (sx - vt.x) / vt.scale,
      y: (sy - vt.y) / vt.scale,
    };
  }

  worldToScreen(wx, wy) {
    const vt = this.viewTransform;
    return {
      x: wx * vt.scale + vt.x,
      y: wy * vt.scale + vt.y,
    };
  }

  zoomAt(newScale, screenX, screenY) {
    const vt = this.viewTransform;
    const clamped = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    const worldX = (screenX - vt.x) / vt.scale;
    const worldY = (screenY - vt.y) / vt.scale;
    vt.scale = clamped;
    vt.x = screenX - worldX * clamped;
    vt.y = screenY - worldY * clamped;
    this.gameState.markDirty();
    this._updateZoomButton();
  }

  pan(dx, dy) {
    this.viewTransform.x += dx;
    this.viewTransform.y += dy;
    this.gameState.markDirty();
    this._updateZoomButton();
  }

  resetView() {
    this.viewTransform = { x: 0, y: 0, scale: 1 };
    this.gameState.markDirty();
    this._updateZoomButton();
  }

  isDefaultView() {
    const vt = this.viewTransform;
    return Math.abs(vt.scale - 1) < 0.01 && Math.abs(vt.x) < 1 && Math.abs(vt.y) < 1;
  }

  getZoomPercent() {
    return Math.round(this.viewTransform.scale * 100);
  }

  _updateZoomButton() {
    const btn = document.getElementById('zoom-reset-btn');
    if (!btn) return;
    if (this.isDefaultView()) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
      btn.textContent = '↺ ' + this.getZoomPercent() + '%';
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.displayWidth || this.canvas.width;
    const height = this.displayHeight || this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Apply view transform (zoom/pan)
    const vt = this.viewTransform;
    ctx.save();
    ctx.translate(vt.x, vt.y);
    ctx.scale(vt.scale, vt.scale);

    // Visible world rect for breadboard tiling
    const visWorld = {
      left: -vt.x / vt.scale,
      top: -vt.y / vt.scale,
      right: (-vt.x + width) / vt.scale,
      bottom: (-vt.y + height) / vt.scale,
    };
    this.drawBreadboard(ctx, visWorld);

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

    // T10: Ghost overlay rendering (behind active gates)
    if (this.gameState.showGhost && this.gameState.ghostOverlay) {
      this._renderGhostOverlay(ctx);
    }

    // T6: Gate-colored glow during simulation
    const sim = this.gameState.simulation;
    if (sim && sim.animating) {
      for (const gate of this.gameState.gates) {
        if (gate.outputValues && gate.outputValues.some(v => v === 1)) {
          const pulse = 0.2 + 0.15 * Math.sin(performance.now() / 200);
          // Use gate's type-specific color instead of uniform green
          const glowColor = gate.def.color || '#00ff64';
          const r = parseInt(glowColor.slice(1, 3), 16) || 0;
          const g = parseInt(glowColor.slice(3, 5), 16) || 255;
          const b = parseInt(glowColor.slice(5, 7), 16) || 100;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.shadowBlur = 15;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulse})`;
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

    // Ripple effects
    this._renderRipples(ctx);

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

    // End world-space rendering
    ctx.restore();

    // Screen-space UI: zoom level badge
    if (!this.isDefaultView()) {
      const pct = this.getZoomPercent() + '%';
      ctx.font = 'bold 11px Courier New';
      const tw = ctx.measureText(pct).width;
      const bw = tw + 16;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, width - bw - 8, 8, bw, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct, width - bw / 2 - 8, 20);
    }
  }

  drawBreadboard(ctx, vw) {
    // vw = { left, top, right, bottom } in world coords
    const left = vw.left;
    const top = vw.top;
    const right = vw.right;
    const bottom = vw.bottom;
    const w = right - left;
    const h = bottom - top;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(left, top, left, bottom);
    bgGrad.addColorStop(0, '#ece8d8');
    bgGrad.addColorStop(1, '#e0dcd0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(left, top, w, h);

    // Subtle copper trace lines (horizontal) — snap to 40px grid
    ctx.strokeStyle = 'rgba(180, 160, 120, 0.15)';
    ctx.lineWidth = 1;
    const gridStartY = Math.floor(top / 40) * 40;
    for (let y = gridStartY; y <= bottom; y += 40) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Subtle copper trace lines (vertical)
    const gridStartX = Math.floor(left / 40) * 40;
    for (let x = gridStartX; x <= right; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }

    // Grid holes — skip at extreme zoom-out for performance
    const scale = this.viewTransform.scale;
    if (scale > 0.4) {
      const gridSize = 20;
      const holeStartX = Math.ceil(left / gridSize) * gridSize;
      const holeStartY = Math.ceil(top / gridSize) * gridSize;
      for (let x = holeStartX; x < right; x += gridSize) {
        for (let y = holeStartY; y < bottom; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#c8c4b4';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = '#b8b4a8';
          ctx.fill();
        }
      }
    }

    // Power rails — fixed world positions (designed for ~400px ref height)
    ctx.strokeStyle = 'rgba(200, 50, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, 30);
    ctx.lineTo(right, 30);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(50, 50, 200, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, 370);
    ctx.lineTo(right, 370);
    ctx.stroke();

    // Rail labels
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'rgba(200, 50, 50, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('+', Math.max(left + 5, 5), 34);
    ctx.fillStyle = 'rgba(50, 50, 200, 0.5)';
    ctx.fillText('−', Math.max(left + 5, 5), 374);

    // T5: Breadboard environmental reactivity — copper traces glow near active wires
    const sim = this.gameState.simulation;
    if (sim && sim.animating) {
      this._renderActiveTraces(ctx, right, bottom);
    }
  }

  // T5: Draw glowing copper traces near active wires during simulation
  _renderActiveTraces(ctx, width, height) {
    const wires = this.gameState.wireManager.wires;
    const pulse = 0.15 + 0.1 * Math.sin(performance.now() / 300);

    for (const wire of wires) {
      if (wire.signalValue !== 1) continue;
      const endpoints = this.gameState.wireManager.getWireEndpoints(wire);
      if (!endpoints) continue;

      const { fromPin, toPin } = endpoints;
      const sx = fromPin.x + (fromPin.type === 'output' ? 12 : -12);
      const sy = fromPin.y;
      const ex = toPin.x + (toPin.type === 'input' ? -12 : 12);
      const ey = toPin.y;

      // Sample points along the wire path and glow nearby traces
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      const points = [
        { x: sx, y: sy },
        { x: (sx + midX) / 2, y: (sy + midY) / 2 },
        { x: midX, y: midY },
        { x: (midX + ex) / 2, y: (midY + ey) / 2 },
        { x: ex, y: ey },
      ];

      for (const pt of points) {
        // Glow on nearest horizontal trace
        const nearestTraceY = Math.round(pt.y / 40) * 40;
        const nearestTraceX = Math.round(pt.x / 40) * 40;
        const dist = Math.abs(pt.y - nearestTraceY);
        if (dist < 30) {
          const alpha = pulse * (1 - dist / 30);
          ctx.strokeStyle = `rgba(200, 170, 100, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.max(0, nearestTraceX - 40), nearestTraceY);
          ctx.lineTo(Math.min(width, nearestTraceX + 40), nearestTraceY);
          ctx.stroke();
        }
      }
    }
  }

  spawnRipple(x, y) {
    this.ripples.push({
      x, y,
      startTime: performance.now(),
      duration: 500,
      maxRadius: 160,
    });
    this.gameState.markDirty();
  }

  _renderRipples(ctx) {
    const now = performance.now();
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      const elapsed = now - r.startTime;
      if (elapsed > r.duration) {
        this.ripples.splice(i, 1);
        continue;
      }
      const t = elapsed / r.duration;
      const radius = r.maxRadius * t;
      const alpha = 0.3 * (1 - t);

      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 170, 100, ${alpha})`;
      ctx.lineWidth = 2 * (1 - t) + 0.5;
      ctx.stroke();

      // Inner ring
      if (t < 0.6) {
        const innerR = radius * 0.5;
        const innerA = 0.2 * (1 - t / 0.6);
        ctx.beginPath();
        ctx.arc(r.x, r.y, innerR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 190, 120, ${innerA})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    if (this.ripples.length > 0) {
      this.gameState.markDirty();
    }
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

  // T10: Render ghost overlay of previous solution
  _renderGhostOverlay(ctx) {
    const ghost = this.gameState.ghostOverlay;
    if (!ghost) return;

    ctx.save();
    ctx.globalAlpha = 0.15;

    // Draw ghost gates
    for (const g of ghost.gates) {
      const def = GateTypes[g.type];
      if (!def) continue;
      // Simple ghost rectangle
      ctx.fillStyle = def.color || '#888';
      ctx.strokeStyle = def.color || '#888';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      roundRect(ctx, g.x, g.y, def.width, def.height, 3);
      ctx.stroke();
      ctx.setLineDash([]);
      // Gate label
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.name, g.x + def.width / 2, g.y + def.height / 2);
    }

    // Draw ghost wires (simplified straight lines between approximate positions)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    // We can't easily resolve pin positions for ghost gates without full node reconstruction,
    // so we draw simplified connections between gate centers
    for (const w of ghost.wires) {
      const fromGate = ghost.gates.find(g => g.id === w.fromGateId);
      const toGate = ghost.gates.find(g => g.id === w.toGateId);
      // Skip I/O node wires (they won't match ghost gate IDs)
      if (!fromGate && !toGate) continue;
      const fromDef = fromGate ? GateTypes[fromGate.type] : null;
      const toDef = toGate ? GateTypes[toGate.type] : null;
      const fx = fromGate ? fromGate.x + (fromDef ? fromDef.width : 40) : 70;
      const fy = fromGate ? fromGate.y + (fromDef ? fromDef.height / 2 : 20) : 200;
      const tx = toGate ? toGate.x : 600;
      const ty = toGate ? toGate.y + (toDef ? toDef.height / 2 : 20) : 200;

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      const cpOffset = Math.abs(tx - fx) * 0.4;
      ctx.bezierCurveTo(fx + cpOffset, fy, tx - cpOffset, ty, tx, ty);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.restore();
  }

  findPinAt(mx, my, threshold) {
    if (!threshold) {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const base = isMobile ? 36 : 18;
      // Adjust for zoom: keep consistent screen-space touch target
      const scale = this.viewTransform ? this.viewTransform.scale : 1;
      threshold = Math.min(base / scale, 60);
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
