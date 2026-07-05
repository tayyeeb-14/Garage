const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/banners';

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: isFormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  ctaText?: string;
  ctaAction?: 'service' | 'parts' | 'external';
  targetId?: string;
  targetUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const bannerService = {
  list: (token: string) => request<BannerItem[]>('/', { headers: { Authorization: `Bearer ${token}` } }),
  create: (token: string, payload: FormData) => request<BannerItem>('/', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: payload as BodyInit }),
  update: (token: string, id: string, payload: FormData) => request<BannerItem>(`/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: payload as BodyInit }),
  delete: (token: string, id: string) => request<BannerItem>(`/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
};
