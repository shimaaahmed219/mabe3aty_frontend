import type { AppNotification } from '@/lib/api';

const DEFAULT_NOTIFICATION_PATH = '/notifications';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeCreditFilter(value: string | null): 'all' | 'overdue' | 'due_soon' | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (['all', 'الكل', 'كل', 'settled', 'paid', 'payment', 'سداد'].includes(v)) return 'all';
  if (['overdue', 'late', 'past_due', 'متاخر', 'متأخر'].includes(v)) return 'overdue';
  if (['due_soon', 'soon', 'upcoming', 'قريب', 'قريب_الاستحقاق', 'قريب الاستحقاق'].includes(v)) return 'due_soon';
  return null;
}

function withQuery(path: string, params: Record<string, string | null>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  const query = q.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveNotificationTarget(notification: AppNotification): string {
  const payload = asRecord(notification.data);
  if (!payload) return DEFAULT_NOTIFICATION_PATH;

  const directPath = toString(payload.path) ?? toString(payload.route) ?? toString(payload.url);
  if (directPath?.startsWith('/')) return directPath;

  const invoiceId =
    toNumber(payload.invoice_id) ??
    toNumber(payload.invoiceId) ??
    toNumber(payload.id);
  const invoiceNumber =
    toString(payload.invoice_number) ??
    toString(payload.invoiceNumber);
  const paymentStatus =
    toString(payload.payment_status) ??
    toString(payload.paymentStatus) ??
    toString(payload.status);
  if (invoiceId != null) {
    return withQuery(`/invoices/${invoiceId}`, {
      from_notification: '1',
      payment_status: paymentStatus,
    });
  }
  if (invoiceNumber) {
    return withQuery('/invoices', {
      q: invoiceNumber,
      payment_status: paymentStatus,
      from_notification: '1',
    });
  }

  const conversationId = toNumber(payload.conversation_id) ?? toNumber(payload.conversationId);
  if (conversationId != null) return `/conversations/${conversationId}`;

  const productId = toNumber(payload.product_id) ?? toNumber(payload.productId);
  if (productId != null) return `/products/${productId}`;

  const buyerName =
    toString(payload.buyer_name) ??
    toString(payload.buyerName) ??
    toString(payload.customer_name) ??
    toString(payload.customerName);
  if (buyerName) return `/customers/${encodeURIComponent(buyerName)}`;

  const type = String(notification.type || '').toLowerCase();
  if (type.includes('overdue') || type.includes('due') || type.includes('debt') || type.includes('credit')) {
    const inferredFilter =
      normalizeCreditFilter(
        toString(payload.filter) ??
          toString(payload.tab) ??
          toString(payload.status) ??
          toString(payload.payment_status) ??
          toString(payload.due_status),
      ) ??
      (type.includes('overdue') ? 'overdue' : null) ??
      (type.includes('due_soon') || type.includes('upcoming') ? 'due_soon' : null);
    const invoiceSearch = invoiceNumber;
    return withQuery('/credit-dues', {
      filter: inferredFilter,
      q: invoiceSearch,
      invoice_id: invoiceId != null ? String(invoiceId) : null,
    });
  }
  if (type.includes('loyalty') || type.includes('points')) return '/loyalty';
  if (type.includes('conversation') || type.includes('message') || type.includes('whatsapp')) return '/conversations';
  if (type.includes('near_expiry') || type.includes('expiry')) return '/products/near-expiry';
  if (type.includes('product') || type.includes('stock')) return '/products';
  if (type.includes('customer')) return '/customers';
  if (type.includes('report')) return '/reports';

  return DEFAULT_NOTIFICATION_PATH;
}
