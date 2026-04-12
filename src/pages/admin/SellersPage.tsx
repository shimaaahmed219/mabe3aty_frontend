import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { reportFormValidity } from '@/lib/formValidation';
import { PageWrapper } from '@/components/PageWrapper';
import type { User } from '@/lib/api';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { btnPrimarySolid, controlInputHover, outlineButtonInteractive } from '@/lib/theme';

const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${controlInputHover}`;

export function SellersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formError, setFormError] = useState('');

  const { data: sellers, isLoading } = useQuery({
    queryKey: ['admin', 'sellers'],
    queryFn: () => adminApi.sellers().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      adminApi.createSeller(data) as Promise<{ data: unknown }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
      setFormError('');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    if (!reportFormValidity(e.currentTarget)) return;
    if (password !== passwordConfirmation) {
      setFormError('كلمة المرور غير متطابقة.');
      return;
    }
    createMutation.mutate({ name, email, password, password_confirmation: passwordConfirmation });
  };

  return (
    <PageWrapper>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">البائعون</h1>
        <button type="button" onClick={() => setOpen(true)} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold sm:w-auto ${btnPrimarySolid}`}>
          <Plus className="w-4 h-4" /> إضافة بائع
        </button>
      </div>
      <div className={pageCardShell}>
        <div className={`p-5 ${pageCardInner}`}>
          {isLoading ? (
            <p className="text-slate-500 dark:text-slate-400">جاري التحميل...</p>
          ) : !sellers?.length ? (
            <p className="text-slate-500 dark:text-slate-400">لا يوجد بائعون. أضف بائعاً من الزر أعلاه.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الاسم</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers?.map((s: User) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">{s.name}</td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{s.email}</td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{s.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setOpen(false);
              setFormError('');
            }}
            aria-hidden
          />
          <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-card bg-card shadow-xl p-6 ${pageCardInner}`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">إضافة بائع</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تأكيد كلمة المرور</label>
                <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required className={inputClass} />
              </div>
              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setFormError('');
                  }}
                  className={`${outlineButtonInteractive} px-4 py-2`}
                >
                  إلغاء
                </button>
                <button type="submit" disabled={createMutation.isPending} className={`rounded-xl px-4 py-2 font-semibold disabled:opacity-60 ${btnPrimarySolid}`}>{createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
