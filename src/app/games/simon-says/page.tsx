"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const COLORS = [
  { id: "r", emoji: "❤️", bg: "#fca5a5", active: "#ef4444", label: "Đỏ" },
  { id: "b", emoji: "💙", bg: "#93c5fd", active: "#3b82f6", label: "Xanh" },
  { id: "g", emoji: "💚", bg: "#86efac", active: "#22c55e", label: "Lá" },
  { id: "y", emoji: "💛", bg: "#fde047", active: "#eab308", label: "Vàng" },
];

type Phase = "idle" | "showing" | "input" | "fail" | "success";

export default function SimonSays() {
  const [seq, setSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [userIdx, setUserIdx] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [flashMsg, setFlashMsg] = useState("");
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seqRef = useRef<number[]>([]);

  const clearTo = () => { timeouts.current.forEach(clearTimeout); timeouts.current = []; };

  const showSeq = useCallback((s: number[]) => {
    setPhase("showing");
    clearTo();
    const delay = 700;
    s.forEach((c, i) => {
      const t1 = setTimeout(() => setActive(c), delay + i * 750);
      const t2 = setTimeout(() => setActive(null), delay + i * 750 + 500);
      timeouts.current.push(t1, t2);
    });
    const t3 = setTimeout(() => { setPhase("input"); setUserIdx(0); }, delay + s.length * 750 + 300);
    timeouts.current.push(t3);
  }, []);

  const start = () => {
    clearTo();
    const first = [Math.floor(Math.random() * 4)];
    seqRef.current = first;
    setSeq(first); setFlashMsg("");
    showSeq(first);
  };

  const press = (ci: number) => {
    if (phase !== "input") return;
    setActive(ci);
    setTimeout(() => setActive(null), 180);

    if (ci !== seqRef.current[userIdx]) {
      clearTo();
      setPhase("fail");
      setHighScore(h => Math.max(h, seqRef.current.length - 1));
      setFlashMsg("Sai rồi! 😢");
      return;
    }
    const next = userIdx + 1;
    if (next === seqRef.current.length) {
      setFlashMsg("✅ Xuất sắc!");
      setPhase("success");
      const nextSeq = [...seqRef.current, Math.floor(Math.random() * 4)];
      seqRef.current = nextSeq;
      setSeq(nextSeq);
      const t = setTimeout(() => { setFlashMsg(""); showSeq(nextSeq); }, 900);
      timeouts.current.push(t);
    } else {
      setUserIdx(next);
    }
  };

  const score = seq.length > 1 ? seq.length - 1 : 0;

  return (
    <GameShell title="Simon Says" emoji="💡" score={score} highScore={highScore} color="from-blue-400 to-cyan-400">
      <div className="flex flex-col items-center gap-5 w-full max-w-xs">
        <div className="text-center min-h-[52px]">
          <div className="text-base font-black text-blue-700">
            {phase === "idle" && "Nhớ chuỗi màu và lặp lại!"}
            {phase === "showing" && "👀 Ghi nhớ..."}
            {phase === "input" && `🖱️ Lặp lại: ${userIdx + 1} / ${seqRef.current.length}`}
            {phase === "fail" && "💔 Sai rồi!"}
          </div>
          <AnimatePresence>
            {flashMsg && (
              <motion.div className="font-black text-xl text-green-500 mt-1"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                {flashMsg}
              </motion.div>
            )}
          </AnimatePresence>
          {phase !== "idle" && phase !== "fail" && (
            <div className="text-sm text-blue-400 mt-1 font-semibold">Chuỗi: <span className="font-black text-blue-600">{seqRef.current.length}</span></div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {COLORS.map((c, i) => (
            <motion.button key={c.id} onClick={() => press(i)}
              disabled={phase !== "input"}
              whileTap={{ scale: 0.88 }}
              className="w-32 h-32 rounded-3xl font-black text-5xl flex flex-col items-center justify-center gap-1.5 shadow-lg border-4 transition-all duration-100 select-none"
              style={{
                background: active === i ? c.active : c.bg,
                borderColor: active === i ? "white" : "rgba(255,255,255,0.6)",
                boxShadow: active === i ? `0 0 40px ${c.active}90, inset 0 0 20px rgba(255,255,255,0.3)` : "0 4px 16px rgba(0,0,0,0.1)",
                transform: active === i ? "scale(1.1)" : undefined,
              }}>
              {c.emoji}
              <span className="text-sm font-black text-white drop-shadow">{c.label}</span>
            </motion.button>
          ))}
        </div>

        {(phase === "idle" || phase === "fail") && (
          <motion.button onClick={start} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-black text-lg rounded-full shadow-lg mt-1">
            {phase === "fail" ? `🔄 Chơi lại` : "▶ BẮT ĐẦU"}
          </motion.button>
        )}
        <p className="text-xs text-blue-400/70">Chú ý thứ tự các màu và nhấn lại đúng!</p>
      </div>
    </GameShell>
  );
}
