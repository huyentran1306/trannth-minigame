"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { usePlayer } from "@/contexts/player-context";

interface GameProgress { bestScore: number; completed: boolean; }

const GAMES = [
  { id: "gem-crush",     name: "Kim Cương",     emoji: "💎", desc: "Match gems & score!", tag: "PUZZLE",   color: "from-blue-400 to-cyan-400",     border: "border-blue-200",  glow: "#60a5fa", stars: 2 },
  { id: "claw-machine",  name: "Gắp Thú",       emoji: "🧸", desc: "Grab the cutest toy!", tag: "ARCADE",   color: "from-pink-400 to-rose-400",     border: "border-pink-200",  glow: "#f472b6", stars: 2 },
  { id: "space-shooter", name: "Bắn Súng",      emoji: "��", desc: "Blast the invaders!", tag: "SHOOTER",  color: "from-violet-400 to-purple-400", border: "border-violet-200",glow: "#a78bfa", stars: 3 },
  { id: "snake",         name: "Rắn Săn Mồi",   emoji: "🐍", desc: "Eat & grow longer!",  tag: "CLASSIC",  color: "from-green-400 to-emerald-400", border: "border-green-200", glow: "#4ade80", stars: 1 },
  { id: "tetris",        name: "Tetris",         emoji: "🟦", desc: "Stack & clear lines!",tag: "PUZZLE",   color: "from-yellow-400 to-orange-400", border: "border-yellow-200",glow: "#facc15", stars: 3 },
  { id: "flappy-bird",   name: "Chim Bay",       emoji: "🐦", desc: "Tap to fly!",         tag: "CASUAL",   color: "from-sky-400 to-blue-400",      border: "border-sky-200",   glow: "#38bdf8", stars: 2 },
  { id: "2048",          name: "2048",           emoji: "✨", desc: "Merge to 2048!",       tag: "PUZZLE",   color: "from-orange-400 to-amber-400",  border: "border-orange-200",glow: "#fb923c", stars: 3 },
  { id: "minesweeper",   name: "Dò Mìn",         emoji: "💣", desc: "Defuse the mines!",   tag: "STRATEGY", color: "from-red-400 to-rose-400",      border: "border-red-200",   glow: "#f87171", stars: 4 },
  { id: "breakout",      name: "Bắn Gạch",       emoji: "🧱", desc: "Break all bricks!",   tag: "ARCADE",   color: "from-teal-400 to-cyan-400",     border: "border-teal-200",  glow: "#2dd4bf", stars: 2 },
  { id: "pac-man",       name: "Ăn Điểm",        emoji: "👾", desc: "Eat dots, dodge ghosts!", tag: "CLASSIC",color:"from-indigo-400 to-violet-400",border:"border-indigo-200",glow:"#818cf8", stars: 3 },
  { id: "whack-a-mole",  name: "Đập Chuột",      emoji: "🎯", desc: "Hit those moles!",     tag: "ARCADE",   color: "from-amber-400 to-orange-500",  border: "border-amber-200", glow: "#fbbf24", stars: 1, isNew: true },
  { id: "slot-machine",  name: "Slot Machine",   emoji: "🎰", desc: "Spin to win!",         tag: "CASINO",   color: "from-yellow-400 to-orange-500", border: "border-yellow-200",glow: "#facc15", stars: 1, isNew: true },
  { id: "simon-says",    name: "Simon Says",     emoji: "💡", desc: "Remember the sequence!", tag: "MEMORY", color: "from-blue-400 to-cyan-400",     border: "border-blue-200",  glow: "#60a5fa", stars: 3, isNew: true },
  { id: "pong",          name: "Pong",           emoji: "🏓", desc: "Classic paddle duel!",  tag: "CLASSIC",  color: "from-violet-400 to-pink-400",   border: "border-violet-200",glow: "#c084fc", stars: 2, isNew: true },
  { id: "racing",        name: "Đua Xe",         emoji: "🚗", desc: "Dodge the traffic!",    tag: "RACING",   color: "from-red-400 to-rose-500",      border: "border-red-200",   glow: "#f87171", stars: 2, isNew: true },
  { id: "sokoban",       name: "Sokoban",        emoji: "⬜", desc: "Push boxes to goals!",  tag: "PUZZLE",   color: "from-amber-400 to-yellow-400",  border: "border-amber-200", glow: "#fbbf24", stars: 4, isNew: true },
  { id: "tam-cuc",       name: "Bài Tam Cúc",    emoji: "🃏", desc: "Vietnamese card duel!", tag: "CARD",     color: "from-red-500 to-pink-400",      border: "border-red-200",   glow: "#f87171", stars: 2, isNew: true },
  { id: "basketball",    name: "Ném Bóng",       emoji: "🏀", desc: "Shoot hoops!",          tag: "CASUAL",   color: "from-orange-400 to-red-400",    border: "border-orange-200",glow: "#fb923c", stars: 2, isNew: true },
  { id: "bubble-shooter",name: "Bắn Bong Bóng",  emoji: "🔮", desc: "Pop 3+ bubbles!",       tag: "PUZZLE",   color: "from-pink-400 to-fuchsia-500",  border: "border-pink-200",  glow: "#e879f9", stars: 3, isNew: true },
  { id: "pinball",       name: "Pinball",        emoji: "⚙️", desc: "Flipper action!",       tag: "ARCADE",   color: "from-violet-500 to-purple-600", border: "border-violet-200",glow: "#a78bfa", stars: 4, isNew: true },
];

