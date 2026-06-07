import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginPayload, LoginResponse } from '../types/api.types';
import { authEndpoints, staffEndpoints } from './endpoints';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const data = await authEndpoints.login(payload);

    // Persist tokens and user info
    await AsyncStorage.setItem('access_token', data.data.access_token);
    await AsyncStorage.setItem('tenant_id', data.data.user.tenant_id ?? '');
    await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

    return data;
  },

  async logout(): Promise<void> {
    try {
      await authEndpoints.logout();
    } catch {
      // ignore — clear locally regardless
    }
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('tenant_id');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser() {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  async getStaffProfile() {
    try {
      const data = await staffEndpoints.getProfile();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch staff profile:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },

  async getTenantId(): Promise<string | null> {
    return await AsyncStorage.getItem('tenant_id');
  },
};
