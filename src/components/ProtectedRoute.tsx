import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a route requires specific roles, ensure the user has a role and it's allowed.
  // If role is missing, force the user to login again (session may be invalid or profile missing).
  if (allowedRoles) {
    if (!role) {
      console.debug('[ProtectedRoute] user has no role, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(role)) {
      console.debug('[ProtectedRoute] user role not allowed, redirecting to unauthorized', role);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
