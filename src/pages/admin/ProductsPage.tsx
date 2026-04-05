import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import type { Product, ProductUpdatePayload } from '@/lib/api';
import { btnPrimarySolid, focusRingBidex, hoverSurfaceBidex, textAccentBidex } from '@/lib/theme';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { useAppSelector } from '@/store/hooks';

const inputClass = `w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[var(--input-border)] bg-white dark:bg-[var(--input-bg)] text-slate-900 dark:text-slate-100 ${focusRingBidex}`;
const tableHeadClass =
  'bg-[color:color-mix(in_srgb,var(--bidex-primary)_9%,white)] dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_22%,#0f172a)]';
const iconBtnClass = `rounded-xl p-2 transition-colors ${textAccentBidex} ${hoverSurfaceBidex}`;

const SHELF_UNITS = [
  { value: 'days' as const, label: 'أيام' },
  { value: 'months' as const, label: 'شهور' },
  { value: 'years' as const, label: 'سنوات' },
];

/** تاريخ انتهاء متوقع من الإنتاج + المدة (تقويم محلي، يطابق منطق الخادم تقريباً) */
function computeExpiryYmd(
  productionYmd: string,
  amount: number,
  unit: 'days' | 'months' | 'years'
): string | null {
  const m = productionYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return null;
  if (unit === 'days') dt.setDate(dt.getDate() + amount);
  else if (unit === 'months') dt.setMonth(dt.getMonth() + amount);
  else dt.setFullYear(dt.getFullYear() + amount);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** أرقام لاتينية موحّدة (تفادي اختلاف الهند الشرقي/الغربي بين الأعمدة) */
const fmtLatn = (n: number, opts?: Intl.NumberFormatOptions) =>
  n.toLocaleString('ar-EG', { numberingSystem: 'latn', ...opts });

function expiryCell(p: Product, isAdmin: boolean) {
  if (!p.expiry_date) return <span className="text-slate-400">—</span>;
  if (p.is_expired) {
    return (
      <div className="text-right">
        <span className="inline-block rounded-lg bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-200">
          منتهي
        </span>
        {isAdmin && p.expired_stock_cost_estimate != null && p.expired_stock_cost_estimate > 0 && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-300">
            تقدير خسارة مخزون: {fmtLatn(p.expired_stock_cost_estimate, { maximumFractionDigits: 2 })} ج
          </p>
        )}
      </div>
    );
  }
  const d = p.days_to_expiry;
  const soon = d != null && d <= 30;
  return (
    <div className="text-right text-xs">
      <span
        className={
          soon
            ? 'inline-block rounded-lg bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
            : 'inline-block rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-blue-900 dark:bg-sky-950/40 dark:text-sky-200'
        }
      >
        {soon ? `متبقي ${d} يوم` : 'ساري'}
      </span>
      <p className="mt-1 tabular-nums text-slate-500 dark:text-slate-400">{p.expiry_date}</p>
    </div>
  );
}

