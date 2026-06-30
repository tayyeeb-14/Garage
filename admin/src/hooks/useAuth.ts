import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { AuthUser } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('speedx-admin-token'));
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
        localStorage.removeItem('speedx-admin-token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login({ email, password });
      const nextToken = result.accessToken;
      if (rememberMe) {
        localStorage.setItem('speedx-admin-token', nextToken);
      } else {
        sessionStorage.setItem('speedx-admin-token', nextToken);
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
    localStorage.removeItem('speedx-admin-token');
    sessionStorage.removeItem('speedx-admin-token');
    setToken(null);
    setUser(null);
  };

  return { user, token, isLoading, error, login, logout };
};
