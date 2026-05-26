import api from './api.client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginPayload, LoginResponse } from '../types/api.types';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);

    // Persist tokens and user info
    await AsyncStorage.setItem('access_token', data.data.access_token);
    await AsyncStorage.setItem('tenant_id', data.data.user.tenant_id ?? '');
    await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
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

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
};
