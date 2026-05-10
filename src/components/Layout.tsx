import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { getUser, isLoggedIn, logout, User } from "@/lib/auth";
import Icon from "@/components/ui/icon";

const NAV = [
  { path: "/", label: "Главная", icon: "Home" },
  { path: "/games", label: "Игры", icon: "Gamepad2" },
  { path: "/profile", label: "Профиль", icon: "User" },
  { path: "/deposit", label: "Пополнение", icon: "ArrowDownCircle" },
  { path: "/withdraw", label: "Вывод", icon: "ArrowUpCircle" },
  { path: "/history", label: "История", icon: "Clock" },
  { path: "/support", label: "Поддержка", icon: "MessageCircle" },
];

const MOBILE_NAV = [
  { path: "/", label: "Главная", icon: "Home" },
  { path: "/games", label: "Игры", icon: "Gamepad2" },
  { path: "/deposit", label: "", icon: "Plus", isSpecial: true },
  { path: "/history", label: "История", icon: "Clock" },
  { path: "/profile", label: "Профиль", icon: "User" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/auth"); return; }
    setUser(getUser());
  }, [navigate]);

  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent) => {
      setUser((prev) => prev ? { ...prev, balance: e.detail } : prev);
      const u = getUser();
      if (u) { u.balance = e.detail; localStorage.setItem("user", JSON.stringify(u)); }
    };
    window.addEventListener("balance-update", handleBalanceUpdate as EventListener);
    return () => window.removeEventListener("balance-update", handleBalanceUpdate as EventListener);
  }, []);

  const handleLogout = () => { logout(); navigate("/auth"); };

  if (!user) return null;

  const navItems = [...NAV, ...(user.is_admin ? [{ path: "/admin", label: "Админ", icon: "Shield" }] : [])];

  return (
    <div className="min-h-screen" style={{ background: "var(--dark-bg)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full w-64 hidden md:flex flex-col z-40"
        style={{
          background: "rgba(8,12,20,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-oswald font-black text-lg"
              style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}
            >
              N
            </div>
            <span className="text-white font-oswald font-bold text-xl tracking-widest">NEXUS</span>
          </div>
        </div>

        {/* Balance */}
        <div
          className="mx-4 mb-4 p-3 rounded-xl"
          style={{ background: "rgba(34,214,90,0.07)", border: "1px solid rgba(34,214,90,0.15)" }}
        >
          <p className="text-xs text-muted-foreground mb-0.5">Баланс</p>
          <p className="text-neon-green font-oswald font-bold text-xl">
            {user.balance.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? "nav-item-active" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
                {item.path === "/admin" && (
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}
                  >
                    ADM
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.username}</p>
              <p className="text-muted-foreground text-xs">{user.is_admin ? "Администратор" : "Игрок"}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between md:hidden"
        style={{
          background: "rgba(8,12,20,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span className="text-white font-oswald font-bold text-xl tracking-widest">NEXUS</span>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold px-3 py-1 rounded-lg"
            style={{ background: "rgba(34,214,90,0.1)", color: "#22d65a" }}
          >
            {user.balance.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}
          >
            {user.username[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 pb-24 md:pb-8 grid-bg min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
        style={{
          background: "rgba(8,12,20,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {MOBILE_NAV.map((item) => {
          const active = location.pathname === item.path || (item.path !== "/" && !item.isSpecial && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                active ? "text-neon-green" : "text-muted-foreground"
              }`}
            >
              {item.isSpecial ? (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center -mt-5 mb-0.5"
                  style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}
                >
                  <Icon name="Plus" size={20} className="text-black" />
                </div>
              ) : (
                <Icon name={item.icon} size={20} />
              )}
              {!item.isSpecial && <span className="text-[10px] font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}