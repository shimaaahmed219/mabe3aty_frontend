import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi, salesLimitsApi, type User } from '@/lib/api';
import { getPeriodEndDate, loadInvoicesTotal, normalizeLimits, periodLabels } from '@/lib/salesLimitUtils';
import { useAppSelector } from '@/store/hooks';
import { pageCardInner, pageCardShellInteractive } from '@/lib/pageCardClasses';

export function SalesLimitCard() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';

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
  const activeLimit = useMemo(
    () => [...limits].sort((a, b) => String(b.period_start).localeCompare(String(a.period_start)))[0],
    [limits]
  );

  const progressQuery = useQuery({
    queryKey: ['sales-limits', 'progress', activeLimit?.id, activeLimit?.period_start, activeLimit?.period_type],
    enabled: Boolean(activeLimit),
    queryFn: async () => {
      if (!activeLimit) return null;
      const from = activeLimit.period_start;
      const to = getPeriodEndDate(activeLimit.period_start, activeLimit.period_type);
      const achieved = await loadInvoicesTotal(from, to);
      return { achieved, from, to };
    },
  });

  const targetValue = Number(activeLimit?.target_amount || 0);
  const achievedValue = Number(progressQuery.data?.achieved ?? activeLimit?.achieved_amount ?? activeLimit?.current_sales ?? 0);
  const progressPct = targetValue > 0 ? Math.min(200, (achievedValue / targetValue) * 100) : 0;
  const exceeded = targetValue > 0 && achievedValue > targetValue;

  return (
    <div className={`${pageCardShellInteractive} mb-4`}>
      <div className={`${pageCardInner} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            هدف المبيعات
          </h2>
          <div className="flex items-center gap-2">
            {isLoading ? <span className="text-xs text-muted">جاري التحميل...</span> : null}
            <Link
              to="/sales-limits"
              className="rounded-xl border border-card bg-[var(--input-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--bidex-primary)] transition-colors hover:bg-muted"
            >
              ضبط الهدف
            </Link>
          </div>
        </div>

        {activeLimit ? (
          <div className="rounded-xl border border-card p-3">
            <p className="text-sm text-muted mb-1">
              الفترة: <span style={{ color: 'var(--foreground)' }}>{periodLabels[activeLimit.period_type]}</span> من{' '}
              <span style={{ color: 'var(--foreground)' }}>{activeLimit.period_start}</span> حتى{' '}
              <span style={{ color: 'var(--foreground)' }}>
                {progressQuery.data?.to || getPeriodEndDate(activeLimit.period_start, activeLimit.period_type)}
              </span>
            </p>
            {isAdmin && activeLimit.user_id != null && activeLimit.user_id > 0 ? (
              <p className="text-sm text-muted mb-1">
                البائع:{' '}
                <span style={{ color: 'var(--foreground)' }}>
                  {sellers.find((s) => s.id === activeLimit.user_id)?.name || (sellersLoading ? '…' : '—')}
                </span>
              </p>
            ) : null}
            <p className="text-sm mb-1">
              المحقق: <strong>{achievedValue.toLocaleString('ar-EG')}</strong> / الهدف:{' '}
              <strong>{targetValue.toLocaleString('ar-EG')}</strong> جنيه
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className={`h-full ${exceeded ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, Math.min(progressPct, 100))}%` }}
              />
            </div>
            <p className={`text-sm font-semibold ${exceeded ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {exceeded ? 'تم تخطي التارجت' : 'لسه ما وصلتش للتارجت'}
            </p>
            {progressQuery.isFetching ? <p className="text-xs text-muted mt-1">جاري حساب مبيعات الفترة...</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">لا يوجد هدف مبيعات مضاف حاليًا.</p>
            <Link
              to="/sales-limits"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-[var(--bidex-primary)] px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
            >
              إضافة هدف
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
