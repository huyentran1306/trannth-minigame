"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const COLS = 20, ROWS = 20, CELL = 18;
const BASE_INTERVAL = 125;
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const FOOD_TYPES = ["🍎", "🍇", "🍊", "🍋", "🍓", "🍑", "🫐", "🍉"];
const LEVEL_FOOD = [0, 5, 12, 21, 32, 45, 60];

function getInterval(lv: number) { return Math.max(55, BASE_INTERVAL - (lv - 1) * 11); }

export default function Snake() {
  const [snake, setSnake] = useState([[10, 10], [10, 9], [10, 8]]);
  const [food, setFood] = useState([5, 5]);
  const [foodType, setFoodType] = useState(0);
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [foodCount, setFoodCount] = useState(0);
  const nextDir = useRef<Dir>("RIGHT");
  const snakeRef = useRef(snake);
  snakeRef.current = snake;
  const foodCountRef = useRef(0);
  const levelRef = useRef(1);

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
        const opp: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
        if (d !== opp[nextDir.current]) nextDir.current = d;
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
        const moves: Record<Dir, [number, number]> = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] };
        const [dr, dc] = moves[d];
        const newHead = [prev[0][0] + dr, prev[0][1] + dc];

        if (newHead[0] < 0 || newHead[0] >= ROWS || newHead[1] < 0 || newHead[1] >= COLS ||
          prev.some(([r, c]) => r === newHead[0] && c === newHead[1])) {
          setRunning(false); setDead(true);
          setHighScore(h => Math.max(h, prev.length - 3));
          return prev;
        }

        let newSnake: number[][] = [newHead, ...prev.slice(0, -1)];
        setFood(f => {
          if (newHead[0] === f[0] && newHead[1] === f[1]) {
            newSnake = [newHead, ...prev];
            setScore(s => s + 10 * levelRef.current);
            setFoodType(Math.floor(Math.random() * FOOD_TYPES.length));
            foodCountRef.current++;
            setFoodCount(foodCountRef.current);
            const lv = levelRef.current;
            if (LEVEL_FOOD[lv] && foodCountRef.current >= LEVEL_FOOD[lv]) {
              levelRef.current = lv + 1;
              setLevel(lv + 1);
              setLevelUp(true);
              setTimeout(() => setLevelUp(false), 1500);
            }
            setFood(placeFood([newHead, ...prev]));
          }
          return f;
        });
        return newSnake;
      });
    }, getInterval(levelRef.current));
    return () => clearInterval(interval);
  }, [running, placeFood]);

  const reset = () => {
    setSnake([[10, 10], [10, 9], [10, 8]]); setFood([5, 5]); setScore(0); setDead(false);
    setLevel(1); setFoodCount(0); levelRef.current = 1; foodCountRef.current = 0;
    nextDir.current = "RIGHT";
  };
  const swipe = (d: Dir) => {
    const opp: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (d !== opp[nextDir.current]) nextDir.current = d;
    if (!running && !dead) { setRunning(true); }
  };

  const W = COLS * CELL, H = ROWS * CELL;

  // Snake color gradient per level
  const snakeColors = [
    ["#4ade80", "#16a34a"],   // lv1 green
    ["#38bdf8", "#0284c7"],   // lv2 blue
    ["#f472b6", "#db2777"],   // lv3 pink
    ["#fb923c", "#ea580c"],   // lv4 orange
    ["#a78bfa", "#7c3aed"],   // lv5 purple
    ["#fbbf24", "#d97706"],   // lv6 yellow
    ["#34d399", "#059669"],   // lv7 teal
  ];
  const [hd, tl] = snakeColors[(level - 1) % snakeColors.length];

  return (
    <GameShell title="Rắn Săn Mồi" emoji="🐍" score={score} highScore={highScore} color="from-green-500 to-emerald-600">
      <div className="flex flex-col items-center gap-3">
        {/* Level badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: hd }}>
            ⭐ LV {level}
          </div>
          <div className="text-xs text-gray-400">
            {LEVEL_FOOD[level] ? `${foodCount}/${LEVEL_FOOD[level]} 🍎 → Lv${level + 1}` : "MAX LEVEL!"}
          </div>
        </div>

        {/* Game board */}
        <div className="relative rounded-xl overflow-hidden border-2 shadow-2xl select-none"
          style={{ width: W, height: H, maxWidth: "100%", borderColor: hd, boxShadow: `0 0 20px ${hd}40` }}>
          {/* Dark BG with grid */}
          <div className="absolute inset-0" style={{ background: "#0a0e1a" }}>
            {/* Grid dots */}
            <svg width={W} height={H} className="absolute inset-0 opacity-20">
              {Array.from({ length: COLS + 1 }).map((_, c) =>
                Array.from({ length: ROWS + 1 }).map((_, r) => (
                  <circle key={`${r}-${c}`} cx={c * CELL} cy={r * CELL} r={0.8} fill="#334155" />
                ))
              )}
            </svg>
          </div>

          {/* Snake */}
          {snake.map(([r, c], i) => {
            const isHead = i === 0;
            const progress = i / snake.length;
            const color = isHead ? hd : `${tl}`;
            return (
              <div key={`s-${i}-${r}-${c}`}
                className="absolute transition-all duration-75 rounded-sm"
                style={{
                  left: c * CELL + 1, top: r * CELL + 1,
                  width: CELL - 2, height: CELL - 2,
                  background: isHead ? `linear-gradient(135deg, ${hd}, ${tl})` : color,
                  opacity: 0.9 - progress * 0.35,
                  boxShadow: isHead ? `0 0 8px ${hd}` : i < 3 ? `0 0 4px ${hd}60` : "none",
                  borderRadius: isHead ? "4px" : "2px",
                  zIndex: isHead ? 10 : 1,
                }}
              >
                {isHead && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px]">
                    {dir === "UP" ? "△" : dir === "DOWN" ? "▽" : dir === "LEFT" ? "◁" : "▷"}
                  </div>
                )}
              </div>
            );
          })}

          {/* Food */}
          <div
            className="absolute flex items-center justify-center text-sm animate-bounce"
            style={{ left: food[1] * CELL, top: food[0] * CELL, width: CELL, height: CELL, filter: "drop-shadow(0 0 6px gold)", zIndex: 5 }}>
            {FOOD_TYPES[foodType]}
          </div>

          {/* Level up overlay */}
          {levelUp && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              <div className="text-5xl mb-2">⬆️</div>
              <div className="font-black text-2xl text-white">LEVEL {level}!</div>
              <div className="text-sm mt-1" style={{ color: hd }}>Tốc độ tăng!</div>
            </div>
          )}

          {/* Dead overlay */}
          {dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ background: "rgba(0,0,0,0.85)" }}>
              <div className="text-5xl mb-3">💀</div>
              <div className="text-white font-black text-2xl">GAME OVER</div>
              <div className="text-gray-300 text-lg font-bold mt-1">{score} điểm</div>
              <div className="text-yellow-400 text-sm">Best: {highScore} | Lv {level}</div>
              <button onClick={() => { reset(); setRunning(true); }}
                className="mt-4 px-7 py-2.5 font-black text-white text-sm rounded-xl active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${hd}, ${tl})`, boxShadow: `0 4px 16px ${hd}60` }}>
                🔄 Chơi lại
              </button>
            </div>
          )}

          {!running && !dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="text-5xl mb-3">🐍</div>
              <button onClick={() => setRunning(true)}
                className="px-8 py-3 font-black text-white text-lg rounded-2xl active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${hd}, ${tl})`, boxShadow: `0 4px 20px ${hd}80` }}>
                ▶ BẮT ĐẦU
              </button>
              <div className="text-gray-400 text-xs mt-3">WASD / Mũi tên / D-pad</div>
            </div>
          )}
        </div>

        {/* Mobile D-pad */}
        <div className="grid gap-1 mt-1" style={{ gridTemplateColumns: "44px 44px 44px", gridTemplateRows: "44px 44px" }}>
          <div />
          <button onPointerDown={() => swipe("UP")}
            className="rounded-xl text-white font-black text-lg active:scale-90 transition-transform flex items-center justify-center"
            style={{ background: `${hd}30`, border: `1.5px solid ${hd}60`, touchAction: "none" }}>↑</button>
          <div />
          <button onPointerDown={() => swipe("LEFT")}
            className="rounded-xl text-white font-black text-lg active:scale-90 transition-transform flex items-center justify-center"
            style={{ background: `${hd}30`, border: `1.5px solid ${hd}60`, touchAction: "none" }}>←</button>
          <button onPointerDown={() => swipe("DOWN")}
            className="rounded-xl text-white font-black text-lg active:scale-90 transition-transform flex items-center justify-center"
            style={{ background: `${hd}30`, border: `1.5px solid ${hd}60`, touchAction: "none" }}>↓</button>
          <button onPointerDown={() => swipe("RIGHT")}
            className="rounded-xl text-white font-black text-lg active:scale-90 transition-transform flex items-center justify-center"
            style={{ background: `${hd}30`, border: `1.5px solid ${hd}60`, touchAction: "none" }}>→</button>
        </div>
        <p className="text-xs text-gray-500">WASD / Mũi tên để điều khiển</p>
      </div>
    </GameShell>
  );
}
