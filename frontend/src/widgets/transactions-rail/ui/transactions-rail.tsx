'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/shared/ui/category-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { transactionApi } from '@/entities/transaction/api/transaction.api';
import type { Category } from '@/entities/category';
import type { Transaction, TransactionType } from '@/entities/transaction';
import { formatDate, formatSigned } from '@/features/dashboard/lib/format';

type Tab = 'ALL' | 'INCOME' | 'EXPENSE';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'Все' },
  { id: 'INCOME', label: 'Доходы' },
  { id: 'EXPENSE', label: 'Расходы' },
];

interface TransactionsRailProps {
  transactions: Transaction[];
  categories: Record<string, Category>;
  loading?: boolean;
  className?: string;
  onDelete?: () => void;
}

export function TransactionsRail({
  transactions,
  categories,
  loading,
  className,
  onDelete,
}: TransactionsRailProps) {
  const [tab, setTab] = useState<Tab>('ALL');

  const filtered = useMemo(() => {
    const list = tab === 'ALL' ? transactions : transactions.filter((t) => t.type === tab);
    return [...list].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [transactions, tab]);

  return (
    <section className={cn('flex flex-col rounded-3xl bg-card p-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight">Транзакции</h2>
        <span className="text-xs text-muted-foreground">{filtered.length}</span>
      </div>

      <div className="mt-4 flex gap-1 rounded-full bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              tab === t.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 -mr-2 max-h-[28rem] min-h-0 flex-1 overflow-y-auto pr-2 lg:max-h-none">
        {loading ? (
          <RailMessage>Загрузка…</RailMessage>
        ) : filtered.length === 0 ? (
          <RailMessage>Пока пусто. Добавьте первую транзакцию.</RailMessage>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((tx) => (
              <Row key={tx.id} tx={tx} category={categories[tx.categoryId]} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Row({
  tx,
  category,
  onDelete,
}: {
  tx: Transaction;
  category?: Category;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const income = tx.type === 'INCOME';

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(false);
    try {
      await transactionApi.remove(tx.id);
      setOpen(false);
      onDelete?.();
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <li className="group flex items-center gap-3 py-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-base text-ink-foreground"
          style={category ? { color: category.color } : undefined}
        >
          {category?.icon ? <CategoryIcon name={category.icon} size={18} /> : '•'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{category?.name ?? 'Без категории'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {tx.description?.trim() || formatDate(tx.date)}
          </p>
        </div>
        <span
          className={cn(
            'tabular shrink-0 text-sm font-semibold',
            income ? 'text-income' : 'text-foreground',
          )}
        >
          {formatSigned(Number(tx.amount), tx.type as TransactionType)}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover:opacity-100"
          aria-label="Удалить транзакцию"
        >
          <Trash2 size={14} />
        </button>
      </li>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDeleteError(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить транзакцию?</DialogTitle>
            <DialogDescription>
              {deleteError
                ? 'Не удалось удалить транзакцию. Попробуйте ещё раз.'
                : 'Это действие необратимо. Транзакция будет удалена навсегда.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление…' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RailMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
