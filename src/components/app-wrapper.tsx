"use client";
import { PlayerProvider, usePlayer } from "@/contexts/player-context";
import PlayerSetup from "@/components/player-setup";

function Inner({ children }: { children: React.ReactNode }) {
  const { player, isReady } = usePlayer();
  if (!isReady) return null;
  if (!player) return <PlayerSetup />;
  return <>{children}</>;
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <Inner>{children}</Inner>
    </PlayerProvider>
  );
}
