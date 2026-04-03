// canvas.js — Canvas rendering and breadboard background

class CanvasRenderer {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameState = gameState;
    this.hoveredPin = null;
    this.sparkParticles = []; // Day 35 T3: active particles
    this._particlePool = [];  // Day 35 T3: recycled particle pool
    this.ripples = [];
    this.viewTransform = { x: 0, y: 0, scale: 1 };
    // Day 35 T3: Pre-allocate particle pool
    for (let i = 0; i < 100; i++) {
      this._particlePool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, size: 0 });
    }
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

    // T6: Gate-colored glow during simulation (enhanced Day 37: intensify on signal arrival)
    const sim = this.gameState.simulation;
    if (sim && sim.animating) {
      for (const gate of this.gameState.gates) {
        if (gate.outputValues && gate.outputValues.some(v => v === 1)) {
          // Day 37 T6: Intensify glow when signal has just arrived
          let pulse = 0.2 + 0.15 * Math.sin(performance.now() / 200);
          let extraBlur = 0;
          if (gate._signalArrived) {
            const arrivalElapsed = performance.now() - gate._signalArrived;
            if (arrivalElapsed < 400) {
              const arrivalT = arrivalElapsed / 400;
              pulse += 0.35 * (1 - arrivalT); // bright flash on arrival
              extraBlur = 10 * (1 - arrivalT);
            } else {
              gate._signalArrived = null; // clear after animation
            }
          }
          // Use gate's type-specific color instead of uniform green
          const glowColor = gate.def.color || '#00ff64';
          const r = parseInt(glowColor.slice(1, 3), 16) || 0;
          const g = parseInt(glowColor.slice(3, 5), 16) || 255;
          const b = parseInt(glowColor.slice(5, 7), 16) || 100;
          ctx.shadowColor = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.8)';
          ctx.shadowBlur = 15 + extraBlur;
          ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + Math.min(pulse, 0.7) + ')';
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
      // Day 33 T5: Draw lock icon on pre-placed gates
      if (gate._locked) {
        ctx.save();
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.fillText('🔒', gate.x + gate.def.width - 2, gate.y + 2);
        ctx.restore();
      }
    }

    // Day 33 T7: Gamepad cursor overlay
    if (this.gameState._gamepadConnected && this.gameState._gamepadCursor) {
      const gc = this.gameState._gamepadCursor;
      ctx.save();
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(gc.x, gc.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(gc.x - 16, gc.y);
      ctx.lineTo(gc.x - 6, gc.y);
      ctx.moveTo(gc.x + 6, gc.y);
      ctx.lineTo(gc.x + 16, gc.y);
      ctx.moveTo(gc.x, gc.y - 16);
      ctx.lineTo(gc.x, gc.y - 6);
      ctx.moveTo(gc.x, gc.y + 6);
      ctx.lineTo(gc.x, gc.y + 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
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

    // Grid snap overlay during gate drag
    if (this._dragSnapOverlay) {
      const snap = this._dragSnapOverlay;
      const gridSize = 20;
      const range = 3; // Show grid points within 3 cells of the drag position
      const nearestX = Math.round(snap.x / gridSize) * gridSize;
      const nearestY = Math.round(snap.y / gridSize) * gridSize;

      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          const gx = nearestX + dx * gridSize;
          const gy = nearestY + dy * gridSize;
          const dist = Math.hypot(gx - snap.x, gy - snap.y);
          const isNearest = dx === 0 && dy === 0;
          const alpha = isNearest ? 0.6 : Math.max(0.08, 0.3 - dist / 120);

          ctx.beginPath();
          ctx.arc(gx, gy, isNearest ? 4 : 2, 0, Math.PI * 2);
          ctx.fillStyle = isNearest ? `rgba(0, 255, 0, ${alpha})` : `rgba(150, 180, 150, ${alpha})`;
          ctx.fill();

          if (isNearest) {
            // Crosshair at snap point
            ctx.strokeStyle = `rgba(0, 255, 0, 0.35)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gx - 8, gy);
            ctx.lineTo(gx + 8, gy);
            ctx.moveTo(gx, gy - 8);
            ctx.lineTo(gx, gy + 8);
            ctx.stroke();
          }
        }
      }
    }

    // Tap-to-connect source highlight + compatible target pins
    if (this.gameState.tapConnectSource !== null) {
      const srcNode = this.gameState.findNode(this.gameState.tapConnectSource);
      if (srcNode) {
        const pulse = 0.5 + 0.4 * Math.sin(performance.now() / 200);
        let cx, cy, radius;
        if (srcNode instanceof Gate) {
          cx = srcNode.x + srcNode.def.width / 2;
          cy = srcNode.y + srcNode.def.height / 2;
          radius = Math.max(srcNode.def.width, srcNode.def.height) / 2 + 12;
        } else {
          cx = srcNode.x + srcNode.width / 2;
          cy = srcNode.y + srcNode.height / 2;
          radius = 32;
        }
        // Glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 100, ${pulse * 0.9})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
        grad.addColorStop(0, `rgba(0, 255, 100, ${pulse * 0.12})`);
        grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Highlight open input pins on other elements
        const openPulse = 0.3 + 0.3 * Math.sin(performance.now() / 250);
        const wires = this.gameState.wireManager.wires;
        const allNodes = [
          ...this.gameState.gates,
          ...this.gameState.outputNodes,
        ];
        for (const node of allNodes) {
          if (node.id === this.gameState.tapConnectSource) continue;
          let pins;
          if (node instanceof Gate) {
            pins = node.getInputPins();
          } else if (node instanceof IONode && node.type === 'output') {
            const p = node.getPin();
            pins = [{ x: p.x, y: p.y, index: 0, gateId: node.id }];
          } else continue;
          for (const pin of pins) {
            const connected = wires.some(w => w.toGateId === (pin.gateId || node.id) && w.toPinIndex === pin.index);
            if (!connected) {
              const px = pin.x + (node instanceof Gate ? -12 : -12);
              const py = pin.y;
              ctx.beginPath();
              ctx.arc(px, py, 10, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 255, 100, ${openPulse * 0.25})`;
              ctx.fill();
              ctx.strokeStyle = `rgba(0, 255, 100, ${openPulse * 0.8})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }
        this.gameState.markDirty();
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


    // Day 38: Tutorial pin highlights (world-space)
    if (this.gameState.tutorial && this.gameState.tutorial.isActive()) {
      this.gameState.tutorial.renderHighlights(ctx);
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

    // Day 35 T5: Light mode canvas adaptation
    const isLight = document.body.classList.contains('light-mode');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(left, top, left, bottom);
    if (isLight) {
      bgGrad.addColorStop(0, '#f8f6ee');
      bgGrad.addColorStop(1, '#f0ece0');
    } else {
      bgGrad.addColorStop(0, '#ece8d8');
      bgGrad.addColorStop(1, '#e0dcd0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(left, top, w, h);

    // Subtle copper trace lines (horizontal) — snap to 40px grid
    ctx.strokeStyle = isLight ? 'rgba(160, 140, 100, 0.12)' : 'rgba(180, 160, 120, 0.15)';
    ctx.lineWidth = 1;
    const gridStartY = Math.floor(top / 40) * 40;
    for (let y = gridStartY; y <= bottom; y += 40) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Subtle copper trace lines (vertical)
    ctx.strokeStyle = isLight ? 'rgba(160, 140, 100, 0.12)' : 'rgba(180, 160, 120, 0.15)';
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
          ctx.fillStyle = isLight ? '#d8d4c8' : '#c8c4b4';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = isLight ? '#c8c4b8' : '#b8b4a8';
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

  // Day 35 T3: Spark particles with object pool — no GC spikes
  spawnSparks(x, y) {
    for (let i = 0; i < 10; i++) {
      let p;
      if (this._particlePool.length > 0) {
        p = this._particlePool.pop();
      } else {
        p = { x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, size: 0 };
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 1;
      p.decay = 0.03 + Math.random() * 0.02;
      p.size = 2 + Math.random() * 3;
      this.sparkParticles.push(p);
    }
  }

  _renderSparks(ctx) {
    let writeIdx = 0;
    for (let i = 0; i < this.sparkParticles.length; i++) {
      const p = this.sparkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= p.decay;
      if (p.life <= 0) {
        // Return to pool instead of discarding
        this._particlePool.push(p);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${Math.floor(150 + 105 * p.life)}, 50, ${p.life})`;
      ctx.fill();
      this.sparkParticles[writeIdx++] = p;
    }
    this.sparkParticles.length = writeIdx; // Compact in-place, no splice
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
