import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { customersApi, type Customer } from '@/lib/api';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { btnPrimarySolid, interactiveListRow, textAccentBidex, toolbarInputClassWithFocus } from '@/lib/theme';

function whatsappUrlForCustomer(c: Customer): string | null {
  const normalizedPhone = (c.buyer_phone || '').replace(/[^\d]/g, '');
  if (!normalizedPhone) return null;
  const text = encodeURIComponent(
    `السلام عليكم ${c.buyer_name}، نتواصل معكم من متجرنا (مبيعاتي). كيف نقدم لك خدمة أفضل؟`
  );
  return `https://wa.me/${normalizedPhone}?text=${text}`;
}

export function ConversationsPage() {
  const [q, setQ] = useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list().then((r) => r.data),
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...data];
    if (needle) {
      list = list.filter((c) => {
        const name = (c.buyer_name || '').toLowerCase();
        const phone = (c.buyer_phone || '').toLowerCase();
        const addr = (c.buyer_address || '').toLowerCase();
        return name.includes(needle) || phone.includes(needle) || addr.includes(needle);
      });
    }
    list.sort((a, b) => {
      const ta = new Date(a.last_sale_date).getTime();
      const tb = new Date(b.last_sale_date).getTime();
      const va = Number.isNaN(ta) ? 0 : ta;
      const vb = Number.isNaN(tb) ? 0 : tb;
      return vb - va;
    });
    return list;
  }, [data, q]);

  const withPhone = rows.filter((c) => !!whatsappUrlForCustomer(c)).length;

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
        المحادثات عبر واتساب
      </h1>
      <p className="text-sm text-muted mb-4">
        اضغط لفتح تطبيق أو ويب واتساب مع العميل مباشرة من رقم الهاتف المسجل في الفواتير.
      </p>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف أو العنوان..."
          className={`min-w-[200px] flex-1 py-2 ${toolbarInputClassWithFocus}`}
        />
        <span className="text-xs text-muted whitespace-nowrap">
          {withPhone} عميل برقم واتساب من {rows.length} المعروضين
        </span>
      </div>
      <div className={pageCardShell}>
        <div className={pageCardInner}>
        {isLoading ? (
          <div className="p-6 text-muted">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-muted">
            {data.length === 0
              ? 'لا يوجد عملاء بعد. سجّل مشتريات (فواتير) ليظهر العملاء هنا.'
              : 'لا نتائج للبحث. جرّب كلمات أخرى أو امسح البحث.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {rows.map((c) => {
              const wa = whatsappUrlForCustomer(c);
              const key = `${c.buyer_name}-${c.buyer_phone ?? ''}-${c.buyer_address ?? ''}`;
              return (
                <div key={key} className={interactiveListRow}>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/customers/${encodeURIComponent(c.buyer_name)}`}
                      state={{ customer: c }}
                      className={`block truncate font-semibold hover:underline ${textAccentBidex}`}
                    >
                      {c.buyer_name}
                    </Link>
                    <p className="text-sm text-muted truncate">{c.buyer_phone || '— بدون رقم هاتف —'}</p>
                    <p className="text-xs text-muted mt-0.5">
                      آخر عملية: {c.last_sale_date} · {Number(c.total).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} جنيه
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${btnPrimarySolid}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        فتح واتساب
                      </a>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-muted">
                        أضف رقمًا في الفواتير
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </PageWrapper>
  );
}
