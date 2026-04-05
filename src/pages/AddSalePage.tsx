import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, PackagePlus, Plus, Trash2, ScanLine } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage, invoicesApi, productsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { useAppSelector } from '@/store/hooks';

const labelClass =
  'block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5';
const inputClass =
  'w-full min-h-[42px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-[var(--input-border)] bg-white dark:bg-[var(--input-bg)] text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--bidex-primary)_32%,transparent)] focus:border-[var(--bidex-primary)]';
const btnPrimarySolid =
  'bg-[var(--bidex-primary)] text-white shadow-sm transition hover:brightness-110 disabled:opacity-60';
const inputReadOnlyClass =
  `${inputClass} bg-slate-100 dark:bg-[var(--input-bg)] cursor-default focus:ring-0`;
/** دفعات الأصناف: خلفية muted البحرية (#07233F في الوضع الداكن) وليس slate-900 */
const lineCardClass =
  'rounded-2xl border border-card bg-muted p-4 sm:p-5 space-y-4 shadow-sm';

type Row = {
  productId: number | '';
  description: string;
  quantity: number;
  unitPrice: string;
  saleType: 'cash' | 'installment' | '';
  lineDiscount: string;
};

export function AddSalePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const [rows, setRows] = useState<Row[]>([
    { productId: '', description: '', quantity: 1, unitPrice: '', saleType: '', lineDiscount: '' },
  ]);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [redeemedPoints, setRedeemedPoints] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState('');
  const [barcode, setBarcode] = useState('');
  const [lastSavedInvoiceId, setLastSavedInvoiceId] = useState<number | null>(null);
  const [lastSavedPhone, setLastSavedPhone] = useState('');
  const [lastSavedTotal, setLastSavedTotal] = useState<number>(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const OFFLINE_QUEUE_KEY = 'offline_invoice_queue_v1';

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof invoicesApi.create>[0]) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setLastSavedInvoiceId(invoice.id);
      setLastSavedPhone(buyerPhone);
      setLastSavedTotal(Number(invoice.total ?? 0));
      // البقاء في نفس الصفحة بعد الحفظ مع تصفية/تصفير البيانات
      setRows([{ productId: '', description: '', quantity: 1, unitPrice: '', saleType: '', lineDiscount: '' }]);
      setBuyerName('');
      setBuyerPhone('');
      setBuyerAddress('');
      setPaymentStatus('pending');
      setPaymentMethod('');
      setDueDate('');
      setPaidAmount('');
      setRedeemedPoints('');
      setInvoiceDiscount('');
    },
    onError: (err, payload) => {
      if (!navigator.onLine) {
        const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as unknown[];
        existing.push({ payload, created_at: new Date().toISOString() });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
        alert('تم حفظ الفاتورة محليًا وسيتم مزامنتها عند عودة الإنترنت.');
        return;
      }
      alert(getApiErrorMessage(err, 'فشل حفظ الفاتورة'));
    },
  });

  const barcodeMutation = useMutation({
    mutationFn: (code: string) => productsApi.byCode(code).then((r) => r.data),
    onSuccess: (product) => {
      setRows((prev) => {
        const existing = prev.findIndex((r) => r.productId === product.id);
        if (existing >= 0) {
          return prev.map((row, i) => (i === existing ? { ...row, quantity: row.quantity + 1 } : row));
        }
        return [
          ...prev,
          {
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: product.default_price != null ? String(product.default_price) : '',
            saleType: '',
            lineDiscount: '',
          },
        ];
      });
      setBarcode('');
    },
    onError: () => {
      alert('الباركود غير موجود في المنتجات.');
    },
  });

  const offlineQueueCount = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as unknown[]).length;
    } catch {
      return 0;
    }
  }, [syncingOffline, createMutation.isSuccess]);

  const handleProductChange = (index: number, id: number | '') => {
    setRows((prev) => {
      const currentRow = prev[index];
      if (!currentRow) return prev;

      // لو المستخدم اختار نفس المنتج الموجود في صف آخر، نجمع الكميات بدل تكرار الصف
      if (id !== '') {
        const existingIndex = prev.findIndex((row, i) => i !== index && row.productId === id);
        if (existingIndex !== -1) {
          const p = products.find((x) => x.id === id);
          return prev.map((row, i) => {
            if (i === existingIndex) {
              const priceStr =
                row.unitPrice !== ''
                  ? row.unitPrice
                  : p?.default_price != null
                    ? String(p.default_price)
                    : currentRow.unitPrice;
              return {
                ...row,
                productId: id,
                description: p ? p.name : row.description || currentRow.description,
                unitPrice: priceStr,
                quantity: row.quantity + currentRow.quantity,
              };
            }
            if (i === index) {
              // نفرغ الصف الحالي لأنه تم دمجه مع الصف القديم
              return {
                productId: '',
                description: '',
                quantity: 1,
                unitPrice: '',
                saleType: '',
                lineDiscount: '',
              };
            }
            return row;
          });
        }
      }

      // الحالة العادية: تغيير المنتج في نفس الصف
      return prev.map((row, i) => {
        if (i !== index) return row;
        if (id === '') {
          return { ...row, productId: '', description: row.description };
        }
        const p = products.find((x) => x.id === id);
        return {
          ...row,
          productId: id,
          description: p ? p.name : row.description,
          unitPrice: p?.default_price != null ? String(p.default_price) : row.unitPrice,
        };
      });
    });
  };

  const handleRowChange = (index: number, field: keyof Row, value: string | number) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === 'quantity') {
          return { ...row, quantity: Number(value) || 0 };
        }
        return { ...row, [field]: value } as Row;
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { productId: '', description: '', quantity: 1, unitPrice: '', saleType: '', lineDiscount: '' },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const lineTotals = rows.map((row) => {
    const p = products.find((pr) => pr.id === row.productId);
    const price = parsePrice(row.unitPrice) ?? p?.default_price ?? 0;
    const gross = row.quantity * price;
    const discount = parsePrice(row.lineDiscount) ?? 0;
    return Math.max(gross - discount, 0);
  });

  const itemsSubtotal = lineTotals.reduce((sum, v) => sum + v, 0);
  const invoiceDiscountNum = parsePrice(invoiceDiscount) ?? 0;
  const redeemedPointsNum = Math.max(0, Math.floor(Number(redeemedPoints) || 0));
  /** مطابق للباكند: صافي الفاتورة = أصناف − خصم الفاتورة − نقاط مستبدلة */
  const grandNetTotal = Math.max(itemsSubtotal - invoiceDiscountNum - redeemedPointsNum, 0);
  const paidAmountNum = parsePrice(paidAmount);
  const remainingDue = Math.max(
    grandNetTotal - (paidAmountNum != null ? Math.max(paidAmountNum, 0) : 0),
    0,
  );

  /** يفسّر سعر الوحدة من النص (يدعم الفاصلة أو النقطة العشرية) */
  function parsePrice(value: string): number | null {
    if (value === '' || value == null) return null;
    const normalized = String(value).trim().replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  /** مدفوعة بالكامل = ملء المبلغ المدفوع تلقائيًا بصافي الفاتورة */
  useEffect(() => {
    if (paymentStatus !== 'paid') return;
    if (grandNetTotal <= 0) {
      setPaidAmount('');
      return;
    }
    setPaidAmount(String(grandNetTotal));
  }, [paymentStatus, grandNetTotal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const items = rows
      .map((row) => {
        const product = products.find((p) => p.id === row.productId);
        const price = parsePrice(row.unitPrice) ?? product?.default_price ?? 0;
        const lineDiscount = parsePrice(row.lineDiscount) ?? 0;
        return {
          product,
          product_id: row.productId || undefined,
          description: row.description.trim(),
          sale_type: row.saleType || undefined,
          quantity: row.quantity,
          unit_price: price,
          discount_amount: lineDiscount > 0 ? lineDiscount : undefined,
        };
      })
      .filter((item) => item.description && item.quantity > 0 && item.unit_price >= 0);

    if (items.length === 0) return;

    // تحقق من المخزون لكل صنف
    for (const item of items) {
      if (item.product && item.product.stock_quantity != null && item.quantity > item.product.stock_quantity) {
        alert(`الكمية المطلوبة أكبر من المتاح في المخزون للمنتج: ${item.product.name}`);
        return;
      }
    }

    const payload: any = {
      sale_date: saleDate,
      payment_status: paymentStatus,
      payment_method: paymentMethod || undefined,
      due_date: dueDate || undefined,
      paid_amount: parsePrice(paidAmount) ?? undefined,
      loyalty_points_redeemed: Number(redeemedPoints) > 0 ? Number(redeemedPoints) : undefined,
      discount_amount: parsePrice(invoiceDiscount) ?? undefined,
      buyer_name: buyerName || undefined,
      buyer_phone: buyerPhone || undefined,
      buyer_address: buyerAddress || undefined,
      seller_id: user?.id,
      items: items.map(({ product, ...rest }) => rest),
    };
    createMutation.mutate(payload);
  };

  const syncOfflineQueue = async () => {
    setSyncingOffline(true);
    try {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as { payload: Parameters<typeof invoicesApi.create>[0] }[];
      if (queue.length === 0) return;
      const failed: typeof queue = [];
      for (const item of queue) {
        try {
          await invoicesApi.create(item.payload);
        } catch {
          failed.push(item);
        }
      }
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert(failed.length === 0 ? 'تمت مزامنة كل الفواتير المحلية.' : `تمت المزامنة جزئيًا. المتبقي: ${failed.length}`);
    } finally {
      setSyncingOffline(false);
    }
  };

  useEffect(() => {
    const onOnline = () => {
      void syncOfflineQueue();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const whatsappUrl = useMemo(() => {
    if (!lastSavedInvoiceId || !lastSavedPhone) return null;
    const normalizedPhone = lastSavedPhone.replace(/[^\d]/g, '');
    if (!normalizedPhone) return null;
    const text = encodeURIComponent(`فاتورتك جاهزة. رقم الفاتورة: #${lastSavedInvoiceId} - الإجمالي: ${lastSavedTotal.toLocaleString('ar-EG')} جنيه`);
    return `https://wa.me/${normalizedPhone}?text=${text}`;
  }, [lastSavedInvoiceId, lastSavedPhone, lastSavedTotal]);

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">إضافة عملية بيع</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">اختر المنتج وأدخل الكمية والسعر والتاريخ</p>
      <div className="mb-5 flex flex-wrap items-stretch gap-2 sm:gap-3">
        <div className="flex flex-1 min-w-[min(100%,280px)] items-center gap-2 rounded-xl border border-card bg-card px-3 py-2 shadow-sm">
          <ScanLine className="w-4 h-4 shrink-0 text-slate-500" />
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (barcode.trim()) barcodeMutation.mutate(barcode.trim());
              }
            }}
            placeholder="امسح/اكتب باركود المنتج"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => barcode.trim() && barcodeMutation.mutate(barcode.trim())}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${btnPrimarySolid}`}
          >
            إضافة
          </button>
        </div>
        <button
          type="button"
          onClick={syncOfflineQueue}
          disabled={syncingOffline || offlineQueueCount === 0}
          className="rounded-xl border border-card bg-card px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:opacity-95 dark:text-slate-200 disabled:opacity-50"
        >
          {syncingOffline ? 'جاري المزامنة...' : `مزامنة أوفلاين (${offlineQueueCount})`}
        </button>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`text-xs px-3 py-2 rounded-xl font-semibold ${btnPrimarySolid}`}>
            إرسال الفاتورة واتساب
          </a>
        )}
      </div>

      <div className={`${pageCardShell} mb-5`}>
        <div className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${pageCardInner}`}>
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] text-[var(--bidex-primary)] dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_22%,#020F1F)] dark:text-sky-200">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">إدخال المنتجات</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                أضف المنتجات من هنا لتظهر في القائمة عند إضافة عملية البيع.
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:self-center ${btnPrimarySolid}`}
          >
            <PackagePlus className="h-4 w-4" /> ذهاب إلى إدخال المنتجات
          </Link>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={`p-5 sm:p-6 lg:p-8 ${pageCardInner}`}>
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">بيانات المشتري</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelClass}>اسم المشتري</label>
                  <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>رقم الهاتف</label>
                  <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <label className={labelClass}>عنوان المشتري</label>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    className={inputClass}
                    placeholder="اختياري"
                  />
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">أصناف الفاتورة</h3>
              <div className="space-y-4">
                {rows.map((row, index) => {
                  const selectedProduct = products.find((p) => p.id === row.productId);
                  const availableStock = selectedProduct?.stock_quantity ?? null;
                  const price = parsePrice(row.unitPrice) ?? selectedProduct?.default_price ?? 0;
                  const discount = parsePrice(row.lineDiscount) ?? 0;
                  const lineTotal = Math.max(row.quantity * price - discount, 0);
                  return (
                    <div key={index} className={lineCardClass}>
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-card pb-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">الصنف {index + 1}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-lg bg-[color:color-mix(in_srgb,var(--bidex-primary)_10%,white)] px-3 py-1.5 dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_18%,#020F1F)]">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">إجمالي الصنف</p>
                            <p className="text-sm font-bold tabular-nums text-[var(--bidex-primary)] dark:text-sky-300" dir="ltr">
                              {lineTotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={rows.length <= 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-card px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-4 lg:gap-y-4">
                        <div className="min-w-0 lg:col-span-5">
                          <label className={labelClass}>المنتج</label>
                          <select
                            value={row.productId}
                            onChange={(e) =>
                              handleProductChange(index, e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className={inputClass}
                          >
                            <option value="">— إدخال يدوي —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.code ? `${p.code} - ` : ''}
                                {p.name} {p.default_price != null ? `(${p.default_price} جنيه)` : ''}
                              </option>
                            ))}
                          </select>
                          {selectedProduct && (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                              المتاح في المخزون: {availableStock != null ? availableStock : 0}
                            </p>
                          )}
                        </div>
                        <div className="min-w-0 lg:col-span-4">
                          <label className={labelClass}>نوع البيع</label>
                          <select
                            value={row.saleType}
                            onChange={(e) => handleRowChange(index, 'saleType', e.target.value)}
                            className={inputClass}
                          >
                            <option value="">اختياري — اختر النوع</option>
                            <option value="cash">كاش</option>
                            <option value="installment">تقسيط</option>
                          </select>
                        </div>
                        <div className="min-w-0 lg:col-span-3">
                          <label className={labelClass}>الكمية</label>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={row.quantity}
                            onChange={(e) => handleRowChange(index, 'quantity', Number(e.target.value) || 0)}
                            required
                            className={inputClass}
                          />
                        </div>

                        <div className="min-w-0 lg:col-span-6">
                          <label className={labelClass}>السعر (جنيه)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.unitPrice}
                            onChange={(e) => handleRowChange(index, 'unitPrice', e.target.value)}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div className="min-w-0 lg:col-span-6">
                          <label className={labelClass}>خصم الصنف (جنيه)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.lineDiscount}
                            onChange={(e) => handleRowChange(index, 'lineDiscount', e.target.value)}
                            className={inputClass}
                            placeholder="0"
                          />
                        </div>

                        <div className="min-w-0 lg:col-span-12">
                          <label className={labelClass}>الوصف / اسم المنتج</label>
                          <textarea
                            value={row.description}
                            onChange={(e) => handleRowChange(index, 'description', e.target.value)}
                            required
                            rows={2}
                            className={`${inputClass} min-h-[72px] resize-y py-2.5`}
                            placeholder="اسم أو وصف الصنف كما يظهر في الفاتورة"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addRow}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:color-mix(in_srgb,var(--bidex-primary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--bidex-primary)_6%,white)] py-3 text-sm font-semibold text-[var(--bidex-primary)] transition hover:border-[var(--bidex-primary)] hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_11%,white)] dark:border-[color:color-mix(in_srgb,var(--bidex-primary)_40%,#0A2A4A)] dark:bg-[color:color-mix(in_srgb,var(--bidex-primary)_12%,#020F1F)] dark:text-sky-300 dark:hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_18%,#020F1F)]"
                >
                  <Plus className="h-4 w-4" />
                  إضافة صنف آخر
                </button>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">الخصومات والإجمالي</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelClass}>خصم على الفاتورة (جنيه)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={invoiceDiscount}
                    onChange={(e) => setInvoiceDiscount(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>نقاط مستبدلة</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={redeemedPoints}
                    onChange={(e) => setRedeemedPoints(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    تُخصم من الإجمالي (1 نقطة = 1 جنيه).
                  </p>
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-card bg-muted p-4">
                <div className="min-w-0">
                  <label className={labelClass}>إجمالي الأصناف (بعد خصم كل صنف)</label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={`${itemsSubtotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`}
                    className={inputReadOnlyClass}
                  />
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>
                    المبلغ الإجمالي للفاتورة{' '}
                    <span className="font-normal text-[var(--bidex-primary)] dark:text-sky-400">(تلقائي)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={`${grandNetTotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`}
                    className={`${inputReadOnlyClass} font-semibold text-slate-900 dark:text-slate-100`}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    يُحسب: الأصناف − خصم الفاتورة − النقاط.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">التاريخ والدفع</h3>
              <div className="min-w-0 max-w-md">
                <label className={labelClass}>تاريخ البيع</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelClass}>حالة الدفع</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
                    className={inputClass}
                  >
                    <option value="pending">قيد الدفع</option>
                    <option value="paid">مدفوعة بالكامل</option>
                    <option value="partial">مدفوعة جزئيًا</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>طريقة الدفع</label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={inputClass}
                    placeholder="مثال: كاش، فيزا، تحويل بنكي"
                  />
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>تاريخ الاستحقاق (للآجل)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>المبلغ المدفوع الآن</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    readOnly={paymentStatus === 'paid'}
                    className={paymentStatus === 'paid' ? inputReadOnlyClass : inputClass}
                    placeholder={paymentStatus === 'pending' ? 'اتركه فارغًا أو أدخل المدفوع' : '0'}
                  />
                  {paymentStatus === 'paid' && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">يُملأ تلقائيًا بإجمالي الفاتورة.</p>
                  )}
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <label className={labelClass}>
                    المتبقي على العميل <span className="font-normal text-slate-500">(تلقائي)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={`${remainingDue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه`}
                    className={inputReadOnlyClass}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {paymentStatus === 'paid'
                      ? 'لا يوجد متبقي عند الدفع الكامل.'
                      : 'الإجمالي − المبلغ المدفوع (إن وُجد).'}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-2 border-t border-card pt-6">
              <button type="submit" disabled={createMutation.isPending} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold ${btnPrimarySolid}`}>
                <Save className="w-4 h-4" /> {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2.5 rounded-xl border border-card bg-muted text-slate-700 dark:text-slate-300 font-medium hover:opacity-90">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
