const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const request = async <T>(path: string, options: RequestInit = {}) => {
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

export interface CategoryItem {
  _id: string;
  name: string;
}

export const categoryService = {
  list: (token: string) => request<CategoryItem[]>('/categories', {
    headers: { Authorization: `Bearer ${token}` },
  }),
};
