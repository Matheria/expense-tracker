import { http } from '@/shared/api/http';
import type { Category, CreateCategoryPayload } from '@/entities/category/model/types';

export const categoryApi = {
  list: () => http.get<Category[]>('/categories'),
  create: (data: CreateCategoryPayload) => http.post<Category>('/categories', data),
  remove: (id: string) => http.delete(`/categories/${id}`),
};
