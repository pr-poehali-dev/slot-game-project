import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { getUser, updateBalance } from "@/lib/auth";
import Icon from "@/components/ui/icon";

// ─── Slots ────────────────────────────────────────────────────────────────────
function SlotsGame() {
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState(["🍒", "🍋", "🍊"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ win: number; multiplier: number } | null>(null);
  const [balance, setBalance] = useState(getUser()?.balance ?? 0);

  const spin = async () => {
    if (spinning || balance < bet) return;
    setSpinning(true);
    setResult(null);
    const interval = setInterval(() => {
      const syms = ["🍒","🍋","🍊","🍇","⭐","💎","7️⃣"];
      setReels([syms[Math.floor(Math.random()*7)], syms[Math.floor(Math.random()*7)], syms[Math.floor(Math.random()*7)]]);
    }, 80);
    setTimeout(async () => {
      clearInterval(interval);
      const data = await api.games.play({ game_type: "slots", bet });
      if (data.reels) setReels(data.reels);
      setResult({ win: data.win ?? 0, multiplier: data.multiplier ?? 0 });
      setBalance(data.new_balance ?? balance);
      window.dispatchEvent(new CustomEvent("balance-update", { detail: data.new_balance }));
      setSpinning(false);
    }, 1500);
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="glass-card rounded-2xl p-6">
        {/* Reels */}
        <div className="flex justify-center gap-3 mb-6">
          {reels.map((r, i) => (
            <div key={i} className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className={spinning ? "animate-float" : ""}>{r}</span>
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center p-3 rounded-xl mb-4 animate-scale-in ${result.win > 0 ? "neon-glow-green" : ""}`}
            style={{ background: result.win > 0 ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.win > 0 ? "rgba(34,214,90,0.3)" : "rgba(239,68,68,0.2)"}` }}>
            {result.win > 0 ? (
              <><p className="text-neon-green font-oswald font-bold text-2xl">+{result.win.toFixed(2)} ₽</p>
              <p className="text-muted-foreground text-xs">x{result.multiplier}</p></>
            ) : (
              <p className="text-red-400 font-semibold">Не повезло — попробуй ещё!</p>
            )}
          </div>
        )}

        {/* Bet */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">Ставка: <span className="text-white font-bold">{bet} ₽</span></label>
          <input type="range" min={5} max={Math.min(1000, balance)} step={5} value={bet}
            onChange={e => setBet(Number(e.target.value))}
            className="w-full accent-green-500" />
          <div className="flex justify-between mt-1">
            {[10, 50, 100, 500].filter(p => p <= balance).map(p => (
              <button key={p} onClick={() => setBet(p)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ background: bet===p ? "rgba(34,214,90,0.2)" : "rgba(255,255,255,0.06)", color: bet===p ? "#22d65a" : "hsl(var(--muted-foreground))" }}>
                {p}₽
              </button>
            ))}
          </div>
        </div>

        <button onClick={spin} disabled={spinning || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: spinning ? "rgba(34,214,90,0.5)" : "linear-gradient(135deg,#22d65a,#16a34a)" }}>
          {spinning ? "Крутится..." : "🎰 Крутить"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Ваш баланс</p>
        <p className="font-oswald font-bold text-2xl text-neon-green">{balance.toFixed(2)} ₽</p>
      </div>
    </div>
  );
}

