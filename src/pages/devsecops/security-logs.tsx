// src/pages/devsecops/security-logs.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleBasedNav from '@/components/RoleBasedNav';
import { storage } from '@/utils/storage';

interface SecurityEvent {
  id: string;
  type: 'error' | 'data_breach' | 'update' | 'access_violation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  affectedUser?: string;
  affectedResource?: string;
  ipAddress?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

const SecurityLogsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSecurityEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, typeFilter, severityFilter, resolvedFilter, searchQuery]);

  const loadSecurityEvents = () => {
    setLoading(true);
    try {
      let securityEvents = storage.load('securityEvents', []) as SecurityEvent[];

      // Initialize with sample data if empty
      if (securityEvents.length === 0) {
        securityEvents = generateSampleEvents();
        storage.save('securityEvents', securityEvents);
      }

      setEvents(securityEvents);
    } catch (error) {
      console.error('Error loading security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleEvents = (): SecurityEvent[] => {
    const now = Date.now();
    return [
      {
        id: '1',
        type: 'access_violation',
        severity: 'high',
        title: 'Unauthorized Access Attempt',
        description: 'User attempted to access admin panel without proper permissions',
        timestamp: new Date(now - 3600000).toISOString(),
        affectedUser: 'Inspector Demo',
        affectedResource: '/admin/users',
        ipAddress: '192.168.1.100',
        resolved: false,
      },
      {
        id: '2',
        type: 'error',
        severity: 'medium',
        title: 'API Request Failed',
        description: 'Multiple failed API requests detected from same origin',
        timestamp: new Date(now - 7200000).toISOString(),
        ipAddress: '192.168.1.105',
        resolved: true,
        resolvedAt: new Date(now - 3600000).toISOString(),
        resolvedBy: 'Admin User',
      },
      {
        id: '3',
        type: 'suspicious_activity',
        severity: 'critical',
        title: 'Multiple Failed Login Attempts',
        description: '10 failed login attempts within 5 minutes',
        timestamp: new Date(now - 10800000).toISOString(),
        ipAddress: '203.0.113.45',
        resolved: false,
      },
      {
        id: '4',
        type: 'update',
        severity: 'low',
        title: 'System Update Completed',
        description: 'Security patches applied successfully',
        timestamp: new Date(now - 86400000).toISOString(),
        resolved: true,
        resolvedAt: new Date(now - 86000000).toISOString(),
        resolvedBy: 'System',
      },
    ];
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (typeFilter) {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter((e) => e.severity === severityFilter);
    }

    if (resolvedFilter) {
      const isResolved = resolvedFilter === 'resolved';
      filtered = filtered.filter((e) => e.resolved === isResolved);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.affectedUser?.toLowerCase().includes(query) ||
          e.ipAddress?.includes(query),
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredEvents(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleResolveEvent = (eventId: string) => {
    const updatedEvents = events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            resolved: true,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'DevSecOps User',
          }
        : e,
    );
    storage.save('securityEvents', updatedEvents);
    setEvents(updatedEvents);
  };

  const clearFilters = () => {
    setTypeFilter('');
    setSeverityFilter('');
    setResolvedFilter('');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="devsecops">
        <div className="min-h-screen bg-gray-100">
          <RoleBasedNav />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading security logs...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="devsecops">
      <Head>
        <title>Security Logs - DevSecOps Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        <RoleBasedNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Security Logs</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage security events across the system
            </p>
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
                  placeholder="Search events..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="error">Error</option>
                  <option value="data_breach">Data Breach</option>
                  <option value="update">Update</option>
                  <option value="access_violation">Access Violation</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={resolvedFilter}
                  onChange={(e) => setResolvedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="resolved">Resolved</option>
                  <option value="unresolved">Unresolved</option>
                </select>
              </div>
            </div>

            {(typeFilter || severityFilter || resolvedFilter || searchQuery) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No security events found matching your criteria.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                    event.resolved ? 'opacity-75' : ''
                  } ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{getTypeIcon(event.type)}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                                event.severity,
                              )}`}
                            >
                              {event.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {event.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{event.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {event.affectedUser && (
                          <div>
                            <span className="text-gray-600">Affected User:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {event.affectedUser}
                            </span>
                          </div>
                        )}
                        {event.affectedResource && (
                          <div>
                            <span className="text-gray-600">Resource:</span>
                            <span className="ml-2 font-mono text-sm text-gray-900">
                              {event.affectedResource}
                            </span>
                          </div>
                        )}
                        {event.ipAddress && (
                          <div>
                            <span className="text-gray-600">IP Address:</span>
                            <span className="ml-2 font-mono text-sm text-gray-900">
                              {event.ipAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      {event.resolved && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Resolved</strong> by {event.resolvedBy} on{' '}
                            {event.resolvedAt && new Date(event.resolvedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {!event.resolved && (
                      <button
                        onClick={() => handleResolveEvent(event.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium whitespace-nowrap"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SecurityLogsPage;
