import { defineStore } from 'pinia';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<{ id: string; name: string; role: string; tenantId?: string; tenant_id?: string } | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const setAuth = (newToken: string, newUser: { id: string; name: string; role: string; tenantId?: string; tenant_id?: string }) => {
    token.value = newToken;
    newUser.tenantId = newUser.tenantId || newUser.tenant_id;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      // Call backend to clear httpOnly cookie
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
      });
    } catch {
      // Silently fail — still clear local state
    }
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('You have been signed out.');
  };

  const isAuthenticated = () => !!token.value;

  return { token, user, setAuth, logout, isAuthenticated };
});