const ALL_TAGS = ["Tất cả", "PUZZLE", "ARCADE", "CLASSIC", "CASUAL", "SHOOTER", "STRATEGY", "MEMORY", "RACING", "CARD", "CASINO"];
const FLOATING = ["🌸","⭐","🌈","💫","🎀","🍬","🌙","✨","🎠","🦋","🎵","🌺","🍭","🎪","🦄"];

export default function Home() {
  const [filter, setFilter] = useState("Tất cả");
  const [showChallenge, setShowChallenge] = useState(false);
  const { player, totalCompleted, resetPlayer } = usePlayer();

  const progress = player?.scores || {};
  const completed = totalCompleted;
  const filtered = filter === "Tất cả" ? GAMES : GAMES.filter(g => g.tag === filter);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(135deg,#fdf2f8 0%,#fce7f3 40%,#ede9fe 100%)" }}>
      {/* Floating BG */}
      {FLOATING.map((icon, i) => (
        <div key={i} className="fixed pointer-events-none select-none opacity-20"
          style={{ fontSize: `${16 + (i % 3) * 8}px`, left: `${(i * 7 + 3) % 96}%`, top: `${(i * 13 + 5) % 92}%`,
            animation: `float ${3 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }}>
          {icon}
        </div>
      ))}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full opacity-40 pointer-events-none" style={{ background: "radial-gradient(circle,#fbcfe8,transparent 70%)" }} />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle,#c4b5fd,transparent 70%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* HERO */}
        <motion.div initial={{ opacity:0, y:-30 }} animate={{ opacity:1, y:0 }}
          transition={{ type:"spring", stiffness:150, damping:15 }} className="text-center mb-8">
          <motion.div animate={{ rotate:[0,10,-10,8,0] }} transition={{ duration:2, repeat:Infinity, repeatDelay:4 }}
            className="text-6xl mb-3 inline-block">🎮</motion.div>
          <h1 className="font-black leading-tight mb-2" style={{
            fontSize:"clamp(2.5rem,8vw,5rem)",
            background:"linear-gradient(135deg,#ec4899,#8b5cf6,#3b82f6)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
          }}>Kawaii Arcade</h1>
          <p className="text-lg text-purple-400 font-medium">20 mini games siêu cute ✨</p>
          {player && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(168,85,247,0.2)" }}>
                <span className="text-xl">{player.avatar}</span>
                <span className="font-black text-purple-700 text-sm">{player.name}</span>
                <span className="text-xs text-purple-400 font-semibold">{completed}/20</span>
              </div>
              <button onClick={resetPlayer} className="text-xs text-purple-300 hover:text-purple-500 transition-colors font-medium px-3 py-2 rounded-full hover:bg-white/50">
                Đổi tên
              </button>
            </div>
          )}
        </motion.div>

        {/* GRAND CHALLENGE BANNER */}
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.3, type:"spring" }}
          className="mb-8 rounded-3xl overflow-hidden shadow-xl cursor-pointer relative"
          style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)" }}
          onClick={() => setShowChallenge(true)}>
          {/* Stars */}
          {[...Array(8)].map((_,i) => (
            <div key={i} className="absolute text-white/20 pointer-events-none"
              style={{ left:`${(i*13+5)%90}%`, top:`${(i*17+10)%80}%`, fontSize:`${8+i%3*6}px`,
                animation:`float ${2+i*0.4}s ease-in-out infinite`, animationDelay:`${i*0.3}s` }}>⭐</div>
          ))}
          <div className="relative p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏆</span>
                <span className="font-black text-white text-xl">Grand Challenge</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">EPIC</span>
              </div>
              <p className="text-purple-200 text-sm">Chinh phục tất cả 20 games để trở thành Arcade Master!</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden max-w-48">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400"
                    initial={{ width:0 }} animate={{ width:`${(completed/20)*100}%` }} transition={{ duration:1, delay:0.5 }} />
                </div>
                <span className="text-white font-bold text-sm">{completed}/20</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl mb-1">🗺️</div>
              <div className="text-xs font-bold px-4 py-2 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 transition-all">
                Xem lộ trình →
              </div>
            </div>
          </div>
        </motion.div>

        {/* Challenge Modal */}
        {showChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowChallenge(false)}>
            <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🏆</div>
                <h2 className="font-black text-2xl text-purple-700">Grand Challenge</h2>
                <p className="text-sm text-purple-400 mt-1">{completed}/20 games hoàn thành</p>
                <div className="h-3 bg-purple-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700" style={{ width:`${(completed/20)*100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GAMES.map(g => {
                  const done = progress[g.id]?.completed;
                  return (
                     <Link key={g.id} href={`/games/${g.id}`} onClick={() => setShowChallenge(false)}
                      className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all hover:scale-105 ${done ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                      <span className="text-2xl">{g.emoji}</span>
                      {done && <span className="text-xs text-green-600 font-bold">✓</span>}
                      {!done && <span className="text-xs text-gray-300">···</span>}
                    </Link>
                  );
                })}
              </div>
              {completed === 20 && (
                <div className="mt-4 text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                  <div className="text-4xl">🎖️</div>
                  <div className="font-black text-xl text-orange-600">ARCADE MASTER!</div>
                  <div className="text-sm text-orange-400">Bạn đã chinh phục tất cả 20 games!</div>
                </div>
              )}
              <button onClick={() => setShowChallenge(false)} className="mt-4 w-full py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-2xl font-black">Đóng</button>
            </motion.div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          {ALL_TAGS.map(tag => (
            <button key={tag} onClick={() => setFilter(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${filter===tag ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white border-transparent shadow-lg scale-105" : "bg-white/70 text-purple-500 border-purple-100 hover:border-purple-300"}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <motion.div variants={{ hidden:{opacity:0}, show:{opacity:1,transition:{staggerChildren:0.05}} }} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(game => {
            const prog = progress[game.id];
            const done = prog?.completed;
            return (
              <motion.div key={game.id} variants={{ hidden:{opacity:0,y:30,scale:0.85}, show:{opacity:1,y:0,scale:1,transition:{type:"spring",stiffness:200,damping:18}} }}>
                <Link href={`/games/${game.id}`} className="block group h-full">
                  <div className={`relative rounded-3xl border-2 ${game.border} bg-white/80 backdrop-blur shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 overflow-hidden h-full`}
                    style={{ "--glow": game.glow } as React.CSSProperties}>
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
                      style={{ boxShadow:`0 0 24px ${game.glow}44, inset 0 0 24px ${game.glow}11` }} />
                    {/* New badge */}
                    {(game as {isNew?:boolean}).isNew && !done && (
                      <div className="absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md z-10">NEW</div>
                    )}
                    {done && (
                      <div className="absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-md z-10">✓ Done</div>
                    )}
                    <div className={`h-20 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                      <motion.span className="text-5xl" whileHover={{ scale:1.2, rotate:10 }} transition={{ type:"spring", stiffness:300 }}>{game.emoji}</motion.span>
                    </div>
                    <div className="p-3">
                      <div className="font-black text-gray-800 text-sm leading-tight">{game.name}</div>
                      <div className="text-gray-400 text-xs mt-0.5 leading-tight line-clamp-2">{game.desc}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_,i) => (
                            <span key={i} className={`text-xs ${i < game.stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                          ))}
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-400">{game.tag}</span>
                      </div>
                      {prog?.best ? (
                        <div className="mt-1 text-xs text-green-600 font-bold">🏅 {prog.best} pts</div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }} className="text-center mt-12 pb-6">
          <div className="text-4xl mb-2">🌸</div>
          <p className="text-purple-300 text-sm font-medium">Kawaii Arcade • 20 Games • Have Fun! ✨</p>
        </motion.div>
      </div>
    </div>
  );
}
