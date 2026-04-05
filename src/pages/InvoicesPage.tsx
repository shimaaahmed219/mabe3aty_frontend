import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, productsApi } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import type { Invoice, InvoiceItem } from '@/lib/api';

const labelClass =
  'block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5';
const inputClass =
  'w-full min-h-[42px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-[var(--input-border)] bg-white dark:bg-[var(--input-bg)] text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--bidex-primary)_32%,transparent)] focus:border-[var(--bidex-primary)]';
const btnPrimarySolid =
  'bg-[var(--bidex-primary)] text-white shadow-sm transition hover:brightness-110 disabled:opacity-60';

function remainingForInvoice(inv: Invoice): number {
  const paid = (inv.payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
  return Math.max(Number(inv.total) - paid, 0);
}

/** يعرض تاريخ البيع بصيغة مقروءة (تجاهل جزء الوقت من ISO). */
function formatSaleDate(value: string | undefined | null): string {
  if (value == null || value === '') return '—';
  const isoDay = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
    return isoDay;
  }
  const t = Date.parse(value);
  if (!Number.isNaN(t)) {
    return new Date(t).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn',
    });
  }
  return value;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: 'latn' });
}

function lineItemTotal(i: InvoiceItem): number {
  const t = Number(i.total);
  if (Number.isFinite(t)) {
    return t;
  }
  const gross = Number(i.quantity) * Number(i.unit_price);
  const disc = Number(i.discount_amount ?? 0);
  return Math.max(gross - disc, 0);
}

