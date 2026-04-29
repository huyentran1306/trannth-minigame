"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/contexts/player-context";

const AVATARS = ["🐱","🐰","🦊","🐼","🐸","🦋","🌸","⭐","🎀","🦄","🍭","🎮"];

export default function PlayerSetup() {
  const { setupPlayer } = usePlayer();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🎮");
  const [step, setStep] = useState<"name" | "avatar">("name");
  const [error, setError] = useState("");

  const handleNameNext = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Nhập tên đi bạn ơi! 🥺"); return; }
    if (trimmed.length > 16) { setError("Tên ngắn thôi nha (tối đa 16 chữ)!"); return; }
    setError("");
    setStep("avatar");
  };

  const handleStart = () => {
    setupPlayer(name.trim(), avatar);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #1e3a5f 100%)" }}>

      {/* Animated stars BG */}
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
            left: `${(i * 7 + 3) % 98}%`, top: `${(i * 11 + 5) % 95}%`,
            opacity: 0.3 + (i % 5) * 0.1,
            animation: `sparkle ${1.5 + i * 0.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
      ))}

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)" }} />

      <AnimatePresence mode="wait">
        {step === "name" ? (
          <motion.div key="name-step"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-sm text-center">

            {/* Logo */}
            <motion.div animate={{ rotate: [0, 10, -10, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="text-7xl mb-4 inline-block">🎮</motion.div>

            <h1 className="font-black text-4xl mb-1"
              style={{ background: "linear-gradient(135deg,#f472b6,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Kawaii Arcade
            </h1>
            <p className="text-purple-300 text-sm mb-8">20 mini games siêu cute ✨</p>

            {/* Name card */}
            <div className="rounded-3xl p-6 mb-4"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
              <p className="text-purple-200 font-semibold mb-4 text-sm">👋 Bạn tên là gì?</p>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleNameNext()}
                placeholder="Nhập tên của bạn..."
                maxLength={16}
                autoFocus
                className="w-full rounded-2xl px-4 py-3 text-center text-lg font-bold outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(167,139,250,0.4)",
                  color: "white",
                  caretColor: "#a78bfa",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(167,139,250,0.9)"}
                onBlur={e => e.target.style.borderColor = "rgba(167,139,250,0.4)"}
              />
              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-rose-400 text-xs mt-2 font-medium">{error}</motion.p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleNameNext}
              className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #3b82f6)", boxShadow: "0 0 32px rgba(168,85,247,0.4)" }}>
              Tiếp theo →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="avatar-step"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-sm text-center">

            <div className="text-5xl mb-2">{avatar}</div>
            <h2 className="font-black text-2xl text-white mb-1">Xin chào, {name}!</h2>
            <p className="text-purple-300 text-sm mb-6">Chọn avatar của bạn 🎨</p>

            <div className="rounded-3xl p-5 mb-4"
              style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(av => (
                  <motion.button key={av} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setAvatar(av)}
                    className="aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all"
                    style={{
                      background: avatar === av ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)",
                      border: avatar === av ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.08)",
                      boxShadow: avatar === av ? "0 0 16px rgba(168,85,247,0.5)" : "none",
                    }}>
                    {av}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setStep("name")}
                className="flex-1 py-4 rounded-2xl font-bold text-purple-300"
                style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
                ← Quay lại
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={handleStart}
                className="flex-[2] py-4 rounded-2xl font-black text-lg text-white shadow-2xl"
                style={{ background: "linear-gradient(135deg, #f472b6, #a855f7, #6366f1)", boxShadow: "0 0 32px rgba(244,114,182,0.4)" }}>
                🎮 Vào game!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
