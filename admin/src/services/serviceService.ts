const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/services';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: isFormData
      ? { ...(options.headers || {}) }
      : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  estimatedDuration?: number;
  thumbnailImage?: string;
  galleryImages?: string[];
  isActive?: boolean;
}

export const serviceService = {
  list: (token: string, query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return request<any>(`/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getById: (token: string, id: string) => request<ServiceItem>(`/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  create: (token: string, payload: FormData | Partial<ServiceItem>) => request<ServiceItem>('/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload as BodyInit,
  }),
  update: (token: string, id: string, payload: FormData | Partial<ServiceItem>) => request<ServiceItem>(`/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: payload as BodyInit,
  }),
  delete: (token: string, id: string) => request<ServiceItem>(`/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),
};
