import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import logo from '../../assests/logo.png';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Wrench, 
  Building2, 
  Settings, 
  BarChart3,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuthStore();

  const getLinks = () => {
    switch (user?.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
          { name: 'My Complaints', to: '/student/complaints', icon: FileText },
        ];
      case 'WORKER':
        return [
          { name: 'Dashboard', to: '/worker/dashboard', icon: LayoutDashboard },
          { name: 'Job Board', to: '/worker/jobs', icon: Wrench },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Complaints', to: '/admin/complaints', icon: FileText },
          { name: 'Users', to: '/admin/users', icon: Users },
          { name: 'Rooms', to: '/admin/rooms', icon: Building2 },
          { name: 'Categories', to: '/admin/categories', icon: Settings },
        ];
      case 'SUPERVISOR':
        return [
          { name: 'Dashboard', to: '/supervisor/dashboard', icon: LayoutDashboard },
          { name: 'Escalations', to: '/supervisor/escalations', icon: AlertTriangle },
          { name: 'Worker Analytics', to: '/supervisor/workers', icon: Users },
        ];
      case 'MANAGEMENT':
        return [
          { name: 'Global Dashboard', to: '/management/dashboard', icon: LayoutDashboard },
          { name: 'Analytics', to: '/management/analytics', icon: BarChart3 },
          { name: 'Reports', to: '/management/reports', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex fixed top-0 left-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <img src={logo} alt="HostelDesk" className="h-16 w-auto scale-[1.35] origin-left object-contain" />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
            {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
