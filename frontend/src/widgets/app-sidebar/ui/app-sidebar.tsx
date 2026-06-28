'use client';

import { forwardRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Plus, Tags, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ManageCategoriesDialog } from '@/widgets/manage-categories/ui/manage-categories-dialog';
import { CreateTransactionDialog } from '@/features/create-transaction/ui/create-transaction-dialog';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { userApi, type User } from '@/entities/user';

function initials(user: User): string {
  const source = user.name?.trim() || user.email;
  return source.slice(0, 2).toUpperCase();
}

interface AppSidebarProps {
  onTransactionCreated?: () => void;
  onCategoryCreated?: () => void;
}

export function AppSidebar({ onTransactionCreated, onCategoryCreated }: AppSidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    userApi
      .me()
      .then(({ data }) => active && setUser(data))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="flex flex-col gap-8 rounded-3xl bg-sidebar p-5 text-sidebar-foreground lg:h-[calc(100vh-2rem)] lg:w-72 lg:shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-accent">
          <Wallet className="size-4.5" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">Бюджет</span>
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3 px-1">
        <span className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent font-display text-sm font-semibold">
          {user ? initials(user) : '··'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name || 'Пользователь'}</p>
          <p className="truncate text-xs text-sidebar-muted">{user?.email ?? '—'}</p>
        </div>
      </div>

      {/* Navigation — the app is a single dashboard today; Категории opens the editor */}
      <nav className="flex flex-col gap-1">
        <NavRow icon={<LayoutGrid className="size-4.5" />} active>
          Обзор
        </NavRow>
        <ManageCategoriesDialog
          onChanged={onCategoryCreated}
          trigger={<NavRow icon={<Tags className="size-4.5" />}>Категории</NavRow>}
        />
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <CreateTransactionDialog
          onCreated={onTransactionCreated}
          trigger={
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sidebar-primary px-4 py-3 text-sm font-medium text-sidebar-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              <Plus className="size-4.5" />
              Добавить транзакцию
            </button>
          }
        />
        <NavRow icon={<LogOut className="size-4.5" />} onClick={handleLogout}>
          Выйти
        </NavRow>
      </div>
    </aside>
  );
}

const NavRow = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & { icon: React.ReactNode; active?: boolean }
>(function NavRow({ icon, active, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      data-active={active || undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring',
        active
          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
          : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
});
