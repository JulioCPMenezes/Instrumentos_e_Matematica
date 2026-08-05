export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.activeNodes = new Set();
    this.enabled = true;
  }

  async ensure() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio API não está disponível neste navegador.');
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.master && this.context) {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.enabled ? 0.16 : 0, now, 0.025);
    }
  }

  async tone(frequency, {
    duration = 1.1,
    type = 'sine',
    gain = 0.13,
    attack = 0.02,
    release = 0.12,
    detune = 0
  } = {}) {
    const context = await this.ensure();
    if (!this.enabled) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    const stopAt = now + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, Math.min(8000, Number(frequency))), now);
    oscillator.detune.setValueAtTime(detune, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), now + attack);
    envelope.gain.setValueAtTime(Math.max(0.001, gain), Math.max(now + attack, stopAt - release));
    envelope.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    oscillator.stop(stopAt + 0.03);

    const node = { oscillator, envelope };
    this.activeNodes.add(node);
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.activeNodes.delete(node);
    }, { once: true });
  }

  async continuousTone(frequency, { type = 'sine', gain = 0.11 } = {}) {
    const context = await this.ensure();
    if (!this.enabled) return () => {};
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, Math.min(8000, Number(frequency))), now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), now + 0.03);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    const node = { oscillator, envelope };
    this.activeNodes.add(node);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const stopAt = context.currentTime + 0.08;
      envelope.gain.cancelScheduledValues(context.currentTime);
      envelope.gain.setTargetAtTime(0.0001, context.currentTime, 0.025);
      oscillator.stop(stopAt);
      this.activeNodes.delete(node);
      window.setTimeout(() => { oscillator.disconnect(); envelope.disconnect(); }, 120);
    };
  }

  async chord(frequencies = [220, 277.18, 329.63, 440], duration = 1.8) {
    const gains = [0.085, 0.065, 0.055, 0.04];
    await Promise.all(frequencies.map((frequency, index) => this.tone(frequency, {
      duration,
      type: index === 0 ? 'triangle' : 'sine',
      gain: gains[index] || 0.04,
      attack: 0.12,
      release: 0.55,
      detune: index % 2 ? -3 : 3
    })));
  }

  async harmonicSeries(fundamental, amplitudes, duration = 1.5, gainValue = 0.09) {
    const context = await this.ensure();
    if (!this.enabled) return;
    const now = context.currentTime;
    const groupGain = context.createGain();
    groupGain.gain.setValueAtTime(0.0001, now);
    groupGain.gain.exponentialRampToValueAtTime(gainValue, now + 0.04);
    groupGain.gain.setValueAtTime(gainValue, now + Math.max(0.06, duration - 0.2));
    groupGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    groupGain.connect(this.master);

    const group = [];
    amplitudes.forEach((amplitude, index) => {
      const amount = Number(amplitude);
      if (amount <= 0.001) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = fundamental * (index + 1);
      gain.gain.value = Math.min(1, amount) / Math.max(1, index + 1);
      oscillator.connect(gain);
      gain.connect(groupGain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
      group.push({ oscillator, gain });
    });

    const entry = { oscillator: group[0]?.oscillator, envelope: groupGain, group };
    this.activeNodes.add(entry);
    window.setTimeout(() => {
      group.forEach(({ oscillator, gain }) => {
        try { oscillator.disconnect(); } catch {}
        gain.disconnect();
      });
      groupGain.disconnect();
      this.activeNodes.delete(entry);
    }, (duration + 0.2) * 1000);
  }

  async reverberatedTone(frequency, { duration = 0.55, decay = 0.3, repeats = 2, type = 'triangle' } = {}) {
    this.stopAll();
    const spacing = Math.max(70, decay * 150);
    const jobs = Array.from({ length: repeats }, (_, index) => window.setTimeout(() => {
      this.tone(frequency, {
        duration: duration + index * decay * 0.16,
        type: index === 0 ? type : 'sine',
        gain: 0.095 * Math.exp(-index / Math.max(1, repeats * .42)),
        attack: 0.01,
        release: Math.min(.8, .12 + decay * .42)
      });
    }, index * spacing));
    return () => jobs.forEach(window.clearTimeout);
  }

  stopAll() {
    this.activeNodes.forEach(node => {
      if (node.group) {
        node.group.forEach(({ oscillator }) => {
          try { oscillator.stop(); } catch {}
        });
      } else if (node.oscillator) {
        try { node.oscillator.stop(); } catch {}
      }
    });
    this.activeNodes.clear();
  }
}

export const audioEngine = new AudioEngine();
