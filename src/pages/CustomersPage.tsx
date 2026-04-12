import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';

export function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list().then((r) => r.data),
  });

  const customers = data ?? [];

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        العملاء
      </h1>
      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
            لا يوجد عملاء بعد. قم بإضافة عمليات بيع ليظهر العملاء هنا.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-card bg-muted">
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">اسم العميل</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">رقم الهاتف</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">العنوان</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">إجمالي المشتريات</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">عدد الفواتير</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">آخر عملية</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={`${c.buyer_name}\0${c.buyer_phone ?? ''}`} className="border-b border-card/60">
                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">
                      <Link
                        to={{
                          pathname: `/customers/${encodeURIComponent(c.buyer_name)}`,
                          search:
                            c.buyer_phone != null && String(c.buyer_phone).trim() !== ''
                              ? `?phone=${encodeURIComponent(String(c.buyer_phone))}`
                              : '',
                        }}
                        state={{ customer: c }}
                        className="text-[var(--bidex-primary)] hover:underline dark:text-sky-400"
                      >
                        {c.buyer_name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{c.buyer_phone || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{c.buyer_address || '—'}</td>
                    <td className="py-2.5 px-4 text-left font-medium text-slate-900 dark:text-slate-100">
                      {Number(c.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{c.invoices_count}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{c.last_sale_date}</td>
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

