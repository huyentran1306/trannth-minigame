"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GameShell from "@/components/game-shell";

const SIZE = 4;

function emptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }
function addRandom(g: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) empty.push([r, c]);
  if (!empty.length) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const ng = g.map(row => [...row]);
  ng[r][c] = Math.random() < 0.88 ? 2 : 4;
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
  if (dir === "UP") grid = rotate90(rotate90(rotate90(grid)));
  if (dir === "RIGHT") grid = grid.map(r => [...r].reverse());
  if (dir === "DOWN") grid = rotate90(grid);
  grid = grid.map(row => { const { row: r, pts } = slideRow(row); total += pts; return r; });
  if (dir === "UP") grid = rotate90(grid);
  if (dir === "RIGHT") grid = grid.map(r => [...r].reverse());
  if (dir === "DOWN") grid = rotate90(rotate90(rotate90(grid)));
  return { grid, pts: total };
}

const TILE_STYLES: Record<number, { bg: string; text: string; shadow: string }> = {
  0: { bg: "rgba(255,255,255,0.04)", text: "transparent", shadow: "none" },
  2: { bg: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", text: "#475569", shadow: "none" },
  4: { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", text: "#92400e", shadow: "0 0 8px rgba(251,191,36,0.3)" },
  8: { bg: "linear-gradient(135deg, #fed7aa, #fb923c)", text: "#fff", shadow: "0 0 12px rgba(249,115,22,0.5)" },
  16: { bg: "linear-gradient(135deg, #fdba74, #f97316)", text: "#fff", shadow: "0 0 14px rgba(234,88,12,0.6)" },
  32: { bg: "linear-gradient(135deg, #fca5a5, #ef4444)", text: "#fff", shadow: "0 0 16px rgba(220,38,38,0.6)" },
  64: { bg: "linear-gradient(135deg, #f87171, #dc2626)", text: "#fff", shadow: "0 0 18px rgba(185,28,28,0.7)" },
  128: { bg: "linear-gradient(135deg, #fde68a, #fbbf24)", text: "#fff", shadow: "0 0 20px rgba(245,158,11,0.8)" },
  256: { bg: "linear-gradient(135deg, #fbbf24, #d97706)", text: "#fff", shadow: "0 0 22px rgba(217,119,6,0.8)" },
  512: { bg: "linear-gradient(135deg, #86efac, #22c55e)", text: "#fff", shadow: "0 0 22px rgba(34,197,94,0.8)" },
  1024: { bg: "linear-gradient(135deg, #67e8f9, #06b6d4)", text: "#fff", shadow: "0 0 24px rgba(6,182,212,0.9)" },
  2048: { bg: "linear-gradient(135deg, #c084fc, #7c3aed)", text: "#fff", shadow: "0 0 28px rgba(124,58,237,1)" },
};

const LEVEL_TARGETS = [0, 64, 128, 256, 512, 1024, 2048];
function getLevel(maxTile: number): number {
  for (let i = LEVEL_TARGETS.length - 1; i >= 0; i--) {
    if (maxTile >= LEVEL_TARGETS[i]) return i;
  }
  return 0;
}

export default function Game2048() {
  const [grid, setGrid] = useState(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [maxTile, setMaxTile] = useState(0);
  const [levelFlash, setLevelFlash] = useState(false);

  const level = getLevel(maxTile);
  const nextTarget = LEVEL_TARGETS[level + 1] || null;

  const move = useCallback((dir: string) => {
    setGrid(prev => {
      const { grid: ng, pts } = moveGrid(prev, dir);
      const changed = ng.some((row, r) => row.some((v, c) => v !== prev[r][c]));
      if (!changed) return prev;
      const final = addRandom(ng);
      setScore(s => { const ns = s + pts; setHighScore(h => Math.max(h, ns)); return ns; });
      const mx = Math.max(...final.flat());
      setMaxTile(prev => {
        if (mx > prev) { setLevelFlash(true); setTimeout(() => setLevelFlash(false), 1200); }
        return Math.max(prev, mx);
      });
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

  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "RIGHT" : "LEFT");
      else move(dy > 0 ? "DOWN" : "UP");
    };
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchend", te, { passive: true });
    return () => { window.removeEventListener("touchstart", ts); window.removeEventListener("touchend", te); };
  }, [move]);

  const reset = () => { setGrid(addRandom(addRandom(emptyGrid()))); setScore(0); setMaxTile(0); };

  return (
    <GameShell title="2048" emoji="🔢" score={score} highScore={highScore} color="from-orange-500 to-amber-500">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {/* Level progress */}
        <div className="w-full flex items-center gap-2">
          <span className="text-sm font-bold text-amber-400">⭐ Lv {level}</span>
          {nextTarget && (
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (maxTile / nextTarget) * 100)}%`, background: TILE_STYLES[Math.min(maxTile, 2048) as keyof typeof TILE_STYLES]?.bg || "#fbbf24" }} />
            </div>
          )}
          {nextTarget && <span className="text-xs text-gray-400">→ {nextTarget}</span>}
          {!nextTarget && <span className="text-xs text-purple-400">🏆 MAX!</span>}
        </div>

        {levelFlash && maxTile >= 64 && (
          <motion.div initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 1.1, opacity: 0 }} transition={{ duration: 1.2 }}
            className="text-center font-black text-xl text-white absolute"
            style={{ textShadow: `0 0 20px ${TILE_STYLES[Math.min(maxTile, 2048) as keyof typeof TILE_STYLES]?.shadow}` }}>
            ✨ {maxTile}!
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl w-full"
          style={{ background: "rgba(0,0,0,0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {grid.map((row, r) => row.map((val, c) => {
            const style = TILE_STYLES[val as keyof typeof TILE_STYLES] || TILE_STYLES[2048];
            const fontSize = val >= 1024 ? "text-xs" : val >= 256 ? "text-sm" : "text-base";
            return (
              <motion.div key={`${r}-${c}-${val}`}
                className={`aspect-square rounded-xl flex items-center justify-center font-black ${fontSize}`}
                style={{ background: style.bg, color: style.text, boxShadow: style.shadow, minHeight: 62 }}
                initial={val !== 0 ? { scale: 0.7 } : {}}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                {val !== 0 ? val : ""}
              </motion.div>
            );
          }))}
        </div>

        <button onClick={reset}
          className="w-full py-2.5 font-black text-white rounded-xl active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}>
          🔄 Ván mới
        </button>
        <p className="text-xs text-gray-500">Mũi tên hoặc vuốt để gộp ô</p>
      </div>
    </GameShell>
  );
}
