import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { AuthUser } from '../types/auth';

const STORAGE_KEYS = {
  token: 'menterprises-admin-token',
  user: 'menterprises-admin-user',
};

const getStoredToken = () => {
  return localStorage.getItem(STORAGE_KEYS.token) || sessionStorage.getItem(STORAGE_KEYS.token);
};

const getStoredUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.user) || sessionStorage.getItem(STORAGE_KEYS.user);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.user);
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile(token);
        setUser(profile);
      } catch {
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              if (payload?.sub && payload?.role) {
                setUser({ id: payload.sub, email: payload.email || '', name: payload.name || '', role: payload.role });
              } else {
                throw new Error('Invalid token payload');
              }
            } else {
              throw new Error('Invalid token format');
            }
          } catch {
            clearStoredAuth();
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login({ email, password });
      const nextToken = result.accessToken;

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.token, nextToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(result.user));
        sessionStorage.removeItem(STORAGE_KEYS.token);
        sessionStorage.removeItem(STORAGE_KEYS.user);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.token, nextToken);
        sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(result.user));
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
      }

      setToken(nextToken);
      setUser(result.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
