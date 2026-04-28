"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, PAD_W = 60, PAD_H = 10, BALL_R = 8;
const BRICK_COLS = 8, BRICK_ROWS = 5, BRICK_W = W / BRICK_COLS, BRICK_H = 20;

const BRICK_COLORS = ["bg-red-500","bg-orange-500","bg-yellow-400","bg-green-500","bg-blue-500"];
const CANVAS_COLORS = ["#ef4444","#f97316","#facc15","#22c55e","#3b82f6"];

function createBricks() {
  return Array.from({ length: BRICK_ROWS }, (_, r) =>
    Array.from({ length: BRICK_COLS }, (_, c) => ({ x: c * BRICK_W, y: 40 + r * (BRICK_H + 4), alive: true, color: CANVAS_COLORS[r] }))
  );
}

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    padX: W / 2 - PAD_W / 2,
    ball: { x: W / 2, y: H - 100, vx: 3, vy: -4 },
    bricks: createBricks(),
    score: 0, highScore: 0, lives: 3, running: false, dead: false, won: false,
    keys: {} as Record<string, boolean>, mouseX: W / 2,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, dead: false, running: false, lives: 3, won: false });

  const reset = useCallback(() => {
    const s = state.current;
    s.padX = W / 2 - PAD_W / 2; s.ball = { x: W / 2, y: H - 100, vx: 3, vy: -4 };
    s.bricks = createBricks(); s.score = 0; s.lives = 3; s.running = false; s.dead = false; s.won = false;
    setUi(u => ({ ...u, score: 0, dead: false, running: false, lives: 3, won: false }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      const s = state.current;
      if (s.running && !s.dead && !s.won) {
        // Move paddle
        if (s.keys["ArrowLeft"]) s.padX = Math.max(0, s.padX - 5);
        if (s.keys["ArrowRight"]) s.padX = Math.min(W - PAD_W, s.padX + 5);

        // Move ball
        const b = s.ball;
        b.x += b.vx; b.y += b.vy;

        // Wall bounce
        if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
        if (b.x + BALL_R > W) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); }
        if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

        // Fall out
        if (b.y + BALL_R > H) {
          s.lives--;
          setUi(u => ({ ...u, lives: s.lives }));
          if (s.lives <= 0) { s.dead = true; s.highScore = Math.max(s.highScore, s.score); setUi(u => ({ ...u, dead: true, highScore: s.highScore })); }
          else { b.x = W / 2; b.y = H - 100; b.vx = 3 * (Math.random() > 0.5 ? 1 : -1); b.vy = -4; }
        }

        // Paddle bounce
        if (b.y + BALL_R >= H - 50 && b.y + BALL_R < H - 40 && b.x > s.padX && b.x < s.padX + PAD_W) {
          b.vy = -Math.abs(b.vy);
          b.vx += ((b.x - (s.padX + PAD_W / 2)) / (PAD_W / 2)) * 2;
          b.vx = Math.max(-6, Math.min(6, b.vx));
        }

        // Brick hit
        for (const row of s.bricks) for (const brick of row) {
          if (!brick.alive) continue;
          if (b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + BRICK_W && b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + BRICK_H) {
            brick.alive = false; b.vy *= -1; s.score += 10;
            setUi(u => ({ ...u, score: s.score }));
          }
        }

        // Win check
        if (s.bricks.every(row => row.every(b => !b.alive))) { s.won = true; setUi(u => ({ ...u, won: true })); }
      }

      // Draw
      ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const row of s.bricks) for (const brick of row) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath(); ctx.roundRect(brick.x + 2, brick.y, BRICK_W - 4, BRICK_H - 2, 4); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.roundRect(brick.x + 2, brick.y, BRICK_W - 4, 4, [4, 4, 0, 0]); ctx.fill();
      }

      // Paddle
      const pg = ctx.createLinearGradient(s.padX, 0, s.padX + PAD_W, 0);
      pg.addColorStop(0, "#7c3aed"); pg.addColorStop(1, "#06b6d4");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.roundRect(s.padX, H - 50, PAD_W, PAD_H, 5); ctx.fill();

      // Ball
      const bg = ctx.createRadialGradient(s.ball.x - 2, s.ball.y - 2, 1, s.ball.x, s.ball.y, BALL_R);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(1, "#a855f7");
      ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 12;
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { state.current.keys[e.key] = true; if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); } };
    const ku = (e: KeyboardEvent) => { state.current.keys[e.key] = false; };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    state.current.padX = Math.max(0, Math.min(W - PAD_W, (e.clientX - rect.left) * scaleX - PAD_W / 2));
    if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); }
  };

  const handleTouch = (e: React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    state.current.padX = Math.max(0, Math.min(W - PAD_W, (e.touches[0].clientX - rect.left) * scaleX - PAD_W / 2));
    if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); }
  };

  return (
    <GameShell title="Bắn Gạch" emoji="🧱" score={ui.score} highScore={ui.highScore} color="from-teal-500 to-cyan-400">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 text-sm">{"❤️".repeat(ui.lives)}</div>
        <div className="relative rounded-2xl overflow-hidden border border-teal-500/30"
          onMouseMove={handleMouseMove} onTouchMove={handleTouch}>
          <canvas ref={canvasRef} width={W} height={H} className="block" style={{ maxWidth: "100%", maxHeight: "60vh" }} />
          {!ui.running && !ui.dead && !ui.won && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60" onClick={() => { state.current.running = true; setUi(u => ({ ...u, running: true })); }}>
              <div className="text-5xl mb-3">🧱</div>
              <div className="text-white font-black text-xl">BẮN GẠCH</div>
              <div className="text-gray-300 text-sm mt-2">Move mouse / touch to play</div>
            </div>
          )}
          {(ui.dead || ui.won) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="text-4xl mb-2">{ui.won ? "🏆" : "💀"}</div>
              <div className="text-white font-black text-xl">{ui.won ? "YOU WIN!" : "GAME OVER"}</div>
              <div className="text-gray-300 text-sm mt-1">Score: {ui.score}</div>
              <button onClick={reset} className="mt-3 px-6 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm">Chơi lại</button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Move mouse or touch to control paddle</p>
      </div>
    </GameShell>
  );
}
