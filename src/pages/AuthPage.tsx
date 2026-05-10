import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Icon from "@/components/ui/icon";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tgStep, setTgStep] = useState(false);
  const [tgCode, setTgCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password) { setError("Заполните все поля"); return; }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setError("");
    setTgStep(true);
  };

  const handleConfirm = async () => {
    if (tgCode.length < 3) { setError("Введите код из Telegram"); return; }
    setLoading(true);
    setError("");
    try {
      const fn = mode === "register" ? api.auth.register : api.auth.login;
      const data = await fn(username.trim(), password);
      if (data.error) { setError(data.error); setLoading(false); return; }
      saveAuth(data);
      navigate("/");
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(34,214,90,0.07) 0%, transparent 65%)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.07) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: "linear-gradient(135deg, #22d65a, #16a34a)" }}
          >
            <span className="text-3xl font-oswald font-black text-black">N</span>
          </div>
          <h1 className="text-5xl font-oswald font-black text-white tracking-widest">NEXUS</h1>
          <p className="text-muted-foreground text-sm mt-1">Игровая платформа нового поколения</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {!tgStep ? (
            <>
              {/* Tabs */}
              <div
                className="flex rounded-xl overflow-hidden mb-6"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); }}
                    className="flex-1 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl"
                    style={
                      mode === m
                        ? { background: "linear-gradient(135deg,#22d65a,#16a34a)", color: "#000" }
                        : { color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    {m === "login" ? "Войти" : "Регистрация"}
                  </button>
                ))}
              </div>

              {/* Bonus hint on register */}
              {mode === "register" && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl mb-4"
                  style={{ background: "rgba(34,214,90,0.08)", border: "1px solid rgba(34,214,90,0.2)" }}
                >
                  <span className="text-xl">🎁</span>
                  <p className="text-sm font-semibold text-neon-green">+100 ₽ бонус при регистрации!</p>
                </div>
              )}

              {/* Telegram notice */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-5"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}
              >
                <span className="text-xl">✈️</span>
                <div>
                  <p className="text-xs font-semibold text-blue-400">Авторизация через Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    Запустите <span className="text-blue-400">@nexus_game_bot</span> для подтверждения
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Логин</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите логин"
                    autoComplete="username"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all placeholder:text-gray-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(34,214,90,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all placeholder:text-gray-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(34,214,90,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

              <button
                onClick={handleSubmit}
                className="w-full mt-5 py-3.5 rounded-xl font-bold text-black text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}
              >
                {mode === "login" ? "Войти" : "Создать аккаунт"} →
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <span className="text-5xl block mb-3 animate-float">✈️</span>
                <h3 className="text-white font-oswald text-xl">Подтверди в Telegram</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Открой <span className="text-blue-400">@nexus_game_bot</span> и введи код
                </p>
              </div>
              <input
                value={tgCode}
                onChange={(e) => setTgCode(e.target.value)}
                placeholder="Код из бота (например: 1234)"
                className="w-full px-4 py-3 rounded-xl text-white text-center tracking-widest text-lg outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(59,130,246,0.3)" }}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
              {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-black text-sm disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#22d65a,#16a34a)" }}
              >
                {loading ? "Подключение..." : "Подтвердить"}
              </button>
              <button
                onClick={() => { setTgStep(false); setError(""); }}
                className="w-full mt-2 py-2 text-muted-foreground text-sm hover:text-white transition-colors"
              >
                ← Назад
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Используя платформу, вы соглашаетесь с{" "}
          <span className="text-neon-green cursor-pointer hover:underline">условиями использования</span>
        </p>
      </div>
    </div>
  );
}
