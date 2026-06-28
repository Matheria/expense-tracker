import { http } from '@/shared/api/http';
import type { User } from '@/entities/user/model/types';

export const userApi = {
  me: () => http.get<User>('/users/me'),
};
