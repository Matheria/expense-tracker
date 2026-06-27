export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
  categoryId: string;
}
