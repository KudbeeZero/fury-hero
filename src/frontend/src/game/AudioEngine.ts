export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private pausedAt = 0;
  private _isPlaying = false;
  private scheduledNodes: (AudioScheduledSourceNode | AudioBufferSourceNode)[] =
    [];

  // Hit sound buffers
  private perfectBuffer: AudioBuffer | null = null;
  private goodBuffer: AudioBuffer | null = null;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.createHitSounds();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(v: number) {
    if (this.masterGain)
      this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.01);
  }

  private createHitSounds() {
    const ctx = this.ctx!;
    // Perfect hit: bright ding
    {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 20);
      }
      this.perfectBuffer = buf;
    }
    // Good hit: softer click
    {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 30);
      }
      this.goodBuffer = buf;
    }
  }

  playHitSound(type: "perfect" | "good") {
    const ctx = this.ensureContext();
    const buf = type === "perfect" ? this.perfectBuffer : this.goodBuffer;
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.3;
    src.connect(g);
    g.connect(this.masterGain!);
    src.start();
  }

  /** Build and schedule a synth beat for given BPM + duration */
  startSynthBeat(bpm: number, duration: number, volume = 0.8) {
    const ctx = this.ensureContext();
    this.stop();
    this.setVolume(volume);

    const beatDur = 60 / bpm;
    const totalBeats = Math.ceil(duration / beatDur) + 4;
    const now = ctx.currentTime + 0.1;

    const nodes: AudioScheduledSourceNode[] = [];

    for (let beat = 0; beat < totalBeats; beat++) {
      const t = now + beat * beatDur;
      if (t - now > duration + 1) break;

      // Kick on beats 1 & 3 (0-indexed: 0, 2)
      if (beat % 4 === 0 || beat % 4 === 2) {
        this.scheduleKick(ctx, t, nodes);
      }
      // Snare on 2 & 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        this.scheduleSnare(ctx, t, nodes);
      }
      // Hi-hat every 8th note
      this.scheduleHihat(ctx, t, nodes);
      this.scheduleHihat(ctx, t + beatDur / 2, nodes);

      // Simple bass line
      const bassNotes = [55, 55, 58, 62, 65, 65, 62, 58];
      const freq = 440 * 2 ** ((bassNotes[beat % bassNotes.length] - 69) / 12);
      this.scheduleBass(ctx, t, freq, beatDur * 0.9, nodes);
    }

    this.scheduledNodes = nodes;
    this.startedAt = now;
    this.pausedAt = 0;
    this._isPlaying = true;
  }

  private scheduleKick(
    ctx: AudioContext,
    t: number,
    nodes: AudioScheduledSourceNode[],
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.2);
    nodes.push(osc);
  }

  private scheduleSnare(
    ctx: AudioContext,
    t: number,
    nodes: AudioScheduledSourceNode[],
  ) {
    const bufSize = ctx.sampleRate * 0.1;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1200;
    bpf.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.masterGain!);
    src.start(t);
    src.stop(t + 0.1);
    nodes.push(src);
  }

  private scheduleHihat(
    ctx: AudioContext,
    t: number,
    nodes: AudioScheduledSourceNode[],
  ) {
    const bufSize = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.masterGain!);
    src.start(t);
    src.stop(t + 0.06);
    nodes.push(src);
  }

  private scheduleBass(
    ctx: AudioContext,
    t: number,
    freq: number,
    dur: number,
    nodes: AudioScheduledSourceNode[],
  ) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.4, t + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur);
    nodes.push(osc);
  }

  async loadMP3File(
    file: File,
    volume = 0.8,
  ): Promise<{ duration: number; bpm: number }> {
    const ctx = this.ensureContext();
    this.stop();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return this.setupBufferSource(audioBuffer, volume);
  }

  private setupBufferSource(
    audioBuffer: AudioBuffer,
    volume: number,
  ): { duration: number; bpm: number } {
    this.setVolume(volume);
    const src = this.ctx!.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.masterGain!);
    this.sourceNode = src;
    const bpm = this.detectBPM(audioBuffer);
    return { duration: audioBuffer.duration, bpm };
  }

  private detectBPM(buffer: AudioBuffer): number {
    // Simple onset-based BPM detection
    try {
      const data = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
      const energies: number[] = [];
      for (let i = 0; i < data.length - windowSize; i += windowSize) {
        let e = 0;
        for (let j = 0; j < windowSize; j++) e += data[i + j] ** 2;
        energies.push(e / windowSize);
      }
      // Find peaks (onset detection)
      const peaks: number[] = [];
      const avgE = energies.reduce((a, b) => a + b, 0) / energies.length;
      for (let i = 1; i < energies.length - 1; i++) {
        if (
          energies[i] > energies[i - 1] &&
          energies[i] > energies[i + 1] &&
          energies[i] > avgE * 1.5
        ) {
          peaks.push(i);
        }
      }
      // Estimate BPM from peak intervals
      if (peaks.length < 4) return 120;
      const intervals: number[] = [];
      for (let i = 1; i < Math.min(peaks.length, 50); i++) {
        intervals.push((peaks[i] - peaks[i - 1]) * 0.01); // seconds
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60 / avgInterval);
      // Clamp to reasonable range
      if (bpm < 60) return bpm * 2;
      if (bpm > 200) return Math.round(bpm / 2);
      return bpm;
    } catch {
      return 120;
    }
  }

  startBufferSource() {
    if (!this.sourceNode || !this.ctx) return;
    this.startedAt = this.ctx.currentTime;
    this.pausedAt = 0;
    this.sourceNode.start(0);
    this._isPlaying = true;
  }

  getCurrentTime(): number {
    if (!this.ctx || !this._isPlaying) return this.pausedAt;
    return this.ctx.currentTime - this.startedAt;
  }

  getAudioContextTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  pause() {
    if (!this._isPlaying || !this.ctx) return;
    this.pausedAt = this.getCurrentTime();
    this.ctx.suspend();
    this._isPlaying = false;
  }

  resume() {
    if (this._isPlaying || !this.ctx) return;
    this.ctx.resume();
    this.startedAt = this.ctx.currentTime - this.pausedAt;
    this._isPlaying = true;
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {}
      this.sourceNode = null;
    }
    for (const n of this.scheduledNodes) {
      try {
        n.stop();
      } catch {}
    }
    this.scheduledNodes = [];
    this._isPlaying = false;
    this.startedAt = 0;
    this.pausedAt = 0;
  }

  isPlaying() {
    return this._isPlaying;
  }

  destroy() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
