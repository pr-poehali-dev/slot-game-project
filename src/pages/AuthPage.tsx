import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import Icon from '@/components/ui/icon';

type Tab = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const data =
        tab === 'login'
          ? await api.auth.login(username.trim(), password)
          : await api.auth.register(username.trim(), password);

      if (data.error || data.detail) {
        setError(data.error || data.detail || 'Произошла ошибка');
        return;
      }

      saveAuth(data);
      navigate('/');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (newTab: Tab) => {
    setTab(newTab);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div
      className="min-h-screen grid-bg flex items-center justify-center p-4"
      style={{ background: 'var(--dark-bg)' }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--neon-green)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--neon-purple)' }}
        />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 neon-glow-green animate-pulse-glow"
            style={{ background: 'rgba(34,214,90,0.1)', border: '1px solid var(--neon-green)' }}
          >
            <Icon name="Zap" size={40} style={{ color: 'var(--neon-green)' }} />
          </div>
          <h1
            className="text-5xl font-bold tracking-widest"
            style={{ color: 'var(--neon-green)', textShadow: '0 0 30px rgba(34,214,90,0.6)' }}
          >
            CASINO
          </h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--neon-gold)' }}>
            🎁 100 ₽ бонус при регистрации!
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(34,214,90,0.08)' }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabSwitch(t)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={
                  tab === t
                    ? {
                        background: 'var(--neon-green)',
                        color: '#000',
                        boxShadow: '0 0 16px rgba(34,214,90,0.4)',
                      }
                    : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                {t === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Имя пользователя
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--neon-green)' }}
                >
                  <Icon name="User" size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 placeholder-gray-600"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--neon-green)')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--card-border)')
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Пароль
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--neon-green)' }}
                >
                  <Icon name="Lock" size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 placeholder-gray-600"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--card-border)',
                    color: '#fff',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--neon-green)')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--card-border)')
                  }
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm animate-fade-in"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                }}
              >
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgba(34,214,90,0.4)'
                  : 'var(--neon-green)',
                color: '#000',
                boxShadow: loading ? 'none' : '0 0 24px rgba(34,214,90,0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  {tab === 'login' ? 'Вход...' : 'Регистрация...'}
                </span>
              ) : tab === 'login' ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {tab === 'login'
              ? 'Нет аккаунта? '
              : 'Уже есть аккаунт? '}
            <button
              onClick={() => handleTabSwitch(tab === 'login' ? 'register' : 'login')}
              className="underline transition-colors"
              style={{ color: 'var(--neon-green)' }}
            >
              {tab === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
            </button>
          </p>
        </div>

        {/* Bottom tag */}
        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Нажимая кнопку, вы соглашаетесь с правилами платформы
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
