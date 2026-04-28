"use client";
import { useRef, useEffect, useState } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 480, COLS = 10, ROWS = 8, R = 14;
const COLORS = ["#f87171","#fb923c","#facc15","#4ade80","#60a5fa","#a78bfa","#f472b6"];
const EMPTY = "";

type Bubble = string; // color hex or ""

function mkGrid(): Bubble[][] {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => (row < 5 && (row + col) % 9 !== 0 ? COLORS[Math.floor(Math.random() * 5)] : EMPTY))
  );
}

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const bx = (col: number, row: number) => R + col * (R * 2 + 1) + (row % 2 === 1 ? R : 0);
  const by = (row: number) => R + row * (R * 1.72);

  const state = useRef({
    grid: mkGrid(),
    cur: COLORS[Math.floor(Math.random() * 5)],
    next: COLORS[Math.floor(Math.random() * 5)],
    ball: { x: W / 2, y: H - 48, vx: 0, vy: 0, color: EMPTY, active: false },
    angle: -Math.PI / 2,
    score: 0, highScore: 0,
    lives: 5, shots: 0,
    msg: "", msgTimer: 0,
    over: false,
  });

  useEffect(() => {
    const s = state.current;
    s.ball.color = s.cur;
  }, []);

  const popBubbles = (grid: Bubble[][], startR: number, startC: number) => {
    const color = grid[startR]?.[startC];
    if (!color) return 0;
    const visited = new Set<string>();
    const queue = [[startR, startC]];
    visited.add(`${startR},${startC}`);
    while (queue.length) {
      const [r, c] = queue.shift()!;
      const neighbors = r % 2 === 0
        ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
        : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
      for (const [dr, dc] of neighbors) {
        const nr = r + dr, nc = c + dc;
        const key = `${nr},${nc}`;
        if (!visited.has(key) && nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === color) {
          visited.add(key); queue.push([nr, nc]);
        }
      }
    }
    if (visited.size >= 3) {
      visited.forEach(k => { const [r, c] = k.split(",").map(Number); grid[r][c] = EMPTY; });
      return visited.size;
    }
    return 0;
  };

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const drawBubble = (x: number, y: number, color: string, glow = false) => {
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
      const gr = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, 1, x, y, R);
      gr.addColorStop(0, "rgba(255,255,255,0.7)"); gr.addColorStop(0.5, color); gr.addColorStop(1, color + "bb");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R - 1, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      const s = state.current;

      if (s.ball.active) {
        s.ball.x += s.ball.vx; s.ball.y += s.ball.vy;
        if (s.ball.x - R < 0) { s.ball.x = R; s.ball.vx = Math.abs(s.ball.vx); }
        if (s.ball.x + R > W) { s.ball.x = W - R; s.ball.vx = -Math.abs(s.ball.vx); }
        if (s.ball.y < 0) s.ball.vy = Math.abs(s.ball.vy);

        // Check collision with grid
        let hit = false;
        for (let row = 0; row < ROWS && !hit; row++) {
          for (let col = 0; col < COLS && !hit; col++) {
            if (!s.grid[row][col]) continue;
            const bX = bx(col, row), bY = by(row);
            if (Math.hypot(s.ball.x - bX, s.ball.y - bY) < R * 2.1) {
              hit = true;
              // Find snap position
              let bestR = -1, bestC = -1, bestD = Infinity;
              for (let r2 = 0; r2 < ROWS; r2++) for (let c2 = 0; c2 < COLS; c2++) {
                if (s.grid[r2][c2]) continue;
                const d = Math.hypot(s.ball.x - bx(c2, r2), s.ball.y - by(r2));
                if (d < bestD) { bestD = d; bestR = r2; bestC = c2; }
              }
              if (bestR >= 0 && bestC >= 0) {
                s.grid[bestR][bestC] = s.ball.color;
                const popped = popBubbles(s.grid, bestR, bestC);
                if (popped > 0) { s.score += popped * 10; s.msg = `+${popped * 10}!`; s.msgTimer = 50; }
              }
            }
          }
        }
        if (!hit && s.ball.y < R * 2) {
          // Snap to top row
          const c2 = Math.round((s.ball.x - R) / (R * 2 + 1));
          const cc = Math.max(0, Math.min(COLS - 1, c2));
          if (!s.grid[0][cc]) s.grid[0][cc] = s.ball.color;
          hit = true;
        }
        if (hit) {
          s.shots++;
          if (s.shots % 8 === 0) {
            s.grid.unshift(Array.from({ length: COLS }, () => COLORS[Math.floor(Math.random() * 5)]));
            s.grid.pop();
          }
          s.ball = { x: W / 2, y: H - 48, vx: 0, vy: 0, color: s.next, active: false };
          s.cur = s.next; s.next = COLORS[Math.floor(Math.random() * 5)];
          // Check if bubbles reached bottom
          for (let c2 = 0; c2 < COLS; c2++) {
            if (s.grid[ROWS - 2]?.[c2]) { s.lives--; if (s.lives <= 0) s.over = true; break; }
          }
        }
      }
      if (s.msgTimer > 0) s.msgTimer--;

      // Draw BG
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#fdf4ff"); bg.addColorStop(1, "#fce7f3");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Grid
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const color = s.grid[row][col];
          if (color) drawBubble(bx(col, row), by(row), color);
        }
      }
      // Current ball
      if (!s.ball.active) {
        // Aim line
        const ax = Math.cos(s.angle), ay = Math.sin(s.angle);
        ctx.setLineDash([6, 8]); ctx.strokeStyle = "rgba(168,85,247,0.4)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(W / 2, H - 48); ctx.lineTo(W / 2 + ax * 140, H - 48 + ay * 140); ctx.stroke();
        ctx.setLineDash([]);
        drawBubble(W / 2, H - 48, s.ball.color, true);
      } else {
        drawBubble(s.ball.x, s.ball.y, s.ball.color, true);
      }
      // Next
      ctx.font = "11px sans-serif"; ctx.fillStyle = "#9333ea"; ctx.textAlign = "left";
      ctx.fillText("next:", 8, H - 30);
      drawBubble(50, H - 36, s.next);

      // Shooter base
      ctx.fillStyle = "#e9d5ff"; ctx.beginPath();
      ctx.arc(W / 2, H - 48, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2; ctx.stroke();

      // Bottom bar
      ctx.fillStyle = "rgba(168,85,247,0.15)"; ctx.fillRect(0, H - 22, W, 22);
      ctx.font = "bold 12px sans-serif"; ctx.fillStyle = "#7c3aed"; ctx.textAlign = "center";
      ctx.fillText(`❤️ ${s.lives}  🔮 ${s.score}  📦 ${s.shots}`, W / 2, H - 6);

      // Msg
      if (s.msgTimer > 0 && s.msg) {
        ctx.font = `bold ${22 + s.msgTimer * 0.4}px sans-serif`; ctx.fillStyle = `rgba(126,34,206,${s.msgTimer / 50})`;
        ctx.textAlign = "center"; ctx.fillText(s.msg, W / 2, H / 2);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const s = state.current;
    if (s.ball.active || s.over) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const dx = mx - W / 2, dy = my - (H - 48);
    const ang = Math.atan2(dy, dx);
    if (dy > 0) return;
    const speed = 13;
    s.ball.vx = Math.cos(ang) * speed; s.ball.vy = Math.sin(ang) * speed;
    s.ball.active = true;
  };

  const handleMove = (e: React.MouseEvent) => {
    const s = state.current;
    if (s.ball.active) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const dx = mx - W / 2, dy = my - (H - 48);
    if (dy < 0) s.angle = Math.atan2(dy, dx);
  };

  const reset = () => {
    const s = state.current;
    s.grid = mkGrid(); s.lives = 5; s.score = 0; s.shots = 0;
    s.cur = COLORS[Math.floor(Math.random() * 5)];
    s.next = COLORS[Math.floor(Math.random() * 5)];
    s.ball = { x: W / 2, y: H - 48, vx: 0, vy: 0, color: s.cur, active: false };
    s.over = false;
  };

  return (
    <GameShell title="Bắn Bong Bóng" emoji="🔮" score={0} highScore={0} color="from-pink-400 to-fuchsia-500">
      <div className="flex flex-col items-center gap-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 shadow-lg cursor-crosshair select-none"
          onClick={handleClick} onMouseMove={handleMove}>
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          {state.current.over && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-50/90">
              <div className="text-6xl">🔮</div>
              <div className="font-black text-2xl text-pink-600 mt-2">Game Over!</div>
              <button onClick={reset} className="mt-4 px-8 py-3 bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white rounded-full font-black text-lg shadow-lg">
                🔄 Chơi lại
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-pink-400">Click để bắn • 3+ cùng màu sẽ nổ! 🌟</p>
      </div>
    </GameShell>
  );
}
