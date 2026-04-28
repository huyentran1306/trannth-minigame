"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, BIRD_X = 60, BIRD_R = 16, GRAVITY = 0.5, JUMP = -9;
const PIPE_W = 50, PIPE_GAP = 130, PIPE_SPEED = 2.5, PIPE_INTERVAL = 90;

interface Pipe { x: number; topH: number; scored: boolean; }

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    birdY: H / 2, birdVY: 0, pipes: [] as Pipe[], score: 0,
    frame: 0, running: false, dead: false, highScore: 0,
  });
  const [display, setDisplay] = useState({ score: 0, highScore: 0, dead: false, running: false });
  const rafRef = useRef<number>(0);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.dead) { /* reset on tap */ return; }
    if (!s.running) { s.running = true; setDisplay(d => ({ ...d, running: true })); }
    s.birdVY = JUMP;
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.birdY = H / 2; s.birdVY = 0; s.pipes = []; s.score = 0; s.frame = 0; s.running = false; s.dead = false;
    setDisplay(d => ({ ...d, score: 0, dead: false, running: false }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      const s = stateRef.current;
      if (s.running && !s.dead) {
        s.frame++;
        s.birdVY += GRAVITY;
        s.birdY += s.birdVY;

        // Spawn pipes
        if (s.frame % PIPE_INTERVAL === 0) {
          const topH = 60 + Math.random() * (H - PIPE_GAP - 120);
          s.pipes.push({ x: W, topH, scored: false });
        }
        // Move pipes
        for (const p of s.pipes) {
          p.x -= PIPE_SPEED;
          if (!p.scored && p.x + PIPE_W < BIRD_X) {
            p.scored = true; s.score++;
            setDisplay(d => ({ ...d, score: s.score }));
          }
        }
        s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0);

        // Collision
        const hit = s.birdY - BIRD_R < 0 || s.birdY + BIRD_R > H ||
          s.pipes.some(p => BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W &&
            (s.birdY - BIRD_R < p.topH || s.birdY + BIRD_R > p.topH + PIPE_GAP));
        if (hit) {
          s.dead = true;
          s.highScore = Math.max(s.highScore, s.score);
          setDisplay(d => ({ ...d, dead: true, highScore: s.highScore }));
        }
      }

      // Draw
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.arc((i * 73 + s.frame) % W, (i * 47) % H, 1, 0, Math.PI * 2); ctx.fill(); }

      // Pipes
      for (const p of s.pipes) {
        const gr1 = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        gr1.addColorStop(0, "#16a34a"); gr1.addColorStop(1, "#4ade80");
        ctx.fillStyle = gr1;
        ctx.beginPath(); ctx.roundRect(p.x, 0, PIPE_W, p.topH, [0, 0, 8, 8]); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x, p.topH + PIPE_GAP, PIPE_W, H - p.topH - PIPE_GAP, [8, 8, 0, 0]); ctx.fill();
        // Cap
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.roundRect(p.x - 4, p.topH - 16, PIPE_W + 8, 16, 4); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x - 4, p.topH + PIPE_GAP, PIPE_W + 8, 16, 4); ctx.fill();
      }

      // Bird
      const bx = BIRD_X, by = s.birdY;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.min(Math.max(s.birdVY * 0.05, -0.5), 0.8));
      ctx.font = "28px serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🐦", 0, 0);
      ctx.restore();

      // Ground
      ctx.fillStyle = "#1e3a1a";
      ctx.fillRect(0, H - 20, W, 20);

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
    <GameShell title="Chim Bay" emoji="🐦" score={display.score} highScore={display.highScore} color="from-sky-500 to-blue-400">
      <div className="flex flex-col items-center gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 cursor-pointer"
          onClick={() => { if (display.dead) reset(); else jump(); }}>
          <canvas ref={canvasRef} width={W} height={H} className="block" style={{ maxWidth: "100%", maxHeight: "60vh" }} />
          {!display.running && !display.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <div className="text-6xl mb-4">🐦</div>
              <div className="text-white font-black text-2xl">Chim Bay</div>
              <div className="text-gray-300 text-sm mt-2">Tap / Space to start</div>
            </div>
          )}
          {display.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-white font-black text-xl">GAME OVER</div>
              <div className="text-gray-300 text-sm mt-1">Score: {display.score}</div>
              <div className="text-yellow-400 text-sm">Best: {display.highScore}</div>
              <div className="mt-4 text-gray-400 text-xs">Tap to retry</div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Tap screen or press Space to flap</p>
      </div>
    </GameShell>
  );
}
