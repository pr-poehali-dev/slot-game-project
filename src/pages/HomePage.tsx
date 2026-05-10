import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

const LIVE_WINS = [
  { user: "alex***", game: "Краш", amount: 4200, mult: "x8.4" },
  { user: "pro_***", game: "Слоты", amount: 12500, mult: "x50" },
  { user: "win***", game: "Рулетка", amount: 3600, mult: "x36" },
  { user: "lucky_***", game: "Кости", amount: 550, mult: "x5.5" },
  { user: "star***", game: "Краш", amount: 2100, mult: "x14.2" },
  { user: "king***", game: "Слоты", amount: 7800, mult: "x25" },
];

const GAMES_LIST = [
  { key: "slots", name: "Слоты", icon: "🎰", desc: "До x50 множитель", color: "#ec4899", path: "/games?tab=slots" },
  { key: "crash", name: "Краш", icon: "🚀", desc: "Авто-вывод на пике", color: "#22d65a", path: "/games?tab=crash" },
  { key: "dice", name: "Кости", icon: "🎲", desc: "Угадай бросок", color: "#3b82f6", path: "/games?tab=dice" },
  { key: "roulette", name: "Рулетка", icon: "🎡", desc: "Классика казино", color: "#f59e0b", path: "/games?tab=roulette" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState<{ total_games: number; wins: number } | null>(null);
  const [history, setHistory] = useState<{ game_type: string; bet: number; result: number; multiplier: number; created_at: string }[]>([]);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    api.user.profile().then((d) => { if (d.stats) setStats(d.stats); });
    api.user.history().then((d) => { if (d.games) setHistory(d.games.slice(0, 4)); });
    const t = setInterval(() => setTicker((p) => (p + 1) % LIVE_WINS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const winRate = stats ? (stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(34,214,90,0.12) 0%, rgba(168,85,247,0.08) 100%)",
          border: "1px solid rgba(34,214,90,0.18)",
        }}
      >
        <div className="absolute right-4 top-2 text-7xl md:text-9xl opacity-10 animate-float pointer-events-none">🎮</div>
        <p className="text-neon-green text-xs font-bold mb-2 tracking-widest uppercase">Добро пожаловать</p>
        <h2 className="text-2xl md:text-3xl font-oswald font-bold text-white mb-1">
          Привет, {user?.username}! 👋
        </h2>
        <p className="text-muted-foreground text-sm mb-5">Твой баланс готов к игре. Удачи сегодня!</p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/games")}
            className="px-5 py-2.5 rounded-xl text-black font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}
          >
            Играть сейчас
          </button>
          <button
            onClick={() => navigate("/deposit")}
            className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Пополнить счёт
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: "Баланс", value: `${(user?.balance ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`, icon: "Wallet", color: "#22d65a" },
          { label: "Игр сыграно", value: stats ? String(stats.total_games) : "—", icon: "Trophy", color: "#a855f7" },
          { label: "Побед", value: stats ? `${winRate}%` : "—", icon: "TrendingUp", color: "#f59e0b" },
        ].map((s, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-4 animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${s.color}18` }}
            >
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
            </div>
            <p className="text-muted-foreground text-xs mb-0.5">{s.label}</p>
            <p className="font-oswald font-bold text-base md:text-lg" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Games grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-oswald font-bold text-lg">🎮 Игры</h3>
          <button onClick={() => navigate("/games")} className="text-neon-green text-sm hover:underline">
            Все игры →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {GAMES_LIST.map((g, i) => (
            <button
              key={g.key}
              onClick={() => navigate(g.path)}
              className="glass-card rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s`, borderColor: `${g.color}25` }}
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                {g.icon}
              </span>
              <p className="text-white font-bold">{g.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{g.desc}</p>
              <div
                className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold text-center"
                style={{ background: `${g.color}18`, color: g.color }}
              >
                Играть
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live wins ticker */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(34,214,90,0.05)", border: "1px solid rgba(34,214,90,0.1)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <p className="text-neon-green text-xs font-bold uppercase tracking-widest">Live победы</p>
        </div>
        <div className="relative h-7 overflow-hidden">
          {LIVE_WINS.map((w, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-between transition-all duration-500"
              style={{ opacity: i === ticker ? 1 : 0, transform: `translateY(${(i - ticker) * 30}px)` }}
            >
              <span className="text-muted-foreground text-sm">
                <span className="text-white font-semibold">{w.user}</span> выиграл в {w.game}
              </span>
              <span className="text-neon-green font-bold text-sm">+{w.amount.toLocaleString()} ₽</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last games */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-oswald font-bold text-lg">📊 Последние игры</h3>
            <button onClick={() => navigate("/history")} className="text-neon-green text-sm hover:underline">
              Вся история →
            </button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {history.map((h, i) => {
              const win = h.result > 0;
              const emoji = { slots: "🎰", crash: "🚀", dice: "🎲", roulette: "🎡" }[h.game_type] ?? "🎮";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ background: win ? "rgba(34,214,90,0.1)" : "rgba(239,68,68,0.1)" }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold capitalize">{h.game_type}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(h.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${win ? "text-neon-green" : "text-red-400"}`}>
                      {win ? "+" : ""}{(h.result).toFixed(2)} ₽
                    </p>
                    <p className="text-muted-foreground text-xs">x{Number(h.multiplier).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}