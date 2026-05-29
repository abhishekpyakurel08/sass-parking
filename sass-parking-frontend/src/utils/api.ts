/**
 * Shared API fetch utility.
 * Automatically attaches JWT token and X-Tenant-ID header from localStorage.
 *
 * NOTE: BASE_URL is required so that production static builds (where the Vite
 * dev proxy is NOT running) send requests to the real backend rather than the
 * static file server (which returns 405 on POST/PATCH/DELETE requests).
 */

// Absolute backend origin — falls back to the known production URL.
const BASE_URL: string =
  (import.meta as any).env?.VITE_API_URL ?? 'https://parking-backend.tecobit.cloud';

const getToken = (): string => localStorage.getItem('token') || '';

const getUser = (): { tenantId?: string } | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

/**
 * Resolve a path to a full URL.
 * - If the url is already absolute (starts with http/https), use it as-is.
 * - If it's relative (starts with /), prepend BASE_URL.
 */
const resolveUrl = (url: string): string =>
  url.startsWith('http') ? url : `${BASE_URL}${url}`;

export const apiFetch = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const user = getUser();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (user?.tenantId) headers['X-Tenant-ID'] = user.tenantId;

  const res = await fetch(resolveUrl(url), { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data as T;
};
