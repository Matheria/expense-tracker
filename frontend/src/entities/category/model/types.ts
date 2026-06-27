export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CreateCategoryPayload {
  name: string;
  color: string;
  icon: string;
}
