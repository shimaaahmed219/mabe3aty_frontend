import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setAuth } from '@/store/slices/authSlice';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { AuthShell, authInputClass } from './AuthShell';
import { PasswordField } from './PasswordField';

const linkAccent =
  'font-medium text-[var(--bidex-primary)] transition-colors hover:underline dark:text-sky-400 dark:hover:text-sky-300';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      dispatch(setAuth({ user: data.user, token: data.token }));
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="سجّل دخولك لمتابعة المبيعات والفواتير من لوحة واحدة نظيفة وسريعة."
      activeTab="login"
      footer={
        <>
          <span>ليس لديك حساب؟ </span>
          <Link to="/register" className={linkAccent}>
            إنشاء حساب جديد
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={authInputClass}
          />
        </div>
        <PasswordField
          id="password"
          label="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 leading-snug dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
          <span className="text-slate-500 dark:text-slate-500 order-2 sm:order-1">بتسجيلك توافق على شروط الاستخدام.</span>
          <Link to="/forgot-password" className={`${linkAccent} order-1 sm:order-2 shrink-0`}>
            نسيت كلمة المرور؟
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 py-3 btn-primary text-[0.95rem] shadow-md disabled:opacity-60"
        >
          {loading ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
        </button>
      </form>
    </AuthShell>
  );
}
