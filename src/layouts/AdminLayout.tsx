import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
  const router = useRouter();

  const adminMenu = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/categories', label: 'Categories', icon: '📁' },
    { href: '/admin/items', label: 'Checklist Items', icon: '📋' },
    { href: '/admin/templates', label: 'Templates', icon: '📄' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <>
      <Head>
        <title>{title} - Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <header className="bg-gray-900 text-white">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">🔧 Admin Panel</h1>
              <Link href="/">← Back to App</Link>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white shadow-md min-h-screen">
            <nav className="p-4">
              {adminMenu.map((item) => (
                <Link key={item.href} href={item.href}>
                  {/* ${
                      router.pathname === item.href
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `} */}

                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
