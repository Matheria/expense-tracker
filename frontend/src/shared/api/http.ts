import axios from 'axios';

import { API_URL } from '@/shared/config/env';

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let getToken: () => string | null = () => null;

export function configureAuth(tokenGetter: () => string | null): void {
  getToken = tokenGetter;
}

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
