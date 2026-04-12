import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setAuth } from '@/store/slices/authSlice';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { reportFormValidity } from '@/lib/formValidation';
import { AuthShell, authInputClass } from './AuthShell';
import { PasswordField } from './PasswordField';

const linkAccent =
  'font-medium text-[var(--bidex-primary)] transition-all duration-200 hover:text-sky-600 hover:underline hover:brightness-110 dark:text-sky-400 dark:hover:text-sky-200';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reportFormValidity(e.currentTarget)) return;
    setError('');
    if (password !== passwordConfirmation) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({ name, email, password, password_confirmation: passwordConfirmation });
      dispatch(setAuth({ user: data.user, token: data.token }));
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'فشل التسجيل'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="أنشئ حسابك في دقائق وابدأ تتبع المبيعات والتقارير بواجهة واضحة."
      activeTab="register"
      footer={
        <>
          <span>لديك حساب بالفعل؟ </span>
          <Link to="/login" className={linkAccent}>
            تسجيل الدخول
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            الاسم
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="الاسم بالكامل"
            className={authInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            البريد الإلكتروني
          </label>
          <input
            id="reg-email"
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
          id="reg-password"
          label="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <PasswordField
          id="reg-password-2"
          label="تأكيد كلمة المرور"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="new-password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 leading-snug dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-500 leading-relaxed">
          باستخدامك للنظام فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 py-3 btn-primary text-[0.95rem] shadow-md disabled:opacity-60"
        >
          {loading ? 'جاري إنشاء الحساب…' : 'تسجيل حساب جديد'}
        </button>
      </form>
    </AuthShell>
  );
}
