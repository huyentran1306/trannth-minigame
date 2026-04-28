"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const CELL = 20;
const MAZE_W = 15, MAZE_H = 15;

// 1 = wall, 0 = dot, 2 = empty, 3 = power pellet
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,3,1,1,0,1,1,0,1,1,0,1,1,3,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,2,2,2,1,0,1,1,0,1],
  [1,0,0,0,0,2,2,2,2,2,0,0,0,0,1],
  [1,1,1,1,0,1,1,2,1,1,0,1,1,1,1],
  [2,2,2,1,0,2,2,2,2,2,0,1,2,2,2],
  [1,1,1,1,0,1,2,2,2,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,2,2,2,1,0,1,1,0,1],
  [1,3,0,0,0,0,1,0,1,0,0,0,0,3,1],
  [1,1,0,1,1,0,0,0,0,0,1,1,0,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

type Dir = [number, number];
const DIRS: Record<string, Dir> = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] };

export default function PacMan() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    pac: { r: 7, c: 7, dir: [0, 1] as Dir, nextDir: [0, 1] as Dir, frame: 0 },
    ghosts: [
      { r: 5, c: 6, color: "#ef4444", dir: [0, 1] as Dir },
      { r: 5, c: 8, color: "#f97316", dir: [0, -1] as Dir },
    ],
    maze: MAZE_TEMPLATE.map(row => [...row]),
    dots: 0, score: 0, highScore: 0, lives: 3, running: false, dead: false,
    power: false, powerTimer: 0, keys: {} as Record<string, boolean>, gameFrame: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, dead: false, running: false, lives: 3 });

  const countDots = (maze: number[][]) => maze.flat().filter(v => v === 0 || v === 3).length;

  const reset = useCallback(() => {
    const s = state.current;
    s.pac = { r: 7, c: 7, dir: [0, 1], nextDir: [0, 1], frame: 0 };
    s.ghosts = [{ r: 5, c: 6, color: "#ef4444", dir: [0, 1] }, { r: 5, c: 8, color: "#f97316", dir: [0, -1] }];
    s.maze = MAZE_TEMPLATE.map(row => [...row]);
    s.score = 0; s.lives = 3; s.running = false; s.dead = false; s.power = false; s.gameFrame = 0;
    setUi(u => ({ ...u, score: 0, dead: false, running: false, lives: 3 }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const moveEntity = (r: number, c: number, dir: Dir, maze: number[][]): [number, number] => {
      const nr = (r + dir[0] + MAZE_H) % MAZE_H;
      const nc = (c + dir[1] + MAZE_W) % MAZE_W;
      return maze[nr][nc] !== 1 ? [nr, nc] : [r, c];
    };

    const loop = () => {
      const s = state.current;
      if (s.running && !s.dead) {
        s.gameFrame++;
        // Move pac every 6 frames
        if (s.gameFrame % 6 === 0) {
          const { pac, maze } = s;
          // Try next dir first
          const [tnr, tnc] = moveEntity(pac.r, pac.c, pac.nextDir, maze);
          if (tnr !== pac.r || tnc !== pac.c) { pac.dir = pac.nextDir; pac.r = tnr; pac.c = tnc; }
          else { const [nr, nc] = moveEntity(pac.r, pac.c, pac.dir, maze); pac.r = nr; pac.c = nc; }

          // Eat dot
          if (maze[pac.r][pac.c] === 0) { maze[pac.r][pac.c] = 2; s.score += 10; setUi(u => ({ ...u, score: s.score })); }
          if (maze[pac.r][pac.c] === 3) { maze[pac.r][pac.c] = 2; s.score += 50; s.power = true; s.powerTimer = 50; setUi(u => ({ ...u, score: s.score })); }
          if (s.power) { s.powerTimer--; if (s.powerTimer <= 0) s.power = false; }
        }

        // Move ghosts every 10 frames
        if (s.gameFrame % 10 === 0) {
          for (const g of s.ghosts) {
            const dirs: Dir[] = [[-1,0],[1,0],[0,-1],[0,1]];
            const valid = dirs.filter(d => {
              const [nr, nc] = moveEntity(g.r, g.c, d, s.maze);
              return (nr !== g.r || nc !== g.c) && !(d[0] === -g.dir[0] && d[1] === -g.dir[1]);
            });
            const chosen = valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : ([-g.dir[0], -g.dir[1]] as Dir);
            g.dir = chosen;
            const [nr, nc] = moveEntity(g.r, g.c, chosen, s.maze);
            g.r = nr; g.c = nc;

            // Ghost eats pac
            if (g.r === s.pac.r && g.c === s.pac.c) {
              if (s.power) { g.r = 5; g.c = 7; s.score += 200; setUi(u => ({ ...u, score: s.score })); }
              else {
                s.lives--; setUi(u => ({ ...u, lives: s.lives }));
                if (s.lives <= 0) { s.dead = true; s.highScore = Math.max(s.highScore, s.score); setUi(u => ({ ...u, dead: true, highScore: s.highScore })); }
                else { s.pac.r = 7; s.pac.c = 7; }
              }
            }
          }
        }
      }

      // Draw
      const W = MAZE_W * CELL, H = MAZE_H * CELL;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

      for (let r = 0; r < MAZE_H; r++) for (let c = 0; c < MAZE_W; c++) {
        const x = c * CELL, y = r * CELL, v = state.current.maze[r][c];
        if (v === 1) {
          ctx.fillStyle = "#1e40af";
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(x + 1, y + 1, CELL - 2, 2);
        } else if (v === 0) {
          ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(x + CELL/2, y + CELL/2, 2.5, 0, Math.PI*2); ctx.fill();
        } else if (v === 3) {
          ctx.fillStyle = "#f0fdf4"; ctx.beginPath(); ctx.arc(x + CELL/2, y + CELL/2, 6, 0, Math.PI*2); ctx.fill();
        }
      }

      // Pac-Man
            const mouthAngle = 0.25 + Math.sin(s.gameFrame * 0.3) * 0.2;
      const angle = s.pac.dir[1] === 1 ? 0 : s.pac.dir[1] === -1 ? Math.PI : s.pac.dir[0] === -1 ? -Math.PI/2 : Math.PI/2;
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15"; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s.pac.c * CELL + CELL/2, s.pac.r * CELL + CELL/2);
      ctx.arc(s.pac.c * CELL + CELL/2, s.pac.r * CELL + CELL/2, CELL/2 - 2, angle + mouthAngle, angle + Math.PI*2 - mouthAngle);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Ghosts
      for (const g of s.ghosts) {
        ctx.fillStyle = s.power ? "#93c5fd" : g.color;
        ctx.shadowColor = s.power ? "#93c5fd" : g.color; ctx.shadowBlur = 6;
        const gx = g.c * CELL + CELL/2, gy = g.r * CELL + CELL/2;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, CELL/2 - 2, Math.PI, 0);
        ctx.lineTo(gx + CELL/2 - 2, gy + CELL/2 - 2);
        for (let i = 3; i >= 0; i--) ctx.lineTo(gx + (CELL/2 - 2) * (1 - i * 0.5), gy + CELL/2 - 2 - (i % 2 === 0 ? 4 : 0));
        ctx.lineTo(gx - CELL/2 + 2, gy + CELL/2 - 2);
        ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = "white"; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(gx - 3, gy - 4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 3, gy - 4, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#1e40af";
        ctx.beginPath(); ctx.arc(gx - 2, gy - 4, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 4, gy - 4, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      state.current.keys[e.key] = true;
      if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); }
      const map: Record<string, Dir> = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
      if (map[e.key]) { e.preventDefault(); state.current.pac.nextDir = map[e.key]; }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  const swipe = (dir: Dir) => {
    state.current.pac.nextDir = dir;
    if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); }
  };

  return (
    <GameShell title="Ăn Điểm" emoji="👾" score={ui.score} highScore={ui.highScore} color="from-indigo-500 to-violet-400">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 text-sm">{"❤️".repeat(ui.lives)}</div>
        <div className="relative rounded-xl overflow-hidden border border-indigo-500/30">
          <canvas ref={canvasRef} width={MAZE_W * CELL} height={MAZE_H * CELL} className="block" style={{ maxWidth: "90vw", maxHeight: "55vh", imageRendering: "pixelated" }} />
          {!ui.running && !ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 cursor-pointer"
              onClick={() => { state.current.running = true; setUi(u => ({ ...u, running: true })); }}>
              <div className="text-5xl mb-2">👾</div>
              <div className="text-yellow-400 font-black text-xl">PAC-MAN</div>
              <div className="text-gray-300 text-sm mt-2">Tap / Arrow keys</div>
            </div>
          )}
          {ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-white font-black text-xl">GAME OVER</div>
              <button onClick={reset} className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Chơi lại</button>
            </div>
          )}
        </div>
        {/* D-pad */}
        <div className="grid grid-cols-3 gap-1.5 md:hidden">
          {[["", [-1,0], "↑", ""],["[0,-1]", [0,-1], "←", ""], ["", [1,0], "↓", ""],["", [0,1], "→", ""]].map((_,i) => null)}
          <div />
          <button onPointerDown={() => swipe([-1,0])} className="w-12 h-12 bg-indigo-900/60 rounded-xl text-white font-bold flex items-center justify-center active:bg-indigo-700">↑</button>
          <div />
          <button onPointerDown={() => swipe([0,-1])} className="w-12 h-12 bg-indigo-900/60 rounded-xl text-white font-bold flex items-center justify-center active:bg-indigo-700">←</button>
          <button onPointerDown={() => swipe([1,0])} className="w-12 h-12 bg-indigo-900/60 rounded-xl text-white font-bold flex items-center justify-center active:bg-indigo-700">↓</button>
          <button onPointerDown={() => swipe([0,1])} className="w-12 h-12 bg-indigo-900/60 rounded-xl text-white font-bold flex items-center justify-center active:bg-indigo-700">→</button>
        </div>
      </div>
    </GameShell>
  );
}
