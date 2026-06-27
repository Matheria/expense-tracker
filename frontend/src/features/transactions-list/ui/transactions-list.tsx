'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { categoryApi, type Category } from '@/entities/category';
import { transactionApi, type Transaction } from '@/entities/transaction';

const PAGE_SIZE = 10;

function formatAmount(value: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', { timeZone: 'UTC' });
}

interface TransactionsListProps {
  refreshKey?: number;
}

export function TransactionsList({ refreshKey = 0 }: TransactionsListProps) {
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [totalPages, setTotalPages] = useState(1);

  // `loading` is derived: while the key of the latest request differs from the
  // key we have data for, we are still fetching. This avoids a synchronous
  // setState inside the fetch effect.
  const requestKey = `${page}:${refreshKey}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    categoryApi
      .list()
      .then(({ data }) => {
        setCategories(Object.fromEntries(data.map((c) => [c.id, c])));
      })
      .catch(() => setCategories({}));
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    transactionApi
      .list({ page, limit: PAGE_SIZE })
      .then(({ data }) => {
        if (!active) return;
        setTransactions(data.data);
        setTotalPages(data.totalPages);
        // A refresh may have shrunk the dataset below the current page.
        if (page > data.totalPages) {
          setPage(data.totalPages);
        }
      })
      .catch(() => {
        if (active) setTransactions([]);
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [page, refreshKey, requestKey]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Категория</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  Пока нет транзакций
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => {
                const category = categories[tx.categoryId];
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span style={{ color: category?.color }}>{category?.icon}</span>
                        {category?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description ?? ''}</TableCell>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '−'}
                      {formatAmount(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Назад
        </Button>
        <span className="text-muted-foreground text-sm">
          Страница {page} из {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
