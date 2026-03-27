import React, { useEffect, useRef } from "react";

interface Props {
  onPlay: () => void;
  onSongs: () => void;
  onPractice: () => void;
  onSettings: () => void;
}

export function MenuScreen({ onPlay, onSongs, onPractice, onSettings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      s: number;
    }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 60,
        life: Math.random(),
        color: ["#22E06B", "#FF3B3B", "#FFD22E", "#2E7BFF", "#FF9A2E"][
          Math.floor(Math.random() * 5)
        ],
        s: 1 + Math.random() * 3,
      });
    }
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      const dt = (now - t) / 1000;
      t = now;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#020510");
      grad.addColorStop(0.6, "#0B0A20");
      grad.addColorStop(1, "#1A0530");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Spotlight beams
      const beams = [0.15, 0.5, 0.85];
      const colors = ["#2E7BFF", "#7B5CFF", "#3DE7FF"];
      for (let i = 0; i < 3; i++) {
        const cx = W * beams[i] + Math.sin(now / 2000 + i * 2) * W * 0.08;
        const grd = ctx.createRadialGradient(cx, 0, 0, cx, H * 0.8, W * 0.4);
        if (grd) {
          grd.addColorStop(0, `${colors[i]}30`);
          grd.addColorStop(1, "transparent");
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, W, H);
        }
      }

      // Crowd silhouette gradient at bottom
      const crowdGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
      crowdGrad.addColorStop(0, "transparent");
      crowdGrad.addColorStop(1, "#1A0530AA");
      ctx.fillStyle = crowdGrad;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);

      // Floating particles
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt * 0.2;
        if (p.y < -10 || p.life > 1) {
          p.x = Math.random() * W;
          p.y = H + 10;
          p.life = 0;
        }
        ctx.save();
        ctx.globalAlpha = Math.sin(p.life * Math.PI) * 0.6;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#020510" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 px-4">
        {/* Logo */}
        <div className="text-center mb-4">
          <h1
            className="fury-logo text-7xl sm:text-9xl font-black uppercase italic tracking-widest"
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              color: "#FFFFFF",
              textShadow:
                "0 0 20px #3DE7FF, 0 0 60px #3DE7FF88, 0 0 100px #7B5CFF44",
              letterSpacing: "0.1em",
            }}
          >
            FURY HERO
          </h1>
          <p
            className="text-cyan-300 tracking-[0.4em] uppercase text-sm sm:text-base mt-2"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              textShadow: "0 0 10px #3DE7FF",
            }}
          >
            ARE YOU READY TO ROCK?
          </p>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            { label: "▶  PLAY", action: onPlay, primary: true },
            { label: "🎵  SONGS", action: onSongs, primary: false },
            { label: "🥁  PRACTICE", action: onPractice, primary: false },
            { label: "⚙  SETTINGS", action: onSettings, primary: false },
          ].map((btn) => (
            <button
              type="button"
              key={btn.label}
              onClick={btn.action}
              className="menu-btn w-full py-4 text-xl font-bold uppercase tracking-widest rounded-lg border-2 transition-all duration-200 active:scale-95"
              style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                letterSpacing: "0.25em",
                background: btn.primary
                  ? "linear-gradient(135deg, #3DE7FF22, #7B5CFF22)"
                  : "rgba(255,255,255,0.04)",
                borderColor: btn.primary ? "#3DE7FF" : "#FFFFFF33",
                color: btn.primary ? "#3DE7FF" : "#FFFFFFCC",
                boxShadow: btn.primary
                  ? "0 0 20px #3DE7FF44, inset 0 0 20px #3DE7FF11"
                  : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 30px #3DE7FF66, inset 0 0 20px #3DE7FF22";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#3DE7FF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  btn.primary
                    ? "0 0 20px #3DE7FF44, inset 0 0 20px #3DE7FF11"
                    : "none";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  btn.primary ? "#3DE7FF" : "#FFFFFF33";
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <p
          className="text-gray-600 text-xs tracking-widest uppercase mt-4"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          Keys: A S D F G &nbsp;|&nbsp; Press to hit notes
        </p>
      </div>
    </div>
  );
}
