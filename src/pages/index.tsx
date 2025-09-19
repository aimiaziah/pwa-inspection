import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';
import { exportInspectionReport } from '@/utils/reportGenerator';

interface DashboardStats {
  totalInspections: number;
  pendingApprovals: number;
  criticalIssues: number;
  complianceRate: number;
  inspectionsByType: {
    hse: number;
    fire_extinguisher: number;
    first_aid: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  upcomingTasks: Array<{
    task: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

const ManagementDashboard: React.FC = () => {
  const [currentUser] = useState<{ name: string; role: 'inspector' | 'supervisor' | 'admin' }>({
    name: 'Sarah Manager',
    role: 'admin',
  });

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalInspections: 0,
    pendingApprovals: 0,
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
  }, [selectedTimeframe]);

  const loadDashboardData = () => {
    setLoading(true);

    try {
      // Get date range
      const now = new Date();
      const daysBack = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Load all inspection types
      const hseInspections = storage.load('inspections') || [];
      const fireExtinguisherInspections = storage.load('fire_extinguisher_inspections') || [];
      const firstAidInspections = storage.load('first_aid_inspections') || [];

      // Filter by date range
      const filteredHSE = hseInspections.filter((i: any) => new Date(i.createdAt) >= cutoffDate);
      const filteredFire = fireExtinguisherInspections.filter(
        (i: any) => new Date(i.createdAt) >= cutoffDate,
      );
      const filteredFirstAid = firstAidInspections.filter(
        (i: any) => new Date(i.createdAt) >= cutoffDate,
      );

      const totalInspections = filteredHSE.length + filteredFire.length + filteredFirstAid.length;

      // Calculate pending approvals
      const pendingApprovals = [
        ...filteredHSE.filter((i: any) => ['submitted', 'supervisor_approved'].includes(i.status)),
        ...filteredFire.filter((i: any) => ['submitted', 'supervisor_approved'].includes(i.status)),
        ...filteredFirstAid.filter((i: any) =>
          ['submitted', 'supervisor_approved'].includes(i.status),
        ),
      ].length;

      // Calculate critical issues
      let criticalIssues = 0;
      [...filteredHSE, ...filteredFire, ...filteredFirstAid].forEach((inspection: any) => {
        inspection.items.forEach((item: any) => {
          if (
            ['SIN', 'SPS', 'SWO', 'FAIL', 'EXPIRED', 'MISSING', 'DAMAGED'].includes(
              item.rating || item.status,
            )
          ) {
            criticalIssues++;
          }
        });
      });

      // Calculate compliance rate
      let totalRatedItems = 0;
      let compliantItems = 0;

      [...filteredHSE, ...filteredFire, ...filteredFirstAid].forEach((inspection: any) => {
        inspection.items.forEach((item: any) => {
          const rating = item.rating || item.status;
          if (rating && rating !== null) {
            totalRatedItems++;
            if (['G', 'A', 'PASS', 'GOOD'].includes(rating)) {
              compliantItems++;
            }
          }
        });
      });

      const complianceRate =
        totalRatedItems > 0 ? Math.round((compliantItems / totalRatedItems) * 100) : 0;

      // Generate recent activity
      const recentActivity = [];

      // Add recent inspections
      const allInspections = [
        ...filteredHSE.map((i: any) => ({ ...i, type: 'HSE' })),
        ...filteredFire.map((i: any) => ({ ...i, type: 'Fire Extinguisher' })),
        ...filteredFirstAid.map((i: any) => ({ ...i, type: 'First Aid' })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

      allInspections.forEach((inspection) => {
        const issues = inspection.items.filter((item: any) =>
          ['SIN', 'SPS', 'SWO', 'FAIL', 'EXPIRED', 'MISSING', 'DAMAGED'].includes(
            item.rating || item.status,
          ),
        ).length;

        recentActivity.push({
          type: inspection.type,
          message: `${inspection.type} inspection completed at ${
            inspection.location || inspection.building
          }`,
          timestamp: inspection.createdAt,
          severity: issues > 0 ? 'critical' : 'info',
        });

        if (issues > 0) {
          recentActivity.push({
            type: 'Alert',
            message: `${issues} critical issue(s) found in ${inspection.type} inspection`,
            timestamp: inspection.createdAt,
            severity: 'critical',
          });
        }
      });

      // Generate upcoming tasks
      const upcomingTasks = [];

      // Check for expired fire extinguishers
      fireExtinguisherInspections.forEach((inspection: any) => {
        if (inspection.nextServiceDue) {
          const dueDate = new Date(inspection.nextServiceDue);
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 30 && daysDiff > 0) {
            upcomingTasks.push({
              task: `Fire extinguisher service due at ${inspection.location}`,
              dueDate: inspection.nextServiceDue,
              priority: daysDiff <= 7 ? 'high' : daysDiff <= 14 ? 'medium' : 'low',
            });
          }
        }
      });

      // Check for pending approvals as tasks
      if (pendingApprovals > 0) {
        upcomingTasks.push({
          task: `Review ${pendingApprovals} pending inspection approval(s)`,
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
        });
      }

      // Check for critical issues as tasks
      if (criticalIssues > 0) {
        upcomingTasks.push({
          task: `Address ${criticalIssues} critical safety issue(s)`,
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'high',
        });
      }

      setDashboardStats({
        totalInspections,
        pendingApprovals,
        criticalIssues,
        complianceRate,
        inspectionsByType: {
          hse: filteredHSE.length,
          fire_extinguisher: filteredFire.length,
          first_aid: filteredFirstAid.length,
        },
        recentActivity: recentActivity.slice(0, 6),
        upcomingTasks: upcomingTasks.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExport = async (type: 'all' | 'hse' | 'fire' | 'first_aid') => {
    try {
      await exportInspectionReport('all', 'excel', 'summary');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
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
      <BaseLayout title="Management Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Management Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentUser.name}! Here's your inspection overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={() => handleQuickExport('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Data
            </button>
          </div>
        </div>

        {/* Alert Banner for Critical Issues */}
        {dashboardStats.criticalIssues > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">
                  Critical Issues Require Attention
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {dashboardStats.criticalIssues} critical safety issues have been identified across
                  all inspections. Immediate action is required.
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
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {dashboardStats.pendingApprovals}
                </p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                <p className="text-xs text-gray-500 mt-1">Need immediate action</p>
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
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {dashboardStats.complianceRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall average</p>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-emerald-600"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <a
              href="/hse-inspection"
              className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
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
              <span className="text-sm font-medium text-gray-900">HSE Inspection</span>
            </a>

            <a
              href="/fire-extinguisher"
              className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Fire Extinguisher</span>
            </a>

            <a
              href="/first-aid"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
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
              <span className="text-sm font-medium text-gray-900">First Aid Kit</span>
            </a>

            <a
              href="/approval-workflow"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
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
              <span className="text-sm font-medium text-gray-900">Approve</span>
            </a>

            <a
              href="/analytics"
              className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
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
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </a>

            <a
              href="/audit-trail"
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors touch-manipulation"
            >
              <div className="h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-white"
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
              <span className="text-sm font-medium text-gray-900">Audit Trail</span>
            </a>
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
                        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Fire Extinguishers</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats.inspectionsByType.fire_extinguisher}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">First Aid Kits</span>
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
            <div className="space-y-3">
              {dashboardStats.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                dashboardStats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        activity.severity === 'critical'
                          ? 'bg-red-500'
                          : activity.severity === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              {dashboardStats.upcomingTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming tasks</p>
              ) : (
                dashboardStats.upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">System Operational</p>
              <p className="text-xs text-gray-500">All services running normally</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Data Backup</p>
              <p className="text-xs text-gray-500">
                Last backup: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">PWA Ready</p>
              <p className="text-xs text-gray-500">Offline capability enabled</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {(dashboardStats.complianceRate < 85 ||
          dashboardStats.pendingApprovals > 5 ||
          dashboardStats.criticalIssues > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-blue-800">System Recommendations</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {dashboardStats.complianceRate < 85 && (
                      <li>
                        Consider implementing additional safety training programs to improve
                        compliance rates
                      </li>
                    )}
                    {dashboardStats.pendingApprovals > 5 && (
                      <li>
                        Review approval workflow efficiency - {dashboardStats.pendingApprovals}{' '}
                        inspections awaiting approval
                      </li>
                    )}
                    {dashboardStats.criticalIssues > 0 && (
                      <li>
                        Prioritize addressing the {dashboardStats.criticalIssues} critical safety
                        issues identified
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default ManagementDashboard;
