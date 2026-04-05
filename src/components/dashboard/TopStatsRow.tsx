import { pageCardInner } from '@/lib/pageCardClasses';
import { StarIcon, ActivityIcon, TrophyIcon, WalletIcon } from './DashboardIcons';

interface KpiItem {
  label: string;
  value: string;
  sub?: string;
}

export interface TopStatsRowProps {
  averageInvoiceText: string;
  totalInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  adminKpis?: KpiItem[];
}

export function TopStatsRow({
  averageInvoiceText,
  totalInvoices,
  paidInvoices,
  totalRevenue,
  adminKpis,
}: TopStatsRowProps) {
  const iconWrapClasses = [
    'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0',
    'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0',
    'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] flex items-center justify-center text-bidex-primary flex-shrink-0',
    'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_12%,transparent)] flex items-center justify-center text-[var(--bidex-primary)] flex-shrink-0',
  ] as const;
  const icons = [
    <StarIcon className="w-5 h-5" key="star" />,
    <ActivityIcon className="w-5 h-5" key="activity" />,
    <TrophyIcon className="w-5 h-5" key="trophy" />,
    <WalletIcon className="w-5 h-5" key="wallet" />,
  ] as const;

  if (adminKpis && adminKpis.length > 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
        {adminKpis.slice(0, 4).map((kpi, i) => (
          <div key={kpi.label} className={`${pageCardInner} p-3 sm:p-5 flex items-start gap-2 sm:gap-3 rounded-xl shadow-md border border-card min-w-0`}>
            <div className={iconWrapClasses[i % iconWrapClasses.length]}>
              {icons[i % icons.length]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs text-muted mb-1 leading-tight">{kpi.label}</p>
              <p
                className="text-base sm:text-xl font-bold leading-tight break-all sm:break-normal"
                style={{ color: 'var(--foreground)' }}
                dir="ltr"
              >
                {kpi.value}
              </p>
              {kpi.sub ? <p className="text-[10px] sm:text-[11px] text-muted truncate">{kpi.sub}</p> : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
      <div className={`${pageCardInner} p-3 sm:p-5 flex items-start gap-2 sm:gap-3 rounded-xl shadow-md border border-card min-w-0`}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
          <StarIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs text-muted mb-1">متوسط الفاتورة</p>
          <p className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--foreground)' }}>
            {averageInvoiceText}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted">متوسط قيمة البيع</p>
        </div>
      </div>

      <div className={`${pageCardInner} p-3 sm:p-5 flex items-start gap-2 sm:gap-3 rounded-xl shadow-md border border-card min-w-0`}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs text-muted mb-1">عدد الفواتير</p>
          <p className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--foreground)' }}>
            {totalInvoices.toLocaleString('ar-EG')}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted truncate">كل الفواتير المسجلة</p>
        </div>
      </div>

      <div className={`${pageCardInner} p-3 sm:p-5 flex items-start gap-2 sm:gap-3 rounded-xl shadow-md border border-card min-w-0`}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] flex items-center justify-center text-bidex-primary flex-shrink-0">
          <TrophyIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs text-muted mb-1">فواتير مدفوعة</p>
          <p className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--foreground)' }}>
            {paidInvoices.toLocaleString('ar-EG')}
          </p>
          <p className="text-[10px] sm:text-[11px] truncate text-[var(--bidex-primary)] dark:text-sky-400">بحسب حالة الدفع من الباك</p>
        </div>
      </div>

      <div className={`${pageCardInner} p-3 sm:p-5 flex items-start gap-2 sm:gap-3 rounded-xl shadow-md border border-card min-w-0`}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--bidex-primary)_12%,transparent)] text-[var(--bidex-primary)] sm:h-10 sm:w-10 sm:rounded-xl">
          <WalletIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs text-muted mb-1">إجمالي المبيعات</p>
          <p className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--foreground)' }}>
            {totalRevenue.toLocaleString('ar-EG')} جنيه
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted truncate">مجموع الفواتير</p>
        </div>
      </div>
    </div>
  );
}
