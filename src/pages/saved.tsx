import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';
import { exportInspectionReport } from '@/utils/reportGenerator';

type InspectionType = 'hse' | 'fire_extinguisher' | 'first_aid';
type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';

interface SavedInspection {
  id: string;
  type: InspectionType;
  title: string;
  location: string;
  inspector: string;
  date: string;
  status: InspectionStatus;
  compliance?: number;
  criticalIssues?: number;
  createdAt: string;
  savedAt?: string;
}

const SavedInspections: React.FC = () => {
  const [inspections, setInspections] = useState<SavedInspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<SavedInspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection
  const [selectedInspections, setSelectedInspections] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspections, typeFilter, statusFilter, dateFromFilter, dateToFilter, searchQuery]);

  const loadInspections = () => {
    setLoading(true);

    try {
      const allInspections: SavedInspection[] = [];

      // Load HSE inspections
      const hseInspections = storage.load('inspections') || [];
      hseInspections.forEach((inspection: any) => {
        const stats = calculateInspectionStats(inspection.items);
        allInspections.push({
          id: inspection.id,
          type: 'hse',
          title: 'HSE Inspection',
          location: `${inspection.contractor} - ${inspection.location}`,
          inspector: inspection.inspectedBy,
          date: inspection.date,
          status: inspection.status,
          compliance: stats.complianceRate,
          criticalIssues: stats.criticalIssues,
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        });
      });

      // Load Fire Extinguisher inspections
      const fireInspections = storage.load('fire_extinguisher_inspections') || [];
      fireInspections.forEach((inspection: any) => {
        const stats = calculateFireExtinguisherStats(inspection.items);
        allInspections.push({
          id: inspection.id,
          type: 'fire_extinguisher',
          title: 'Fire Extinguisher Inspection',
          location: `${inspection.building} - ${inspection.location}`,
          inspector: inspection.inspectedBy,
          date: inspection.inspectionDate,
          status: inspection.status,
          compliance: stats.passRate,
          criticalIssues: stats.failures,
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        });
      });

      // Load First Aid inspections
      const firstAidInspections = storage.load('first_aid_inspections') || [];
      firstAidInspections.forEach((inspection: any) => {
        const stats = calculateFirstAidStats(inspection.items);
        allInspections.push({
          id: inspection.id,
          type: 'first_aid',
          title: 'First Aid Kit Inspection',
          location: `${inspection.building} - ${inspection.location}`,
          inspector: inspection.inspectedBy,
          date: inspection.inspectionDate,
          status: inspection.status,
          compliance: stats.readinessRate,
          criticalIssues: stats.criticalIssues,
          createdAt: inspection.createdAt,
          savedAt: inspection.savedAt,
        });
      });

      // Sort by creation date (newest first)
      allInspections.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setInspections(allInspections);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInspectionStats = (items: any[]) => {
    const completed = items.filter((item) => item.rating !== null);
    const compliant = items.filter((item) => ['G', 'A'].includes(item.rating));
    const critical = items.filter((item) => ['SIN', 'SPS', 'SWO'].includes(item.rating));

    return {
      complianceRate:
        completed.length > 0 ? Math.round((compliant.length / completed.length) * 100) : 0,
      criticalIssues: critical.length,
    };
  };

  const calculateFireExtinguisherStats = (items: any[]) => {
    const completed = items.filter((item) => item.rating !== null);
    const passed = items.filter((item) => item.rating === 'PASS');
    const failed = items.filter((item) => item.rating === 'FAIL');

    return {
      passRate: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
      failures: failed.length,
    };
  };

  const calculateFirstAidStats = (items: any[]) => {
    const completed = items.filter((item) => item.status !== null);
    const ready = items.filter((item) => item.status === 'GOOD');
    const critical = items.filter((item) =>
      ['EXPIRED', 'MISSING', 'DAMAGED'].includes(item.status),
    );

    return {
      readinessRate: completed.length > 0 ? Math.round((ready.length / completed.length) * 100) : 0,
      criticalIssues: critical.length,
    };
  };

  const applyFilters = () => {
    let filtered = [...inspections];

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter((inspection) => inspection.type === typeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((inspection) => inspection.status === statusFilter);
    }

    // Date range filters
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter((inspection) => new Date(inspection.date) >= fromDate);
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      filtered = filtered.filter((inspection) => new Date(inspection.date) <= toDate);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inspection) =>
          inspection.title.toLowerCase().includes(query) ||
          inspection.location.toLowerCase().includes(query) ||
          inspection.inspector.toLowerCase().includes(query),
      );
    }

    setFilteredInspections(filtered);
  };

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchQuery('');
  };

  const handleSelectInspection = (inspectionId: string) => {
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

  const handleBulkExport = async (
    format: 'excel' | 'pdf',
    reportType: 'individual' | 'summary',
  ) => {
    if (selectedInspections.length === 0) return;

    try {
      await exportInspectionReport(selectedInspections, format, reportType);
    } catch (error) {
      console.error('Bulk export error:', error);
      alert('Error exporting inspections. Please try again.');
    }
  };

  const deleteInspection = (inspectionId: string, type: InspectionType) => {
    if (
      !confirm('Are you sure you want to delete this inspection? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const storageKey =
        type === 'hse'
          ? 'inspections'
          : type === 'fire_extinguisher'
          ? 'fire_extinguisher_inspections'
          : 'first_aid_inspections';

      const inspections = storage.load(storageKey) || [];
      const updatedInspections = inspections.filter((i: any) => i.id !== inspectionId);
      storage.save(storageKey, updatedInspections);

      loadInspections(); // Reload the list
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('Error deleting inspection. Please try again.');
    }
  };

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

  if (loading) {
    return (
      <BaseLayout title="Saved Inspections">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading inspections...</div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Saved Inspections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Inspections</h1>
            <p className="text-gray-600">View and manage all completed inspections</p>
          </div>
          <div className="flex gap-3">
            {selectedInspections.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkExport('excel', 'summary')}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Export Excel ({selectedInspections.length})
                </button>
                <button
                  onClick={() => handleBulkExport('pdf', 'summary')}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Export PDF ({selectedInspections.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                <p className="text-3xl font-bold text-gray-900">{inspections.length}</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">HSE Inspections</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {inspections.filter((i) => i.type === 'hse').length}
                </p>
              </div>
              <span className="text-4xl">📋</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Fire Extinguishers</p>
                <p className="text-3xl font-bold text-red-600">
                  {inspections.filter((i) => i.type === 'fire_extinguisher').length}
                </p>
              </div>
              <span className="text-4xl">🧯</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">First Aid Kits</p>
                <p className="text-3xl font-bold text-blue-600">
                  {inspections.filter((i) => i.type === 'first_aid').length}
                </p>
              </div>
              <span className="text-4xl">🏥</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="hse">HSE Inspection</option>
                <option value="fire_extinguisher">Fire Extinguisher</option>
                <option value="first_aid">First Aid Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="supervisor_approved">Supervisor Approved</option>
                <option value="admin_approved">Admin Approved</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Inspections List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Inspections ({filteredInspections.length})
              </h3>
              <div className="flex items-center space-x-3">
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
                  <span className="ml-2 text-sm text-gray-600">Select All</span>
                </label>
                {selectedInspections.length > 0 && (
                  <span className="text-sm text-blue-600">
                    {selectedInspections.length} selected
                  </span>
                )}
              </div>
            </div>
          </div>

          {filteredInspections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No inspections found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedInspections.includes(inspection.id)}
                      onChange={() => handleSelectInspection(inspection.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Type Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getTypeIcon(inspection.type)}</span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{inspection.title}</h4>
                          <p className="text-sm text-gray-600">{inspection.location}</p>
                          <p className="text-sm text-gray-500">
                            Inspector: {inspection.inspector} • Date:{' '}
                            {new Date(inspection.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getStatusColor(
                              inspection.status,
                            )}`}
                          >
                            {inspection.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-3 flex items-center space-x-6 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">Compliance:</span>
                          <span
                            className={`font-medium ${
                              (inspection.compliance || 0) >= 90
                                ? 'text-green-600'
                                : (inspection.compliance || 0) >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {inspection.compliance || 0}%
                          </span>
                        </div>
                        {(inspection.criticalIssues || 0) > 0 && (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-1">Critical Issues:</span>
                            <span className="font-medium text-red-600">
                              {inspection.criticalIssues}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">Created:</span>
                          <span className="text-gray-700">
                            {new Date(inspection.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => exportInspectionReport([inspection.id], 'pdf', 'individual')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() =>
                          exportInspectionReport([inspection.id], 'excel', 'individual')
                        }
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Export Excel
                      </button>
                      <button
                        onClick={() => deleteInspection(inspection.id, inspection.type)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
};

export default SavedInspections;
