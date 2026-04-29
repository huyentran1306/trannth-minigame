"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const COLS = 10, ROWS = 20, CELL = 28;

const PIECES = [
  { shape: [[1,1,1,1]], color: "#22d3ee", glow: "#06b6d4" },     // I - cyan
  { shape: [[1,1],[1,1]], color: "#fbbf24", glow: "#f59e0b" },   // O - yellow
  { shape: [[0,1,0],[1,1,1]], color: "#c084fc", glow: "#a855f7" }, // T - purple
  { shape: [[1,0],[1,0],[1,1]], color: "#f97316", glow: "#ea580c" }, // L - orange
  { shape: [[0,1],[0,1],[1,1]], color: "#60a5fa", glow: "#3b82f6" }, // J - blue
  { shape: [[0,1,1],[1,1,0]], color: "#4ade80", glow: "#22c55e" }, // S - green
  { shape: [[1,1,0],[0,1,1]], color: "#f87171", glow: "#ef4444" }, // Z - red
];

type Grid = ({ color: string; glow: string } | null)[][];
function emptyGrid(): Grid { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function rotate(shape: number[][]) { return shape[0].map((_, c) => shape.map(row => row[c]).reverse()); }

function fits(grid: Grid, shape: number[][], x: number, y: number) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) { const nr = y + r, nc = x + c; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc]) return false; }
  return true;
}
function place(grid: Grid, shape: number[][], x: number, y: number, color: string, glow: string): Grid {
  const g = grid.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) g[y + r][x + c] = { color, glow };
  return g;
}
function clearLines(grid: Grid): { grid: Grid; lines: number } {
  const kept = grid.filter(row => row.some(c => !c));
  const lines = ROWS - kept.length;
  return { grid: [...Array.from({ length: lines }, () => Array(COLS).fill(null)), ...kept], lines };
}

function getDropInterval(lv: number) { return Math.max(80, 520 - (lv - 1) * 44); }
const LINE_SCORES = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;

