import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatMoney, monthLabel } from '@/features/dashboard/lib/format';
import type { MonthBucket } from '@/features/dashboard/model/use-dashboard';

/** Tallest bar fills this share of the plot height, leaving headroom so bars never reach the legend. */
const BAR_MAX_PCT = 82;

interface SpendingChartProps {
  byMonth: MonthBucket[];
  income: number;
  expense: number;
  loading?: boolean;
  className?: string;
}

export function SpendingChart({ byMonth, income, expense, loading, className }: SpendingChartProps) {
  const max = Math.max(1, ...byMonth.flatMap((m) => [m.income, m.expense]));

  return (
    <section className={cn('flex flex-col rounded-3xl bg-card p-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Динамика по месяцам</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sky" />
            Доходы
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ink" />
            Расходы
          </span>
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex shrink-0 gap-3 sm:flex-col">
          <Summary
            icon={<ArrowUpRight className="size-4" />}
            label="Доходы"
            value={loading ? '—' : formatMoney(income)}
          />
          <Summary
            icon={<ArrowDownRight className="size-4" />}
            label="Расходы"
            value={loading ? '—' : formatMoney(expense)}
          />
        </div>

        <div className="flex h-44 min-h-44 flex-1 items-end justify-between gap-2 sm:h-full">
          {byMonth.map((m) => (
            <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-1">
                <Bar value={m.income} max={max} className="bg-sky" />
                <Bar value={m.expense} max={max} className="bg-ink" />
              </div>
              <span className="text-[11px] text-muted-foreground">{monthLabel(m.monthIndex)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = value > 0 ? Math.max(6, (value / max) * BAR_MAX_PCT) : 0;
  return (
    <div
      className={`w-2.5 rounded-full ${className}`}
      style={{ height: `${pct}%` }}
      title={value.toFixed(0)}
    />
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-surface-muted px-3 py-2.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-ink text-ink-foreground">
        {icon}
      </span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="tabular font-display text-sm font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
