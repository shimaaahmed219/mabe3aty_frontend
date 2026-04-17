import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  getApiErrorMessage,
  salesLimitsApi,
  type SalesLimit,
  type SalesLimitWriteInput,
  type User,
} from '@/lib/api';
import { getPeriodEndDate, normalizeLimits, periodLabels } from '@/lib/salesLimitUtils';
import { appToast } from '@/lib/appToast';
import { useAppSelector } from '@/store/hooks';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';

type FormState = {
  target_amount: string;
  period_type: SalesLimitWriteInput['period_type'];
  period_start: string;
  user_id: string;
};

export function SalesLimitsManagePage() {
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    target_amount: '',
    period_type: 'monthly',
    period_start: new Date().toISOString().slice(0, 10),
    user_id: '',
  });

  const { data: limitsData, isLoading } = useQuery({
    queryKey: ['sales-limits'],
    queryFn: () => salesLimitsApi.list().then((r) => normalizeLimits(r.data)),
  });

  const { data: sellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ['admin', 'sellers'],
    queryFn: () => adminApi.sellers().then((r) => r.data as User[]),
    enabled: isAdmin,
  });

  const limits = limitsData ?? [];
  const activeLimit = [...limits].sort((a, b) => String(b.period_start).localeCompare(String(a.period_start)))[0];

  const createMutation = useMutation({
    mutationFn: (payload: SalesLimitWriteInput) => salesLimitsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales-limits'] });
      appToast.success('تم إنشاء هدف المبيعات');
      setForm((prev) => ({ ...prev, target_amount: '' }));
    },
    onError: (err) => appToast.error('فشل إنشاء الهدف', getApiErrorMessage(err, 'تعذر حفظ الهدف.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SalesLimitWriteInput> }) =>
      salesLimitsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales-limits'] });
      appToast.success('تم تعديل الهدف');
      setEditingId(null);
    },
    onError: (err) => appToast.error('فشل تعديل الهدف', getApiErrorMessage(err, 'تعذر تحديث الهدف.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesLimitsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales-limits'] });
      appToast.success('تم حذف الهدف');
      setEditingId(null);
    },
    onError: (err) => appToast.error('فشل حذف الهدف', getApiErrorMessage(err, 'تعذر حذف الهدف.')),
  });

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const submitCreate = () => {
    const amount = Number(form.target_amount);
    if (amount < 0 || Number.isNaN(amount)) {
      appToast.warning('قيمة الهدف غير صحيحة', 'أدخلي رقمًا أكبر من أو يساوي صفر.');
      return;
    }
    const payload: SalesLimitWriteInput = {
      target_amount: amount,
      period_type: form.period_type,
      period_start: form.period_start,
    };
    if (isAdmin && form.user_id.trim()) payload.user_id = Number(form.user_id);
    createMutation.mutate(payload);
  };

  const startEdit = (limit: SalesLimit) => {
    setEditingId(limit.id);
    setForm({
      target_amount: String(limit.target_amount),
      period_type: limit.period_type,
      period_start: limit.period_start,
      user_id: limit.user_id ? String(limit.user_id) : '',
    });
  };

  const submitUpdate = () => {
    if (!editingId) return;
    const amount = Number(form.target_amount);
    const payload: Partial<SalesLimitWriteInput> = {};
    if (!Number.isNaN(amount) && amount >= 0) payload.target_amount = amount;
    if (form.period_type) payload.period_type = form.period_type;
    if (form.period_start) payload.period_start = form.period_start;
    if (isAdmin && form.user_id.trim()) payload.user_id = Number(form.user_id);
    updateMutation.mutate({ id: editingId, payload });
  };

  return (
    <PageWrapper>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            ضبط هدف المبيعات
          </h1>
          <p className="text-sm text-muted">إضافة أو تعديل أو حذف الهدف. ملخص التقدّم يظهر في لوحة التحكم.</p>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          ← العودة للوحة التحكم
        </Link>
      </div>

      {activeLimit ? (
        <div className={`${pageCardShell} mb-4`}>
          <div className={`${pageCardInner} p-4 text-sm`}>
            <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              الهدف الحالي (للمراجعة)
            </p>
            <p className="text-muted">
              {periodLabels[activeLimit.period_type]} من {activeLimit.period_start} حتى{' '}
              {getPeriodEndDate(activeLimit.period_start, activeLimit.period_type)} — الهدف:{' '}
              {Number(activeLimit.target_amount).toLocaleString('ar-EG')} جنيه
            </p>
            {isAdmin && activeLimit.user_id != null && activeLimit.user_id > 0 ? (
              <p className="text-muted mt-1">
                البائع:{' '}
                <span style={{ color: 'var(--foreground)' }}>
                  {sellers.find((s) => s.id === activeLimit.user_id)?.name || (sellersLoading ? '…' : '—')}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={pageCardShell}>
        <div className={`${pageCardInner} p-4 sm:p-6`}>
          {isLoading ? <p className="text-muted text-sm">جاري التحميل...</p> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input
              type="number"
              min={0}
              placeholder="الهدف (جنيه)"
              className="rounded-xl border border-card bg-[var(--input-bg)] px-3 py-2 text-sm"
              value={form.target_amount}
              onChange={(e) => setForm((prev) => ({ ...prev, target_amount: e.target.value }))}
            />
            <select
              className="rounded-xl border border-card bg-[var(--input-bg)] px-3 py-2 text-sm"
              value={form.period_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, period_type: e.target.value as SalesLimitWriteInput['period_type'] }))
              }
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
            </select>
            <input
              type="date"
              className="rounded-xl border border-card bg-[var(--input-bg)] px-3 py-2 text-sm"
              value={form.period_start}
              onChange={(e) => setForm((prev) => ({ ...prev, period_start: e.target.value }))}
            />
            {isAdmin ? (
              <select
                className="rounded-xl border border-card bg-[var(--input-bg)] px-3 py-2 text-sm min-w-0"
                value={form.user_id}
                onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
                disabled={sellersLoading}
                aria-label="اختيار البائع"
              >
                <option value="">— البائع (اختياري) —</option>
                {form.user_id &&
                  !sellers.some((s) => String(s.id) === form.user_id) &&
                  Number(form.user_id) > 0 && (
                    <option value={form.user_id}>بائع غير مُدرج في القائمة</option>
                  )}
                {sellers.map((s) => (
                  <option key={s.id} value={String(s.id)} title={s.email || undefined}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={submitUpdate}
                  disabled={isBusy}
                  className="rounded-xl bg-[var(--bidex-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm((prev) => ({ ...prev, target_amount: '', user_id: '' }));
                  }}
                  className="rounded-xl border border-card px-4 py-2 text-sm"
                >
                  إلغاء
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={submitCreate}
                disabled={isBusy}
                className="rounded-xl bg-[var(--bidex-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                إضافة هدف
              </button>
            )}

            {activeLimit ? (
              <>
                <button
                  type="button"
                  onClick={() => startEdit(activeLimit)}
                  className="rounded-xl border border-card px-4 py-2 text-sm"
                >
                  تعديل الهدف الحالي
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(activeLimit.id)}
                  disabled={isBusy}
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-700 dark:text-red-300 disabled:opacity-60"
                >
                  حذف الهدف الحالي
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
