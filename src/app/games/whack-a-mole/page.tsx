"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const HOLES = 9;
const GAME_TIME = 30;

export default function WhackAMole() {
  const [holes, setHoles] = useState<boolean[]>(Array(HOLES).fill(false));
  const [splat, setSplat] = useState<boolean[]>(Array(HOLES).fill(false));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(1);
  const runRef = useRef(false);
  const scoreRef = useRef(0);

  const moleInterval = Math.max(350, 900 - level * 90);
  const moleShow = Math.max(450, 850 - level * 70);

  const start = () => {
    setScore(0); scoreRef.current = 0;
    setTimeLeft(GAME_TIME); setHoles(Array(HOLES).fill(false));
    setSplat(Array(HOLES).fill(false)); setRunning(true); runRef.current = true;
  };

  const whack = (i: number) => {
    if (!holes[i] || !runRef.current) return;
    setHoles(h => { const n = [...h]; n[i] = false; return n; });
    setSplat(s => { const n = [...s]; n[i] = true; return n; });
    setTimeout(() => setSplat(s => { const n = [...s]; n[i] = false; return n; }), 400);
    const pts = 10 * level;
    scoreRef.current += pts;
    setScore(scoreRef.current);
  };

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      if (!runRef.current) return;
      const idx = Math.floor(Math.random() * HOLES);
      setHoles(h => { const n = [...h]; n[idx] = true; return n; });
      setTimeout(() => setHoles(h => { const n = [...h]; n[idx] = false; return n; }), moleShow);
    }, moleInterval);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(spawn); clearInterval(timer);
          setRunning(false); runRef.current = false;
          setHoles(Array(HOLES).fill(false));
          setHighScore(h => Math.max(h, scoreRef.current));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(spawn); clearInterval(timer); };
  }, [running, moleInterval, moleShow]);

  return (
    <GameShell title="Đập Chuột" emoji="🎯" score={score} highScore={highScore} color="from-amber-400 to-orange-500">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="flex justify-between w-full px-2 items-center">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => !running && setLevel(i + 1)}
                className={`w-8 h-8 rounded-full text-xs font-black border-2 transition-all ${level === i + 1 ? "bg-orange-400 text-white border-orange-400" : "bg-white text-orange-400 border-orange-200"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className={`text-2xl font-black ${timeLeft <= 5 ? "text-red-500 animate-bounce" : "text-orange-500"}`}>
            ⏱ {timeLeft}s
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {holes.map((up, i) => (
            <motion.button key={i} onClick={() => whack(i)} whileTap={{ scale: 0.85 }}
              className="relative w-24 h-20 rounded-2xl overflow-hidden select-none cursor-pointer shadow-md"
              style={{ background: "radial-gradient(circle at 40% 30%, #a16207 0%, #78350f 60%, #451a03 100%)" }}>
              <div className="absolute bottom-0 inset-x-3 h-9 rounded-full opacity-90"
                style={{ background: "radial-gradient(ellipse at 50% 80%, #1c0a00 50%, transparent 100%)" }} />
              <AnimatePresence>
                {splat[i] && (
                  <motion.div className="absolute inset-0 flex items-center justify-center z-20"
                    initial={{ scale: 0, opacity: 1 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                    <span className="text-3xl">💥</span>
                  </motion.div>
                )}
                {up && (
                  <motion.div className="absolute inset-0 flex items-end justify-center pb-1 z-10"
                    initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ duration: 0.13 }}>
                    <span className="text-4xl drop-shadow-lg">🐹</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {!running && (
          <motion.div className="flex flex-col items-center gap-2">
            {timeLeft === 0 && (
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600">🏆 {score} điểm!</div>
                {score === highScore && score > 0 && <div className="text-sm text-amber-500 font-bold animate-bounce">✨ Kỷ lục mới!</div>}
              </div>
            )}
            <motion.button onClick={start} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-lg rounded-full shadow-lg">
              {timeLeft === 0 ? "🔄 Chơi lại" : "▶ BẮT ĐẦU"}
            </motion.button>
          </motion.div>
        )}
        <p className="text-xs text-amber-600/60">Click nhanh vào chuột chũi để ghi điểm!</p>
      </div>
    </GameShell>
  );
}
