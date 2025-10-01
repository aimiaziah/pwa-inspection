// src/components/RoleBasedNav.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

const RoleBasedNav: React.FC = () => {
  const { user, logout, isRole } = useAuth();
  const router = useRouter();

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Form Builder', href: '/admin/form-builder', icon: '📝' },
    { label: 'Notifications', href: '/admin/notifications', icon: '🔔' },
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  const inspectorNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/analytics', icon: '📊' },
    { label: 'Fire Extinguisher', href: '/fire-extinguisher', icon: '🧯' },
    { label: 'First Aid', href: '/first-aid', icon: '🏥' },
    { label: 'HSE Inspection', href: '/hse-inspection', icon: '🔍' },
    { label: 'Saved Reports', href: '/saved', icon: '💾' },
    { label: 'Export Status', href: '/export-status', icon: '📤' },
  ];

  const devsecopsNavItems: NavItem[] = [
    { label: 'Monitoring', href: '/devsecops', icon: '🛡️' },
    { label: 'Security Logs', href: '/devsecops/security-logs', icon: '📋' },
    { label: 'Audit Trail', href: '/devsecops/audit-trail', icon: '🔎' },
  ];

  const getNavItems = (): NavItem[] => {
    if (isRole('admin')) return adminNavItems;
    if (isRole('inspector')) return inspectorNavItems;
    if (isRole('devsecops')) return devsecopsNavItems;
    return [];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin' || href === '/analytics' || href === '/devsecops') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  const getRoleBadgeColor = () => {
    if (isRole('admin')) return 'bg-purple-100 text-purple-800';
    if (isRole('inspector')) return 'bg-green-100 text-green-800';
    if (isRole('devsecops')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                HSE Inspection
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActiveRoute(item.href)
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.department}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor()}`}
              >
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden pb-3">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActiveRoute(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.department}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor()}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RoleBasedNav;
