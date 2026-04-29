"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { usePlayer } from "@/contexts/player-context";
import { useEffect, useRef } from "react";

interface GameShellProps {
  title: string;
  emoji: string;
  score?: number;
  highScore?: number;
  color: string;
  children: React.ReactNode;
  onReset?: () => void;
  gameId?: string;
}

export default function GameShell({ title, emoji, score, highScore, color, children, onReset, gameId }: GameShellProps) {
  const { player, saveScore } = usePlayer();
  const prevScore = useRef(0);

  useEffect(() => {
    if (gameId && score !== undefined && score > prevScore.current && score > 0) {
      prevScore.current = score;
      saveScore(gameId, score);
    }
  }, [score, gameId, saveScore]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#fdf2f8 0%,#fce7f3 50%,#ede9fe 100%)" }}>
      <motion.div initial={{ y:-60,opacity:0 }} animate={{ y:0,opacity:1 }}
        transition={{ type:"spring",stiffness:200,damping:20 }}
        className="w-full px-3 py-2 flex items-center justify-between"
        style={{ background:"rgba(255,255,255,0.88)",backdropFilter:"blur(16px)",borderBottom:"1.5px solid rgba(255,255,255,0.95)",boxShadow:"0 2px 20px rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-1 font-bold text-sm transition-all hover:scale-105 active:scale-95 shrink-0" style={{color:"#a855f7"}}>
            <ArrowLeft size={15}/>
            <span className="hidden sm:inline">Home</span>
          </Link>
          {player && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold truncate max-w-[90px]"
              style={{background:"rgba(168,85,247,0.1)",color:"#7c3aed"}}>
              <span>{player.avatar}</span>
              <span className="truncate">{player.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.span animate={{rotate:[0,15,-15,0]}} transition={{duration:2,repeat:Infinity,repeatDelay:4}} className="text-xl">{emoji}</motion.span>
          <h1 className={`font-black text-base bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {(score !== undefined || highScore !== undefined) && (
            <div className="text-right">
              {score !== undefined && <div className={`text-xs font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>⭐ {score}</div>}
              {highScore !== undefined && highScore > 0 && <div className="text-xs text-purple-300 font-medium">🏆 {highScore}</div>}
            </div>
          )}
          {onReset && (
            <motion.button whileHover={{scale:1.1,rotate:-20}} whileTap={{scale:0.9}} onClick={onReset}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm bg-gradient-to-r ${color}`} title="Chơi lại">
              <RotateCcw size={14}/>
            </motion.button>
          )}
        </div>
      </motion.div>
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}
