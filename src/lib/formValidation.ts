/** يتحقق من قيود HTML5 ويعرض رسالة المتصفح لأول حقل غير صالح. يُرجع true إذا كان النموذج صالحاً. */
export function reportFormValidity(form: HTMLFormElement): boolean {
  if (form.reportValidity()) return true;
  focusFirstNativeInvalidControl(form);
  return false;
}

/** يمرِّر ويركِّز أول حقل غير صالح حسب قيود HTML5 (ترتيب الظهور في DOM). */
export function focusFirstNativeInvalidControl(form: HTMLFormElement): void {
  const controls = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
  );
  for (const el of controls) {
    if (!el.willValidate) continue;
    if (typeof el.checkValidity === 'function' && !el.checkValidity()) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus({ preventScroll: true });
      return;
    }
  }
}

const LINE_FIELD_ORDER = ['product', 'saleType', 'qty', 'price', 'discount', 'desc'] as const;

function compareAddSaleLineKeys(a: string, b: string): number {
  const ma = /^line-(\d+)-(.+)$/.exec(a);
  const mb = /^line-(\d+)-(.+)$/.exec(b);
  if (!ma || !mb) return 0;
  const ia = Number(ma[1]);
  const ib = Number(mb[1]);
  if (ia !== ib) return ia - ib;
  const fa = LINE_FIELD_ORDER.indexOf(ma[2] as (typeof LINE_FIELD_ORDER)[number]);
  const fb = LINE_FIELD_ORDER.indexOf(mb[2] as (typeof LINE_FIELD_ORDER)[number]);
  return (fa === -1 ? 99 : fa) - (fb === -1 ? 99 : fb);
}

/** ترتيب مفاتيح أخطاء «إضافة بيع» لمطابقة ترتيب الحقول في الصفحة (من الأعلى للأسفل). */
export function sortAddSaleValidationKeys(keys: string[]): string[] {
  const lineKeys = keys.filter((k) => k.startsWith('line-')).sort(compareAddSaleLineKeys);
  const buyerOrder = ['buyerName', 'buyerPhone', 'buyerAddress'] as const;
  const buyerKeys = keys.filter((k) => k.startsWith('buyer'));
  buyerKeys.sort((a, b) => buyerOrder.indexOf(a as (typeof buyerOrder)[number]) - buyerOrder.indexOf(b as (typeof buyerOrder)[number]));
  const restOrder = [
    'invoiceDiscount',
    'redeemedPoints',
    'saleDate',
    'paymentStatus',
    'paymentMode',
    'paymentMethodDetail',
    'dueDate',
    'paidAmount',
  ] as const;
  const rest = keys.filter((k) => !k.startsWith('line-') && !k.startsWith('buyer'));
  rest.sort(
    (a, b) =>
      (restOrder.indexOf(a as (typeof restOrder)[number]) === -1 ? 999 : restOrder.indexOf(a as (typeof restOrder)[number])) -
      (restOrder.indexOf(b as (typeof restOrder)[number]) === -1 ? 999 : restOrder.indexOf(b as (typeof restOrder)[number])),
  );
  return [...buyerKeys, ...lineKeys, ...rest];
}

function escapeAttrValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * يمرِّر ويركِّز أول حقل يحمل `data-validation-field` ضِمن المفاتيح المعطاة.
 * يُستدعى بعد رسم React (مثلاً requestAnimationFrame مزدوج).
 */
export function focusFirstFieldByValidationKeys(
  form: HTMLFormElement,
  keys: string[],
  sortKeys?: (k: string[]) => string[],
): boolean {
  const ordered = sortKeys ? sortKeys(keys) : [...keys].sort();
  for (const key of ordered) {
    const el = form.querySelector<HTMLElement>(`[data-validation-field="${escapeAttrValue(key)}"]`);
    if (!el) continue;
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}
