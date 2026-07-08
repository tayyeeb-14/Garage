import { fetchWithAuth } from './authService';

export interface Vehicle {
  _id: string;
  plateNumber: string;
  make: string;
  modelName: string;
  year?: number;
  lastServiceDate?: string;
}

export interface PublicService {
  _id: string;
  name: string;
  description?: string;
  price: number;
  thumbnailImage?: string;
  category?: string;
  featured?: boolean;
  popular?: boolean;
  rating?: number;
  bookings?: number;
  estimatedDuration?: number;
}

export interface DashboardProduct {
  _id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  image?: string;
  brand?: string;
}

export interface PublicPart {
  _id: string;
  inventoryId: string;
  itemName: string;
  sku: string;
  category: string;
  brand: string;
  compatibleVehicles: string[];
  sellingPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  unit: string;
  image?: string;
  galleryImages?: string[];
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  isFeatured: boolean;
}

export interface DashboardOrder {
  _id: string;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt?: string;
  booking?: {
    bookingId?: string;
    bookingDate?: string;
    preferredTime?: string;
    address?: string;
    status?: string;
  };
  vehicle?: {
    plateNumber?: string;
    make?: string;
    modelName?: string;
  };
  customer?: {
    fullName?: string;
  };
  services?: Array<{ name?: string; price?: number }>;
}

export interface Profile {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface DashboardBooking {
  _id: string;
  bookingId: string;
  status: string;
  bookingDate: string;
  preferredTime: string;
  address: string;
  vehicle?: {
    plateNumber?: string;
    make?: string;
    modelName?: string;
  };
  services?: Array<{ name?: string }>;
}

export interface CustomerBooking {
  _id: string;
  bookingId: string;
  status: string;
  bookingDate: string;
  preferredTime: string;
  pickupRequired: boolean;
  address: string;
  notes?: string;
  vehicle?: {
    _id?: string;
    plateNumber?: string;
    make?: string;
    modelName?: string;
  };
  services?: Array<{ _id?: string; name?: string; price?: number }>;
}

export interface DashboardStats {
  customers: number;
  services: number;
  products: number;
  bookings: number;
  orders: number;
  revenue: number;
}

const API_BASE = 'http://localhost:5000/api';

export const fetchUserProfile = async (): Promise<Profile | null> => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    return payload.data ?? null;
  } catch {
    return null;
  }
};

export const fetchPublicServices = async (): Promise<PublicService[]> => {
  try {
    const response = await fetch(`${API_BASE}/services/public`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};

export const fetchTopServices = async (): Promise<PublicService[]> => {
  try {
    const response = await fetch(`${API_BASE}/dashboard/top-services`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};

export const fetchLowStockProducts = async (): Promise<DashboardProduct[]> => {
  try {
    const response = await fetch(`${API_BASE}/dashboard/low-stock`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};

export const fetchPublicParts = async (params?: Record<string, string | number | boolean>): Promise<PublicPart[]> => {
  try {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.set(key, String(value));
        }
      });
    }
    const response = await fetch(`${API_BASE}/inventory/public?${query.toString()}`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data?.items ?? [];
  } catch {
    return [];
  }
};

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await fetch(`${API_BASE}/vehicles`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};

export const fetchRecentOrders = async (): Promise<DashboardOrder[]> => {
  try {
    const response = await fetch(`${API_BASE}/dashboard/recent-orders`);
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};

export const fetchDashboardStats = async (): Promise<DashboardStats | null> => {
  try {
    const response = await fetch(`${API_BASE}/dashboard/stats`);
    if (!response.ok) {
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? null;
  } catch {
    return null;
  }
};

export const fetchCustomerBookings = async (customerId: string): Promise<CustomerBooking[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE}/bookings/customer/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};
