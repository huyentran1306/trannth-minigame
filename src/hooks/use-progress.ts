"use client";
import { useState, useEffect, useCallback } from "react";

export interface GameProgress {
  bestScore: number;
  level: number;
  completed: boolean;
  playCount: number;
}

export type ProgressMap = Record<string, GameProgress>;

const KEY = "kawaii-arcade-progress";

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
  }, []);

  const save = useCallback((gameId: string, score: number, level = 1) => {
    setProgress(prev => {
      const ex = prev[gameId] || { bestScore: 0, level: 0, completed: false, playCount: 0 };
      const next: GameProgress = {
        bestScore: Math.max(ex.bestScore, score),
        level: Math.max(ex.level, level),
        completed: true,
        playCount: ex.playCount + 1,
      };
      const updated = { ...prev, [gameId]: next };
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const getProgress = useCallback((gameId: string): GameProgress =>
    progress[gameId] || { bestScore: 0, level: 0, completed: false, playCount: 0 },
  [progress]);

  const totalCompleted = Object.values(progress).filter(p => p.completed).length;

  return { progress, save, getProgress, totalCompleted };
}
