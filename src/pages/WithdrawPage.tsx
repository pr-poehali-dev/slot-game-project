import { useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function WithdrawPage() {
  const user = getUser();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt < 500) { setError("Минимальная сумма вывода 500 ₽"); return; }
    if (!wallet.trim()) { setError("Введите реквизиты"); return; }
    if (amt > (user?.balance ?? 0)) { setError("Недостаточно средств на балансе"); return; }
    setLoading(true);
    setError("");
    const data = await api.user.withdraw(amt, method, { wallet });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    window.dispatchEvent(new CustomEvent("balance-update", { detail: (user?.balance ?? 0) - amt }));
    setDone(true);
  };

  if (done) return (
    <div className="animate-fade-in flex items-center justify-center min-h-[50vh]">
      <div className="glass-card rounded-2xl p-10 text-center max-w-sm">
        <span className="text-6xl block mb-4">✅</span>
        <h3 className="text-white font-oswald font-bold text-2xl mb-2">Заявка принята!</h3>
        <p className="text-muted-foreground text-sm mb-6">Ваш вывод средств будет обработан в течение 24 часов.</p>
        <button onClick={() => { setDone(false); setAmount(""); setWallet(""); }}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          Новый вывод
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-oswald font-bold text-white mb-1">Вывод средств</h2>
        <p className="text-muted-foreground text-sm">Обработка до 24 часов</p>
      </div>

      {/* Balance */}
      <div className="rounded-2xl p-5 mb-5"
        style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(124,58,237,0.06))", border: "1px solid rgba(168,85,247,0.2)" }}>
        <p className="text-muted-foreground text-sm mb-1">Доступно для вывода</p>
        <p className="text-3xl font-oswald font-black" style={{ color: "#a855f7" }}>
          {(user?.balance ?? 0).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Method */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Способ вывода</label>
          <div className="grid grid-cols-3 gap-2">
            {[["card","💳 Карта"],["sbp","🏦 СБП"],["crypto","₿ Крипто"]].map(([k,l]) => (
              <button key={k} onClick={() => setMethod(k)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: method===k ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)", color: method===k ? "#a855f7" : "hsl(var(--muted-foreground))", border: `1px solid ${method===k ? "rgba(168,85,247,0.4)" : "transparent"}` }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {method === "card" ? "Номер карты" : method === "sbp" ? "Номер телефона" : "Адрес кошелька"}
          </label>
          <input value={wallet} onChange={e => setWallet(e.target.value)}
            placeholder={method === "card" ? "0000 0000 0000 0000" : method === "sbp" ? "+7 999 000 00 00" : "bc1q..."}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Сумма вывода</label>
          <div className="relative">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g,""))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl text-white text-lg font-bold outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button onClick={() => setAmount(String(Math.floor(user?.balance ?? 0)))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg font-bold"
              style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
              MAX
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {[500,1000,2000,5000].filter(p => p <= (user?.balance ?? 0)).map(p => (
            <button key={p} onClick={() => setAmount(String(p))}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: amount===String(p) ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.06)", color: amount===String(p) ? "#a855f7" : "hsl(var(--muted-foreground))" }}>
              {p}₽
            </button>
          ))}
        </div>

        {/* Warning */}
        <div className="rounded-xl p-3 text-xs"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="text-amber-400 font-semibold mb-0.5">⚠️ Важно</p>
          <p className="text-muted-foreground">Минимальная сумма вывода — 500 ₽. Комиссия не взимается.</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button onClick={handleWithdraw} disabled={loading || !amount || !wallet}
          className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
          {loading ? "Обработка..." : `Вывести ${amount ? `${Number(amount).toLocaleString()} ₽` : ""}`}
        </button>
      </div>
    </div>
  );
}
