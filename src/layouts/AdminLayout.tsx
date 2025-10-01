import React from 'react';
import Head from 'next/head';
import RoleBasedNav from '@/components/RoleBasedNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Panel' }) => {
  return (
    <>
      <Head>
        <title>{title} - HSE Inspection Platform</title>
        <meta name="description" content="Admin panel for HSE inspection management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <RoleBasedNav />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">{children}</div>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
