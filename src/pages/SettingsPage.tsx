import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setTheme } from '@/store/slices/themeSlice';
import { PageWrapper } from '@/components/PageWrapper';
import { pageCardInner, pageCardShell } from '@/lib/pageCardClasses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#093F85', '#0ea5e9', '#8b5cf6', '#f59e0b'];
const usageByDay = [
  { name: 'السبت', فاتح: 4, داكن: 2 },
  { name: 'الأحد', فاتح: 3, داكن: 4 },
  { name: 'الإثنين', فاتح: 5, داكن: 3 },
  { name: 'الثلاثاء', فاتح: 2, داكن: 5 },
  { name: 'الأربعاء', فاتح: 4, داكن: 4 },
  { name: 'الخميس', فاتح: 6, داكن: 2 },
  { name: 'الجمعة', فاتح: 3, داكن: 3 },
];
const themeDistribution = [
  { name: 'الوضع الفاتح', value: 55, color: '#f1f5f9' },
  { name: 'الوضع الداكن', value: 45, color: '#1e293b' },
];

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);

  return (
    <PageWrapper>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">الإعدادات</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">تخصيص المظهر وعرض ملخص النشاط</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className={pageCardShell}>
          <div className={`p-5 ${pageCardInner}`}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">المظهر</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mode === 'dark'}
                onChange={(e) => dispatch(setTheme(e.target.checked ? 'dark' : 'light'))}
                className="h-6 w-11 cursor-pointer rounded-full accent-[var(--bidex-primary)]"
              />
              <span className="font-medium text-slate-900 dark:text-slate-100">{mode === 'dark' ? 'الوضع الداكن مفعّل' : 'الوضع الفاتح مفعّل'}</span>
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">تبديل بين الوضع الفاتح والداكن.</p>
          </div>
        </div>
        <div className={pageCardShell}>
          <div className={`p-5 ${pageCardInner}`}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">توزيع استخدام الوضع</h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={themeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {themeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => (v != null ? [`${v}%`, 'النسبة'] : [])} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className={pageCardShell}>
        <div className={`p-5 ${pageCardInner}`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">نشاط الاستخدام خلال الأسبوع (ساعات)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">تقدير استخدام الوضع الفاتح والوضع الداكن خلال الأيام.</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="فاتح" fill={CHART_COLORS[0]} name="الوضع الفاتح" radius={[4, 4, 0, 0]} />
                <Bar dataKey="داكن" fill={CHART_COLORS[1]} name="الوضع الداكن" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
