"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import GameShell from "@/components/game-shell";

// '#'=wall ' '=floor '.'=goal '@'=player '$'=box '*'=box-on-goal
const LEVELS = [
  ["#####", "#@$.#", "#####"],
  ["######", "#    #", "# $. #", "# @  #", "######"],
  ["#######", "#.    #", "# $$  #", "# . @ #", "#######"],
  ["########", "#.  .  #", "# $$ @ #", "#  ##  #", "# $  . #", "#    . #", "########"],
  ["########", "#@ $   #", "# .##. #", "#  $$  #", "#  ..  #", "########"],
];

type Cell = "wall" | "floor" | "goal" | "box" | "boxGoal";
interface Pos { r: number; c: number }

function parseLevel(raw: string[]): { grid: Cell[][]; player: Pos } {
  const grid: Cell[][] = [];
  let player: Pos = { r: 0, c: 0 };
  for (let r = 0; r < raw.length; r++) {
    grid[r] = [];
    for (let c = 0; c < raw[r].length; c++) {
      const ch = raw[r][c];
      if (ch === "#") grid[r][c] = "wall";
      else if (ch === "." || ch === "+") grid[r][c] = "goal";
      else if (ch === "$") grid[r][c] = "box";
      else if (ch === "*") grid[r][c] = "boxGoal";
      else grid[r][c] = "floor";
      if (ch === "@" || ch === "+") player = { r, c };
    }
  }
  return { grid, player };
}

const CS = 52;

export default function Sokoban() {
  const [lvIdx, setLvIdx] = useState(0);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [player, setPlayer] = useState<Pos>({ r: 0, c: 0 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<{ grid: Cell[][]; player: Pos }[]>([]);
  const [bestMoves, setBestMoves] = useState<Record<number, number>>({});

  const load = useCallback((idx: number) => {
    const { grid: g, player: p } = parseLevel(LEVELS[idx]);
    setGrid(g); setPlayer(p); setMoves(0); setWon(false); setHistory([]);
  }, []);

  useEffect(() => { load(lvIdx); }, [lvIdx, load]);

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    setGrid(g => {
      let newGrid = g;
      setPlayer(p => {
        const nr = p.r + dr, nc = p.c + dc;
        if (!g[nr] || g[nr][nc] === "wall") return p;
        const ng = g.map(r => [...r]) as Cell[][];
        if (ng[nr][nc] === "box" || ng[nr][nc] === "boxGoal") {
          const br = nr + dr, bc = nc + dc;
          if (!ng[br] || ng[br][bc] === "wall" || ng[br][bc] === "box" || ng[br][bc] === "boxGoal") return p;
          setHistory(h => [...h, { grid: g.map(r => [...r]) as Cell[][], player: p }]);
          ng[br][bc] = ng[br][bc] === "goal" ? "boxGoal" : "box";
          ng[nr][nc] = ng[nr][nc] === "boxGoal" ? "goal" : "floor";
          newGrid = ng;
          setMoves(m => {
            const newM = m + 1;
            const allDone = ng.every(row => row.every(c => c !== "box"));
            if (allDone) {
              setWon(true);
              setBestMoves(bm => ({ ...bm, [lvIdx]: Math.min(bm[lvIdx] ?? 9999, newM) }));
            }
            return newM;
          });
          return { r: nr, c: nc };
        }
        setHistory(h => [...h, { grid: g.map(r => [...r]) as Cell[][], player: p }]);
        setMoves(m => m + 1);
        newGrid = ng;
        return { r: nr, c: nc };
      });
      return newGrid;
    });
  }, [won, lvIdx]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setGrid(prev.grid.map(r => [...r]) as Cell[][]);
      setPlayer(prev.player);
      setMoves(m => Math.max(0, m - 1));
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
      };
      if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
      if (e.key === "u" || e.key === "z") undo();
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [move, undo]);

  const cellBg = (c: Cell) => {
    if (c === "wall") return { bg: "#92400e", icon: null };
    if (c === "goal") return { bg: "#dcfce7", icon: <div className="w-5 h-5 rounded-full border-4 border-green-400 opacity-70" /> };
    if (c === "box") return { bg: "#fef3c7", icon: <span className="text-2xl select-none">📦</span> };
    if (c === "boxGoal") return { bg: "#d1fae5", icon: <span className="text-2xl select-none">✅</span> };
    return { bg: "#fef9f0", icon: null };
  };

  return (
    <GameShell title="Sokoban" emoji="⬜" score={moves} color="from-amber-400 to-yellow-400">
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex gap-2 items-center">
          {LEVELS.map((_, i) => (
            <button key={i} onClick={() => setLvIdx(i)}
              className={`w-9 h-9 rounded-full font-black text-sm border-2 transition-all relative ${lvIdx === i ? "bg-amber-400 text-white border-amber-400" : "bg-white text-amber-500 border-amber-200"}`}>
              {i + 1}
              {bestMoves[i] !== undefined && <span className="absolute -top-1 -right-1 text-[8px] bg-green-400 text-white rounded-full w-4 h-4 flex items-center justify-center">✓</span>}
            </button>
          ))}
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200"
          style={{ background: "#fef9f0" }}>
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => {
                const { bg, icon } = cellBg(cell);
                return (
                  <div key={c} className="relative flex items-center justify-center border border-amber-100/50"
                    style={{ width: CS, height: CS, background: bg }}>
                    {icon}
                    {player.r === r && player.c === c && (
                      <motion.span className="absolute text-2xl z-10 select-none"
                        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.25 }}>
                        🧑
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {won && (
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ background: "rgba(240,253,244,0.94)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-6xl mb-2">🎉</div>
              <div className="font-black text-2xl text-green-600">Xuất Sắc!</div>
              <div className="text-green-500 font-semibold">{moves} bước{bestMoves[lvIdx] === moves ? " 🏆 Kỷ lục!" : ""}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => load(lvIdx)} className="px-4 py-2 bg-green-400 text-white rounded-xl font-bold">🔄 Lại</button>
                {lvIdx < LEVELS.length - 1 && (
                  <button onClick={() => setLvIdx(l => l + 1)} className="px-4 py-2 bg-amber-400 text-white rounded-xl font-bold">Level {lvIdx + 2} ▶</button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => load(lvIdx)} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors">🔄 Reset</button>
          <button onClick={undo} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors">↩️ Undo (U)</button>
        </div>

        <div className="grid grid-cols-3 gap-1 md:hidden">
          {[
            [null, [-1, 0], null],
            [[0, -1], [1, 0], [0, 1]],
          ].map((row, ri) => row.map((d, ci) => d ? (
            <button key={`${ri}-${ci}`} onClick={() => move(d[0], d[1])}
              className="w-12 h-12 bg-amber-200 rounded-xl font-black text-lg text-amber-800 active:bg-amber-400 flex items-center justify-center select-none">
              {ri === 0 ? "↑" : ci === 0 ? "←" : ci === 1 ? "↓" : "→"}
            </button>
          ) : <div key={`${ri}-${ci}`} />))}
        </div>
        <p className="text-xs text-amber-500">WASD / Arrow • U = Undo • Đẩy 📦 vào ô xanh!</p>
      </div>
    </GameShell>
  );
}
