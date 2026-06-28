'use client';

import { useEffect, useMemo, useState } from 'react';

import { categoryApi, type Category } from '@/entities/category';
import { transactionApi, type Transaction } from '@/entities/transaction';

/** How many recent transactions to pull for the dashboard aggregates. */
const SAMPLE_SIZE = 200;
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

  // `loading` is derived: until the key we have data for matches the latest
  // requested key, we are still fetching — no synchronous setState in the effect.
  const requestKey = String(refreshKey);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loaded = loadedKey === requestKey;

  useEffect(() => {
    let active = true;
    Promise.all([
      categoryApi.list().then(({ data }) => data),
      transactionApi.list({ page: 1, limit: SAMPLE_SIZE }).then(({ data }) => data.data),
    ])
      .then(([cats, txs]) => {
        if (!active) return;
        setCategories(Object.fromEntries(cats.map((c) => [c.id, c])));
        setTransactions(txs);
      })
      .catch(() => {
        if (!active) return;
        setCategories({});
        setTransactions([]);
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, requestKey]);

  return useMemo<DashboardData>(() => {
    let income = 0;
    let expense = 0;
    const catMap = new Map<string, CategoryTotal>();

    for (const tx of transactions) {
      const amount = num(tx.amount);
      if (tx.type === 'INCOME') income += amount;
      else expense += amount;

      const category = categories[tx.categoryId];
      if (!category) continue;
      const entry = catMap.get(category.id) ?? {
        category,
        expense: 0,
        income: 0,
        count: 0,
      };
      if (tx.type === 'INCOME') entry.income += amount;
      else entry.expense += amount;
      entry.count += 1;
      catMap.set(category.id, entry);
    }

    const byCategory = [...catMap.values()].sort(
      (a, b) => b.expense + b.income - (a.expense + a.income),
    );

    // Last CHART_MONTHS months, oldest → newest, including empty months.
    const now = new Date();
    const buckets: MonthBucket[] = [];
    const index = new Map<string, MonthBucket>();
    for (let i = CHART_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket: MonthBucket = { key, monthIndex: d.getMonth(), income: 0, expense: 0 };
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
      loading: !loaded,
      transactions,
      categories,
      balance: income - expense,
      income,
      expense,
      count: transactions.length,
      byCategory,
      byMonth: buckets,
    };
  }, [transactions, categories, loaded]);
}
