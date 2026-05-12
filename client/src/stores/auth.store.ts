import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setSession: (user, accessToken) => set({ user, accessToken, isHydrated: true }),
  setUser: (user) => set({ user }),
  setHydrated: () => set({ isHydrated: true }),
  clear: () => set({ user: null, accessToken: null, isHydrated: true }),
}));
