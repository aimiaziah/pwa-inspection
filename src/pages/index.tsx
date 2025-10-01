// src/pages/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BaseLayout from '@/layouts/BaseLayout';
import RoleBasedComponent from '@/components/RoleBasedComponent';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import Link from 'next/link';

interface DashboardStats {
  totalInspections: number;
  criticalIssues: number;
  complianceRate: number;
  inspectionsByType: {
    hse: number;
    fire_extinguisher: number;
    first_aid: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: string;
  }>;
  upcomingTasks: Array<{
    task: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission, isRole } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalInspections: 0,
    criticalIssues: 0,
    complianceRate: 0,
    inspectionsByType: { hse: 0, fire_extinguisher: 0, first_aid: 0 },
    recentActivity: [],
    upcomingTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load inspection data based on user role and permissions
      const allInspections = storage.load('inspections', []);
      const now = new Date();
      const timeframeDays = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

      // Filter inspections based on user role
      let userInspections = allInspections;
      if (isRole('inspector')) {
        // Inspectors can only see their own inspections
        userInspections = allInspections.filter(
          (inspection: any) => inspection.inspectedBy === user?.name,
        );
      }

      // Filter by timeframe
      const filteredInspections = userInspections.filter(
        (inspection: any) => new Date(inspection.createdAt) >= cutoffDate,
      );

      const totalInspections = filteredInspections.length;

      // Calculate critical issues
      const criticalIssues = filteredInspections.reduce((count: number, inspection: any) => {
        return (
          count + (inspection.items?.filter((item: any) => item.rating === 'FAIL').length || 0)
        );
      }, 0);

      // Calculate compliance rate
      const totalItems = filteredInspections.reduce((count: number, inspection: any) => {
        return count + (inspection.items?.length || 0);
      }, 0);
      const passedItems = filteredInspections.reduce((count: number, inspection: any) => {
        return (
          count + (inspection.items?.filter((item: any) => item.rating === 'PASS').length || 0)
        );
      }, 0);
      const complianceRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 100;

      // Count by inspection types
      const inspectionsByType = {
        hse: filteredInspections.filter((i: any) => i.type === 'hse' || !i.type).length,
        fire_extinguisher: filteredInspections.filter((i: any) => i.type === 'fire_extinguisher')
          .length,
        first_aid: filteredInspections.filter((i: any) => i.type === 'first_aid').length,
      };

      // Generate recent activity
      const recentActivity = filteredInspections.slice(0, 6).map((inspection: any) => ({
        id: inspection.id,
        action: `${inspection.type?.toUpperCase() || 'HSE'} inspection ${inspection.status}`,
        user: inspection.inspectedBy,
        timestamp: inspection.createdAt,
        type: inspection.status,
      }));

      // Generate upcoming tasks based on role
      const upcomingTasks: Array<{
        task: string;
        dueDate: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      // Add role-specific tasks
      if (isRole('inspector')) {
        // Inspectors see their pending draft inspections
        const draftCount = userInspections.filter((i: any) => i.status === 'draft').length;
        if (draftCount > 0) {
          upcomingTasks.push({
            task: `Complete ${draftCount} draft inspection(s)`,
            dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high',
          });
        }
      }

      if (criticalIssues > 0) {
        upcomingTasks.push({
          task: `Address ${criticalIssues} critical safety issue(s)`,
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'high',
        });
      }

      // Add routine inspection reminders
      upcomingTasks.push({
        task: 'Schedule monthly safety walkthrough',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
      });

      setDashboardStats({
        totalInspections,
        criticalIssues,
        complianceRate,
        inspectionsByType,
        recentActivity,
        upcomingTasks: upcomingTasks.slice(0, 5),
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <BaseLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name}! Here's your inspection overview.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <RoleBasedComponent permissions={['canExportReports']}>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Report
              </button>
            </RoleBasedComponent>
          </div>
        </div>

        {/* Alert for critical issues */}
        {dashboardStats.criticalIssues > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Critical Issues Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  {dashboardStats.criticalIssues} critical safety issue(s) require immediate
                  attention. Immediate action is required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats.totalInspections}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last {selectedTimeframe}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-blue-600"
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
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {dashboardStats.criticalIssues}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0l-8.898 12c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {dashboardStats.complianceRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Safety standards</p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RoleBasedComponent permissions={['canCreateInspections']}>
              <Link
                href="/hse-inspection"
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
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">New HSE Inspection</span>
              </Link>
            </RoleBasedComponent>

            <RoleBasedComponent permissions={['canCreateInspections']}>
              <Link
                href="/fire-extinguisher"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors group"
              >
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200">
                  <svg
                    className="h-4 w-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 1-4 4-4 2.207 0 4 1.793 4 4v6c0 1.657-1.343 3-3 3z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Fire Extinguisher</span>
              </Link>
            </RoleBasedComponent>

            <RoleBasedComponent permissions={['canViewAnalytics']}>
              <Link
                href="/analytics"
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </Link>
            </RoleBasedComponent>

            <RoleBasedComponent roles={['admin']}>
              <Link
                href="/admin"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Admin Panel</span>
              </Link>
            </RoleBasedComponent>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inspection Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspections by Type</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="h-4 w-4 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">HSE Inspections</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats.inspectionsByType.hse}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="h-4 w-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 1-4 4-4 2.207 0 4 1.793 4 4v6c0 1.657-1.343 3-3 3z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Fire Extinguisher</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats.inspectionsByType.fire_extinguisher}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">First Aid</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats.inspectionsByType.first_aid}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {dashboardStats.recentActivity.length > 0 ? (
                dashboardStats.recentActivity.map((activity) => (
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

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
            <div className="space-y-4">
              {dashboardStats.upcomingTasks.length > 0 ? (
                dashboardStats.upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div
                        className={`h-2 w-2 rounded-full mt-2 ${getPriorityColor(task.priority)
                          .replace('text-', 'bg-')
                          .replace('bg-', 'bg-')}`}
                      />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        <span
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                            task.priority,
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No upcoming tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default DashboardPage;
