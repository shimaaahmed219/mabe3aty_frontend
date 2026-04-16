import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { appToast } from '@/lib/appToast';
import { reportFormValidity } from '@/lib/formValidation';
import { pageCardInner } from '@/lib/pageCardClasses';
import { btnPrimarySolid, controlInputHover, textAccentBidex } from '@/lib/theme';
import { AuthDecoratedPage } from './AuthShell';
import { PasswordField } from './PasswordField';

const authCardShell =
  'w-full max-w-[420px] rounded-2xl border border-card bg-card shadow-xl overflow-hidden';
const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${controlInputHover}`;
const btnPrimary = `w-full rounded-xl py-3 ${btnPrimarySolid}`;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reportFormValidity(e.currentTarget)) return;
    setError('');
    setMessage('');
    if (password !== passwordConfirmation) {
      setError('كلمة المرور غير متطابقة');
      appToast.warning('كلمة المرور غير متطابقة', 'تأكد من تطابق الحقلين.');
      return;
    }
    if (!token) {
      const msg = 'رابط غير صالح. اطلب رابطاً جديداً من صفحة نسيت كلمة المرور.';
      setError(msg);
      appToast.error('رابط غير صالح', msg);
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, token, password, password_confirmation: passwordConfirmation });
      setMessage('تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.');
      appToast.success('تم تغيير كلمة المرور', 'سيتم تحويلك إلى تسجيل الدخول.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'رابط منتهي أو غير صالح. اطلب رابطاً جديداً.');
      setError(msg);
      appToast.error('تعذّر إعادة التعيين', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthDecoratedPage>
      <div className="w-full max-w-[420px]">
      <div className={authCardShell}>
        <div className="h-px w-full bg-gradient-to-l from-transparent via-[var(--bidex-primary)] to-transparent opacity-90" />
        <div className={`p-6 sm:p-8 ${pageCardInner}`}>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">تعيين كلمة مرور جديدة</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
            </div>
            <PasswordField
              id="reset-password"
              label="كلمة المرور الجديدة"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              inputClassName={inputClass}
            />
            <PasswordField
              id="reset-password-confirm"
              label="تأكيد كلمة المرور"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              inputClassName={inputClass}
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {message && <p className={`text-sm ${textAccentBidex}`}>{message}</p>}
            <button type="submit" disabled={loading} className={btnPrimary}>{loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button>
          </form>
          <p className="mt-6">
            <Link to="/login" className={`text-sm hover:underline ${textAccentBidex}`}>العودة لتسجيل الدخول</Link>
          </p>
        </div>
      </div>
      </div>
    </AuthDecoratedPage>
  );
}
