// src/pages/reports.tsx
import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import Link from 'next/link';

type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';
type InspectionType = 'hse' | 'fire_extinguisher' | 'first_aid';

interface InspectionSummary {
  id: string;
  type: InspectionType;
  contractor?: string;
  location?: string;
  inspectedBy: string;
  date: string;
  status: InspectionStatus;
  completionRate: number;
  criticalIssues: number;
  createdAt: string;
  savedAt?: string;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedInspections, setSelectedInspections] = useState<string[]>([]);

  useEffect(() => {
    loadInspections();
  }, [user]);

  const loadInspections = () => {
    setLoading(true);
    try {
      // Load all inspection types
      const hseInspections = storage.load('inspections', []);
      const fireInspections = storage.load('fire_extinguisher_inspections', []);
      const firstAidInspections = storage.load('first_aid_inspections', []);

      // Combine and format
      const allInspections: InspectionSummary[] = [
        ...hseInspections.map((inspection: any) => ({
          id: inspection.id,
          type: 'hse' as InspectionType,
          contractor: inspection.contractor,
          location: inspection.location,
          inspectedBy: inspection.inspectedBy,
          date: inspection.date,
          status: inspection.status,
          completionRate: calculateCompletionRate(inspection),
          criticalIssues: calculateCriticalIssues(inspection),
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        })),
        ...fireInspections.map((inspection: any) => ({
          id: inspection.id,
          type: 'fire_extinguisher' as InspectionType,
          location: inspection.location,
          inspectedBy: inspection.inspectedBy,
          date: inspection.inspectionDate,
          status: inspection.status,
          completionRate: calculateCompletionRate(inspection),
          criticalIssues: calculateCriticalIssues(inspection),
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        })),
        ...firstAidInspections.map((inspection: any) => ({
          id: inspection.id,
          type: 'first_aid' as InspectionType,
          location: inspection.location,
          inspectedBy: inspection.inspectedBy,
          date: inspection.inspectionDate,
          status: inspection.status,
          completionRate: calculateCompletionRate(inspection),
          criticalIssues: calculateCriticalIssues(inspection),
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        })),
      ];

      // Filter by user role
      let filteredInspections = allInspections;
      if (user?.role === 'inspector') {
        // Inspectors can only see their own inspections
        filteredInspections = allInspections.filter(
          (inspection) => inspection.inspectedBy === user.name,
        );
      }

      // Sort by creation date (newest first)
      filteredInspections.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setInspections(filteredInspections);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (inspection: any): number => {
    if (!inspection.items || inspection.items.length === 0) return 0;
    const completed = inspection.items.filter((item: any) => item.rating !== null).length;
    return Math.round((completed / inspection.items.length) * 100);
  };

  const calculateCriticalIssues = (inspection: any): number => {
    if (!inspection.items) return 0;
    return inspection.items.filter((item: any) =>
      ['FAIL', 'SIN', 'SPS', 'SWO', 'P'].includes(item.rating),
    ).length;
  };

  // Apply filters
  const filteredInspections = inspections.filter((inspection) => {
    if (filterStatus !== 'all' && inspection.status !== filterStatus) return false;
    if (filterType !== 'all' && inspection.type !== filterType) return false;
    return true;
  });

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'supervisor_approved':
        return 'bg-blue-100 text-blue-800';
      case 'admin_approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: InspectionType) => {
    switch (type) {
      case 'hse':
        return '📋';
      case 'fire_extinguisher':
        return '🧯';
      case 'first_aid':
        return '🏥';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: InspectionType) => {
    switch (type) {
      case 'hse':
        return 'HSE Inspection';
      case 'fire_extinguisher':
        return 'Fire Extinguisher';
      case 'first_aid':
        return 'First Aid Kit';
      default:
        return 'Inspection';
    }
  };

  const toggleInspectionSelection = (inspectionId: string) => {
    setSelectedInspections((prev) =>
      prev.includes(inspectionId)
        ? prev.filter((id) => id !== inspectionId)
        : [...prev, inspectionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedInspections.length === filteredInspections.length) {
      setSelectedInspections([]);
    } else {
      setSelectedInspections(filteredInspections.map((i) => i.id));
    }
  };

  const handleBulkExport = () => {
    if (selectedInspections.length === 0) {
      alert('Please select inspections to export.');
      return;
    }

    // Simple CSV export
    const csvData = filteredInspections
      .filter((inspection) => selectedInspections.includes(inspection.id))
      .map((inspection) => [
        inspection.type,
        inspection.location || inspection.contractor || '',
        inspection.inspectedBy,
        inspection.date,
        inspection.status,
        `${inspection.completionRate}%`,
        inspection.criticalIssues,
        new Date(inspection.createdAt).toLocaleDateString(),
      ]);

    const headers = [
      'Type',
      'Location/Contractor',
      'Inspector',
      'Date',
      'Status',
      'Completion',
      'Critical Issues',
      'Created',
    ];
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <BaseLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  const stats = {
    total: filteredInspections.length,
    completed: filteredInspections.filter((i) => i.status === 'completed').length,
    pending: filteredInspections.filter((i) => i.status === 'submitted').length,
    criticalIssues: filteredInspections.reduce((sum, i) => sum + i.criticalIssues, 0),
  };

  return (
    <BaseLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspection Reports</h1>
            <p className="text-gray-600">View and manage completed inspections</p>
          </div>

          {selectedInspections.length > 0 && (
            <button
              onClick={handleBulkExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Selected ({selectedInspections.length})
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <span className="text-4xl">📋</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <span className="text-4xl">✅</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-3xl font-bold text-red-600">{stats.criticalIssues}</p>
              </div>
              <span className="text-4xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="supervisor_approved">Supervisor Approved</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="hse">HSE Inspection</option>
                <option value="fire_extinguisher">Fire Extinguisher</option>
                <option value="first_aid">First Aid Kit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={
                  selectedInspections.length === filteredInspections.length &&
                  filteredInspections.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({filteredInspections.length} inspections)
              </span>
            </label>
          </div>

          {filteredInspections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No inspections found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Inspector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedInspections.includes(inspection.id)}
                          onChange={() => toggleInspectionSelection(inspection.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getTypeIcon(inspection.type)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getTypeLabel(inspection.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {inspection.location || inspection.contractor || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{inspection.inspectedBy}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(inspection.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            inspection.status,
                          )}`}
                        >
                          {inspection.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            inspection.completionRate === 100 ? 'text-green-600' : 'text-gray-900'
                          }`}
                        >
                          {inspection.completionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            inspection.criticalIssues > 0 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {inspection.criticalIssues}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
};

export default ReportsPage;

