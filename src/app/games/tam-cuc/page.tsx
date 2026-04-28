"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

type Suit = "red" | "black";
type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const RANK_NAMES = ["Tốt", "Xe", "Pháo", "Mã", "Tượng", "Sĩ", "Tướng"];
const RANK_EMOJIS = ["🪖", "🚂", "💣", "🐴", "🐘", "🛡️", "👑"];

interface Card { suit: Suit; rank: Rank }
function cardValue(c: Card) { return c.rank * 2 + (c.suit === "red" ? 1 : 0); }
function cardLabel(c: Card) { return `${c.suit === "red" ? "Đỏ" : "Đen"} ${RANK_NAMES[c.rank]}`; }

function makeDeck(): Card[] {
  const d: Card[] = [];
  for (let r = 0; r < 7; r++) {
    d.push({ suit: "red", rank: r as Rank }, { suit: "red", rank: r as Rank });
    d.push({ suit: "black", rank: r as Rank }, { suit: "black", rank: r as Rank });
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

type GameState = "idle" | "playing" | "roundResult" | "gameOver";

const CardFace = ({ card, size = "md" }: { card: Card; size?: "sm" | "md" | "lg" }) => {
  const isRed = card.suit === "red";
  const sizes = { sm: "w-14 h-20 text-xl", md: "w-16 h-24 text-2xl", lg: "w-20 h-28 text-3xl" };
  return (
    <div className={`${sizes[size]} rounded-xl border-2 flex flex-col items-center justify-center gap-1 shadow-sm select-none transition-all
      ${isRed ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-700" : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-700"}`}>
      <span>{RANK_EMOJIS[card.rank]}</span>
      <span className="font-black text-[10px] leading-tight text-center">{cardLabel(card)}</span>
    </div>
  );
};

export default function TamCuc() {
  const [state, setState] = useState<GameState>("idle");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [chosen, setChosen] = useState<Card | null>(null);
  const [aiChosen, setAiChosen] = useState<Card | null>(null);
  const [msg, setMsg] = useState("");
  const [round, setRound] = useState(1);

  const deal = useCallback(() => {
    const deck = makeDeck();
    setPlayerHand(deck.slice(0, 5));
    setAiHand(deck.slice(5, 10));
    setPlayerScore(0); setAiScore(0);
    setChosen(null); setAiChosen(null); setMsg(""); setRound(1);
    setState("playing");
  }, []);

  const playCard = (card: Card) => {
    if (state !== "playing" || chosen) return;
    // AI picks highest card
    const aiCard = aiHand.reduce((best, c) => cardValue(c) > cardValue(best) ? c : best);
    const pVal = cardValue(card), aVal = cardValue(aiCard);
    const win = pVal > aVal, draw = pVal === aVal;
    setChosen(card); setAiChosen(aiCard);
    setPlayerHand(h => h.filter(c => c !== card));
    setAiHand(h => h.filter(c => c !== aiCard));
    if (win) { setPlayerScore(s => s + 1); setMsg("🎉 Bạn thắng lượt này!"); }
    else if (!draw) { setAiScore(s => s + 1); setMsg("💀 AI thắng lượt này!"); }
    else setMsg("🤝 Hòa lượt này!");
    setState("roundResult");
  };

  const nextRound = () => {
    const newRound = round + 1;
    setRound(newRound);
    if (playerHand.length === 0) {
      setState("gameOver");
      setHighScore(h => Math.max(h, playerScore + (chosen && aiChosen && cardValue(chosen) > cardValue(aiChosen) ? 0 : 0)));
    } else {
      setChosen(null); setAiChosen(null); setMsg(""); setState("playing");
    }
  };

  return (
    <GameShell title="Bài Tam Cúc" emoji="🃏" score={playerScore} highScore={highScore} color="from-red-500 to-pink-400">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        {/* Scoreboard */}
        <div className="flex w-full justify-around bg-white/70 rounded-2xl p-3 border border-pink-100 shadow-sm">
          <div className="text-center">
            <div className="text-3xl font-black text-red-500">{playerScore}</div>
            <div className="text-xs text-red-400 font-semibold">Bạn</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg font-black text-gray-400">VS</div>
            <div className="text-xs text-gray-400">Lượt {round}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-slate-600">{aiScore}</div>
            <div className="text-xs text-slate-400 font-semibold">AI</div>
          </div>
        </div>

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">🃏</div>
            <div className="text-center text-sm text-pink-500 px-4 leading-relaxed">
              Bài Tam Cúc Việt Nam! Mỗi lượt đánh 1 lá — quân cao hơn thắng.<br />
              <span className="font-bold">Đỏ Tướng &gt; Đen Tướng &gt; ... &gt; Đen Tốt</span>
            </div>
            <motion.button onClick={deal} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-red-400 to-pink-400 text-white font-black text-xl rounded-full shadow-xl">
              🃏 Bốc Bài
            </motion.button>
          </div>
        )}

        {(state === "playing" || state === "roundResult") && (
          <>
            {/* AI hand face down */}
            <div className="w-full">
              <div className="text-xs text-slate-400 font-bold mb-2 text-center">🤖 AI ({aiHand.length} lá)</div>
              <div className="flex justify-center gap-1 flex-wrap">
                {aiHand.map((_, i) => (
                  <div key={i} className="w-12 rounded-lg border-2 border-purple-200 shadow-sm bg-gradient-to-br from-violet-300 to-purple-400" style={{ height: "5rem" }} />
                ))}
                {aiChosen && (
                  <motion.div initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} className="ml-1">
                    <CardFace card={aiChosen} size="sm" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Battle area */}
            <AnimatePresence>
              {msg && (
                <motion.div
                  className={`text-base font-black text-center px-4 py-2 rounded-full ${msg.includes("Bạn thắng") ? "bg-green-100 text-green-600" : msg.includes("AI") ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                  {msg}
                </motion.div>
              )}
            </AnimatePresence>

            {chosen && aiChosen && (
              <div className="flex gap-6 items-end">
                <div className="text-center"><div className="text-xs text-pink-400 mb-1 font-bold">Bạn đánh</div><CardFace card={chosen} size="lg" /></div>
                <div className="text-2xl font-black text-gray-400 pb-10">VS</div>
                <div className="text-center"><div className="text-xs text-slate-400 mb-1 font-bold">AI đánh</div><CardFace card={aiChosen} size="lg" /></div>
              </div>
            )}

            {/* Player hand */}
            <div className="w-full">
              <div className="text-xs text-pink-400 font-bold mb-2 text-center">🫵 Bài của bạn — Chọn một lá để đánh</div>
              <div className="flex justify-center gap-1 flex-wrap">
                {playerHand.map((c, i) => (
                  <motion.button key={i} onClick={() => playCard(c)} disabled={state !== "playing"}
                    whileHover={state === "playing" ? { y: -10, scale: 1.08 } : {}} whileTap={{ scale: 0.93 }}
                    className="transition-transform">
                    <CardFace card={c} size="md" />
                  </motion.button>
                ))}
              </div>
            </div>

            {state === "roundResult" && (
              <motion.button onClick={nextRound} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="px-6 py-2 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full font-black shadow-lg">
                {playerHand.length === 0 ? "Xem kết quả 🏁" : "Lượt tiếp ▶"}
              </motion.button>
            )}
          </>
        )}

        {state === "gameOver" && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-6xl">{playerScore > aiScore ? "🏆" : playerScore === aiScore ? "🤝" : "😢"}</div>
            <div className="font-black text-3xl text-pink-600">
              {playerScore > aiScore ? "Bạn Thắng!" : playerScore === aiScore ? "Hòa!" : "AI Thắng!"}
            </div>
            <div className="text-xl text-pink-500 font-bold">{playerScore} – {aiScore}</div>
            <motion.button onClick={deal} whileHover={{ scale: 1.05 }}
              className="px-8 py-3 bg-gradient-to-r from-red-400 to-pink-400 text-white font-black text-xl rounded-full shadow-xl">
              🔄 Chơi lại
            </motion.button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
