export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: string;
  type: TransactionType;
  description?: string | null;
  date: string;
  categoryId: string;
  userId: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionTotals {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
  categoryId: string;
}
