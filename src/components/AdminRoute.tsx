import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from './Spinner';

/** Like Protected, but only for KC (is_admin); others are sent to /this-week. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const archive = useLocation().pathname.startsWith('/archive');
  const { loading, profileLoaded, session, profile } = useAuth();
  if (loading || (session && !profileLoaded)) return <FullPageSpinner />;
  if (!session) return <Navigate to={archive ? '/archive/login' : '/login'} replace />;
  if (!profile?.is_admin) return <Navigate to={archive ? '/archive/this-week' : '/'} replace />;
  return <>{children}</>;
}
