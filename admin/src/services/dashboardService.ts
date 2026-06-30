const API_BASE_URL = 'http://localhost:5000/api/dashboard';

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const payload = await response.json();
  return payload.data as T;
};

export const dashboardService = {
  getStats: () => request<any>('/stats'),
  getRecentOrders: () => request<any[]>('/recent-orders'),
  getLowStock: () => request<any[]>('/low-stock'),
  getTopServices: () => request<any[]>('/top-services'),
};
