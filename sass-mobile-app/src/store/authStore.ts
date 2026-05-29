import { create } from 'zustand';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  gate_assignment?: 'ENTRY' | 'EXIT' | 'BOTH';
  ticket_prefix?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loadStoredUser: async () => {
    try {
      const user = await authService.getStoredUser();
      const authenticated = await authService.isAuthenticated();
      if (user && authenticated) {
        set({ user, isAuthenticated: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login({ email, password });
      set({ user: res.data.user as User, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login failed. Check credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
