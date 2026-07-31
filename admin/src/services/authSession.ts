import type { AuthUser } from '../types/auth';
import axios from 'axios';

export const STORAGE_KEYS = {
  token: 'menterprises-admin-token',
  user: 'menterprises-admin-user',
} as const;

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

const AUTH_INVALIDATED_EVENT = 'menterprises-admin:auth-invalidated';
let axiosAuthInterceptorInstalled = false;

const canUseStorage = () => typeof window !== 'undefined';

export const getStoredToken = () => {
  if (!canUseStorage()) return null;
  return localStorage.getItem(STORAGE_KEYS.token) || sessionStorage.getItem(STORAGE_KEYS.token);
};

export const getStoredUser = () => {
  if (!canUseStorage()) return null;
  const stored = localStorage.getItem(STORAGE_KEYS.user) || sessionStorage.getItem(STORAGE_KEYS.user);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
};

export const storeAuthState = (token: string, user: AuthUser, rememberMe: boolean) => {
  if (!canUseStorage()) return;

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    sessionStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem(STORAGE_KEYS.user);
    return;
  }

  sessionStorage.setItem(STORAGE_KEYS.token, token);
  sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
};

export const clearStoredAuth = () => {
  if (!canUseStorage()) return;

  localStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.user);
};

export const invalidateAuthSession = () => {
  clearStoredAuth();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
  }
};

export const installAxiosAuthInterceptor = () => {
  if (axiosAuthInterceptorInstalled) {
    return;
  }

  axiosAuthInterceptorInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        invalidateAuthSession();
        return Promise.reject(new UnauthorizedError());
      }

      return Promise.reject(error);
    },
  );
};

export const listenForAuthInvalidation = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleAuthInvalidation = () => listener();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.token && event.newValue === null) {
      listener();
    }
  };

  window.addEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidation);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidation);
    window.removeEventListener('storage', handleStorage);
  };
};
