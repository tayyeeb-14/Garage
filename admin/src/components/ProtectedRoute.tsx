import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingState from './LoadingState';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!user) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
