import { useCallback, useEffect, useState } from 'react';
import { BannerItem, bannerService } from '../services/bannerService';
import { BookingItem, bookingService } from '../services/bookingService';
import { dashboardService } from '../services/dashboardService';
import { DashboardOrder, DashboardProduct, DashboardServiceItem, DashboardStats } from '../types/dashboard';
import { InventoryItem, PartsDashboardStats, inventoryService } from '../services/inventoryService';
import { OrderItem, orderService } from '../services/orderService';
import { ServiceItem, ServicesDashboardStats, serviceService } from '../services/serviceService';
import { useAuth } from '../context/AuthContext';

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bookings: number;
  orders: number;
  lastActivity: string;
  source: 'Booking' | 'Order';
}

export interface AdminDashboardActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

export interface AdminDashboardData {
  stats: DashboardStats | null;
  bookingStats: Record<string, number> | null;
  serviceStats: ServicesDashboardStats | null;
  inventoryStats: PartsDashboardStats | null;
  overviewOrders: DashboardOrder[];
  recentBookings: BookingItem[];
  orders: OrderItem[];
  services: ServiceItem[];
  inventory: InventoryItem[];
  lowStock: DashboardProduct[];
  topServices: DashboardServiceItem[];
  banners: BannerItem[];
  customers: AdminCustomerRow[];
  activities: AdminDashboardActivity[];
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const emptyData: AdminDashboardData = {
  stats: null,
  bookingStats: null,
  serviceStats: null,
  inventoryStats: null,
  overviewOrders: [],
  recentBookings: [],
  orders: [],
  services: [],
  inventory: [],
  lowStock: [],
  topServices: [],
  banners: [],
  customers: [],
  activities: [],
};

const formatFallbackError = (error: unknown) => (error instanceof Error ? error.message : 'Unable to load dashboard data');

const sortByDateDesc = <T extends { createdAt?: string; bookingDate?: string }>(items: T[], getFallbackDate?: (item: T) => string | undefined) => {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.createdAt ?? getFallbackDate?.(left) ?? 0).getTime();
    const rightDate = new Date(right.createdAt ?? getFallbackDate?.(right) ?? 0).getTime();
    return rightDate - leftDate;
  });
};

const buildCustomers = (bookings: BookingItem[], orders: OrderItem[]): AdminCustomerRow[] => {
  const customers = new Map<string, AdminCustomerRow>();

  const upsertCustomer = (
    customerId: string | undefined,
    name: string,
    email: string,
    phone: string | undefined,
    source: AdminCustomerRow['source'],
    timestamp: string,
    bookingsCount = 0,
    ordersCount = 0,
  ) => {
    const key = customerId || email;
    const existing = customers.get(key);
    const nextTimestamp = existing && new Date(existing.lastActivity).getTime() > new Date(timestamp).getTime()
      ? existing.lastActivity
      : timestamp;

    customers.set(key, {
      id: key,
      name,
      email,
      phone,
      bookings: (existing?.bookings ?? 0) + bookingsCount,
      orders: (existing?.orders ?? 0) + ordersCount,
      lastActivity: nextTimestamp,
      source,
    });
  };

  bookings.forEach((booking) => {
    if (!booking.customer) return;
    upsertCustomer(
      booking.customer._id,
      booking.customer.fullName,
      booking.customer.email,
      booking.customer.phone,
      'Booking',
      booking.createdAt ?? booking.bookingDate,
      1,
      0,
    );
  });

  orders.forEach((order) => {
    if (!order.customer) return;
    upsertCustomer(
      order.customer._id,
      order.customer.fullName,
      order.customer.email,
      order.customer.phone,
      'Order',
      order.createdAt ?? new Date().toISOString(),
      0,
      1,
    );
  });

  return [...customers.values()].sort((left, right) => new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime());
};

