import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  MessageCircle,
  Package,
  Users,
  BadgePercent,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpLeft,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';

const quickActions = [
  { to: '/sales/new', label: 'إضافة عملية بيع', hint: 'ابدأ تسجيل عملية بيع جديدة بسرعة.', icon: ShoppingCart },
  { to: '/conversations', label: 'واتساب العملاء', hint: 'تابع رسائل العملاء والردود.', icon: MessageCircle },
  { to: '/products', label: 'الأصناف', hint: 'راجع الأصناف المتاحة وحدّث بياناتها.', icon: Package },
  { to: '/customers', label: 'العملاء', hint: 'اعرض بيانات العملاء وسجل تعاملاتهم.', icon: Users },
  { to: '/loyalty', label: 'نقاط العملاء', hint: 'تابع النقاط والمكافآت بسهولة.', icon: BadgePercent },
];

const highlights = [
  {
    title: 'تحكم مالي أوضح',
    text: 'متابعة يومية للمبيعات والفواتير والعمليات من مكان واحد بتجربة سريعة وسلسة.',
    icon: ShieldCheck,
  },
  {
    title: 'خدمة أسرع للعملاء',
    text: 'ابدأ البيع مباشرة وتواصل مع عملائك بدون تعقيد لرفع مستوى رضاهم باستمرار.',
    icon: Zap,
  },
  {
    title: 'نمو مستمر للبزنس',
    text: 'أدوات تساعدك تبني علاقة قوية مع العميل وتزود تكرار الشراء عبر برامج الولاء.',
    icon: Sparkles,
  },
];

const flowSteps = [
  { title: 'ابدأ بسرعة', text: 'سجل عمليات البيع في ثوانٍ مع واجهة واضحة وسريعة.' },
  { title: 'تابع العملاء', text: 'كل محادثات العملاء في مكان واحد لرد أسرع ومتابعة أفضل.' },
  { title: 'نمّي أرباحك', text: 'حلّل الأداء وركز على المنتجات والعملاء الأعلى عائدًا.' },
];

const statsTarget = [
  { label: 'دقة تنظيم العمليات', value: 98, suffix: '%' },
  { label: 'تسريع دورة البيع', value: 45, suffix: '%' },
  { label: 'تحسين متابعة العملاء', value: 72, suffix: '%' },
];

