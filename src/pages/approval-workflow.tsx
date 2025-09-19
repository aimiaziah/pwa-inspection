import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';

type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';
type UserRole = 'inspector' | 'supervisor' | 'admin';

interface InspectionData {
  id: string;
  contractor: string;
  location: string;
  inspectedBy: string;
  date: string;
  status: InspectionStatus;
  items: any[];
  supervisorApproval?: {
    approvedBy: string;
    approvedAt: string;
    comments: string;
  };
  adminApproval?: {
    approvedBy: string;
    approvedAt: string;
    comments: string;
  };
  auditLog: Array<{
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }>;
  createdAt: string;
  savedAt?: string;
}

const ApprovalWorkflow: React.FC = () => {
  const [currentUser] = useState<{ name: string; role: UserRole }>({
    name: 'Sarah Supervisor',
    role: 'supervisor', // Change this to test different roles: 'supervisor' | 'admin'
  });

  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [approvalComments, setApprovalComments] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = () => {
    setLoading(true);

    try {
      const allInspections = [];

      // Load all inspection types
      const hseInspections = (storage.load('inspections') || []).map((i: any) => ({
        ...i,
        type: 'HSE',
      }));
      const fireInspections = (storage.load('fire_extinguisher_inspections') || []).map(
        (i: any) => ({ ...i, type: 'Fire Extinguisher' }),
      );
      const firstAidInspections = (storage.load('first_aid_inspections') || []).map((i: any) => ({
        ...i,
        type: 'First Aid',
      }));

      allInspections.push(...hseInspections, ...fireInspections, ...firstAidInspections);

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

  const getFilteredInspections = () => {
    let filtered = inspections;

    // Filter based on user role and tab
    if (activeTab === 'pending') {
      if (currentUser.role === 'supervisor') {
        filtered = inspections.filter((i) => i.status === 'submitted');
      } else if (currentUser.role === 'admin') {
        filtered = inspections.filter((i) => i.status === 'supervisor_approved');
      }
    } else if (activeTab === 'approved') {
      if (currentUser.role === 'supervisor') {
        filtered = inspections.filter(
          (i) =>
            i.status === 'supervisor_approved' ||
            i.status === 'admin_approved' ||
            i.status === 'completed',
        );
      } else if (currentUser.role === 'admin') {
        filtered = inspections.filter(
          (i) => i.status === 'admin_approved' || i.status === 'completed',
        );
      }
    }

    return filtered;
  };

  const handleApprovalAction = (inspection: InspectionData, action: 'approve' | 'reject') => {
    setSelectedInspection(inspection);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

  const confirmApproval = () => {
    if (!selectedInspection) return;

    const updatedInspections = inspections.map((inspection) => {
      if (inspection.id === selectedInspection.id) {
        const timestamp = new Date().toISOString();
        let newStatus: InspectionStatus;
        const updatedInspection = { ...inspection };

        if (approvalAction === 'approve') {
          if (currentUser.role === 'supervisor') {
            newStatus = 'supervisor_approved';
            updatedInspection.supervisorApproval = {
              approvedBy: currentUser.name,
              approvedAt: timestamp,
              comments: approvalComments,
            };
          } else if (currentUser.role === 'admin') {
            newStatus = 'admin_approved';
            updatedInspection.adminApproval = {
              approvedBy: currentUser.name,
              approvedAt: timestamp,
              comments: approvalComments,
            };
          } else {
            newStatus = inspection.status;
          }
        } else {
          // Rejection - send back to previous status
          if (currentUser.role === 'supervisor') {
            newStatus = 'submitted'; // Stay in submitted status for resubmission
          } else if (currentUser.role === 'admin') {
            newStatus = 'supervisor_approved'; // Back to supervisor approved
          } else {
            newStatus = inspection.status;
          }
        }

        return {
          ...updatedInspection,
          status: newStatus,
          auditLog: [
            ...inspection.auditLog,
            {
              timestamp,
              user: currentUser.name,
              action: `${currentUser.role}_${approvalAction}`,
              details: `${approvalAction === 'approve' ? 'Approved' : 'Rejected'} by ${
                currentUser.role
              }${approvalComments ? `: ${approvalComments}` : ''}`,
            },
          ],
        };
      }
      return inspection;
    });

    // Update storage based on inspection type
    const hseInspections = updatedInspections
      .filter((i) => i.type === 'HSE')
      .map(({ type, ...rest }) => rest);
    const fireInspections = updatedInspections
      .filter((i) => i.type === 'Fire Extinguisher')
      .map(({ type, ...rest }) => rest);
    const firstAidInspections = updatedInspections
      .filter((i) => i.type === 'First Aid')
      .map(({ type, ...rest }) => rest);

    storage.save('inspections', hseInspections);
    storage.save('fire_extinguisher_inspections', fireInspections);
    storage.save('first_aid_inspections', firstAidInspections);

    setInspections(updatedInspections);
    setShowApprovalModal(false);
    setSelectedInspection(null);
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'submitted':
        return 'bg-amber-100 text-amber-800';
      case 'supervisor_approved':
        return 'bg-blue-100 text-blue-800';
      case 'admin_approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceScore = (items: any[]) => {
    const ratedItems = items.filter((item) => {
      const rating = item.rating || item.status;
      return rating !== null;
    });
    if (ratedItems.length === 0) return 0;

    const compliantItems = ratedItems.filter((item) => {
      const rating = item.rating || item.status;
      return ['G', 'A', 'PASS', 'GOOD'].includes(rating);
    });
    return Math.round((compliantItems.length / ratedItems.length) * 100);
  };

  const getIssueCount = (items: any[]) => {
    return items.filter((item) => {
      const rating = item.rating || item.status;
      return ['SIN', 'SPS', 'SWO', 'P', 'FAIL', 'EXPIRED', 'MISSING', 'DAMAGED'].includes(rating);
    }).length;
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const filteredInspections = getFilteredInspections();

  if (loading) {
    return (
      <BaseLayout title="Approval Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-gray-600">Loading inspections...</span>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      title={`${currentUser.role === 'supervisor' ? 'Supervisor' : 'Admin'} Approval Dashboard`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentUser.role === 'supervisor' ? 'Supervisor' : 'Admin'} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Review and approve inspection submissions</p>
          </div>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            Logged in as:{' '}
            <span className="font-semibold capitalize">
              {currentUser.name} ({currentUser.role})
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">
                  {
                    inspections.filter((i) =>
                      currentUser.role === 'supervisor'
                        ? i.status === 'submitted'
                        : i.status === 'supervisor_approved',
                    ).length
                  }
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
                <p className="text-sm font-medium text-gray-600">Approved This Week</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {
                    inspections.filter((i) => {
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      const hasApproval =
                        currentUser.role === 'supervisor' ? i.supervisorApproval : i.adminApproval;
                      return hasApproval && new Date(hasApproval.approvedAt) >= weekAgo;
                    }).length
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {inspections.length > 0
                    ? Math.round(
                        inspections.reduce((acc, i) => acc + getComplianceScore(i.items), 0) /
                          inspections.length,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall average</p>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['pending', 'approved', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab} (
                {tab === 'pending'
                  ? inspections.filter((i) =>
                      currentUser.role === 'supervisor'
                        ? i.status === 'submitted'
                        : i.status === 'supervisor_approved',
                    ).length
                  : tab === 'approved'
                  ? inspections.filter((i) => {
                      if (currentUser.role === 'supervisor') {
                        return ['supervisor_approved', 'admin_approved', 'completed'].includes(
                          i.status,
                        );
                      }
                      return ['admin_approved', 'completed'].includes(i.status);
                    }).length
                  : inspections.length}
                )
              </button>
            ))}
          </nav>
        </div>

        {/* Inspections List */}
        <div className="space-y-4">
          {filteredInspections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <p className="text-gray-600">No inspections to review.</p>
            </div>
          ) : (
            filteredInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inspection.contractor || inspection.building} - {inspection.location}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {(inspection as any).type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Inspected by {inspection.inspectedBy} on{' '}
                      {new Date(inspection.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted {getRelativeTime(inspection.savedAt || inspection.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      inspection.status,
                    )}`}
                  >
                    {inspection.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Inspection Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {getComplianceScore(inspection.items)}%
                    </div>
                    <div className="text-xs text-gray-600">Compliance</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-emerald-600">
                      {
                        inspection.items.filter((i) => {
                          const rating = i.rating || i.status;
                          return ['G', 'GOOD', 'PASS'].includes(rating);
                        }).length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Good</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-amber-600">
                      {
                        inspection.items.filter((i) => {
                          const rating = i.rating || i.status;
                          return ['P', 'LOW'].includes(rating);
                        }).length
                      }
                    </div>
                    <div className="text-xs text-gray-600">Poor/Low</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {getIssueCount(inspection.items)}
                    </div>
                    <div className="text-xs text-gray-600">Issues</div>
                  </div>
                </div>

                {/* Issue Highlights */}
                {getIssueCount(inspection.items) > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Critical Issues Found:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {inspection.items
                        .filter((item) => {
                          const rating = item.rating || item.status;
                          return [
                            'SIN',
                            'SPS',
                            'SWO',
                            'P',
                            'FAIL',
                            'EXPIRED',
                            'MISSING',
                            'DAMAGED',
                          ].includes(rating);
                        })
                        .slice(0, 3)
                        .map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                              {item.item} ({item.rating || item.status})
                              {item.comments && ` - ${item.comments}`}
                            </span>
                          </li>
                        ))}
                      {getIssueCount(inspection.items) > 3 && (
                        <li className="font-medium">
                          ... and {getIssueCount(inspection.items) - 3} more issues
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Previous Approvals */}
                {inspection.supervisorApproval && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Supervisor Approval</h4>
                    <p className="text-sm text-blue-700">
                      Approved by {inspection.supervisorApproval.approvedBy} on{' '}
                      {new Date(inspection.supervisorApproval.approvedAt).toLocaleString()}
                    </p>
                    {inspection.supervisorApproval.comments && (
                      <p className="text-sm text-blue-700 mt-1">
                        Comments: {inspection.supervisorApproval.comments}
                      </p>
                    )}
                  </div>
                )}

                {inspection.adminApproval && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-800 mb-1">Admin Approval</h4>
                    <p className="text-sm text-emerald-700">
                      Approved by {inspection.adminApproval.approvedBy} on{' '}
                      {new Date(inspection.adminApproval.approvedAt).toLocaleString()}
                    </p>
                    {inspection.adminApproval.comments && (
                      <p className="text-sm text-emerald-700 mt-1">
                        Comments: {inspection.adminApproval.comments}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedInspection(inspection)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Details
                  </button>

                  {((currentUser.role === 'supervisor' && inspection.status === 'submitted') ||
                    (currentUser.role === 'admin' &&
                      inspection.status === 'supervisor_approved')) && (
                    <>
                      <button
                        onClick={() => handleApprovalAction(inspection, 'approve')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(inspection, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedInspection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 mt-1">
                    {approvalAction === 'approve' ? (
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
                    ) : (
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
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {approvalAction === 'approve' ? 'Approve' : 'Reject'} Inspection
                    </h3>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Location:</strong>{' '}
                    {selectedInspection.contractor || selectedInspection.building} -{' '}
                    {selectedInspection.location}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Inspector:</strong> {selectedInspection.inspectedBy}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {(selectedInspection as any).type}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments{' '}
                    {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder={
                      approvalAction === 'approve'
                        ? 'Optional approval comments...'
                        : 'Please provide reason for rejection...'
                    }
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApproval}
                    disabled={approvalAction === 'reject' && !approvalComments.trim()}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      approvalAction === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Details Modal */}
        {selectedInspection && !showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Inspection Details</h3>
                  <button
                    onClick={() => setSelectedInspection(null)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Header Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <strong>Location:</strong>{' '}
                    {selectedInspection.contractor || selectedInspection.building} -{' '}
                    {selectedInspection.location}
                  </div>
                  <div>
                    <strong>Type:</strong> {(selectedInspection as any).type}
                  </div>
                  <div>
                    <strong>Inspector:</strong> {selectedInspection.inspectedBy}
                  </div>
                  <div>
                    <strong>Date:</strong> {new Date(selectedInspection.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Items by Category */}
                {Object.entries(
                  selectedInspection.items.reduce((acc: any, item: any) => {
                    const category = item.category || 'UNCATEGORIZED';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {}),
                ).map(([category, items]: [string, any]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm py-2 border-b border-gray-100"
                        >
                          <span className="flex-1">{item.item}</span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                ['G', 'GOOD', 'PASS'].includes(item.rating || item.status)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ['A'].includes(item.rating || item.status)
                                  ? 'bg-blue-100 text-blue-800'
                                  : ['P', 'LOW'].includes(item.rating || item.status)
                                  ? 'bg-amber-100 text-amber-800'
                                  : [
                                      'SIN',
                                      'SPS',
                                      'SWO',
                                      'FAIL',
                                      'EXPIRED',
                                      'MISSING',
                                      'DAMAGED',
                                    ].includes(item.rating || item.status)
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.rating || item.status || 'Not Rated'}
                            </span>
                            {item.comments && (
                              <span className="text-gray-600 max-w-xs truncate">
                                {item.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default ApprovalWorkflow;
