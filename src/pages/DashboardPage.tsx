import { PageWrapper } from '@/components/PageWrapper';
import { Link } from 'react-router-dom';
import { TopStatsRow } from '@/components/dashboard/TopStatsRow';
import { SalesLimitCard } from '@/components/dashboard/SalesLimitCard';
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { pageCardInner, pageCardShellInteractive } from '@/lib/pageCardClasses';
import { useAppSelector } from '@/store/hooks';

export function DashboardPage() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', 'full'],
    queryFn: () => dashboardApi.full().then((r) => r.data),
  });

  const [revenueDuration, setRevenueDuration] = useState<6 | 12>(6);
  const [revenueDropdownOpen, setRevenueDropdownOpen] = useState(false);
  const revenueDropdownRef = useRef<HTMLDivElement>(null);

  const summary = dashboard?.summary;

  const adminKpisFormatted = useMemo(() => {
    if (!dashboard?.admin_kpis?.length) return undefined;
    return dashboard.admin_kpis.map((k) => ({
      label: k.label,
      /** ar-EG بدون numberingSystem يعرض أرقامًا شرقية قد تُقصّ مع truncate أو لا تظهر الخطوط → يبدو مثل «.,..» */
      value: Number(k.value ?? 0).toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        numberingSystem: 'latn',
      }),
      sub: k.sub,
    }));
  }, [dashboard?.admin_kpis]);

  const monthlyRevenueData = useMemo(() => {
    const chart = dashboard?.monthly_revenue_chart ?? [];
    return chart
      .slice(-revenueDuration)
      .map((point) => ({
        month: point.month_label,
        value: Number(point.total || 0),
      }));
  }, [dashboard?.monthly_revenue_chart, revenueDuration]);

  const lineData = useMemo(() => {
    return (dashboard?.sales_trend_14d ?? []).map((row) => ({
      date: row.date.slice(0, 10),
      total: Number(row.total),
    }));
  }, [dashboard?.sales_trend_14d]);

  const pendingInvoices = dashboard?.invoice_status?.pending ?? 0;
  const partialInvoices = dashboard?.invoice_status?.partial ?? 0;
  const paidInvoicesStatus = dashboard?.invoice_status?.paid ?? 0;
  const invoiceStatusTotal = dashboard?.invoice_status?.total;
  const totalStatus = Math.max(
    invoiceStatusTotal != null && invoiceStatusTotal > 0
      ? invoiceStatusTotal
      : pendingInvoices + partialInvoices + paidInvoicesStatus,
    1
  );
  const pendingPct = (pendingInvoices / totalStatus) * 100;
  const partialPct = (partialInvoices / totalStatus) * 100;
  const paidPct = (paidInvoicesStatus / totalStatus) * 100;
  const statusDonutData = [
    { name: 'فواتير قيد التحصيل', value: pendingInvoices, color: '#093F85' },
    { name: 'فواتير دفع جزئي', value: partialInvoices, color: '#f59e0b' },
    { name: 'فواتير مدفوعة', value: paidInvoicesStatus, color: '#3b82f6' },
  ];

  const averageInvoiceText = summary
    ? `${summary.average_invoice.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} جنيه`
    : '—';

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!revenueDropdownRef.current?.contains(event.target as Node)) {
        setRevenueDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const insights = dashboard?.insights;
  const lowStock = dashboard?.low_stock;
  const loyaltyHighlight = dashboard?.loyalty_highlight;

  return (
    <PageWrapper>
      <div className="dash-rise relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md bg-gradient-to-l from-[#093F85] via-[#020F1F] to-[#041227] text-white p-4 sm:p-7 flex flex-col lg:flex-row-reverse gap-4 sm:gap-6 lg:gap-10 items-stretch mb-4 sm:mb-6 transition-all duration-500 hover:shadow-xl hover:from-sky-900 hover:via-[#082038] hover:to-[#0a1f35]">
        <div className="dash-hero-glow" aria-hidden />
        <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 order-2 lg:order-1">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-amber-400/15 hover:shadow-[0_8px_28px_rgba(251,191,36,0.2)]">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-amber-300 text-lg transition-all duration-300 hover:scale-105 hover:bg-amber-400/25 hover:text-amber-100 hover:ring-2 hover:ring-amber-300/40">★</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 mb-0.5">نقاط الثقة</p>
              <p className="text-lg font-semibold">{summary?.activity_percent ?? 0}%</p>
              <div className="mt-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[var(--bidex-primary)] to-sky-400"
                  style={{ width: `${summary?.activity_percent ?? 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-emerald-400/12 hover:shadow-[0_8px_28px_rgba(52,211,153,0.18)]">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-base transition-all duration-300 hover:scale-105 hover:bg-emerald-400/25 hover:ring-2 hover:ring-emerald-300/40">💼</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 mb-0.5">رصيد المحفظة المتاح</p>
              <p className="text-lg font-semibold">
                {(summary?.available_balance ?? 0).toLocaleString('ar-EG')} جنيه
              </p>
              <p className="text-[11px] text-white/70">
                محجوز {(summary?.escrow_balance ?? 0).toLocaleString('ar-EG')} جنيه
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center text-center lg:text-right order-1 lg:order-2">
          <p className="text-xs sm:text-sm text-white/70 mb-2">لوحة نتائج البائع</p>
          <h1 className="text-xl sm:text-3xl font-bold mb-2 tracking-tight">أهلاً بك في لوحة الأداء الخاصة بك</h1>
          <p className="text-xs sm:text-base text-white/80 mb-4 sm:mb-5 max-w-xl mx-auto lg:mx-0">
            تابع مبيعاتك، فواتيرك، وتفاعل العملاء في مكان واحد، مع تصميم مريح وسريع الفهم.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur text-xs sm:text-sm transition-all duration-300 hover:bg-violet-500/20 hover:ring-2 hover:ring-violet-300/50 hover:shadow-[0_6px_20px_rgba(167,139,250,0.25)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bidex-primary)]/90 text-[10px] text-white transition-all duration-300 hover:scale-110 hover:bg-violet-500 hover:ring-2 hover:ring-violet-200/80">🏆</span>
              <span>
                رتبة البائع: <span className="font-semibold">{summary?.rank_title ?? '—'}</span>
              </span>
            </div>
            <Link
              to="/sales/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#093F85] text-sm font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-900 hover:shadow-[0_10px_28px_rgba(14,165,233,0.35)] active:translate-y-0 active:shadow-sm dark:hover:bg-sky-950 dark:hover:text-sky-100"
            >
              <span className="text-base leading-none">↑</span>
              <span>إضافة عملية بيع</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="dash-rise-delay-1">
        <TopStatsRow
          averageInvoiceText={averageInvoiceText}
          totalInvoices={summary?.total_invoices ?? 0}
          paidInvoices={summary?.paid_invoices ?? 0}
          totalRevenue={summary?.total_revenue ?? 0}
          adminKpis={adminKpisFormatted}
        />
      </div>

      <div className="dash-rise-delay-1">
        <SalesLimitCard />
      </div>

      {isAdmin && dashboard?.expired_inventory && dashboard.expired_inventory.products_count > 0 && (
        <div
          className="dash-rise-delay-1 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 transition-shadow duration-300 hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          <strong className="font-semibold">مخزون منتهي الصلاحية:</strong>{' '}
          {dashboard.expired_inventory.products_count} منتج لا يزال له رصيد في المخزون بعد تاريخ الانتهاء.
          <span className="mt-1 block text-xs opacity-90">
            تقدير الخسارة بتكلفة الشراء المسجّلة:{' '}
            {Number(dashboard.expired_inventory.estimated_cost_at_purchase).toLocaleString('ar-EG', {
              numberingSystem: 'latn',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            جنيه — راقب التخلص أو التسجيل كخسارة في إدارة المخزون.
          </span>
        </div>
      )}

      {dashboard?.near_expiry_products && dashboard.near_expiry_products.count > 0 && (
        <div
          className="dash-rise-delay-1 mb-4 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-950 transition-shadow duration-300 hover:shadow-md dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100"
          role="alert"
        >
          <strong className="font-semibold">تنبيه صلاحية:</strong>{' '}
          {dashboard.near_expiry_products.count} منتج بمخزون سيُنهي صلاحيته خلال الـ{' '}
          {dashboard.near_expiry_products.within_months} أشهر القادمة.
          <Link
            to="/products/near-expiry"
            className="mt-2 inline-flex rounded-lg bg-[var(--bidex-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:brightness-110 hover:shadow-md hover:-translate-y-0.5"
          >
            عرض القائمة والتفاصيل
          </Link>
        </div>
      )}

      <div className="dash-rise-delay-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <div className={`${pageCardShellInteractive}`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-xs text-muted mb-1">أفضل وقت للبيع</p>
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {insights?.best_sales_hour
                ? `${String(insights.best_sales_hour.hour).padStart(2, '0')}:00`
                : '--'}
            </p>
            <p className="text-xs text-muted">حسب إجمالي المبيعات (آخر 90 يومًا — تاريخ البيع)</p>
          </div>
        </div>
        <div className={`${pageCardShellInteractive}`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-xs text-muted mb-1">عميل مميز</p>
            <p className="text-lg font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {insights?.top_customer?.buyer_name || insights?.top_customer?.buyer_phone || '--'}
            </p>
            <p className="text-xs text-muted">الأعلى شراءً خلال آخر 90 يومًا</p>
          </div>
        </div>
        <div className={`${pageCardShellInteractive}`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-xs text-muted mb-1">تنبيه المخزون</p>
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {lowStock?.count ?? 0} منتجات منخفضة
            </p>
            <p className="text-xs text-muted">الحد الأدنى الحالي: {lowStock?.threshold ?? 5}</p>
          </div>
        </div>
        <div className={`${pageCardShellInteractive}`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-xs text-muted mb-1">قرب انتهاء الصلاحية</p>
            <p className="text-lg font-bold text-sky-800 dark:text-sky-200">
              {dashboard?.near_expiry_products?.count ?? 0} منتج
            </p>
            <p className="text-xs text-muted">
              خلال {dashboard?.near_expiry_products?.within_months ?? 6} أشهر — لها مخزون
            </p>
            {(dashboard?.near_expiry_products?.count ?? 0) > 0 && (
              <Link
                to="/products/near-expiry"
                className="mt-2 inline-block text-xs font-semibold text-[var(--bidex-primary)] underline-offset-2 transition-colors hover:underline dark:text-sky-400"
              >
                فتح القائمة ←
              </Link>
            )}
          </div>
        </div>
        <div className={`${pageCardShellInteractive}`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-xs text-muted mb-1">إجمالي الديون المستحقة</p>
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {(dashboard?.total_credit_remaining ?? 0).toLocaleString('ar-EG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              جنيه
            </p>
            <p className="text-xs text-muted">من فواتير الآجل</p>
          </div>
        </div>
      </div>
      {loyaltyHighlight && (
        <div className={`${pageCardShellInteractive} dash-rise-delay-2 mb-3`}>
          <div className={`${pageCardInner} py-3 px-4`}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>نقاط العملاء (Loyalty)</p>
            <div className="text-xs text-muted">
              أعلى عميل نقاطًا: <span style={{ color: 'var(--foreground)' }}>{loyaltyHighlight.buyer_name}</span>
              {' — '}
              متاح: <span style={{ color: 'var(--foreground)' }}>{loyaltyHighlight.available_points}</span> نقطة
            </div>
          </div>
        </div>
      )}

      <div className="dash-rise-delay-3 grid grid-cols-1 lg:grid-cols-[65%_35%] gap-5">
        <div className="flex flex-col gap-5">
          <div
            className={`${pageCardInner} dash-card-interactive p-5 flex flex-col gap-4 rounded-xl shadow-md border border-card h-[328px] sm:h-[360px]`}
          >
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="relative" ref={revenueDropdownRef}>
                <button
                  type="button"
                  onClick={() => setRevenueDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted-bg text-xs font-semibold transition-all duration-200 hover:opacity-95 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
                  style={{ color: 'var(--foreground)' }}
                >
                  {revenueDuration === 6 ? 'آخر 6 أشهر' : 'آخر 12 شهر'}
                  <svg
                    className={`w-3.5 h-3.5 text-muted transition-transform ${revenueDropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {revenueDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 min-w-[140px] py-1 rounded-lg bg-card border border-card shadow-lg z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setRevenueDuration(6);
                        setRevenueDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                        revenueDuration === 6 ? 'bg-[color:color-mix(in_srgb,var(--bidex-primary)_10%,transparent)] text-bidex-primary' : 'hover:bg-muted-bg'
                      }`}
                      style={{ color: revenueDuration === 6 ? 'var(--bidex-primary)' : 'var(--foreground)' }}
                    >
                      آخر 6 أشهر
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRevenueDuration(12);
                        setRevenueDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                        revenueDuration === 12 ? 'bg-[color:color-mix(in_srgb,var(--bidex-primary)_10%,transparent)] text-bidex-primary' : 'hover:bg-muted-bg'
                      }`}
                      style={{ color: revenueDuration === 12 ? 'var(--bidex-primary)' : 'var(--foreground)' }}
                    >
                      آخر 12 شهر
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold ch-title">
                إيراداتي الشهرية <span className="text-[11px] text-muted mr-1">— جنيه</span>
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <MonthlyRevenueChart duration={revenueDuration} data={monthlyRevenueData} />
            </div>
          </div>
        </div>

        <div
          className={`${pageCardInner} dash-card-interactive p-5 flex flex-col gap-4 rounded-xl shadow-md border border-card h-[328px] sm:h-[360px]`}
        >
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-bold ch-title">حالة الفواتير</h2>
            {isLoading && <span className="text-xs text-muted">جاري التحديث...</span>}
          </div>
          <div className="flex items-center gap-6 flex-1 min-h-0">
            <div className="shrink-0 w-[140px] h-[140px] min-w-[140px] min-h-[140px] transition-transform duration-300 hover:scale-[1.03]">
              <PieChart width={140} height={140}>
                <Pie
                  data={statusDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="transparent"
                >
                  {statusDonutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5 transition-colors duration-200 hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_6%,transparent)] dark:hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--bidex-primary)] ring-2 ring-transparent transition-shadow hover:ring-[var(--bidex-primary)]/30" />
                  <span className="text-muted">فواتير قيد التحصيل</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {pendingInvoices.toLocaleString('ar-EG')} ({pendingPct.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5 transition-colors duration-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-transparent transition-shadow hover:ring-amber-400/40" />
                  <span className="text-muted">فواتير دفع جزئي</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {partialInvoices.toLocaleString('ar-EG')} ({partialPct.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5 transition-colors duration-200 hover:bg-blue-500/10 dark:hover:bg-blue-500/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-transparent transition-shadow hover:ring-blue-400/40" />
                  <span className="text-muted">فواتير مدفوعة</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {paidInvoicesStatus.toLocaleString('ar-EG')} ({paidPct.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lineData.length > 0 && (
        <div className={`${pageCardShellInteractive} dash-rise-delay-4 mt-3`}>
          <div className={`${pageCardInner} px-4 pt-3 pb-2`}>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>اتجاه المبيعات (14 يومًا)</h2>
            <div className="h-[260px] w-full min-h-[260px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--chart-axis)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--chart-axis)' }} width={40} />
                  <Tooltip formatter={(v: number | undefined) => (v != null ? [v.toLocaleString('ar-EG'), 'المبلغ'] : [])} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} name="المبلغ" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