export function ProductsPage() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [shelfLifeAmount, setShelfLifeAmount] = useState('');
  const [shelfLifeUnit, setShelfLifeUnit] = useState<'days' | 'months' | 'years'>('days');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (!open) return;
    const prod = productionDate.trim();
    if (!prod) return;
    const shelfTrim = shelfLifeAmount.trim();
    const n = shelfTrim === '' ? NaN : Number(shelfTrim);
    if (!Number.isFinite(n) || n < 1) return;
    const computed = computeExpiryYmd(prod, Math.floor(n), shelfLifeUnit);
    if (computed) setExpiryDate(computed);
  }, [open, productionDate, shelfLifeAmount, shelfLifeUnit]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof productsApi.create>[0]) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdatePayload }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditing(null);
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setDefaultPrice('');
    setCategory('');
    setStockQuantity('');
    setPurchasePrice('');
    setProductionDate('');
    setShelfLifeAmount('');
    setShelfLifeUnit('days');
    setExpiryDate('');
  };

  const getSuggestedCode = (): string => {
    const numericCodes = products
      .map((p) => (p.code ?? '').match(/^P(\d+)$/i))
      .filter(Boolean)
      .map((m) => parseInt((m as RegExpMatchArray)[1], 10));
    const next = numericCodes.length ? Math.max(...numericCodes) + 1 : 1;
    return 'P' + String(next).padStart(3, '0');
  };

  const handleOpenAdd = () => {
    setEditing(null);
    resetForm();
    setCode(getSuggestedCode());
    setOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditing(p);
    setCode(p.code ?? '');
    setName(p.name);
    setDefaultPrice(p.default_price != null ? String(p.default_price) : '');
    setCategory(p.category ?? '');
    setStockQuantity(p.stock_quantity != null ? String(p.stock_quantity) : '');
    setPurchasePrice(p.purchase_price != null ? String(p.purchase_price) : '');
    setProductionDate(p.production_date?.slice(0, 10) ?? '');
    if (p.shelf_life_value != null && p.shelf_life_unit) {
      setShelfLifeAmount(String(p.shelf_life_value));
      setShelfLifeUnit(p.shelf_life_unit);
    } else if (p.shelf_life_days != null && p.shelf_life_days > 0) {
      setShelfLifeAmount(String(p.shelf_life_days));
      setShelfLifeUnit('days');
    } else {
      setShelfLifeAmount('');
      setShelfLifeUnit('days');
    }
    setExpiryDate(p.expiry_date?.slice(0, 10) ?? '');
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = defaultPrice !== '' ? Number(defaultPrice) : undefined;
    const stock = stockQuantity !== '' ? Number(stockQuantity) : undefined;
    const prodDate = productionDate.trim() || undefined;
    const expDate = expiryDate.trim() || undefined;

    const shelfTrim = shelfLifeAmount.trim();
    const shelfNum = shelfTrim !== '' ? Number(shelfTrim) : NaN;
    const hasShelf = Number.isFinite(shelfNum) && shelfNum >= 1;
    const shelfPayload = hasShelf
      ? { shelf_life_value: Math.floor(shelfNum), shelf_life_unit: shelfLifeUnit, shelf_life_days: null as null }
      : { shelf_life_value: null as null, shelf_life_unit: null as null, shelf_life_days: null as null };

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: {
          code: code || undefined,
          name,
          category: category || undefined,
          default_price: price,
          stock_quantity: stock,
          production_date: prodDate ?? null,
          expiry_date: expDate ?? null,
          ...shelfPayload,
          ...(isAdmin ? { purchase_price: purchasePrice !== '' ? Number(purchasePrice) : null } : {}),
        },
      });
    } else {
      createMutation.mutate({
        code: code.trim(),
        name,
        category: category || undefined,
        default_price: price,
        stock_quantity: stock,
        production_date: prodDate,
        expiry_date: expDate,
        ...shelfPayload,
        ...(isAdmin && purchasePrice !== '' ? { purchase_price: Number(purchasePrice) } : {}),
      });
    }
  };

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--bidex-primary)] dark:text-sky-300 sm:text-3xl">
            إدارة المنتجات
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isLoading
              ? 'جاري تحميل القائمة…'
              : products.length === 0
                ? 'أضف منتجاتك لتتبع المخزون والأسعار'
                : `${products.length.toLocaleString('ar-EG')} منتج في القائمة`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] shadow-sm sm:w-auto ${btnPrimarySolid}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          إضافة منتج
        </button>
      </div>
      <div className={pageCardShell}>
        <div className={`p-5 sm:p-6 ${pageCardInner}`}>
          {isLoading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--bidex-primary)] dark:border-slate-600 dark:border-t-sky-400"
                aria-hidden
              />
              <p className="text-sm">جاري التحميل…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-600 dark:bg-slate-900/40">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_12%,transparent)] text-[var(--bidex-primary)] dark:text-sky-400">
                <Plus className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-200">لا توجد منتجات بعد</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                ابدأ بإضافة أول منتج لتظهر هنا في الجدول.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className={`mt-5 rounded-xl px-5 py-2.5 text-sm ${btnPrimarySolid}`}
              >
                إضافة منتج
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/80">
              <div className="overflow-x-auto" dir="ltr">
                <table
                  className={`w-full border-collapse text-sm ${isAdmin ? 'min-w-[1080px]' : 'min-w-[820px]'}`}
                >
                  <thead>
                    <tr className={`${tableHeadClass} border-b border-slate-200/80 dark:border-slate-600/80`}>
                      <th className="w-36 px-3 py-4 text-center text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        إجراءات
                      </th>
                      <th className="min-w-[6.5rem] px-3 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        الصلاحية
                      </th>
                      {isAdmin && (
                        <>
                          <th className="min-w-[5.5rem] px-3 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                            ربح (تقدير)
                          </th>
                          <th className="min-w-[4.5rem] px-3 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                            هامش
                          </th>
                          <th className="min-w-[5rem] px-3 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                            شراء
                          </th>
                        </>
                      )}
                      <th className="min-w-[5.5rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        سعر البيع
                      </th>
                      <th className="min-w-[4.5rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        المخزون
                      </th>
                      <th className="min-w-[4.5rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        المباع
                      </th>
                      <th className="min-w-[7rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        التصنيف
                      </th>
                      <th className="min-w-[8rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        الاسم
                      </th>
                      <th className="min-w-[5.5rem] px-4 py-4 text-right text-xs font-bold text-[var(--bidex-primary)] dark:text-sky-300">
                        الكود
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/60 dark:bg-slate-800/40">
                    {products.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/60 ${
                          i % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/25' : ''
                        }`}
                      >
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
                            <Link to={`/products/${p.id}`} className={iconBtnClass} title="إحصائيات المبيعات">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className={iconBtnClass}
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => window.confirm('حذف المنتج؟') && deleteMutation.mutate(p.id)}
                              className="rounded-xl p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-4">{expiryCell(p, isAdmin)}</td>
                        {isAdmin && (
                          <>
                            <td className="px-3 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                              {p.profit_on_sold_estimate != null
                                ? fmtLatn(p.profit_on_sold_estimate, { maximumFractionDigits: 2 })
                                : '—'}
                            </td>
                            <td className="px-3 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                              {p.unit_profit != null ? fmtLatn(p.unit_profit, { maximumFractionDigits: 2 }) : '—'}
                            </td>
                            <td className="px-3 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                              {p.purchase_price != null
                                ? fmtLatn(Number(p.purchase_price), { maximumFractionDigits: 2 })
                                : '—'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                          {p.default_price != null
                            ? fmtLatn(Number(p.default_price), { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                          {fmtLatn(p.stock_quantity != null ? Number(p.stock_quantity) : 0, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-800 dark:text-slate-200">
                          {fmtLatn(p.quantity_sold ?? 0, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-right text-slate-600 dark:text-slate-400">
                          <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium dark:bg-slate-700/80">
                            {p.category ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-700 dark:text-slate-300">
                          <Link to={`/products/${p.id}`} className={`font-medium hover:underline ${textAccentBidex}`}>
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                          <Link to={`/products/${p.id}`} className={`${textAccentBidex} hover:underline`}>
                            {p.code ?? '—'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setOpen(false); setEditing(null); }} aria-hidden />
          <div className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-2xl border border-card bg-card shadow-xl ${pageCardInner}`}>
            <div className="h-1 bg-[var(--bidex-primary)]" aria-hidden />
            <div className="p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{editing ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {editing ? 'حدّث بيانات المنتج ثم احفظ.' : 'أدخل تفاصيل المنتج الجديد.'}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">كود المنتج</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required={!editing} placeholder="مثال: P001" className={inputClass} />
                  {!editing && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">يُقترح كود تلقائياً. يمكنك تعديله أو كتابة كود آخر.</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">اسم المنتج</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">التصنيف</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="اختياري (مثال: مشروبات)" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    سعر البيع للعميل (جنيه)
                  </label>
                  <input type="number" min={0} step={0.01} value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} className={inputClass} />
                </div>
                {isAdmin && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      سعر الشراء / التكلفة (جنيه)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      يُستخدم لتقدير هامش الربح والمخزون المنتهي في التقارير.
                    </p>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">الكمية في المخزون</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ الإنتاج</label>
                    <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">مدة الصلاحية</label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={shelfLifeAmount}
                        onChange={(e) => setShelfLifeAmount(e.target.value)}
                        className={`${inputClass} sm:min-w-0 sm:flex-1`}
                        placeholder="مثال: 6"
                      />
                      <select
                        value={shelfLifeUnit}
                        onChange={(e) => setShelfLifeUnit(e.target.value as 'days' | 'months' | 'years')}
                        className={`${inputClass} sm:max-w-[9rem]`}
                      >
                        {SHELF_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ انتهاء الصلاحية</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    عند اختيار تاريخ الإنتاج ومدة الصلاحية، يُحدَّث حقل انتهاء الصلاحية تلقائياً (يمكنك تعديله يدوياً إن لزم).
                    الشهور والسنوات حسب التقويم الفعلي.
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setOpen(false); setEditing(null); }} className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">إلغاء</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className={`rounded-xl px-5 py-2.5 ${btnPrimarySolid}`}>{editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
