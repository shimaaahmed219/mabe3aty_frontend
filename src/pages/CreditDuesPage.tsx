import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage, invoicesApi, reportsApi } from '@/lib/api';
import { appToast } from '@/lib/appToast';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import {
  controlInputHover,
  filterChipInactive,
  outlineButtonInteractive,
  toolbarInputClassWithFocus,
} from '@/lib/theme';

const inputClass = `w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[var(--input-border)] bg-white dark:bg-[var(--input-bg)] text-sm ${controlInputHover}`;

export function CreditDuesPage() {
  const queryClient = useQueryClient();
  const [paymentDrafts, setPaymentDrafts] = useState<Record<number, { amount: string; method: string }>>({});
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'due_date_asc' | 'due_date_desc' | 'remaining_desc' | 'remaining_asc'>('due_date_asc');

  const { data: dues = [], isLoading, isFetching } = useQuery({
    queryKey: ['reports', 'credit-dues'],
    queryFn: () => reportsApi.creditDues().then((r) => r.data),
  });

  const addPayment = useMutation({
    mutationFn: ({ invoiceId, amount, method }: { invoiceId: number; amount: number; method?: string }) =>
      invoicesApi.addPayment(invoiceId, { amount, method }),
    onSuccess: async (_data, variables) => {
      if (variables?.invoiceId != null) {
        setPaymentDrafts((prev) => {
          const next = { ...prev };
          delete next[variables.invoiceId];
          return next;
        });
      }
      await queryClient.refetchQueries({ queryKey: ['reports', 'credit-dues'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      appToast.success('تم تسجيل السداد', 'تم تحديث المبالغ في القائمة.');
    },
    onError: (err) => {
      appToast.error('فشل تسجيل التحصيل', getApiErrorMessage(err, 'تعذّر إرسال المبلغ إلى الخادم.'));
    },
  });

  const setDraft = (invoiceId: number, patch: Partial<{ amount: string; method: string }>) => {
    setPaymentDrafts((prev) => ({
      ...prev,
      [invoiceId]: { amount: prev[invoiceId]?.amount ?? '', method: prev[invoiceId]?.method ?? '', ...patch },
    }));
  };

  const today = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const filteredDues = dues.filter((d) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const haystack = `${d.invoice_number || ''} ${d.buyer_name || ''} ${d.buyer_phone || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (!d.due_date) return filter === 'all';
    const dueDate = new Date(d.due_date);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / msInDay);
    if (filter === 'overdue') return diffDays < 0;
    if (filter === 'due_soon') return diffDays >= 0 && diffDays <= 3;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'remaining_desc') return Number(b.remaining_amount) - Number(a.remaining_amount);
    if (sortBy === 'remaining_asc') return Number(a.remaining_amount) - Number(b.remaining_amount);
    const ad = a.due_date ? new Date(a.due_date).getTime() : 0;
    const bd = b.due_date ? new Date(b.due_date).getTime() : 0;
    if (sortBy === 'due_date_desc') return bd - ad;
    return ad - bd;
  });

  const getReminderUrl = (phone?: string | null, invoiceNumber?: string, amount?: number, dueDate?: string | null) => {
    const normalizedPhone = (phone || '').replace(/[^\d]/g, '');
    if (!normalizedPhone) return null;
    const msg = encodeURIComponent(
      `تذكير ودي: الفاتورة ${invoiceNumber || ''} مستحق عليها ${Number(amount || 0).toLocaleString('ar-EG')} جنيه بتاريخ ${dueDate || 'غير محدد'}.`
    );
    return `https://wa.me/${normalizedPhone}?text=${msg}`;
  };

  const getDueMeta = (dueDate?: string | null) => {
    if (!dueDate) return { diffDays: null as number | null, tone: '', label: 'بدون استحقاق' };
    const d = new Date(dueDate);
    const diffDays = Math.floor((d.getTime() - today.getTime()) / msInDay);
    if (diffDays < 0) return { diffDays, tone: 'bg-red-50 dark:bg-red-900/10', label: 'متأخر' };
    if (diffDays <= 3) return { diffDays, tone: 'bg-amber-50 dark:bg-amber-900/10', label: 'قريب الاستحقاق' };
    return { diffDays, tone: 'bg-sky-50 dark:bg-blue-950/15', label: 'منتظم' };
  };

  const overdueCount = filteredDues.filter((d) => getDueMeta(d.due_date).label === 'متأخر').length;
  const dueSoonCount = filteredDues.filter((d) => getDueMeta(d.due_date).label === 'قريب الاستحقاق').length;
  const exportCsv = () => {
    const headers = ['invoice_number', 'buyer_name', 'buyer_phone', 'due_date', 'total', 'remaining_amount', 'status'];
    const rows = filteredDues.map((d) => [
      d.invoice_number,
      d.buyer_name || '',
      d.buyer_phone || '',
      d.due_date || '',
      String(d.total),
      String(d.remaining_amount),
      getDueMeta(d.due_date).label,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-dues-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>إدارة الديون والتحصيل</h1>
      {isFetching && !isLoading && (
        <p className="text-xs text-muted mb-2" aria-live="polite">جاري تحديث القائمة…</p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الفاتورة أو اسم العميل أو الهاتف"
          className={`min-w-[280px] ${toolbarInputClassWithFocus}`}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className={toolbarInputClassWithFocus}
        >
          <option value="due_date_asc">الاستحقاق: الأقدم أولاً</option>
          <option value="due_date_desc">الاستحقاق: الأحدث أولاً</option>
          <option value="remaining_desc">المتبقي: الأعلى أولاً</option>
          <option value="remaining_asc">المتبقي: الأقل أولاً</option>
        </select>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-xl border px-3 py-1.5 text-sm ${filter === 'all' ? 'border-[var(--bidex-primary)] bg-[var(--bidex-primary)] text-white' : filterChipInactive}`}
        >
          الكل
        </button>
        <button
          type="button"
          onClick={() => setFilter('overdue')}
          className={`rounded-xl border px-3 py-1.5 text-sm ${filter === 'overdue' ? 'border-red-600 bg-red-600 text-white' : filterChipInactive}`}
        >
          متأخر
        </button>
        <button
          type="button"
          onClick={() => setFilter('due_soon')}
          className={`rounded-xl border px-3 py-1.5 text-sm ${filter === 'due_soon' ? 'border-amber-600 bg-amber-600 text-white' : filterChipInactive}`}
        >
          مستحق خلال 3 أيام
        </button>
        <button type="button" onClick={exportCsv} className={outlineButtonInteractive}>
          تصدير CSV
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className={pageCardShell}><div className={`${pageCardInner} p-4 text-sm`}>متأخرات: <span className="font-semibold">{overdueCount}</span></div></div>
        <div className={pageCardShell}><div className={`${pageCardInner} p-4 text-sm`}>مستحق قريبًا: <span className="font-semibold">{dueSoonCount}</span></div></div>
        <div className={pageCardShell}><div className={`${pageCardInner} p-4 text-sm`}>نتائج الفلتر: <span className="font-semibold">{filteredDues.length}</span></div></div>
      </div>
      <div className={`${pageCardShell} mb-4`}>
        <div className={`${pageCardInner} p-4 text-sm text-muted`}>
          إجمالي المتبقي: <span style={{ color: 'var(--foreground)' }}>{filteredDues.reduce((s, d) => s + Number(d.remaining_amount || 0), 0).toLocaleString('ar-EG')} جنيه</span>
        </div>
      </div>
      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="p-6 text-muted">جاري التحميل...</div>
        ) : filteredDues.length === 0 ? (
          <div className="p-6 text-muted">لا توجد ديون مستحقة حاليًا.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-right py-3 px-4">الفاتورة</th>
                  <th className="text-right py-3 px-4">العميل</th>
                  <th className="text-right py-3 px-4">الاستحقاق</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">الإجمالي</th>
                  <th className="text-right py-3 px-4">المتبقي</th>
                  <th className="text-right py-3 px-4">تذكير</th>
                  <th className="text-right py-3 px-4">تحصيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((d) => {
                  const dueMeta = getDueMeta(d.due_date);
                  return (
                  <tr key={d.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${dueMeta.tone}`}>
                    <td className="py-2.5 px-4">{d.invoice_number}</td>
                    <td className="py-2.5 px-4">{d.buyer_name || d.buyer_phone || '—'}</td>
                    <td className="py-2.5 px-4">{d.due_date || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        dueMeta.label === 'متأخر'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : dueMeta.label === 'قريب الاستحقاق'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-sky-100 text-blue-800 dark:bg-blue-950/40 dark:text-sky-300'
                      }`}>
                        {dueMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{Number(d.total).toLocaleString('ar-EG')}</td>
                    <td className="py-2.5 px-4 font-semibold">{Number(d.remaining_amount).toLocaleString('ar-EG')}</td>
                    <td className="py-2.5 px-4">
                      {getReminderUrl(d.buyer_phone, d.invoice_number, d.remaining_amount, d.due_date) ? (
                        <a
                          href={getReminderUrl(d.buyer_phone, d.invoice_number, d.remaining_amount, d.due_date)!}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-[var(--bidex-primary)] px-3 py-2 text-xs text-white hover:brightness-110"
                        >
                          واتساب
                        </a>
                      ) : (
                        <span className="text-xs text-muted">لا يوجد رقم</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          className={`${inputClass} w-28`}
                          placeholder="المبلغ"
                          value={paymentDrafts[d.id]?.amount ?? ''}
                          onChange={(e) => setDraft(d.id, { amount: e.target.value })}
                        />
                        <input
                          className={`${inputClass} w-28`}
                          placeholder="الطريقة"
                          value={paymentDrafts[d.id]?.method ?? ''}
                          onChange={(e) => setDraft(d.id, { method: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const amt = Number(paymentDrafts[d.id]?.amount || 0);
                            if (amt <= 0) return;
                            addPayment.mutate({ invoiceId: d.id, amount: amt, method: paymentDrafts[d.id]?.method || undefined });
                          }}
                          disabled={addPayment.isPending || Number(paymentDrafts[d.id]?.amount || 0) <= 0}
                          className="rounded-xl bg-[var(--bidex-primary)] px-3 py-2 text-white hover:brightness-110 disabled:opacity-50"
                        >
                          {addPayment.isPending ? 'جاري…' : 'تحصيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </PageWrapper>
  );
}

