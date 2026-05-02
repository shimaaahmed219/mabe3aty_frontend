import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Package } from 'lucide-react';
import { getApiErrorMessage, productsApi } from '@/lib/api';
import { appToast } from '@/lib/appToast';
import { reportFormValidity } from '@/lib/formValidation';
import type { Product, ProductBatchWriteInput, ProductStatsPayload, ProductStockBatch } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { btnPrimarySolid, controlInputHover, textAccentBidex } from '@/lib/theme';
import { useAppSelector } from '@/store/hooks';
const labelClass =
  'block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5';
const inputClass = `w-full min-h-[42px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm ${controlInputHover}`;

const money = (n: number) =>
  n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: 'latn' });

const qtyFmt = (n: number) =>
  n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2, numberingSystem: 'latn' });

function shelfLifeLabel(p: Product): string | null {
  if (p.shelf_life_value != null && p.shelf_life_unit) {
    const v = p.shelf_life_value;
    if (p.shelf_life_unit === 'days') return `${v} ${v === 1 ? 'يوم' : 'أيام'}`;
    if (p.shelf_life_unit === 'months') return `${v} ${v === 1 ? 'شهر' : 'شهور'}`;
    return `${v} ${v === 1 ? 'سنة' : 'سنوات'}`;
  }
  if (p.shelf_life_days != null && p.shelf_life_days > 0) return `${p.shelf_life_days} يوم`;
  return null;
}

function shelfLifeLabelBatch(b: ProductStockBatch): string | null {
  if (b.shelf_life_value != null && b.shelf_life_unit) {
    const v = b.shelf_life_value;
    if (b.shelf_life_unit === 'days') return `${v} ${v === 1 ? 'يوم' : 'أيام'}`;
    if (b.shelf_life_unit === 'months') return `${v} ${v === 1 ? 'شهر' : 'شهور'}`;
    return `${v} ${v === 1 ? 'سنة' : 'سنوات'}`;
  }
  return null;
}

function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeExpiryDate(
  productionDate: string,
  shelfLifeValue: string,
  shelfLifeUnit: 'days' | 'months' | 'years',
): string {
  if (!productionDate) return '';
  const v = Number.parseInt(shelfLifeValue, 10);
  if (!Number.isFinite(v) || v <= 0) return '';
  const base = new Date(`${productionDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';

  if (shelfLifeUnit === 'days') base.setDate(base.getDate() + v);
  else if (shelfLifeUnit === 'months') base.setMonth(base.getMonth() + v);
  else base.setFullYear(base.getFullYear() + v);

  return toIsoDay(base);
}

const PIE_COLORS = ['#093F85', '#94a3b8'];

function TrendBadge({ trend }: { trend: ProductStatsPayload['trend'] }) {
  const { direction, change_percent: pct } = trend;
  const base =
    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums';
  if (direction === 'up') {
    return (
      <span className={`${base} bg-sky-100 text-blue-900 dark:bg-blue-950/50 dark:text-sky-200`} dir="ltr">
        <ArrowUpRight className="h-4 w-4" />
        +{pct}%
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className={`${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`} dir="ltr">
        <ArrowDownRight className="h-4 w-4" />
        {pct}%
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`} dir="ltr">
      <ArrowRight className="h-4 w-4" />
      {pct}%
    </span>
  );
}

