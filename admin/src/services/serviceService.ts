import axios from 'axios';

export interface ServiceFaqItem {
  question: string;
  answer: string;
}

export interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  estimatedDuration?: number;
  thumbnailImage?: string;
  galleryImages?: string[];
  includes?: string[];
  faq?: ServiceFaqItem[];
  compatibleVehicles?: string[];
  relatedServices?: string[];
  rating?: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListResponse {
  items: ServiceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServicesDashboardStats {
  totalServices: number;
  activeServices: number;
  featuredServices: number;
  totalCategories: number;
  averageRating: number;
  catalogValue: number;
}

export const SERVICE_CATEGORIES = [
  'Full Service',
  'Oil Change',
  'Brake Service',
  'Battery',
  'Engine',
  'Tyre Service',
  'Washing & Detailing',
  'Pickup & Drop',
  'Diagnostics',
  'Accessories',
];

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const serviceService = {
  async list(token: string, params?: Record<string, unknown>) {
    const response = await axios.get<{ data: ServiceListResponse }>(`${API_BASE}/services`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data.data;
  },

  async getById(token: string, id: string) {
    const response = await axios.get<{ data: ServiceItem }>(`${API_BASE}/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async create(token: string, data: FormData) {
    const response = await axios.post(`${API_BASE}/services`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data as ServiceItem;
  },

  async update(token: string, id: string, data: FormData) {
    const response = await axios.put(`${API_BASE}/services/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data as ServiceItem;
  },

  async delete(token: string, id: string) {
    const response = await axios.delete(`${API_BASE}/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async getCategories(token: string) {
    const response = await axios.get<{ data: string[] }>(`${API_BASE}/services/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  async getDashboardStats(token: string) {
    const response = await axios.get<{ data: ServicesDashboardStats }>(`${API_BASE}/services/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};
