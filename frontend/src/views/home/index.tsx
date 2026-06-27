'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/model/auth.store';
import { TransactionsList } from '@/features/transactions-list/ui/transactions-list';
import { HomeHeader } from '@/widgets/home-header/ui/home-header';

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

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return null;
  }

  const bumpTransactions = () => setRefreshKey((k) => k + 1);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <HomeHeader
        onTransactionCreated={bumpTransactions}
        onCategoryCreated={bumpTransactions}
      />
      <TransactionsList refreshKey={refreshKey} />
    </main>
  );
}
