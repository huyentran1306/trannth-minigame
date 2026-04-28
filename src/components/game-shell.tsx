"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${color} p-0.5`}>
        <div className="bg-[#0a0a0f] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Games</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h1 className={`font-black text-lg bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{title}</h1>
          </div>
          <div className="text-right">
            {score !== undefined && (
              <div className="text-xs text-gray-400">Score: <span className="text-white font-bold">{score}</span></div>
            )}
            {highScore !== undefined && (
              <div className="text-xs text-gray-500">Best: <span className="text-yellow-400 font-bold">{highScore}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
