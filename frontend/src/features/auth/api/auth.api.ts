import { http } from '@/shared/api/http';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
}

export const authApi = {
  login: (data: LoginPayload) => http.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => http.post<AuthResponse>('/auth/register', data),
};
