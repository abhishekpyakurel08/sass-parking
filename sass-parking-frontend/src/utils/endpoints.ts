import { apiFetch } from './api';

export const customerEndpoints = {
  getAll: () => apiFetch<{ success: boolean; data: any[] }>('/api/v1/customers'),
  getById: (id: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/customers/${id}`),
  create: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch<{ success: boolean; data: any }>(`/api/v1/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/v1/customers/${id}`, {
    method: 'DELETE',
  }),
  regenerateQr: (id: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/customers/${id}/regenerate-qr`, {
    method: 'POST',
  }),
};

export const parkingEndpoints = {
  checkIn: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/parking/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkOut: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/parking/check-out', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  processPayment: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/parking/process-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  scanTicket: (ticketNumber: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/parking/scan/${ticketNumber}`),
  getTickets: (params?: string) => apiFetch<{ success: boolean; data: any[] }>(`/api/v1/parking/tickets${params || ''}`),
  exportReport: (params: any) => apiFetch('/api/v1/parking/export-report', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  getReceipt: (ticketNumber: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/parking/receipt/${ticketNumber}`),
  handleLostTicket: (ticketNumber: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/parking/lost-ticket/${ticketNumber}`, {
    method: 'POST',
  }),
};

export const analyticsEndpoints = {
  getGlobal: (filter?: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/analytics/global${filter ? `?filter=${filter}` : ''}`),
  getTenant: (filter?: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/analytics/tenant${filter ? `?filter=${filter}` : ''}`),
};

export const authEndpoints = {
  login: (data: any) => apiFetch<{ success: boolean; token: string; user: any }>('/api/v1/user/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  register: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  logout: () => apiFetch<{ success: boolean }>('/api/v1/auth/logout', {
    method: 'POST',
  }),
  refresh: () => apiFetch<{ success: boolean; token: string }>('/api/v1/auth/refresh', {
    method: 'POST',
  }),
};

export const userEndpoints = {
  registerTenantOwner: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/user/auth/onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => apiFetch<{ success: boolean; data: any }>('/api/v1/user/me'),
  resendEmailVerification: () => apiFetch<{ success: boolean }>('/api/v1/user/resend-email-verification', {
    method: 'POST',
  }),
  verifyEmail: (token: string) => apiFetch<{ success: boolean }>('/api/v1/user/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),
};

export const tenantEndpoints = {
  getProfile: () => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/profile'),
  updateProfile: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getStaff: () => apiFetch<{ success: boolean; data: any[] }>('/api/v1/tenant/staff'),
  createStaff: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStaff: (id: string, data: any) => apiFetch<{ success: boolean; data: any }>(`/api/v1/tenant/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStaff: (id: string) => apiFetch<{ success: boolean }>(`/api/v1/tenant/staff/${id}`, {
    method: 'DELETE',
  }),
  regenerateStaffApiKey: (id: string) => apiFetch<{ success: boolean; data: any }>(`/api/v1/tenant/staff/${id}/regenerate-api-key`, {
    method: 'POST',
  }),
  getRates: () => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/rates'),
  updateRates: (data: any) => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/rates', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getTicketHistory: (page?: number) => apiFetch<{ success: boolean; data: any }>(`/api/v1/tenant/tickets${page ? `?page=${page}` : ''}`),
  getRevenueAnalytics: () => apiFetch<{ success: boolean; data: any }>('/api/v1/tenant/analytics/revenue'),
};
