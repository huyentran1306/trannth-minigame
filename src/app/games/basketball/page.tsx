"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, BALL_R = 14, GRAV = 0.42, HOOP_W = 52, HOOP_H = 6;
const BALL_START = { x: W / 2, y: H - 65 };

export default function Basketball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    ball: { ...BALL_START, vx: 0, vy: 0 },
    hoop: { x: W * 0.7, y: H * 0.35 },
    dragging: false, drag: { x: 0, y: 0 },
    flying: false, scored: false,
    score: 0, highScore: 0, shots: 5, level: 1,
    trail: [] as { x: number; y: number }[],
    scoreFlash: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, shots: 5, over: false });

  const nextHoop = useCallback((lv: number) => {
    const s = state.current;
    const margin = 40;
    s.hoop.x = margin + Math.random() * (W - margin * 2 - HOOP_W);
    s.hoop.y = H * 0.15 + Math.random() * H * (0.12 + lv * 0.03);
  }, []);

  useEffect(() => { nextHoop(1); }, [nextHoop]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const loop = () => {
      const s = state.current;
      if (s.flying) {
        s.ball.vx *= 0.995;
        s.ball.vy += GRAV;
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;
        s.trail.push({ x: s.ball.x, y: s.ball.y });
        if (s.trail.length > 20) s.trail.shift();

        if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx = Math.abs(s.ball.vx) * 0.7; }
        if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.vx = -Math.abs(s.ball.vx) * 0.7; }

        // Hoop score check
        const hx = s.hoop.x + HOOP_W / 2, hy = s.hoop.y;
        const inX = s.ball.x > s.hoop.x + BALL_R && s.ball.x < s.hoop.x + HOOP_W - BALL_R;
        const crossY = s.ball.y > hy && s.ball.y < hy + 16 && s.ball.vy > 0;
        if (inX && crossY && !s.scored) {
          s.scored = true; s.score++; s.scoreFlash = 30;
          setUi(u => ({ ...u, score: s.score, highScore: Math.max(u.highScore, s.score) }));
          setTimeout(() => {
            s.ball = { ...BALL_START, vx: 0, vy: 0 };
            s.flying = false; s.scored = false; s.trail = [];
            nextHoop(s.level);
          }, 400);
        }
        // Rim bounce
        const rim1 = { x: s.hoop.x, y: s.hoop.y };
        const rim2 = { x: s.hoop.x + HOOP_W, y: s.hoop.y };
        for (const rim of [rim1, rim2]) {
          const d = Math.hypot(s.ball.x - rim.x, s.ball.y - rim.y);
          if (d < BALL_R + 5) {
            const nx = (s.ball.x - rim.x) / d, ny = (s.ball.y - rim.y) / d;
            const dot = s.ball.vx * nx + s.ball.vy * ny;
            s.ball.vx = (s.ball.vx - 2 * dot * nx) * 0.55;
            s.ball.vy = (s.ball.vy - 2 * dot * ny) * 0.55;
            s.ball.x = rim.x + nx * (BALL_R + 6);
            s.ball.y = rim.y + ny * (BALL_R + 6);
          }
        }
        if (s.ball.y > H + 20) {
          s.shots--;
          setUi(u => ({ ...u, shots: s.shots }));
          s.ball = { ...BALL_START, vx: 0, vy: 0 };
          s.flying = false; s.trail = [];
          if (s.shots <= 0) setUi(u => ({ ...u, over: true }));
        }
      }
      if (s.scoreFlash > 0) s.scoreFlash--;

      // BG
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#fef3c7"); bg.addColorStop(1, "#fed7aa");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Floor
      ctx.fillStyle = "#b45309"; ctx.fillRect(0, H - 28, W, 28);
      ctx.fillStyle = "#92400e";
      for (let i = 0; i < W; i += 44) ctx.fillRect(i, H - 28, 2, 28);

      // Trail
      s.trail.forEach((p, i) => {
        const a = (i / s.trail.length) * 0.4;
        const r = BALL_R * (i / s.trail.length);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,146,60,${a})`; ctx.fill();
      });

      // Backboard
      ctx.fillStyle = "#f1f5f9"; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
      ctx.fillRect(s.hoop.x + HOOP_W + 2, s.hoop.y - 44, 10, 68);
      ctx.strokeRect(s.hoop.x + HOOP_W + 2, s.hoop.y - 44, 10, 68);
      // Inner box
      ctx.strokeRect(s.hoop.x + HOOP_W + 3, s.hoop.y - 14, 8, 22);

      // Hoop rim
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s.hoop.x, s.hoop.y); ctx.lineTo(s.hoop.x + HOOP_W, s.hoop.y); ctx.stroke();
      // Net
      ctx.strokeStyle = "rgba(200,200,200,0.8)"; ctx.lineWidth = 1.5;
      for (let i = 0; i <= 5; i++) {
        const nx = s.hoop.x + i * (HOOP_W / 5);
        ctx.beginPath(); ctx.moveTo(nx, s.hoop.y); ctx.lineTo(s.hoop.x + HOOP_W / 2 + (nx - s.hoop.x - HOOP_W / 2) * 0.5, s.hoop.y + 26); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(s.hoop.x + HOOP_W * 0.25, s.hoop.y + 26); ctx.lineTo(s.hoop.x + HOOP_W * 0.75, s.hoop.y + 26); ctx.stroke();

      // Score flash
      if (s.scoreFlash > 0) {
        ctx.font = `bold ${28 + s.scoreFlash}px sans-serif`; ctx.textAlign = "center";
        ctx.fillStyle = `rgba(34,197,94,${s.scoreFlash / 30})`;
        ctx.fillText("🎯 +1", s.hoop.x + HOOP_W / 2, s.hoop.y - 20);
      }

      // Aim arrow while dragging
      if (s.dragging && !s.flying) {
        const dx = BALL_START.x - s.drag.x, dy = BALL_START.y - s.drag.y;
        const ang = Math.atan2(dy, dx);
        const len = Math.min(Math.hypot(dx, dy), 110);
        ctx.save(); ctx.translate(BALL_START.x, BALL_START.y); ctx.rotate(ang);
        const gr = ctx.createLinearGradient(0, 0, len, 0);
        gr.addColorStop(0, "rgba(251,146,60,0.95)"); gr.addColorStop(1, "rgba(251,146,60,0)");
        ctx.strokeStyle = gr; ctx.lineWidth = 4; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        // Power indicator
        ctx.fillStyle = `rgba(251,146,60,${Math.min(len / 110, 1) * 0.8})`;
        ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`💪 ${Math.round((len / 110) * 100)}%`, BALL_START.x, BALL_START.y + 24);
      }

      // Ball
      if (!s.flying || s.scored) {
        const bg2 = ctx.createRadialGradient(s.ball.x - 5, s.ball.y - 5, 2, s.ball.x, s.ball.y, BALL_R);
        bg2.addColorStop(0, "#fde68a"); bg2.addColorStop(0.5, "#f97316"); bg2.addColorStop(1, "#c2410c");
        ctx.shadowColor = "#f97316"; ctx.shadowBlur = 12;
        ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        // Lines
        ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(s.ball.x - BALL_R, s.ball.y); ctx.lineTo(s.ball.x + BALL_R, s.ball.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R * 0.65, 0, Math.PI, false); ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (s.flying) {
        const bg2 = ctx.createRadialGradient(s.ball.x - 5, s.ball.y - 5, 2, s.ball.x, s.ball.y, BALL_R);
        bg2.addColorStop(0, "#fde68a"); bg2.addColorStop(0.5, "#f97316"); bg2.addColorStop(1, "#c2410c");
        ctx.shadowColor = "#f97316"; ctx.shadowBlur = 12;
        ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.font = "bold 18px sans-serif"; ctx.fillStyle = "#92400e"; ctx.textAlign = "center";
      ctx.fillText(`🏀 ${s.score}  ❤️ ${s.shots}`, W / 2, 28);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nextHoop]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.current.flying || ui.over) return;
    const p = getPos(e);
    if (Math.hypot(p.x - state.current.ball.x, p.y - state.current.ball.y) < 50) {
      state.current.dragging = true; state.current.drag = p;
    }
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!state.current.dragging) return;
    state.current.drag = getPos(e);
  };
  const onUp = () => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    const dx = BALL_START.x - s.drag.x, dy = BALL_START.y - s.drag.y;
    const len = Math.hypot(dx, dy);
    if (len < 15) return;
    const power = Math.min(len, 110) / 110;
    s.ball.vx = (dx / len) * power * 15;
    s.ball.vy = (dy / len) * power * 15;
    s.flying = true;
  };

  const reset = () => {
    const s = state.current;
    s.score = 0; s.shots = 5; s.flying = false; s.scored = false; s.trail = [];
    s.ball = { ...BALL_START, vx: 0, vy: 0 };
    setUi(u => ({ ...u, score: 0, shots: 5, over: false }));
    nextHoop(s.level);
  };

  return (
    <GameShell title="Ném Bóng" emoji="🏀" score={ui.score} highScore={ui.highScore} color="from-orange-400 to-red-400">
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 shadow-lg select-none"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          {ui.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(255,247,237,0.92)" }}>
              <div className="text-6xl mb-2">🏀</div>
              <div className="font-black text-2xl text-orange-600">Hết Lượt!</div>
              <div className="text-orange-500 text-xl font-bold mt-1">{ui.score} điểm</div>
              <button onClick={reset} className="mt-4 px-8 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-black text-lg shadow-lg">
                🔄 Chơi lại
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-orange-400">Kéo bóng rồi thả để ném vào rổ 🏀</p>
      </div>
    </GameShell>
  );
}