export function ProductDetailPage() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');
  const queryClient = useQueryClient();
  const { id: idParam } = useParams<{ id: string }>();
  const productId = Number(idParam);
  const validId = Number.isFinite(productId) && productId > 0;

  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | undefined>(undefined);

  const [batchQty, setBatchQty] = useState('');
  const [batchProd, setBatchProd] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchShelfV, setBatchShelfV] = useState('');
  const [batchShelfU, setBatchShelfU] = useState<'days' | 'months' | 'years'>('months');
  const [batchPurchase, setBatchPurchase] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [batchErr, setBatchErr] = useState('');

  useEffect(() => {
    const autoExpiry = computeExpiryDate(batchProd, batchShelfV, batchShelfU);
    if (autoExpiry) setBatchExpiry(autoExpiry);
  }, [batchProd, batchShelfV, batchShelfU]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product-stats', productId, appliedRange?.from, appliedRange?.to],
    queryFn: () =>
      productsApi
        .stats(productId, {
          from: appliedRange?.from,
          to: appliedRange?.to,
        })
        .then((r) => r.data),
    enabled: validId,
  });

  const addBatchMut = useMutation({
    mutationFn: (body: ProductBatchWriteInput) => productsApi.addBatch(productId, body).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-stats', productId] });
      setBatchQty('');
      setBatchProd('');
      setBatchExpiry('');
      setBatchShelfV('');
      setBatchNotes('');
      setBatchPurchase('');
      setBatchErr('');
      appToast.success('تم تسجيل الدفعة', 'تم تحديث المخزون والإحصائيات.');
    },
    onError: (e: unknown) => {
      const msg = getApiErrorMessage(e, 'تعذّر إضافة الدفعة');
      setBatchErr(msg);
      appToast.error('فشل إضافة الدفعة', msg);
    },
  });

  const pieData = useMemo(() => {
    if (!data) return [];
    const share = data.summary.share_of_revenue_percent;
    const rest = Math.max(0, 100 - share);
    if (data.summary.total_revenue <= 0) return [];
    return [
      { name: 'هذا المنتج', value: Math.round(share * 100) / 100 },
      { name: 'باقي المنتجات', value: Math.round(rest * 100) / 100 },
    ].filter((s) => s.value > 0);
  }, [data]);

  const resetRange = () => {
    setAppliedRange(undefined);
    setDraftFrom('');
    setDraftTo('');
  };

  const onSubmitBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reportFormValidity(e.currentTarget)) return;
    const q = Number(batchQty);
    if (!Number.isFinite(q) || q <= 0) {
      const msg = 'أدخلي كمية صحيحة أكبر من صفر.';
      setBatchErr(msg);
      appToast.warning('كمية غير صالحة', msg);
      return;
    }
    setBatchErr('');
    const body: ProductBatchWriteInput = { quantity: q };
    if (batchProd) body.production_date = batchProd;
    if (batchExpiry) body.expiry_date = batchExpiry;
    const sv = batchShelfV.trim() ? parseInt(batchShelfV, 10) : NaN;
    if (Number.isFinite(sv) && sv > 0) {
      body.shelf_life_value = sv;
      body.shelf_life_unit = batchShelfU;
    }
    if (isAdmin && batchPurchase.trim()) {
      const pp = Number(batchPurchase);
      if (Number.isFinite(pp) && pp >= 0) body.purchase_price = pp;
    }
    if (batchNotes.trim()) body.notes = batchNotes.trim();
    addBatchMut.mutate(body);
  };

  if (!validId) {
    return (
      <PageWrapper>
        <p className="text-slate-600 dark:text-slate-400">معرّف المنتج غير صالح.</p>
        <Link to="/products" className={`mt-2 inline-block ${textAccentBidex} hover:underline`}>
          العودة للمنتجات
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-5">
        <Link
          to="/products"
          className={`mb-2 inline-flex items-center gap-1 text-sm ${textAccentBidex} hover:underline`}
        >
          ← العودة لإدارة المنتجات
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] text-[var(--bidex-primary)] dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_22%,#020F1F)] dark:text-sky-200">
              <Package className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl md:text-3xl">
                {isLoading ? '…' : data?.product.name ?? 'المنتج'}
              </h1>
              {data && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  الكود: <span className="font-mono font-semibold">{data.product.code ?? '—'}</span>
                  {data.product.category ? ` · ${data.product.category}` : ''}
                  {data.product.default_price != null && (
                    <span className="ms-2">· سعر البيع: {money(Number(data.product.default_price))} جنيه</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {data?.product.is_expired && (
        <div
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          <strong className="font-semibold">تنبيه:</strong> هذا المنتج <strong>منتهي الصلاحية</strong> بحسب تاريخ الانتهاء المسجّل.
          {isAdmin &&
            data.product.expired_stock_cost_estimate != null &&
            data.product.expired_stock_cost_estimate > 0 && (
              <span className="mt-1 block text-xs opacity-90">
                تقدير قيمة المخزون المتبقي بتكلفة الشراء: {money(data.product.expired_stock_cost_estimate)} جنيه — يُحتسب ضمن تنبيهات
                المخزون المنتهي في لوحة التحكم.
              </span>
            )}
        </div>
      )}

      {data && (
        <div className={`${pageCardShell} ${pageCardInner} mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">المخزون الحالي</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {qtyFmt(Number(data.product.stock_quantity ?? 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المباع (كل الفواتير)</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {qtyFmt(Number(data.product.quantity_sold ?? 0))}
            </p>
          </div>
          {data.product.production_date && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ الإنتاج</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{data.product.production_date}</p>
            </div>
          )}
          {shelfLifeLabel(data.product) && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">مدة الصلاحية المسجّلة</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{shelfLifeLabel(data.product)}</p>
            </div>
          )}
          {data.product.expiry_date && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">انتهاء الصلاحية</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{data.product.expiry_date}</p>
              {data.product.days_to_expiry != null && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {data.product.days_to_expiry < 0
                    ? `منتهٍ منذ ${Math.abs(data.product.days_to_expiry)} يومًا`
                    : `متبقي ${data.product.days_to_expiry} يومًا`}
                </p>
              )}
            </div>
          )}
          {isAdmin && data.product.purchase_price != null && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">سعر الشراء</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {money(Number(data.product.purchase_price))} جنيه
              </p>
            </div>
          )}
          {isAdmin && data.product.unit_profit != null && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">الربح للوحدة</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {money(data.product.unit_profit)} جنيه
              </p>
            </div>
          )}
          {isAdmin && data.product.profit_on_sold_estimate != null && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الربح (ربح الوحدة × المباع)</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {money(data.product.profit_on_sold_estimate)} جنيه
              </p>
            </div>
          )}
        </div>
      )}

      {data && (
        <div className={`${pageCardShell} ${pageCardInner} mb-5 p-4 sm:p-5`}>
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">دفعات المخزون</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            تظهر هنا كمية كل دفعة حسب تاريخ الإنتاج وانتهاء الصلاحية. عند البيع يُخصم أولاً من الدفعة الأقرب لانتهاء
            الصلاحية.
          </p>
          {!data.product.stock_batches?.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد دفعات مسجّلة لهذا المنتج.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/80">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/40">
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                      الكمية
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                      الإنتاج
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                      الانتهاء
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                      مدة الصلاحية
                    </th>
                    {isAdmin && (
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                        شراء الدفعة
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                      ملاحظات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {data.product.stock_batches.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {qtyFmt(b.quantity)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {b.production_date?.slice(0, 10) ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {b.expiry_date?.slice(0, 10) ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {shelfLifeLabelBatch(b) ?? '—'}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {b.purchase_price != null ? `${money(b.purchase_price)} ج` : '—'}
                        </td>
                      )}
                      <td className="max-w-[200px] px-3 py-2.5 text-right text-xs text-slate-600 dark:text-slate-400">
                        {b.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">إضافة دفعة جديدة</h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              أدخلي الكمية وتاريخ الإنتاج، ثم اختاري مدة الصلاحية وسيتم ملء تاريخ الانتهاء تلقائيًا.
            </p>
            <form onSubmit={onSubmitBatch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-1">
                <label className={labelClass} htmlFor="batch-qty">
                  الكمية (علب) <span className="text-red-600">*</span>
                </label>
                <input
                  id="batch-qty"
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  value={batchQty}
                  onChange={(e) => setBatchQty(e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="batch-prod">
                  تاريخ الإنتاج
                </label>
                <input
                  id="batch-prod"
                  type="date"
                  value={batchProd}
                  onChange={(e) => setBatchProd(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="batch-exp">
                  تاريخ انتهاء الصلاحية
                </label>
                <input
                  id="batch-exp"
                  type="date"
                  value={batchExpiry}
                  onChange={(e) => setBatchExpiry(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="batch-shelf-v">
                  مدة الصلاحية (رقم)
                </label>
                <input
                  id="batch-shelf-v"
                  type="number"
                  min={1}
                  placeholder="مثال: 6"
                  value={batchShelfV}
                  onChange={(e) => setBatchShelfV(e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="batch-shelf-u">
                  وحدة المدة
                </label>
                <select
                  id="batch-shelf-u"
                  value={batchShelfU}
                  onChange={(e) => setBatchShelfU(e.target.value as 'days' | 'months' | 'years')}
                  className={inputClass}
                >
                  <option value="days">أيام</option>
                  <option value="months">شهور</option>
                  <option value="years">سنوات</option>
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className={labelClass} htmlFor="batch-purchase">
                    سعر شراء الدفعة
                  </label>
                  <input
                    id="batch-purchase"
                    type="number"
                    min={0}
                    step={0.01}
                    value={batchPurchase}
                    onChange={(e) => setBatchPurchase(e.target.value)}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass} htmlFor="batch-notes">
                  ملاحظات
                </label>
                <input
                  id="batch-notes"
                  type="text"
                  maxLength={255}
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className={inputClass}
                />
              </div>
              {batchErr && (
                <p className="sm:col-span-2 lg:col-span-3 text-sm text-red-600 dark:text-red-400">{batchErr}</p>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={addBatchMut.isPending}
                  className={`min-h-[42px] rounded-xl px-5 text-sm font-semibold shadow-sm disabled:opacity-60 ${btnPrimarySolid}`}
                >
                  {addBatchMut.isPending ? 'جاري الحفظ…' : 'حفظ الدفعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className={`${pageCardShell} ${pageCardInner} p-10 text-center text-slate-500 dark:text-slate-400`}>جاري التحميل...</div>
      )}

      {isError && (
        <div className={`${pageCardShell} ${pageCardInner} p-6 text-red-600 dark:text-red-400`}>
          {(error as Error)?.message || 'تعذر تحميل الإحصائيات.'}
        </div>
      )}

      {data && (
        <>
          <div className={`${pageCardShell} ${pageCardInner} mb-5 p-4 sm:p-5`}>
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">فترة التقرير</h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              الافتراضي من الخادم: آخر 90 يومًا. يمكنك ضبط الفترة ثم الضغط على «تطبيق».
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-[140px] flex-1 sm:max-w-[200px]">
                <label className={labelClass} htmlFor="stats-from">
                  من
                </label>
                <input
                  id="stats-from"
                  type="date"
                  value={draftFrom || data.period.from}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="min-w-[140px] flex-1 sm:max-w-[200px]">
                <label className={labelClass} htmlFor="stats-to">
                  إلى
                </label>
                <input
                  id="stats-to"
                  type="date"
                  value={draftTo || data.period.to}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const f = draftFrom || data.period.from;
                  const t = draftTo || data.period.to;
                  setAppliedRange({ from: f, to: t });
                }}
                className={`min-h-[42px] rounded-xl px-4 text-sm shadow-sm ${btnPrimarySolid}`}
              >
                تطبيق
              </button>
              <button
                type="button"
                onClick={resetRange}
                className="min-h-[42px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                افتراضي (90 يوم)
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              الفترة المعروضة: {data.period.from} → {data.period.to}
            </p>
          </div>

          {data.quantity_calendar && (
            <div className={`${pageCardShell} ${pageCardInner} mb-5 p-4 sm:p-5`}>
              <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                الكمية المباعة (تقويم — حتى اليوم)
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                غير مرتبطة بفلتر الفترة أعلاه: اليوم الحالي، الأسبوع من السبت، والشهر من أوله.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400">كمية اليوم</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                    {qtyFmt(data.quantity_calendar.day)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400">كمية الأسبوع (من السبت)</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                    {qtyFmt(data.quantity_calendar.week)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {data.quantity_calendar.week_range.start} → {data.quantity_calendar.week_range.end}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                  <p className="text-xs text-slate-500 dark:text-slate-400">كمية الشهر (من أول الشهر)</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                    {qtyFmt(data.quantity_calendar.month)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {data.quantity_calendar.month_range.start} → {data.quantity_calendar.month_range.end}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${pageCardShell} ${pageCardInner} p-4`}>
              <p className="text-xs text-slate-500 dark:text-slate-400">إيراد المنتج (الفترة)</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                {money(data.summary.total_revenue)} <span className="text-sm font-normal text-slate-500">جنيه</span>
              </p>
            </div>
            <div className={`${pageCardShell} ${pageCardInner} p-4`}>
              <p className="text-xs text-slate-500 dark:text-slate-400">كمية مباعة</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                {data.summary.total_quantity.toLocaleString('ar-EG', { numberingSystem: 'latn' })}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{data.summary.invoices_count} فاتورة</p>
            </div>
            <div className={`${pageCardShell} ${pageCardInner} p-4`}>
              <p className="text-xs text-slate-500 dark:text-slate-400">نسبة من إيراد الفترة</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${textAccentBidex}`} dir="ltr">
                {data.summary.share_of_revenue_percent.toLocaleString('ar-EG', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                  numberingSystem: 'latn',
                })}
                %
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                من أصل {money(data.summary.all_products_revenue_in_period)} جنيه لكل المنتجات
              </p>
            </div>
            <div className={`${pageCardShell} ${pageCardInner} p-4`}>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اتجاه آخر {data.trend.compare_days} يومًا
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TrendBadge trend={data.trend} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400" dir="ltr">
                حديث: {money(data.trend.recent_revenue)} · سابق: {money(data.trend.previous_revenue)}
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {pieData.length > 0 && (
              <div className={`${pageCardShell} ${pageCardInner} p-4 lg:col-span-1`}>
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  حصة الإيراد في الفترة
                </h3>
                <div className="h-[220px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${Number(value ?? 0)}%`, '']}
                        contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className={`${pageCardShell} ${pageCardInner} p-4 lg:col-span-2`}>
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                إيراد وكمية يومية ضمن الفترة
              </h3>
              <div className="h-[280px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sales_by_day} margin={{ top: 8, right: 36, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={36} />
                    <Tooltip
                      formatter={(v, name) =>
                        name === 'الإيراد' || name === 'revenue'
                          ? [money(Number(v ?? 0)) + ' جنيه', 'الإيراد']
                          : [qtyFmt(Number(v ?? 0)), 'الكمية']
                      }
                      labelFormatter={(l) => `التاريخ: ${l}`}
                      contentStyle={{ direction: 'rtl' }}
                    />
                    <Legend wrapperStyle={{ direction: 'rtl' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#093F85"
                      strokeWidth={2}
                      dot={false}
                      name="الإيراد"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="quantity"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="الكمية"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {data.sales_by_week && data.sales_by_week.length > 0 && (
            <div className={`${pageCardShell} ${pageCardInner} mb-5`}>
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  الكمية الأسبوعية (آخر 12 أسبوعًا، من السبت)
                </h3>
              </div>
              <div className="h-[300px] w-full p-4 sm:p-5" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sales_by_week} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis
                      dataKey="week_label"
                      tick={{ fontSize: 9 }}
                      interval={0}
                      angle={-32}
                      textAnchor="end"
                      height={64}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v, _name, item) => {
                        const row = item?.payload as { revenue?: number } | undefined;
                        const extra = row?.revenue != null ? ` — إيراد ${money(row.revenue)} ج` : '';
                        return [`${qtyFmt(Number(v ?? 0))} وحدة${extra}`, 'الكمية'];
                      }}
                      labelFormatter={(_, items) => {
                        const p = items?.[0]?.payload as { week_start?: string; week_end?: string } | undefined;
                        return p ? `${p.week_start} → ${p.week_end}` : '';
                      }}
                      contentStyle={{ direction: 'rtl' }}
                    />
                    <Bar dataKey="quantity" fill="#2563eb" radius={[4, 4, 0, 0]} name="الكمية" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={`${pageCardShell} ${pageCardInner}`}>
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  إيراد شهري (آخر 12 شهرًا)
                </h3>
              </div>
              <div className="h-[300px] w-full p-4 sm:p-5" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sales_by_month} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis
                      dataKey="month_label"
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                      angle={-22}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v) => [money(Number(v ?? 0)) + ' جنيه', 'الإيراد']}
                      contentStyle={{ direction: 'rtl' }}
                    />
                    <Bar dataKey="revenue" fill="#093F85" radius={[4, 4, 0, 0]} name="الإيراد" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`${pageCardShell} ${pageCardInner}`}>
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  كمية شهرية (آخر 12 شهرًا)
                </h3>
              </div>
              <div className="h-[300px] w-full p-4 sm:p-5" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sales_by_month} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis
                      dataKey="month_label"
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                      angle={-22}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v) => [qtyFmt(Number(v ?? 0)), 'الكمية المباعة']}
                      contentStyle={{ direction: 'rtl' }}
                    />
                    <Bar dataKey="quantity" fill="#2563eb" radius={[4, 4, 0, 0]} name="الكمية" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
