const API_BASE_URL = 'http://localhost:5000/api/auth';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export const authService = {
  login: (payload: { email: string; password: string }) => request<any>('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: (token: string) => request<any>('/profile', { headers: { Authorization: `Bearer ${token}` } }),
  logout: () => Promise.resolve(true),
};
