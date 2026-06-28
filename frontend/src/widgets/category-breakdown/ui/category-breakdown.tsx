import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/shared/ui/category-icon';
import { formatMoney } from '@/features/dashboard/lib/format';
import type { CategoryTotal } from '@/features/dashboard/model/use-dashboard';

interface CategoryBreakdownProps {
  byCategory: CategoryTotal[];
  loading?: boolean;
}

export function CategoryBreakdown({ byCategory, loading }: CategoryBreakdownProps) {
  const top = byCategory.slice(0, 3);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (top.length === 0) {
    return (
      <div className="rounded-2xl bg-card px-5 py-6 text-sm text-muted-foreground">
        Расходы по категориям появятся, как только добавите первую транзакцию.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {top.map((entry) => {
        const isIncome = entry.income > entry.expense;
        const total = isIncome ? entry.income : entry.expense;
        return (
          <div
            key={entry.category.id}
            className={cn(
              'flex flex-col justify-between rounded-2xl px-5 py-3',
              isIncome ? 'bg-mint text-mint-foreground' : 'bg-rose text-rose-foreground',
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-white/60 text-base"
                style={{ color: entry.category.color }}
              >
                <CategoryIcon name={entry.category.icon} size={18} />
              </span>
              <span
                className={cn(
                  'truncate text-sm font-medium',
                  isIncome ? 'text-mint-foreground' : 'text-rose-foreground',
                )}
              >
                {entry.category.name}
              </span>
            </div>
            <p className="tabular mt-2 font-display text-xl font-bold tracking-tight">
              {isIncome ? formatMoney(total) : `−${formatMoney(total)}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
