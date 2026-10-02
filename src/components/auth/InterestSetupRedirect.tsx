import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function InterestSetupRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (!loading && user?.user_metadata?.onboarding_pending && pathname !== '/onboarding' && pathname !== '/auth' && pathname !== '/.lovable/oauth/consent') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}