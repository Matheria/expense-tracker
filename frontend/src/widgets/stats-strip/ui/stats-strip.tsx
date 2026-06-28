import { formatMoney } from '@/features/dashboard/lib/format';

interface StatsStripProps {
  count: number;
  income: number;
  expense: number;
  loading?: boolean;
}

export function StatsStrip({ count, income, expense, loading }: StatsStripProps) {
  const items = [
    { label: 'Транзакций', value: loading ? '—' : String(count) },
    { label: 'Доходы', value: loading ? '—' : formatMoney(income) },
    { label: 'Расходы', value: loading ? '—' : formatMoney(expense) },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-card">
      {items.map((item) => (
        <div key={item.label} className="px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="tabular mt-0.5 font-display text-lg font-bold tracking-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