// ─── Crash ────────────────────────────────────────────────────────────────────
function CrashGame() {
  const [bet, setBet] = useState(10);
  const [cashout, setCashout] = useState(2.0);
  const [running, setRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [result, setResult] = useState<{ crashed_at: number; won: boolean; win: number } | null>(null);
  const [balance, setBalance] = useState(getUser()?.balance ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = async () => {
    if (running || balance < bet) return;
    setRunning(true);
    setResult(null);
    setMultiplier(1.0);

    const data = await api.games.play({ game_type: "crash", bet, cashout });
    const crashPoint = data.crash_point ?? 1.0;
    const targetCashout = data.cashout ?? cashout;

    let cur = 1.0;
    timerRef.current = setInterval(() => {
      cur = Math.round((cur + 0.05) * 100) / 100;
      setMultiplier(cur);
      if (cur >= crashPoint) {
        clearInterval(timerRef.current!);
        setResult({ crashed_at: crashPoint, won: data.won, win: data.win ?? 0 });
        setBalance(data.new_balance ?? balance);
        window.dispatchEvent(new CustomEvent("balance-update", { detail: data.new_balance }));
        setRunning(false);
      }
    }, 80);
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="glass-card rounded-2xl p-6">
        {/* Multiplier display */}
        <div className="flex items-center justify-center h-36 rounded-xl mb-5 relative overflow-hidden"
          style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="absolute inset-0" style={{
            background: running ? `radial-gradient(ellipse at 50% 100%, rgba(34,214,90,${Math.min(multiplier/10,0.3)}) 0%, transparent 70%)` : "none"
          }} />
          <div className="text-center">
            <p className="text-6xl font-oswald font-black transition-all duration-75"
              style={{ color: running ? (multiplier >= cashout ? "#22d65a" : "#f59e0b") : "white" }}>
              x{multiplier.toFixed(2)}
            </p>
            {running && <p className="text-muted-foreground text-xs animate-pulse mt-1">Летим...</p>}
          </div>
          {result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-scale-in">
              <div className="text-center">
                <p className="text-4xl mb-1">{result.won ? "🚀" : "💥"}</p>
                <p className={`font-oswald font-bold text-xl ${result.won ? "text-neon-green" : "text-red-400"}`}>
                  {result.won ? `+${result.win.toFixed(2)} ₽` : `Краш x${result.crashed_at}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cashout target */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Авто-вывод: <span className="text-neon-green font-bold">x{cashout.toFixed(2)}</span>
          </label>
          <input type="range" min={1.1} max={20} step={0.1} value={cashout}
            onChange={e => setCashout(Number(e.target.value))}
            className="w-full accent-green-500" />
          <div className="flex justify-between mt-1">
            {[1.5, 2, 5, 10].map(v => (
              <button key={v} onClick={() => setCashout(v)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ background: cashout===v ? "rgba(34,214,90,0.2)" : "rgba(255,255,255,0.06)", color: cashout===v ? "#22d65a" : "hsl(var(--muted-foreground))" }}>
                x{v}
              </button>
            ))}
          </div>
        </div>

        {/* Bet */}
        <div className="mb-5">
          <label className="text-xs text-muted-foreground mb-1.5 block">Ставка: <span className="text-white font-bold">{bet} ₽</span></label>
          <div className="flex gap-2">
            {[10, 50, 100, 500].filter(p => p <= balance).map(p => (
              <button key={p} onClick={() => setBet(p)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: bet===p ? "rgba(34,214,90,0.15)" : "rgba(255,255,255,0.06)", color: bet===p ? "#22d65a" : "hsl(var(--muted-foreground))", border: `1px solid ${bet===p ? "rgba(34,214,90,0.3)" : "transparent"}` }}>
                {p}₽
              </button>
            ))}
          </div>
        </div>

        <button onClick={play} disabled={running || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: running ? "rgba(34,214,90,0.5)" : "linear-gradient(135deg,#22d65a,#16a34a)" }}>
          {running ? `Летим... x${multiplier.toFixed(2)}` : "🚀 Запустить"}
        </button>
      </div>
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Ваш баланс</p>
        <p className="font-oswald font-bold text-2xl text-neon-green">{balance.toFixed(2)} ₽</p>
      </div>
    </div>
  );
}

// ─── Dice ─────────────────────────────────────────────────────────────────────
function DiceGame() {
  const [bet, setBet] = useState(10);
  const [prediction, setPrediction] = useState<"over"|"under"|"exact">("over");
  const [value, setValue] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; won: boolean; win: number; multiplier: number } | null>(null);
  const [balance, setBalance] = useState(getUser()?.balance ?? 0);
  const [displayRoll, setDisplayRoll] = useState(1);

  const roll = async () => {
    if (rolling || balance < bet) return;
    setRolling(true);
    setResult(null);
    const frames = 20;
    let frame = 0;
    const anim = setInterval(() => {
      setDisplayRoll(Math.ceil(Math.random() * 6));
      frame++;
      if (frame >= frames) clearInterval(anim);
    }, 60);
    const data = await api.games.play({ game_type: "dice", bet, prediction, value });
    setTimeout(() => {
      setDisplayRoll(data.roll ?? 1);
      setResult({ roll: data.roll, won: data.won, win: data.win ?? 0, multiplier: data.multiplier ?? 0 });
      setBalance(data.new_balance ?? balance);
      window.dispatchEvent(new CustomEvent("balance-update", { detail: data.new_balance }));
      setRolling(false);
    }, 1300);
  };

  const diceEmoji = ["⚀","⚁","⚂","⚃","⚄","⚅"];

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="glass-card rounded-2xl p-6">
        {/* Dice display */}
        <div className="flex items-center justify-center h-28 mb-5">
          <span className={`text-8xl transition-all duration-100 ${rolling ? "animate-float" : ""}`}>
            {diceEmoji[displayRoll - 1]}
          </span>
        </div>

        {result && (
          <div className={`text-center p-3 rounded-xl mb-4 animate-scale-in`}
            style={{ background: result.won ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.won ? "rgba(34,214,90,0.3)" : "rgba(239,68,68,0.2)"}` }}>
            <p className={`font-oswald font-bold text-xl ${result.won ? "text-neon-green" : "text-red-400"}`}>
              {result.won ? `+${result.win.toFixed(2)} ₽` : "Не угадал"}
            </p>
            <p className="text-muted-foreground text-xs">Выпало: {result.roll}</p>
          </div>
        )}

        {/* Prediction type */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {([["over","Больше"],["under","Меньше"],["exact","Точно"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setPrediction(k)}
              className="py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: prediction===k ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", color: prediction===k ? "#3b82f6" : "hsl(var(--muted-foreground))", border: `1px solid ${prediction===k ? "rgba(59,130,246,0.4)" : "transparent"}` }}>
              {l}
            </button>
          ))}
        </div>

        {/* Value */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">
            Значение: <span className="text-white font-bold">{value}</span> ({prediction === "over" ? `>${value}` : prediction === "under" ? `<${value}` : `=${value}`})
          </label>
          <div className="flex justify-between gap-2">
            {[1,2,3,4,5,6].map(v => (
              <button key={v} onClick={() => setValue(v)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: value===v ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", color: value===v ? "#3b82f6" : "white" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Bet */}
        <div className="mb-5">
          <label className="text-xs text-muted-foreground mb-1.5 block">Ставка: <span className="text-white font-bold">{bet} ₽</span></label>
          <div className="flex gap-2">
            {[10, 50, 100, 500].filter(p => p <= balance).map(p => (
              <button key={p} onClick={() => setBet(p)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: bet===p ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)", color: bet===p ? "#3b82f6" : "hsl(var(--muted-foreground))" }}>
                {p}₽
              </button>
            ))}
          </div>
        </div>

        <button onClick={roll} disabled={rolling || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
          {rolling ? "Бросаю..." : "🎲 Бросить кубик"}
        </button>
      </div>
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Ваш баланс</p>
        <p className="font-oswald font-bold text-2xl text-neon-green">{balance.toFixed(2)} ₽</p>
      </div>
    </div>
  );
}

// ─── Roulette ─────────────────────────────────────────────────────────────────
function RouletteGame() {
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<"color"|"parity"|"half"|"number">("color");
  const [betValue, setBetValue] = useState<string>("red");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ number: number; won: boolean; win: number } | null>(null);
  const [balance, setBalance] = useState(getUser()?.balance ?? 0);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const play = async () => {
    if (spinning || balance < bet) return;
    setSpinning(true);
    setResult(null);
    let frame = 0;
    const anim = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 37));
      frame++;
      if (frame >= 25) clearInterval(anim);
    }, 70);
    const data = await api.games.play({ game_type: "roulette", bet, bet_type: betType, bet_value: betValue });
    setTimeout(() => {
      setDisplayNum(data.number ?? 0);
      setResult({ number: data.number ?? 0, won: data.won, win: data.win ?? 0 });
      setBalance(data.new_balance ?? balance);
      window.dispatchEvent(new CustomEvent("balance-update", { detail: data.new_balance }));
      setSpinning(false);
    }, 1800);
  };

  const numColor = (n: number | null) => {
    if (n === null) return "#333";
    if (n === 0) return "#22c55e";
    return RED.has(n) ? "#ef4444" : "#1e293b";
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div className="glass-card rounded-2xl p-6">
        {/* Number display */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
            style={{ background: numColor(displayNum), border: "4px solid rgba(255,255,255,0.15)" }}>
            <span className="text-white font-oswald font-black text-4xl">
              {displayNum !== null ? displayNum : "?"}
            </span>
          </div>
        </div>

        {result && (
          <div className="text-center p-3 rounded-xl mb-4 animate-scale-in"
            style={{ background: result.won ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.won ? "rgba(34,214,90,0.3)" : "rgba(239,68,68,0.2)"}` }}>
            <p className={`font-oswald font-bold text-xl ${result.won ? "text-neon-green" : "text-red-400"}`}>
              {result.won ? `+${result.win.toFixed(2)} ₽` : "Не угадал"}
            </p>
            <p className="text-muted-foreground text-xs">Выпало: {result.number} ({result.number === 0 ? "Зеро" : RED.has(result.number) ? "Красное" : "Чёрное"})</p>
          </div>
        )}

        {/* Bet type */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {([["color","Цвет"],["parity","Чётность"],["half","Половина"],["number","Число"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => { setBetType(k); setBetValue(k==="color"?"red":k==="parity"?"even":k==="half"?"low":"1"); }}
              className="py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: betType===k ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)", color: betType===k ? "#f59e0b" : "hsl(var(--muted-foreground))", border: `1px solid ${betType===k ? "rgba(245,158,11,0.4)" : "transparent"}` }}>
              {l}
            </button>
          ))}
        </div>

        {/* Bet value selection */}
        <div className="mb-4">
          {betType === "color" && (
            <div className="flex gap-3">
              <button onClick={() => setBetValue("red")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="red" ? "#ef4444" : "rgba(239,68,68,0.2)", border: `2px solid ${betValue==="red" ? "#ef4444" : "transparent"}` }}>🔴 Красное</button>
              <button onClick={() => setBetValue("black")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="black" ? "#374151" : "rgba(55,65,81,0.4)", border: `2px solid ${betValue==="black" ? "#6b7280" : "transparent"}` }}>⚫ Чёрное</button>
            </div>
          )}
          {betType === "parity" && (
            <div className="flex gap-3">
              <button onClick={() => setBetValue("even")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="even" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${betValue==="even" ? "#f59e0b" : "transparent"}` }}>Чётное</button>
              <button onClick={() => setBetValue("odd")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="odd" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${betValue==="odd" ? "#f59e0b" : "transparent"}` }}>Нечётное</button>
            </div>
          )}
          {betType === "half" && (
            <div className="flex gap-3">
              <button onClick={() => setBetValue("low")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="low" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${betValue==="low" ? "#f59e0b" : "transparent"}` }}>1—18</button>
              <button onClick={() => setBetValue("high")} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: betValue==="high" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)", border: `1px solid ${betValue==="high" ? "#f59e0b" : "transparent"}` }}>19—36</button>
            </div>
          )}
          {betType === "number" && (
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({length:37},(_,i)=>i).map(n => (
                <button key={n} onClick={() => setBetValue(String(n))}
                  className="h-8 rounded-lg text-xs font-bold transition-all"
                  style={{ background: betValue===String(n) ? numColor(n) : "rgba(255,255,255,0.06)", color: "white", border: `1px solid ${betValue===String(n) ? "white" : "transparent"}` }}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bet */}
        <div className="mb-5">
          <label className="text-xs text-muted-foreground mb-1.5 block">Ставка: <span className="text-white font-bold">{bet} ₽</span></label>
          <div className="flex gap-2">
            {[10,50,100,500].filter(p=>p<=balance).map(p => (
              <button key={p} onClick={() => setBet(p)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: bet===p ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: bet===p ? "#f59e0b" : "hsl(var(--muted-foreground))" }}>
                {p}₽
              </button>
            ))}
          </div>
        </div>

        <button onClick={play} disabled={spinning || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          {spinning ? "Крутится..." : "🎡 Крутить рулетку"}
        </button>
      </div>
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Ваш баланс</p>
        <p className="font-oswald font-bold text-2xl text-neon-green">{balance.toFixed(2)} ₽</p>
      </div>
    </div>
  );
}

// ─── Games Page ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "slots", label: "🎰 Слоты", color: "#ec4899" },
  { key: "crash", label: "🚀 Краш", color: "#22d65a" },
  { key: "dice", label: "🎲 Кости", color: "#3b82f6" },
  { key: "roulette", label: "🎡 Рулетка", color: "#f59e0b" },
];

export default function GamesPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "slots";
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const p = new URLSearchParams(location.search).get("tab");
    if (p) setTab(p);
  }, [location.search]);

  const current = TABS.find(t => t.key === tab) ?? TABS[0];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-oswald font-bold text-white mb-1">Игры</h2>
        <p className="text-muted-foreground text-sm">Испытай удачу</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={tab === t.key
              ? { background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}50` }
              : { background: "rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {/* Game content */}
      <div key={tab}>
        {tab === "slots" && <SlotsGame />}
        {tab === "crash" && <CrashGame />}
        {tab === "dice" && <DiceGame />}
        {tab === "roulette" && <RouletteGame />}
      </div>
    </div>
  );
}
