import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { AuthUser } from '../types/auth';
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  invalidateAuthSession,
  listenForAuthInvalidation,
  storeAuthState,
  UnauthorizedError,
} from '../services/authSession';

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
    const unsubscribe = listenForAuthInvalidation(() => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    });

    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile(token);
        setUser(profile);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setError(null);
          return;
        }

        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          invalidateAuthSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
    return unsubscribe;
  }, [token]);

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login({ email, password });
      const nextToken = result.accessToken;
      storeAuthState(nextToken, result.user, rememberMe);

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
    invalidateAuthSession();
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
