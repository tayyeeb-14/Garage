const API_BASE_URL = 'http://localhost:5000/api/bookings';

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
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
};

export interface BookingItem {
  _id: string;
  bookingId: string;
  customer?: { _id: string; fullName: string; email: string; phone?: string; address?: string };
  vehicle?: { _id: string; plateNumber: string; make: string; modelName: string; year: number; color?: string };
  services?: Array<{ _id: string; name: string; price: number }>;
  bookingDate: string;
  preferredTime: string;
  pickupRequired: boolean;
  address: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export const bookingService = {
  list: (token: string, query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return request<any>(`/?${params.toString()}`, {}, token);
  },
  getById: (token: string, id: string) => request<BookingItem>(`/${id}`, {}, token),
  update: (token: string, id: string, payload: Partial<BookingItem>) => request<BookingItem>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  delete: (token: string, id: string) => request<BookingItem>(`/${id}`, { method: 'DELETE' }, token),
  getStats: (token: string) => request<any>('/stats', {}, token),
};
