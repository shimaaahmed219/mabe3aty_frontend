import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, type CreateInvoiceInput } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { btnPrimarySolid, focusRingBidex } from '@/lib/theme';

type Row = { description: string; quantity: number; unit_price: number };

const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${focusRingBidex}`;

export function NewInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [rows, setRows] = useState<Row[]>([{ description: '', quantity: 1, unit_price: 0 }]);

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/invoices');
    },
  });

  const addRow = () => setRows((r) => [...r, { description: '', quantity: 1, unit_price: 0 }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const updateRow = (i: number, field: keyof Row, value: string | number) => {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const total = rows.reduce((s, r) => s + r.quantity * r.unit_price, 0);
  const items = rows
    .filter((r) => r.description.trim() && r.quantity > 0 && r.unit_price >= 0)
    .map((r) => ({ description: r.description, quantity: r.quantity, unit_price: r.unit_price }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    createMutation.mutate({
      sale_date: saleDate,
      notes: notes || undefined,
      buyer_name: buyerName || undefined,
      buyer_phone: buyerPhone || undefined,
      buyer_address: buyerAddress || undefined,
      seller_id: user?.role === 'admin' && sellerId ? Number(sellerId) : undefined,
      items,
    });
  };

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">فاتورة جديدة</h1>
      <div className={pageCardShell}>
        <div className={`p-5 sm:p-6 ${pageCardInner}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[180px]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ البيع</label>
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className={inputClass} />
              </div>
              {user?.role === 'admin' && (
                <div className="min-w-[140px]">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">معرف البائع (اختياري)</label>
                  <input type="number" value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={inputClass} />
                </div>
              )}
              <div className="flex-1 min-w-[200px] space-y-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المشتري</label>
                  <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
                  <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عنوان المشتري</label>
                  <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className={inputClass} placeholder="اختياري" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">البنود</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-right py-2 px-2 font-semibold text-slate-700 dark:text-slate-300">الوصف</th>
                    <th className="text-right py-2 px-2 font-semibold text-slate-700 dark:text-slate-300 w-24">الكمية</th>
                    <th className="text-right py-2 px-2 font-semibold text-slate-700 dark:text-slate-300 w-28">سعر الوحدة</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                      <td className="py-1.5 px-2"><input type="text" value={r.description} onChange={(e) => updateRow(i, 'description', e.target.value)} placeholder="وصف البند" className={inputClass} /></td>
                      <td className="py-1.5 px-2"><input type="number" min={0.01} step={0.01} value={r.quantity} onChange={(e) => updateRow(i, 'quantity', Number(e.target.value) || 0)} className={inputClass} /></td>
                      <td className="py-1.5 px-2"><input type="number" min={0} step={0.01} value={r.unit_price} onChange={(e) => updateRow(i, 'unit_price', Number(e.target.value) || 0)} className={inputClass} /></td>
                      <td className="py-1.5 px-2">
                        <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= 1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addRow} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
              <Plus className="w-4 h-4" /> إضافة بند
            </button>
            <p className="font-medium text-slate-900 dark:text-slate-100">الإجمالي: {total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه</p>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={items.length === 0 || createMutation.isPending} className={`rounded-xl px-4 py-2.5 ${btnPrimarySolid}`}>
                {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
              </button>
              <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
