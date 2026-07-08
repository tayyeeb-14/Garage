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
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  weight?: number;
  rackLocation: string;
  image?: string;
  galleryImages?: string[];
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  isActive: boolean;
  isFeatured: boolean;
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

export interface PartsDashboardStats {
  totalItems: number;
  activeItems: number;
  totalCategories: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const PART_CATEGORIES = [
  'Engine Oil',
  'Brake Parts',
  'Battery',
  'Tyres',
  'Filters',
  'Lights',
  'Accessories',
];

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const inventoryService = {
  async create(token: string, data: FormData) {
    const response = await axios.post(`${API_BASE}/inventory`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data as InventoryItem;
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

  async update(token: string, id: string, data: FormData) {
    const response = await axios.put(`${API_BASE}/inventory/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data as InventoryItem;
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
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.data;
  },

  async stockOut(token: string, id: string, quantity: number) {
    const response = await axios.patch(
      `${API_BASE}/inventory/${id}/stock-out`,
      { quantity },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.data;
  },

  async setStockStatus(token: string, id: string, status: 'In Stock' | 'Out Of Stock') {
    const response = await axios.patch(
      `${API_BASE}/inventory/${id}/stock-status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.data;
  },

  async getCategories(token: string) {
    const response = await axios.get<{ data: string[] }>(`${API_BASE}/inventory/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async getBrands(token: string) {
    const response = await axios.get<{ data: string[] }>(`${API_BASE}/inventory/brands`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const response = await axios.get<{ data: PartsDashboardStats }>(`${API_BASE}/inventory/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};
