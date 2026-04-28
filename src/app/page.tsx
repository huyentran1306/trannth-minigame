"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const GAMES = [
  { id: "gem-crush", name: "Kim Cương", emoji: "💎", desc: "Match-3 puzzle gem game", color: "from-blue-500 to-cyan-400", bg: "bg-blue-950", tag: "PUZZLE" },
  { id: "claw-machine", name: "Gắp Thú", emoji: "🧸", desc: "Claw machine arcade", color: "from-pink-500 to-rose-400", bg: "bg-pink-950", tag: "ARCADE" },
  { id: "space-shooter", name: "Bắn Súng", emoji: "🚀", desc: "Space Invaders style shooter", color: "from-violet-500 to-purple-400", bg: "bg-violet-950", tag: "SHOOTER" },
  { id: "snake", name: "Rắn Săn Mồi", emoji: "🐍", desc: "Classic snake game", color: "from-green-500 to-emerald-400", bg: "bg-green-950", tag: "CLASSIC" },
  { id: "tetris", name: "Tetris", emoji: "🟦", desc: "Block stacking puzzle", color: "from-yellow-500 to-orange-400", bg: "bg-yellow-950", tag: "PUZZLE" },
  { id: "flappy-bird", name: "Chim Bay", emoji: "🐦", desc: "Flappy Bird style game", color: "from-sky-500 to-blue-400", bg: "bg-sky-950", tag: "CASUAL" },
  { id: "2048", name: "2048", emoji: "🔢", desc: "Number merge puzzle", color: "from-orange-500 to-amber-400", bg: "bg-orange-950", tag: "PUZZLE" },
  { id: "minesweeper", name: "Dò Mìn", emoji: "💣", desc: "Classic minesweeper", color: "from-red-500 to-rose-400", bg: "bg-red-950", tag: "STRATEGY" },
  { id: "breakout", name: "Bắn Gạch", emoji: "🧱", desc: "Brick breaker arcade", color: "from-teal-500 to-cyan-400", bg: "bg-teal-950", tag: "ARCADE" },
  { id: "pac-man", name: "Ăn Điểm", emoji: "👾", desc: "Pac-Man maze game", color: "from-indigo-500 to-violet-400", bg: "bg-indigo-950", tag: "CLASSIC" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Floating orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
            10 Games Available
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
            RETRO<br className="md:hidden" /> ARCADE
          </h1>
          <p className="text-gray-400 text-lg">Những trò chơi kinh điển thời 9x — UI đẹp, chơi cực đã! 🎮</p>
        </motion.div>

        {/* Game Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
        >
          {GAMES.map((game) => (
            <motion.div key={game.id} variants={item} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.97 }}>
              <Link href={`/games/${game.id}`} className="block group">
                <div className={`relative ${game.bg} border border-white/10 rounded-2xl p-4 h-full overflow-hidden cursor-pointer transition-all duration-300 group-hover:border-white/30`}>
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />

                  {/* Tag */}
                  <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${game.color} text-white mb-3`}>
                    {game.tag}
                  </div>

                  {/* Emoji */}
                  <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 block">
                    {game.emoji}
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-white text-sm md:text-base leading-tight mb-1">{game.name}</h3>
                  <p className="text-gray-400 text-xs leading-snug">{game.desc}</p>

                  {/* Play button */}
                  <div className={`mt-3 text-center py-1.5 rounded-lg bg-gradient-to-r ${game.color} text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    CHƠI NGAY →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 text-gray-600 text-sm"
        >
          <p>🕹️ RetroArcade — Built with Next.js + Framer Motion</p>
        </motion.div>
      </div>
    </div>
  );
}
