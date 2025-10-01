// src/pages/admin/index.tsx - Fixed Admin Dashboard
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCategories: number;
  totalChecklistItems: number;
  totalInspections: number;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCategories: 0,
    totalChecklistItems: 0,
    totalInspections: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    try {
      // Load users
      const users = storage.load('users', []);
      const activeUsers = users.filter((u: any) => u.isActive);

      // Load checklist data
      const categories = storage.load('checklist_categories', []);
      const checklistItems = storage.load('checklist_items', []);

      // Load inspection data
      const hseInspections = storage.load('inspections', []);
      const fireInspections = storage.load('fire_extinguisher_inspections', []);
      const firstAidInspections = storage.load('first_aid_inspections', []);
      const totalInspections =
        hseInspections.length + fireInspections.length + firstAidInspections.length;


      // Generate recent activity
      const allInspections = [
        ...hseInspections.map((i: any) => ({ ...i, type: 'HSE' })),
        ...fireInspections.map((i: any) => ({ ...i, type: 'Fire Extinguisher' })),
        ...firstAidInspections.map((i: any) => ({ ...i, type: 'First Aid' })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((inspection) => ({
          id: inspection.id,
          action: `${inspection.type} inspection ${inspection.status}`,
          user: inspection.inspectedBy,
          timestamp: inspection.createdAt,
          type: 'inspection',
        }));

      setStats({
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalCategories: categories.length,
        totalChecklistItems: checklistItems.length,
        totalInspections,
        recentActivity: allInspections,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Dashboard">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">System overview and management</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-green-600">{stats.activeUsers} active</p>
                </div>
                <span className="text-4xl">👥</span>
              </div>
              <Link
                href="/admin/users"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                Manage Users →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Checklist Items</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalChecklistItems}</p>
                  <p className="text-sm text-blue-600">{stats.totalCategories} categories</p>
                </div>
                <span className="text-4xl">📋</span>
              </div>
              <Link
                href="/admin/checklist-items"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                Manage Items →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalInspections}</p>
                  <p className="text-sm text-gray-600">All time</p>
                </div>
                <span className="text-4xl">🔍</span>
              </div>
              <Link
                href="/reports"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                View Reports →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Categories</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalCategories}</p>
                  <p className="text-sm text-gray-600">Inspection types</p>
                </div>
                <span className="text-4xl">📂</span>
              </div>
              <Link
                href="/admin/checklist-items"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                Manage Categories →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Add New User</span>
              </Link>

              <Link
                href="/admin/checklist-items"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Add Checklist Item</span>
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200">
                  <svg
                    className="h-4 w-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
              </Link>

              <button
                onClick={loadDashboardData}
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200">
                  <svg
                    className="h-4 w-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Refresh Data</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">
                          by {activity.user} • {getRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">User System</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Online</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Checklist System</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Online</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Inspection Data</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Online</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Storage System</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Online</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </ProtectedRoute>
);
};

export default AdminDashboard;
