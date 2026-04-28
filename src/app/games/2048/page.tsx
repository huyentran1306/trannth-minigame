"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const SIZE = 4;

function emptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

function addRandom(g: number[][]) {
  const empty: [number,number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) empty.push([r, c]);
  if (!empty.length) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const ng = g.map(row => [...row]);
  ng[r][c] = Math.random() < 0.9 ? 2 : 4;
  return ng;
}

function slideRow(row: number[]): { row: number[]; pts: number } {
  const filtered = row.filter(x => x !== 0);
  let pts = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2; pts += filtered[i]; filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < SIZE) filtered.push(0);
  return { row: filtered, pts };
}

function moveGrid(g: number[][], dir: string): { grid: number[][], pts: number } {
  let total = 0;
  let grid = g.map(r => [...r]);
  const rotate90 = (g: number[][]) => g[0].map((_, c) => g.map(r => r[c]).reverse());
  const transpose = (g: number[][]) => g[0].map((_, c) => g.map(r => r[c]));

  if (dir === "UP") grid = rotate90(rotate90(rotate90(grid)));
  if (dir === "RIGHT") grid = grid.map(r => [...r].reverse());
  if (dir === "DOWN") grid = rotate90(grid);

  grid = grid.map(row => { const { row: r, pts } = slideRow(row); total += pts; return r; });

  if (dir === "UP") grid = rotate90(grid);
  if (dir === "RIGHT") grid = grid.map(r => [...r].reverse());
  if (dir === "DOWN") grid = rotate90(rotate90(rotate90(grid)));

  return { grid, pts: total };
}

const COLORS: Record<number, string> = {
  0: "bg-gray-800/50", 2: "bg-amber-100 text-gray-800", 4: "bg-amber-200 text-gray-800",
  8: "bg-orange-400 text-white", 16: "bg-orange-500 text-white", 32: "bg-orange-600 text-white",
  64: "bg-red-500 text-white", 128: "bg-yellow-400 text-white", 256: "bg-yellow-500 text-white",
  512: "bg-yellow-600 text-white", 1024: "bg-purple-500 text-white", 2048: "bg-purple-700 text-white",
};

export default function Game2048() {
  const [grid, setGrid] = useState(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [won, setWon] = useState(false);

  const move = useCallback((dir: string) => {
    setGrid(prev => {
      const { grid: ng, pts } = moveGrid(prev, dir);
      const changed = ng.some((row, r) => row.some((v, c) => v !== prev[r][c]));
      if (!changed) return prev;
      const final = addRandom(ng);
      setScore(s => { const ns = s + pts; setHighScore(h => Math.max(h, ns)); return ns; });
      if (ng.some(row => row.some(v => v >= 2048))) setWon(true);
      return final;
    });
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT" };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move]);

  // Touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "RIGHT" : "LEFT");
      else move(dy > 0 ? "DOWN" : "UP");
    };
    window.addEventListener("touchstart", ts);
    window.addEventListener("touchend", te);
    return () => { window.removeEventListener("touchstart", ts); window.removeEventListener("touchend", te); };
  }, [move]);

  const reset = () => { setGrid(addRandom(addRandom(emptyGrid()))); setScore(0); setWon(false); };

  return (
    <GameShell title="2048" emoji="🔢" score={score} highScore={highScore} color="from-orange-500 to-amber-400">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {won && (
          <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-xl px-4 py-2 text-yellow-300 font-bold text-center">
            🏆 You reached 2048! Keep going!
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 bg-orange-950/50 p-3 rounded-2xl w-full">
          {grid.map((row, r) => row.map((val, c) => (
            <motion.div key={`${r}-${c}`}
              className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm md:text-base transition-colors duration-150 ${COLORS[val] || "bg-purple-800 text-white"}`}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              {val !== 0 ? val : ""}
            </motion.div>
          )))}
        </div>
        <button onClick={reset} className="w-full py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors">
          🔄 New Game
        </button>
        <p className="text-xs text-gray-500">Arrow keys or swipe to merge tiles</p>
      </div>
    </GameShell>
  );
}
