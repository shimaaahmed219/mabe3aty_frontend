import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { BrandWordmark } from '@/components/BrandWordmark';
import { pageCardInner } from '@/lib/pageCardClasses';
import { formInputGlowInteraction } from '@/lib/theme';

/** حقول الدخول/التسجيل — متوافقة مع `--input-*` والوضعين */
export const authInputClass =
  `w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-slate-100 dark:placeholder:text-slate-500 ${formInputGlowInteraction}`;

function AuthBackdropLayers() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 bg-[var(--background)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-90 dark:opacity-100"
        aria-hidden
        style={{
          background:
            'linear-gradient(200deg, color-mix(in srgb, var(--bidex-primary) 10%, var(--background)) 0%, var(--background) 42%, color-mix(in srgb, var(--card-bg) 85%, var(--background)) 100%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 hidden dark:block opacity-80"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 35%, color-mix(in srgb, var(--bidex-primary) 22%, transparent) 0%, transparent 58%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 dark:hidden opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 75% 50% at 50% 30%, color-mix(in srgb, var(--bidex-primary) 12%, transparent) 0%, transparent 55%)',
        }}
      />
    </>
  );
}

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
    <div className="relative min-h-screen overflow-hidden text-[var(--foreground)]">
      <AuthBackdropLayers />
      <AuthThemeToggleButton />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:py-12">
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
      <div className="relative z-10 w-full max-w-[440px]">
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
