/** إطار البطاقات الموحّد — بدون hover على الإطار كاملًا (مناسب للنماذج؛ التفاعل يكون على الحقول) */
export const pageCardShell =
  'rounded-2xl border border-card bg-card shadow-md overflow-hidden min-w-0';

/** بطاقة إحصائية/لوحة — نفس الإطار مع تفاعل hover على البطاقة (لوحة التحكم وغيرها) */
export const pageCardShellInteractive = `${pageCardShell} dash-card-interactive`;

/** خلفية داخلية بتدرج خفيف متناسق مع الداشبورد وصفحة إضافة البيع */
export const pageCardInner =
  'bg-gradient-to-l from-[color:color-mix(in_srgb,var(--bidex-primary)_8%,white)] via-white to-white dark:from-[color:color-mix(in_srgb,var(--bidex-primary)_18%,#020F1F)] dark:via-[var(--card-bg)] dark:to-[var(--card-bg)]';
