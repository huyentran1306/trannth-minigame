"use client";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import GameShell from "@/components/game-shell";

const ROWS = 9, COLS = 9, MINES = 10;

interface Cell { mine: boolean; revealed: boolean; flagged: boolean; adj: number; }

function createBoard(): Cell[][] {
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let adj = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) adj++;
      }
      board[r][c].adj = adj;
    }
  return board;
}

const ADJ_COLORS = ["","text-blue-400","text-green-400","text-red-400","text-purple-600","text-red-700","text-cyan-400","text-black","text-gray-400"];

export default function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [flags, setFlags] = useState(0);

  const reveal = useCallback((board: Cell[][], r: number, c: number): Cell[][] => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return board;
    if (board[r][c].revealed || board[r][c].flagged) return board;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    b[r][c].revealed = true;
    if (b[r][c].adj === 0 && !b[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) reveal(b, r + dr, c + dc).forEach((row, rr) => row.forEach((cell, cc) => { b[rr][cc] = cell; }));
      }
    }
    return b;
  }, []);

  const handleClick = (r: number, c: number) => {
    if (dead || won || board[r][c].flagged || board[r][c].revealed) return;
    if (board[r][c].mine) {
      const b = board.map(row => row.map(cell => ({ ...cell, revealed: cell.mine ? true : cell.revealed })));
      setBoard(b); setDead(true); return;
    }
    const newBoard = reveal(board.map(row => row.map(c => ({...c}))), r, c);
    setBoard(newBoard);
    setScore(s => s + 10);
    const allRevealed = newBoard.every(row => row.every(cell => cell.mine || cell.revealed));
    if (allRevealed) setWon(true);
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (dead || won || board[r][c].revealed) return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    b[r][c].flagged = !b[r][c].flagged;
    setFlags(f => b[r][c].flagged ? f + 1 : f - 1);
    setBoard(b);
  };

  const reset = () => { setBoard(createBoard()); setDead(false); setWon(false); setScore(0); setFlags(0); };

  return (
    <GameShell title="Dò Mìn" emoji="💣" score={score} color="from-red-500 to-rose-400">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 text-sm text-gray-400">
          <span>💣 {MINES - flags} left</span>
          {(dead || won) && <span className={won ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{won ? "🏆 WIN!" : "💥 BOOM!"}</span>}
        </div>
        <div className="border border-red-500/30 rounded-xl overflow-hidden bg-red-950/20">
          {board.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <motion.button key={c} whileTap={{ scale: 0.9 }}
                  onClick={() => handleClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  className={`w-8 h-8 border border-gray-800 text-xs font-black flex items-center justify-center transition-colors select-none
                    ${cell.revealed
                      ? cell.mine ? "bg-red-600" : "bg-gray-800/80"
                      : "bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
                    }`}
                >
                  {cell.revealed
                    ? cell.mine ? "💣" : cell.adj > 0 ? <span className={ADJ_COLORS[cell.adj]}>{cell.adj}</span> : ""
                    : cell.flagged ? "🚩" : ""
                  }
                </motion.button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={reset} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors text-sm">
          🔄 New Game
        </button>
        <p className="text-xs text-gray-500">Long press / right-click to flag 🚩</p>
      </div>
    </GameShell>
  );
}
