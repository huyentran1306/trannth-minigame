"use client";
import { useRef, useEffect, useState } from "react";
import GameShell from "@/components/game-shell";

const W = 300, H = 500, LANES = 4, LANE_W = 60, ROAD_X = (W - LANES * LANE_W) / 2;
const PLAYER_W = 36, PLAYER_H = 56, CAR_W = 36, CAR_H = 56;
const CAR_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#f472b6"];

export default function Racing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const state = useRef({
    playerLane: 1, targetLane: 1, playerX: 0,
    cars: [] as { x: number; y: number; color: string; lane: number }[],
    score: 0, frame: 0, speed: 2, running: false, dead: false, highScore: 0, level: 1,
    mouseX: 0,
  });
  const [ui, setUi] = useState({ score: 0, highScore: 0, dead: false, running: false, level: 1 });

  const INIT_X = ROAD_X + 1 * LANE_W + LANE_W / 2 - PLAYER_W / 2;

  const reset = () => {
    const s = state.current;
    s.playerLane = 1; s.targetLane = 1; s.playerX = INIT_X;
    s.cars = []; s.score = 0; s.frame = 0; s.speed = 2; s.running = false; s.dead = false;
    setUi(u => ({ ...u, score: 0, dead: false, running: false }));
  };

  function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, CAR_W, CAR_H, 8); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.roundRect(x + 5, y + 8, CAR_W - 10, 14, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 5, y + CAR_H - 22, CAR_W - 10, 14, 3); ctx.fill();
    ctx.fillStyle = "#1f2937";
    [[x - 3, y + 8], [x + CAR_W - 1, y + 8], [x - 3, y + CAR_H - 20], [x + CAR_W - 1, y + CAR_H - 20]].forEach(([wx, wy]) => {
      ctx.beginPath(); ctx.roundRect(wx, wy, 5, 12, 2); ctx.fill();
    });
    // Headlights
    ctx.fillStyle = "rgba(255,255,200,0.8)";
    ctx.beginPath(); ctx.arc(x + 8, y + 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + CAR_W - 8, y + 4, 3, 0, Math.PI * 2); ctx.fill();
  }

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    state.current.playerX = INIT_X;

    const loop = () => {
      const s = state.current;
      if (s.running && !s.dead) {
        s.frame++;
        s.score++;
        s.speed = 2 + (s.frame / 200) * s.level;

        // Smooth lane transition
        const targetX = ROAD_X + s.targetLane * LANE_W + LANE_W / 2 - PLAYER_W / 2;
        s.playerX += (targetX - s.playerX) * 0.18;

        // Spawn
        const interval = Math.max(35, 75 - s.level * 6);
        if (s.frame % interval === 0) {
          const lane = Math.floor(Math.random() * LANES);
          if (!s.cars.some(car => car.lane === lane && car.y < 120)) {
            s.cars.push({ x: ROAD_X + lane * LANE_W + LANE_W / 2 - CAR_W / 2, y: -CAR_H, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], lane });
          }
        }
        for (const car of s.cars) car.y += s.speed;
        s.cars = s.cars.filter(car => car.y < H + CAR_H);

        // Collision
        const py = H - PLAYER_H - 20;
        for (const car of s.cars) {
          if (s.playerX < car.x + CAR_W - 4 && s.playerX + PLAYER_W > car.x + 4 && py < car.y + CAR_H - 4 && py + PLAYER_H > car.y + 4) {
            s.dead = true;
            s.highScore = Math.max(s.highScore, s.score);
            setUi(u => ({ ...u, dead: true, score: s.score, highScore: s.highScore }));
            break;
          }
        }
      }

      // Draw sky/bg
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#bfdbfe"); sky.addColorStop(1, "#ddd6fe");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Grass
      ctx.fillStyle = "#86efac"; ctx.fillRect(0, 0, ROAD_X, H);
      ctx.fillRect(ROAD_X + LANES * LANE_W, 0, W - ROAD_X - LANES * LANE_W, H);

      // Road
      ctx.fillStyle = "#6b7280"; ctx.fillRect(ROAD_X, 0, LANES * LANE_W, H);

      // Moving stripes
      const stripeOff = (state.current.frame * state.current.speed) % 60;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (let y = -60; y < H + 60; y += 60) {
        for (let l = 1; l < LANES; l++) {
          ctx.fillRect(ROAD_X + l * LANE_W - 2, y + stripeOff, 4, 30);
        }
      }
      // Road edges
      ctx.fillStyle = "#fbbf24"; ctx.fillRect(ROAD_X - 5, 0, 5, H);
      ctx.fillRect(ROAD_X + LANES * LANE_W, 0, 5, H);

      // Enemy cars
      for (const car of state.current.cars) drawCar(ctx, car.x, car.y, car.color);

      // Player car (blue/purple)
      const py = H - PLAYER_H - 20;
      ctx.shadowColor = "#818cf8"; ctx.shadowBlur = 12;
      drawCar(ctx, state.current.playerX, py, "#818cf8");
      ctx.shadowBlur = 0;

      // Score & speed
      ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.textAlign = "left";
      ctx.fillText(`🏁 ${Math.floor(state.current.score / 10)}m`, 10, 26);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ui.level]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); s.targetLane = Math.max(0, s.targetLane - 1); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); s.targetLane = Math.min(LANES - 1, s.targetLane + 1); }
      if (!s.running && !s.dead) { s.running = true; setUi(u => ({ ...u, running: true })); }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, []);

  const handleTouch = (e: React.TouchEvent) => {
    const s = state.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) * (W / rect.width);
    s.targetLane = Math.min(LANES - 1, Math.max(0, Math.floor((x - ROAD_X) / LANE_W)));
    if (!s.running && !s.dead) { s.running = true; setUi(u => ({ ...u, running: true })); }
  };

  return (
    <GameShell title="Đua Xe" emoji="🚗" score={Math.floor(ui.score / 10)} highScore={Math.floor(ui.highScore / 10)} color="from-red-400 to-rose-500">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-red-400 font-semibold">Level:</span>
          {[1, 2, 3, 4, 5].map(l => (
            <button key={l} onClick={() => { setUi(u => ({ ...u, level: l })); state.current.level = l; reset(); }}
              className={`w-8 h-8 rounded-full font-black text-sm border-2 transition-all ${ui.level === l ? "bg-red-400 text-white border-red-400" : "bg-white text-red-400 border-red-200"}`}>{l}</button>
          ))}
        </div>
        <div className="relative rounded-2xl overflow-hidden border-2 border-rose-200 shadow-lg"
          onTouchMove={handleTouch} onTouchStart={handleTouch}>
          <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }} />
          {!ui.running && !ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(254,242,248,0.88)" }}>
              <div className="text-6xl mb-2">🚗</div>
              <div className="font-black text-2xl text-rose-600">ĐUA XE</div>
              <div className="text-rose-400 text-sm mt-1 mb-4">← → đổi làn · Né xe đối diện!</div>
              <button onClick={() => { state.current.running = true; setUi(u => ({ ...u, running: true })); }}
                className="px-8 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-full font-black text-lg shadow-lg">
                ▶ BẮT ĐẦU
              </button>
            </div>
          )}
          {ui.dead && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(254,242,248,0.92)" }}>
              <div className="text-5xl mb-2 animate-bounce">💥</div>
              <div className="font-black text-2xl text-rose-600">VA CHẠM!</div>
              <div className="text-rose-500 mt-1 text-xl font-bold">{Math.floor(ui.score / 10)}m</div>
              <button onClick={reset} className="mt-4 px-8 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-full font-black text-lg shadow-lg">
                🔄 Chơi lại
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-rose-400">← → / A D để đổi làn. Chạm màn hình để điều khiển</p>
      </div>
    </GameShell>
  );
}
