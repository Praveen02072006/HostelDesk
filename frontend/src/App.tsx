import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Login = React.lazy(() => import('./pages/auth/Login'));

// Student Pages
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const StudentComplaints = React.lazy(() => import('./pages/student/StudentComplaints'));
const NewComplaint = React.lazy(() => import('./pages/student/NewComplaint'));
const StudentComplaintDetail = React.lazy(() => import('./pages/student/StudentComplaintDetail'));

// Worker Pages
const WorkerDashboard = React.lazy(() => import('./pages/worker/WorkerDashboard'));
const WorkerJobBoard = React.lazy(() => import('./pages/worker/WorkerJobBoard'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminComplaints = React.lazy(() => import('./pages/admin/AdminComplaints'));
const ManageUsers = React.lazy(() => import('./pages/admin/ManageUsers'));
const Rooms = React.lazy(() => import('./pages/admin/Rooms'));
const ManageCategories = React.lazy(() => import('./pages/admin/ManageCategories'));

// Supervisor Pages
const SupervisorDashboard = React.lazy(() => import('./pages/supervisor/SupervisorDashboard'));
const Escalations = React.lazy(() => import('./pages/supervisor/Escalations'));
const WorkerAnalytics = React.lazy(() => import('./pages/supervisor/WorkerAnalytics'));

// Management Pages
const ManagementDashboard = React.lazy(() => import('./pages/management/ManagementDashboard'));
const Analytics = React.lazy(() => import('./pages/management/Analytics'));
const Reports = React.lazy(() => import('./pages/management/Reports'));

// Error Pages
const NotFound = React.lazy(() => import('./pages/error/NotFound'));

// Universal Pages
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const HelpCenter = React.lazy(() => import('./pages/support/HelpCenter'));
const FAQ = React.lazy(() => import('./pages/support/FAQ'));
const Privacy = React.lazy(() => import('./pages/support/Privacy'));
const Terms = React.lazy(() => import('./pages/support/Terms'));

// Search Page
const SearchPage = React.lazy(() => import('./pages/search/SearchPage'));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
  </div>
);

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getHomeRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'STUDENT': return '/student/dashboard';
      case 'WORKER': return '/worker/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      case 'SUPERVISOR': return '/supervisor/dashboard';
      case 'MANAGEMENT': return '/management/dashboard';
      default: return '/login';
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Login />} 
        />

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          {/* Universal Protected Routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/complaints" element={<StudentComplaints />} />
            <Route path="/student/complaints/new" element={<NewComplaint />} />
            <Route path="/student/complaints/:id" element={<StudentComplaintDetail />} />
          </Route>

          {/* Worker Routes */}
          <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            <Route path="/worker/jobs" element={<WorkerJobBoard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/rooms" element={<Rooms />} />
            <Route path="/admin/categories" element={<ManageCategories />} />
          </Route>

          {/* Supervisor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['SUPERVISOR']} />}>
            <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
            <Route path="/supervisor/escalations" element={<Escalations />} />
            <Route path="/supervisor/workers" element={<WorkerAnalytics />} />
          </Route>

          {/* Management Routes */}
          <Route element={<ProtectedRoute allowedRoles={['MANAGEMENT']} />}>
            <Route path="/management/dashboard" element={<ManagementDashboard />} />
            <Route path="/management/analytics" element={<Analytics />} />
            <Route path="/management/reports" element={<Reports />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