export default function Tetris() {
  const [grid, setGrid] = useState<Grid>(emptyGrid());
  const [piece, setPiece] = useState(() => PIECES[Math.floor(Math.random() * PIECES.length)]);
  const [nextPiece, setNextPiece] = useState(() => PIECES[Math.floor(Math.random() * PIECES.length)]);
  const [x, setX] = useState(3);
  const [y, setY] = useState(0);
  const [shape, setShape] = useState(piece.shape);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [flash, setFlash] = useState(false);
  const stateRef = useRef({ grid, shape, x, y, piece, level, lines });
  stateRef.current = { grid, shape, x, y, piece, level, lines };

  const spawnPiece = useCallback((g: Grid, next: typeof PIECES[0]) => {
    const nx = 3, ny = 0;
    if (!fits(g, next.shape, nx, ny)) { setRunning(false); setDead(true); return false; }
    setPiece(next); setShape(next.shape); setX(nx); setY(ny);
    const nn = PIECES[Math.floor(Math.random() * PIECES.length)];
    setNextPiece(nn);
    return true;
  }, []);

  const lockPiece = useCallback((g: Grid, s: number[][], px: number, py: number, p: typeof PIECES[0]) => {
    const placed = place(g, s, px, py, p.color, p.glow);
    const { grid: newGrid, lines: cleared } = clearLines(placed);
    setGrid(newGrid);
    if (cleared > 0) {
      setFlash(true); setTimeout(() => setFlash(false), 180);
      const pts = LINE_SCORES[Math.min(cleared, 4)];
      setScore(sc => { const ns = sc + pts * stateRef.current.level; setHighScore(h => Math.max(h, ns)); return ns; });
      setLines(ln => {
        const nl = ln + cleared;
        setLevel(Math.floor(nl / LINES_PER_LEVEL) + 1);
        return nl;
      });
    }
    const nn = PIECES[Math.floor(Math.random() * PIECES.length)];
    spawnPiece(newGrid, nextPiece);
    setNextPiece(nn);
  }, [spawnPiece, nextPiece]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const { grid: g, shape: s, x: px, y: py, piece: p } = stateRef.current;
      if (fits(g, s, px, py + 1)) setY(py + 1);
      else lockPiece(g, s, px, py, p);
    }, getDropInterval(stateRef.current.level));
    return () => clearInterval(t);
  }, [running, lockPiece, level]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!running) return;
      const { grid: g, shape: s, x: px, y: py, piece: p } = stateRef.current;
      if (e.key === "ArrowLeft" && fits(g, s, px - 1, py)) { e.preventDefault(); setX(px - 1); }
      if (e.key === "ArrowRight" && fits(g, s, px + 1, py)) { e.preventDefault(); setX(px + 1); }
      if (e.key === "ArrowDown") { e.preventDefault(); if (fits(g, s, px, py + 1)) setY(py + 1); else lockPiece(g, s, px, py, p); }
      if (e.key === "ArrowUp") { e.preventDefault(); const r = rotate(s); if (fits(g, r, px, py)) setShape(r); }
      if (e.key === " ") { e.preventDefault(); let ny = py; while (fits(g, s, px, ny + 1)) ny++; lockPiece(g, s, px, ny, p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [running, lockPiece]);

  const reset = () => {
    const g = emptyGrid();
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    const np = PIECES[Math.floor(Math.random() * PIECES.length)];
    setGrid(g); setScore(0); setDead(false); setLevel(1); setLines(0);
    setNextPiece(np); spawnPiece(g, p);
  };

  // Ghost piece calculation
  const { grid: g, shape: s, x: px, y: py } = stateRef.current;
  let ghostY = py;
  while (fits(g, s, px, ghostY + 1)) ghostY++;

  // Build display grid
  const display: Grid = grid.map(r => [...r]);
  // Ghost
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && ghostY + r >= 0 && ghostY !== y) display[ghostY + r][x + c] = { color: piece.color + "40", glow: "transparent" };
  // Active piece
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && y + r >= 0) display[y + r][x + c] = { color: piece.color, glow: piece.glow };

  const linesLeft = LINES_PER_LEVEL - (lines % LINES_PER_LEVEL);

  return (
    <GameShell title="Tetris" emoji="🟦" score={score} highScore={highScore} color="from-cyan-500 to-purple-600">
      <div className="flex flex-col items-center gap-3">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-cyan-400">⭐ Lv {level}</span>
          <span className="text-gray-400">📋 {lines} dòng</span>
          <span className="text-purple-400">→ còn {linesLeft} dòng</span>
        </div>

        <div className="flex gap-3 items-start">
          {/* Main board */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-2 transition-all"
            style={{
              width: COLS * CELL, borderColor: piece.glow,
              boxShadow: `0 0 20px ${piece.glow}40, 0 0 40px ${piece.glow}20`,
              background: flash ? piece.color + "18" : "#050a14"
            }}>
            {display.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => (
                  <div key={c} style={{
                    width: CELL, height: CELL,
                    background: cell ? `linear-gradient(135deg, ${cell.color}, ${cell.color}cc)` : "transparent",
                    boxShadow: cell && cell.glow !== "transparent" ? `0 0 6px ${cell.glow}` : "none",
                    borderRight: "1px solid rgba(255,255,255,0.03)",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    position: "relative",
                  }}>
                    {cell && cell.glow !== "transparent" && (
                      <div style={{ position: "absolute", top: 2, left: 2, right: "40%", bottom: "60%", background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-3 min-w-[72px]">
            <div className="rounded-lg p-2 text-center" style={{ background: "#0a0e1a", border: "1px solid #1e293b" }}>
              <div className="text-gray-500 text-[10px] mb-1">NEXT</div>
              <div style={{ width: 56, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {nextPiece.shape.map((row, r) => (
                  <div key={r} style={{ position: "absolute" }}>
                    {row.map((cell, c) => cell ? (
                      <div key={c} style={{
                        position: "absolute", left: c * 12, top: r * 12,
                        width: 10, height: 10,
                        background: nextPiece.color,
                        boxShadow: `0 0 4px ${nextPiece.glow}`,
                        borderRadius: 2
                      }} />
                    ) : null)}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 text-center">Space=drop<br/>↑=rotate</div>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex gap-2">
          {[
            ["←", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; if(fits(g,s,px-1,py)) setX(px-1); }],
            ["↻", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; const r=rotate(s); if(fits(g,r,px,py)) setShape(r); }],
            ["↓", () => { const {grid:g,shape:s,x:px,y:py,piece:p} = stateRef.current; if(fits(g,s,px,py+1)) setY(py+1); else lockPiece(g,s,px,py,p); }],
            ["→", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; if(fits(g,s,px+1,py)) setX(px+1); }],
            ["⬇", () => { const {grid:g,shape:s,x:px,y:py,piece:p} = stateRef.current; let ny=py; while(fits(g,s,px,ny+1)) ny++; lockPiece(g,s,px,ny,p); }],
          ].map(([label, fn], i) => (
            <button key={i} onPointerDown={fn as () => void}
              className="w-12 h-12 rounded-xl font-black text-white text-base active:scale-90 transition-transform flex items-center justify-center"
              style={{ background: `${piece.color}25`, border: `1.5px solid ${piece.color}60`, touchAction: "none" }}>
              {label as string}
            </button>
          ))}
        </div>

        {!running && !dead && (
          <button onClick={() => { reset(); setRunning(true); }}
            className="px-8 py-3 font-black text-white text-lg rounded-2xl active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)", boxShadow: "0 4px 20px rgba(139,92,246,0.5)" }}>
            ▶ BẮT ĐẦU
          </button>
        )}
        {dead && (
          <div className="text-center">
            <div className="text-white font-black text-xl mb-1">GAME OVER 💀</div>
            <div className="text-cyan-400 text-sm mb-3">Level {level} • {lines} dòng</div>
            <button onClick={() => { reset(); setRunning(true); }}
              className="px-6 py-2.5 font-black text-white rounded-xl active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
              🔄 Chơi lại
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