export function SellerLandingPage() {
  const [stats, setStats] = useState([0, 0, 0]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]');
    nodes.forEach((node, index) => {
      node.style.setProperty('--reveal-delay', `${Math.min(index * 40, 140)}ms`);
    });

    const revealIfVisible = () => {
      nodes.forEach((node) => {
        if (node.classList.contains('landing-reveal-visible')) return;
        const rect = node.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.86 && rect.bottom > window.innerHeight * 0.08;
        if (inView) node.classList.add('landing-reveal-visible');
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('landing-reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    revealIfVisible();
    window.addEventListener('scroll', revealIfVisible, { passive: true });
    window.addEventListener('resize', revealIfVisible);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealIfVisible);
      window.removeEventListener('resize', revealIfVisible);
    };
  }, []);

  useEffect(() => {
    const statsSection = document.querySelector<HTMLElement>('[data-stats]');
    if (!statsSection) return;

    let rafId = 0;
    let started = false;
    const duration = 1400;

    const start = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setStats(statsTarget.map((item) => Math.round(item.value * eased)));
        if (p < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            start();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(statsSection);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress((window.scrollY / maxScroll) * 100);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const x = (event.clientX - centerX) / centerX;
      const y = (event.clientY - centerY) / centerY;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <PageWrapper className="landing-page">
      <div className="landing-scroll-progress" style={{ transform: `scaleX(${Math.max(0, Math.min(scrollProgress, 100)) / 100})` }} />
      <section
        data-reveal
        className="landing-reveal relative overflow-hidden rounded-2xl border border-card bg-card px-5 py-7 md:px-8 md:py-10 shadow-sm"
      >
        <div
          className="landing-orb landing-orb-one"
          style={{ transform: `translate(${parallax.x * 14}px, ${parallax.y * 14}px)` }}
          aria-hidden
        />
        <div
          className="landing-orb landing-orb-two"
          style={{ transform: `translate(${parallax.x * -16}px, ${parallax.y * -16}px)` }}
          aria-hidden
        />
        <div className="relative grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm text-sky-700 dark:text-sky-300 mb-2 font-semibold">Mabe3aty Seller Experience</p>
            <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: 'var(--foreground)' }}>
              واجهة احترافية لإدارة البيع وخدمة العملاء بثقة
            </h1>
            <p className="text-sm md:text-base text-muted max-w-2xl leading-7 mb-5">
              في مبيعاتي، البائع يقدر يبدأ يومه بسرعة: يسجل المبيعات، يتابع العملاء، ويطلع على الأداء بصورة واضحة. كل
              الأدوات اللي تحتاجها في رحلة واحدة ذكية وعصرية.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/sales/new" className="btn-primary px-5 py-2.5 text-sm">
                ابدأ عملية بيع الآن
              </Link>
              <Link
                to="/conversations"
                className="inline-flex items-center gap-2 rounded-full border border-sky-300/50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition-all hover:-translate-y-0.5 hover:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30"
              >
                تواصل مع العملاء
                <ArrowUpLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div
            className="landing-image-wrap relative"
            style={{ transform: `translate(${parallax.x * -8}px, ${parallax.y * -10}px)` }}
          >
            <img
              src="/main.jpg"
              alt="صورة مالية تعبر عن تنظيم المبيعات"
              className="landing-main-image w-full rounded-2xl border border-card object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      <section data-reveal className="landing-reveal landing-marquee mt-5" aria-label="مميزات المنصة المتحركة">
        <div className="landing-marquee-track">
          <span>بيع أسرع</span>
          <span>واجهة عربية احترافية</span>
          <span>متابعة العملاء</span>
          <span>نقاط ولاء</span>
          <span>تقارير أوضح</span>
          <span>تنظيم يومي للمبيعات</span>
          <span>بيع أسرع</span>
          <span>واجهة عربية احترافية</span>
          <span>متابعة العملاء</span>
          <span>نقاط ولاء</span>
          <span>تقارير أوضح</span>
          <span>تنظيم يومي للمبيعات</span>
        </div>
      </section>

      <section data-reveal className="landing-reveal mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {highlights.map(({ title, text, icon: Icon }, idx) => (
          <article
            key={title}
            className="landing-float dash-card-interactive rounded-2xl border border-card bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            style={{ animationDelay: `${idx * 0.25}s` }}
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
              {title}
            </h2>
            <p className="text-sm text-muted leading-6">{text}</p>
          </article>
        ))}
      </section>

      <section
        data-reveal
        data-stats
        className="landing-reveal landing-gradient-border mt-5 rounded-2xl border border-card bg-card p-5 md:p-7 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-300" />
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            نتائج الخدمة على تجربة البيع
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {statsTarget.map((item, idx) => (
            <article key={item.label} className="dash-card-interactive rounded-xl border border-card bg-muted/20 p-4">
              <p className="landing-counter text-3xl font-extrabold text-sky-700 dark:text-sky-300">
                {stats[idx]}
                {item.suffix}
              </p>
              <p className="text-sm text-muted mt-1">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section data-reveal className="landing-reveal mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <img
          src="/istockphoto-2192481643-1024x1024.jpg"
          alt="عميلة تتابع حساباتها من الهاتف"
          className="landing-gallery-card dash-card-interactive landing-slide-in-left h-60 w-full rounded-2xl border border-card object-cover shadow-sm"
        />
        <img
          src="/istockphoto-2246963967-1024x1024.jpg"
          alt="حسابات ومتابعة مالية دقيقة"
          className="landing-gallery-card dash-card-interactive h-60 w-full rounded-2xl border border-card object-cover shadow-sm"
        />
        <img
          src="/istockphoto-1437026399-1024x1024.jpg"
          alt="متابعة المصروفات والبيانات المالية"
          className="landing-gallery-card dash-card-interactive landing-slide-in-right h-60 w-full rounded-2xl border border-card object-cover shadow-sm"
        />
      </section>

      <section data-reveal className="landing-reveal mt-5 rounded-2xl border border-card bg-card p-5 md:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-sky-700 dark:text-sky-300">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-semibold">عن المشروع والخدمة</p>
        </div>
        <p className="text-sm md:text-base text-muted leading-7">
          مشروع <strong className="text-[var(--foreground)]">Mabe3aty</strong> مصمم لمساعدة البائعين على إدارة أعمالهم
          بسهولة واحترافية، بداية من تسجيل البيع وحتى متابعة العملاء وبرامج الولاء. الخدمة تركّز على تقليل الوقت
          الضائع، تحسين تجربة العميل، ورفع كفاءة التشغيل داخل المتجر أو النشاط التجاري.
        </p>
      </section>

      <section data-reveal className="landing-reveal mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="dash-card-interactive rounded-2xl border border-card bg-card p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
            رحلة العمل داخل المنصة
          </h2>
          <div className="space-y-3">
            {flowSteps.map((step, idx) => (
              <div
                key={step.title}
                className="landing-step-item rounded-xl border border-card bg-muted/15 p-3.5"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {step.title}
                </p>
                <p className="text-sm text-muted leading-6">{step.text}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="landing-shimmer dash-card-interactive rounded-2xl border border-card bg-card p-5 md:p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
            لماذا مبيعاتي؟
          </h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
              تصميم UX عربي حديث يساعد الفريق يشتغل بكفاءة أعلى بدون تعقيد.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
              انتقال سلس بين المبيعات والعملاء والمنتجات من نفس الواجهة.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
              مؤثرات بصرية احترافية مع أداء متوازن مناسب للاستخدام اليومي.
            </li>
          </ul>
        </article>
      </section>

      <section data-reveal className="landing-reveal mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {quickActions.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group dash-card-interactive rounded-2xl border border-card bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/45 hover:shadow-md"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              {label}
            </h2>
            <p className="text-sm text-muted">{hint}</p>
          </Link>
        ))}
      </section>

      <section data-reveal className="landing-reveal mt-5 rounded-2xl border border-card bg-card p-5 md:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-sky-700 dark:text-sky-300 font-semibold mb-1">جاهز تبدأ الآن؟</p>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              خلّي البيع أسرع وتجربة العميل أفضل من أول يوم
            </h2>
          </div>
          <Link to="/sales/new" className="btn-primary px-5 py-2.5 text-sm w-fit">
            ابدأ أول عملية بيع
          </Link>
        </div>
      </section>
    </PageWrapper>
  );
}
