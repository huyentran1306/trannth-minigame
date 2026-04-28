"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import GameShell from "@/components/game-shell";

const W = 320, H = 500;

interface Entity { x: number; y: number; w: number; h: number; }
interface Enemy extends Entity { hp: number; row: number; col: number; }
interface Bullet extends Entity { isEnemy?: boolean; }

export default function SpaceShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    player: { x: W / 2 - 16, y: H - 60, w: 32, h: 32 },
    bullets: [] as Bullet[], enemyBullets: [] as Bullet[],
    enemies: [] as Enemy[], stars: Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 })),
    score: 0, highScore: 0, frame: 0, running: false, dead: false, lives: 3,
    keys: {} as Record<string, boolean>, enemyDir: 1, shootCooldown: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, dead: false, running: false, lives: 3 });

  function spawnEnemies() {
    const enemies: Enemy[] = [];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 8; col++)
        enemies.push({ x: 20 + col * 35, y: 40 + row * 40, w: 28, h: 24, hp: 1, row, col });
    state.current.enemies = enemies;
  }

  const reset = useCallback(() => {
    const s = state.current;
    s.player.x = W / 2 - 16; s.player.y = H - 60;
    s.bullets = []; s.enemyBullets = []; s.score = 0; s.frame = 0; s.running = false; s.dead = false; s.lives = 3; s.enemyDir = 1;
    spawnEnemies();
    setUi(u => ({ ...u, score: 0, dead: false, running: false, lives: 3 }));
  }, []);

  useEffect(() => {
    spawnEnemies();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      const s = state.current;
      if (s.running && !s.dead) {
        s.frame++;
        const { player, bullets, enemyBullets, enemies, keys } = s;

        // Player movement
        if (keys["ArrowLeft"] || keys["a"]) player.x = Math.max(0, player.x - 4);
        if (keys["ArrowRight"] || keys["d"]) player.x = Math.min(W - player.w, player.x + 4);

        // Shoot
        if (s.shootCooldown > 0) s.shootCooldown--;
        if ((keys["ArrowUp"] || keys[" "]) && s.shootCooldown === 0) {
          bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12 });
          s.shootCooldown = 12;
        }

        // Move bullets
        for (const b of bullets) b.y -= 7;
        s.bullets = bullets.filter(b => b.y + b.h > 0);

        // Move enemy bullets
        for (const b of enemyBullets) b.y += 4;
        s.enemyBullets = enemyBullets.filter(b => b.y < H);

        // Move enemies
        const speed = 0.5 + (24 - enemies.length) * 0.05;
        if (s.frame % 2 === 0) {
          for (const e of enemies) e.x += s.enemyDir * speed;
          const maxX = Math.max(...enemies.map(e => e.x + e.w));
          const minX = Math.min(...enemies.map(e => e.x));
          if (maxX > W - 5 || minX < 5) {
            s.enemyDir *= -1;
            for (const e of enemies) e.y += 12;
          }
        }

        // Enemy shoot
        if (s.frame % 60 === 0 && enemies.length > 0) {
          const e = enemies[Math.floor(Math.random() * enemies.length)];
          enemyBullets.push({ x: e.x + e.w / 2 - 2, y: e.y + e.h, w: 4, h: 10, isEnemy: true });
        }

        // Hit detection: bullets vs enemies
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const e = s.enemies[j];
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
              s.bullets.splice(i, 1); s.enemies.splice(j, 1);
              s.score += 10; setUi(u => ({ ...u, score: s.score }));
              break;
            }
          }
        }

        // Hit detection: enemy bullets vs player
        for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
          const b = s.enemyBullets[i];
          if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
            s.enemyBullets.splice(i, 1); s.lives--;
            setUi(u => ({ ...u, lives: s.lives }));
            if (s.lives <= 0) { s.dead = true; s.highScore = Math.max(s.highScore, s.score); setUi(u => ({ ...u, dead: true, highScore: s.highScore })); }
          }
        }

        // Enemies reach bottom
        if (enemies.some(e => e.y + e.h > H - 50)) { s.dead = true; setUi(u => ({ ...u, dead: true })); }

        // Wave clear
        if (enemies.length === 0) { spawnEnemies(); s.score += 100; setUi(u => ({ ...u, score: s.score })); }
      }

      // Draw
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const star of state.current.stars) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + star.s * 0.2})`;
        ctx.beginPath(); ctx.arc(star.x, (star.y + state.current.frame * 0.3) % H, star.s * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      // Enemies
      const emojis = ["👾", "👽", "🤖"];
      for (const e of s.enemies) {
        ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(emojis[e.row % 3], e.x + e.w / 2, e.y + e.h / 2);
      }

      // Player
      ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🚀", s.player.x + s.player.w / 2, s.player.y + s.player.h / 2);

      // Bullets
      ctx.fillStyle = "#60a5fa";
      for (const b of s.bullets) { ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 8; ctx.fillRect(b.x, b.y, b.w, b.h); }
      ctx.fillStyle = "#f87171";
      for (const b of s.enemyBullets) { ctx.shadowColor = "#f87171"; ctx.shadowBlur = 6; ctx.fillRect(b.x, b.y, b.w, b.h); }
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { state.current.keys[e.key] = true; if (e.key === " ") e.preventDefault(); };
    const ku = (e: KeyboardEvent) => { state.current.keys[e.key] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const startOrShoot = () => {
    if (!state.current.running) { state.current.running = true; setUi(u => ({ ...u, running: true })); }
    else { state.current.keys[" "] = true; setTimeout(() => { state.current.keys[" "] = false; }, 50); }
  };

  return (
    <GameShell title="Bắn Súng" emoji="🚀" score={ui.score} highScore={ui.highScore} color="from-violet-500 to-purple-400">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 text-sm">{"❤️".repeat(ui.lives)}<span className="text-gray-500">{"🖤".repeat(Math.max(0, 3 - ui.lives))}</span></div>
        <div className="relative rounded-2xl overflow-hidden border border-violet-500/30 cursor-pointer"
          onClick={startOrShoot}>
          <canvas ref={canvasRef} width={W} height={H} className="block" style={{ maxWidth: "100%", maxHeight: "55vh" }} />
          {!ui.running && !ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80">
              <div className="text-6xl mb-3">🚀</div>
              <div className="text-white font-black text-2xl">SPACE SHOOTER</div>
              <div className="text-gray-300 text-sm mt-2">Tap to start</div>
            </div>
          )}
          {ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="text-4xl mb-2">💥</div>
              <div className="text-white font-black text-xl">GAME OVER</div>
              <div className="text-gray-300 text-sm mt-1">Score: {ui.score}</div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="mt-3 px-6 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm">Chơi lại</button>
            </div>
          )}
        </div>
        {/* Mobile controls */}
        <div className="flex gap-4 md:hidden">
          <button onPointerDown={() => { state.current.keys["ArrowLeft"] = true; }} onPointerUp={() => { state.current.keys["ArrowLeft"] = false; }}
            className="w-16 h-14 bg-violet-900/60 rounded-xl text-white text-2xl font-bold flex items-center justify-center active:bg-violet-700">←</button>
          <button onPointerDown={startOrShoot}
            className="w-20 h-14 bg-violet-600 rounded-xl text-white font-bold flex items-center justify-center active:bg-violet-500 text-sm">FIRE 🔫</button>
          <button onPointerDown={() => { state.current.keys["ArrowRight"] = true; }} onPointerUp={() => { state.current.keys["ArrowRight"] = false; }}
            className="w-16 h-14 bg-violet-900/60 rounded-xl text-white text-2xl font-bold flex items-center justify-center active:bg-violet-700">→</button>
        </div>
        <p className="text-xs text-gray-500 hidden md:block">←→ to move, Space/↑ to shoot</p>
      </div>
    </GameShell>
  );
}
