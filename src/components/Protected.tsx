import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from './Spinner';
import { CompleteProfile } from './CompleteProfile';

/** Gate that renders children only for signed-in members who've given their name. */
export function Protected({ children }: { children: ReactNode }) {
  const { loading, profileLoaded, session, profile } = useAuth();
  if (loading || (session && !profileLoaded)) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.first_name?.trim()) return <CompleteProfile />;
  return <>{children}</>;
}
