// audio.js — Procedural sound engine using Web Audio API
// Day 24: Audio effects chain, gate-type signatures, wire pitch escalation

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.3;
    this._initialized = false;
    this._wireConnectionCount = 0; // For pitch escalation

    // Load mute state from localStorage
    try {
      const saved = localStorage.getItem('signal-circuit-muted');
      if (saved === 'true') this.muted = true;
    } catch (e) {}
  }

  // Lazy init — must be called from a user gesture
  _ensureContext() {
    if (this._initialized) return true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
      this._buildEffectsChain();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Effects Processing Chain (T1) ──
  _buildEffectsChain() {
    const ctx = this.ctx;

    // Compressor — tame peaks without killing dynamics
    this._compressor = ctx.createDynamicsCompressor();
    this._compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    this._compressor.knee.setValueAtTime(12, ctx.currentTime);
    this._compressor.ratio.setValueAtTime(4, ctx.currentTime);
    this._compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this._compressor.release.setValueAtTime(0.15, ctx.currentTime);

    // Convolver reverb — short room impulse response
    this._reverbGain = ctx.createGain();
    this._reverbGain.gain.setValueAtTime(0.15, ctx.currentTime); // Subtle mix
    this._convolver = ctx.createConvolver();
    this._generateImpulseResponse();

    // Dry/wet mix
    this._dryGain = ctx.createGain();
    this._dryGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Master output
    this._masterGain = ctx.createGain();
    this._masterGain.gain.setValueAtTime(1, ctx.currentTime);

    // Routing: source → compressor → dry + wet → master → destination
    this._compressor.connect(this._dryGain);
    this._compressor.connect(this._convolver);
    this._convolver.connect(this._reverbGain);
    this._dryGain.connect(this._masterGain);
    this._reverbGain.connect(this._masterGain);
    this._masterGain.connect(ctx.destination);
  }

  _generateImpulseResponse() {
    const ctx = this.ctx;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.35); // 350ms decay
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with slight randomization
        const decay = Math.exp(-i / (sampleRate * 0.08));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    this._convolver.buffer = impulse;
  }

  // Get the effects chain output node (use instead of ctx.destination)
  get _output() {
    return this._compressor || this.ctx.destination;
  }

  _resumeIfNeeded() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted) {
    this.muted = muted;
    try {
      localStorage.setItem('signal-circuit-muted', muted ? 'true' : 'false');
    } catch (e) {}
  }

  get isMuted() {
    return this.muted;
  }

  // ── Micro-randomization helper ──
  _randomize(value, variance) {
    return value * (1 + (Math.random() - 0.5) * 2 * variance);
  }

  // ── Wire connection count for pitch escalation ──
  resetWireCount() {
    this._wireConnectionCount = 0;
  }

  // ── Sound: Gate placement (T2 — gate-type specific) ──
  playGatePlace(gateType) {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const vol = this.masterVolume;

    switch (gateType) {
      case 'AND': {
        // Clean sine — precise, digital feel
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this._randomize(880, 0.03), now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this._output);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'OR': {
        // Warm sawtooth — fuller, inclusive feel
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(this._randomize(660, 0.03), now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.07);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._output);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'NOT': {
        // Sharp square snap — decisive, inverted
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(this._randomize(1200, 0.03), now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
        gain.gain.setValueAtTime(vol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this._output);
        osc.start(now);
        osc.stop(now + 0.05);
        // Add a tiny click at start
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'sine';
        click.frequency.setValueAtTime(3000, now);
        clickGain.gain.setValueAtTime(vol * 0.15, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        click.connect(clickGain);
        clickGain.connect(this._output);
        click.start(now);
        click.stop(now + 0.015);
        break;
      }
      case 'XOR': {
        // Bell-like FM synthesis — distinctive, complex
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(this._randomize(700, 0.03), now);
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(1400, now); // 2:1 ratio for bell
        modGain.gain.setValueAtTime(300, now);
        modGain.gain.exponentialRampToValueAtTime(1, now + 0.15);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(this._output);
        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + 0.18);
        modulator.stop(now + 0.18);
        break;
      }
      default:
        this.playClick();
    }
  }

  // Legacy: generic click (relay click feel)
  playClick() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur1 = this._randomize(0.03, 0.1);
    const dur2 = this._randomize(0.05, 0.1);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(this._randomize(1200, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(this._randomize(300, 0.05), now + dur1);
    gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur2);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + dur2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(this._randomize(2400, 0.05), now);
    osc2.frequency.exponentialRampToValueAtTime(this._randomize(600, 0.05), now + 0.02);
    gain2.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc2.connect(gain2);
    gain2.connect(this._output);
    osc2.start(now);
    osc2.stop(now + 0.04);
  }

  // ── Sound: Wire connection zap with pitch escalation (T3) ──
  playWireConnect() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Pitch escalation: each wire is ~1 semitone higher, capped at 1 octave
    const semitones = Math.min(this._wireConnectionCount, 12);
    const pitchMult = Math.pow(2, semitones / 12);
    this._wireConnectionCount++;

    const baseFreq = 150 * pitchMult;

    // Primary zap: rising sawtooth
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this._randomize(baseFreq, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 10, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 5, now + 0.1);
    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + 0.12);

    // Buzzy harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(this._randomize(baseFreq * 2, 0.05), now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 13, now + 0.03);
    gain2.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2);
    gain2.connect(this._output);
    osc2.start(now);
    osc2.stop(now + 0.08);

    // Noise crackle layer
    this._playNoiseBurst(this._randomize(0.08, 0.1), this.masterVolume * 0.2);
  }

  // ── Sound: Wire/gate disconnection ──
  playWireDisconnect() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur = this._randomize(0.12, 0.1);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this._randomize(500, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(this._randomize(200, 0.05), now + dur * 0.8);
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + dur);
  }

  // ── Sound: Simulation row pulse (escalating) ──
  resetSimPitch() {
    this._simRowIndex = 0;
  }

  playSimPulsePass() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const row = this._simRowIndex || 0;
    this._simRowIndex = row + 1;

    const baseFreq = this._randomize(600 + row * 100, 0.03);
    const freq = Math.min(baseFreq, 1400);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.06);
    gain.gain.setValueAtTime(this.masterVolume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playSimPulseFail() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(this._randomize(400, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playSimPulse() {
    this.playSimPulsePass();
  }

  // ── Sound: Success jingle (rich ascending chord) ──
  playSuccess(stars = 2) {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this._output;

    if (stars === 1) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (stars === 2) {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        ['sine', 'triangle'].forEach((type, j) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq * (j === 1 ? 2 : 1), t);
          gain.gain.setValueAtTime(0, t);
          const vol = j === 0 ? this.masterVolume * 0.4 : this.masterVolume * 0.15;
          gain.gain.linearRampToValueAtTime(vol, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc.connect(gain);
          gain.connect(out);
          osc.start(t);
          osc.stop(t + 0.3);
        });
      });

      [1046.5, 1318.5].forEach((freq, i) => {
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        shimmer.type = i === 0 ? 'triangle' : 'sine';
        shimmer.frequency.setValueAtTime(freq, now + 0.36);
        sGain.gain.setValueAtTime(this.masterVolume * (0.25 - i * 0.1), now + 0.36);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        shimmer.connect(sGain);
        sGain.connect(out);
        shimmer.start(now + 0.36);
        shimmer.stop(now + 1.0);
      });
    } else {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        ['sine', 'triangle'].forEach((type, j) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq * (j === 1 ? 2 : 1), t);
          gain.gain.setValueAtTime(0, t);
          const vol = j === 0 ? this.masterVolume * 0.5 : this.masterVolume * 0.2;
          gain.gain.linearRampToValueAtTime(vol, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.connect(gain);
          gain.connect(out);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      });

      [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        shimmer.type = i === 0 ? 'triangle' : 'sine';
        shimmer.frequency.setValueAtTime(freq, now + 0.36);
        sGain.gain.setValueAtTime(this.masterVolume * (0.3 - i * 0.08), now + 0.36);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        shimmer.connect(sGain);
        sGain.connect(out);
        shimmer.start(now + 0.36);
        shimmer.stop(now + 1.4);
      });
    }
  }

  // ── Sound: Fail buzz ──
  playFail() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const freqs = [300, 200];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * this._randomize(0.15, 0.1);
      const dur = this._randomize(0.2, 0.1);
      osc.frequency.setValueAtTime(this._randomize(freq, 0.05), t);
      gain.gain.setValueAtTime(this.masterVolume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this._output);
      osc.start(t);
      osc.stop(t + dur);
    });
  }

  // ── Sound: UI button click ──
  playButtonClick() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dur = this._randomize(0.05, 0.1);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this._randomize(600, 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(this._randomize(500, 0.05), now + dur * 0.6);
    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + dur);
  }

  // ── Sound: Achievement unlock chime ──
  playAchievement() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this._output);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // ── Sound: Invalid connection buzz ──
  playInvalidConnection() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(this._randomize(150, 0.05), now);
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this._output);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ── Ambient Soundscape ──
  startAmbient() {
    if (this.muted || !this._ensureContext()) return;
    if (this._ambientActive) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    this._ambientActive = true;

    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
    lfoGain.gain.setValueAtTime(40, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(this.masterVolume * 0.03, ctx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(this._output);
    noise.start();

    this._ambientNodes = { noise, filter, lfo, lfoGain, ambientGain };
    this._startMusicPad();
  }

  stopAmbient() {
    if (!this._ambientActive) return;
    this._ambientActive = false;
    const ctx = this.ctx;
    if (this._ambientNodes) {
      const { noise, lfo, ambientGain } = this._ambientNodes;
      try {
        ambientGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => {
          try { noise.stop(); } catch (e) {}
          try { lfo.stop(); } catch (e) {}
        }, 600);
      } catch (e) {}
      this._ambientNodes = null;
    }
    this._stopMusicPad();
  }

  // ── Generative Music Pad ──
  _startMusicPad() {
    if (!this._ensureContext()) return;
    const ctx = this.ctx;
    this._musicOscs = [];

    const freqs = [130.81, 164.81, 196.00];
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, ctx.currentTime);
    padGain.gain.linearRampToValueAtTime(this.masterVolume * 0.04, ctx.currentTime + 3);
    padGain.connect(this._output);
    this._musicPadGain = padGain;

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, ctx.currentTime);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.33, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(padGain);
      osc.start();
      this._musicOscs.push({ osc, gain: oscGain });
    }
  }

  _stopMusicPad() {
    if (!this._musicOscs || !this.ctx) return;
    const ctx = this.ctx;
    try {
      if (this._musicPadGain) {
        this._musicPadGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1);
      }
      setTimeout(() => {
        for (const { osc } of (this._musicOscs || [])) {
          try { osc.stop(); } catch (e) {}
        }
        this._musicOscs = null;
        this._musicPadGain = null;
      }, 1200);
    } catch (e) {}
  }

  musicTension() {
    if (!this._musicOscs || !this.ctx) return;
    const ctx = this.ctx;
    const tensionFreqs = [130.81, 155.56, 196.00];
    this._musicOscs.forEach(({ osc }, i) => {
      if (tensionFreqs[i]) {
        osc.frequency.linearRampToValueAtTime(tensionFreqs[i], ctx.currentTime + 0.3);
      }
    });
  }

  musicResolve() {
    if (!this._musicOscs || !this.ctx) return;
    const ctx = this.ctx;
    const resolveFreqs = [130.81, 164.81, 196.00];
    this._musicOscs.forEach(({ osc }, i) => {
      if (resolveFreqs[i]) {
        osc.frequency.linearRampToValueAtTime(resolveFreqs[i], ctx.currentTime + 0.5);
      }
    });
  }

  // ── Helper: Noise burst ──
  _playNoiseBurst(duration, volume) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(gain);
    gain.connect(this._output);
    source.start(now);
  }
}
