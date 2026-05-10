import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface ProfileData {
  username: string;
  balance: number;
  is_admin: boolean;
  created_at: string | null;
  stats: { total_games: number; wins: number; total_bet: number };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.user.profile().then((d) => {
      if (!d.error) setProfile(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
    </div>
  );

  if (!profile) return <div className="text-muted-foreground text-center py-20">Ошибка загрузки</div>;

  const winRate = profile.stats.total_games > 0 ? Math.round((profile.stats.wins / profile.stats.total_games) * 100) : 0;
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : "—";

  return (
    <div className="animate-fade-in space-y-5 max-w-xl">
      <div className="mb-2">
        <h2 className="text-2xl font-oswald font-bold text-white">Профиль</h2>
      </div>

      {/* Header card */}
      <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-oswald font-black text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}
        >
          {profile.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-oswald font-bold text-white">{profile.username}</h3>
          <p className="text-muted-foreground text-sm">Игрок с {joinDate}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: "rgba(34,214,90,0.15)", color: "#22d65a" }}>
              ✓ Верифицирован
            </span>
            {profile.is_admin && (
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                🛡 Администратор
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balance */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,rgba(34,214,90,0.1),rgba(22,163,74,0.06))", border: "1px solid rgba(34,214,90,0.2)" }}
      >
        <div>
          <p className="text-muted-foreground text-sm mb-1">Текущий баланс</p>
          <p className="font-oswald font-black text-3xl text-neon-green">
            {profile.balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
          </p>
        </div>
        <Icon name="Wallet" size={40} style={{ color: "rgba(34,214,90,0.3)" }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Игр сыграно", value: profile.stats.total_games, icon: "Gamepad2", color: "#a855f7" },
          { label: "Побед", value: `${winRate}%`, icon: "Trophy", color: "#f59e0b" },
          { label: "Всего поставлено", value: `${profile.stats.total_bet.toLocaleString("ru-RU",{maximumFractionDigits:0})} ₽`, icon: "TrendingUp", color: "#3b82f6" },
          { label: "Выигрышей", value: profile.stats.wins, icon: "Star", color: "#22d65a" },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </div>
            <p className="font-oswald font-bold text-xl text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Telegram */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div className="flex-1">
            <p className="text-white font-semibold">Telegram подключён</p>
            <p className="text-muted-foreground text-sm">@nexus_game_bot</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: "rgba(34,214,90,0.15)", color: "#22d65a" }}>
            Активен
          </span>
        </div>
      </div>
    </div>
  );
}