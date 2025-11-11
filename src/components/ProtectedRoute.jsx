import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('[ProtectedRoute] Checking access:', {
    loading,
    hasCurrentUser: !!currentUser,
    userRole: userProfile?.role,
    allowedRoles
  });

  if (loading) {
    console.log('[ProtectedRoute] Auth loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] No current user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    console.log('[ProtectedRoute] User role not allowed, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[ProtectedRoute] Access granted, rendering children');
  return children;
};
