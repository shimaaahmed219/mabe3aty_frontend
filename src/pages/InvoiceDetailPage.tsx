import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage, invoicesApi } from '@/lib/api';
import { appToast } from '@/lib/appToast';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { btnPrimarySolid, controlInputHover, textAccentBidex } from '@/lib/theme';
import { useState } from 'react';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });
  const addPayment = useMutation({
    mutationFn: () => invoicesApi.addPayment(Number(id), { amount: Number(payAmount), method: payMethod || undefined }),
    onSuccess: () => {
      setPayAmount('');
      setPayMethod('');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      appToast.success('تم تسجيل الدفعة', 'تم تحديث حالة الفاتورة.');
    },
    onError: (err: unknown) => {
      appToast.error('فشل تسجيل الدفعة', getApiErrorMessage(err, 'تعذّر إرسال المبلغ.'));
    },
  });

  if (!id || isLoading || !invoice) {
    return (
      <PageWrapper>
        <div className="p-4 text-slate-500 dark:text-slate-400">{isLoading ? 'جاري التحميل...' : 'الفاتورة غير موجودة.'}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Link to="/invoices" className={`mb-4 inline-flex items-center gap-2 font-medium hover:underline ${textAccentBidex}`}>
        <ArrowRight className="w-4 h-4" /> العودة للفواتير
      </Link>
      <div className={pageCardShell}>
        <div className={`p-5 sm:p-6 ${pageCardInner}`}>
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{invoice.invoice_number}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                التاريخ: {invoice.sale_date}
                {invoice.due_date && ` • الاستحقاق: ${invoice.due_date}`}
                {invoice.seller && ` • البائع: ${invoice.seller.name}`}
              </p>
              {(invoice.buyer_name || invoice.buyer_phone || invoice.buyer_address) && (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 space-y-0.5">
                  {invoice.buyer_name && <p>المشتري: {invoice.buyer_name}</p>}
                  {invoice.buyer_phone && <p>الهاتف: {invoice.buyer_phone}</p>}
                  {invoice.buyer_address && <p>العنوان: {invoice.buyer_address}</p>}
                </div>
              )}
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">الإجمالي: {Number(invoice.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</p>
          </div>
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300">حالة الدفع: {invoice.payment_status || 'pending'}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              المدفوع: {Number((invoice.payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0)).toLocaleString('ar-EG')} جنيه
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              المتبقي: {Number(Math.max(Number(invoice.total) - (invoice.payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0), 0)).toLocaleString('ar-EG')} جنيه
            </p>
            {invoice.payment_status !== 'paid' && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="قيمة الدفعة"
                  className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 ${controlInputHover}`}
                />
                <input
                  type="text"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  placeholder="طريقة الدفع"
                  className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 ${controlInputHover}`}
                />
                <button
                  type="button"
                  onClick={() => addPayment.mutate()}
                  disabled={addPayment.isPending || Number(payAmount) <= 0}
                  className={`rounded-xl px-3 py-2 text-sm disabled:opacity-60 ${btnPrimarySolid}`}
                >
                  {addPayment.isPending ? 'جاري...' : 'تسجيل دفعة'}
                </button>
              </div>
            )}
          </div>
          {invoice.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">ملاحظات: {invoice.notes}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الوصف</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الكمية</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">سعر الوحدة</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">{item.description}</td>
                    <td className="py-2.5 px-4 text-left text-slate-700 dark:text-slate-300">{item.quantity}</td>
                    <td className="py-2.5 px-4 text-left text-slate-700 dark:text-slate-300">
                      {Number(item.unit_price).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه
                    </td>
                    <td className="py-2.5 px-4 text-left font-medium text-slate-900 dark:text-slate-100">{Number(item.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
