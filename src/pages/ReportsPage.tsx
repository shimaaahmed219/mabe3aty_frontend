import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { controlInputHover, textAccentBidex } from '@/lib/theme';

const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${controlInputHover}`;

export function ReportsPage() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [chartDays, setChartDays] = useState(7);

  const { data: dailyReport } = useQuery({
    queryKey: ['reports', 'daily', reportDate],
    queryFn: () => reportsApi.daily({ date: reportDate }).then((r) => r.data),
  });
  const { data: monthlyReport } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () => reportsApi.monthly({ year, month }).then((r) => r.data),
  });
  const { data: profitsReport } = useQuery({
    queryKey: ['reports', 'profits'],
    queryFn: () => reportsApi.profits().then((r) => r.data),
  });
  const { data: bestProduct } = useQuery({
    queryKey: ['reports', 'best-selling'],
    queryFn: () => reportsApi.bestSellingProduct().then((r) => r.data),
  });
  const { data: chartData = [] } = useQuery({
    queryKey: ['reports', 'chart-daily', chartDays],
    queryFn: () => reportsApi.chartDaily({ days: chartDays }).then((r) => r.data),
  });

  const chartSeries = chartData.map((d) => ({
    date: d.date.slice(0, 10),
    المبلغ: Number(d.total),
    عدد_العمليات: d.count,
  }));

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">التقارير</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">تقارير يومية وشهرية وإجمالي الأرباح ورسم بياني</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className={pageCardShell}>
          <div className={`${pageCardInner} p-4`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">تقرير يومي</p>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={`${inputClass} mb-2`} />
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">إجمالي المبيعات: {(dailyReport?.total_sales ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">عدد العمليات: {dailyReport?.operations_count ?? 0}</p>
          </div>
        </div>
        <div className={pageCardShell}>
          <div className={`${pageCardInner} p-4`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">تقرير شهري</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">إجمالي المبيعات: {(monthlyReport?.total_sales ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">عدد العمليات: {monthlyReport?.operations_count ?? 0}</p>
          </div>
        </div>
        <div className={pageCardShell}>
          <div className={`${pageCardInner} p-4`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">إجمالي الأرباح (هذا الشهر)</p>
            <p className={`text-xl font-bold ${textAccentBidex}`}>{(profitsReport?.total_profits ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</p>
          </div>
        </div>
        <div className={pageCardShell}>
          <div className={`${pageCardInner} p-4`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">أفضل منتج مباع (من أول الشهر حتى اليوم)</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{bestProduct?.best_selling_product ?? '—'}</p>
            {bestProduct?.total_quantity != null && bestProduct.total_quantity > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                الكمية: {bestProduct.total_quantity.toLocaleString('ar-EG')} — المبلغ:{' '}
                {bestProduct.total_amount?.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
                {bestProduct.lines_count != null && bestProduct.lines_count > 0 && (
                  <> — بنود: {bestProduct.lines_count}</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={`${pageCardInner} p-4 sm:p-5`}>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">رسم بياني للمبيعات اليومية</h2>
            <select value={chartDays} onChange={(e) => setChartDays(Number(e.target.value))} className={`${inputClass} w-full sm:w-32`}>
              <option value={7}>7 أيام</option>
              <option value={14}>14 يوم</option>
              <option value={30}>30 يوم</option>
            </select>
          </div>
          <div className="h-[260px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: number | undefined) => (v != null ? v.toLocaleString('ar-EG') : '')} />
                <Legend />
                <Bar dataKey="المبلغ" fill="#093F85" name="المبلغ (جنيه)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="عدد_العمليات" fill="#0ea5e9" name="عدد العمليات" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
