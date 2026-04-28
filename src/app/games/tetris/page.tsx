"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const COLS = 10;
const ROWS = 20;
const CELL = 28;

const PIECES = [
  { shape: [[1,1,1,1]], color: "bg-cyan-400" },
  { shape: [[1,1],[1,1]], color: "bg-yellow-400" },
  { shape: [[0,1,0],[1,1,1]], color: "bg-purple-400" },
  { shape: [[1,0],[1,0],[1,1]], color: "bg-orange-400" },
  { shape: [[0,1],[0,1],[1,1]], color: "bg-blue-400" },
  { shape: [[0,1,1],[1,1,0]], color: "bg-green-400" },
  { shape: [[1,1,0],[0,1,1]], color: "bg-red-400" },
];

type Grid = (string | null)[][];
function emptyGrid(): Grid { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }

function rotate(shape: number[][]) {
  return shape[0].map((_, c) => shape.map(row => row[c]).reverse());
}

function fits(grid: Grid, shape: number[][], x: number, y: number) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nr = y + r, nc = x + c;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc]) return false;
      }
  return true;
}

function place(grid: Grid, shape: number[][], x: number, y: number, color: string): Grid {
  const g = grid.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) g[y + r][x + c] = color;
  return g;
}

function clearLines(grid: Grid): { grid: Grid; lines: number } {
  const kept = grid.filter(row => row.some(c => !c));
  const lines = ROWS - kept.length;
  const newGrid: Grid = [...Array.from({ length: lines }, () => Array(COLS).fill(null)), ...kept];
  return { grid: newGrid, lines };
}

export default function Tetris() {
  const [grid, setGrid] = useState<Grid>(emptyGrid());
  const [piece, setPiece] = useState(() => PIECES[Math.floor(Math.random() * PIECES.length)]);
  const [x, setX] = useState(3);
  const [y, setY] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [shape, setShape] = useState(piece.shape);

  const stateRef = useRef({ grid, shape, x, y, piece });
  stateRef.current = { grid, shape, x, y, piece };

  const spawnPiece = useCallback((g: Grid) => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    const nx = 3, ny = 0;
    if (!fits(g, p.shape, nx, ny)) { setRunning(false); setDead(true); return false; }
    setPiece(p); setShape(p.shape); setX(nx); setY(ny);
    return true;
  }, []);

  const lockPiece = useCallback((g: Grid, s: number[][], px: number, py: number, color: string) => {
    const placed = place(g, s, px, py, color);
    const { grid: newGrid, lines } = clearLines(placed);
    setGrid(newGrid);
    const pts = [0, 100, 300, 500, 800][Math.min(lines, 4)];
    setScore(sc => { const ns = sc + pts; setHighScore(h => Math.max(h, ns)); return ns; });
    spawnPiece(newGrid);
  }, [spawnPiece]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const { grid: g, shape: s, x: px, y: py, piece: p } = stateRef.current;
      if (fits(g, s, px, py + 1)) setY(py + 1);
      else lockPiece(g, s, px, py, p.color);
    }, 500);
    return () => clearInterval(t);
  }, [running, lockPiece]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!running) return;
      const { grid: g, shape: s, x: px, y: py, piece: p } = stateRef.current;
      if (e.key === "ArrowLeft" && fits(g, s, px - 1, py)) setX(px - 1);
      if (e.key === "ArrowRight" && fits(g, s, px + 1, py)) setX(px + 1);
      if (e.key === "ArrowDown") { if (fits(g, s, px, py + 1)) setY(py + 1); else lockPiece(g, s, px, py, p.color); }
      if (e.key === "ArrowUp") { const r = rotate(s); if (fits(g, r, px, py)) setShape(r); }
      if (e.key === " ") { let ny = py; while (fits(g, s, px, ny + 1)) ny++; lockPiece(g, s, px, ny, p.color); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [running, lockPiece]);

  const reset = () => { const g = emptyGrid(); setGrid(g); setScore(0); setDead(false); spawnPiece(g); };

  // Build display grid
  const display: Grid = grid.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && y + r >= 0) display[y + r][x + c] = piece.color;

  return (
    <GameShell title="Tetris" emoji="🟦" score={score} highScore={highScore} color="from-yellow-500 to-orange-400">
      <div className="flex flex-col items-center gap-4">
        <div className="border border-yellow-500/30 rounded-xl overflow-hidden bg-purple-50/80"
          style={{ width: COLS * CELL, height: ROWS * CELL }}>
          {display.map((row, r) => (
            <div key={r} className="flex">
              {row.map((color, c) => (
                <div key={c} className={`border border-gray-900/50 ${color || "bg-purple-50"}`}
                  style={{ width: CELL, height: CELL }} />
              ))}
            </div>
          ))}
        </div>

        {!running && !dead && <button onClick={() => { reset(); setRunning(true); }} className="px-8 py-3 bg-yellow-500 text-black font-black text-lg rounded-2xl">▶ START</button>}
        {dead && (
          <div className="text-center">
            <div className="text-2xl font-black text-white mb-1">GAME OVER 💀</div>
            <button onClick={() => { reset(); setRunning(true); }} className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-xl">Chơi lại</button>
          </div>
        )}

        {/* Mobile controls */}
        <div className="grid grid-cols-4 gap-2 md:hidden">
          {[["←", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; if(fits(g,s,px-1,py)) setX(px-1); }],
            ["↓", () => { const {grid:g,shape:s,x:px,y:py,piece:p} = stateRef.current; if(fits(g,s,px,py+1)) setY(py+1); else lockPiece(g,s,px,py,p.color); }],
            ["→", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; if(fits(g,s,px+1,py)) setX(px+1); }],
            ["↻", () => { const {grid:g,shape:s,x:px,y:py} = stateRef.current; const r=rotate(s); if(fits(g,r,px,py)) setShape(r); }],
          ].map(([label, fn], i) => (
            <button key={i} onPointerDown={fn as () => void}
              className="w-14 h-14 bg-yellow-900/60 rounded-xl text-white font-bold text-xl flex items-center justify-center active:bg-yellow-700">
              {label as string}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 hidden md:block">← → rotate↑ drop↓ hardDrop Space</p>
      </div>
    </GameShell>
  );
}
