"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const SYMS = ["🍒", "🍋", "🍊", "🍇", "🍉", "💎", "⭐", "🎰"];

function spin3() {
  return Array.from({ length: 3 }, () => SYMS[Math.floor(Math.random() * SYMS.length)]);
}

function calcWin(reels: string[], bet: number): { mult: number; label: string } {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    if (reels[0] === "🎰") return { mult: 100, label: "🎰 JACKPOT!!!" };
    if (reels[0] === "💎") return { mult: 50, label: "💎 SIÊU THẮNG!" };
    if (reels[0] === "⭐") return { mult: 20, label: "⭐ BIG WIN!" };
    return { mult: 10, label: "🎉 WIN x10!" };
  }
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2])
    return { mult: 2, label: "✨ WIN x2" };
  return { mult: 0, label: "" };
}

export default function SlotMachine() {
  const [reels, setReels] = useState(["🍒", "🍋", "🍊"]);
  const [spinning, setSpinning] = useState(false);
  const [credits, setCredits] = useState(100);
  const [bet, setBet] = useState(5);
  const [result, setResult] = useState<{ mult: number; label: string } | null>(null);
  const [highScore, setHighScore] = useState(100);

  const doSpin = () => {
    if (spinning || credits < bet) return;
    setCredits(c => c - bet);
    setResult(null);
    setSpinning(true);
    const final = spin3();
    let frame = 0;
    const iv = setInterval(() => {
      frame++;
      setReels(spin3());
      if (frame >= 16) {
        clearInterval(iv);
        setReels(final);
        const w = calcWin(final, bet);
        setResult(w);
        if (w.mult > 0) {
          const won = bet * w.mult;
          setCredits(c => { const n = c + won; setHighScore(h => Math.max(h, n)); return n; });
        }
        setSpinning(false);
      }
    }, 55);
  };

  const reset = () => { setCredits(100); setResult(null); setReels(["🍒", "🍋", "🍊"]); };

  return (
    <GameShell title="Slot Machine" emoji="🎰" score={credits} highScore={highScore} color="from-yellow-400 to-orange-500">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <div className="w-full rounded-3xl p-5 shadow-xl border-4 border-yellow-300"
          style={{ background: "linear-gradient(160deg,#fef9c3,#fde68a)" }}>

          {/* Reels */}
          <div className="flex justify-center gap-2 mb-4">
            {reels.map((s, i) => (
              <motion.div key={i}
                className="w-20 h-20 rounded-2xl bg-white border-4 border-yellow-300 flex items-center justify-center text-5xl shadow-inner"
                animate={spinning ? { y: [-4, 4, -4] } : { y: 0 }}
                transition={{ duration: 0.12, repeat: spinning ? Infinity : 0 }}>
                {s}
              </motion.div>
            ))}
          </div>

          {/* Result flash */}
          <AnimatePresence>
            {result?.label && (
              <motion.div className="text-center font-black text-xl text-orange-600 mb-3"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                {result.label} <span className="text-green-600">(+{bet * result.mult})</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Credits */}
          <div className="text-center mb-3">
            <span className="text-3xl font-black text-yellow-700">💰 {credits}</span>
          </div>

          {/* Bet selector */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 5, 10, 25].map(b => (
              <button key={b} onClick={() => !spinning && setBet(b)}
                className={`px-3 py-1 rounded-full text-sm font-black border-2 transition-all ${bet === b ? "bg-orange-400 text-white border-orange-400" : "bg-white text-orange-500 border-orange-200 hover:bg-orange-50"}`}>
                {b}
              </button>
            ))}
          </div>

          <motion.button onClick={doSpin} disabled={spinning || credits < bet}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            className="w-full py-3 rounded-2xl font-black text-xl text-white shadow-lg disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
            {spinning ? "🎰 ĐANG QUAY..." : "🎰 QUAY!"}
          </motion.button>
        </div>

        {/* Paytable */}
        <div className="w-full rounded-2xl bg-white/70 border border-yellow-200 p-3 text-xs text-center text-yellow-700">
          <div className="font-black mb-1">Bảng thưởng</div>
          <div className="flex justify-around">
            <span>🎰🎰🎰 = x100</span>
            <span>💎💎💎 = x50</span>
            <span>⭐⭐⭐ = x20</span>
          </div>
          <div className="mt-1">3 giống = x10 · 2 giống = x2</div>
        </div>

        {credits === 0 && (
          <motion.button onClick={reset} initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-black shadow-lg">
            🔄 Chơi lại (100 credits)
          </motion.button>
        )}
      </div>
    </GameShell>
  );
}
