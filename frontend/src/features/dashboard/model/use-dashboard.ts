'use client';

import { useEffect, useMemo, useState } from 'react';

import { categoryApi, type Category } from '@/entities/category';
import { transactionApi, type Transaction, type TransactionTotals } from '@/entities/transaction';

const RAIL_LIMIT = 200;
const CHART_MONTHS = 8;

export interface CategoryTotal {
  category: Category;
  expense: number;
  income: number;
  count: number;
}

export interface MonthBucket {
  key: string;
  monthIndex: number;
  income: number;
  expense: number;
}

export interface DashboardData {
  loading: boolean;
  transactions: Transaction[];
  categories: Record<string, Category>;
  balance: number;
  income: number;
  expense: number;
  count: number;
  byCategory: CategoryTotal[];
  byMonth: MonthBucket[];
}

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function useDashboard(refreshKey = 0): DashboardData {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [totals, setTotals] = useState<TransactionTotals>({ income: 0, expense: 0, balance: 0, count: 0 });
  const [loaded, setLoaded] = useState(false);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      categoryApi.list().then(({ data }) => data),
      transactionApi.list({ page: 1, limit: RAIL_LIMIT }).then(({ data }) => data.data),
      transactionApi.totals().then(({ data }) => data),
    ])
      .then(([cats, txs, tot]) => {
        if (!active) return;
        setCategories(Object.fromEntries(cats.map((c) => [c.id, c])));
        setTransactions(txs);
        setTotals(tot);
      })
      .catch(() => {
        if (!active) return;
        setCategories({});
        setTransactions([]);
        setTotals({ income: 0, expense: 0, balance: 0, count: 0 });
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
          setLoadedKey(refreshKey);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return useMemo<DashboardData>(() => {
    const catMap = new Map<string, CategoryTotal>();
    for (const tx of transactions) {
      const category = categories[tx.categoryId];
      if (!category) continue;
      const entry = catMap.get(category.id) ?? { category, expense: 0, income: 0, count: 0 };
      if (tx.type === 'INCOME') entry.income += num(tx.amount);
      else entry.expense += num(tx.amount);
      entry.count += 1;
      catMap.set(category.id, entry);
    }

    const byCategory = [...catMap.values()].sort(
      (a, b) => b.expense + b.income - (a.expense + a.income),
    );

    // Build chart buckets using UTC throughout to match how transaction dates are stored.
    const now = new Date();
    const buckets: MonthBucket[] = [];
    const index = new Map<string, MonthBucket>();
    for (let i = CHART_MONTHS - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      const bucket: MonthBucket = { key, monthIndex: d.getUTCMonth(), income: 0, expense: 0 };
      buckets.push(bucket);
      index.set(key, bucket);
    }
    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      const bucket = index.get(key);
      if (!bucket) continue;
      const amount = num(tx.amount);
      if (tx.type === 'INCOME') bucket.income += amount;
      else bucket.expense += amount;
    }

    return {
      loading: !loaded || loadedKey !== refreshKey,
      transactions,
      categories,
      balance: totals.balance,
      income: totals.income,
      expense: totals.expense,
      count: totals.count,
      byCategory,
      byMonth: buckets,
    };
  }, [transactions, categories, totals, loaded, loadedKey, refreshKey]);
}
