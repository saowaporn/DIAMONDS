const PROD_API_BASE_URL = 'https://diamonds-api.vercel.app/api';

export function resolveApiBaseUrl(isBrowser: boolean): string {
  if (!isBrowser) return PROD_API_BASE_URL;

  const win = window as typeof window & { YANIGA_API_BASE_URL?: string };
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return win.YANIGA_API_BASE_URL || (isLocal ? 'http://localhost:3001/api' : PROD_API_BASE_URL);
}
