import { API_BASE } from './apiBase';
import { invalidateAuthSession, UnauthorizedError } from './authSession';

const API_BASE_URL = `${API_BASE}/dashboard`;

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

  if (response.status === 401 || response.status === 403) {
    invalidateAuthSession();
    throw new UnauthorizedError('Session expired. Please sign in again.');
  }

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
