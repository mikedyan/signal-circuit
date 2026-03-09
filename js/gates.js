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

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.def.width &&
           py >= this.y && py <= this.y + this.def.height;
  }

  render(ctx, isSelected) {
    const { x, y } = this;
    const { width, height, name, color } = this.def;

    // IC chip body shadow (depth effect)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, x + 4, y + 4, width, height, 3);
    ctx.fill();

    // IC chip body
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + height);
    bodyGrad.addColorStop(0, '#2a2a2a');
    bodyGrad.addColorStop(0.5, '#1a1a1a');
    bodyGrad.addColorStop(1, '#111');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, x, y, width, height, 3);
    ctx.fill();

    // Chip border
    ctx.strokeStyle = isSelected ? '#0f0' : '#555';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    roundRect(ctx, x, y, width, height, 3);
    ctx.stroke();

    // Notch at top-left (IC chip detail)
    ctx.beginPath();
    ctx.arc(x + 12, y, 5, 0, Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // Gate label
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + width / 2, y + height / 2);

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

      // Glow for active pins
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

// Input/Output nodes for levels
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
      return {
        x: this.x + this.width,
        y: this.y + this.height / 2,
        index: 0,
        gateId: this.id,
        type: 'output',
      };
    } else {
      return {
        x: this.x,
        y: this.y + this.height / 2,
        index: 0,
        gateId: this.id,
        type: 'input',
      };
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  render(ctx) {
    const { x, y, width, height, label, value, type } = this;

    // LED glow effect for output nodes when active
    if (type === 'output' && value) {
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 30, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(
        x + width / 2, y + height / 2, 5,
        x + width / 2, y + height / 2, 30
      );
      glow.addColorStop(0, 'rgba(255, 80, 80, 0.4)');
      glow.addColorStop(1, 'rgba(255, 80, 80, 0)');
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // Background
    ctx.fillStyle = type === 'input' ? '#1a3a1a' : '#3a1a1a';
    roundRect(ctx, x, y, width, height, 4);
    ctx.fill();

    // Border
    ctx.strokeStyle = type === 'input' ? '#0a0' : (value ? '#f44' : '#a00');
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, width, height, 4);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + width / 2, y + 4);

    // Value
    ctx.font = 'bold 16px Courier New';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = value ? '#ff4444' : '#4466aa';
    ctx.fillText(value.toString(), x + width / 2, y + height - 4);

    // Pin
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

// Utility: draw a rounded rectangle path
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
