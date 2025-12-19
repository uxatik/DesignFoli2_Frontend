'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return;

    if (requireAuth && !state.user) {
      router.push(redirectTo);
    } else if (!requireAuth && state.user) {
      router.push('/');
    }
  }, [state.user, state.isLoading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If authentication requirements are not met, don't render children
  if ((requireAuth && !state.user) || (!requireAuth && state.user)) {
    return null;
  }

  return <>{children}</>;
};
