/* =====================================================================
   Kid Sudoku – Sound Effects Manager
   All sounds synthesized with Web Audio API – no external files needed
   ===================================================================== */

'use strict';

export class SoundManager {
  constructor() {
    this._ctx = null;
    this.isMuted = false;
    this._init();
  }

  /* ── Lazy-init AudioContext on first user gesture ─────────────────── */
  _init() {
    // AudioContext must be created/resumed after a user gesture
    const resume = () => {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } else if (this._ctx.state === 'suspended') {
        this._ctx.resume();
      }
    };
    document.addEventListener('pointerdown', resume, { once: false });
    document.addEventListener('keydown',     resume, { once: false });
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  /** Toggle mute state. Returns new muted state. */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /* ── Low-level helpers ─────────────────────────────────────────────── */

  /**
   * Play a single tone.
   * @param {number} freq - frequency in Hz
   * @param {number} duration - seconds
   * @param {'sine'|'square'|'sawtooth'|'triangle'} type
   * @param {number} gain - 0–1
   * @param {number} startOffset - seconds from now
   */
  _tone(freq, duration, type = 'sine', gain = 0.3, startOffset = 0) {
    if (this.isMuted) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime + startOffset;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Play a sequence of notes.
   * @param {Array<{freq: number, dur: number, offset: number}>} notes
   * @param {'sine'|'square'|'sawtooth'|'triangle'} type
   * @param {number} gain
   */
  _sequence(notes, type = 'sine', gain = 0.3) {
    notes.forEach(({ freq, dur, offset }) => {
      this._tone(freq, dur, type, gain, offset);
    });
  }

  /* ── Sound effects ─────────────────────────────────────────────────── */

  /** Short soft click for number selection / cell tap */
  playClick() {
    this._tone(880, 0.06, 'sine', 0.15);
  }

  /** Happy chime for correct number placement */
  playCorrect() {
    // Simple ascending two-note chime
    this._sequence([
      { freq: 523, dur: 0.12, offset: 0.00 },  // C5
      { freq: 784, dur: 0.18, offset: 0.10 }   // G5
    ], 'sine', 0.28);
  }

  /** Subtle buzz for a wrong number */
  playError() {
    this._tone(160, 0.18, 'sawtooth', 0.20);
  }

  /** Victory fanfare melody */
  playWin() {
    const melody = [
      { freq: 523, dur: 0.15, offset: 0.00 },  // C5
      { freq: 659, dur: 0.15, offset: 0.15 },  // E5
      { freq: 784, dur: 0.15, offset: 0.30 },  // G5
      { freq: 1047,dur: 0.30, offset: 0.45 },  // C6
      { freq: 784, dur: 0.10, offset: 0.55 },  // G5
      { freq: 1047,dur: 0.50, offset: 0.65 }   // C6 long
    ];
    this._sequence(melody, 'triangle', 0.32);
  }

  /** Magical sparkle sound for hint usage */
  playHint() {
    // Rising arpeggio on diminished chord
    const notes = [
      { freq: 698,  dur: 0.10, offset: 0.00 },  // F5
      { freq: 880,  dur: 0.10, offset: 0.08 },  // A5
      { freq: 1109, dur: 0.10, offset: 0.16 },  // C#6
      { freq: 1397, dur: 0.18, offset: 0.24 }   // F6
    ];
    this._sequence(notes, 'sine', 0.22);

    // Add a shimmer with a high sine wave
    if (!this.isMuted) {
      const ctx = this._getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(3000, now + 0.50);
      gainNode.gain.setValueAtTime(0, now + 0.24);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.28);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now + 0.24);
      osc.stop(now + 0.60);
    }
  }
}
