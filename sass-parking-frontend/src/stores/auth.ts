import { defineStore } from 'pinia';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { authEndpoints, userEndpoints } from '../utils/endpoints';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref<{ id: string; name: string; role: string; tenantId?: string; tenant_id?: string; is_email_verified?: boolean } | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const setAuth = (newToken: string, newUser: { id: string; name: string; role: string; tenantId?: string; tenant_id?: string; is_email_verified?: boolean }) => {
    token.value = newToken;
    newUser.tenantId = newUser.tenantId || newUser.tenant_id;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await authEndpoints.logout();
    } catch {
    }
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('You have been signed out.');
  };

  const resendEmailVerification = async () => {
    try {
      await userEndpoints.resendEmailVerification();
      toast.success('Verification email sent successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
      return false;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await userEndpoints.verifyEmail(token);
      toast.success('Email verified successfully');
      if (user.value) {
        user.value.is_email_verified = true;
        localStorage.setItem('user', JSON.stringify(user.value));
      }
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify email');
      return false;
    }
  };

  const isAuthenticated = () => !!token.value;

  return { token, user, setAuth, logout, isAuthenticated, resendEmailVerification, verifyEmail };
});
