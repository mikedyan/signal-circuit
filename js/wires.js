// wires.js — Wire management, drawing, selection, and deletion

// Wire color palette — breadboard jumper wire colors
const WIRE_COLORS_DEFAULT = [
  '#4488ff', // blue
  '#ff6644', // orange-red
  '#44cc44', // green
  '#cc44cc', // magenta
  '#ffaa22', // amber
  '#44cccc', // teal
  '#ff4488', // hot pink
  '#88aa44', // olive
  '#aa66ff', // purple
  '#cc8844', // brown
];

// Deuteranopia-safe palette
const WIRE_COLORS_COLORBLIND = [
  '#0077BB', // strong blue
  '#EE7733', // orange
  '#CC3311', // red
  '#009988', // teal
  '#EE3377', // magenta
  '#33BBEE', // cyan
  '#BBBBBB', // grey
  '#AA3377', // wine
  '#004488', // dark blue
  '#DDCC77', // sand
];

function getWireColors() {
  try {
    if (document.body.classList.contains('colorblind-mode')) return WIRE_COLORS_COLORBLIND;
  } catch (e) {}
  return WIRE_COLORS_DEFAULT;
}

const WIRE_COLORS = WIRE_COLORS_DEFAULT;

let wireColorIndex = 0;

// Semantic color map: source pin key → color
const _semanticColorMap = {};
let _semanticColorNext = 0;

function _getSemanticColor(fromGateId, fromPinIndex) {
  const key = `${fromGateId}:${fromPinIndex}`;
  if (!_semanticColorMap[key]) {
    const colors = getWireColors();
    _semanticColorMap[key] = colors[_semanticColorNext % colors.length];
    _semanticColorNext++;
  }
  return _semanticColorMap[key];
}

function _resetSemanticColors() {
  for (const k of Object.keys(_semanticColorMap)) delete _semanticColorMap[k];
  _semanticColorNext = 0;
}

class Wire {
  constructor(fromGateId, fromPinIndex, toGateId, toPinIndex, id) {
    this.id = id;
    this.fromGateId = fromGateId;
    this.fromPinIndex = fromPinIndex;
    this.toGateId = toGateId;
    this.toPinIndex = toPinIndex;
    this.signalValue = 0;
    // Semantic color: all wires from same source pin share a color
    this.color = _getSemanticColor(fromGateId, fromPinIndex);
    // T4: Wire drawing progressive reveal
    this.birthTime = performance.now();
    this.revealDuration = 300; // ms
  }
}

class WireManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.wires = [];
    this.nextId = 1;
    this.drawing = false;
    this.drawFrom = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.selectedWire = null;
    this.hoveredWire = null;
  }

  startDrawing(gateId, pinIndex, pinType, x, y) {
    this.drawing = true;
    this.drawFrom = { gateId, pinIndex, pinType, x, y };
  }

  updateMouse(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    // Update hover detection
    if (!this.drawing) {
      this.hoveredWire = this.findWireAt(x, y);
    }
  }

  finishDrawing(gateId, pinIndex, pinType, x, y) {
    if (!this.drawing || !this.drawFrom) {
      this.cancelDrawing();
      return null;
    }

    const from = this.drawFrom;
    let fromGate, fromPin, toGate, toPin;
    if (from.pinType === 'output' && pinType === 'input') {
      fromGate = from.gateId;
      fromPin = from.pinIndex;
      toGate = gateId;
      toPin = pinIndex;
    } else if (from.pinType === 'input' && pinType === 'output') {
      fromGate = gateId;
      fromPin = pinIndex;
      toGate = from.gateId;
      toPin = from.pinIndex;
    } else {
      // Invalid: same pin type (output→output or input→input)
      this._showInvalidFeedback(x, y);
      this.cancelDrawing();
      return null;
    }

    // Remove existing connection to this input
    const existing = this.wires.find(w => w.toGateId === toGate && w.toPinIndex === toPin);
    if (existing) {
      this.wires = this.wires.filter(w => w.id !== existing.id);
    }

    if (fromGate === toGate) {
      // Invalid: self-connection
      this._showInvalidFeedback(x, y);
      this.cancelDrawing();
      return null;
    }

    const wire = new Wire(fromGate, fromPin, toGate, toPin, this.nextId++);
    this.wires.push(wire);
    this.drawing = false;
    this.drawFrom = null;
    return wire;
  }

  _showInvalidFeedback(x, y) {
    // Play buzz sound
    if (this.gameState.audio) {
      this.gameState.audio.playInvalidConnection();
    }
    // Spawn red flash particles at the target pin
    if (this.gameState.renderer) {
      this.invalidFlash = { x, y, time: performance.now(), duration: 300 };
      this.gameState.markDirty();
    }
  }

  cancelDrawing() {
    this.drawing = false;
    this.drawFrom = null;
  }

  removeWire(wire) {
    // Spawn deletion particles before removing
    this._spawnDeletionParticles(wire);
    this.wires = this.wires.filter(w => w.id !== wire.id);
    if (this.selectedWire === wire) this.selectedWire = null;
    if (this.hoveredWire === wire) this.hoveredWire = null;
  }

  _spawnDeletionParticles(wire) {
    const endpoints = this.getWireEndpoints(wire);
    if (!endpoints) return;

    const { fromPin, toPin } = endpoints;
    const sx = fromPin.x + (fromPin.type === 'output' ? 12 : -12);
    const sy = fromPin.y;
    const ex = toPin.x + (toPin.type === 'input' ? -12 : 12);
    const ey = toPin.y;
    const cp = this._bezierControlPoints(sx, sy, ex, ey);

    if (!this.deletionParticles) this.deletionParticles = [];

    // Spawn fragment particles along the wire path
    const numFragments = 8;
    for (let i = 0; i <= numFragments; i++) {
      const t = i / numFragments;
      const pt = this._bezierPoint(t, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.deletionParticles.push({
        x: pt.x,
        y: pt.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.025 + Math.random() * 0.015,
        size: 2 + Math.random() * 3,
        color: wire.color,
      });
    }

    // Sparks at both endpoints
    if (this.gameState.renderer) {
      this.gameState.renderer.spawnSparks(sx, sy);
      this.gameState.renderer.spawnSparks(ex, ey);
    }
    this.gameState.markDirty();
  }

  removeWiresForGate(gateId) {
    this.wires = this.wires.filter(w => w.fromGateId !== gateId && w.toGateId !== gateId);
  }

  clear() {
    this.wires = [];
    this.selectedWire = null;
    this.hoveredWire = null;
    this.cancelDrawing();
    wireColorIndex = 0;
    _resetSemanticColors();
  }

  // Bezier control points for a wire from (sx,sy) to (ex,ey)
  _bezierControlPoints(sx, sy, ex, ey) {
    const dx = Math.abs(ex - sx);
    const cpOffset = Math.max(40, dx * 0.45);
    return {
      cp1x: sx + cpOffset,
      cp1y: sy,
      cp2x: ex - cpOffset,
      cp2y: ey,
    };
  }

  // Sample a point along a cubic bezier at parameter t (0..1)
  _bezierPoint(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * sx + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * ex,
      y: uuu * sy + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * ey,
    };
  }

  // Draw a cubic bezier path (for stroke)
  _traceBezier(ctx, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
  }

  // Find a wire near a point using bezier sampling
  findWireAt(px, py, threshold) {
    if (threshold === undefined) {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const base = isMobile ? 16 : 8;
      const scale = this.gameState.renderer ? this.gameState.renderer.viewTransform.scale : 1;
      threshold = Math.min(base / scale, 40);
    }
    for (const wire of this.wires) {
      const endpoints = this.getWireEndpoints(wire);
      if (!endpoints) continue;

      const { fromPin, toPin } = endpoints;
      const sx = fromPin.x + (fromPin.type === 'output' ? 12 : -12);
      const sy = fromPin.y;
      const ex = toPin.x + (toPin.type === 'input' ? -12 : 12);
      const ey = toPin.y;
      const cp = this._bezierControlPoints(sx, sy, ex, ey);

      // Sample 20 points along the bezier and check distance
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const pt = this._bezierPoint(t, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
        if (Math.hypot(px - pt.x, py - pt.y) < threshold) return wire;
      }
    }
    return null;
  }

  getWireEndpoints(wire) {
    const fromNode = this.gameState.findNode(wire.fromGateId);
    const toNode = this.gameState.findNode(wire.toGateId);
    if (!fromNode || !toNode) return null;

    let fromPin, toPin;

    if (fromNode instanceof Gate) {
      fromPin = fromNode.getOutputPins()[wire.fromPinIndex];
    } else if (fromNode instanceof IONode) {
      fromPin = fromNode.getPin();
    }

    if (toNode instanceof Gate) {
      toPin = toNode.getInputPins()[wire.toPinIndex];
    } else if (toNode instanceof IONode) {
      toPin = toNode.getPin();
    }

    return fromPin && toPin ? { fromPin, toPin } : null;
  }

  render(ctx) {
    const sim = this.gameState.simulation;

    for (const wire of this.wires) {
      const endpoints = this.getWireEndpoints(wire);
      if (!endpoints) continue;

      const { fromPin, toPin } = endpoints;
      const sx = fromPin.x + (fromPin.type === 'output' ? 12 : -12);
      const sy = fromPin.y;
      const ex = toPin.x + (toPin.type === 'input' ? -12 : 12);
      const ey = toPin.y;
      const cp = this._bezierControlPoints(sx, sy, ex, ey);

      const isSelected = this.selectedWire === wire;
      const isHovered = this.hoveredWire === wire;

      // Wire color based on state
      let color;
      const isActive = wire.signalValue === 1;
      if (isSelected) {
        color = '#ff0';
      } else if (sim.animating && isActive) {
        color = '#ff5555';
      } else if (sim.animating && !isActive) {
        color = '#334488';
      } else if (isActive) {
        // Live signal propagation: green for active wires
        color = '#00cc66';
      } else {
        // Use the wire's unique color when not simulating
        color = wire.color;
      }

      // Wire shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      this._traceBezier(ctx, sx, sy + 2, cp.cp1x, cp.cp1y + 2, cp.cp2x, cp.cp2y + 2, ex, ey + 2);
      ctx.stroke();

      // Glow for active wires during simulation
      if (sim.animating && isActive) {
        const glowPulse = 0.15 + 0.15 * Math.sin(performance.now() / 150);
        ctx.strokeStyle = `rgba(255, 80, 80, ${glowPulse})`;
        ctx.lineWidth = 12;
        this._traceBezier(ctx, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
        ctx.stroke();
      }

      // Main wire
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected || isHovered ? 4 : 3;
      ctx.lineCap = 'round';
      this._traceBezier(ctx, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
      ctx.stroke();

      // Glow effect for selected/hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? 'rgba(255,255,0,0.3)' : 'rgba(100,200,255,0.2)';
        ctx.lineWidth = 8;
        this._traceBezier(ctx, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
        ctx.stroke();
      }

      // T4: Wire drawing progressive reveal — energy dot on new wire
      const wireAge = performance.now() - wire.birthTime;
      if (wireAge < wire.revealDuration && !sim.animating) {
        const t = wireAge / wire.revealDuration;
        const dotPos = this._bezierPoint(t, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
        // Bright energy dot
        ctx.beginPath();
        ctx.arc(dotPos.x, dotPos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 200, 0.95)';
        ctx.fill();
        // Outer glow
        ctx.beginPath();
        ctx.arc(dotPos.x, dotPos.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 200, 0.25)';
        ctx.fill();
        // Trail
        for (let trail = 1; trail <= 4; trail++) {
          const tt = Math.max(0, t - trail * 0.06);
          const tp = this._bezierPoint(tt, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
          const alpha = 0.5 - trail * 0.1;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, 4 - trail * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
          ctx.fill();
        }
        // Mark dirty to keep animating
        if (this.gameState) this.gameState.markDirty();
      }

      // Animated pulse dots during simulation (multiple trailing dots)
      if (sim.animating && isActive && sim.animationProgress < 1) {
        const t = sim.animationProgress;
        // Main pulse
        const pulsePos = this._bezierPoint(t, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
        ctx.beginPath();
        ctx.arc(pulsePos.x, pulsePos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 100, 0.95)';
        ctx.fill();
        // Outer glow
        ctx.beginPath();
        ctx.arc(pulsePos.x, pulsePos.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 100, 0.25)';
        ctx.fill();
        // Trailing dots
        for (let trail = 1; trail <= 3; trail++) {
          const tt = Math.max(0, t - trail * 0.08);
          const tp = this._bezierPoint(tt, sx, sy, cp.cp1x, cp.cp1y, cp.cp2x, cp.cp2y, ex, ey);
          const alpha = 0.6 - trail * 0.15;
          const size = 5 - trail;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 200, 80, ${alpha})`;
          ctx.fill();
        }
      }
    }

    // Deletion fragment particles
    if (this.deletionParticles && this.deletionParticles.length > 0) {
      for (let i = this.deletionParticles.length - 1; i >= 0; i--) {
        const p = this.deletionParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= p.decay;
        if (p.life <= 0) {
          this.deletionParticles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
        // Fallback for hex colors
        if (p.color.startsWith('#')) {
          const r = parseInt(p.color.slice(1, 3), 16);
          const g = parseInt(p.color.slice(3, 5), 16);
          const b = parseInt(p.color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
        }
        ctx.fill();
      }
      if (this.deletionParticles.length > 0) {
        this.gameState.markDirty();
      }
    }

    // Invalid connection flash
    if (this.invalidFlash) {
      const elapsed = performance.now() - this.invalidFlash.time;
      if (elapsed < this.invalidFlash.duration) {
        const alpha = 1 - elapsed / this.invalidFlash.duration;
        const radius = 15 + elapsed / this.invalidFlash.duration * 10;
        ctx.beginPath();
        ctx.arc(this.invalidFlash.x, this.invalidFlash.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        this.invalidFlash = null;
      }
    }

    // Wire being drawn
    if (this.drawing && this.drawFrom) {
      const sx = this.drawFrom.x;
      const sy = this.drawFrom.y;

      // Smooth bezier curve preview
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const dx = this.mouseX - sx;
      const cpOffset = Math.min(Math.abs(dx) * 0.5, 100);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(
        sx + cpOffset, sy,
        this.mouseX - cpOffset, this.mouseY,
        this.mouseX, this.mouseY
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Endpoint indicator
      ctx.beginPath();
      ctx.arc(this.mouseX, this.mouseY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fill();
    }
  }
}

// Utility: distance from point to line segment (kept for compatibility)
function distToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = lenSq !== 0 ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const xx = x1 + t * C;
  const yy = y1 + t * D;
  return Math.hypot(px - xx, py - yy);
}
