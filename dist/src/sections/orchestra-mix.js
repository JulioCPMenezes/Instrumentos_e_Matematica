const commonDuration = 184.852608;

const familyConfig = {
  cordas: { label: 'Cordas', source: './public/assets/audio/orquestra/cordas.m4a', volume: .84 },
  madeiras: { label: 'Madeiras', source: './public/assets/audio/orquestra/madeiras.m4a', volume: .84 },
  metais: { label: 'Metais', source: './public/assets/audio/orquestra/metais.m4a', volume: .8 },
  percussao: { label: 'Percussão + harpa e piano', source: './public/assets/audio/orquestra/percussao-harpa-piano.m4a', volume: .8 }
};

const loadAudio = audio => new Promise((resolve, reject) => {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) return resolve();
  audio.addEventListener('loadedmetadata', resolve, { once: true });
  audio.addEventListener('error', () => reject(new Error('Não foi possível carregar uma das faixas da orquestra.')), { once: true });
  audio.load();
});

const seekAudio = (audio, position) => new Promise(resolve => {
  const target = Math.max(0, position);
  if (Math.abs(audio.currentTime - target) < .01) return resolve();
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    globalThis.clearTimeout(timeout);
    resolve();
  };
  const timeout = globalThis.setTimeout(done, 1500);
  audio.addEventListener('seeked', done, { once: true });
  audio.currentTime = target;
});

export class OrchestraMix {
  constructor() {
    this.layers = new Map();
    this.clock = null;
    this.ready = null;
    this.playing = false;
    this.starting = false;
    this.pausedAt = 0;
    this.duration = commonDuration;
  }

  async ensure() {
    if (this.ready) return this.ready;
    Object.entries(familyConfig).forEach(([key, config]) => {
      const audio = new Audio(config.source);
      audio.preload = 'auto';
      audio.volume = config.volume;
      this.layers.set(key, { audio, enabled: true });
    });
    this.clock = new Audio(familyConfig.cordas.source);
    this.clock.preload = 'auto';
    this.clock.muted = true;
    this.ready = Promise.all([
      loadAudio(this.clock),
      ...[...this.layers.values()].map(({ audio }) => loadAudio(audio))
    ]);
    return this.ready;
  }

  currentTime() {
    if (!this.playing || !this.clock) return this.pausedAt;
    const position = Math.min(this.duration, this.clock.currentTime);
    if (position >= this.duration) this.pause();
    return position;
  }

  updateTransport() {
    return this.currentTime();
  }

  isFamilyEnabled(key) {
    return this.layers.get(key)?.enabled || false;
  }

  async syncLayer(layer, position) {
    await seekAudio(layer.audio, Math.min(this.duration, Math.max(0, position)));
  }

  async syncAll(position) {
    await Promise.all([
      seekAudio(this.clock, position),
      ...[...this.layers.values()].map(layer => this.syncLayer(layer, position))
    ]);
  }

  async play() {
    await this.ensure();
    if (this.playing) return;
    if (this.pausedAt >= this.duration) await this.seek(0);
    const position = this.pausedAt;
    const activeLayers = [...this.layers.values()].filter(layer => layer.enabled);
    if (!activeLayers.length) return;
    await this.syncAll(position);
    const results = await Promise.allSettled([
      this.clock.play(),
      ...activeLayers.map(({ audio }) => audio.play())
    ]);
    const failure = results.find(result => result.status === 'rejected');
    if (failure) {
      this.clock.pause();
      this.layers.forEach(({ audio }) => audio.pause());
      throw failure.reason;
    }
    this.playing = true;
  }

  pause() {
    this.pausedAt = this.clock ? Math.min(this.duration, this.clock.currentTime) : this.pausedAt;
    this.playing = false;
    this.clock?.pause();
    this.layers.forEach(({ audio }) => audio.pause());
  }

  async seek(position) {
    await this.ensure();
    const nextPosition = Math.min(this.duration, Math.max(0, Number(position) || 0));
    this.pausedAt = nextPosition;
    await this.syncAll(nextPosition);
    return nextPosition;
  }

  async setFamily(key, enabled) {
    await this.ensure();
    const layer = this.layers.get(key);
    if (!layer) return false;
    const position = this.updateTransport();
    layer.enabled = enabled;
    await this.syncLayer(layer, position);
    if (!enabled) {
      layer.audio.pause();
      return false;
    }
    if (this.playing) await layer.audio.play();
    return true;
  }

  async setAll(enabled) {
    await this.ensure();
    this.layers.forEach(layer => {
      layer.enabled = enabled;
      if (!enabled) layer.audio.pause();
    });
  }

  async toggleFamily(key) {
    const layer = this.layers.get(key);
    if (!layer) return false;
    return this.setFamily(key, !layer.enabled);
  }
}

export { commonDuration, familyConfig };
