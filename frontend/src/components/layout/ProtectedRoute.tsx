import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    const dashboardRoutes: Record<string, string> = {
      STUDENT: '/student/dashboard',
      WORKER: '/worker/dashboard',
      ADMIN: '/admin/dashboard',
      SUPERVISOR: '/supervisor/dashboard',
      MANAGEMENT: '/management/dashboard',
    };
    
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};
