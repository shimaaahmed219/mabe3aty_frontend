/** بادئة `id` لحقول نموذج إضافة البيع (للتمرير عند وجود أخطاء) */
export const ADD_SALE_FIELD_ID_PREFIX = 'add-sale-field-';

const LINE_SUBFIELD_ORDER = ['product', 'saleType', 'qty', 'price', 'discount', 'desc'] as const;

function rankAddSaleFieldKey(key: string): number {
  const top: Record<string, number> = { buyerName: 0, buyerPhone: 1, buyerAddress: 2 };
  if (key in top) return top[key];

  const lineMatch = key.match(/^line-(\d+)-(product|saleType|qty|price|discount|desc)$/);
  if (lineMatch) {
    const line = Number(lineMatch[1]);
    const sub = LINE_SUBFIELD_ORDER.indexOf(lineMatch[2] as (typeof LINE_SUBFIELD_ORDER)[number]);
    return 100 + line * 20 + (sub === -1 ? 15 : sub);
  }

  const tail: Record<string, number> = {
    invoiceDiscount: 8000,
    redeemedPoints: 8001,
    saleDate: 8100,
    paymentStatus: 8200,
    paymentMode: 8201,
    paymentMethodDetail: 8202,
    dueDate: 8300,
    paidAmount: 8301,
  };
  if (key in tail) return tail[key];
  return 99_999;
}

/** ترتيب مفاتيح أخطاء إضافة البيع كما يظهر النموذج في الصفحة */
export function compareAddSaleErrorFieldKeys(a: string, b: string): number {
  return rankAddSaleFieldKey(a) - rankAddSaleFieldKey(b);
}

/**
 * يمرّر ويركّز أول حقل له `id` يطابق `idPrefix + key` حسب ترتيب المفاتيح بعد الفرز.
 */
export function focusFirstFormErrorField(
  errorKeys: string[],
  idPrefix: string,
  compareKeys: (a: string, b: string) => number,
): void {
  const keys = [...new Set(errorKeys)].filter(Boolean);
  if (keys.length === 0) return;
  const sorted = keys.sort(compareKeys);
  const base = idPrefix.endsWith('-') ? idPrefix : `${idPrefix}-`;
  for (const key of sorted) {
    const el = document.getElementById(`${base}${key}`);
    if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement) && !(el instanceof HTMLTextAreaElement)) {
      continue;
    }
    if (el.disabled) continue;
    if (el instanceof HTMLInputElement && el.readOnly) continue;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    el.focus({ preventScroll: true });
    return;
  }
}

function goToFirstInvalidControl(form: HTMLFormElement): void {
  for (let i = 0; i < form.elements.length; i++) {
    const el = form.elements[i];
    if (el instanceof HTMLFieldSetElement) continue;
    if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement) && !(el instanceof HTMLTextAreaElement)) {
      continue;
    }
    if (el.type === 'hidden' || el.disabled) continue;
    if (el instanceof HTMLInputElement && el.readOnly) continue;
    if (!el.willValidate) continue;
    if (!el.checkValidity()) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      el.focus({ preventScroll: true });
      void el.reportValidity();
      return;
    }
  }
}

/**
 * يتحقق من قيود HTML5. إن كان النموذج غير صالح يمرّر ويركّز أول حقل غير صالح ويعرض رسالة المتصفح.
 * يُرجع true إذا كان النموذج صالحاً.
 */
export function reportFormValidity(form: HTMLFormElement): boolean {
  if (form.checkValidity()) {
    return true;
  }
  goToFirstInvalidControl(form);
  return false;
}
