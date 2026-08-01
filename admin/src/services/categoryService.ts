import { API_BASE } from './apiBase';
import { invalidateAuthSession, UnauthorizedError } from './authSession';

const API_BASE_URL = `${API_BASE}/categories`;

const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    invalidateAuthSession();
    throw new UnauthorizedError('Session expired. Please sign in again.');
  }
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  type?: 'services' | 'inventory' | 'both';
  isActive?: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryListResponse {
  items: CategoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const categoryService = {
  list: (token: string, query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return request<CategoryListResponse>(`/?${params.toString()}`, {}, token);
  },
  getById: (token: string, id: string) => request<CategoryItem>(`/${id}`, {}, token),
  create: (token: string, payload: Partial<CategoryItem>) => request<CategoryItem>('/', { method: 'POST', body: JSON.stringify(payload) }, token),
  update: (token: string, id: string, payload: Partial<CategoryItem>) => request<CategoryItem>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  delete: (token: string, id: string) => request<CategoryItem>(`/${id}`, { method: 'DELETE' }, token),
};
