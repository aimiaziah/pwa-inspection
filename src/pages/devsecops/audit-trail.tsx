// src/pages/devsecops/audit-trail.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleBasedNav from '@/components/RoleBasedNav';
import { storage } from '@/utils/storage';

interface AuditLog {
  action: string;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: any;
  timestamp: string;
}

const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, actionFilter, userFilter, searchQuery, dateRange]);

  const loadAuditLogs = () => {
    setLoading(true);
    try {
      const auditLogs = storage.load('auditLogs', []) as AuditLog[];
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Filter by user
    if (userFilter) {
      filtered = filtered.filter((log) => log.performedBy === userFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(query) ||
          log.performedByName.toLowerCase().includes(query) ||
          log.targetUserName?.toLowerCase().includes(query) ||
          JSON.stringify(log.details).toLowerCase().includes(query),
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((log) => new Date(log.timestamp) >= filterDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return '👤';
    if (action.includes('FORM')) return '📝';
    if (action.includes('INSPECTION')) return '📋';
    if (action.includes('NOTIFICATION')) return '🔔';
    if (action.includes('LOGIN')) return '🔓';
    if (action.includes('PIN')) return '🔑';
    if (action.includes('SECURITY')) return '🛡️';
    return '📊';
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-green-600';
    if (action.includes('UPDATED')) return 'text-blue-600';
    if (action.includes('DELETED')) return 'text-red-600';
    if (action.includes('LOGIN')) return 'text-purple-600';
    if (action.includes('FAILED')) return 'text-orange-600';
    return 'text-gray-600';
  };

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const uniqueUsers = Array.from(new Set(logs.map((log) => log.performedBy)));

  const clearFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setSearchQuery('');
    setDateRange('all');
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="devsecops">
        <div className="min-h-screen bg-gray-100">
          <RoleBasedNav />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading audit trail...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="devsecops">
      <Head>
        <title>Audit Trail - DevSecOps Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        <RoleBasedNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-1">
              Complete history of system activities and user actions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-3xl font-bold text-blue-600">
                {
                  logs.filter(
                    (log) => new Date(log.timestamp).toDateString() === new Date().toDateString(),
                  ).length
                }
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-green-600">
                {
                  logs.filter(
                    (log) =>
                      new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  ).length
                }
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Unique Actions</p>
              <p className="text-3xl font-bold text-purple-600">{uniqueActions.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map((userId) => {
                    const log = logs.find((l) => l.performedBy === userId);
                    return (
                      <option key={userId} value={userId}>
                        {log?.performedByName || userId}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>

            {(actionFilter || userFilter || searchQuery || dateRange !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Logs Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Timeline</h3>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No audit logs found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start border-l-2 border-gray-200 pl-6 pb-4 relative"
                  >
                    <div className="absolute -left-3 top-0 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">{log.performedByName}</span>
                        {log.targetUserName && (
                          <>
                            {' → '}
                            <span className="font-medium">{log.targetUserName}</span>
                          </>
                        )}
                      </p>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredLogs.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Showing {filteredLogs.length} of {logs.length} total logs
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AuditTrailPage;
