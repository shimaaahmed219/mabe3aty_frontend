import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { pageCardInner } from '@/lib/pageCardClasses';
import { btnPrimarySolid, focusRingBidex, textAccentBidex } from '@/lib/theme';
import { AuthDecoratedPage } from './AuthShell';

const authCardShell =
  'w-full max-w-[420px] rounded-2xl border border-card bg-card shadow-xl overflow-hidden';
const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${focusRingBidex}`;
const btnPrimary = `w-full rounded-xl py-3 ${btnPrimarySolid}`;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
    } catch {
      setError('لم نتمكن من إرسال الرابط. تحقق من البريد أو حاول لاحقاً.');
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">استعادة كلمة المرور</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">أدخل بريدك وسنرسل لك رابطاً لتغيير كلمة المرور.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {message && <p className={`text-sm ${textAccentBidex}`}>{message}</p>}
            <button type="submit" disabled={loading} className={btnPrimary}>{loading ? 'جاري الإرسال...' : 'إرسال الرابط'}</button>
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
