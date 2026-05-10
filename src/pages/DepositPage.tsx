import { useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

const METHODS = [
  { key: "card", label: "Банковская карта", icon: "💳", min: 100 },
  { key: "sbp", label: "СБП", icon: "🏦", min: 100 },
  { key: "qiwi", label: "QIWI", icon: "💰", min: 50 },
  { key: "crypto", label: "Криптовалюта", icon: "₿", min: 500 },
];

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleDeposit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { setError("Минимальная сумма пополнения 100 ₽"); return; }
    setLoading(true);
    setError("");
    const data = await api.user.deposit(amt, method);
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    setDone(true);
  };

  if (done) return (
    <div className="animate-fade-in flex items-center justify-center min-h-[50vh]">
      <div className="glass-card rounded-2xl p-10 text-center max-w-sm">
        <span className="text-6xl block mb-4">✅</span>
        <h3 className="text-white font-oswald font-bold text-2xl mb-2">Заявка создана!</h3>
        <p className="text-muted-foreground text-sm mb-6">Ожидайте зачисления средств. Обычно это занимает несколько минут.</p>
        <button onClick={() => { setDone(false); setAmount(""); }}
          className="px-6 py-3 rounded-xl font-bold text-black text-sm"
          style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}>
          Новое пополнение
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-oswald font-bold text-white mb-1">Пополнение счёта</h2>
        <p className="text-muted-foreground text-sm">Мгновенное зачисление на баланс</p>
      </div>

      {/* Methods */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {METHODS.map((m) => (
          <button key={m.key} onClick={() => setMethod(m.key)}
            className={`glass-card p-4 rounded-2xl text-left transition-all hover:scale-[1.02] ${method === m.key ? "neon-glow-green" : ""}`}
            style={method === m.key ? { borderColor: "rgba(34,214,90,0.4)" } : {}}>
            <span className="text-2xl block mb-1">{m.icon}</span>
            <p className={`text-sm font-semibold ${method === m.key ? "text-neon-green" : "text-white"}`}>{m.label}</p>
            <p className="text-muted-foreground text-xs">от {m.min} ₽</p>
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="glass-card rounded-2xl p-5">
        <label className="text-xs text-muted-foreground mb-2 block">Сумма пополнения</label>
        <div className="relative mb-4">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full px-4 py-4 rounded-xl text-white text-2xl font-oswald font-bold outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-oswald text-xl">₽</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {[100, 500, 1000, 5000].map((p) => (
            <button key={p} onClick={() => setAmount(String(p))}
              className="py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: amount===String(p) ? "rgba(34,214,90,0.15)" : "rgba(34,214,90,0.06)", color: "#22d65a", border: "1px solid rgba(34,214,90,0.15)" }}>
              +{p}
            </button>
          ))}
        </div>

        {/* Bonus */}
        <div className="flex items-center justify-between text-sm mb-5 p-3 rounded-xl"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <span className="text-muted-foreground">🎁 Бонус новичка</span>
          <span className="text-amber-400 font-bold">+15% на первое</span>
        </div>

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <button onClick={handleDeposit} disabled={loading || !amount}
          className="w-full py-4 rounded-xl font-bold text-black text-base transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}>
          {loading ? "Обработка..." : `Пополнить ${amount ? `${Number(amount).toLocaleString()} ₽` : ""}`}
        </button>
      </div>
    </div>
  );
}
