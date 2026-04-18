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
  NAND: {
    name: 'NAND',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => (a & b) ? 0 : 1,
    color: '#cc6600',
    width: 80,
    height: 60,
  },
  NOR: {
    name: 'NOR',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => (a | b) ? 0 : 1,
    color: '#9933cc',
    width: 80,
    height: 60,
  },
  MYSTERY: {
    name: '???',
    inputs: 2,
    outputs: 1,
    logic: (a, b) => a ^ b, // Secretly XOR — player must discover
    color: '#888',
    width: 80,
    height: 60,
    isMystery: true,
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
    const edgePad = 6;
    if (this.def.inputs === 2) {
      // Place pins near opposite edges for easy tapping
      pins.push({ x: this.x, y: this.y + edgePad, index: 0, gateId: this.id, type: 'input' });
      pins.push({ x: this.x, y: this.y + this.def.height - edgePad, index: 1, gateId: this.id, type: 'input' });
    } else {
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
    // Day 53: Sub-circuit evaluation via truth table lookup
    if (this.def.isSubCircuit && window.game && window.game.subCircuits) {
      const outputs = window.game.subCircuits.evaluateSubCircuit(this.type, this.inputValues);
      for (let i = 0; i < outputs.length && i < this.outputValues.length; i++) {
        this.outputValues[i] = outputs[i];
      }
      return;
    }
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
      case 'NAND':
        // AND shape with inversion bubble
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.7);
        ctx.lineTo(cx - s * 0.1, cy - s * 0.7);
        ctx.arc(cx - s * 0.1, cy, s * 0.7, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(cx - s, cy + s * 0.7);
        ctx.closePath();
        ctx.stroke();
        // Inversion bubble
        ctx.beginPath();
        ctx.arc(cx + s * 0.8, cy, 3, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'NOR':
        // OR shape with inversion bubble
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s * 0.7);
        ctx.quadraticCurveTo(cx - s * 0.3, cy, cx - s, cy + s * 0.7);
        ctx.quadraticCurveTo(cx + s * 0.1, cy + s * 0.5, cx + s * 0.7, cy);
        ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 0.5, cx - s, cy - s * 0.7);
        ctx.stroke();
        // Inversion bubble
        ctx.beginPath();
        ctx.arc(cx + s * 0.9, cy, 3, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'MYSTERY':
        // Mystery gate: question mark symbol with shimmer
        ctx.font = `bold ${Math.round(s * 1.8)}px Courier New`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const shimmer = 0.6 + 0.4 * Math.sin(performance.now() / 400);
        ctx.fillStyle = `rgba(200, 200, 255, ${shimmer})`;
        ctx.fillText('?', cx, cy);
        // Rotating border dots
        const angle = performance.now() / 800;
        for (let d = 0; d < 4; d++) {
          const a = angle + d * Math.PI / 2;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * s * 0.9, cy + Math.sin(a) * s * 0.9, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150, 150, 255, ${shimmer * 0.6})`;
          ctx.fill();
        }
        break;
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.def.width &&
           py >= this.y && py <= this.y + this.def.height;
  }

  render(ctx, isSelected) {
    // Day 53: Sub-circuit custom rendering
    if (this.def.isSubCircuit) {
      this._renderSubCircuit(ctx, isSelected);
      return;
    }
    // Day 40: Dispatch to alternate skin renderer
    const skin = (typeof window !== 'undefined' && window.game && window.game.cosmetics)
      ? window.game.cosmetics.getActiveGateSkin() : 'ic_chip';
    if (skin !== 'ic_chip') {
      this._renderSkin(ctx, isSelected, skin);
      return;
    }
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

    // Pin breathing animation helper
    const breathe = 0.6 + 0.4 * Math.sin(performance.now() / 600);
    const pinRadius = 7;

    // Input pins
    const inputPins = this.getInputPins();
    inputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();

      const val = this.inputValues[i];
      // Outer glow for unconnected pins (breathing)
      if (!val) {
        ctx.beginPath();
        ctx.arc(pin.x - 12, pin.y, pinRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60, 80, 140, ${breathe * 0.15})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = val ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x - 12, pin.y, pinRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });

    // Output pins
    const outputPins = this.getOutputPins();
    outputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();

      const val = this.outputValues[i];
      // Outer glow for unconnected pins (breathing)
      if (!val) {
        ctx.beginPath();
        ctx.arc(pin.x + 12, pin.y, pinRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60, 80, 140, ${breathe * 0.15})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = val ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x + 12, pin.y, pinRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });
  }


  // Day 40: Alternate gate skin renderers
  _renderSkin(ctx, isSelected, skin) {
    const { width, height, name, color } = this.def;
    const elapsed = performance.now() - this.placeTime;
    let scale = 1;
    if (elapsed < this.animDuration) {
      const t = elapsed / this.animDuration;
      scale = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - (t - 0.6) / 0.4 * 0.15;
    }
    const cx = this.x + width / 2;
    const cy = this.y + height / 2;
    const x = cx - (width * scale) / 2;
    const y = cy - (height * scale) / 2;
    const sw = width * scale;
    const sh = height * scale;

    if (skin === 'neon') this._renderNeon(ctx, isSelected, x, y, sw, sh, scale, name, color);
    else if (skin === 'retro') this._renderRetro(ctx, isSelected, x, y, sw, sh, scale, name, color);
    else if (skin === 'minimal') this._renderMinimal(ctx, isSelected, x, y, sw, sh, scale, name, color);
    // Pins are the same for all skins
    this._renderPins(ctx, scale);
  }

  _renderNeon(ctx, isSelected, x, y, sw, sh, scale, name, color) {
    // Neon: dark fill, bright colored outlines, glowing text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    roundRect(ctx, x, y, sw, sh, 6);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    roundRect(ctx, x, y, sw, sh, 6);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Gate symbol
    this._drawGateSymbol(ctx, x + sw / 2, y + sh / 2 - 6 * scale, color);
    // Glowing label
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold ' + Math.round(11 * scale) + 'px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(name, x + sw / 2, y + sh / 2 + 6 * scale);
    ctx.shadowBlur = 0;
  }

  _renderRetro(ctx, isSelected, x, y, sw, sh, scale, name, color) {
    // Retro: rounded, warm tones, softer shadows
    const r = parseInt(color.slice(1, 3), 16) || 180;
    const g = parseInt(color.slice(3, 5), 16) || 150;
    const b = parseInt(color.slice(5, 7), 16) || 100;
    // Soft shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, x + 3, y + 3, sw, sh, 10);
    ctx.fill();
    // Body with warm gradient
    const bg = ctx.createLinearGradient(x, y, x, y + sh);
    bg.addColorStop(0, 'rgb(' + Math.min(255, r + 40) + ',' + Math.min(255, g + 30) + ',' + Math.min(255, b + 20) + ')');
    bg.addColorStop(1, 'rgb(' + r + ',' + g + ',' + b + ')');
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, sw, sh, 10);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    roundRect(ctx, x, y, sw, sh, 10);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold ' + Math.round(12 * scale) + 'px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + sw / 2, y + sh / 2);
  }

  _renderMinimal(ctx, isSelected, x, y, sw, sh, scale, name, color) {
    // Minimal: flat white, thin border, no shadow
    ctx.fillStyle = '#f8f8f8';
    roundRect(ctx, x, y, sw, sh, 2);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#0a0' : '#999';
    ctx.lineWidth = isSelected ? 2 : 1;
    roundRect(ctx, x, y, sw, sh, 2);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#333';
    ctx.font = Math.round(11 * scale) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + sw / 2, y + sh / 2);
  }

  _renderPins(ctx, scale) {
    const breathe = 0.6 + 0.4 * Math.sin(performance.now() / 600);
    const pinRadius = 7;
    const inputPins = this.getInputPins();
    inputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();
      const val = this.inputValues[i];
      if (!val) {
        ctx.beginPath();
        ctx.arc(pin.x - 12, pin.y, pinRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 80, 140, ' + (breathe * 0.15) + ')';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = val ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x - 12, pin.y, pinRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });
    const outputPins = this.getOutputPins();
    outputPins.forEach((pin, i) => {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();
      const val = this.outputValues[i];
      if (!val) {
        ctx.beginPath();
        ctx.arc(pin.x + 12, pin.y, pinRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 80, 140, ' + (breathe * 0.15) + ')';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = val ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = val ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (val) {
        ctx.beginPath();
        ctx.arc(pin.x + 12, pin.y, pinRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
        ctx.fill();
      }
    });
  }


  // Day 53: Sub-circuit custom rendering — distinct purple/teal block
  _renderSubCircuit(ctx, isSelected) {
    const { width, height, color, name } = this.def;
    const elapsed = performance.now() - this.placeTime;
    let scale = 1;
    if (elapsed < this.animDuration) {
      const t = elapsed / this.animDuration;
      scale = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - (t - 0.6) / 0.4 * 0.15;
    }
    const cx = this.x + width / 2;
    const cy = this.y + height / 2;
    const x = cx - (width * scale) / 2;
    const y = cy - (height * scale) / 2;
    const sw = width * scale;
    const sh = height * scale;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, x + 3, y + 3, sw, sh, 5);
    ctx.fill();

    // Body — gradient with sub-circuit color
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + sh);
    bodyGrad.addColorStop(0, '#1a2a3a');
    bodyGrad.addColorStop(0.5, '#0f1f2f');
    bodyGrad.addColorStop(1, '#0a1520');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, x, y, sw, sh, 5);
    ctx.fill();

    // Border — double line effect
    ctx.strokeStyle = isSelected ? '#0f0' : (color || '#00bcd4');
    ctx.lineWidth = isSelected ? 3 : 2;
    roundRect(ctx, x, y, sw, sh, 5);
    ctx.stroke();

    // Inner border accent
    ctx.strokeStyle = 'rgba(' + (isSelected ? '0,255,0' : '0,188,212') + ',0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, x + 3, y + 3, sw - 6, sh - 6, 3);
    ctx.stroke();

    // IC chip notch (same as regular gates for consistency)
    ctx.beginPath();
    ctx.arc(x + 12 * scale, y, 4 * scale, 0, Math.PI);
    ctx.fillStyle = '#2a3a4a';
    ctx.fill();

    // Sub-circuit icon: small circuit symbol
    const iconY = y + 10 * scale;
    ctx.font = Math.round(10 * scale) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = (color || '#00bcd4') + '88';
    ctx.fillText('⚡', x + sw / 2, iconY);

    // Name label
    ctx.fillStyle = color || '#00bcd4';
    ctx.font = 'bold ' + Math.round(10 * scale) + 'px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + sw / 2, cy);

    // Pin count indicator
    ctx.fillStyle = '#556';
    ctx.font = Math.round(8 * scale) + 'px monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.def.inputs + '→' + this.def.outputs, x + sw / 2, y + sh - 3 * scale);

    // Render pins
    this._renderPins(ctx, scale);
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

    // Day 37 T4: Input node pulse animation when simulation reads its value
    if (this._signalPulse) {
      const elapsed = performance.now() - this._signalPulse;
      const duration = 300;
      if (elapsed < duration) {
        const t = elapsed / duration;
        const scale = 1 + 0.15 * Math.sin(t * Math.PI); // expand then contract
        const cx = x + width / 2;
        const cy = y + height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        // Pulse glow ring
        const pulseAlpha = 0.6 * (1 - t);
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 100, ' + pulseAlpha * 0.3 + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 100, ' + pulseAlpha + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        this._signalPulse = null;
      }
    }

    // Day 37 T5: Output node receive flash when signal arrives
    if (this._receiveFlash) {
      const elapsed = performance.now() - this._receiveFlash;
      const duration = 200;
      if (elapsed < duration) {
        const alpha = 0.8 * (1 - elapsed / duration);
        const cx = x + width / 2;
        const cy = y + height / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        const flashGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 32);
        flashGrad.addColorStop(0, 'rgba(255, 200, 50, ' + alpha + ')');
        flashGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.fill();
      } else {
        this._receiveFlash = null;
      }
    }

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

    // Day 37 T4: Restore transform if pulse was active
    if (this._signalPulse) {
      const elapsed = performance.now() - this._signalPulse;
      if (elapsed < 300) {
        ctx.restore();
      }
    }

    const pin = this.getPin();
    const ioPinRadius = 7;
    if (type === 'input') {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(pin.x + 12, pin.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pin.x + 12, pin.y, ioPinRadius, 0, Math.PI * 2);
      ctx.fillStyle = value ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = value ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin.x - 12, pin.y);
      ctx.lineTo(pin.x, pin.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pin.x - 12, pin.y, ioPinRadius, 0, Math.PI * 2);
      ctx.fillStyle = value ? '#ff3333' : '#3a5588';
      ctx.fill();
      ctx.strokeStyle = value ? '#ff6666' : '#667';
      ctx.lineWidth = 1.5;
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
