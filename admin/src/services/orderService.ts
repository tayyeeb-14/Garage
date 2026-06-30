const API_BASE_URL = 'http://localhost:5000/api/orders';

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

export interface OrderItem {
  _id: string;
  orderId: string;
  booking?: { _id: string; bookingId: string; bookingDate?: string; preferredTime?: string; address?: string; status?: string };
  customer?: { _id: string; fullName: string; email: string; phone?: string; address?: string };
  vehicle?: { _id: string; plateNumber: string; make: string; modelName: string; year: number; color?: string };
  services?: Array<{ _id: string; name: string; price: number }>;
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'confirmed' | 'in_service' | 'ready_for_pickup' | 'completed' | 'cancelled';
  notes?: string;
}

export const orderService = {
  list: (token: string, query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return request<any>(`/?${params.toString()}`, {}, token);
  },
  getById: (token: string, id: string) => request<OrderItem>(`/${id}`, {}, token),
  update: (token: string, id: string, payload: Partial<OrderItem>) => request<OrderItem>(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token),
  updateStatus: (token: string, id: string, payload: { orderStatus: string; paymentStatus?: string }) => request<OrderItem>(`/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  delete: (token: string, id: string) => request<OrderItem>(`/${id}`, { method: 'DELETE' }, token),
};
