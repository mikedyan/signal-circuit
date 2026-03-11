// audio.js — Procedural sound engine using Web Audio API

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.3;
    this._initialized = false;

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
      return true;
    } catch (e) {
      return false;
    }
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

  // ── Sound: Gate placement click ──
  playClick() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // ── Sound: Wire connection zap ──
  playWireConnect() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Zap: quick rising tone + noise burst
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Noise crackle layer
    this._playNoiseBurst(0.06, this.masterVolume * 0.15);
  }

  // ── Sound: Wire/gate disconnection ──
  playWireDisconnect() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // ── Sound: Simulation row pulse ──
  playSimPulse() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // ── Sound: Success jingle (ascending 3-note) ──
  playSuccess() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });

    // Final chord shimmer
    const shimmer = ctx.createOscillator();
    const sGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1046.5, now + 0.36); // C6
    sGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.36);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    shimmer.connect(sGain);
    sGain.connect(ctx.destination);
    shimmer.start(now + 0.36);
    shimmer.stop(now + 0.8);
  }

  // ── Sound: Fail buzz ──
  playFail() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Two descending tones for a "wrong" feel
    const freqs = [300, 200];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(this.masterVolume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // ── Sound: UI button click ──
  playButtonClick() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.03);
    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
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
    gain.connect(ctx.destination);
    source.start(now);
  }
}
