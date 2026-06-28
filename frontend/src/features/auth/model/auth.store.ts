import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { configureAuth } from '@/shared/api/http';

interface AuthState {
  accessToken: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setToken: (token) => set({ accessToken: token }),
      logout: () => set({ accessToken: null }),
    }),
    { name: 'auth' },
  ),
);

export const selectIsAuthenticated = (state: AuthState) => !!state.accessToken;

configureAuth(() => useAuthStore.getState().accessToken);
