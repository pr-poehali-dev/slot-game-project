import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface GameCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  glowClass: string;
  badge?: string;
}

const GAMES: GameCard[] = [
  {
    id: 'slots',
    name: 'Слоты',
    description: 'Крути барабаны и срывай джекпот!',
    icon: 'Rows3',
    gradient: 'gradient-green',
    glowClass: 'neon-glow-green',
    badge: 'Популярно',
  },
  {
    id: 'crash',
    name: 'Краш',
    description: 'Следи за графиком и выводи вовремя!',
    icon: 'TrendingUp',
    gradient: 'gradient-purple',
    glowClass: 'neon-glow-purple',
    badge: 'Горячо',
  },
  {
    id: 'dice',
    name: 'Кости',
    description: 'Классические кости — угадай число!',
    icon: 'Dices',
    gradient: 'gradient-gold',
    glowClass: 'neon-glow-gold',
  },
  {
    id: 'roulette',
    name: 'Рулетка',
    description: 'Ставь на цвет или число — выигрывай!',
    icon: 'Circle',
    gradient: 'gradient-purple',
    glowClass: 'neon-glow-purple',
  },
];

interface RecentWin {
  username: string;
  amount: number;
  game: string;
  time: string;
}

const RECENT_WINS: RecentWin[] = [
  { username: 'Alex***', amount: 12500, game: 'Краш', time: '1 мин назад' },
  { username: 'Маш***', amount: 3800, game: 'Слоты', time: '2 мин назад' },
  { username: 'Den***', amount: 25000, game: 'Рулетка', time: '4 мин назад' },
  { username: 'Kat***', amount: 750, game: 'Кости', time: '5 мин назад' },
  { username: 'Igor***', amount: 8200, game: 'Краш', time: '7 мин назад' },
  { username: 'Vol***', amount: 47000, game: 'Слоты', time: '9 мин назад' },
  { username: 'Sar***', amount: 1900, game: 'Рулетка', time: '11 мин назад' },
  { username: 'Max***', amount: 5600, game: 'Кости', time: '12 мин назад' },
];

const STAT_ITEMS = [
  { label: 'Активных игроков', value: '2 847', icon: 'Users' },
  { label: 'Выплачено сегодня', value: '1.4M ₽', icon: 'TrendingUp' },
  { label: 'Игр сыграно', value: '94 210', icon: 'Gamepad2' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Rotate live-wins ticker every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % RECENT_WINS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentWin = RECENT_WINS[tickerIndex];

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto">

      {/* ── Hero ── */}
      <section
        className={`text-center mb-10 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
          style={{ background: 'rgba(34,214,90,0.1)', border: '1px solid rgba(34,214,90,0.25)', color: 'var(--neon-green)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--neon-green)' }} />
          Live — играют прямо сейчас
        </div>

        <h1
          className="text-4xl md:text-6xl font-bold mb-3 leading-tight"
          style={{ textShadow: '0 0 40px rgba(34,214,90,0.4)' }}
        >
          ДОБРО ПОЖАЛОВАТЬ{' '}
          <span style={{ color: 'var(--neon-green)' }}>В CASINO</span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg mb-6">
          Лучшие игры, мгновенные выплаты, честный шанс
        </p>

        {/* Balance card */}
        <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl neon-glow-green"
          style={{ background: 'rgba(34,214,90,0.07)', border: '1px solid rgba(34,214,90,0.25)' }}>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Ваш баланс</p>
            <p
              className="text-3xl font-bold"
              style={{ color: 'var(--neon-green)', textShadow: '0 0 20px rgba(34,214,90,0.5)' }}
            >
              {(user?.balance ?? 0).toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ₽
            </p>
          </div>
          <button
            onClick={() => navigate('/deposit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background: 'var(--neon-green)',
              color: '#000',
              boxShadow: '0 0 16px rgba(34,214,90,0.4)',
            }}
          >
            <Icon name="Plus" size={16} />
            Пополнить
          </button>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section
        className={`grid grid-cols-3 gap-3 mb-10 transition-all duration-700 delay-100 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {STAT_ITEMS.map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-xl py-4 px-3 text-center"
          >
            <Icon
              name={s.icon}
              size={20}
              className="mx-auto mb-2"
              style={{ color: 'var(--neon-green)' }}
            />
            <p
              className="text-base md:text-xl font-bold"
              style={{ color: 'var(--neon-green)' }}
            >
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Game cards ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-white">Игры</h2>
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--neon-green)' }}
          >
            Все игры
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GAMES.map((game, index) => (
            <div
              key={game.id}
              className={`glass-card rounded-2xl overflow-hidden transition-all duration-700 cursor-pointer group ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${150 + index * 80}ms` }}
              onClick={() => navigate('/games')}
            >
              {/* Card top gradient strip */}
              <div className={`${game.gradient} p-6 flex flex-col items-center`}>
                <div className="relative animate-float">
                  <Icon name={game.icon} size={48} color="white" />
                </div>
                {game.badge && (
                  <span className="mt-2 text-xs font-bold px-2 py-0.5 rounded-full bg-black/30 text-white uppercase tracking-wider">
                    {game.badge}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">{game.description}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/games'); }}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${game.glowClass} group-hover:scale-105`}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Играть
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live wins ticker ── */}
      <section
        className={`transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Icon name="Flame" size={18} style={{ color: 'var(--neon-gold)' }} />
          <h2 className="text-lg font-bold text-white">Последние выигрыши</h2>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--neon-gold)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--neon-gold)' }} />
            Live
          </span>
        </div>

        {/* Highlighted win (animated) */}
        <div
          key={tickerIndex}
          className="glass-card rounded-xl px-5 py-4 mb-3 flex items-center gap-4 animate-fade-in neon-glow-gold"
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)' }}
          >
            <Icon name="Trophy" size={20} style={{ color: 'var(--neon-gold)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              <span style={{ color: 'var(--neon-gold)' }}>{currentWin.username}</span>
              {' '}выиграл в{' '}
              <span className="text-gray-300">{currentWin.game}</span>
            </p>
            <p className="text-xs text-gray-500">{currentWin.time}</p>
          </div>
          <p
            className="text-lg font-bold shrink-0"
            style={{ color: 'var(--neon-gold)' }}
          >
            +{currentWin.amount.toLocaleString('ru-RU')} ₽
          </p>
        </div>

        {/* All wins grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RECENT_WINS.map((win, i) => (
            <div
              key={i}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/5"
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-bold"
                style={{ background: 'rgba(34,214,90,0.1)', color: 'var(--neon-green)' }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{win.username}</p>
                <p className="text-xs text-gray-500">{win.game} · {win.time}</p>
              </div>
              <p
                className="text-sm font-bold shrink-0"
                style={{ color: 'var(--neon-green)' }}
              >
                +{win.amount.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Promo banner ── */}
      <section
        className={`mt-10 transition-all duration-700 delay-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 neon-glow-green"
          style={{
            background: 'linear-gradient(135deg, rgba(34,214,90,0.12) 0%, rgba(168,85,247,0.08) 100%)',
            border: '1px solid rgba(34,214,90,0.2)',
          }}
        >
          <div className="text-4xl animate-float">🎁</div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white mb-1">
              Бонус на первое пополнение
            </h3>
            <p className="text-gray-400 text-sm">
              Пополните счёт и получите 100% бонус до 10 000 ₽
            </p>
          </div>
          <button
            onClick={() => navigate('/deposit')}
            className="shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              background: 'var(--neon-green)',
              color: '#000',
              boxShadow: '0 0 20px rgba(34,214,90,0.4)',
            }}
          >
            Пополнить
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
