/**
 * Shared API fetch utility.
 * Automatically attaches JWT token and X-Tenant-ID header from localStorage.
 */

const getToken = (): string => localStorage.getItem('token') || '';

const getUser = (): { tenantId?: string } | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

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

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data as T;
};
