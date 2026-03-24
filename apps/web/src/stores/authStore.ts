import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@biopropose/shared-types';

interface UserSession {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: UserSession | null;
  login: (user: UserSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'biopropose-session',
    },
  ),
);
