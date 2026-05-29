import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Change this to your backend IP when testing on a device ──────────────────
// Android Emulator uses 10.0.2.2 to reach localhost
// Physical device: use your machine's LAN IP e.g. http://192.168.1.x:5000
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Bearer token + X-Tenant-ID ──────────────────
api.interceptors.request.use(async (config) => {
  const token    = await AsyncStorage.getItem('access_token');
  const tenantId = await AsyncStorage.getItem('tenant_id');

  if (token)    config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;

  return config;
});

// ── Response interceptor: auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newToken = data.data.access_token;
        await AsyncStorage.setItem('access_token', newToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch {
        // Clear storage and let app handle redirect
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('tenant_id');
        await AsyncStorage.removeItem('user');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
