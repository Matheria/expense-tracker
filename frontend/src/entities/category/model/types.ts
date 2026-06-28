export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
}

export interface CreateCategoryPayload {
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
}
