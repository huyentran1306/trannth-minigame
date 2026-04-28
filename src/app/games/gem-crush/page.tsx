"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const COLS = 8;
const ROWS = 8;
const GEMS = ["💎", "❤️", "⭐", "🟢", "🔶", "🟣", "��"];

function createBoard() {
  const board: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    board.push([]);
    for (let c = 0; c < COLS; c++) {
      board[r].push(GEMS[Math.floor(Math.random() * GEMS.length)]);
    }
  }
  return board;
}

function findMatches(board: string[][]) {
  const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
        matched[r][c] = matched[r][c+1] = matched[r][c+2] = true;
      }
    }
  }
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
        matched[r][c] = matched[r+1][c] = matched[r+2][c] = true;
      }
    }
  }
  return matched;
}

function applyGravity(board: string[][]): string[][] {
  const newBoard = board.map(r => [...r]);
  for (let c = 0; c < COLS; c++) {
    const col = [];
    for (let r = ROWS - 1; r >= 0; r--) if (newBoard[r][c]) col.push(newBoard[r][c]);
    for (let r = ROWS - 1; r >= 0; r--) {
      newBoard[r][c] = col.shift() || GEMS[Math.floor(Math.random() * GEMS.length)];
    }
  }
  return newBoard;
}

export default function GemCrush() {
  const [board, setBoard] = useState(createBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combos, setCombos] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  const processMatches = useCallback((b: string[][], points = 0, combo = 0): { board: string[][], points: number, combo: number } => {
    const matched = findMatches(b);
    const matchCount = matched.flat().filter(Boolean).length;
    if (matchCount === 0) return { board: b, points, combo };
    const newBoard = b.map((row, r) => row.map((gem, c) => matched[r][c] ? "" : gem));
    const newPoints = points + matchCount * 10 * (combo + 1);
    const gravity = applyGravity(newBoard);
    return processMatches(gravity, newPoints, combo + 1);
  }, []);

  const handleClick = (r: number, c: number) => {
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) { setSelected([r, c]); return; }

    const newBoard = board.map(row => [...row]);
    [newBoard[sr][sc], newBoard[r][c]] = [newBoard[r][c], newBoard[sr][sc]];
    const matched = findMatches(newBoard);
    if (matched.flat().some(Boolean)) {
      const { board: finalBoard, points, combo } = processMatches(newBoard);
      setBoard(finalBoard);
      setScore(s => {
        const ns = s + points;
        setHighScore(h => Math.max(h, ns));
        return ns;
      });
      if (combo > 1) { setCombos(combo); setShowCombo(true); setTimeout(() => setShowCombo(false), 1200); }
    }
    setSelected(null);
  };

  return (
    <GameShell title="Kim Cương" emoji="💎" score={score} highScore={highScore} color="from-blue-500 to-cyan-400">
      <div className="w-full max-w-sm">
        <AnimatePresence>
          {showCombo && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ opacity: 0, y: -20 }}
              className="text-center text-2xl font-black text-yellow-400 mb-2">
              🔥 COMBO x{combos}!
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {board.map((row, r) => row.map((gem, c) => (
            <motion.button key={`${r}-${c}`} whileTap={{ scale: 0.8 }}
              onClick={() => handleClick(r, c)}
              className={`aspect-square text-lg md:text-xl rounded-lg border transition-all ${
                selected?.[0] === r && selected?.[1] === c
                  ? "border-yellow-400 bg-yellow-400/20 scale-110"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {gem}
            </motion.button>
          )))}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => { setBoard(createBoard()); setScore(0); }}
            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors">
            🔄 New Game
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Tap 2 adjacent gems to swap</p>
      </div>
    </GameShell>
  );
}
