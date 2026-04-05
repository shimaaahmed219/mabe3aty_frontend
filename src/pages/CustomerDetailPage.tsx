import { useLocation, useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import type { Invoice, Customer } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { hoverSurfaceBidex, textAccentBidex } from '@/lib/theme';

interface LocationState {
  customer?: Customer;
}

async function fetchAllInvoicesForCustomer(buyerName: string, buyerPhone: string | undefined) {
  const perPage = 100;
  let page = 1;
  const all: Invoice[] = [];
  let lastPage = 1;
  do {
    const r = await invoicesApi.list({
      buyer_name: buyerName,
      buyer_phone: buyerPhone?.trim() ? buyerPhone : undefined,
      per_page: perPage,
      page,
    });
    const body = r.data;
    all.push(...body.data);
    lastPage = body.last_page;
    page += 1;
  } while (page <= lastPage);
  return all;
}

export function CustomerDetailPage() {
  const { buyerName: buyerNameParam } = useParams<{ buyerName: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state as LocationState) || {};
  const customer = state.customer;

  const buyerName = customer?.buyer_name ?? decodeURIComponent(buyerNameParam || '');
  const phoneFromUrl = searchParams.get('phone');
  const buyerPhone =
    customer?.buyer_phone ?? (phoneFromUrl != null && phoneFromUrl !== '' ? phoneFromUrl : undefined);
  const buyerAddress = customer?.buyer_address;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['customer-invoices', buyerName, buyerPhone ?? ''],
    queryFn: () => fetchAllInvoicesForCustomer(buyerName, buyerPhone),
    enabled: !!buyerName,
  });

  const total = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <PageWrapper>
      <div className="mb-4">
        <Link
          to="/customers"
          className={`mb-2 inline-flex items-center gap-1 text-sm ${textAccentBidex} hover:underline`}
        >
          ← العودة لقائمة العملاء
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {buyerName || 'عميل'}
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
          {buyerPhone && <p>الهاتف: {buyerPhone}</p>}
          {buyerAddress && <p>العنوان: {buyerAddress}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            تُعرض كل الفواتير لنفس الاسم مع نفس رقم الهاتف (بعد توحيد الأرقام)، بغض النظر عن اختلاف العنوان في السجلات.
          </p>
        </div>
      </div>

      <div className={`${pageCardShell} mb-4`}>
        <div className={`p-4 flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300 ${pageCardInner}`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المشتريات</p>
            <p className={`text-lg font-semibold ${textAccentBidex}`}>
              {total.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">عدد الفواتير</p>
            <p className="text-lg font-semibold">{invoices.length}</p>
          </div>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">جاري تحميل فواتير العميل...</div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">لا توجد فواتير لهذا العميل.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-card bg-muted">
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">البائع</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">البنود</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الإجمالي</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-card/60 hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_6%,white)] dark:hover:bg-[color:color-mix(in_srgb,var(--muted-bg)_40%,var(--card-bg))]"
                  >
                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{inv.sale_date}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{inv.seller?.name ?? '—'}</td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {inv.items?.map((i) => `${i.description} (${i.quantity} × ${i.unit_price})`).join(' — ') ?? '-'}
                    </td>
                    <td className="py-2.5 px-4 text-left font-medium text-slate-900 dark:text-slate-100">
                      {Number(inv.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-left">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${textAccentBidex} ${hoverSurfaceBidex}`}
                      >
                        عرض الفاتورة
                      </Link>
                    </td>
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
