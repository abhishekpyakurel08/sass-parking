import axios from 'axios';
import { API_URL } from '../config/env';
import { getApiKey } from './auth';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const apiKey = await getApiKey();
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});
