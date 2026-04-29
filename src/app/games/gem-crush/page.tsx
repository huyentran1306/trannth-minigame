"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameShell from "@/components/game-shell";

const COLS = 8, ROWS = 8, NUM_GEMS = 7;

const GEM_CFG = [
  { bg: ["#60a5fa","#0ea5e9","#1e40af"], border: "#93c5fd", glow: "#60a5fa", symbol: "◆" },
  { bg: ["#fb7185","#f43f5e","#9f1239"], border: "#fda4af", glow: "#fb7185", symbol: "♥" },
  { bg: ["#fbbf24","#f59e0b","#92400e"], border: "#fde68a", glow: "#fbbf24", symbol: "★" },
  { bg: ["#34d399","#10b981","#064e3b"], border: "#6ee7b7", glow: "#34d399", symbol: "◉" },
  { bg: ["#fb923c","#ea580c","#7c2d12"], border: "#fed7aa", glow: "#fb923c", symbol: "◆" },
  { bg: ["#a78bfa","#7c3aed","#3b0764"], border: "#ddd6fe", glow: "#a78bfa", symbol: "◈" },
  { bg: ["#f472b6","#ec4899","#831843"], border: "#fbcfe8", glow: "#f472b6", symbol: "♦" },
];

type Board = number[][];
interface Particle { id: number; x: number; y: number; color: string; vx: number; vy: number; }
interface Popup { id: number; text: string; x: number; y: number; }

let pid = 0, ppid = 0;

function mkBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.floor(Math.random() * NUM_GEMS))
  );
}

function findMatches(b: Board): boolean[][] {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS - 2; c++)
      if (b[r][c] === b[r][c+1] && b[r][c] === b[r][c+2]) m[r][c]=m[r][c+1]=m[r][c+2]=true;
  for (let r = 0; r < ROWS - 2; r++)
    for (let c = 0; c < COLS; c++)
      if (b[r][c] === b[r+1][c] && b[r][c] === b[r+2][c]) m[r][c]=m[r+1][c]=m[r+2][c]=true;
  return m;
}

function gravity(b: Board): Board {
  const nb = b.map(r => [...r]);
  for (let c = 0; c < COLS; c++) {
    const col = nb.map(r => r[c]).filter(v => v >= 0);
    while (col.length < ROWS) col.unshift(Math.floor(Math.random() * NUM_GEMS));
    for (let r = 0; r < ROWS; r++) nb[r][c] = col[r];
  }
  return nb;
}

function cascade(b: Board, pts = 0, combo = 0): { board: Board; pts: number; combo: number } {
  const m = findMatches(b);
  const cnt = m.flat().filter(Boolean).length;
  if (!cnt) return { board: b, pts, combo };
  const nb = b.map((row, r) => row.map((g, c) => m[r][c] ? -1 : g));
  return cascade(gravity(nb.map(r => r.map(v => v < 0 ? Math.floor(Math.random() * NUM_GEMS) : v))), pts + cnt * 10 * (combo + 1), combo + 1);
}

