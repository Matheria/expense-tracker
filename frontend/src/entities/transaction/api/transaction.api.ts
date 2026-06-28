import { http } from '@/shared/api/http';
import type {
  CreateTransactionPayload,
  ListTransactionsParams,
  Paginated,
  Transaction,
} from '@/entities/transaction/model/types';

export const transactionApi = {
  list: (params: ListTransactionsParams = {}) =>
    http.get<Paginated<Transaction>>('/transactions', { params }),
  create: (data: CreateTransactionPayload) => http.post<Transaction>('/transactions', data),
  remove: (id: string) => http.delete(`/transactions/${id}`),
};
