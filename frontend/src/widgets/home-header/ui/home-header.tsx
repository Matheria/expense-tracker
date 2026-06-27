'use client';

import { useRouter } from 'next/navigation';

import { CreateCategoryDialog } from '@/features/create-category/ui/create-category-dialog';
import { CreateTransactionDialog } from '@/features/create-transaction/ui/create-transaction-dialog';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { ProfileCard } from '@/features/profile/ui/profile-card';

interface HomeHeaderProps {
  onTransactionCreated?: () => void;
  onCategoryCreated?: () => void;
}

export function HomeHeader({ onTransactionCreated, onCategoryCreated }: HomeHeaderProps) {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold">Трекер расходов</h1>
      <div className="flex flex-wrap items-center gap-2">
        <CreateTransactionDialog onCreated={onTransactionCreated} />
        <CreateCategoryDialog onCreated={onCategoryCreated} />
        <ProfileCard onLogout={handleLogout} />
      </div>
    </header>
  );
}
