// Web Audio API Synthesizer for Chime & Alert Notifications

class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency, type, duration, delay = 0, gainVal = 0.15) {
    setTimeout(() => {
      try {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; // 'sine', 'triangle', 'square'
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn("Audio playback error:", e);
      }
    }, delay * 1000);
  }

  playNewOrderChime() {
    // Elegant dual chime: G5 -> C6
    this.playTone(783.99, 'sine', 0.4, 0, 0.2);
    this.playTone(1046.50, 'sine', 0.6, 0.18, 0.25);
  }

  playOrderReadyChime() {
    // Triumphant 3-note chime: C5 -> E5 -> G5 -> C6
    this.playTone(523.25, 'triangle', 0.3, 0, 0.2);
    this.playTone(659.25, 'triangle', 0.3, 0.15, 0.2);
    this.playTone(783.99, 'triangle', 0.3, 0.30, 0.2);
    this.playTone(1046.50, 'sine', 0.8, 0.45, 0.3);
  }
}

export const soundSynth = new SoundSynth();
