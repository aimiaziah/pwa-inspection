// src/pages/devsecops/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';

interface DashboardData {
  summary: {
    securityScore: number;
    activeUsers: number;
    systemErrors: number;
    unresolvedEvents: number;
    criticalEvents: number;
    dataBreaches: number;
    failedLogins: number;
  };
  recentSecurityEvents: SecurityEvent[];
  criticalEvents: SecurityEvent[];
  recentUpdates: AuditLog[];
  systemHealth: {
    uptime: string;
    lastUpdate: string;
    activeConnections: number;
    totalUsers: number;
  };
  activityTrends: {
    accessLogsLast24h: number;
    auditLogsLast7d: number;
    averageResponseTime: string;
    errorRate: number;
  };
}

interface SecurityEvent {
  id: string;
  type: 'error' | 'data_breach' | 'update' | 'access_violation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  affectedUser?: string;
  resolved: boolean;
}

interface AuditLog {
  action: string;
  performedBy: string;
  performedByName: string;
  details: any;
  timestamp: string;
}

const DevSecOpsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = autoRefresh
      ? setInterval(() => {
          fetchDashboardData();
        }, 30000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devsecops/dashboard', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Critical';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'data_breach':
        return '🚨';
      case 'update':
        return '🔄';
      case 'access_violation':
        return '🔒';
      case 'suspicious_activity':
        return '👁️';
      default:
        return '📋';
    }
  };

  if (loading && !dashboardData) {
    return (
      <ProtectedRoute requiredRole="devsecops">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading DevSecOps Dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="devsecops">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="devsecops">
      <Head>
        <title>DevSecOps Dashboard - HSE Inspection System</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DevSecOps Monitoring Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  Auto-refresh
                </label>
                <button
                  onClick={fetchDashboardData}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Security Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Security Score</h2>
                <div className="flex items-baseline">
                  <span
                    className={`text-5xl font-bold ${getSecurityScoreColor(
                      dashboardData.summary.securityScore,
                    )}`}
                  >
                    {dashboardData.summary.securityScore}
                  </span>
                  <span className="text-xl text-gray-500 ml-2">/ 100</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Status: {getSecurityScoreLabel(dashboardData.summary.securityScore)}
                </p>
              </div>
              <div className="text-6xl">🛡️</div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.summary.activeUsers}
                  </p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Errors</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {dashboardData.summary.systemErrors}
                  </p>
                </div>
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unresolved Events</p>
                  <p className="text-3xl font-bold text-red-600">
                    {dashboardData.summary.unresolvedEvents}
                  </p>
                </div>
                <span className="text-3xl">🚨</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed Logins</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {dashboardData.summary.failedLogins}
                  </p>
                </div>
                <span className="text-3xl">🔒</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-xl font-semibold text-green-600">
                  {dashboardData.systemHealth.uptime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-xl font-semibold text-blue-600">
                  {dashboardData.systemHealth.activeConnections}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-semibold text-gray-900">
                  {dashboardData.systemHealth.totalUsers}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-xl font-semibold text-orange-600">
                  {dashboardData.activityTrends.errorRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Critical Events */}
          {dashboardData.criticalEvents.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-600 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <span className="mr-2">🚨</span> Critical Events Requiring Attention
              </h2>
              <div className="space-y-3">
                {dashboardData.criticalEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">{getTypeIcon(event.type)}</span>
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <span
                            className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                              event.severity,
                            )}`}
                          >
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-10">{event.description}</p>
                        <p className="text-xs text-gray-500 ml-10 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Security Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h2>
            {dashboardData.recentSecurityEvents.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No recent security events</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentSecurityEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-xl mr-2">{getTypeIcon(event.type)}</span>
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(
                              event.severity,
                            )}`}
                          >
                            {event.severity}
                          </span>
                          {event.resolved && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 ml-9">{event.description}</p>
                        <p className="text-xs text-gray-500 ml-9 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Updates (Audit Log) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h2>
            {dashboardData.recentUpdates.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentUpdates.map((log, index) => (
                  <div key={index} className="flex items-start py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{log.performedByName}</span>
                        <span className="text-gray-600"> performed </span>
                        <span className="font-medium text-blue-600">{log.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Access Logs (24h)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData.activityTrends.accessLogsLast24h}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Audit Logs (7d)</p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData.activityTrends.auditLogsLast7d}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardData.activityTrends.averageResponseTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DevSecOpsDashboard;
