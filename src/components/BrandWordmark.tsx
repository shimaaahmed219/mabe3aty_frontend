/** شعار نصي موحّد (نفس أسلوب صفحات الدخول والتسجيل) */
type BrandWordmarkProps = {
  variant?: 'auth' | 'sidebar' | 'header';
  className?: string;
};

const wrapClass: Record<NonNullable<BrandWordmarkProps['variant']>, string> = {
  auth: 'flex flex-col items-center justify-center gap-2 rounded-2xl border border-card bg-muted px-5 py-3 shadow-sm sm:px-6',
  sidebar: 'flex shrink-0 items-center justify-center',
  header: 'flex flex-row items-center gap-2 shrink-0',
};

const textClass: Record<NonNullable<BrandWordmarkProps['variant']>, string> = {
  auth: 'text-center text-[0.7rem] sm:text-[0.78rem] font-semibold tracking-[0.22em] leading-tight',
  sidebar: 'text-center text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] leading-tight',
  header:
    'whitespace-nowrap text-[0.58rem] sm:text-[0.64rem] font-semibold tracking-[0.2em] sm:text-[0.65rem] leading-none',
};

const logoImgClass: Record<NonNullable<BrandWordmarkProps['variant']>, string> = {
  auth: 'h-11 w-11 shrink-0 rounded-full object-cover sm:h-14 sm:w-14',
  sidebar: 'h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10',
  header: 'h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9',
};

export function BrandWordmark({ variant = 'auth', className = '' }: BrandWordmarkProps) {
  const showLabel = variant !== 'sidebar';
  return (
    <div className={`${wrapClass[variant]} ${className}`.trim()}>
      <img
        src="/logo2.png"
        alt={showLabel ? '' : 'مبيعاتي'}
        className={logoImgClass[variant]}
        width={56}
        height={56}
        decoding="async"
      />
      {showLabel ? (
        <span className={`${textClass[variant]} text-[var(--bidex-primary)] dark:text-sky-300`}>
          MABI3ATY
        </span>
      ) : null}
    </div>
  );
}
