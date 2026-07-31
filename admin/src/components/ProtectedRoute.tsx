import { ReactNode } from 'react';
import LoadingState from './LoadingState';
import { AuthUser } from '../types/auth';

const ProtectedRoute = ({
  children,
  user,
  isLoading,
}: {
  children: ReactNode;
  user: AuthUser | null;
  isLoading: boolean;
}) => {
  if (isLoading) return <LoadingState />;
  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
