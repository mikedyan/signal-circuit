// gates.js — Gate definitions, logic, and rendering

const GateTypes = {
  AND: {
    name: 'AND',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => a & b,
    color: '#e8e800',
    width: 80,
    height: 60,
  },
  OR: {
    name: 'OR',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => a | b,
    color: '#00c8e8',
    width: 80,
    height: 60,
  },
  NOT: {
    name: 'NOT',
    inputs: 1,
    outputs: 1,
    logic: (a) => a ? 0 : 1,
    color: '#e86040',
    width: 80,
    height: 50,
  },
  XOR: {
    name: 'XOR',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => a ^ b,
    color: '#c050f0',
    width: 80,
    height: 60,
  },
};

class Gate {
  constructor(type, x, y, id) {
    this.type = type;
    this.def = GateTypes[type];
    this.x = x;
    this.y = y;
    this.id = id;
    this.inputValues = new Array(this.def.inputs).fill(0);
    this.outputValues = new Array(this.def.outputs).fill(0);
    this.placeTime = performance.now();
    this.animDuration = 200;
  }

  getInputPins() {
    const pins = [];
    const spacing = this.def.height / (this.def.inputs + 1);
    for (let i = 0; i < this.def.inputs; i++) {
      pins.push({
        x: this.x,
        y: this.y + spacing * (i + 1),
        index: i,
        gateId: this.id,
        type: 'input',
      });
    }
    return pins;
  }

  getOutputPins() {
    const pins = [];
    const spacing = this.def.height / (this.def.outputs + 1);
    for (let i = 0; i < this.def.outputs; i++) {
      pins.push({
        x: this.x + this.def.width,
        y: this.y + spacing * (i + 1),
        index: i,
        gateId: this.id,
        type: 'output',
      });
    }
    return pins;
  }

  evaluate() {
    if (this.def.inputs === 1) {
      this.outputValues[0] = this.def.logic(this.inputValues[0]);
    } else {
      this.outputValues[0] = this.def.logic(this.inputValues[0], this.inputValues[1]);
    }
  }

  _drawGateSymbol(ctx, cx, cy, color) {
    const s = 10; // symbol scale
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    switch (this.type) {
      case 'AND':
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.7);
        ctx.lineTo(cx, cy - s * 0.7);
        ctx.arc(cx, cy, s * 0.7, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(cx - s, cy + s * 0.7);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'OR':
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.7);
        ctx.quadraticCurveTo(cx - s * 0.3, cy, cx - s, cy + s * 0.7);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.5, cx + s, cy);
        ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.5, cx - s, cy - s * 0.7);
        ctx.stroke();
        break;
      case 'NOT':
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.6);
        ctx.lineTo(cx + s * 0.6, cy);
        ctx.lineTo(cx - s, cy + s * 0.6);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + s * 0.8, cy, 3, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'XOR':
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.7);
        ctx.quadraticCurveTo(cx - s * 0.3, cy, cx - s, cy + s * 0.7);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.5, cx + s, cy);
        ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.5, cx - s, cy - s * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s * 1.3, cy - s * 0.7);
        ctx.quadraticCurveTo(cx - s * 0.6, cy, cx - s * 1.3, cy + s * 0.7);
        ctx.stroke();
        break;
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.def.width &&
           py >= this.y && py <= this.y + this.def.height;
  }

  render(ctx, isSelected) {
    const { width, height, name, color } = this.def;

    // Placement animation
    const elapsed = performance.now() - this.placeTime;
    let scale = 1;
    if (elapsed < this.animDuration) {
      const t = elapsed / this.animDuration;
      // Bounce easing: overshoot then settle
      scale = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - (t - 0.6) / 0.4 * 0.15;
    }

    const cx = this.x + width / 2;
    const cy = this.y + height / 2;
    const x = cx - (width * scale) / 2;
    const y = cy - (height * scale) / 2;
    const sw = width * scale;
    const sh = height * scale;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, x + 4, y + 4, sw, sh, 3);
    ctx.fill();

    // Body gradient
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + sh);
    bodyGrad.addColorStop(0, '#2a2a2a');
    bodyGrad.addColorStop(0.5, '#1a1a1a');
    bodyGrad.addColorStop(1, '#111');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, x, y, sw, sh, 3);
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? '#0f0' : '#555';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    roundRect(ctx, x, y, sw, sh, 3);
    ctx.stroke();

    // IC notch
    ctx.beginPath();
    ctx.arc(x + 12 * scale, y, 5 * scale, 0, Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // Gate symbol (small icon)
    this._drawGateSymbol(ctx, x + sw / 2, y + sh / 2 - 6 * scale, color);

    // Label
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(11 * scale)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(name, x + sw / 2, y + sh / 2 + 6 * scale);

    // Input pins
    const inputPins = this.getInputPins();
    inputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();

      const val = this.inputValues[i];
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x - 12, pin.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });

    // Output pins
    const outputPins = this.getOutputPins();
    outputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();

      const val = this.outputValues[i];
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x + 12, pin.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });
  }
}

class IONode {
  constructor(type, label, x, y, id) {
    this.type = type;
    this.label = label;
    this.x = x;
    this.y = y;
    this.id = id;
    this.value = 0;
    this.width = 50;
    this.height = 40;
  }

  getPin() {
    if (this.type === 'input') {
      return { x: this.x + this.width, y: this.y + this.height / 2, index: 0, gateId: this.id, type: 'output' };
    } else {
      return { x: this.x, y: this.y + this.height / 2, index: 0, gateId: this.id, type: 'input' };
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  render(ctx) {
    const { x, y, width, height, label, value, type } = this;

    // LED glow for active outputs
    if (type === 'output' && value) {
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 30, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(x + width / 2, y + height / 2, 5, x + width / 2, y + height / 2, 30);
      glow.addColorStop(0, 'rgba(255, 80, 80, 0.4)');
      glow.addColorStop(1, 'rgba(255, 80, 80, 0)');
      ctx.fillStyle = glow;
      ctx.fill();
    }

    ctx.fillStyle = type === 'input' ? '#1a3a1a' : '#3a1a1a';
    roundRect(ctx, x, y, width, height, 4);
    ctx.fill();

    ctx.strokeStyle = type === 'input' ? '#0a0' : (value ? '#f44' : '#a00');
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, width, height, 4);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + width / 2, y + 4);

    ctx.font = 'bold 16px Courier New';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = value ? '#ff4444' : '#4466aa';
    ctx.fillText(value.toString(), x + width / 2, y + height - 4);

    const pin = this.getPin();
    if (type === 'input') {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = value ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = value ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
