import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ReactNode } from 'react';

const MONTHS_DATA_12 = [
  { month: 'أبريل', value: 6200 },
  { month: 'مايو', value: 7100 },
  { month: 'يونيو', value: 5800 },
  { month: 'يوليو', value: 7500 },
  { month: 'أغسطس', value: 6900 },
  { month: 'سبتمبر', value: 7400 },
  { month: 'أكتوبر', value: 8000 },
  { month: 'نوفمبر', value: 12000 },
  { month: 'ديسمبر', value: 9500 },
  { month: 'يناير', value: 17500 },
  { month: 'فبراير', value: 20500 },
  { month: 'مارس', value: 27000 },
];

export type RevenueDuration = 6 | 12;

interface MonthlyRevenueChartProps {
  duration?: RevenueDuration;
  data?: { month: string; value: number }[];
}

export function MonthlyRevenueChart({ duration = 6, data }: MonthlyRevenueChartProps) {
  const chartData = data && data.length > 0
    ? data
    : (duration === 12 ? MONTHS_DATA_12 : MONTHS_DATA_12.slice(-6));

  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid, #E5E7EB)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--chart-axis, #9CA3AF)', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--chart-axis, #9CA3AF)', fontSize: 10 }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}K`}
            width={32}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip
            formatter={(value: unknown) => {
              const raw = Array.isArray(value) ? value[0] : value;
              const num = typeof raw === 'number' ? raw : Number(raw ?? 0);
              return [`${num.toLocaleString('ar-EG')} جنيه`, 'الإيراد الشهري'];
            }}
            labelFormatter={(label: ReactNode) => `الشهر: ${String(label ?? '')}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--auc-price, #1B3A6B)"
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--auc-price, #1B3A6B)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
