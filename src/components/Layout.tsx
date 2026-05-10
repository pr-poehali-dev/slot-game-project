import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getUser, isLoggedIn, logout } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Главная', path: '/', icon: 'Home' },
  { label: 'Игры', path: '/games', icon: 'Gamepad2' },
  { label: 'Профиль', path: '/profile', icon: 'User' },
  { label: 'Пополнение', path: '/deposit', icon: 'PlusCircle' },
  { label: 'Вывод', path: '/withdraw', icon: 'ArrowUpCircle' },
  { label: 'История', path: '/history', icon: 'Clock' },
  { label: 'Поддержка', path: '/support', icon: 'MessageCircle' },
  { label: 'Админ', path: '/admin', icon: 'Shield', adminOnly: true },
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => !i.adminOnly).slice(0, 5);

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/auth');
      return;
    }
    setUser(getUser());
  }, [navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ balance: number }>;
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, balance: customEvent.detail.balance };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    };
    window.addEventListener('balance-update', handler);
    return () => window.removeEventListener('balance-update', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return user?.is_admin;
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dark-bg)' }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-full z-40"
        style={{
          background: 'var(--card-bg)',
          borderRight: '1px solid var(--card-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid var(--card-border)' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg neon-glow-green"
            style={{ background: 'rgba(34,214,90,0.15)', border: '1px solid var(--neon-green)' }}
          >
            <Icon name="Zap" size={20} style={{ color: 'var(--neon-green)' }} />
          </div>
          <span
            className="text-2xl font-bold tracking-widest"
            style={{ color: 'var(--neon-green)', textShadow: '0 0 16px rgba(34,214,90,0.5)' }}
          >
            CASINO
          </span>
        </div>

        {/* User card */}
        <div
          className="mx-4 mt-4 rounded-xl p-4"
          style={{ background: 'rgba(34,214,90,0.06)', border: '1px solid rgba(34,214,90,0.15)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ background: 'rgba(34,214,90,0.15)' }}
            >
              <Icon name="User" size={18} style={{ color: 'var(--neon-green)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Игрок</p>
              <p className="font-semibold text-sm text-white truncate">{user.username}</p>
            </div>
          </div>
          <div
            className="rounded-lg px-3 py-2"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <p className="text-xs text-gray-500 mb-0.5">Баланс</p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--neon-green)', textShadow: '0 0 12px rgba(34,214,90,0.4)' }}
            >
              {(user.balance ?? 0).toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ₽
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  active ? 'nav-item-active' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={
                  active
                    ? { borderLeft: '3px solid var(--neon-green)', paddingLeft: '13px' }
                    : {}
                }
              >
                <Icon
                  name={item.icon}
                  size={18}
                  style={{ color: active ? 'var(--neon-green)' : undefined }}
                />
                {item.label}
                {item.adminOnly && (
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(168,85,247,0.2)', color: 'var(--neon-purple)' }}
                  >
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <Icon name="LogOut" size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {/* Top bar (mobile) */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }}
        >
          <span
            className="text-xl font-bold tracking-widest"
            style={{ color: 'var(--neon-green)' }}
          >
            CASINO
          </span>
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold"
              style={{ color: 'var(--neon-green)' }}
            >
              {(user.balance ?? 0).toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ₽
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="grid-bg min-h-full">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--card-border)',
        }}
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200"
              style={{ color: active ? 'var(--neon-green)' : 'rgba(255,255,255,0.35)' }}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--neon-green)' }}
                />
              )}
            </button>
          );
        })}

        {/* Logout on mobile */}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-red-500/60 transition-all duration-200 hover:text-red-400"
        >
          <Icon name="LogOut" size={20} />
          <span className="text-[10px] font-medium">Выйти</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
