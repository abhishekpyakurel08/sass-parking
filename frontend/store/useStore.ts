import { create } from 'zustand'

export type UserRole = 'SUPER_ADMIN' | 'TENANT_OWNER' | 'GATE_STAFF';

type User = {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  name: string;
  email: string;
}

type State = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (u: User) => void;
  clearUser: () => void;
}

export const useStore = create<State>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (u) => set({ user: u, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false })
}))
