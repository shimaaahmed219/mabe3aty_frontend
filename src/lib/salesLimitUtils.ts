import { invoicesApi, type Invoice, type SalesLimit, type SalesLimitWriteInput } from '@/lib/api';

export const periodLabels: Record<SalesLimitWriteInput['period_type'], string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPeriodEndDate(start: string, periodType: SalesLimitWriteInput['period_type']): string {
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return start;
  if (periodType === 'daily') return start;
  if (periodType === 'weekly') {
    d.setDate(d.getDate() + 6);
    return toIsoDate(d);
  }
  if (periodType === 'monthly') {
    const y = d.getFullYear();
    const m = d.getMonth();
    return toIsoDate(new Date(y, m + 1, 0));
  }
  return toIsoDate(new Date(d.getFullYear(), 11, 31));
}

export async function loadInvoicesTotal(from: string, to: string): Promise<number> {
  let page = 1;
  let lastPage = 1;
  let total = 0;
  do {
    const res = await invoicesApi.list({ from, to, page, per_page: 100 });
    const payload = res.data;
    total += (payload.data || []).reduce((sum: number, inv: Invoice) => sum + Number(inv.total || 0), 0);
    lastPage = payload.last_page || 1;
    page += 1;
  } while (page <= lastPage);
  return total;
}

export function normalizeLimits(payload: SalesLimit[] | { data?: SalesLimit[] } | undefined): SalesLimit[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}
