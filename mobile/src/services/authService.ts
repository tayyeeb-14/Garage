import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'M_ENT_AUTH_TOKEN';
const REFRESH_TOKEN_KEY = 'M_ENT_REFRESH_TOKEN';
const isWeb = Platform.OS === 'web';

const safeGetItem = async (key: string) => {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
};

const safeSetItem = async (key: string, value: string) => {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      return;
    }
  }
  return SecureStore.setItemAsync(key, value);
};

const safeDeleteItem = async (key: string) => {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch {
      return;
    }
  }
  return SecureStore.deleteItemAsync(key);
};

export const storeAuthTokens = async (accessToken: string, refreshToken: string) => {
  await safeSetItem(TOKEN_KEY, accessToken);
  await safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAuthTokens = async () => {
  const accessToken = await safeGetItem(TOKEN_KEY);
  const refreshToken = await safeGetItem(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
};

export const clearAuthTokens = async () => {
  await safeDeleteItem(TOKEN_KEY);
  await safeDeleteItem(REFRESH_TOKEN_KEY);
};

export const buildAuthHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await safeGetItem(TOKEN_KEY);
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export type AuthVerificationResult = 'authenticated' | 'unauthenticated' | 'offline';

export const verifyAuthToken = async (): Promise<AuthVerificationResult> => {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    await clearAuthTokens();
    return 'unauthenticated';
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return 'authenticated';
    }

    if (response.status === 401 || response.status === 403) {
      await clearAuthTokens();
      return 'unauthenticated';
    }

    return 'offline';
  } catch (error) {
    return 'offline';
  }
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/auth/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Unable to login');
    }
    return payload.data;
  },
  register: async (fullName: string, email: string, phone: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/auth/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Unable to register');
    }
    return payload.data;
  },
};