export default function GemCrush() {
  const [board, setBoard] = useState<Board>(mkBoard);
  const [sel, setSel] = useState<[number,number]|null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboShow, setComboShow] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(30);
  const [over, setOver] = useState(false);
  const touchRef = useRef<{r:number;c:number;x:number;y:number}|null>(null);

  const CELL = typeof window !== "undefined" ? Math.min(Math.floor((Math.min(window.innerWidth - 52, 360)) / COLS), 42) : 38;

  const doSwap = useCallback((r1:number,c1:number,r2:number,c2:number) => {
    if (busy || over) return;
    const nb = board.map(r=>[...r]);
    [nb[r1][c1],nb[r2][c2]]=[nb[r2][c2],nb[r1][c1]];
    const m = findMatches(nb);
    if (!m.flat().some(Boolean)) { setSel(null); return; }
    setBusy(true);
    // Particles
    const newP: Particle[] = [];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (m[r][c]) {
      const color = GEM_CFG[nb[r][c]].glow;
      for (let i=0;i<5;i++) {
        const a = (i/5)*Math.PI*2+Math.random()*0.5;
        newP.push({id:pid++, x:c*CELL+CELL/2, y:r*CELL+CELL/2, color, vx:Math.cos(a)*3, vy:Math.sin(a)*3-1});
      }
    }
    setParticles(p=>[...p,...newP]);
    setTimeout(()=>setParticles(p=>p.filter(pp=>!newP.some(n=>n.id===pp.id))),650);

    const { board: fb, pts, combo: nc } = cascade(nb);
    const ns = score + pts;
    if (nc > 1) { setCombo(nc); setComboShow(true); setTimeout(()=>setComboShow(false),1200); }
    const px: Popup = {id:ppid++, text:`+${pts}`, x:(c1+c2)/2*CELL+CELL/2, y:(r1+r2)/2*CELL};
    setPopups(p=>[...p,px]);
    setTimeout(()=>setPopups(p=>p.filter(pp=>pp.id!==px.id)),900);
    setBoard(fb); setScore(ns); setBest(b=>Math.max(b,ns));
    setMoves(m2=>{ const nm=m2-1; if(nm<=0) setOver(true); return nm; });
    setSel(null);
    setTimeout(()=>setBusy(false),350);
  }, [board, score, busy, over, CELL]);

  const tap = (r:number,c:number) => {
    if (busy||over) return;
    if (!sel) { setSel([r,c]); return; }
    const [sr,sc]=sel;
    if (sr===r&&sc===c) { setSel(null); return; }
    if (Math.abs(sr-r)+Math.abs(sc-c)===1) doSwap(sr,sc,r,c);
    else setSel([r,c]);
  };

  const onTouchStart=(r:number,c:number,e:React.TouchEvent)=>{
    touchRef.current={r,c,x:e.touches[0].clientX,y:e.touches[0].clientY};
  };
  const onTouchEnd=(r:number,c:number,e:React.TouchEvent)=>{
    if(!touchRef.current) return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    const min=18;
    if(Math.abs(dx)<min&&Math.abs(dy)<min) tap(r,c);
    else if(Math.abs(dx)>Math.abs(dy)) { const nc=c+(dx>0?1:-1); if(nc>=0&&nc<COLS) doSwap(r,c,r,nc); }
    else { const nr=r+(dy>0?1:-1); if(nr>=0&&nr<ROWS) doSwap(r,c,nr,c); }
    touchRef.current=null;
  };

  const reset=()=>{ setBoard(mkBoard()); setScore(0); setSel(null); setMoves(30); setOver(false); setCombo(0); };

  return (
    <GameShell title="Kim Cương" emoji="💎" score={score} highScore={best} color="from-blue-500 to-cyan-400" onReset={reset}>
      <div className="w-full max-w-sm select-none" style={{touchAction:"none"}}>
        {/* Stats */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-blue-300">🎯 Lượt: <span className={moves<=5?"text-red-400 animate-pulse font-black":"text-white"}>{moves}</span></span>
          <AnimatePresence>
            {comboShow && (
              <motion.div key="cb" initial={{scale:0,opacity:0}} animate={{scale:1.15,opacity:1}} exit={{scale:0.8,opacity:0}}
                className="font-black text-sm px-3 py-1 rounded-full text-white"
                style={{background:"linear-gradient(135deg,#f97316,#ef4444)",boxShadow:"0 0 20px #f9731688"}}>
                🔥 x{combo} COMBO!
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-xs font-bold text-amber-400">🏆 {best}</span>
        </div>

        {/* Board container */}
        <div className="relative rounded-3xl"
          style={{background:"linear-gradient(135deg,#0f0728,#1e1b4b,#0f172a)",padding:"10px",boxShadow:"0 0 48px rgba(139,92,246,0.4),0 16px 40px rgba(0,0,0,0.5)",border:"1.5px solid rgba(139,92,246,0.35)"}}>
          {/* Top glow */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{background:"radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.2),transparent 55%)"}}/>
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{zIndex:20}}>
            {particles.map(p=>(
              <motion.div key={p.id} className="absolute w-2 h-2 rounded-full"
                initial={{x:p.x+10,y:p.y+10,opacity:1,scale:1.2}}
                animate={{x:p.x+10+p.vx*28,y:p.y+10+p.vy*28,opacity:0,scale:0}}
                transition={{duration:0.6,ease:"easeOut"}}
                style={{background:p.color,boxShadow:`0 0 8px ${p.color}`,marginLeft:-4,marginTop:-4}}/>
            ))}
            {popups.map(p=>(
              <motion.div key={p.id}
                initial={{x:p.x,y:p.y,opacity:1,scale:0.9}}
                animate={{x:p.x,y:p.y-55,opacity:0,scale:1.4}}
                transition={{duration:0.85,ease:"easeOut"}}
                className="absolute font-black text-white text-base pointer-events-none"
                style={{textShadow:"0 0 10px rgba(255,255,255,0.9)",zIndex:30,transform:"translate(-50%,-50%)"}}>
                {p.text}
              </motion.div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid gap-1.5 relative" style={{gridTemplateColumns:`repeat(${COLS},1fr)`}}>
            {board.map((row,r)=>row.map((g,c)=>{
              const gem=GEM_CFG[g];
              const isSel=sel?.[0]===r&&sel?.[1]===c;
              return (
                <motion.button key={`${r}-${c}`}
                  whileTap={{scale:0.8}}
                  animate={{scale:isSel?1.15:1,y:isSel?-2:0}}
                  transition={{type:"spring",stiffness:500,damping:25}}
                  onClick={()=>tap(r,c)}
                  onTouchStart={e=>onTouchStart(r,c,e)}
                  onTouchEnd={e=>{e.preventDefault();onTouchEnd(r,c,e);}}
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio:"1",borderRadius:"10px",
                    background:`linear-gradient(145deg,${gem.bg[0]},${gem.bg[1]},${gem.bg[2]})`,
                    border:isSel?`2px solid white`:`1.5px solid ${gem.border}55`,
                    boxShadow:isSel?`0 0 22px white,0 0 12px ${gem.glow},0 4px 12px rgba(0,0,0,0.5)`:`0 2px 8px ${gem.bg[2]}66,inset 0 1px 0 rgba(255,255,255,0.28)`,
                    cursor:"pointer",
                  }}>
                  {/* Inner highlight */}
                  <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(145deg,rgba(255,255,255,0.38) 0%,transparent 50%)",borderRadius:"9px"}}/>
                  {/* Symbol */}
                  <div className="absolute inset-0 flex items-center justify-center font-black select-none"
                    style={{color:"rgba(255,255,255,0.9)",fontSize:"clamp(11px,3vw,17px)",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>
                    {gem.symbol}
                  </div>
                  {/* Bottom shadow */}
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none" style={{background:"linear-gradient(transparent,rgba(0,0,0,0.25))",borderRadius:"0 0 9px 9px"}}/>
                  {/* Selected ring */}
                  {isSel && (
                    <motion.div className="absolute inset-0 rounded-xl" animate={{opacity:[0.8,0.2,0.8]}} transition={{duration:0.7,repeat:Infinity}}
                      style={{border:"2px solid rgba(255,255,255,0.9)",boxShadow:"inset 0 0 16px rgba(255,255,255,0.4)"}}/>
                  )}
                </motion.button>
              );
            }))}
          </div>
        </div>

        <p className="text-center text-xs mt-3" style={{color:"rgba(167,139,250,0.5)"}}>Tap • Vuốt để hoán đổi 💎</p>

        {/* Game over */}
        <AnimatePresence>
          {over && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 flex items-center justify-center rounded-3xl"
              style={{background:"rgba(10,5,30,0.93)",backdropFilter:"blur(10px)",zIndex:40}}>
              <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:200,damping:15}} className="text-center px-6">
                <div className="text-7xl mb-3">💎</div>
                <div className="font-black text-3xl text-white mb-1">Hết lượt!</div>
                <div className="font-bold text-blue-300 text-xl mb-1">{score} điểm</div>
                {score>0&&score===best&&<div className="text-yellow-400 font-black text-sm animate-pulse mb-3">🏆 Kỷ lục mới!</div>}
                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={reset}
                  className="mt-3 px-10 py-3 rounded-full font-black text-white text-lg"
                  style={{background:"linear-gradient(135deg,#3b82f6,#06b6d4)",boxShadow:"0 0 28px rgba(59,130,246,0.6)"}}>
                  🔄 Chơi lại
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
