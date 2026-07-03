import axios from 'axios';

export interface InventoryItem {
  _id: string;
  inventoryId: string;
  itemName: string;
  sku: string;
  barcode?: string;
  category: string;
  brand: string;
  compatibleVehicles: string[];
  supplierName: string;
  supplierPhone: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  rackLocation: string;
  image?: string;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE = 'http://localhost:5000/api';

export const inventoryService = {
  async create(token: string, data: Partial<InventoryItem>) {
    const response = await axios.post(`${API_BASE}/inventory`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async list(token: string, params?: Record<string, unknown>) {
    const response = await axios.get<{ data: InventoryListResponse }>(`${API_BASE}/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data.data;
  },

  async getById(token: string, id: string) {
    const response = await axios.get<{ data: InventoryItem }>(`${API_BASE}/inventory/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async update(token: string, id: string, data: Partial<InventoryItem>) {
    const response = await axios.put(`${API_BASE}/inventory/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async delete(token: string, id: string) {
    const response = await axios.delete(`${API_BASE}/inventory/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async stockIn(token: string, id: string, quantity: number) {
    const response = await axios.patch(
      `${API_BASE}/inventory/${id}/stock-in`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },

  async stockOut(token: string, id: string, quantity: number) {
    const response = await axios.patch(
      `${API_BASE}/inventory/${id}/stock-out`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },

  async getLowStock(token: string) {
    const response = await axios.get<{ data: InventoryItem[] }>(`${API_BASE}/inventory/low-stock`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async getOutOfStock(token: string) {
    const response = await axios.get<{ data: InventoryItem[] }>(`${API_BASE}/inventory/out-of-stock`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async getDashboardStats(token: string) {
    const response = await axios.get<{ data: { totalItems: number; totalValue: number; lowStockCount: number; outOfStockCount: number } }>(`${API_BASE}/inventory/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};
