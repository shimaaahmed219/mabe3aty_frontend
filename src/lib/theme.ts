/**
 * ألوان الواجهة الموحّدة مع --bidex-primary في index.css (#093F85 / داكن #0A4A9E).
 */
export const focusRingBidex =
  'focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--bidex-primary)_32%,transparent)] focus:border-[var(--bidex-primary)]';

export const btnPrimarySolid =
  'bg-[var(--bidex-primary)] text-white font-semibold shadow-sm transition-all duration-300 ease-out hover:brightness-110 hover:saturate-125 hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-[0.97] motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none';

export const textAccentBidex = 'text-[var(--bidex-primary)] dark:text-sky-400';

export const hoverSurfaceBidex =
  'transition-all duration-200 ease-out hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,white)] hover:text-[var(--bidex-primary)] hover:shadow-sm hover:shadow-cyan-500/10 hover:-translate-y-px motion-reduce:hover:translate-y-0 dark:hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_22%,#020F1F)] dark:hover:text-sky-300 dark:hover:shadow-cyan-500/15';

/**
 * إبراز الحقل عند hover أو focus-visible: حد سماوي + توهج (مثل بطاقات الداشبورد).
 * يُفضّل استخدامه بدل حلقة bidex على حقول النماذج لتفادي تضارب المظهر.
 */
export const formInputGlowInteraction =
  'outline-none transition-[border-color,box-shadow] duration-200 hover:border-cyan-500 hover:shadow-[0_0_0_3px_rgba(34,211,238,0.45),0_14px_40px_rgba(6,182,212,0.22)] focus-visible:border-cyan-500 focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.45),0_14px_40px_rgba(6,182,212,0.22)] dark:hover:border-cyan-300 dark:hover:shadow-[0_0_0_3px_rgba(34,211,238,0.38),0_14px_40px_rgba(34,211,238,0.14)] dark:focus-visible:border-cyan-300 dark:focus-visible:shadow-[0_0_0_3px_rgba(34,211,238,0.38),0_14px_40px_rgba(34,211,238,0.14)] motion-reduce:hover:shadow-none motion-reduce:focus-visible:shadow-none';

/** اسم قديم — نفس `formInputGlowInteraction` */
export const controlInputHover = formInputGlowInteraction;

/** حقول البحث والفلتر في شريط أدوات الصفحة */
export const toolbarInputClass =
  `rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 ${formInputGlowInteraction}`;

export const toolbarInputClassWithFocus = toolbarInputClass;

/** صف في قائمة مقسومة (محادثات، عناصر طويلة) */
export const interactiveListRow =
  'p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200 hover:bg-[color:color-mix(in_srgb,#06b6d4_11%,var(--muted-bg))] hover:shadow-[inset_4px_0_0_0_#0891b2,0_2px_12px_rgba(6,182,212,0.08)] motion-reduce:hover:shadow-[inset_4px_0_0_0_#0891b2] dark:hover:bg-[color:color-mix(in_srgb,var(--bidex-primary)_20%,var(--card-bg))] dark:hover:shadow-[inset_4px_0_0_0_#22d3ee]';

/** بطاقة فرعية داخل الصفحة (إشعار، بلاطة) */
export const interactiveSubCard =
  'rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-cyan-400/45 hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0';

/** زر بإطار: تصدير، إلغاء، إجراء ثانوي */
export const outlineButtonInteractive =
  'inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-sky-400/60 hover:bg-[color:color-mix(in_srgb,#06b6d4_8%,white)] hover:shadow-md hover:-translate-y-px active:translate-y-0 motion-reduce:hover:translate-y-0 dark:border-slate-600 dark:bg-[var(--input-bg)] dark:text-slate-200 dark:hover:border-sky-400/45 dark:hover:bg-slate-800/90';

/** شريحة فلتر غير النشطة — تلميح لوني عند المرور */
export const filterChipInactive =
  'border-slate-300 bg-white text-slate-800 transition-all duration-200 hover:border-sky-400/55 hover:bg-[color:color-mix(in_srgb,#06b6d4_6%,white)] hover:shadow-sm dark:border-slate-600 dark:bg-[var(--input-bg)] dark:text-slate-100 dark:hover:border-sky-400/40 dark:hover:bg-slate-800/80';

/** خلفية أيقونة/بطاقة خفيفة */
export const iconSurfaceBidex =
  'bg-[color:color-mix(in_srgb,var(--bidex-primary)_14%,transparent)] text-[var(--bidex-primary)]';
