export interface DashboardStats {
  customers: number;
  services: number;
  products: number;
  bookings: number;
  orders: number;
  revenue: number;
}

export interface DashboardOrder {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
  };
}

export interface DashboardProduct {
  _id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface DashboardServiceItem {
  _id: string;
  name: string;
  bookings: number;
}
