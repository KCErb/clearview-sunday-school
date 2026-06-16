import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from './Spinner';

/** Gate that renders children only for signed-in users; otherwise sends to /login. */
export function Protected({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
