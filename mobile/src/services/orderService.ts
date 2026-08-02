import { API_URL } from '../config/api';
import { fetchWithAuth } from './authService';

export interface OrderPartPayload {
  item: string;
  quantity: number;
  price?: number;
  name?: string;
  sku?: string;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  booking?: Record<string, unknown>;
  customer?: { _id?: string; fullName?: string; email?: string; phone?: string; address?: string };
  vehicle?: { plateNumber?: string; make?: string; modelName?: string; year?: number; color?: string };
  services?: Array<{ _id?: string; name?: string; price?: number }>;
  parts?: Array<{
    item: { _id: string; itemName: string; sku?: string; brand?: string; image?: string };
    quantity: number;
    price: number;
    name?: string;
    sku?: string;
  }>;
  shippingAddress?: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'confirmed' | 'in_service' | 'ready_for_pickup' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const orderService = {
  createOrder: async (payload: {
    parts: OrderPartPayload[];
    shippingAddress: string;
    paymentMethod: 'cash' | 'upi' | 'card';
    notes?: string;
    totalAmount: number;
  }): Promise<OrderItem> => {
    const response = await fetchWithAuth(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(body.message || 'Unable to place order');
    }
    return body.data as OrderItem;
  },
  listCustomerOrders: async (): Promise<OrderItem[]> => {
    const response = await fetchWithAuth(`${API_URL}/orders/customer/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(body.message || 'Unable to load orders');
    }
    return body.data as OrderItem[];
  },
  getOrderById: async (id: string): Promise<OrderItem> => {
    const response = await fetchWithAuth(`${API_URL}/orders/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(body.message || 'Unable to load order details');
    }
    return body.data as OrderItem;
  },
};
