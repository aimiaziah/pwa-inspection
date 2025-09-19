import React, { useState, useEffect } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';

type RatingType = 'PASS' | 'FAIL' | 'N/A' | null;
type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';
type UserRole = 'inspector' | 'supervisor' | 'admin';

interface FireExtinguisherItem {
  id: string;
  category: string;
  item: string;
  rating: RatingType;
  comments: string;
  requiresAction: boolean;
}

interface FireExtinguisherData {
  id: string;
  building: string;
  floor: string;
  location: string;
  extinguisherType: string;
  serialNumber: string;
  manufacturerDate: string;
  lastServiceDate: string;
  nextServiceDue: string;
  inspectedBy: string;
  inspectionDate: string;
  status: InspectionStatus;
  items: FireExtinguisherItem[];
  auditLog: Array<{
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }>;
  createdAt: string;
  savedAt?: string;
}

const FireExtinguisherInspection: React.FC = () => {
  const [currentUser] = useState<{ name: string; role: UserRole }>({
    name: 'John Inspector',
    role: 'inspector',
  });

  const [inspectionData, setInspectionData] = useState<FireExtinguisherData>({
    id: Date.now().toString(),
    building: '',
    floor: '',
    location: '',
    extinguisherType: 'ABC Dry Chemical',
    serialNumber: '',
    manufacturerDate: '',
    lastServiceDate: '',
    nextServiceDue: '',
    inspectedBy: currentUser.name,
    inspectionDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    createdAt: new Date().toISOString(),
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: 'created',
        details: 'Fire extinguisher inspection record created',
      },
    ],
    items: [
      // Physical Condition
      {
        id: '1',
        category: 'PHYSICAL CONDITION',
        item: 'Fire extinguisher is properly located and visible',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '2',
        category: 'PHYSICAL CONDITION',
        item: 'Access to fire extinguisher is unobstructed',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '3',
        category: 'PHYSICAL CONDITION',
        item: 'Extinguisher is mounted securely on wall bracket or stand',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '4',
        category: 'PHYSICAL CONDITION',
        item: 'Extinguisher shell is free of dents, rust, or corrosion',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '5',
        category: 'PHYSICAL CONDITION',
        item: 'Hose and nozzle are in good condition (no cracks or clogs)',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '6',
        category: 'PHYSICAL CONDITION',
        item: 'Extinguisher has not been discharged or tampered with',
        rating: null,
        comments: '',
        requiresAction: false,
      },

      // Labels and Signage
      {
        id: '7',
        category: 'LABELS & SIGNAGE',
        item: 'Instruction label is present and legible',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '8',
        category: 'LABELS & SIGNAGE',
        item: 'NFPA rating label is present and legible',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '9',
        category: 'LABELS & SIGNAGE',
        item: 'Maintenance tag/record is current and properly filled out',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '10',
        category: 'LABELS & SIGNAGE',
        item: 'Fire extinguisher signage is visible and properly positioned',
        rating: null,
        comments: '',
        requiresAction: false,
      },

      // Pressure and Weight
      {
        id: '11',
        category: 'PRESSURE & WEIGHT',
        item: 'Pressure gauge needle is in green zone (if equipped)',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '12',
        category: 'PRESSURE & WEIGHT',
        item: 'Extinguisher weight is within acceptable range',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '13',
        category: 'PRESSURE & WEIGHT',
        item: 'No signs of leakage around valve or connections',
        rating: null,
        comments: '',
        requiresAction: false,
      },

      // Safety Pin and Seal
      {
        id: '14',
        category: 'SAFETY PIN & SEAL',
        item: 'Safety pin is present and secure',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '15',
        category: 'SAFETY PIN & SEAL',
        item: 'Tamper seal is intact and not broken',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '16',
        category: 'SAFETY PIN & SEAL',
        item: 'Pull pin can be easily removed if needed',
        rating: null,
        comments: '',
        requiresAction: false,
      },

      // Service Requirements
      {
        id: '17',
        category: 'SERVICE REQUIREMENTS',
        item: 'Annual service date has not expired',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '18',
        category: 'SERVICE REQUIREMENTS',
        item: 'Hydrostatic test is current (if applicable)',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '19',
        category: 'SERVICE REQUIREMENTS',
        item: 'Six-year maintenance has been performed (if applicable)',
        rating: null,
        comments: '',
        requiresAction: false,
      },

      // Environmental Conditions
      {
        id: '20',
        category: 'ENVIRONMENTAL CONDITIONS',
        item: 'Extinguisher is protected from weather/environmental damage',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '21',
        category: 'ENVIRONMENTAL CONDITIONS',
        item: 'Temperature conditions are within operating range',
        rating: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '22',
        category: 'ENVIRONMENTAL CONDITIONS',
        item: 'No exposure to corrosive atmospheres or chemicals',
        rating: null,
        comments: '',
        requiresAction: false,
      },
    ],
  });

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Extinguisher types
  const extinguisherTypes = [
    'ABC Dry Chemical',
    'BC Dry Chemical',
    'Class A Water',
    'Class D Metal',
    'Class K Kitchen',
    'CO2 Carbon Dioxide',
    'Foam AFFF',
    'Halotron',
    'Other',
  ];

  // Check if inspection is editable
  const isEditable = inspectionData.status === 'draft';

  // Handle rating change
  const handleRatingChange = (itemId: string, rating: RatingType) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, rating, requiresAction: rating === 'FAIL' } : item,
      ),
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

  // Calculate next service due date when last service date changes
  useEffect(() => {
    if (inspectionData.lastServiceDate && isEditable) {
      const lastService = new Date(inspectionData.lastServiceDate);
      const nextService = new Date(lastService);
      nextService.setFullYear(nextService.getFullYear() + 1);

      setInspectionData((prev) => ({
        ...prev,
        nextServiceDue: nextService.toISOString().split('T')[0],
      }));
    }
  }, [inspectionData.lastServiceDate, isEditable]);

  // Save inspection
  const handleSave = () => {
    // Validation
    const missingFields = [];
    if (!inspectionData.building) missingFields.push('Building');
    if (!inspectionData.location) missingFields.push('Location');
    if (!inspectionData.serialNumber) missingFields.push('Serial Number');
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
          details: 'Fire extinguisher inspection submitted for review',
        },
      ],
    };

    // Save to localStorage
    const existingInspections = storage.load('fire_extinguisher_inspections') || [];
    const updatedInspections = [...existingInspections, savedInspection];
    storage.save('fire_extinguisher_inspections', updatedInspections);

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
        items: prev.items.map((item) => ({
          ...item,
          rating: null,
          comments: '',
          requiresAction: false,
        })),
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
  }, {} as Record<string, FireExtinguisherItem[]>);

  // Calculate statistics
  const stats = {
    total: inspectionData.items.length,
    completed: inspectionData.items.filter((item) => item.rating !== null).length,
    passed: inspectionData.items.filter((item) => item.rating === 'PASS').length,
    failed: inspectionData.items.filter((item) => item.rating === 'FAIL').length,
    notApplicable: inspectionData.items.filter((item) => item.rating === 'N/A').length,
    requiresAction: inspectionData.items.filter((item) => item.requiresAction).length,
  };

  const overallStatus =
    stats.failed > 0 ? 'NEEDS ATTENTION' : stats.completed === stats.total ? 'PASS' : 'INCOMPLETE';

  return (
    <BaseLayout title="Fire Extinguisher Inspection">
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
            <h1 className="text-2xl font-bold text-gray-900">Fire Extinguisher Inspection</h1>
            <p className="text-sm text-gray-600 mt-1">Equipment Safety Verification</p>
          </div>

          <div className="p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.building}
                  onChange={(e) => handleHeaderChange('building', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Building name or number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                <input
                  type="text"
                  value={inspectionData.floor}
                  onChange={(e) => handleHeaderChange('floor', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Floor number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.location}
                  onChange={(e) => handleHeaderChange('location', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Near elevator, hallway, etc."
                />
              </div>
            </div>

            {/* Extinguisher Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extinguisher Type
                </label>
                <select
                  value={inspectionData.extinguisherType}
                  onChange={(e) => handleHeaderChange('extinguisherType', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  {extinguisherTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inspectionData.serialNumber}
                  onChange={(e) => handleHeaderChange('serialNumber', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Serial number from label"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer Date
                </label>
                <input
                  type="date"
                  value={inspectionData.manufacturerDate}
                  onChange={(e) => handleHeaderChange('manufacturerDate', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Service Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Service Date
                </label>
                <input
                  type="date"
                  value={inspectionData.lastServiceDate}
                  onChange={(e) => handleHeaderChange('lastServiceDate', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Service Due
                </label>
                <input
                  type="date"
                  value={inspectionData.nextServiceDue}
                  onChange={(e) => handleHeaderChange('nextServiceDue', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Inspector Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Date
                </label>
                <input
                  type="date"
                  value={inspectionData.inspectionDate}
                  onChange={(e) => handleHeaderChange('inspectionDate', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Progress Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Inspection Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.completed}/{stats.total}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{stats.passed}</div>
                  <div className="text-xs text-gray-600">Pass</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.failed}</div>
                  <div className="text-xs text-gray-600">Fail</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{stats.notApplicable}</div>
                  <div className="text-xs text-gray-600">N/A</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.requiresAction}</div>
                  <div className="text-xs text-gray-600">Action Req.</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      overallStatus === 'PASS'
                        ? 'text-emerald-600'
                        : overallStatus === 'NEEDS ATTENTION'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {overallStatus}
                  </div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
              </div>
            </div>
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
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {(['PASS', 'FAIL', 'N/A'] as const).map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRatingChange(item.id, rating)}
                            disabled={!isEditable}
                            className={`
                              px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-h-[48px] touch-manipulation
                              ${
                                !isEditable
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer active:scale-95'
                              }
                              ${
                                item.rating === rating
                                  ? rating === 'PASS'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : rating === 'FAIL'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                                  : isEditable
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                  : 'bg-gray-50 text-gray-400 border border-gray-200'
                              }
                            `}
                          >
                            {rating}
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

                      {/* Action Required Badge */}
                      {item.requiresAction && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Action Required
                          </span>
                        </div>
                      )}
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

export default FireExtinguisherInspection;
