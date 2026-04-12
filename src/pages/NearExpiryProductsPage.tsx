import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, CalendarClock } from 'lucide-react';
import { productsApi } from '@/lib/api';
import type { NearExpiryBatchRow } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { textAccentBidex, hoverSurfaceBidex, btnPrimarySolid, controlInputHover, outlineButtonInteractive } from '@/lib/theme';
import { useState } from 'react';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { useAppSelector } from '@/store/hooks';
const tableHeadClass =
  'bg-[color:color-mix(in_srgb,var(--bidex-primary)_9%,white)] dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_22%,#0f172a)]';
const iconBtn = `rounded-xl p-2 transition-colors ${textAccentBidex} ${hoverSurfaceBidex}`;

const MONTH_OPTIONS = [3, 6, 9, 12] as const;

export function NearExpiryProductsPage() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');
  const [months, setMonths] = useState<3 | 6 | 9 | 12>(6);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products-near-expiry', months],
    queryFn: () => productsApi.nearExpiry({ months }).then((r) => r.data),
  });

  const list = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <PageWrapper>
      <Link
        to="/"
        className={`mb-4 inline-flex items-center gap-1 text-sm ${textAccentBidex} hover:underline`}
      >
        <ArrowRight className="h-4 w-4" />
        العودة للوحة التحكم
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] text-[var(--bidex-primary)] dark:text-sky-300">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--bidex-primary)] dark:text-sky-300 sm:text-3xl">
              قرب انتهاء الصلاحية
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              كل صف يمثل <strong className="font-semibold text-slate-700 dark:text-slate-300">دفعة</strong> لها رصيد وتاريخ
              انتهاء خلال الفترة (ولم تنتهِ بعد). قد يتكرر نفس المنتج إذا وُجدت أكثر من دفعة.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الفترة:</label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as 3 | 6 | 9 | 12)}
            className={`rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 ${controlInputHover}`}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                خلال {m} أشهر
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${pageCardShell} mb-4`}>
        <div className={`${pageCardInner} px-4 py-3 sm:px-5`}>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <strong className="font-semibold text-[var(--bidex-primary)] dark:text-sky-300">{count}</strong>{' '}
          دفعة مخزون ضمن النافذة المختارة.
        </p>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={`p-4 sm:p-5 ${pageCardInner}`}>
          {isLoading && <p className="text-slate-500 dark:text-slate-400">جاري التحميل…</p>}
          {isError && <p className="text-red-600 dark:text-red-400">تعذّر تحميل القائمة.</p>}
          {!isLoading && !isError && list.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">لا توجد دفعات ضمن هذه الفترة.</p>
          )}
          {!isLoading && list.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/80">
              <div className="overflow-x-auto" dir="ltr">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className={`${tableHeadClass} border-b border-slate-200/80 dark:border-slate-600/80`}>
                      <th className="w-14 px-2 py-3 text-center text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        —
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        المتبقي للدفعة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        انتهاء الدفعة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        إنتاج الدفعة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        كمية الدفعة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        إجمالي المنتج
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        التصنيف
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        الاسم
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        الكود
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/60 dark:bg-slate-800/40">
                    {list.map((row: NearExpiryBatchRow, i: number) => {
                      const p = row.product;
                      const days = row.days_to_expiry;
                      const urgent = days <= 30;
                      return (
                        <tr
                          key={`${row.batch_id}-${p.id}`}
                          className={
                            i % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/25' : ''
                          }
                        >
                          <td className="px-2 py-3 text-center">
                            <Link to={`/products/${p.id}`} className={iconBtn} title="صفحة المنتج">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={
                                urgent
                                  ? 'inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                                  : 'tabular-nums text-slate-700 dark:text-slate-300'
                              }
                            >
                              {days} يومًا
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                            {row.expiry_date?.slice(0, 10) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                            {row.production_date?.slice(0, 10) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                            {row.quantity.toLocaleString('ar-EG', { maximumFractionDigits: 2, numberingSystem: 'latn' })}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                            {p.stock_quantity ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {p.category ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/products/${p.id}`}
                              className={`font-medium hover:underline ${textAccentBidex}`}
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-semibold">
                            <Link to={`/products/${p.id}`} className={`hover:underline ${textAccentBidex}`}>
                              {p.code ?? '—'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/products" className={`inline-flex rounded-xl px-4 py-2.5 text-sm ${btnPrimarySolid}`}>
          إدخال المنتجات
        </Link>
        {isAdmin && (
          <Link
            to="/admin/products"
            className={`inline-flex ${outlineButtonInteractive} px-4 py-2.5`}
          >
            إدارة المنتجات
          </Link>
        )}
      </div>
    </PageWrapper>
  );
}
