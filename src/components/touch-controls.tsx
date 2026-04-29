"use client";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface DPadProps {
  onPress: (dir: Dir) => void;
  size?: "sm" | "md";
}

export function DPad({ onPress, size = "md" }: DPadProps) {
  const btnSize = size === "sm" ? "w-12 h-12" : "w-14 h-14";
  const iconSize = size === "sm" ? 20 : 24;

  const Btn = ({ dir, icon }: { dir: Dir; icon: React.ReactNode }) => (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onTouchStart={e => { e.preventDefault(); onPress(dir); }}
      onClick={() => onPress(dir)}
      className={`${btnSize} rounded-2xl flex items-center justify-center text-white font-black select-none active:scale-90`}
      style={{ background: "rgba(139,92,246,0.7)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
      aria-label={dir}>
      {icon}
    </motion.button>
  );

  return (
    <div className="flex flex-col items-center gap-1" style={{ touchAction: "none" }}>
      <Btn dir="UP" icon={<ChevronUp size={iconSize} />} />
      <div className="flex gap-1">
        <Btn dir="LEFT" icon={<ChevronLeft size={iconSize} />} />
        <div className={`${btnSize} rounded-2xl`} style={{ background: "rgba(139,92,246,0.15)", border: "1.5px solid rgba(139,92,246,0.2)" }} />
        <Btn dir="RIGHT" icon={<ChevronRight size={iconSize} />} />
      </div>
      <Btn dir="DOWN" icon={<ChevronDown size={iconSize} />} />
    </div>
  );
}

interface TouchButtonsProps {
  buttons: Array<{ label: string; onPress: () => void; color?: string }>;
}

export function TouchButtons({ buttons }: TouchButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {buttons.map(btn => (
        <motion.button key={btn.label} whileTap={{ scale: 0.88 }}
          onTouchStart={e => { e.preventDefault(); btn.onPress(); }}
          onClick={btn.onPress}
          className="px-5 py-4 rounded-2xl font-black text-white text-sm select-none"
          style={{ background: btn.color || "rgba(139,92,246,0.75)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)", boxShadow: "0 4px 14px rgba(0,0,0,0.3)", minWidth: "56px", touchAction: "none" }}>
          {btn.label}
        </motion.button>
      ))}
    </div>
  );
}
