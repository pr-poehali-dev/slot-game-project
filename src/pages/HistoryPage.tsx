import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface GameRecord {
  game_type: string;
  bet: number;
  result: number;
  multiplier: number;
  created_at: string;
}

const EMOJI: Record<string, string> = { slots:"🎰", crash:"🚀", dice:"🎲", roulette:"🎡" };
const NAME: Record<string, string> = { slots:"Слоты", crash:"Краш", dice:"Кости", roulette:"Рулетка" };

export default function HistoryPage() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"win"|"lose">("all");

  useEffect(() => {
    api.user.history().then((d) => {
      if (d.games) setGames(d.games);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
    </div>
  );

  const filtered = games.filter(g => {
    if (filter === "win") return g.result > 0;
    if (filter === "lose") return g.result <= 0;
    return true;
  });

  const total = filtered.reduce((acc, g) => acc + g.result, 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-oswald font-bold text-white mb-1">История игр</h2>
          <p className="text-muted-foreground text-sm">{games.length} игр всего</p>
        </div>
        {filtered.length > 0 && (
          <div className={`px-4 py-2 rounded-xl font-oswald font-bold text-sm ${total >= 0 ? "text-neon-green" : "text-red-400"}`}
            style={{ background: total >= 0 ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.1)" }}>
            {total >= 0 ? "+" : ""}{total.toFixed(2)} ₽
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {([["all","Все"],["win","Выигрыши"],["lose","Проигрыши"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={filter===k
              ? { background: "linear-gradient(135deg,#22d65a,#16a34a)", color: "#000" }
              : { background: "rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <span className="text-5xl block mb-4">🎮</span>
          <p className="text-muted-foreground">История игр пуста</p>
          <p className="text-muted-foreground text-sm mt-1">Сыграйте первую игру!</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 px-5 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <span>Игра</span>
            <span className="text-center">Ставка</span>
            <span className="text-center">Коэф.</span>
            <span className="text-center">Итог</span>
            <span className="text-right">Дата</span>
          </div>
          {filtered.map((g, i) => {
            const win = g.result > 0;
            return (
              <div key={i}
                className="grid grid-cols-5 items-center px-5 py-4"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: win ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.1)" }}>
                    {EMOJI[g.game_type] ?? "🎮"}
                  </div>
                  <span className="text-white text-sm font-semibold hidden sm:block">{NAME[g.game_type] ?? g.game_type}</span>
                </div>
                <span className="text-center text-sm text-muted-foreground">{g.bet} ₽</span>
                <span className="text-center text-sm font-bold" style={{ color: win ? "#22d65a" : "#ef4444" }}>
                  x{Number(g.multiplier).toFixed(2)}
                </span>
                <span className={`text-center text-sm font-bold ${win ? "text-neon-green" : "text-red-400"}`}>
                  {win ? "+" : ""}{g.result.toFixed(2)} ₽
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {new Date(g.created_at).toLocaleString("ru-RU", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
