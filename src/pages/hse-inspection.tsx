import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';

// Types
type RatingType = 'G' | 'A' | 'P' | 'I' | 'SIN' | 'SPS' | 'SWO' | null;
type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';
type UserRole = 'inspector' | 'supervisor' | 'admin';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  rating: RatingType;
  comments: string;
}

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

interface InspectionData {
  id: string;
  contractor: string;
  location: string;
  inspectedBy: string;
  date: string;
  status: InspectionStatus;
  items: ChecklistItem[];
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
  auditLog: AuditLog[];
  createdAt: string;
  savedAt?: string;
}

const ChecklistPage: React.FC = () => {
  const [currentUser] = useState<{ name: string; role: UserRole }>({
    name: 'John Inspector',
    role: 'inspector',
  });

  const [inspectionData, setInspectionData] = useState<InspectionData>({
    id: Date.now().toString(),
    contractor: '',
    location: '',
    inspectedBy: currentUser.name,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    createdAt: new Date().toISOString(),
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: 'created',
        details: 'Inspection record created',
      },
    ],
    items: [
      // Working Areas
      { id: '1', category: 'WORKING AREAS', item: 'Housekeeping', rating: null, comments: '' },
      {
        id: '2',
        category: 'WORKING AREAS',
        item: 'Proper barrier/safety signs',
        rating: null,
        comments: '',
      },
      { id: '3', category: 'WORKING AREAS', item: 'Lighting adequacy', rating: null, comments: '' },
      {
        id: '4',
        category: 'WORKING AREAS',
        item: 'Site layout arrangement',
        rating: null,
        comments: '',
      },
      { id: '5', category: 'WORKING AREAS', item: 'Ventilation', rating: null, comments: '' },
      {
        id: '6',
        category: 'WORKING AREAS',
        item: 'Floor/ground/edge/opening condition',
        rating: null,
        comments: '',
      },
      {
        id: '7',
        category: 'WORKING AREAS',
        item: 'Escape/working route condition',
        rating: null,
        comments: '',
      },
      {
        id: '8',
        category: 'WORKING AREAS',
        item: 'Material storage/stacking',
        rating: null,
        comments: '',
      },

      // Site Office
      { id: '9', category: 'SITE OFFICE', item: 'Office Ergonomics', rating: null, comments: '' },
      {
        id: '10',
        category: 'SITE OFFICE',
        item: 'Location and maintenance',
        rating: null,
        comments: '',
      },
      {
        id: '11',
        category: 'SITE OFFICE',
        item: 'Fire extinguishers condition',
        rating: null,
        comments: '',
      },
      {
        id: '12',
        category: 'SITE OFFICE',
        item: 'First aid box facility',
        rating: null,
        comments: '',
      },
      {
        id: '13',
        category: 'SITE OFFICE',
        item: "Worker's legality / age",
        rating: null,
        comments: '',
      },
      {
        id: '14',
        category: 'SITE OFFICE',
        item: 'Green card (CIDB)/ NIOSH cert.',
        rating: null,
        comments: '',
      },
      {
        id: '15',
        category: 'SITE OFFICE',
        item: 'PMA/ PMT/ JBE/ DOE approval',
        rating: null,
        comments: '',
      },
      {
        id: '16',
        category: 'SITE OFFICE',
        item: 'Competent scaffolder',
        rating: null,
        comments: '',
      },

      // Hot Work/Electrical
      {
        id: '17',
        category: 'HOT WORK/ ELECTRICAL',
        item: 'Gas cylinders secured and upright',
        rating: null,
        comments: '',
      },
      {
        id: '18',
        category: 'HOT WORK/ ELECTRICAL',
        item: 'Gauge functionality',
        rating: null,
        comments: '',
      },
      {
        id: '19',
        category: 'HOT WORK/ ELECTRICAL',
        item: 'Flashback arrestors availability',
        rating: null,
        comments: '',
      },
      {
        id: '20',
        category: 'HOT WORK/ ELECTRICAL',
        item: 'Cables insulation/ earthing',
        rating: null,
        comments: '',
      },
      {
        id: '21',
        category: 'HOT WORK/ ELECTRICAL',
        item: 'Wiring condition-plugs, joints, DB',
        rating: null,
        comments: '',
      },

      // Fire Safety
      {
        id: '22',
        category: 'FIRE SAFETY',
        item: 'Fire extinguisher availability',
        rating: null,
        comments: '',
      },
      {
        id: '23',
        category: 'FIRE SAFETY',
        item: 'Emergency exit signage',
        rating: null,
        comments: '',
      },
      { id: '24', category: 'FIRE SAFETY', item: 'Hot work permit', rating: null, comments: '' },
      {
        id: '25',
        category: 'FIRE SAFETY',
        item: 'Flammable material storage',
        rating: null,
        comments: '',
      },
    ],
  });

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Rating options with professional colors
  const ratingOptions = [
    { value: 'G', label: 'Good', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { value: 'A', label: 'Acceptable', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { value: 'P', label: 'Poor', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
    { value: 'I', label: 'Irrelevant', color: 'bg-slate-500 hover:bg-slate-600 text-white' },
    { value: 'SIN', label: 'SIN', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
    { value: 'SPS', label: 'SPS', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { value: 'SWO', label: 'SWO', color: 'bg-red-700 hover:bg-red-800 text-white' },
  ];

  // Check if inspection is editable
  const isEditable = inspectionData.status === 'draft';

  // Handle rating change
  const handleRatingChange = (itemId: string, rating: RatingType) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, rating } : item)),
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'rating_changed',
          details: `Rating changed for item ${itemId} to ${rating}`,
        },
      ],
    }));
  };

  // Handle comment change
  const handleCommentChange = (itemId: string, comments: string) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, comments } : item)),
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'comment_changed',
          details: `Comment updated for item ${itemId}`,
        },
      ],
    }));
  };

  // Handle header data change
  const handleHeaderChange = (field: string, value: string) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      [field]: value,
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'header_changed',
          details: `${field} changed to ${value}`,
        },
      ],
    }));
  };

  // Save inspection
  const handleSave = () => {
    // Validation
    const missingFields = [];
    if (!inspectionData.contractor) missingFields.push('Contractor');
    if (!inspectionData.location) missingFields.push('Location');
    if (!inspectionData.inspectedBy) missingFields.push('Inspected By');

    const unratedItems = inspectionData.items.filter((item) => item.rating === null).length;

    if (missingFields.length > 0) {
      setSaveError(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (unratedItems > 0) {
      setSaveError(`Please rate all items. ${unratedItems} items remaining.`);
      return;
    }

    setShowSaveConfirmation(true);
  };

  // Confirm save
  const confirmSave = () => {
    const savedInspection = {
      ...inspectionData,
      status: 'submitted' as InspectionStatus,
      savedAt: new Date().toISOString(),
      auditLog: [
        ...inspectionData.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'submitted',
          details: 'Inspection submitted for supervisor review',
        },
      ],
    };

    // Save to localStorage
    const existingInspections = storage.load('inspections') || [];
    const updatedInspections = [...existingInspections, savedInspection];
    storage.save('inspections', updatedInspections);

    setInspectionData(savedInspection);
    setShowSaveConfirmation(false);
    setSaveError(null);
  };

  // Clear all ratings
  const handleClearAll = () => {
    if (!isEditable) return;

    if (confirm('Are you sure you want to clear all ratings and comments?')) {
      setInspectionData((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({ ...item, rating: null, comments: '' })),
        auditLog: [
          ...prev.auditLog,
          {
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            action: 'cleared_all',
            details: 'All ratings and comments cleared',
          },
        ],
      }));
    }
  };

  // Group items by category
  const groupedItems = inspectionData.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Calculate statistics
  const stats = {
    total: inspectionData.items.length,
    completed: inspectionData.items.filter((item) => item.rating !== null).length,
    good: inspectionData.items.filter((item) => item.rating === 'G').length,
    acceptable: inspectionData.items.filter((item) => item.rating === 'A').length,
    poor: inspectionData.items.filter((item) => item.rating === 'P').length,
    issues: inspectionData.items.filter((item) => ['SIN', 'SPS', 'SWO'].includes(item.rating || ''))
      .length,
  };

  return (
    <BaseLayout title="HSE Inspection">
      <div className="max-w-4xl mx-auto">
        {/* Status Banner */}
        {!isEditable && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-amber-800">Record Submitted</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This inspection has been saved and cannot be edited. Status:{' '}
                  <span className="font-medium capitalize">
                    {inspectionData.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">HSE Inspection</h1>
            <p className="text-sm text-gray-600 mt-1">Health, Safety & Environment Checklist</p>
          </div>

          <div className="p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contractor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.contractor}
                  onChange={(e) => handleHeaderChange('contractor', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter contractor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.location}
                  onChange={(e) => handleHeaderChange('location', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspected By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.inspectedBy}
                  onChange={(e) => handleHeaderChange('inspectedBy', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Inspector name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={inspectionData.date}
                  onChange={(e) => handleHeaderChange('date', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Progress Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.completed}/{stats.total}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{stats.good}</div>
                  <div className="text-xs text-gray-600">Good</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.acceptable}</div>
                  <div className="text-xs text-gray-600">Acceptable</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.poor}</div>
                  <div className="text-xs text-gray-600">Poor</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.issues}</div>
                  <div className="text-xs text-gray-600">Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round((stats.completed / stats.total) * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Legend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Guide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ratingOptions.map((option) => (
              <div key={option.value} className="flex items-center">
                <span className={`inline-block w-4 h-4 rounded mr-2 ${option.color}`} />
                <span className="text-xs text-gray-700">
                  {option.value} - {option.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      {/* Item Description */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">{item.item}</p>
                      </div>

                      {/* Rating Buttons - Mobile Optimized */}
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                        {ratingOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleRatingChange(item.id, option.value as RatingType)}
                            disabled={!isEditable}
                            className={`
                              px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 min-h-[44px] touch-manipulation
                              ${
                                !isEditable
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer active:scale-95'
                              }
                              ${
                                item.rating === option.value
                                  ? option.color
                                  : isEditable
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                  : 'bg-gray-50 text-gray-400 border border-gray-200'
                              }
                            `}
                          >
                            {option.value}
                          </button>
                        ))}
                      </div>

                      {/* Comments */}
                      <div>
                        <textarea
                          placeholder="Comments (optional)"
                          value={item.comments}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          disabled={!isEditable}
                          rows={2}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-sm ${
                            !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 mb-8">
          {isEditable ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors min-h-[52px] touch-manipulation active:scale-95"
              >
                <svg
                  className="inline w-5 h-5 mr-2"
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
                Save Inspection
              </button>

              <button
                onClick={handleClearAll}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors min-h-[52px] touch-manipulation active:scale-95"
              >
                <svg
                  className="inline w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-600 font-medium">
                Inspection saved on: {new Date(inspectionData.savedAt!).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Save Confirmation Modal */}
        {showSaveConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 mt-1">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0l-8.898 12c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Save</h3>
                    <p className="text-gray-600 mt-2">
                      <strong>Once saved, this record cannot be edited.</strong>
                      <br />
                      The inspection will be submitted for supervisor review.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => setShowSaveConfirmation(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSave}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Inspection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default ChecklistPage;
