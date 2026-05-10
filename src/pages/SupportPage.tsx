import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

const FAQS = [
  { q: "Как пополнить счёт?", a: "Перейдите в раздел «Пополнение» и выберите удобный способ оплаты. Минимум 100 ₽." },
  { q: "Сколько времени занимает вывод?", a: "Обычно до 24 часов. Минимальная сумма вывода — 500 ₽." },
  { q: "Как работает авторизация через Telegram?", a: "При входе мы отправляем код в @nexus_game_bot. Введите код для подтверждения." },
  { q: "Минимальная ставка?", a: "В большинстве игр минимальная ставка — 5 ₽." },
];

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [tab, setTab] = useState<"new"|"history"|"faq">("new");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (tab === "history") {
      api.user.tickets().then((d) => { if (d.tickets) setTickets(d.tickets); });
    }
  }, [tab]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    const data = await api.user.createTicket(subject.trim(), message.trim());
    setLoading(false);
    if (!data.error) { setSent(true); setSubject(""); setMessage(""); }
  };

  return (
    <div className="animate-fade-in space-y-5 max-w-xl">
      <div className="mb-2">
        <h2 className="text-2xl font-oswald font-bold text-white mb-1">Поддержка</h2>
        <p className="text-muted-foreground text-sm">Ответим в течение 2 часов</p>
      </div>

      {/* Contacts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "✈️", label: "Telegram", value: "@nexus_support", color: "#3b82f6" },
          { icon: "⏰", label: "Время ответа", value: "до 2 часов", color: "#22d65a" },
        ].map((c, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <span className="text-2xl block mb-2">{c.icon}</span>
            <p className="text-muted-foreground text-xs mb-0.5">{c.label}</p>
            <p className="font-semibold text-sm" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["new","Новый тикет"],["history","Мои тикеты"],["faq","FAQ"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab===k
              ? { background: "linear-gradient(135deg,#22d65a,#16a34a)", color: "#000" }
              : { background: "rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* New ticket */}
      {tab === "new" && !sent && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Тема обращения</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Кратко опишите проблему"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Сообщение</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Опишите подробно..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <button onClick={handleSend} disabled={loading || !subject || !message}
            className="w-full py-3.5 rounded-xl font-bold text-black text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}>
            {loading ? "Отправка..." : "Отправить сообщение"}
          </button>
        </div>
      )}

      {tab === "new" && sent && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="text-5xl block mb-3">✅</span>
          <h3 className="text-white font-oswald font-bold text-xl mb-2">Сообщение отправлено!</h3>
          <p className="text-muted-foreground text-sm">Ответим в Telegram в течение 2 часов</p>
          <button onClick={() => setSent(false)}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-white transition-colors">
            Написать ещё
          </button>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-muted-foreground">Обращений пока нет</p>
            </div>
          ) : tickets.map(t => (
            <div key={t.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white font-semibold text-sm">{t.subject}</p>
                <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                  style={t.status === "closed"
                    ? { background: "rgba(34,214,90,0.1)", color: "#22d65a" }
                    : { background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                  {t.status === "closed" ? "Закрыт" : "Открыт"}
                </span>
              </div>
              <p className="text-muted-foreground text-xs mb-3">{t.message}</p>
              {t.admin_reply && (
                <div className="p-3 rounded-xl"
                  style={{ background: "rgba(34,214,90,0.06)", border: "1px solid rgba(34,214,90,0.15)" }}>
                  <p className="text-xs text-neon-green font-semibold mb-1">Ответ поддержки:</p>
                  <p className="text-muted-foreground text-xs">{t.admin_reply}</p>
                </div>
              )}
              <p className="text-muted-foreground text-xs mt-2">
                {new Date(t.created_at).toLocaleString("ru-RU")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {tab === "faq" && (
        <div className="glass-card rounded-2xl p-5 space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left text-sm text-white font-medium"
              >
                {f.q}
                <span className="text-muted-foreground text-lg ml-2">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <p className="text-muted-foreground text-sm pb-3 animate-fade-in">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
