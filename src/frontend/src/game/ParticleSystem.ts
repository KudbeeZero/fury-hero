import type { Particle } from "./types";
import { LANE_COLORS } from "./types";

export class ParticleSystem {
  private particles: Particle[] = [];

  spawnHit(
    x: number,
    y: number,
    lane: number,
    type: "perfect" | "good" | "miss",
  ) {
    const color = LANE_COLORS[lane];
    const count = type === "perfect" ? 40 : type === "good" ? 15 : 6;
    const speedScale = type === "perfect" ? 1 : type === "good" ? 0.6 : 0.3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (100 + Math.random() * 300) * speedScale;
      const isFlame = type === "perfect" && Math.random() > 0.6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isFlame ? 200 : 0),
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        color: Math.random() > 0.3 ? color : "#FFFFFF",
        size: isFlame ? 3 + Math.random() * 5 : 2 + Math.random() * 6,
        isFlame,
      });
    }
  }

  update(dt: number) {
    const gravity = 200;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;
      p.life -= dt / p.maxLife;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.isFlame) {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.5, p.size * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
