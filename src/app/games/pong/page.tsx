"use client";
import { useRef, useEffect, useState } from "react";
import GameShell from "@/components/game-shell";

const W = 400, H = 500, PW = 10, PH = 70, BR = 8, SPEED = 4.5;

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    playerY: H / 2 - PH / 2, aiY: H / 2 - PH / 2,
    ball: { x: W / 2, y: H / 2, vx: SPEED, vy: SPEED * 0.7 },
    score: { p: 0, ai: 0 }, running: false, mouseY: H / 2, level: 1,
  });
  const [score, setScore] = useState({ p: 0, ai: 0 });
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(1);

  const resetBall = (dir: 1 | -1) => {
    state.current.ball = {
      x: W / 2, y: H / 2,
      vx: dir * SPEED,
      vy: (Math.random() * 2 - 1) * 3,
    };
  };

  const startGame = () => {
    state.current.score = { p: 0, ai: 0 };
    setScore({ p: 0, ai: 0 });
    resetBall(1);
    state.current.running = true;
    setRunning(true);
  };

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const aiSpeed = 1.8 + level * 0.7;

    const loop = () => {
      const s = state.current;
      if (s.running) {
        // Mouse/touch controls player (right paddle)
        s.playerY = Math.max(0, Math.min(H - PH, s.mouseY - PH / 2));
        // AI (left paddle) - tracks ball with lag
        const mid = s.aiY + PH / 2;
        if (mid < s.ball.y - 3) s.aiY = Math.min(H - PH, s.aiY + aiSpeed);
        else if (mid > s.ball.y + 3) s.aiY = Math.max(0, s.aiY - aiSpeed);

        // Move ball
        s.ball.x += s.ball.vx;
        s.ball.y += s.ball.vy;

        // Top/bottom walls
        if (s.ball.y - BR < 0) { s.ball.y = BR; s.ball.vy = Math.abs(s.ball.vy); }
        if (s.ball.y + BR > H) { s.ball.y = H - BR; s.ball.vy = -Math.abs(s.ball.vy); }

        // Right paddle (player)
        if (s.ball.x + BR > W - PW - 4 && s.ball.x + BR < W && s.ball.y > s.playerY && s.ball.y < s.playerY + PH) {
          s.ball.vx = -Math.abs(s.ball.vx) * 1.04;
          s.ball.vy += ((s.ball.y - (s.playerY + PH / 2)) / (PH / 2)) * 2.5;
          s.ball.vx = Math.max(-14, Math.min(-SPEED, s.ball.vx));
        }
        // Left paddle (ai)
        if (s.ball.x - BR < PW + 4 && s.ball.x - BR > 0 && s.ball.y > s.aiY && s.ball.y < s.aiY + PH) {
          s.ball.vx = Math.abs(s.ball.vx) * 1.04;
          s.ball.vy += ((s.ball.y - (s.aiY + PH / 2)) / (PH / 2)) * 2.5;
          s.ball.vx = Math.min(14, Math.max(SPEED, s.ball.vx));
        }

        // Scoring
        if (s.ball.x + BR > W) {
          s.score.ai++;
          setScore({ ...s.score });
          resetBall(-1);
        }
        if (s.ball.x - BR < 0) {
          s.score.p++;
          setScore({ ...s.score });
          resetBall(1);
        }
      }

      // Draw — pastel court
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#f5f3ff"); bg.addColorStop(1, "#ede9fe");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(139,92,246,0.2)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);

      // Score
      ctx.font = "bold 56px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(139,92,246,0.2)";
      ctx.fillText(s.score.ai.toString(), W / 4, 70);
      ctx.fillText(s.score.p.toString(), (3 * W) / 4, 70);

      // AI paddle (left) — pink
      const ag = ctx.createLinearGradient(0, s.aiY, 0, s.aiY + PH);
      ag.addColorStop(0, "#f9a8d4"); ag.addColorStop(1, "#ec4899");
      ctx.fillStyle = ag; ctx.shadowColor = "#ec4899"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(4, s.aiY, PW, PH, 5); ctx.fill();

      // Player paddle (right) — violet
      const pg = ctx.createLinearGradient(0, s.playerY, 0, s.playerY + PH);
      pg.addColorStop(0, "#c4b5fd"); pg.addColorStop(1, "#7c3aed");
      ctx.fillStyle = pg; ctx.shadowColor = "#7c3aed"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(W - PW - 4, s.playerY, PW, PH, 5); ctx.fill();

      // Ball
      const ballG = ctx.createRadialGradient(s.ball.x - 3, s.ball.y - 3, 1, s.ball.x, s.ball.y, BR);
      ballG.addColorStop(0, "#fff"); ballG.addColorStop(1, "#a78bfa");
      ctx.fillStyle = ballG; ctx.shadowColor = "#8b5cf6"; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Labels
      ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(236,72,153,0.6)"; ctx.fillText("AI", W / 4, H - 10);
      ctx.fillStyle = "rgba(124,58,237,0.6)"; ctx.fillText("YOU", (3 * W) / 4, H - 10);

      if (!s.running) {
        ctx.fillStyle = "rgba(237,233,254,0.88)"; ctx.fillRect(0, 0, W, H);
        ctx.font = "bold 52px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#6d28d9";
        ctx.fillText("🏓", W / 2, H / 2 - 40);
        ctx.font = "bold 24px sans-serif"; ctx.fillStyle = "#7c3aed";
        ctx.fillText("PONG", W / 2, H / 2);
        ctx.font = "14px sans-serif"; ctx.fillStyle = "#a78bfa";
        ctx.fillText("Di chuột để điều khiển vợt phải", W / 2, H / 2 + 36);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [level]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    state.current.mouseY = (e.clientY - rect.top) * (H / rect.height);
  };
  const handleTouch = (e: React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    state.current.mouseY = (e.touches[0].clientY - rect.top) * (H / rect.height);
  };

  return (
    <GameShell title="Pong" emoji="🏓" score={score.p} color="from-violet-400 to-pink-400">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-violet-500 font-semibold">AI Level:</span>
          {[1, 2, 3, 4, 5].map(l => (
            <button key={l} onClick={() => { setLevel(l); state.current.level = l; }}
              className={`w-8 h-8 rounded-full font-black text-sm border-2 transition-all ${level === l ? "bg-violet-400 text-white border-violet-400" : "bg-white text-violet-400 border-violet-200"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative rounded-2xl overflow-hidden border-2 border-violet-200 shadow-lg cursor-none select-none"
          onMouseMove={handleMouse} onTouchMove={handleTouch}>
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          {!running && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={startGame}
                className="px-8 py-3 bg-gradient-to-r from-violet-400 to-pink-400 text-white rounded-full font-black text-xl shadow-xl hover:scale-105 transition-transform">
                ▶ BẮT ĐẦU
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-4 text-sm text-violet-500 font-semibold">
          <span>🤖 AI: {score.ai}</span>
          <span>vs</span>
          <span>🧑 Bạn: {score.p}</span>
        </div>
        <p className="text-xs text-violet-400">Di chuột / chạm màn hình để điều khiển vợt</p>
      </div>
    </GameShell>
  );
}
