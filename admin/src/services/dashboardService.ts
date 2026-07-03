const API_BASE_URL = 'http://localhost:5000/api/dashboard';

const getToken = () => {
  return localStorage.getItem('menterprises-admin-token') || sessionStorage.getItem('menterprises-admin-token');
};

const request = async <T>(path: string): Promise<T> => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

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
