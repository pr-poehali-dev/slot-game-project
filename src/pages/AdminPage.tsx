import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface AdminStats {
  users: number;
  total_balance: number;
  games: number;
  pending_deposits: { count: number; amount: number };
  pending_withdrawals: { count: number; amount: number };
}

interface UserRow {
  id: number;
  username: string;
  balance: number;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

interface TxRow {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface TicketRow {
  id: number;
  username: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"stats"|"users"|"payments"|"tickets">("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replyTicketId, setReplyTicketId] = useState<number | null>(null);

  useEffect(() => {
    if (tab === "stats") {
      setLoading(true);
      api.admin.stats().then(d => { if (!d.error) setStats(d); setLoading(false); });
    } else if (tab === "users") {
      setLoading(true);
      api.admin.users().then(d => { if (d.users) setUsers(d.users); setLoading(false); });
    } else if (tab === "payments") {
      setLoading(true);
      api.admin.transactions().then(d => { if (d.transactions) setTxs(d.transactions); setLoading(false); });
    } else if (tab === "tickets") {
      setLoading(true);
      api.admin.tickets().then(d => { if (d.tickets) setTickets(d.tickets); setLoading(false); });
    }
  }, [tab]);

  const handleBan = async (id: number, banned: boolean) => {
    await api.admin.ban(id, banned);
    setUsers(u => u.map(x => x.id === id ? { ...x, is_banned: banned } : x));
  };

  const handleApproveTx = async (id: number, action: "approve"|"reject") => {
    await api.admin.approveTx(id, action);
    setTxs(t => t.map(x => x.id === id ? { ...x, status: action === "approve" ? "completed" : "rejected" } : x));
  };

  const handleReply = async (ticketId: number) => {
    if (!reply.trim()) return;
    await api.admin.replyTicket(ticketId, reply);
    setTickets(t => t.map(x => x.id === ticketId ? { ...x, admin_reply: reply, status: "closed" } : x));
    setReplyTicketId(null);
    setReply("");
  };

  const Loader = () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.15)" }}>
          <Icon name="Shield" size={20} style={{ color: "#a855f7" }} />
        </div>
        <div>
          <h2 className="text-2xl font-oswald font-bold text-white">Админ-панель</h2>
          <p className="text-muted-foreground text-xs">Управление платформой</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {([["stats","Статистика"],["users","Игроки"],["payments","Платежи"],["tickets","Тикеты"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab===k
              ? { background: "linear-gradient(135deg,#a855f7,#7c3aed)", color: "#fff" }
              : { background: "rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", border: "1px solid rgba(255,255,255,0.08)" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === "stats" && (loading ? <Loader /> : stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Игроков", value: stats.users, icon: "Users", color: "#22d65a" },
              { label: "Игр сыграно", value: stats.games, icon: "Gamepad2", color: "#3b82f6" },
              { label: "Средства на балансах", value: `${stats.total_balance.toLocaleString("ru-RU",{maximumFractionDigits:0})} ₽`, icon: "Wallet", color: "#f59e0b" },
              { label: "Ожид. пополнений", value: `${stats.pending_deposits.count} / ${stats.pending_deposits.amount.toLocaleString()} ₽`, icon: "ArrowDownCircle", color: "#22d65a" },
              { label: "Ожид. выводов", value: `${stats.pending_withdrawals.count} / ${stats.pending_withdrawals.amount.toLocaleString()} ₽`, icon: "ArrowUpCircle", color: "#a855f7" },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name={s.icon} size={16} style={{ color: s.color }} />
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </div>
                <p className="font-oswald font-bold text-xl text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Users */}
      {tab === "users" && (loading ? <Loader /> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 text-xs text-muted-foreground uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <span>Игрок</span><span className="text-center">Баланс</span>
            <span className="text-center">Адм</span><span className="text-center">Статус</span>
            <span className="text-right">Действие</span>
          </div>
          {users.map((u, i) => (
            <div key={u.id} className="grid grid-cols-5 items-center px-5 py-4"
              style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                  {u.username[0].toUpperCase()}
                </div>
                <span className="text-white text-sm">{u.username}</span>
              </div>
              <span className="text-center text-sm font-semibold text-neon-green">
                {u.balance.toLocaleString("ru-RU",{maximumFractionDigits:0})} ₽
              </span>
              <span className="text-center text-xs">{u.is_admin ? "✓" : "—"}</span>
              <div className="flex justify-center">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={u.is_banned
                    ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
                    : { background: "rgba(34,214,90,0.1)", color: "#22d65a" }}>
                  {u.is_banned ? "Заблокирован" : "Активен"}
                </span>
              </div>
              <div className="flex justify-end">
                <button onClick={() => handleBan(u.id, !u.is_banned)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: u.is_banned ? "#22d65a" : "#ef4444" }}>
                  <Icon name={u.is_banned ? "UserCheck" : "Ban"} size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Payments */}
      {tab === "payments" && (loading ? <Loader /> : (
        <div className="space-y-3">
          {txs.filter(t => t.status === "pending" || t.type !== "bonus").map((t) => (
            <div key={t.id} className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: t.type === "deposit" ? "rgba(34,214,90,0.1)" : "rgba(168,85,247,0.1)" }}>
                  {t.type === "deposit" ? "↓" : "↑"}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {t.type === "deposit" ? "Пополнение" : "Вывод"} #{t.id}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(t.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-bold text-sm ${t.type==="deposit" ? "text-neon-green" : "text-purple-400"}`}>
                  {t.type==="deposit" ? "+" : "-"}{t.amount.toLocaleString()} ₽
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={t.status==="completed" ? { background:"rgba(34,214,90,0.1)",color:"#22d65a" }
                    : t.status==="pending" ? { background:"rgba(245,158,11,0.1)",color:"#f59e0b" }
                    : { background:"rgba(239,68,68,0.1)",color:"#ef4444" }}>
                  {t.status==="completed" ? "Выполнен" : t.status==="pending" ? "Ожидание" : "Отклонён"}
                </span>
                {t.status === "pending" && (
                  <div className="flex gap-1">
                    <button onClick={() => handleApproveTx(t.id, "approve")}
                      className="p-1.5 rounded-lg transition-colors hover:bg-green-500/10"
                      style={{ color: "#22d65a" }}>
                      <Icon name="Check" size={14} />
                    </button>
                    <button onClick={() => handleApproveTx(t.id, "reject")}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ color: "#ef4444" }}>
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {txs.filter(t => t.status === "pending").length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-3">✅</span>
              <p className="text-muted-foreground">Нет ожидающих платежей</p>
            </div>
          )}
        </div>
      ))}

      {/* Tickets */}
      {tab === "tickets" && (loading ? <Loader /> : (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-muted-foreground">Тикетов нет</p>
            </div>
          ) : tickets.map(t => (
            <div key={t.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">{t.subject}</p>
                  <p className="text-muted-foreground text-xs">от {t.username} • {new Date(t.created_at).toLocaleString("ru-RU")}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={t.status==="closed"
                    ? { background:"rgba(34,214,90,0.1)",color:"#22d65a" }
                    : { background:"rgba(245,158,11,0.1)",color:"#f59e0b" }}>
                  {t.status==="closed" ? "Закрыт" : "Открыт"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-3">{t.message}</p>
              {t.admin_reply && (
                <div className="p-3 rounded-xl mb-3"
                  style={{ background:"rgba(34,214,90,0.06)",border:"1px solid rgba(34,214,90,0.15)" }}>
                  <p className="text-xs text-neon-green font-semibold mb-1">Ваш ответ:</p>
                  <p className="text-muted-foreground text-sm">{t.admin_reply}</p>
                </div>
              )}
              {!t.admin_reply && (
                replyTicketId === t.id ? (
                  <div className="space-y-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)}
                      placeholder="Введите ответ..." rows={3}
                      className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none resize-none"
                      style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)" }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReply(t.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                        style={{ background:"linear-gradient(135deg,#22d65a,#16a34a)" }}>
                        Отправить
                      </button>
                      <button onClick={() => setReplyTicketId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyTicketId(t.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    style={{ background:"rgba(168,85,247,0.15)",color:"#a855f7" }}>
                    Ответить
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}