"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import GameShell from "@/components/game-shell";

const COLS = 20;
const ROWS = 20;
const CELL = 18;
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

export default function Snake() {
  const [snake, setSnake] = useState([[10, 10], [10, 9], [10, 8]]);
  const [food, setFood] = useState([5, 5]);
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const nextDir = useRef<Dir>("RIGHT");
  const snakeRef = useRef(snake);
  snakeRef.current = snake;

  const placeFood = useCallback((s: number[][]) => {
    let f: number[];
    do { f = [Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)]; }
    while (s.some(([r, c]) => r === f[0] && c === f[1]));
    return f;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        const opposite: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
        if (d !== opposite[nextDir.current]) nextDir.current = d;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const d = nextDir.current;
        setDir(d);
        const head = prev[0];
        const moves: Record<Dir, [number, number]> = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] };
        const [dr, dc] = moves[d];
        const newHead = [head[0] + dr, head[1] + dc];

        if (newHead[0] < 0 || newHead[0] >= ROWS || newHead[1] < 0 || newHead[1] >= COLS ||
            prev.some(([r, c]) => r === newHead[0] && c === newHead[1])) {
          setRunning(false);
          setDead(true);
          setHighScore(h => Math.max(h, prev.length - 3));
          return prev;
        }

        let newSnake;
        setFood(f => {
          if (newHead[0] === f[0] && newHead[1] === f[1]) {
            newSnake = [newHead, ...prev];
            setScore(s => s + 10);
            setFood(placeFood([newHead, ...prev]));
          } else {
            newSnake = [newHead, ...prev.slice(0, -1)];
          }
          return f;
        });
        return newSnake || [newHead, ...prev.slice(0, -1)];
      });
    }, 120);
    return () => clearInterval(interval);
  }, [running, placeFood]);

  const reset = () => { setSnake([[10, 10], [10, 9], [10, 8]]); setFood([5, 5]); setScore(0); setDead(false); nextDir.current = "RIGHT"; };
  const swipe = (d: Dir) => {
    const opposite: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (d !== opposite[nextDir.current]) nextDir.current = d;
  };

  return (
    <GameShell title="Rắn Săn Mồi" emoji="🐍" score={score} highScore={highScore} color="from-green-400 to-emerald-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative" style={{ width: COLS * CELL, height: ROWS * CELL }}>
          {/* Grid background */}
          <div className="absolute inset-0 rounded-xl overflow-hidden border border-green-200 bg-green-50">
            {Array.from({ length: ROWS }).map((_, r) =>
              Array.from({ length: COLS }).map((_, c) => (
                <div key={`${r}-${c}`} className="absolute border border-green-100"
                  style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }} />
              ))
            )}
          </div>

          {/* Snake */}
          {snake.map(([r, c], i) => (
            <motion.div key={`s-${i}`}
              className={`absolute rounded-sm ${i === 0 ? "bg-green-400 z-10" : "bg-green-600"}`}
              style={{ left: c * CELL + 1, top: r * CELL + 1, width: CELL - 2, height: CELL - 2 }}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
            />
          ))}

          {/* Food */}
          <motion.div className="absolute text-base flex items-center justify-center"
            style={{ left: food[1] * CELL, top: food[0] * CELL, width: CELL, height: CELL }}
            animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
            🍎
          </motion.div>

          {/* Dead overlay */}
          {dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-white font-black text-xl">GAME OVER</div>
              <div className="text-gray-300 text-sm mb-4">Score: {score}</div>
              <button onClick={reset} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold text-sm">Chơi lại</button>
            </div>
          )}
        </div>

        {/* Controls */}
        {!running && !dead && (
          <button onClick={() => setRunning(true)} className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-black text-lg rounded-2xl transition-colors">
            ▶ BẮT ĐẦU
          </button>
        )}

        {/* Mobile D-pad */}
        <div className="grid grid-cols-3 gap-2 mt-2 md:hidden">
          {[["", "UP", ""], ["LEFT", "DOWN", "RIGHT"]].map((row, ri) =>
            row.map((d, ci) => d ? (
              <button key={`${ri}-${ci}`} onPointerDown={() => swipe(d as Dir)}
                className="w-12 h-12 bg-green-100 rounded-xl text-white font-bold text-xl flex items-center justify-center active:bg-green-600">
                {d === "UP" ? "↑" : d === "DOWN" ? "↓" : d === "LEFT" ? "←" : "→"}
              </button>
            ) : <div key={`${ri}-${ci}`} />)
          )}
        </div>

        <p className="text-xs text-gray-500">Desktop: WASD / Arrow keys</p>
      </div>
    </GameShell>
  );
}
