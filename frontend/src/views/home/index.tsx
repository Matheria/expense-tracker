'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/model/auth.store';
import { TransactionsList } from '@/features/transactions-list/ui/transactions-list';
import { HomeHeader } from '@/widgets/home-header/ui/home-header';

export function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Wait for zustand/persist to rehydrate before deciding to redirect.
  useEffect(() => {
    setHydrated(true);
  }, []);

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
