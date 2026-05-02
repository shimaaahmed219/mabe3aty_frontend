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
  /** cover + توسيط: تملأ الشاشة والقصّ يتوزّع بين فوق وتحت بدل ما يثبت لطرف واحد */
  const heroLayerStyle = {
    backgroundImage: `url('${AUTH_HERO_IMAGE}')`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center center' as const,
    backgroundRepeat: 'no-repeat' as const,
    backgroundColor: 'var(--background)',
  };

  return (
    <div className="relative flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-x-hidden overflow-y-hidden overscroll-none text-[var(--foreground)]">
      <AuthThemeToggleButton />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--background)]" aria-hidden />
      {/* الصورة تظهر من md فما فوق — على الشاشات الصغيرة خلفية لون + تدرّج فقط */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden md:block" style={heroLayerStyle} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-slate-900/18 via-slate-900/6 to-slate-900/14 dark:from-black/28 dark:via-black/14 dark:to-black/22 md:from-slate-900/35 md:via-slate-900/15 md:to-slate-900/30 md:dark:from-black/50 md:dark:via-black/30 md:dark:to-black/45"
        aria-hidden
      />

      {/* min-h-0 + overflow-y-auto: ما يطلعش سكرول للصفحة كله لو الفورم طويل */}
      <div
        dir="ltr"
        className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:justify-end md:pe-28 lg:pe-36 xl:pe-44 2xl:pe-52"
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

export function AuthShell({ title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <AuthDecoratedPage>
      <div className="relative z-10 w-full max-w-[440px] shrink-0 md:ms-16 lg:ms-24 xl:ms-32 2xl:ms-40">
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
    </AuthDecoratedPage>
  );
}
