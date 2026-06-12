import { create } from 'zustand'

export type UserRole = 'SUPER_ADMIN' | 'TENANT_OWNER' | 'GATE_STAFF';

export type User = {
  id?: string;
  tenant_id?: string | null;
  role: UserRole;
  name: string;
  email?: string;
  slug?: string;
  tenant_name?: string;
  tenant_branding?: {
    logoUrl?: string;
    senderName?: string;
    tagline?: string;
    description?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

type State = {
  user: User | null;
  isAuthenticated: boolean;
  tenantSlug: string | null;
  setUser: (u: User) => void;
  setTenantSlug: (slug: string) => void;
  clearUser: () => void;
}

export const useStore = create<State>((set) => ({
  user: null,
  isAuthenticated: false,
  tenantSlug: null,
  setUser: (u) => set({ user: u, isAuthenticated: true, tenantSlug: u.slug || null }),
  setTenantSlug: (slug) => set({ tenantSlug: slug }),
  clearUser: () => set({ user: null, isAuthenticated: false, tenantSlug: null })
}))
