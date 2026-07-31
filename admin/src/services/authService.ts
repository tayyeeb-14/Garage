import { API_BASE } from './apiBase';
import { invalidateAuthSession, UnauthorizedError } from './authSession';

const API_BASE_URL = `${API_BASE}/auth`;

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    throw new UnauthorizedError(payload.message || 'Session expired. Please sign in again.');
  }
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export const authService = {
  login: (payload: { email: string; password: string }) => request<any>('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      invalidateAuthSession();
      throw new UnauthorizedError(payload.message || 'Session expired. Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(payload.message || 'Request failed');
    }

    return payload.data as any;
  },
  logout: () => Promise.resolve(true),
};
