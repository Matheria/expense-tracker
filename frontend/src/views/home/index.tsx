'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/model/auth.store';
import { useDashboard } from '@/features/dashboard/model/use-dashboard';
import { formatLongDate } from '@/features/dashboard/lib/format';
import { AppSidebar } from '@/widgets/app-sidebar/ui/app-sidebar';
import { BalanceCard } from '@/widgets/balance-card/ui/balance-card';
import { StatsStrip } from '@/widgets/stats-strip/ui/stats-strip';
import { CategoryBreakdown } from '@/widgets/category-breakdown/ui/category-breakdown';
import { SpendingChart } from '@/widgets/spending-chart/ui/spending-chart';
import { TransactionsRail } from '@/widgets/transactions-rail/ui/transactions-rail';
import { TipCard } from '@/widgets/tip-card/ui/tip-card';

// SSR-safe read of zustand/persist rehydration status, without a mount effect.
function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

export function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useHydrated();
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useDashboard(refreshKey);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return null;
  }

  const refresh = () => setRefreshKey((k) => k + 1);
  const topCategory = data.byCategory.find((c) => c.category.type === 'EXPENSE')?.category.name;

  return (
    <div className="min-h-screen bg-background p-4 lg:flex lg:h-screen lg:gap-4 lg:overflow-hidden">
      <AppSidebar onTransactionCreated={refresh} onCategoryCreated={refresh} />

      <div className="flex flex-1 flex-col gap-4 pt-4 lg:flex-row lg:overflow-hidden lg:pt-0">
        {/* Main column */}
        <main className="flex min-w-0 flex-1 flex-col gap-4 lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:overflow-hidden">
          <header className="flex flex-wrap items-end justify-between gap-2 px-1 pt-1">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight">Дашборд</h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(new Date())}</p>
            </div>
          </header>

          <BalanceCard balance={data.balance} loading={data.loading} />
          <StatsStrip
            count={data.count}
            income={data.income}
            expense={data.expense}
            loading={data.loading}
          />
          <CategoryBreakdown byCategory={data.byCategory} loading={data.loading} />
          <SpendingChart
            byMonth={data.byMonth}
            income={data.income}
            expense={data.expense}
            loading={data.loading}
            className="lg:min-h-0 lg:flex-1"
          />
        </main>

        {/* Right rail */}
        <div className="flex w-full flex-col gap-4 lg:h-[calc(100vh-2rem)] lg:w-80 lg:min-h-0 lg:shrink-0 lg:overflow-hidden">
          <TransactionsRail
            transactions={data.transactions}
            categories={data.categories}
            loading={data.loading}
            onDelete={refresh}
            className="lg:min-h-0 lg:flex-1"
          />
          <TipCard topCategory={topCategory} />
        </div>
      </div>
    </div>
  );
}
