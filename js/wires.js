// wires.js — Wire management and drawing

class Wire {
  constructor(fromGateId, fromPinIndex, toGateId, toPinIndex, id) {
    this.id = id;
    this.fromGateId = fromGateId;
    this.fromPinIndex = fromPinIndex;
    this.toGateId = toGateId;
    this.toPinIndex = toPinIndex;
    this.signalValue = 0;
  }
}

class WireManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.wires = [];
    this.nextId = 1;
    this.drawing = false;
    this.drawFrom = null; // {gateId, pinIndex, pinType, x, y}
    this.mouseX = 0;
    this.mouseY = 0;
  }

  startDrawing(gateId, pinIndex, pinType, x, y) {
    this.drawing = true;
    this.drawFrom = { gateId, pinIndex, pinType, x, y };
  }

  updateMouse(x, y) {
    this.mouseX = x;
    this.mouseY = y;
  }

  finishDrawing(gateId, pinIndex, pinType, x, y) {
    if (!this.drawing || !this.drawFrom) {
      this.cancelDrawing();
      return false;
    }

    const from = this.drawFrom;

    // Must connect output → input
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
      // Invalid connection (same type)
      this.cancelDrawing();
      return false;
    }

    // Check if this input is already connected
    const existing = this.wires.find(w => w.toGateId === toGate && w.toPinIndex === toPin);
    if (existing) {
      // Remove existing wire first
      this.wires = this.wires.filter(w => w.id !== existing.id);
    }

    // Don't allow self-connection
    if (fromGate === toGate) {
      this.cancelDrawing();
      return false;
    }

    const wire = new Wire(fromGate, fromPin, toGate, toPin, this.nextId++);
    this.wires.push(wire);
    this.drawing = false;
    this.drawFrom = null;
    return true;
  }

  cancelDrawing() {
    this.drawing = false;
    this.drawFrom = null;
  }

  removeWiresForGate(gateId) {
    this.wires = this.wires.filter(w => w.fromGateId !== gateId && w.toGateId !== gateId);
  }

  clear() {
    this.wires = [];
    this.cancelDrawing();
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
    // Render existing wires
    for (const wire of this.wires) {
      const endpoints = this.getWireEndpoints(wire);
      if (!endpoints) continue;

      const { fromPin, toPin } = endpoints;

      // Determine start/end with pin offset
      const sx = fromPin.x + (fromPin.type === 'output' ? 12 : -12);
      const sy = fromPin.y;
      const ex = toPin.x + (toPin.type === 'input' ? -12 : 12);
      const ey = toPin.y;

      // Wire color based on signal
      const color = wire.signalValue ? '#ff4444' : '#4466cc';

      // Draw wire as a routed path
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);

      // Simple routing: horizontal, vertical, horizontal
      const midX = (sx + ex) / 2;
      ctx.lineTo(midX, sy);
      ctx.lineTo(midX, ey);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Wire shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 2);
      ctx.lineTo(midX, sy + 2);
      ctx.lineTo(midX, ey + 2);
      ctx.lineTo(ex, ey + 2);
      ctx.stroke();

      // Redraw wire on top of shadow
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(midX, sy);
      ctx.lineTo(midX, ey);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // Render wire being drawn
    if (this.drawing && this.drawFrom) {
      const sx = this.drawFrom.x;
      const sy = this.drawFrom.y;

      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(this.mouseX, this.mouseY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
