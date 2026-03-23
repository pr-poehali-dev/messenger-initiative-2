import { useState } from 'react';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;

type Mode = 'login' | 'register' | 'code';
type Method = 'phone' | 'email';

interface AuthProps {
  onAuth: (user: { name: string; avatar: string; contact: string }) => void;
}

const WAVE_HEIGHTS = [6, 10, 14, 8, 16, 12, 6, 14, 10, 16, 8, 12];

export default function Auth({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<Method>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contact = method === 'phone' ? phone : email;

  const validatePhone = (v: string) => /^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/.test(v) || v.replace(/\D/g, '').length >= 11;
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handlePhoneInput = (v: string) => {
    let digits = v.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.startsWith('7')) {
      let result = '+7';
      if (digits.length > 1) result += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) result += ') ' + digits.slice(4, 7);
      if (digits.length >= 7) result += '-' + digits.slice(7, 9);
      if (digits.length >= 9) result += '-' + digits.slice(9, 11);
      setPhone(result);
    } else {
      setPhone(v);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (method === 'phone' && !validatePhone(phone)) {
      setError('Введите корректный номер телефона'); return;
    }
    if (method === 'email' && !validateEmail(email)) {
      setError('Введите корректный email'); return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setError('Введите имя (минимум 2 символа)'); return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов'); return;
    }

    setLoading(true);
    try {
      const action = mode === 'register' ? 'register' : 'login';
      const res = await fetch(`${AUTH_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка сервера');
        setLoading(false);
        return;
      }
      localStorage.setItem('pulse_token', data.token);
      onAuth({ name: data.user.name, avatar: data.user.avatar || '🚀', contact: data.user.contact });
    } catch {
      setError('Нет соединения с сервером');
    }
    setLoading(false);
  };

  const handleCodeInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 3) {
      document.getElementById(`code-${idx + 1}`)?.focus();
    }
  };

  const handleCodeKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      document.getElementById(`code-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, hsl(265,85%,65%) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(185,90%,55%) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(320,85%,65%) 0%, transparent 70%)' }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-scale-in">
        <div className="rounded-3xl p-8"
          style={{ background: 'hsl(220,19%,10%)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold text-white mb-4"
              style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))', boxShadow: '0 8px 32px rgba(147,89,245,0.4)' }}>
              P
            </div>
            <h1 className="font-bold text-2xl text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {mode === 'code' ? 'Подтверждение' : mode === 'register' ? 'Создать аккаунт' : 'Добро пожаловать'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              {mode === 'code'
                ? `Введите код, отправленный на ${contact}`
                : mode === 'register'
                  ? 'Зарегистрируйтесь в Pulse'
                  : 'Войдите в Pulse Messenger'}
            </p>
          </div>

          {/* Voice wave decoration */}
          <div className="flex items-end justify-center gap-0.5 mb-6 h-5">
            {WAVE_HEIGHTS.map((h, i) => (
              <div key={i} className="w-1 rounded-full"
                style={{
                  height: `${h}px`,
                  background: 'linear-gradient(to top, hsl(265,85%,65%), hsl(185,90%,55%))',
                  opacity: 0.4,
                  animation: `wave 1.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }} />
            ))}
          </div>

          {mode === 'code' ? (
            /* Code input */
            <div className="flex flex-col gap-6">
              <div className="flex gap-3 justify-center">
                {code.map((d, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={d}
                    onChange={e => handleCodeInput(e.target.value, i)}
                    onKeyDown={e => handleCodeKey(e, i)}
                    maxLength={1}
                    className="w-14 h-14 rounded-2xl text-center text-xl font-bold text-foreground border focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderColor: d ? 'hsl(265,85%,65%)' : 'rgba(255,255,255,0.1)',
                      boxShadow: d ? '0 0 12px rgba(147,89,245,0.3)' : 'none',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="text-xs text-red-400 text-center animate-fade-in">{error}</div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))', boxShadow: '0 4px 24px rgba(147,89,245,0.4)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin" /> Проверяем...
                  </span>
                ) : 'Подтвердить'}
              </button>

              <button onClick={() => { setMode('register'); setCode(['','','','']); setError(''); }}
                className="text-sm text-muted-foreground hover:text-foreground text-center transition-colors">
                Отправить код повторно
              </button>
            </div>
          ) : (
            /* Login / Register form */
            <div className="flex flex-col gap-4">
              {/* Method toggle */}
              <div className="flex rounded-2xl p-1"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['phone', 'email'] as Method[]).map(m => (
                  <button key={m} onClick={() => { setMethod(m); setError(''); }}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={method === m
                      ? { background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(320,85%,65%))', color: 'white' }
                      : { color: 'hsl(var(--muted-foreground))' }
                    }>
                    {m === 'phone' ? '📱 Телефон' : '📧 Почта'}
                  </button>
                ))}
              </div>

              {/* Name (only register) */}
              {mode === 'register' && (
                <div className="relative animate-fade-in">
                  <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              )}

              {/* Phone / Email */}
              <div className="relative">
                <Icon name={method === 'phone' ? 'Phone' : 'Mail'} size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {method === 'phone' ? (
                  <input
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    value={phone}
                    onChange={e => handlePhoneInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                ) : (
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 animate-fade-in px-1">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))', boxShadow: '0 4px 24px rgba(147,89,245,0.4)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    {mode === 'register' ? 'Отправляем код...' : 'Входим...'}
                  </span>
                ) : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
              </button>

              {/* Toggle login/register */}
              <div className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>Нет аккаунта?{' '}
                    <button onClick={() => { setMode('register'); setError(''); }}
                      className="font-medium transition-colors hover:text-white"
                      style={{ color: 'hsl(265,85%,75%)' }}>
                      Создать
                    </button>
                  </>
                ) : (
                  <>Уже есть аккаунт?{' '}
                    <button onClick={() => { setMode('login'); setError(''); }}
                      className="font-medium transition-colors hover:text-white"
                      style={{ color: 'hsl(265,85%,75%)' }}>
                      Войти
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
          <Icon name="Shield" size={12} />
          <span>Данные защищены сквозным шифрованием</span>
        </div>
      </div>
    </div>
  );
}