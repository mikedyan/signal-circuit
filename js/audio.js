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

  // ── Sound: Gate placement click (relay click feel) ──
  playClick() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Main click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // Harmonic overtone for "relay click" feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2400, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.02);
    gain2.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.04);
  }

  // ── Sound: Wire connection zap (electric crackle) ──
  playWireConnect() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Primary zap: rising sawtooth
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // Buzzy harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.03);
    gain2.gain.setValueAtTime(this.masterVolume * 0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);

    // Noise crackle layer
    this._playNoiseBurst(0.08, this.masterVolume * 0.2);
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

  // ── Sound: Success jingle (rich ascending chord) ──
  playSuccess(stars = 2) {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (stars === 1) {
      // 1 star: single modest chime (just C5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (stars === 2) {
      // 2 stars: standard arpeggio (C5-E5-G5)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
      });

      // Final chord shimmer
      [1046.5, 1318.5].forEach((freq, i) => {
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        shimmer.type = i === 0 ? 'triangle' : 'sine';
        shimmer.frequency.setValueAtTime(freq, now + 0.36);
        sGain.gain.setValueAtTime(this.masterVolume * (0.25 - i * 0.1), now + 0.36);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        shimmer.connect(sGain);
        sGain.connect(ctx.destination);
        shimmer.start(now + 0.36);
        shimmer.stop(now + 1.0);
      });
    } else {
      // 3 stars: extended fanfare with high octave sustain
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      });

      // Extended shimmer with more harmonics
      [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
        const shimmer = ctx.createOscillator();
        const sGain = ctx.createGain();
        shimmer.type = i === 0 ? 'triangle' : 'sine';
        shimmer.frequency.setValueAtTime(freq, now + 0.36);
        sGain.gain.setValueAtTime(this.masterVolume * (0.3 - i * 0.08), now + 0.36);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        shimmer.connect(sGain);
        sGain.connect(ctx.destination);
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

  // ── Sound: Achievement unlock chime ──
  playAchievement() {
    if (this.muted || !this._ensureContext()) return;
    this._resumeIfNeeded();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sparkle arpeggio: G5, B5, D6, G6
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
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
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
    gain.connect(ctx.destination);
    source.start(now);
  }
}
