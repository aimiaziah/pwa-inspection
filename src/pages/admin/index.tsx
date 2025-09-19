import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCategories: 5,
    totalItems: 29,
    totalTemplates: 3,
    totalInspections: 0,
    recentActivity: [],
  });

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
              <span className="text-4xl">📁</span>
            </div>
            <Link href="/admin/categories">Manage →</Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checklist Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <span className="text-4xl">📋</span>
            </div>
            <Link href="/admin/items">Manage →</Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTemplates}</p>
              </div>
              <span className="text-4xl">📄</span>
            </div>
            <Link href="/admin/templates">Manage →</Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inspections</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalInspections}</p>
              </div>
              <span className="text-4xl">✅</span>
            </div>
            <Link href="/admin/reports">View Reports →</Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/items/new">➕ Add New Item</Link>
            <Link href="/admin/categories/new">📁 Create Category</Link>
            <Link href="/admin/templates/new">📄 New Template</Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
