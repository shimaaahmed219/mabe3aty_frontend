import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const authInputClass =
  'w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/20 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/[0.14] focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-500/50 focus:bg-white/[0.06]';

type AuthShellProps = {
  title: string;
  subtitle: string;
  activeTab: 'login' | 'register';
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 flex items-center justify-center px-4 py-10 sm:py-12">
      {/* Base: same family as the form card (zinc-950) + slight cool depth */}
      <div
        className="pointer-events-none fixed inset-0 bg-zinc-950"
        style={{
          backgroundImage:
            'linear-gradient(165deg, rgb(9 9 11) 0%, rgb(24 24 27 / 0.97) 45%, rgb(15 23 42 / 0.35) 100%)',
        }}
      />

      {/* Spotlight behind the form — sky / cyan / indigo = accent strip + inputs focus */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center pt-4">
        <div
          className="absolute w-[min(92vw,520px)] h-[min(78vh,560px)] -translate-y-[4%] rounded-[3rem] opacity-90 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse 72% 58% at 50% 48%, rgba(56, 189, 248, 0.14) 0%, rgba(99, 102, 241, 0.07) 42%, transparent 68%)',
          }}
        />
        <div
          className="absolute w-[min(110vw,640px)] h-[min(88vh,620px)] -translate-y-[2%] rounded-[3.5rem] opacity-70 blur-[64px]"
          style={{
            background:
              'radial-gradient(ellipse 55% 48% at 50% 52%, rgba(9, 63, 133, 0.22) 0%, rgba(2, 15, 31, 0.12) 50%, transparent 72%)',
          }}
        />
      </div>

      {/* Edge vignette: draws attention to the form block */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 48%, transparent 0%, transparent 42%, rgba(2, 6, 12, 0.55) 100%)',
        }}
      />

      {/* Texture — same grain, lower contrast so it doesn’t fight the form */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="rounded-[1.35rem] border border-white/[0.08] bg-zinc-950/75 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl ring-1 ring-white/[0.04] overflow-hidden">
          <div className="h-px w-full bg-gradient-to-l from-transparent via-sky-400/90 to-transparent" />
          <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500/80 via-sky-400 to-cyan-400/90 opacity-95" />

          <div className="px-6 pt-8 pb-8 sm:px-10 sm:pt-9 sm:pb-10">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-sky-500/15 blur-2xl" aria-hidden />
                <div className="relative flex min-h-[3.5rem] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-6 py-3 shadow-lg shadow-black/40">
                  <span className="logo-mabi3aty text-[0.7rem] sm:text-[0.78rem] tracking-[0.26em] whitespace-nowrap">MABI3ATY</span>
                </div>
              </div>
              <div className="text-center space-y-1.5 max-w-[20rem]">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{title}</h1>
                <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
              </div>
            </div>

            <div className="mb-7 rounded-2xl bg-black/35 p-1 flex text-sm font-medium border border-white/[0.06] shadow-inner shadow-black/30">
              {activeTab === 'login' ? (
                <span className="flex-1 rounded-[0.65rem] btn-primary py-2.5 text-center shadow-md shadow-sky-950/40">
                  تسجيل الدخول
                </span>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 rounded-[0.65rem] py-2.5 text-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-200"
                >
                  تسجيل الدخول
                </Link>
              )}
              {activeTab === 'register' ? (
                <span className="flex-1 rounded-[0.65rem] btn-primary py-2.5 text-center shadow-md shadow-sky-950/40">
                  إنشاء حساب جديد
                </span>
              ) : (
                <Link
                  to="/register"
                  className="flex-1 rounded-[0.65rem] py-2.5 text-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-200"
                >
                  إنشاء حساب جديد
                </Link>
              )}
            </div>

            {children}

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center text-sm text-slate-400">{footer}</div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          محمي بتشفير الاتصال · مبيعاتي
        </p>
      </div>
    </div>
  );
}