export function InvoicesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [productId, setProductId] = useState<number | ''>('');
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', from || undefined, to || undefined, productId || undefined],
    queryFn: () =>
      invoicesApi
        .list({ from: from || undefined, to: to || undefined, product_id: productId || undefined })
        .then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { sale_date?: string; notes?: string } }) =>
      invoicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditInvoice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditInvoice(null);
    },
  });

  const invoices = data?.data ?? [];

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setEditDate(inv.sale_date.slice(0, 10));
    setEditNotes(inv.notes ?? '');
  };

  const handleSaveEdit = () => {
    if (!editInvoice) return;
    updateMutation.mutate({ id: editInvoice.id, data: { sale_date: editDate, notes: editNotes || undefined } });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('حذف هذه الفاتورة؟')) deleteMutation.mutate(id);
  };

  return (
    <PageWrapper>
      <header className="mb-5 sm:mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl md:text-3xl">
          المبيعات
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          تصفّح الفواتير، رشّح بالتاريخ أو المنتج، وعدّل التاريخ أو الملاحظات عند الحاجة.
        </p>
      </header>

      <div className={`${pageCardShell} mb-5`}>
        <div className={`${pageCardInner}`}>
        <div className="border-b border-card bg-[color:color-mix(in_srgb,var(--bidex-primary)_5%,white)] px-4 py-3 dark:bg-muted sm:px-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">تصفية القائمة</h2>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <label className={labelClass} htmlFor="inv-filter-from">
                من تاريخ
              </label>
              <input
                id="inv-filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="min-w-0">
              <label className={labelClass} htmlFor="inv-filter-to">
                إلى تاريخ
              </label>
              <input
                id="inv-filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label className={labelClass} htmlFor="inv-filter-product">
                المنتج
              </label>
              <select
                id="inv-filter-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputClass}
              >
                <option value="">كل المنتجات</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-card pt-4 sm:flex-row sm:flex-wrap">
            <Link
              to="/sales/new"
              className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:flex-none ${btnPrimarySolid}`}
            >
              <Plus className="h-4 w-4 shrink-0" /> إضافة عملية بيع
            </Link>
            <Link
              to="/invoices/new"
              className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-card bg-card px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:opacity-90 dark:text-slate-200 sm:flex-none"
            >
              فاتورة متعددة البنود
            </Link>
          </div>
        </div>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-slate-500 dark:text-slate-400">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-600" />
            <p className="text-sm">جاري التحميل...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-700/80 dark:text-slate-500">
              <FileText className="h-7 w-7" />
            </div>
            <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
              لا توجد مبيعات ضمن التصفية الحالية.
            </p>
            <Link
              to="/sales/new"
              className="text-sm font-semibold text-[var(--bidex-primary)] hover:underline dark:text-sky-400"
            >
              أضف عملية بيع
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-card bg-muted dark:bg-muted">
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    اسم المنتج / البنود
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    الكمية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                    المشتري
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                      البائع
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                    الإجمالي
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                    المتبقي
                  </th>
                  <th className="min-w-[8.5rem] whitespace-nowrap px-4 py-3" aria-label="إجراءات" />
                </tr>
              </thead>
              <tbody className="divide-y divide-card/60">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_6%,white)] dark:hover:bg-[color:color-mix(in_srgb,var(--muted-bg)_40%,var(--card-bg))]"
                  >
                    <td className="max-w-[min(220px,32vw)] px-4 py-3 text-slate-700 dark:text-slate-300">
                      <span className="line-clamp-3 font-medium text-slate-900 dark:text-slate-100">
                        {inv.items?.map((i) => i.description).join(' — ') ?? '—'}
                      </span>
                    </td>
                    <td className="min-w-[200px] max-w-[280px] px-4 py-3 text-slate-700 dark:text-slate-300">
                      {inv.items && inv.items.length > 0 ? (
                        <ul className="space-y-2 text-xs leading-relaxed">
                          {inv.items.map((i) => (
                            <li
                              key={i.id}
                              className="rounded-lg border border-card bg-[color:color-mix(in_srgb,var(--bidex-primary)_4%,white)] px-2.5 py-2 dark:bg-muted/50"
                            >
                              <div className="grid gap-0.5 text-slate-600 dark:text-slate-400">
                                <span>
                                  العدد:{' '}
                                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                                    {Number(i.quantity).toLocaleString('ar-EG', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                      numberingSystem: 'latn',
                                    })}
                                  </span>
                                </span>
                                <span>
                                  سعر الوحدة:{' '}
                                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                                    {fmtMoney(Number(i.unit_price))} جنيه
                                  </span>
                                </span>
                                <span>
                                  الإجمالي:{' '}
                                  <span className="font-semibold tabular-nums text-[var(--bidex-primary)] dark:text-sky-300" dir="ltr">
                                    {fmtMoney(lineItemTotal(i))} جنيه
                                  </span>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {formatSaleDate(inv.sale_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {inv.buyer_name || '—'}
                      {inv.buyer_phone && (
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {inv.buyer_phone}
                        </span>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {inv.seller ? inv.seller.name : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-left font-medium tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                      {Number(inv.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-left font-medium tabular-nums text-slate-900 dark:text-slate-100" dir="ltr">
                      {remainingForInvoice(inv).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-middle">
                      <div className="inline-flex flex-row flex-nowrap items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(inv)}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-muted"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/25"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="inline-flex shrink-0 items-center rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--bidex-primary)] transition hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_10%,white)] dark:text-sky-400 dark:hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_16%,#020F1F)]"
                        >
                          عرض
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {editInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setEditInvoice(null)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-card bg-card shadow-xl"
            role="dialog"
            aria-labelledby="edit-invoice-title"
          >
            <div className={`border-b border-card px-5 py-4 ${pageCardInner}`}>
              <h2 id="edit-invoice-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                تعديل الفاتورة
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                رقم {editInvoice.invoice_number} — يمكن تعديل التاريخ والملاحظات فقط.
              </p>
            </div>
            <div className={`space-y-4 p-5 ${pageCardInner}`}>
              <div className="min-w-0">
                <label className={labelClass} htmlFor="edit-inv-date">
                  تاريخ البيع
                </label>
                <input
                  id="edit-inv-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="min-w-0">
                <label className={labelClass} htmlFor="edit-inv-notes">
                  ملاحظات
                </label>
                <textarea
                  id="edit-inv-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className={`${inputClass} min-h-[100px] resize-y py-2.5`}
                  placeholder="اختياري"
                />
              </div>
            </div>
            <div className={`flex flex-wrap justify-end gap-2 border-t border-card px-5 py-4 ${pageCardInner}`}>
              <button
                type="button"
                onClick={() => setEditInvoice(null)}
                className="min-h-[42px] rounded-xl border border-card bg-muted px-4 py-2 text-sm font-semibold text-slate-700 transition hover:opacity-90 dark:text-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className={`min-h-[42px] rounded-xl px-4 py-2 text-sm font-semibold ${btnPrimarySolid}`}
              >
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
