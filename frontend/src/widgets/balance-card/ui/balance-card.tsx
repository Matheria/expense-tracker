import { Globe } from '@/shared/ui/globe';
import { formatMoney } from '@/features/dashboard/lib/format';

interface BalanceCardProps {
  balance: number;
  loading?: boolean;
}

export function BalanceCard({ balance, loading }: BalanceCardProps) {
  return (
    <section className="relative shrink-0 overflow-hidden rounded-3xl bg-sky px-7 py-3 text-sky-foreground">
      <Globe className="pointer-events-none absolute -top-10 right-[-6%] h-[150%] w-1/2 text-sky-foreground/20" />
      <div className="relative">
        <p className="text-xs font-medium text-sky-foreground/70">Ваш баланс</p>
        <p className="tabular mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {loading ? '—' : formatMoney(balance)}
        </p>
        <p className="mt-1.5 text-sm text-sky-foreground/60">Доходы минус расходы за период</p>
      </div>
    </section>
  );
}