const buildActivities = (
  overviewOrders: DashboardOrder[],
  recentBookings: BookingItem[],
  lowStock: DashboardProduct[],
  banners: BannerItem[],
): AdminDashboardActivity[] => {
  const activities: AdminDashboardActivity[] = [];

  overviewOrders.slice(0, 4).forEach((order) => {
    activities.push({
      id: `order-${order._id}`,
      title: `${order.orderId} updated`,
      description: `${order.customer?.fullName ?? 'Customer'} · ${order.status}`,
      timestamp: order.createdAt,
      tone: order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'info',
    });
  });

  recentBookings.slice(0, 4).forEach((booking) => {
    activities.push({
      id: `booking-${booking._id}`,
      title: `${booking.bookingId} booked`,
      description: `${booking.customer?.fullName ?? 'Customer'} · ${booking.status}`,
      timestamp: booking.createdAt ?? booking.bookingDate,
      tone: booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning',
    });
  });

  lowStock.slice(0, 3).forEach((item) => {
    activities.push({
      id: `lowstock-${item._id}`,
      title: `${item.name} needs attention`,
      description: `${item.stockQuantity} remaining · Threshold ${item.lowStockThreshold}`,
      timestamp: new Date().toISOString(),
      tone: 'warning',
    });
  });

  banners.slice(0, 2).forEach((banner) => {
    activities.push({
      id: `banner-${banner._id}`,
      title: `Banner ${banner.title}`,
      description: banner.isActive ? 'Published and visible' : 'Draft or paused',
      timestamp: banner.createdAt ?? new Date().toISOString(),
      tone: banner.isActive ? 'success' : 'info',
    });
  });

  return activities
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 10);
};

export const useAdminDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AdminDashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setData(emptyData);
      setIsLoading(false);
      return;
    }

    const errors: string[] = [];
    const safe = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
      try {
        return await promise;
      } catch (loadError) {
        errors.push(formatFallbackError(loadError));
        return fallback;
      }
    };

    setIsLoading(true);
    setError(null);

    const [
      stats,
      bookingStats,
      serviceStats,
      inventoryStats,
      overviewOrders,
      recentBookingsResponse,
      orderListResponse,
      serviceListResponse,
      inventoryListResponse,
      lowStock,
      topServices,
      banners,
    ] = await Promise.all([
      safe(dashboardService.getStats(), null as DashboardStats | null),
      safe(bookingService.getStats(token), null as Record<string, number> | null),
      safe(serviceService.getDashboardStats(token), null as ServicesDashboardStats | null),
      safe(inventoryService.getDashboardStats(token), null as PartsDashboardStats | null),
      safe(dashboardService.getRecentOrders(), [] as DashboardOrder[]),
      safe(bookingService.list(token, { page: 1, limit: 50 }) as Promise<ListResponse<BookingItem>>, { items: [], total: 0, page: 1, limit: 50, totalPages: 0 }),
      safe(orderService.list(token, { page: 1, limit: 50, sort: 'date-desc' }) as Promise<ListResponse<OrderItem>>, { items: [], total: 0, page: 1, limit: 50, totalPages: 0 }),
      safe(serviceService.list(token, { page: 1, limit: 50, sort: 'date-desc' }) as Promise<ListResponse<ServiceItem>>, { items: [], total: 0, page: 1, limit: 50, totalPages: 0 }),
      safe(inventoryService.list(token, { page: 1, limit: 50, sort: 'date-desc' }) as Promise<ListResponse<InventoryItem>>, { items: [], total: 0, page: 1, limit: 50, totalPages: 0 }),
      safe(dashboardService.getLowStock(), [] as DashboardProduct[]),
      safe(dashboardService.getTopServices(), [] as DashboardServiceItem[]),
      safe(bannerService.list(token), [] as BannerItem[]),
    ]);

    const recentBookings = sortByDateDesc(recentBookingsResponse.items, (item) => item.bookingDate).slice(0, 10);
    const orders = sortByDateDesc(orderListResponse.items).slice(0, 50);
    const services = sortByDateDesc(serviceListResponse.items).slice(0, 50);
    const inventory = sortByDateDesc(inventoryListResponse.items).slice(0, 50);
    const customers = buildCustomers(recentBookings, orders);
    const activities = buildActivities(overviewOrders, recentBookings, lowStock, banners);

    setData({
      stats,
      bookingStats,
      serviceStats,
      inventoryStats,
      overviewOrders,
      recentBookings,
      orders,
      services,
      inventory,
      lowStock,
      topServices,
      banners,
      customers,
      activities,
    });
    setError(errors[0] ?? null);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    ...data,
    isLoading,
    error,
    refresh: loadDashboard,
  };
};
