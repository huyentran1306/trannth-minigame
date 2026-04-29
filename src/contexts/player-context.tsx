"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface GameScore {
  best: number;
  plays: number;
  completed: boolean;
}

export interface PlayerData {
  name: string;
  avatar: string;
  scores: Record<string, GameScore>;
}

interface PlayerContextValue {
  player: PlayerData | null;
  isReady: boolean;
  setupPlayer: (name: string, avatar: string) => void;
  saveScore: (gameId: string, score: number) => void;
  getScore: (gameId: string) => GameScore | undefined;
  totalCompleted: number;
  resetPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
const STORAGE_KEY = "kawaii-arcade-player";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as PlayerData;
        if (data.name) setPlayer(data);
      }
    } catch {}
    setIsReady(true);
  }, []);

  const setupPlayer = useCallback((name: string, avatar: string) => {
    // Try to load existing data for this player
    const existing: PlayerData = { name, avatar, scores: {} };
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}-${name}`);
      if (raw) {
        const prev = JSON.parse(raw) as PlayerData;
        existing.scores = prev.scores || {};
      }
    } catch {}
    existing.avatar = avatar;
    setPlayer(existing);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    localStorage.setItem(`${STORAGE_KEY}-${name}`, JSON.stringify(existing));
  }, []);

  const saveScore = useCallback((gameId: string, score: number) => {
    setPlayer(prev => {
      if (!prev) return prev;
      const existing = prev.scores[gameId] || { best: 0, plays: 0, completed: false };
      const updated: PlayerData = {
        ...prev,
        scores: {
          ...prev.scores,
          [gameId]: {
            best: Math.max(existing.best, score),
            plays: existing.plays + 1,
            completed: true,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (prev.name) localStorage.setItem(`${STORAGE_KEY}-${prev.name}`, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getScore = useCallback((gameId: string) => {
    return player?.scores[gameId];
  }, [player]);

  const totalCompleted = Object.values(player?.scores || {}).filter(s => s.completed).length;

  const resetPlayer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayer(null);
  }, []);

  return (
    <PlayerContext.Provider value={{ player, isReady, setupPlayer, saveScore, getScore, totalCompleted, resetPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
