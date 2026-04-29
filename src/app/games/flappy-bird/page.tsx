"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, BIRD_X = 60, BIRD_R = 15;
const PIPE_W = 46, PIPE_GAP_BASE = 138;
const PIPE_SPEED_BASE = 2.2, PIPE_INTERVAL_BASE = 88;
const GRAVITY = 0.46, JUMP = -9.5;

interface Pipe { x: number; topH: number; scored: boolean; color: string; }

const LEVEL_THRESHOLDS = [0, 8, 18, 30, 44, 60, 80];
function getLevelConfig(lv: number) {
  const speed = PIPE_SPEED_BASE + (lv - 1) * 0.28;
  const gap = Math.max(95, PIPE_GAP_BASE - (lv - 1) * 7);
  const interval = Math.max(62, PIPE_INTERVAL_BASE - (lv - 1) * 4);
  return { speed, gap, interval };
}

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    birdY: H / 2, birdVY: 0,
    wingAngle: 0, wingDir: 1,
    pipes: [] as Pipe[],
    clouds: [
      { x: 40, y: 60, w: 70, speed: 0.3 },
      { x: 150, y: 30, w: 55, speed: 0.2 },
      { x: 260, y: 80, w: 80, speed: 0.35 },
    ],
    score: 0, highScore: 0, level: 1,
    frame: 0, running: false, dead: false,
    levelUp: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    bgOffset: 0,
  });
  const [display, setDisplay] = useState({ score: 0, highScore: 0, dead: false, running: false, level: 1 });
  const rafRef = useRef<number>(0);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.dead) return;
    if (!s.running) { s.running = true; setDisplay(d => ({ ...d, running: true })); }
    s.birdVY = JUMP;
    s.wingAngle = -0.6;
    // Feather particles
    for (let i = 0; i < 4; i++) {
      s.particles.push({ x: BIRD_X, y: s.birdY, vx: -1 - Math.random() * 2, vy: (Math.random() - 0.5) * 2, life: 20, color: "#fde68a" });
    }
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.birdY = H / 2; s.birdVY = 0; s.pipes = []; s.score = 0; s.frame = 0;
    s.running = false; s.dead = false; s.level = 1; s.levelUp = 0; s.particles = [];
    setDisplay(d => ({ ...d, score: 0, dead: false, running: false, level: 1 }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const PIPE_COLORS = [
      ["#16a34a", "#4ade80"],
      ["#0284c7", "#38bdf8"],
      ["#7c3aed", "#a78bfa"],
      ["#dc2626", "#f87171"],
      ["#d97706", "#fbbf24"],
      ["#0f766e", "#2dd4bf"],
    ];

    const loop = () => {
      const s = stateRef.current;
      const cfg = getLevelConfig(s.level);

      if (s.running && !s.dead) {
        s.frame++;
        s.bgOffset = (s.bgOffset + 0.3) % W;

        // Bird physics
        s.birdVY += GRAVITY;
        s.birdY += s.birdVY;
        s.wingAngle += s.wingDir * 0.15;
        if (Math.abs(s.wingAngle) > 0.4) s.wingDir *= -1;

        // Clouds
        for (const cloud of s.clouds) {
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.w < 0) { cloud.x = W + 20; cloud.y = 20 + Math.random() * (H * 0.45); }
        }

        // Spawn pipes
        if (s.frame % cfg.interval === 0) {
          const topH = 50 + Math.random() * (H - cfg.gap - 100);
          const colorSet = PIPE_COLORS[(s.pipes.length) % PIPE_COLORS.length];
          s.pipes.push({ x: W, topH, scored: false, color: colorSet[0] + "|" + colorSet[1] });
        }
        for (const p of s.pipes) {
          p.x -= cfg.speed;
          if (!p.scored && p.x + PIPE_W < BIRD_X) {
            p.scored = true; s.score++;
            // Check level up
            const nextLevelIdx = LEVEL_THRESHOLDS.findIndex((t, i) => i > 0 && s.score === t);
            if (nextLevelIdx > 0) { s.level = nextLevelIdx + 1; s.levelUp = 80; setDisplay(d => ({ ...d, level: s.level })); }
            setDisplay(d => ({ ...d, score: s.score }));
            // Score particles
            for (let i = 0; i < 8; i++) {
              s.particles.push({ x: p.x, y: p.topH + cfg.gap / 2, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, life: 35, color: "#fbbf24" });
            }
          }
        }
        s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0);
        s.particles = s.particles.filter(p => p.life-- > 0);
        for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; }

        // Collision
        const gap = cfg.gap;
        const hit = s.birdY - BIRD_R < 0 || s.birdY + BIRD_R > H - 22 ||
          s.pipes.some(p => BIRD_X + BIRD_R > p.x + 2 && BIRD_X - BIRD_R < p.x + PIPE_W - 2 &&
            (s.birdY - BIRD_R < p.topH || s.birdY + BIRD_R > p.topH + gap));
        if (hit) {
          s.dead = true;
          s.highScore = Math.max(s.highScore, s.score);
          setDisplay(d => ({ ...d, dead: true, highScore: s.highScore }));
          // Explosion
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            s.particles.push({ x: BIRD_X, y: s.birdY, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 40, color: i % 2 === 0 ? "#fbbf24" : "#f97316" });
          }
        }
      }

      // === DRAW ===
      // Dynamic sky based on level
      const skyColors = [
        ["#bfdbfe", "#7dd3fc", "#e0f2fe"],
        ["#ddd6fe", "#a78bfa", "#ede9fe"],
        ["#fef08a", "#fbbf24", "#fef3c7"],
        ["#fca5a5", "#ef4444", "#fef2f2"],
        ["#6ee7b7", "#10b981", "#d1fae5"],
        ["#67e8f9", "#0891b2", "#cffafe"],
        ["#c4b5fd", "#7c3aed", "#ede9fe"],
      ];
      const sky = skyColors[(s.level - 1) % skyColors.length];
      const skyGr = ctx.createLinearGradient(0, 0, 0, H);
      skyGr.addColorStop(0, sky[0]); skyGr.addColorStop(0.6, sky[1]); skyGr.addColorStop(1, sky[2]);
      ctx.fillStyle = skyGr; ctx.fillRect(0, 0, W, H);

      // Scrolling BG mountains
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let i = 0; i < 4; i++) {
        const mx = ((i * 90 - s.bgOffset * 0.4) % (W + 80)) - 20;
        ctx.beginPath(); ctx.moveTo(mx, H - 22); ctx.lineTo(mx + 50, H - 70 - i * 15); ctx.lineTo(mx + 100, H - 22); ctx.fill();
      }

      // Clouds
      for (const cloud of s.clouds) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath(); ctx.ellipse(cloud.x + cloud.w / 2, cloud.y, cloud.w / 2, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cloud.x + cloud.w * 0.3, cloud.y - 8, cloud.w * 0.25, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cloud.x + cloud.w * 0.7, cloud.y - 6, cloud.w * 0.22, 10, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Pipes with gradient
      const gap = cfg.gap;
      for (const p of s.pipes) {
        const [c1, c2] = p.color.split("|");
        const gr = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        gr.addColorStop(0, c1); gr.addColorStop(1, c2);
        ctx.fillStyle = gr;
        // Shadow
        ctx.shadowColor = c1; ctx.shadowBlur = 6;
        // Top pipe
        ctx.beginPath(); ctx.roundRect(p.x, 0, PIPE_W, p.topH, [0, 0, 6, 6]); ctx.fill();
        // Cap
        ctx.shadowBlur = 0;
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.roundRect(p.x - 5, p.topH - 18, PIPE_W + 10, 18, 4); ctx.fill();
        // Bottom pipe
        ctx.fillStyle = gr; ctx.shadowColor = c1; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.roundRect(p.x, p.topH + gap, PIPE_W, H - p.topH - gap, [6, 6, 0, 0]); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.roundRect(p.x - 5, p.topH + gap, PIPE_W + 10, 18, 4); ctx.fill();
        // Highlight stripe
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(p.x + 4, 0, 6, p.topH);
        ctx.fillRect(p.x + 4, p.topH + gap, 6, H);
      }

      // Particles
      for (const pt of s.particles) {
        const a = pt.life / 40;
        ctx.fillStyle = pt.color + Math.floor(a * 255).toString(16).padStart(2, '0');
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3 * a, 0, Math.PI * 2); ctx.fill();
      }

      // Ground
      const gndGr = ctx.createLinearGradient(0, H - 22, 0, H);
      gndGr.addColorStop(0, "#4ade80"); gndGr.addColorStop(1, "#16a34a");
      ctx.fillStyle = gndGr; ctx.fillRect(0, H - 22, W, 22);
      // Ground texture
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
      for (let x = (-s.bgOffset * 1.5 % 22); x < W; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, H - 22); ctx.lineTo(x + 11, H); ctx.stroke();
      }

      // Bird with rotation
      const birdRot = Math.min(Math.max(s.birdVY * 0.06, -0.4), 0.9);
      ctx.save();
      ctx.translate(BIRD_X, s.birdY);
      ctx.rotate(birdRot);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath(); ctx.ellipse(0, BIRD_R + 2, BIRD_R * 0.8, 5, 0, 0, Math.PI * 2); ctx.fill();
      // Wing
      ctx.save();
      ctx.rotate(s.wingAngle * 0.8);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath(); ctx.ellipse(-4, 2, 10, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Body
      ctx.font = "26px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🐦", 0, 0);
      // Glow ring when alive
      if (s.running && !s.dead) {
        ctx.strokeStyle = "rgba(251,191,36,0.4)"; ctx.lineWidth = 2;
        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, 0, BIRD_R + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Level up display
      if (s.levelUp > 0) {
        const a = Math.min(1, s.levelUp / 20);
        ctx.font = `bold ${24 + (80 - s.levelUp) / 10}px sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 20;
        ctx.textAlign = "center";
        ctx.fillText(`⬆️ LEVEL ${s.level}!`, W / 2, H / 2 - 40);
        ctx.shadowBlur = 0;
        s.levelUp--;
      }

      // Score HUD
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.roundRect(W / 2 - 60, 8, 120, 26, 8); ctx.fill();
      ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
      ctx.fillText(`🏅 ${s.score}   Lv${s.level}`, W / 2, 25);

      if (!s.running && !s.dead) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, H / 2 - 55, W, 90);
        ctx.font = "bold 22px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.fillText("🐦 CHIM BAY", W / 2, H / 2 - 26);
        ctx.font = "14px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("Chạm / Space để bắt đầu", W / 2, H / 2 + 4);
        ctx.font = "12px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("7 cấp độ ngày càng khó hơn!", W / 2, H / 2 + 22);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); jump(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [jump]);

  return (
    <GameShell title="Chim Bay" emoji="🐦" score={display.score} highScore={display.highScore} color="from-sky-400 to-blue-500">
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl select-none cursor-pointer"
          style={{ touchAction: "manipulation" }}
          onClick={() => { if (display.dead) reset(); else jump(); }}>
          <canvas ref={canvasRef} width={W} height={H} className="block" style={{ maxWidth: "100%", maxHeight: "65vh" }} />
          {display.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(0,0,0,0.78)" }}>
              <div className="text-6xl mb-2">💥</div>
              <div className="text-white font-black text-2xl">GAME OVER</div>
              <div className="text-yellow-300 text-xl font-bold mt-1">{display.score} điểm</div>
              <div className="text-sky-300 text-sm">Level {display.level} • Best: {display.highScore}</div>
              <button className="mt-5 px-8 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full font-black text-lg shadow-lg active:scale-95 transition-transform">
                🔄 Chơi lại
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-sky-300 opacity-60">Chạm màn hình hoặc nhấn Space để vỗ cánh 🐦</p>
      </div>
    </GameShell>
  );
}
