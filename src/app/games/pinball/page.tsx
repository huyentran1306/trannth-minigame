"use client";
import { useRef, useEffect, useState } from "react";
import GameShell from "@/components/game-shell";

const W = 300, H = 520;
const BALL_R = 9, GRAV = 0.28, DAMPEN = 0.55;
const FLIPPER_LEN = 62, FLIPPER_W = 10;
const L_ANCHOR = { x: 80, y: H - 80 }, R_ANCHOR = { x: W - 80, y: H - 80 };
const BUMPERS = [
  { x: 80, y: 160, r: 18 }, { x: W / 2, y: 120, r: 20 }, { x: W - 80, y: 160, r: 18 },
  { x: 100, y: 260, r: 15 }, { x: W - 100, y: 260, r: 15 },
];
const LAUNCH_X = W - 22;

export default function Pinball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    ball: { x: LAUNCH_X, y: H - 100, vx: 0, vy: 0, active: false },
    lFlip: false, rFlip: false,
    power: 0, charging: false, launched: false,
    score: 0, highScore: 0, lives: 3,
    bumperFlash: new Array(BUMPERS.length).fill(0),
    over: false, scoreFlash: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, lives: 3 });

  // Flipper angle calc
  const lAngle = (pressed: boolean) => pressed ? -Math.PI / 8 : Math.PI / 5;
  const rAngle = (pressed: boolean) => pressed ? Math.PI + Math.PI / 8 : Math.PI - Math.PI / 5;

  const flipperEndL = (pressed: boolean) => ({
    x: L_ANCHOR.x + Math.cos(lAngle(pressed)) * FLIPPER_LEN,
    y: L_ANCHOR.y + Math.sin(lAngle(pressed)) * FLIPPER_LEN,
  });
  const flipperEndR = (pressed: boolean) => ({
    x: R_ANCHOR.x + Math.cos(rAngle(pressed)) * FLIPPER_LEN,
    y: R_ANCHOR.y + Math.sin(rAngle(pressed)) * FLIPPER_LEN,
  });

  // Segment-circle collision
  const segCircle = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number) => {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const nx = ax + t * dx - cx, ny = ay + t * dy - cy;
    const dist = Math.hypot(nx, ny);
    return dist < r ? { nx: nx / dist, ny: ny / dist, dist } : null;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.type === "keydown") {
        if (e.key === "z" || e.key === "Z" || e.key === "ArrowLeft") s.lFlip = true;
        if (e.key === "x" || e.key === "X" || e.key === "ArrowRight") s.rFlip = true;
        if ((e.key === " " || e.key === "ArrowUp") && !s.launched && !s.ball.active) {
          s.charging = true;
        }
      } else {
        if (e.key === "z" || e.key === "Z" || e.key === "ArrowLeft") s.lFlip = false;
        if (e.key === "x" || e.key === "X" || e.key === "ArrowRight") s.rFlip = false;
        if ((e.key === " " || e.key === "ArrowUp") && s.charging && !s.ball.active) {
          const p = s.power;
          s.ball = { x: LAUNCH_X, y: H - 110, vx: 0, vy: -p * 0.18, active: true };
          s.charging = false; s.power = 0; s.launched = true;
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKey); };
  }, []);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const loop = () => {
      const s = state.current;
      if (s.charging) s.power = Math.min(s.power + 1.5, 100);

      if (s.ball.active) {
        s.ball.vy += GRAV;
        s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;

        // Walls
        if (s.ball.x - BALL_R < 10) { s.ball.x = 10 + BALL_R; s.ball.vx = Math.abs(s.ball.vx) * DAMPEN + 0.5; }
        if (s.ball.x + BALL_R > LAUNCH_X - 5) { s.ball.x = LAUNCH_X - 5 - BALL_R; s.ball.vx = -Math.abs(s.ball.vx) * DAMPEN; }
        if (s.ball.y - BALL_R < 10) { s.ball.y = 10 + BALL_R; s.ball.vy = Math.abs(s.ball.vy) * DAMPEN; }

        // Bumpers
        for (let i = 0; i < BUMPERS.length; i++) {
          const b = BUMPERS[i];
          const d = Math.hypot(s.ball.x - b.x, s.ball.y - b.y);
          if (d < BALL_R + b.r) {
            const nx2 = (s.ball.x - b.x) / d, ny2 = (s.ball.y - b.y) / d;
            const dot = s.ball.vx * nx2 + s.ball.vy * ny2;
            s.ball.vx = (s.ball.vx - 2 * dot * nx2) * 1.08 + nx2 * 2;
            s.ball.vy = (s.ball.vy - 2 * dot * ny2) * 1.08 + ny2 * 2;
            s.ball.x = b.x + nx2 * (BALL_R + b.r + 1);
            s.ball.y = b.y + ny2 * (BALL_R + b.r + 1);
            s.score += 100; s.scoreFlash = 30;
            s.bumperFlash[i] = 18;
            setUi(u => ({ ...u, score: s.score, highScore: Math.max(u.highScore, s.score) }));
          }
          if (s.bumperFlash[i] > 0) s.bumperFlash[i]--;
        }

        // Flippers
        const le = flipperEndL(s.lFlip), re = flipperEndR(s.rFlip);
        const lHit = segCircle(L_ANCHOR.x, L_ANCHOR.y, le.x, le.y, s.ball.x, s.ball.y, BALL_R + FLIPPER_W / 2);
        if (lHit) {
          const spd = Math.hypot(s.ball.vx, s.ball.vy);
          s.ball.vx = -lHit.nx * Math.max(spd * 1.1, 6);
          s.ball.vy = -lHit.ny * Math.max(spd * 1.1, 6) - (s.lFlip ? 5 : 0);
          s.ball.x += -lHit.nx * (BALL_R + FLIPPER_W / 2 - lHit.dist + 2);
          s.ball.y += -lHit.ny * (BALL_R + FLIPPER_W / 2 - lHit.dist + 2);
        }
        const rHit = segCircle(R_ANCHOR.x, R_ANCHOR.y, re.x, re.y, s.ball.x, s.ball.y, BALL_R + FLIPPER_W / 2);
        if (rHit) {
          const spd = Math.hypot(s.ball.vx, s.ball.vy);
          s.ball.vx = -rHit.nx * Math.max(spd * 1.1, 6);
          s.ball.vy = -rHit.ny * Math.max(spd * 1.1, 6) - (s.rFlip ? 5 : 0);
          s.ball.x += -rHit.nx * (BALL_R + FLIPPER_W / 2 - rHit.dist + 2);
          s.ball.y += -rHit.ny * (BALL_R + FLIPPER_W / 2 - rHit.dist + 2);
        }

        // Bottom drain
        if (s.ball.y > H + 20) {
          s.lives--;
          s.launched = false; s.ball.active = false;
          s.ball = { x: LAUNCH_X, y: H - 100, vx: 0, vy: 0, active: false };
          setUi(u => ({ ...u, lives: s.lives }));
          if (s.lives <= 0) { s.over = true; }
        }
      }
      if (s.scoreFlash > 0) s.scoreFlash--;

      // ===== DRAW =====
      // BG dark neon
      ctx.fillStyle = "#0f0720"; ctx.fillRect(0, 0, W, H);
      // Lane guides
      ctx.strokeStyle = "rgba(139,92,246,0.2)"; ctx.lineWidth = 1;
      for (let i = 20; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }

      // Walls
      ctx.strokeStyle = "#6d28d9"; ctx.lineWidth = 8; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(10, H); ctx.lineTo(10, 20); ctx.lineTo(LAUNCH_X, 20); ctx.lineTo(LAUNCH_X, H); ctx.stroke();
      // Launch rail
      ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(LAUNCH_X, H - 30); ctx.lineTo(LAUNCH_X, 20); ctx.stroke();

      // Bumpers
      for (let i = 0; i < BUMPERS.length; i++) {
        const b = BUMPERS[i], flash = s.bumperFlash[i] > 0;
        ctx.shadowColor = flash ? "#e879f9" : "#c026d3"; ctx.shadowBlur = flash ? 24 : 12;
        const gr = ctx.createRadialGradient(b.x - 4, b.y - 4, 2, b.x, b.y, b.r);
        gr.addColorStop(0, flash ? "#f0abfc" : "#c026d3");
        gr.addColorStop(1, flash ? "#c026d3" : "#6b21a8");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#e879f9"; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;
        if (flash) {
          ctx.fillStyle = "#fae8ff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("+100", b.x, b.y - b.r - 4);
        }
      }

      // Score flash
      if (s.scoreFlash > 0) {
        ctx.font = `bold ${16 + s.scoreFlash}px sans-serif`; ctx.fillStyle = `rgba(232,121,249,${s.scoreFlash / 30})`;
        ctx.textAlign = "center"; ctx.fillText(`${s.score}`, W / 2, 80);
      }

      // Flippers
      const drawFlipper = (ax: number, ay: number, ex: number, ey: number) => {
        ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = FLIPPER_W; ctx.lineCap = "round";
        ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.shadowBlur = 0;
      };
      const le = flipperEndL(s.lFlip), re = flipperEndR(s.rFlip);
      drawFlipper(L_ANCHOR.x, L_ANCHOR.y, le.x, le.y);
      drawFlipper(R_ANCHOR.x, R_ANCHOR.y, re.x, re.y);

      // Power bar (right side)
      if (s.charging || (!s.launched && !s.ball.active)) {
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(LAUNCH_X + 1, H - 110, 16, -s.power * 0.9);
        ctx.fillStyle = `hsl(${120 - s.power}, 90%, 55%)`; ctx.fillRect(LAUNCH_X + 3, H - 110, 12, -s.power * 0.9);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("SPACE", LAUNCH_X + 8, H - 120);
      }

      // Ball
      if (s.ball.active || !s.launched) {
        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 18;
        const bgBall = ctx.createRadialGradient(s.ball.x - 3, s.ball.y - 3, 1, s.ball.x, s.ball.y, BALL_R);
        bgBall.addColorStop(0, "#fde68a"); bgBall.addColorStop(1, "#d97706");
        ctx.fillStyle = bgBall; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "rgba(15,7,32,0.85)"; ctx.fillRect(0, 0, W, 32);
      ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#c084fc"; ctx.textAlign = "center";
      ctx.fillText(`⚡ ${s.score}   ❤️ ${s.lives}   🏆 ${s.highScore}`, W / 2, 22);

      // Controls hint
      ctx.font = "10px sans-serif"; ctx.fillStyle = "rgba(167,139,250,0.5)"; ctx.textAlign = "center";
      ctx.fillText("Z/← Flipper Trái  |  X/→ Flipper Phải  |  Space Launch", W / 2, H - 6);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = () => {
    const s = state.current;
    s.score = 0; s.lives = 3; s.over = false; s.launched = false; s.power = 0;
    s.ball = { x: LAUNCH_X, y: H - 100, vx: 0, vy: 0, active: false };
    setUi({ score: 0, highScore: s.highScore, lives: 3 });
  };

  return (
    <GameShell title="Pinball" emoji="⚙️" score={ui.score} highScore={ui.highScore} color="from-violet-500 to-purple-600">
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.4)] select-none">
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          {state.current.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-950/90">
              <div className="text-5xl">⚙️</div>
              <div className="font-black text-2xl text-purple-300 mt-2">GAME OVER</div>
              <div className="text-purple-400 text-xl font-bold">{ui.score} pts</div>
              <button onClick={reset} className="mt-4 px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full font-black text-lg shadow-lg">
                🔄 Play Again
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-violet-400">Z/← flipper trái • X/→ flipper phải • Space nạp lực</p>
      </div>
    </GameShell>
  );
}
