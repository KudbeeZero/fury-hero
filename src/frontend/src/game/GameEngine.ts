import type { AudioEngine } from "./AudioEngine";
import { ParticleSystem } from "./ParticleSystem";
import type { GameSettings, GameState, Judgment, Lane, Note } from "./types";
import { LANE_COLORS } from "./types";

interface EngineCallbacks {
  onStateUpdate: (state: GameState) => void;
  onFinished: (state: GameState) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: GameSettings;
  private notes: Note[] = [];
  private audio: AudioEngine;
  private particles: ParticleSystem;
  private callbacks: EngineCallbacks;
  private rafId = 0;
  private lastTime = 0;
  private songDuration = 0;
  private flashEffects: {
    x: number;
    y: number;
    color: string;
    alpha: number;
    lane: number;
  }[] = [];
  private keysHeld: Set<string> = new Set();
  private scrollOffset = 0;
  private fps = 0;
  private fpsFrames = 0;
  private fpsTimer = 0;
  private starfield: { x: number; y: number; s: number }[] = [];
  private spotlightAngle = 0;

  state: GameState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    streak: 0,
    multiplier: 1,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    totalNotes: 0,
    lastJudgment: null,
    lastJudgmentTime: 0,
    songProgress: 0,
    isPlaying: false,
    isPaused: false,
    isFinished: false,
  };

  constructor(
    canvas: HTMLCanvasElement,
    audio: AudioEngine,
    notes: Note[],
    songDuration: number,
    settings: GameSettings,
    callbacks: EngineCallbacks,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.audio = audio;
    this.notes = notes;
    this.songDuration = songDuration;
    this.settings = settings;
    this.callbacks = callbacks;
    this.particles = new ParticleSystem();
    this.state.totalNotes = notes.length;

    for (let i = 0; i < 120; i++) {
      this.starfield.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        s: 0.5 + Math.random() * 2,
      });
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  start() {
    this.state.isPlaying = true;
    this.lastTime = performance.now();
    this.loop(performance.now());
  }

  private loop(now: number) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (!this.state.isPaused && this.state.isPlaying) {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    const currentTime = this.audio.getCurrentTime();
    this.scrollOffset += dt * 60; // scroll grid lines
    this.spotlightAngle += dt * 0.3;

    // FPS
    this.fpsTimer += dt;
    this.fpsFrames++;
    if (this.fpsTimer >= 1) {
      this.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }

    // Auto-miss notes that passed
    for (const note of this.notes) {
      if (!note.hit && !note.missed) {
        const diff = currentTime - note.targetTime;
        if (diff > this.settings.hitWindow / 1000 + 0.05) {
          note.missed = true;
          this.registerJudgment("miss", note.lane, note.id);
        }
      }
    }

    // Update flash effects
    this.flashEffects = this.flashEffects.filter((f) => f.alpha > 0);
    for (const f of this.flashEffects) f.alpha -= dt * 4;

    // Update particles
    this.particles.update(dt);

    // Song progress
    this.state.songProgress = Math.min(currentTime / this.songDuration, 1);

    // Check finished
    if (currentTime >= this.songDuration + 1) {
      this.finish();
    }

    this.callbacks.onStateUpdate({ ...this.state });
  }

  private finish() {
    if (this.state.isFinished) return;
    this.state.isFinished = true;
    this.state.isPlaying = false;
    this.callbacks.onFinished({ ...this.state });
  }

  hitLane(lane: Lane) {
    if (this.state.isPaused || !this.state.isPlaying) return;
    const currentTime = this.audio.getCurrentTime();
    const hw = this.settings.hitWindow / 1000;
    const pw = this.settings.perfectWindow / 1000;

    // Find closest unhit note in this lane within window
    let best: Note | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const note of this.notes) {
      if (note.lane !== lane || note.hit || note.missed) continue;
      const diff = Math.abs(note.targetTime - currentTime);
      if (diff < hw && diff < bestDiff) {
        bestDiff = diff;
        best = note;
      }
    }

    if (!best) return;
    best.hit = true;
    const judgment: Judgment = bestDiff <= pw ? "perfect" : "good";
    this.registerJudgment(judgment, lane, best.id);
  }

  private registerJudgment(judgment: Judgment, lane: Lane, noteId: string) {
    void noteId;
    const laneX = this.getLaneHitX(lane);
    const hitY = this.getHitZoneY();

    if (judgment === "perfect") {
      this.state.perfectCount++;
      const pts = 100 * this.state.multiplier;
      this.state.score += pts;
      this.state.combo++;
      this.state.streak++;
      this.particles.spawnHit(laneX, hitY, lane, "perfect");
      this.flashEffects.push({
        x: laneX,
        y: hitY,
        color: LANE_COLORS[lane],
        alpha: 0.6,
        lane,
      });
      this.audio.playHitSound("perfect");
    } else if (judgment === "good") {
      this.state.goodCount++;
      const pts = 50 * this.state.multiplier;
      this.state.score += pts;
      this.state.combo++;
      this.state.streak++;
      this.particles.spawnHit(laneX, hitY, lane, "good");
      this.audio.playHitSound("good");
    } else {
      this.state.missCount++;
      this.state.combo = 0;
      this.state.streak = 0;
      this.particles.spawnHit(laneX, hitY, lane, "miss");
    }

    if (this.state.combo > this.state.maxCombo)
      this.state.maxCombo = this.state.combo;
    this.state.multiplier = Math.min(1 + Math.floor(this.state.combo / 10), 8);
    this.state.lastJudgment = judgment;
    this.state.lastJudgmentTime = performance.now();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    this.keysHeld.add(key);
    const laneMap: Record<string, Lane> = {
      a: 0,
      s: 1,
      d: 2,
      f: 3,
      g: 4,
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 3,
      "5": 4,
    };
    if (key in laneMap) {
      e.preventDefault();
      this.hitLane(laneMap[key]);
    }
    if (key === "escape" || key === "p") this.togglePause();
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keysHeld.delete(e.key.toLowerCase());
  }

  togglePause() {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.audio.resume();
    } else {
      this.state.isPaused = true;
      this.audio.pause();
    }
    this.callbacks.onStateUpdate({ ...this.state });
  }

  updateSettings(s: GameSettings) {
    this.settings = s;
  }

  // --- Highway geometry ---
  private getHitZoneY() {
    return this.canvas.height * 0.85;
  }

  private getLaneX(lane: number, y: number): number {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const perspective = this.settings.highwayPerspective;
    const topWidth = W * (0.25 - perspective * 0.15);
    const botWidth = W * 0.75;
    const topLeft = (W - topWidth) / 2;
    const botLeft = (W - botWidth) / 2;
    const t = y / H;
    const laneLeft = topLeft + (botLeft - topLeft) * t;
    const laneWidth = (topWidth + (botWidth - topWidth) * t) / 5;
    return laneLeft + lane * laneWidth + laneWidth / 2;
  }

  private getLaneHitX(lane: number): number {
    return this.getLaneX(lane, this.getHitZoneY());
  }

  private getLaneWidth(y: number): number {
    const W = this.canvas.width;
    const perspective = this.settings.highwayPerspective;
    const topWidth = W * (0.25 - perspective * 0.15);
    const botWidth = W * 0.75;
    const t = y / this.canvas.height;
    return (topWidth + (botWidth - topWidth) * t) / 5;
  }

  // --- Rendering ---
  private render() {
    const { canvas, ctx } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    this.drawBackground();
    this.drawHighway();
    this.drawNotes();
    this.drawHitZone();
    this.drawFlashEffects();
    this.particles.draw(ctx);
    if (this.settings.showFPS) {
      ctx.fillStyle = "#fff8";
      ctx.font = "12px monospace";
      ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    }
  }

  private drawBackground() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#020510");
    grad.addColorStop(0.5, "#0B0A20");
    grad.addColorStop(1, "#150820");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Starfield
    ctx.fillStyle = "#ffffff";
    for (const star of this.starfield) {
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(star.x % W, star.y, star.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Spotlight beams
    const beams = [
      { cx: W * 0.15, color: "#2E7BFF" },
      { cx: W * 0.5, color: "#7B5CFF" },
      { cx: W * 0.85, color: "#3DE7FF" },
    ];
    for (let i = 0; i < beams.length; i++) {
      const beam = beams[i];
      const angle = this.spotlightAngle + i * 1.5;
      const dx = Math.sin(angle) * W * 0.15;
      const grd = ctx.createRadialGradient(
        beam.cx + dx,
        0,
        0,
        beam.cx + dx,
        H * 0.6,
        W * 0.3,
      );
      grd.addColorStop(0, `${beam.color}20`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    // Stage floor glow
    const floorGrad = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.6);
    floorGrad.addColorStop(0, "#FF7A1A18");
    floorGrad.addColorStop(1, "transparent");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 0, W, H);
  }

  private drawHighway() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const perspective = this.settings.highwayPerspective;
    const topWidth = W * (0.25 - perspective * 0.15);
    const botWidth = W * 0.75;
    const topLeft = (W - topWidth) / 2;
    const botLeft = (W - botWidth) / 2;

    // Highway surface
    const hGrad = ctx.createLinearGradient(0, 0, 0, H);
    hGrad.addColorStop(0, "#0A0A1A");
    hGrad.addColorStop(1, "#12103A");
    ctx.beginPath();
    ctx.moveTo(topLeft, 0);
    ctx.lineTo(topLeft + topWidth, 0);
    ctx.lineTo(botLeft + botWidth, H);
    ctx.lineTo(botLeft, H);
    ctx.closePath();
    ctx.fillStyle = hGrad;
    ctx.fill();

    // Scrolling grid lines
    const gridSpacing = 60;
    const offset = this.scrollOffset % gridSpacing;
    ctx.strokeStyle = "#FFFFFF10";
    ctx.lineWidth = 1;
    for (let y = -gridSpacing + offset; y < H + gridSpacing; y += gridSpacing) {
      const t1 = Math.max(0, y) / H;
      const _t2 = Math.min(H, y + gridSpacing) / H;
      const x1L = topLeft + (botLeft - topLeft) * t1;
      const x1R = x1L + topWidth + (botWidth - topWidth) * t1;
      ctx.beginPath();
      ctx.moveTo(x1L, y);
      ctx.lineTo(x1R, y);
      ctx.stroke();
    }

    // Lane dividers
    for (let lane = 0; lane <= 5; lane++) {
      const xTop = topLeft + (topWidth / 5) * lane;
      const xBot = botLeft + (botWidth / 5) * lane;
      ctx.beginPath();
      ctx.moveTo(xTop, 0);
      ctx.lineTo(xBot, H);
      const laneIdx = Math.min(lane, 4);
      const color =
        lane < 5 && lane > 0 ? `${LANE_COLORS[laneIdx - 1]}55` : "#FFFFFF30";
      ctx.strokeStyle = color;
      ctx.lineWidth = lane === 0 || lane === 5 ? 2 : 1;
      ctx.stroke();
    }

    // Lane glow overlays
    for (let lane = 0; lane < 5; lane++) {
      const xTopL = topLeft + (topWidth / 5) * lane;
      const xTopR = topLeft + (topWidth / 5) * (lane + 1);
      const xBotL = botLeft + (botWidth / 5) * lane;
      const xBotR = botLeft + (botWidth / 5) * (lane + 1);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `${LANE_COLORS[lane]}00`);
      grad.addColorStop(1, `${LANE_COLORS[lane]}15`);
      ctx.beginPath();
      ctx.moveTo(xTopL, 0);
      ctx.lineTo(xTopR, 0);
      ctx.lineTo(xBotR, H);
      ctx.lineTo(xBotL, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  private drawNotes() {
    const currentTime = this.audio.getCurrentTime();
    const { ctx, canvas, settings } = this;
    const H = canvas.height;
    const hitZoneY = this.getHitZoneY();

    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      const dt = note.targetTime - currentTime;
      const noteY = hitZoneY - dt * settings.noteSpeed;
      if (noteY < -40 || noteY > H + 40) continue;

      const noteX = this.getLaneX(note.lane, noteY);
      const laneW = this.getLaneWidth(noteY);
      const radius = laneW * 0.38;
      const color = LANE_COLORS[note.lane];

      // Outer glow
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;

      // Main gem circle
      ctx.beginPath();
      ctx.arc(noteX, noteY, radius, 0, Math.PI * 2);
      const gemGrad = ctx.createRadialGradient(
        noteX - radius * 0.3,
        noteY - radius * 0.3,
        0,
        noteX,
        noteY,
        radius,
      );
      gemGrad.addColorStop(0, "#FFFFFF");
      gemGrad.addColorStop(0.3, color);
      gemGrad.addColorStop(1, `${color}AA`);
      ctx.fillStyle = gemGrad;
      ctx.fill();

      // Outline ring
      ctx.beginPath();
      ctx.arc(noteX, noteY, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#FFFFFF88";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawHitZone() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const hitY = this.getHitZoneY();
    const perspective = this.settings.highwayPerspective;
    const topWidth = W * (0.25 - perspective * 0.15);
    const botWidth = W * 0.75;
    const topLeft = (W - topWidth) / 2;
    const botLeft = (W - botWidth) / 2;
    const t = hitY / canvas.height;
    const lLeft = topLeft + (botLeft - topLeft) * t;
    const lWidth = topWidth + (botWidth - topWidth) * t;

    // Glow bar
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#3DE7FF";
    ctx.strokeStyle = "#3DE7FF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lLeft, hitY);
    ctx.lineTo(lLeft + lWidth, hitY);
    ctx.stroke();
    ctx.restore();

    // Receptors for each lane
    for (let lane = 0; lane < 5; lane++) {
      const cx = this.getLaneX(lane, hitY);
      const laneW = this.getLaneWidth(hitY);
      const r = laneW * 0.38;
      const color = LANE_COLORS[lane];
      const isHeld =
        this.keysHeld.has(["a", "s", "d", "f", "g"][lane]) ||
        this.keysHeld.has(["1", "2", "3", "4", "5"][lane]);

      ctx.save();
      ctx.shadowBlur = isHeld ? 40 : 15;
      ctx.shadowColor = color;

      // Receptor ring
      ctx.beginPath();
      ctx.arc(cx, hitY, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = color + (isHeld ? "FF" : "66");
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner fill
      ctx.beginPath();
      ctx.arc(cx, hitY, r, 0, Math.PI * 2);
      ctx.fillStyle = isHeld ? `${color}80` : `${color}20`;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFlashEffects() {
    const { ctx, canvas } = this;
    for (const f of this.flashEffects) {
      ctx.save();
      ctx.globalAlpha = f.alpha * 0.4;
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
