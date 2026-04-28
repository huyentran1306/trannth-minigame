"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const TOYS = ["🐻","🐰","🦊","🐸","🐱","🐶","🦁","🐼","🐨","🦄","🐯","🐮"];
const W = 300, H = 320;

interface Toy { id: number; x: number; y: number; emoji: string; }

function randomToys(): Toy[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i, x: 20 + Math.random() * (W - 60), y: H - 80 - Math.random() * 120,
    emoji: TOYS[Math.floor(Math.random() * TOYS.length)],
  }));
}

type Phase = "idle" | "moving" | "dropping" | "grabbing" | "raising" | "delivering";

export default function ClawMachine() {
  const [toys, setToys] = useState<Toy[]>(randomToys);
  const [clawX, setClawX] = useState(W / 2);
  const [clawY, setClawY] = useState(40);
  const [phase, setPhase] = useState<Phase>("idle");
  const [grabbed, setGrabbed] = useState<Toy | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(5);
  const [msg, setMsg] = useState("");
  const moveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const startMove = (dir: "left" | "right") => {
    if (phase !== "idle") return;
    moveInterval.current = setInterval(() => {
      setClawX(x => Math.max(20, Math.min(W - 30, x + (dir === "left" ? -4 : 4))));
    }, 30);
  };

  const stopMove = () => {
    if (moveInterval.current) { clearInterval(moveInterval.current); moveInterval.current = null; }
  };

  const drop = async () => {
    if (phase !== "idle" || coins <= 0) return;
    setCoins(c => c - 1);
    setPhase("dropping");

    // Animate claw down
    let y = 40;
    const dropInterval = setInterval(() => {
      y += 5;
      setClawY(y);
      if (y >= H - 80) {
        clearInterval(dropInterval);
        // Check grab
        const hit = toys.find(t => Math.abs(t.x - clawX) < 30 && Math.abs(t.y - y) < 35);
        if (hit && Math.random() > 0.35) {
          setGrabbed(hit);
          setToys(ts => ts.filter(t => t.id !== hit.id));
          setPhase("raising");
          let ry = y;
          const raiseInterval = setInterval(() => {
            ry -= 5; setClawY(ry);
            if (ry <= 40) {
              clearInterval(raiseInterval);
              setPhase("delivering");
              setTimeout(() => {
                setGrabbed(null); setClawY(40);
                setScore(s => { const ns = s + 50; setHighScore(h => Math.max(h, ns)); return ns; });
                showMsg("🎉 Got it! +50pts");
                setPhase("idle");
              }, 600);
            }
          }, 20);
        } else {
          showMsg(hit ? "😅 Slipped away!" : "❌ Miss!");
          setPhase("raising");
          let ry = y;
          const raiseInterval = setInterval(() => {
            ry -= 5; setClawY(ry);
            if (ry <= 40) { clearInterval(raiseInterval); setPhase("idle"); }
          }, 20);
        }
      }
    }, 20);
  };

  return (
    <GameShell title="Gắp Thú" emoji="🧸" score={score} highScore={highScore} color="from-pink-500 to-rose-400">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        {/* Machine */}
        <div className="relative rounded-2xl overflow-hidden border-4 border-pink-500/40 bg-gradient-to-b from-pink-950 to-purple-950"
          style={{ width: W, height: H + 60 }}>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-pink-900/80 flex items-center justify-between px-3 border-b border-pink-700/50">
            <span className="text-yellow-400 font-black text-sm">🪙 {coins}</span>
            <span className="text-white font-bold text-xs">CLAW MACHINE</span>
            <span className="text-green-400 font-bold text-sm">🎯 {score}</span>
          </div>

          {/* Play area */}
          <div className="absolute" style={{ top: 48, left: 0, right: 0, bottom: 50 }}>
            {/* Claw rope */}
            <div className="absolute w-0.5 bg-gray-400/50" style={{ left: clawX - 1, top: 0, height: clawY }} />

            {/* Claw */}
            <motion.div className="absolute text-2xl" style={{ left: clawX - 16, top: clawY - 10 }}
              animate={{ rotate: phase === "grabbing" ? [-10, 10, -5, 5, 0] : 0 }}>
              🪝
            </motion.div>

            {/* Grabbed toy (moves with claw) */}
            {grabbed && (
              <div className="absolute text-2xl" style={{ left: clawX - 16, top: clawY + 10 }}>
                {grabbed.emoji}
              </div>
            )}

            {/* Toys on ground */}
            {toys.map(toy => (
              <div key={toy.id} className="absolute text-2xl select-none" style={{ left: toy.x, top: toy.y - 48 }}>
                {toy.emoji}
              </div>
            ))}
          </div>

          {/* Ground */}
          <div className="absolute bottom-10 left-0 right-0 h-px bg-pink-700/40" />

          {/* Prize slot */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-pink-900/60 flex items-center justify-center border-t border-pink-700/50">
            <span className="text-xs text-pink-300">🎁 Prize Slot</span>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-lg font-black text-yellow-400 text-center">{msg}</motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          <button onPointerDown={() => startMove("left")} onPointerUp={stopMove} onPointerLeave={stopMove}
            className="w-14 h-14 bg-pink-800/60 rounded-2xl text-2xl font-bold flex items-center justify-center active:bg-pink-600 select-none">←</button>
          <button onClick={drop} disabled={phase !== "idle" || coins <= 0}
            className="w-16 h-16 bg-gradient-to-b from-pink-500 to-rose-600 rounded-2xl text-white font-black text-sm flex flex-col items-center justify-center active:scale-95 disabled:opacity-40 transition-all select-none">
            <span className="text-lg">⬇️</span>DROP
          </button>
          <button onPointerDown={() => startMove("right")} onPointerUp={stopMove} onPointerLeave={stopMove}
            className="w-14 h-14 bg-pink-800/60 rounded-2xl text-2xl font-bold flex items-center justify-center active:bg-pink-600 select-none">→</button>
        </div>

        {coins === 0 && (
          <button onClick={() => { setCoins(5); setToys(randomToys()); }}
            className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold text-sm">
            🪙 Add 5 Coins
          </button>
        )}
      </div>
    </GameShell>
  );
}
