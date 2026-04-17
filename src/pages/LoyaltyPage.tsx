import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { outlineButtonInteractive, toolbarInputClassWithFocus } from '@/lib/theme';

export function LoyaltyPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'available_desc' | 'available_asc' | 'sales_desc'>('available_desc');
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'loyalty-summary'],
    queryFn: () => reportsApi.loyaltySummary().then((r) => r.data),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data
      .filter((c) => {
        if (!q) return true;
        return `${c.buyer_name || ''} ${c.buyer_phone || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'available_asc') return a.available_points - b.available_points;
        if (sortBy === 'sales_desc') return b.total_sales - a.total_sales;
        return b.available_points - a.available_points;
      });
  }, [data, search, sortBy]);

  const exportCsv = () => {
    const headers = ['buyer_name', 'buyer_phone', 'total_sales', 'earned_points', 'redeemed_points', 'available_points'];
    const rows = filtered.map((c) => [
      c.buyer_name || '',
      c.buyer_phone || '',
      String(c.total_sales),
      String(c.earned_points),
      String(c.redeemed_points),
      String(c.available_points),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>نقاط العملاء (Loyalty)</h1>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم العميل أو الهاتف"
          className={`w-full min-w-0 sm:min-w-[240px] ${toolbarInputClassWithFocus}`}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className={toolbarInputClassWithFocus}
        >
          <option value="available_desc">النقاط المتاحة: الأعلى أولاً</option>
          <option value="available_asc">النقاط المتاحة: الأقل أولاً</option>
          <option value="sales_desc">المبيعات: الأعلى أولاً</option>
        </select>
        <button type="button" onClick={exportCsv} className={outlineButtonInteractive}>
          تصدير CSV
        </button>
      </div>
      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="p-6 text-muted">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-muted">لا توجد بيانات نقاط حتى الآن.</div>
        ) : (
          <div className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-right py-3 px-4">العميل</th>
                  <th className="text-right py-3 px-4">المبيعات</th>
                  <th className="text-right py-3 px-4">المكتسبة</th>
                  <th className="text-right py-3 px-4">المستبدلة</th>
                  <th className="text-right py-3 px-4">المتاحة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={`${c.buyer_phone || c.buyer_name}-${idx}`} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2.5 px-4">{c.buyer_name || c.buyer_phone || '—'}</td>
                    <td className="py-2.5 px-4">{Number(c.total_sales).toLocaleString('ar-EG')} جنيه</td>
                    <td className="py-2.5 px-4">{c.earned_points}</td>
                    <td className="py-2.5 px-4">{c.redeemed_points}</td>
                    <td className="py-2.5 px-4 font-semibold">{c.available_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </PageWrapper>
  );
}

