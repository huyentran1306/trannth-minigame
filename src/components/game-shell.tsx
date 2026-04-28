"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface GameShellProps {
  title: string;
  emoji: string;
  score?: number;
  highScore?: number;
  color: string;
  children: React.ReactNode;
  onReset?: () => void;
}

export default function GameShell({ title, emoji, score, highScore, color, children, onReset }: GameShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 50%, #ede9fe 100%)" }}>

      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
      >
        <Link href="/" className={`flex items-center gap-1.5 font-semibold text-sm transition-all hover:scale-105 active:scale-95 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          <ArrowLeft size={16} className="text-pink-400" />
          <span>Trang chủ</span>
        </Link>

        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="text-2xl"
          >{emoji}</motion.span>
          <h1 className={`font-black text-lg bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {(score !== undefined || highScore !== undefined) && (
            <div className="text-right">
              {score !== undefined && (
                <div className={`text-xs font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                  ⭐ {score}
                </div>
              )}
              {highScore !== undefined && (
                <div className="text-xs text-purple-300 font-medium">
                  🏆 {highScore}
                </div>
              )}
            </div>
          )}
          {onReset && (
            <button onClick={onReset}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-110 active:scale-90 shadow-sm bg-gradient-to-r ${color}`}
              title="Chơi lại">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Game Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
