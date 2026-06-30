import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { DashboardOrder, DashboardProduct, DashboardServiceItem, DashboardStats } from '../types/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [lowStock, setLowStock] = useState<DashboardProduct[]>([]);
  const [topServices, setTopServices] = useState<DashboardServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [statsData, recentOrdersData, lowStockData, topServicesData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentOrders(),
          dashboardService.getLowStock(),
          dashboardService.getTopServices(),
        ]);

        setStats(statsData);
        setRecentOrders(recentOrdersData);
        setLowStock(lowStockData);
        setTopServices(topServicesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  return { stats, recentOrders, lowStock, topServices, isLoading, error };
};
