import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { AuthUser } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('menterprises-admin-token') || sessionStorage.getItem('menterprises-admin-token');
  });
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
        // If profile fetch fails (role mismatch or other), try to restore user from stored data
        const stored = localStorage.getItem('menterprises-admin-user') || sessionStorage.getItem('menterprises-admin-user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(null);
          }
        } else {
          // Attempt to decode token payload for minimal user info
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              // base64 decode
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              setUser({ id: payload.sub, email: payload.email || '', name: payload.name || '', role: payload.role } as any);
            } else {
              setUser(null);
            }
          } catch {
            // invalid token - remove it
            localStorage.removeItem('menterprises-admin-token');
            sessionStorage.removeItem('menterprises-admin-token');
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
        localStorage.setItem('menterprises-admin-token', nextToken);
        sessionStorage.removeItem('menterprises-admin-token');
        // persist user
        try { localStorage.setItem('menterprises-admin-user', JSON.stringify(result.user)); } catch {}
      } else {
        sessionStorage.setItem('menterprises-admin-token', nextToken);
        localStorage.removeItem('menterprises-admin-token');
        try { sessionStorage.setItem('menterprises-admin-user', JSON.stringify(result.user)); } catch {}
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
    localStorage.removeItem('menterprises-admin-token');
    sessionStorage.removeItem('menterprises-admin-token');
    localStorage.removeItem('menterprises-admin-user');
    sessionStorage.removeItem('menterprises-admin-user');
    setToken(null);
    setUser(null);
  };

  return { user, token, isLoading, error, login, logout };
};
