import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { BrandWordmark } from '@/components/BrandWordmark';
import { pageCardInner } from '@/lib/pageCardClasses';
import { formInputGlowInteraction } from '@/lib/theme';

/** خلفية صفحات الدخول/التسجيل (ملف في `public/`) */
const AUTH_HERO_IMAGE = '/background.png';

const AUTH_HERO_LAYER_STYLE = {
  backgroundImage: `url('${AUTH_HERO_IMAGE}')`,
  backgroundSize: 'cover' as const,
  backgroundPosition: 'center center' as const,
  backgroundRepeat: 'no-repeat' as const,
  backgroundColor: 'var(--background)',
};

/** حقول الدخول/التسجيل — متوافقة مع `--input-*` والوضعين */
export const authInputClass =
  `w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 dark:placeholder:text-slate-500 ${formInputGlowInteraction}`;

export function AuthThemeToggleButton() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);
  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="fixed top-4 end-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-card bg-card text-[var(--foreground)] shadow-md transition hover:opacity-90"
      aria-label={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

/** خلفية مشتركة + زر الثيم لصفحات استعادة كلمة المرور وغيرها */
export function AuthDecoratedPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-x-hidden overflow-y-hidden overscroll-none text-[var(--foreground)]">
      <AuthThemeToggleButton />

      {/* مقاسات صغيرة/متوسطة: خلفية لون فقط — بدون صورة */}
      <section className="pointer-events-none absolute inset-0 z-0 bg-[var(--background)] lg:hidden" aria-hidden />
      {/* سطح المكتب: صورة الخلفية + تدرج */}
      <section
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        style={AUTH_HERO_LAYER_STYLE}
        aria-hidden
      />
      <section
        className="pointer-events-none absolute inset-0 z-0 hidden bg-gradient-to-br from-slate-900/35 via-slate-900/15 to-slate-900/30 dark:from-black/50 dark:via-black/30 dark:to-black/45 lg:block"
        aria-hidden
      />

      {/* min-h-0 + overflow-y-auto: ما يطلعش سكرول للصفحة كله لو الفورم طويل */}
      <div
        dir="ltr"
        className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:justify-end lg:pe-36 xl:pe-44 2xl:pe-52"
      >
        {children}
      </div>
    </div>
  );
}

type AuthShellProps = {
  title: string;
  subtitle: string;
  activeTab: 'login' | 'register';
  children: ReactNode;
  footer: ReactNode;
};

function AuthShellCard({ title, subtitle, activeTab, children, footer, cardOffsetClass }: AuthShellProps & { cardOffsetClass: string }) {
  return (
    <div className={`relative z-10 w-full max-w-[440px] shrink-0 ${cardOffsetClass}`}>
      <div className="overflow-hidden rounded-2xl border border-card bg-card shadow-xl">
        <div className="h-px w-full bg-gradient-to-l from-transparent via-[var(--bidex-primary)] to-transparent opacity-90" />

        <div className={`px-6 pt-8 pb-8 sm:px-10 sm:pt-9 sm:pb-10 ${pageCardInner}`}>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-3xl opacity-40 blur-2xl dark:opacity-50"
                style={{ background: 'color-mix(in srgb, var(--bidex-primary) 25%, transparent)' }}
                aria-hidden
              />
              <BrandWordmark variant="auth" />
            </div>
            <div className="text-center space-y-1.5 max-w-[20rem]">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{subtitle}</p>
            </div>
          </div>

          <div className="mb-7 flex rounded-2xl border border-card bg-muted p-1 text-sm font-medium shadow-inner gap-1">
            {activeTab === 'login' ? (
              <span className="btn-primary flex-1 rounded-[0.65rem] py-2.5 text-center shadow-sm">
                تسجيل الدخول
              </span>
            ) : (
              <Link
                to="/login"
                className="flex-1 rounded-[0.65rem] py-2.5 text-center text-muted transition-all duration-200 hover:bg-sky-500/12 hover:text-[var(--bidex-primary)] dark:hover:bg-sky-400/15 dark:hover:text-sky-300"
              >
                تسجيل الدخول
              </Link>
            )}
            {activeTab === 'register' ? (
              <span className="btn-primary flex-1 rounded-[0.65rem] py-2.5 text-center shadow-sm">
                إنشاء حساب جديد
              </span>
            ) : (
              <Link
                to="/register"
                className="flex-1 rounded-[0.65rem] py-2.5 text-center text-muted transition-all duration-200 hover:bg-sky-500/12 hover:text-[var(--bidex-primary)] dark:hover:bg-sky-400/15 dark:hover:text-sky-300"
              >
                إنشاء حساب جديد
              </Link>
            )}
          </div>

          {children}

          <div className="mt-8 border-t border-card pt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">محمي بتشفير الاتصال · مبيعاتي</p>
    </div>
  );
}

/**
 * تسجيل الدخول / التسجيل: سكشن خلفية للمقاسات الصغيرة (بدون صورة) وسكشن للديسكتوب (بالصورة).
 * الفورم يُعرض مرة واحدة في المنتصف على الشاشات الصغيرة.
 */
export function AuthShell(props: AuthShellProps) {
  return (
    <div className="relative flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-x-hidden overflow-y-hidden overscroll-none text-[var(--foreground)]">
      <AuthThemeToggleButton />

      <section className="pointer-events-none absolute inset-0 z-0 bg-[var(--background)] lg:hidden" aria-hidden />
      <section
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        style={AUTH_HERO_LAYER_STYLE}
        aria-hidden
      />
      <section
        className="pointer-events-none absolute inset-0 z-0 hidden bg-gradient-to-br from-slate-900/35 via-slate-900/15 to-slate-900/30 dark:from-black/50 dark:via-black/30 dark:to-black/45 lg:block"
        aria-hidden
      />

      <section
        dir="ltr"
        className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:justify-end lg:pe-36 xl:pe-44 2xl:pe-52"
        aria-label="تسجيل الدخول أو إنشاء حساب"
      >
        <AuthShellCard {...props} cardOffsetClass="lg:ms-24 xl:ms-32 2xl:ms-40" />
      </section>
    </div>
  );
}
