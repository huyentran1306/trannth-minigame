"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, BALL_R = 14, GRAV = 0.42, HOOP_W = 52, HOOP_H = 6;
const BALL_START = { x: W / 2, y: H - 70 };

export default function Basketball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    ball: { ...BALL_START, vx: 0, vy: 0 },
    hoop: { x: W * 0.65, y: H * 0.3 },
    flying: false, scored: false,
    aimX: -1, aimY: -1, pressing: false,
    score: 0, highScore: 0, shots: 5, level: 1,
    trail: [] as { x: number; y: number }[],
    scoreFlash: 0, levelUp: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, shots: 5, level: 1, over: false });

  const nextHoop = useCallback((lv: number) => {
    const s = state.current;
    const margin = 50;
    s.hoop.x = margin + Math.random() * (W - margin * 2 - HOOP_W);
    s.hoop.y = H * 0.12 + Math.random() * H * (0.1 + lv * 0.04);
  }, []);

  useEffect(() => { nextHoop(1); }, [nextHoop]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const loop = () => {
      const s = state.current;

      if (s.flying) {
        s.ball.vx *= 0.997;
        s.ball.vy += GRAV;
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;
        s.trail.push({ x: s.ball.x, y: s.ball.y });
        if (s.trail.length > 18) s.trail.shift();

        if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx = Math.abs(s.ball.vx) * 0.65; }
        if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.vx = -Math.abs(s.ball.vx) * 0.65; }

        const hx = s.hoop.x + HOOP_W / 2;
        const inX = s.ball.x > s.hoop.x + BALL_R * 0.8 && s.ball.x < s.hoop.x + HOOP_W - BALL_R * 0.8;
        const crossY = s.ball.y > s.hoop.y && s.ball.y < s.hoop.y + 14 && s.ball.vy > 0;
        if (inX && crossY && !s.scored) {
          s.scored = true; s.score++;
          if (s.score > 0 && s.score % 3 === 0) { s.level++; s.levelUp = 90; }
          s.scoreFlash = 40;
          setUi(u => ({ ...u, score: s.score, level: s.level, highScore: Math.max(u.highScore, s.score) }));
          setTimeout(() => {
            s.ball = { ...BALL_START, vx: 0, vy: 0 };
            s.flying = false; s.scored = false; s.trail = [];
            s.aimX = -1; s.aimY = -1;
            nextHoop(s.level);
          }, 450);
        }

        const rim1 = { x: s.hoop.x, y: s.hoop.y };
        const rim2 = { x: s.hoop.x + HOOP_W, y: s.hoop.y };
        for (const rim of [rim1, rim2]) {
          const d = Math.hypot(s.ball.x - rim.x, s.ball.y - rim.y);
          if (d < BALL_R + 5) {
            const nx = (s.ball.x - rim.x) / d, ny = (s.ball.y - rim.y) / d;
            const dot = s.ball.vx * nx + s.ball.vy * ny;
            s.ball.vx = (s.ball.vx - 2 * dot * nx) * 0.52;
            s.ball.vy = (s.ball.vy - 2 * dot * ny) * 0.52;
            s.ball.x = rim.x + nx * (BALL_R + 6);
            s.ball.y = rim.y + ny * (BALL_R + 6);
          }
        }

        if (s.ball.y > H + 30) {
          s.shots--;
          setUi(u => ({ ...u, shots: s.shots }));
          s.ball = { ...BALL_START, vx: 0, vy: 0 };
          s.flying = false; s.trail = [];
          s.aimX = -1; s.aimY = -1;
          if (s.shots <= 0) setUi(u => ({ ...u, over: true }));
        }
      }
      if (s.scoreFlash > 0) s.scoreFlash--;
      if (s.levelUp > 0) s.levelUp--;

      // === DRAW ===
      // Beautiful court BG
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(0.5, "#312e81"); bg.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Court lines
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W / 2, H - 40, 60, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();

      // Floor wood planks
      for (let y = H - 30; y < H; y += 10) {
        ctx.fillStyle = y % 20 === 0 ? "#b45309" : "#a16207";
        ctx.fillRect(0, y, W, 10);
      }
      ctx.strokeStyle = "#92400e40"; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, H - 30); ctx.lineTo(x, H); ctx.stroke(); }

      // Goal hoop backboard
      const bx = s.hoop.x + HOOP_W / 2;
      ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx - 32, s.hoop.y - 52, 64, 44, 4); ctx.fill(); ctx.stroke();
      // Net
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(s.hoop.x + (HOOP_W / 5) * i, s.hoop.y);
        ctx.lineTo(s.hoop.x + (HOOP_W / 5) * i + 4, s.hoop.y + 28);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(s.hoop.x, s.hoop.y + 28); ctx.lineTo(s.hoop.x + HOOP_W, s.hoop.y + 28); ctx.stroke();
      // Hoop (bright orange)
      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 4;
      ctx.shadowColor = "#f97316"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(s.hoop.x, s.hoop.y); ctx.lineTo(s.hoop.x + HOOP_W, s.hoop.y); ctx.stroke();
      ctx.shadowBlur = 0;
      // Rim dots
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(s.hoop.x, s.hoop.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(s.hoop.x + HOOP_W, s.hoop.y, 4, 0, Math.PI * 2); ctx.fill();

      // Aim line (when pressing)
      if (s.pressing && !s.flying && s.aimX > 0) {
        const dx = s.aimX - BALL_START.x, dy = s.aimY - BALL_START.y;
        const len = Math.hypot(dx, dy);
        if (len > 10) {
          const nx = dx / len, ny = dy / len;
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "rgba(251,191,36,0.6)"; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(BALL_START.x, BALL_START.y);
          ctx.lineTo(BALL_START.x + nx * 80, BALL_START.y + ny * 80);
          ctx.stroke();
          ctx.setLineDash([]);
          // Arrow
          ctx.fillStyle = "rgba(251,191,36,0.8)";
          ctx.beginPath();
          const ax = BALL_START.x + nx * 80, ay = BALL_START.y + ny * 80;
          const perp = { x: -ny * 6, y: nx * 6 };
          ctx.moveTo(ax + nx * 10, ay + ny * 10);
          ctx.lineTo(ax + perp.x, ay + perp.y);
          ctx.lineTo(ax - perp.x, ay - perp.y);
          ctx.closePath(); ctx.fill();
        }
      }

      // Trail
      s.trail.forEach((p, i) => {
        const a = (i / s.trail.length) * 0.5;
        const r = BALL_R * (i / s.trail.length) * 0.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,146,60,${a})`; ctx.fill();
      });

      // Ball
      if (!s.flying) {
        // Idle pulse shadow
        ctx.shadowColor = "#f97316"; ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.005) * 4;
      }
      const bg2 = ctx.createRadialGradient(s.ball.x - 4, s.ball.y - 4, 2, s.ball.x, s.ball.y, BALL_R);
      bg2.addColorStop(0, "#fde68a"); bg2.addColorStop(0.5, "#f97316"); bg2.addColorStop(1, "#c2410c");
      ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      // Lines
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(s.ball.x - BALL_R, s.ball.y); ctx.lineTo(s.ball.x + BALL_R, s.ball.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R * 0.65, 0, Math.PI, false); ctx.stroke();

      // Score flash
      if (s.scoreFlash > 0) {
        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 20;
        ctx.font = `bold ${20 + s.scoreFlash / 4}px sans-serif`;
        ctx.fillStyle = `rgba(251,191,36,${s.scoreFlash / 40})`;
        ctx.textAlign = "center";
        ctx.fillText("🏀 SCORE!", W / 2, H / 2 - 30);
        ctx.shadowBlur = 0;
      }

      // Level up flash
      if (s.levelUp > 0) {
        const a = Math.min(1, s.levelUp / 30);
        ctx.font = "bold 28px sans-serif";
        ctx.fillStyle = `rgba(52,211,153,${a})`;
        ctx.textAlign = "center";
        ctx.shadowColor = "#34d399"; ctx.shadowBlur = 20;
        ctx.fillText(`⬆️ LEVEL ${s.level}!`, W / 2, H / 2 - 60);
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.roundRect(W / 2 - 70, 6, 140, 28, 8); ctx.fill();
      ctx.font = "bold 14px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
      ctx.fillText(`🏀 ${s.score}  ❤️ ${s.shots}  Lv${s.level}`, W / 2, 24);

      if (!s.flying) {
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Chạm để ném bóng 🏀", W / 2, H - 38);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nextHoop]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? (e.touches[0] || e.changedTouches[0]).clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e.touches[0] || e.changedTouches[0]).clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * (W / rect.width), y: (clientY - rect.top) * (H / rect.height) };
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state.current.flying || ui.over) return;
    const pos = getPos(e as unknown as React.MouseEvent);
    state.current.pressing = true;
    state.current.aimX = pos.x;
    state.current.aimY = pos.y;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!state.current.pressing) return;
    const pos = getPos(e as unknown as React.MouseEvent);
    state.current.aimX = pos.x;
    state.current.aimY = pos.y;
  };
  const onUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const s = state.current;
    if (!s.pressing || s.flying) return;
    s.pressing = false;
    // Shoot from BALL_START toward aimX/aimY
    const dx = s.aimX - BALL_START.x, dy = s.aimY - BALL_START.y;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;
    const power = Math.min(len / 110, 1) * 0.9 + 0.3;
    s.ball.vx = (dx / len) * power * 14;
    s.ball.vy = (dy / len) * power * 14;
    s.flying = true;
  };

  const reset = () => {
    const s = state.current;
    s.score = 0; s.shots = 5; s.level = 1; s.flying = false; s.scored = false; s.trail = [];
    s.ball = { ...BALL_START, vx: 0, vy: 0 };
    s.aimX = -1; s.aimY = -1; s.pressing = false;
    setUi({ score: 0, shots: 5, level: 1, highScore: ui.highScore, over: false });
    nextHoop(1);
  };

  return (
    <GameShell title="Ném Bóng Rổ" emoji="🏀" score={ui.score} highScore={ui.highScore} color="from-orange-500 to-red-500">
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl select-none"
          style={{ touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "65vh", display: "block" }} />
          {ui.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(15,7,36,0.92)" }}>
              <div className="text-6xl mb-3">🏀</div>
              <div className="font-black text-2xl text-orange-400">Hết Lượt!</div>
              <div className="text-white text-xl font-bold mt-1">{ui.score} điểm</div>
              <div className="text-yellow-400 text-sm mt-1">Level {ui.level}</div>
              <button onClick={reset} className="mt-5 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-black text-lg shadow-lg active:scale-95 transition-transform">
                🔄 Chơi lại
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-orange-300 opacity-70">Chạm và kéo để ngắm • thả để ném 🏀</p>
      </div>
    </GameShell>
  );
}
