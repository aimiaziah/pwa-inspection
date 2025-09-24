import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';

interface AnalyticsData {
  totalInspections: number;
  completionRate: number;
  complianceRate: number;
  trendData: {
    date: string;
    inspections: number;
    compliance: number;
  }[];
  categoryBreakdown: {
    category: string;
    total: number;
    good: number;
    acceptable: number;
    poor: number;
    issues: number;
  }[];
  statusBreakdown: {
    draft: number;
    submitted: number;
    supervisor_approved: number;
    admin_approved: number;
    completed: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [selectedInspectionType, setSelectedInspectionType] = useState<
    'all' | 'hse' | 'fire_extinguisher' | 'first_aid'
  >('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedInspectionType]);

  const loadAnalyticsData = () => {
    setLoading(true);

    try {
      // Get date range
      const now = new Date();
      const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      let inspections: any[] = [];

      // Load inspections based on selected type
      if (selectedInspectionType === 'all' || selectedInspectionType === 'hse') {
        const hseInspections = storage.load('inspections') || [];
        inspections = [...inspections, ...hseInspections.map((i: any) => ({ ...i, type: 'hse' }))];
      }

      if (selectedInspectionType === 'all' || selectedInspectionType === 'fire_extinguisher') {
        const fireInspections = storage.load('fire_extinguisher_inspections') || [];
        inspections = [
          ...inspections,
          ...fireInspections.map((i: any) => ({ ...i, type: 'fire_extinguisher' })),
        ];
      }

      if (selectedInspectionType === 'all' || selectedInspectionType === 'first_aid') {
        const firstAidInspections = storage.load('first_aid_inspections') || [];
        inspections = [
          ...inspections,
          ...firstAidInspections.map((i: any) => ({ ...i, type: 'first_aid' })),
        ];
      }

      // Filter by date range
      const filteredInspections = inspections.filter(
        (inspection: any) => new Date(inspection.createdAt) >= cutoffDate,
      );

      const totalInspections = filteredInspections.length;
      const completedInspections = filteredInspections.filter(
        (i: any) => i.status === 'completed' || i.status === 'admin_approved',
      ).length;

      const completionRate =
        totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0;

      // Calculate compliance rate (Good + Acceptable / Total rated items)
      let totalRatedItems = 0;
      let compliantItems = 0;

      filteredInspections.forEach((inspection: any) => {
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

      const complianceRate = totalRatedItems > 0 ? (compliantItems / totalRatedItems) * 100 : 0;

      // Generate trend data
      const trendData = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        const dayInspections = filteredInspections.filter(
          (inspection: any) => inspection.createdAt.split('T')[0] === dateStr,
        );

        const dayCompliance =
          dayInspections.length > 0
            ? dayInspections.reduce((acc: number, inspection: any) => {
                const compliantItemsInInspection = inspection.items.filter((item: any) => {
                  const rating = item.rating || item.status;
                  return ['G', 'A', 'PASS', 'GOOD'].includes(rating);
                }).length;
                const totalItemsInInspection = inspection.items.filter((item: any) => {
                  const rating = item.rating || item.status;
                  return rating !== null;
                }).length;

                return (
                  acc +
                  (totalItemsInInspection > 0
                    ? (compliantItemsInInspection / totalItemsInInspection) * 100
                    : 0)
                );
              }, 0) / dayInspections.length
            : 0;

        trendData.push({
          date: dateStr,
          inspections: dayInspections.length,
          compliance: Math.round(dayCompliance),
        });
      }

      // Category breakdown
      const categoryStats: { [key: string]: any } = {};
      filteredInspections.forEach((inspection: any) => {
        inspection.items.forEach((item: any) => {
          const category = item.category || 'UNCATEGORIZED';
          if (!categoryStats[category]) {
            categoryStats[category] = {
              category,
              total: 0,
              good: 0,
              acceptable: 0,
              poor: 0,
              issues: 0,
            };
          }

          const rating = item.rating || item.status;
          if (rating && rating !== null) {
            categoryStats[category].total++;

            if (['G', 'GOOD', 'PASS'].includes(rating)) categoryStats[category].good++;
            else if (['A'].includes(rating)) categoryStats[category].acceptable++;
            else if (['P', 'LOW'].includes(rating)) categoryStats[category].poor++;
            else if (
              ['SIN', 'SPS', 'SWO', 'FAIL', 'EXPIRED', 'MISSING', 'DAMAGED'].includes(rating)
            )
              categoryStats[category].issues++;
          }
        });
      });

      const categoryBreakdown = Object.values(categoryStats);

      // Status breakdown
      const statusBreakdown = {
        draft: filteredInspections.filter((i: any) => i.status === 'draft').length,
        submitted: filteredInspections.filter((i: any) => i.status === 'submitted').length,
        supervisor_approved: filteredInspections.filter(
          (i: any) => i.status === 'supervisor_approved',
        ).length,
        admin_approved: filteredInspections.filter((i: any) => i.status === 'admin_approved')
          .length,
        completed: filteredInspections.filter((i: any) => i.status === 'completed').length,
      };

      setAnalyticsData({
        totalInspections,
        completionRate,
        complianceRate,
        trendData,
        categoryBreakdown,
        statusBreakdown,
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      inspectionType: selectedInspectionType,
      ...analyticsData,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <BaseLayout title="Analytics Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (!analyticsData) {
    return (
      <BaseLayout title="Analytics Dashboard">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          <p className="text-gray-600">No inspection data available.</p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Analytics Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Inspection trends, compliance metrics, and performance insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedInspectionType}
              onChange={(e) =>
                setSelectedInspectionType(
                  e.target.value as 'all' | 'hse' | 'fire_extinguisher' | 'first_aid',
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Inspections</option>
              <option value="hse">HSE Only</option>
              <option value="fire_extinguisher">Fire Extinguisher Only</option>
              <option value="first_aid">First Aid Only</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={exportAnalytics}
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
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.totalInspections}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last {dateRange}</p>
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
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {Math.round(analyticsData.completionRate)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Approved inspections</p>
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {Math.round(analyticsData.complianceRate)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Items in compliance</p>
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
                  {analyticsData.statusBreakdown.submitted +
                    analyticsData.statusBreakdown.supervisor_approved}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need review</p>
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
        </div>

        {/* Inspection Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Trends</h3>
          <div className="h-64 overflow-x-auto">
            <div className="flex items-end justify-between h-48 px-4" style={{ minWidth: '600px' }}>
              {analyticsData.trendData.slice(-14).map((data, index) => (
                <div key={index} className="flex flex-col items-center min-w-0">
                  <div className="flex flex-col items-center mb-2">
                    <div
                      className="bg-blue-500 rounded-t relative group"
                      style={{
                        height: `${Math.max(data.inspections * 10, 4)}px`,
                        width: '20px',
                        minHeight: '4px',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.inspections} inspections
                      </div>
                    </div>
                    <div
                      className="bg-emerald-500 rounded-b relative group"
                      style={{
                        height: `${Math.max(data.compliance * 2, 4)}px`,
                        width: '20px',
                        minHeight: '4px',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.compliance}% compliance
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 transform rotate-45 origin-left mt-2 whitespace-nowrap">
                    {new Date(data.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Inspections Count</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded" />
                <span>Compliance Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inspection Status Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(analyticsData.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize mt-1">
                  {status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                    Category
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Good</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                    Acceptable
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Poor</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                    Issues
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                    Compliance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analyticsData.categoryBreakdown.map((category) => {
                  const complianceRate =
                    category.total > 0
                      ? ((category.good + category.acceptable) / category.total) * 100
                      : 0;

                  return (
                    <tr key={category.category} className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-sm text-gray-900">
                        {category.category}
                      </td>
                      <td className="text-center py-3 px-2 text-sm text-gray-700">
                        {category.total}
                      </td>
                      <td className="text-center py-3 px-2 text-sm text-emerald-600">
                        {category.good}
                      </td>
                      <td className="text-center py-3 px-2 text-sm text-blue-600">
                        {category.acceptable}
                      </td>
                      <td className="text-center py-3 px-2 text-sm text-amber-600">
                        {category.poor}
                      </td>
                      <td className="text-center py-3 px-2 text-sm text-red-600">
                        {category.issues}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span
                          className={`text-sm font-semibold ${
                            complianceRate >= 90
                              ? 'text-emerald-600'
                              : complianceRate >= 70
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {Math.round(complianceRate)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        {(analyticsData.complianceRate < 80 || analyticsData.completionRate < 90) && (
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
                <h3 className="text-sm font-semibold text-blue-800">Recommendations</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {analyticsData.complianceRate < 80 && (
                      <li>Consider additional training for areas with low compliance rates</li>
                    )}
                    {analyticsData.completionRate < 90 && (
                      <li>Follow up on pending inspections to improve completion rates</li>
                    )}
                    {analyticsData.statusBreakdown.submitted > 5 && (
                      <li>
                        Review approval workflow - {analyticsData.statusBreakdown.submitted}{' '}
                        inspections awaiting supervisor review
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

export default AnalyticsDashboard;
