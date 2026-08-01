import { API_BASE } from './apiBase';
import { invalidateAuthSession, UnauthorizedError } from './authSession';

const API_BASE_URL = `${API_BASE}/customers`;

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

export interface CustomerItem {
  _id: string;
  customerId: string;
  fullName: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  source?: string;
  totalBookings?: number;
  totalOrders?: number;
  totalSpent?: number;
  lastBooking?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerListResponse {
  items: CustomerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalBookings: number;
  totalOrders: number;
  averageSpent: number;
}

export const customerService = {
  list: (token: string, query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return request<CustomerListResponse>(`/?${params.toString()}`, {}, token);
  },
  getById: (token: string, id: string) => request<CustomerItem>(`/${id}`, {}, token),
  create: (token: string, payload: Partial<CustomerItem>) => request<CustomerItem>('/', { method: 'POST', body: JSON.stringify(payload) }, token),
  update: (token: string, id: string, payload: Partial<CustomerItem>) => request<CustomerItem>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  delete: (token: string, id: string) => request<CustomerItem>(`/${id}`, { method: 'DELETE' }, token),
  getStats: (token: string) => request<CustomerStats>('/stats', {}, token),
};
