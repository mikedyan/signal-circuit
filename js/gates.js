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

  // Get pin positions in canvas coordinates
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

    // IC chip body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 3, y + 3, width, height);

    // IC chip body
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, width, height);

    // Chip border
    ctx.strokeStyle = isSelected ? '#0f0' : '#555';
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.strokeRect(x, y, width, height);

    // Notch at top-left (IC chip detail)
    ctx.beginPath();
    ctx.arc(x + 10, y, 5, 0, Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();

    // Gate label
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + width / 2, y + height / 2);

    // Input pins (legs on the left)
    const inputPins = this.getInputPins();
    inputPins.forEach((pin, i) => {
      // Pin leg
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();

      // Pin circle
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.inputValues[i] ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Output pins (legs on the right)
    const outputPins = this.getOutputPins();
    outputPins.forEach((pin, i) => {
      // Pin leg
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();

      // Pin circle
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.outputValues[i] ? '#ff3333' : '#336';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}

// Input/Output nodes for levels
class IONode {
  constructor(type, label, x, y, id) {
    this.type = type; // 'input' or 'output'
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
      // Output pin (right side — feeds into the circuit)
      return {
        x: this.x + this.width,
        y: this.y + this.height / 2,
        index: 0,
        gateId: this.id,
        type: 'output', // input node OUTPUTS to circuit
      };
    } else {
      // Input pin (left side — receives from circuit)
      return {
        x: this.x,
        y: this.y + this.height / 2,
        index: 0,
        gateId: this.id,
        type: 'input', // output node INPUTS from circuit
      };
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  render(ctx) {
    const { x, y, width, height, label, value, type } = this;

    // Background
    ctx.fillStyle = type === 'input' ? '#1a3a1a' : '#3a1a1a';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = type === 'input' ? '#0a0' : '#a00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

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
      // Right side pin
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
      // Left side pin
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
