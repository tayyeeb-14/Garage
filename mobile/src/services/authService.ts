import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'M_ENT_AUTH_TOKEN',
  refreshToken: 'M_ENT_REFRESH_TOKEN',
  user: 'M_ENT_AUTH_USER',
} as const;

const TOKEN_KEY = AUTH_STORAGE_KEYS.accessToken;
const REFRESH_TOKEN_KEY = AUTH_STORAGE_KEYS.refreshToken;
const USER_KEY = AUTH_STORAGE_KEYS.user;
const isWeb = Platform.OS === 'web';

const getWebStorage = () => {
  const storage = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
  return typeof storage?.getItem === 'function' ? storage : null;
};

export interface AuthUser {
  id: string;
  fullName?: string;
  email: string;
  role: string;
}

const safeGetItem = async (key: string) => {
  if (isWeb) {
    try {
      return getWebStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
};

const safeSetItem = async (key: string, value: string) => {
  if (isWeb) {
    try {
      getWebStorage()?.setItem(key, value);
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
      getWebStorage()?.removeItem(key);
      return;
    } catch {
      return;
    }
  }
  return SecureStore.deleteItemAsync(key);
};

const parseJsonPayload = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await safeGetItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseJsonPayload(response);
    const accessToken = payload?.data?.accessToken;

    if (!response.ok || typeof accessToken !== 'string' || !accessToken) {
      return null;
    }

    await safeSetItem(TOKEN_KEY, accessToken);
    return accessToken;
  } catch {
    return null;
  }
};

const requestAuth = async (endpoint: string, body: Record<string, unknown>) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = await parseJsonPayload(response);
    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error('Server unavailable. Please try again shortly.');
      }
      throw new Error(payload.message || 'Authentication failed');
    }

    return payload.data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network unavailable. Please check your connection and try again.');
    }
    throw error;
  }
};

export const storeAuthTokens = async (accessToken: string, refreshToken: string, user?: AuthUser) => {
  console.log('storeAuthTokens', { accessToken: Boolean(accessToken), refreshToken: Boolean(refreshToken), user: Boolean(user) });
  await safeSetItem(TOKEN_KEY, accessToken);
  await safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) {
    await safeSetItem(USER_KEY, JSON.stringify(user));
  } else {
    await safeDeleteItem(USER_KEY);
  }
};

export const getAuthTokens = async () => {
  const accessToken = await safeGetItem(TOKEN_KEY);
  const refreshToken = await safeGetItem(REFRESH_TOKEN_KEY);
  const user = await safeGetItem(USER_KEY);
  console.log('getAuthTokens', { accessToken: Boolean(accessToken), refreshToken: Boolean(refreshToken), user: Boolean(user), keys: Object.values(AUTH_STORAGE_KEYS) });
  return { accessToken, refreshToken, user };
};

export const getStoredAuthUser = async (): Promise<AuthUser | null> => {
  const rawUser = await safeGetItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    await safeDeleteItem(USER_KEY);
    return null;
  }
};

export const clearAuthTokens = async () => {
  console.log('clearAuthTokens:start', { keys: Object.values(AUTH_STORAGE_KEYS) });
  await safeDeleteItem(TOKEN_KEY);
  await safeDeleteItem(REFRESH_TOKEN_KEY);
  console.log('clearAuthTokens:end');
};

export const clearAuthState = async () => {
  console.log('clearAuthState:start', { keys: Object.values(AUTH_STORAGE_KEYS) });
  await clearAuthTokens();
  await safeDeleteItem(USER_KEY);
  console.log('clearAuthState:end', { keys: Object.values(AUTH_STORAGE_KEYS) });
};

export const buildAuthHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await safeGetItem(TOKEN_KEY);
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export const fetchWithAuth = async (input: string, init: RequestInit = {}): Promise<Response> => {
  const attachToken = async (token: string | null) => {
    const headers = new Headers(init.headers ?? {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  let accessToken = await safeGetItem(TOKEN_KEY);
  let response = await fetch(input, {
    ...init,
    headers: await attachToken(accessToken),
  });

  if (response.status !== 401 && response.status !== 403) {
    return response;
  }

  accessToken = await refreshAccessToken();
  if (!accessToken) {
    await clearAuthState();
    return response;
  }

  response = await fetch(input, {
    ...init,
    headers: await attachToken(accessToken),
  });

  if (response.status === 401 || response.status === 403) {
    await clearAuthState();
  }

  return response;
};

export type AuthVerificationResult = 'authenticated' | 'unauthenticated' | 'offline';

export const verifyAuthToken = async (): Promise<AuthVerificationResult> => {
  const { accessToken } = await getAuthTokens();
  if (!accessToken) {
    await clearAuthState();
    return 'unauthenticated';
  }

  try {
    const response = await fetchWithAuth('http://localhost:5000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return 'authenticated';
    }

    if (response.status === 401 || response.status === 403) {
      await clearAuthState();
      return 'unauthenticated';
    }

    return 'offline';
  } catch (error) {
    return 'offline';
  }
};

export const authApi = {
  login: async (email: string, password: string) => {
    return requestAuth('http://localhost:5000/api/auth/customer/login', { email, password });
  },
  register: async (fullName: string, email: string, phone: string, password: string) => {
    return requestAuth('http://localhost:5000/api/auth/customer/register', { fullName, email, phone, password });
  },
};
