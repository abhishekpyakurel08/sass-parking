
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL;
const MODE = (import.meta as any).env?.MODE ?? 'development';
// If VITE_API_FORCE === 'true' we will use the provided VITE_API_URL even in dev.
// By default in development we prefer the Vite proxy (relative paths) to avoid CORS issues.
const VITE_API_FORCE = String((import.meta as any).env?.VITE_API_FORCE || '').toLowerCase() === 'true';

const BASE_URL: string = (MODE === 'development' && !VITE_API_FORCE) ? '' : (VITE_API_URL ?? 'https://parking-backend.tecobit.cloud');

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

  // Helper to safely read JSON (some endpoints may return empty body)
  const safeJson = async (res: Response) => {
    try { return await res.json(); } catch { return null; }
  };

  // First attempt: configured BASE_URL (absolute or proxy-ready)
  try {
    const res = await fetch(resolveUrl(url), { ...options, headers });
    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(data?.message || `HTTP error ${res.status}`);
    }
    return data as T;
  } catch (err: any) {
    // If this was a network-level failure (e.g. ECONNREFUSED) and we are in dev
    // and BASE_URL is an absolute http(s) address, retry using a relative path
    // so the Vite dev-server proxy ( /api -> target ) can forward the request.
    const isNetworkError = err instanceof TypeError || /Failed to fetch|NetworkError|ECONNREFUSED/i.test(String(err));
    const usedAbsolute = !!BASE_URL && /^https?:\/\//i.test(BASE_URL);

    if (isNetworkError && usedAbsolute && MODE === 'development') {
      try {
        const res2 = await fetch(url, { ...options, headers }); // relative path, hits Vite proxy
        const data2 = await safeJson(res2);
        if (!res2.ok) {
          throw new Error(data2?.message || `HTTP error ${res2.status}`);
        }
        return data2 as T;
      } catch (err2: any) {
        throw new Error(`Network error: ${err2.message || String(err2)} (attempted ${BASE_URL} and proxy)`);
      }
    }

    // Otherwise rethrow a clearer error
    throw new Error(err.message || 'Network error');
  }
};
