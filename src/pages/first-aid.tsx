import React, { useState } from 'react';
import BaseLayout from '@/layouts/BaseLayout';
import { storage } from '@/utils/storage';

type ItemStatus = 'GOOD' | 'LOW' | 'EXPIRED' | 'MISSING' | 'DAMAGED' | null;
type InspectionStatus =
  | 'draft'
  | 'submitted'
  | 'supervisor_approved'
  | 'admin_approved'
  | 'completed';
type UserRole = 'inspector' | 'supervisor' | 'admin';

interface FirstAidItem {
  id: string;
  category: string;
  item: string;
  requiredQuantity: number;
  currentQuantity: number;
  status: ItemStatus;
  expiryDate?: string;
  comments: string;
  requiresAction: boolean;
}

interface FirstAidInspectionData {
  id: string;
  building: string;
  floor: string;
  location: string;
  kitType: string;
  kitSerialNumber: string;
  lastRestockDate: string;
  inspectedBy: string;
  inspectionDate: string;
  status: InspectionStatus;
  items: FirstAidItem[];
  auditLog: Array<{
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }>;
  createdAt: string;
  savedAt?: string;
}

const FirstAidInspection: React.FC = () => {
  const [currentUser] = useState<{ name: string; role: UserRole }>({
    name: 'John Inspector',
    role: 'inspector',
  });

  const [inspectionData, setInspectionData] = useState<FirstAidInspectionData>({
    id: Date.now().toString(),
    building: '',
    floor: '',
    location: '',
    kitType: 'Standard Workplace Kit',
    kitSerialNumber: '',
    lastRestockDate: '',
    inspectedBy: currentUser.name,
    inspectionDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    createdAt: new Date().toISOString(),
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: 'created',
        details: 'First aid kit inspection record created',
      },
    ],
    items: [
      // Wound Care Supplies
      {
        id: '1',
        category: 'WOUND CARE',
        item: 'Adhesive Bandages (assorted sizes)',
        requiredQuantity: 20,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '2',
        category: 'WOUND CARE',
        item: 'Sterile Gauze Pads (2x2 inch)',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '3',
        category: 'WOUND CARE',
        item: 'Sterile Gauze Pads (4x4 inch)',
        requiredQuantity: 5,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '4',
        category: 'WOUND CARE',
        item: 'Medical Tape (1 inch)',
        requiredQuantity: 2,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '5',
        category: 'WOUND CARE',
        item: 'Elastic Bandages (various sizes)',
        requiredQuantity: 3,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '6',
        category: 'WOUND CARE',
        item: 'Triangular Bandages',
        requiredQuantity: 2,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },

      // Antiseptic & Cleaning
      {
        id: '7',
        category: 'ANTISEPTIC & CLEANING',
        item: 'Antiseptic Wipes/Towelettes',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '8',
        category: 'ANTISEPTIC & CLEANING',
        item: 'Antibiotic Ointment Packets',
        requiredQuantity: 5,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '9',
        category: 'ANTISEPTIC & CLEANING',
        item: 'Alcohol Prep Pads',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '10',
        category: 'ANTISEPTIC & CLEANING',
        item: 'Hand Sanitizer (small bottle)',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },

      // Tools & Equipment
      {
        id: '11',
        category: 'TOOLS & EQUIPMENT',
        item: 'Disposable Gloves (pairs)',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '12',
        category: 'TOOLS & EQUIPMENT',
        item: 'Scissors (medical)',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '13',
        category: 'TOOLS & EQUIPMENT',
        item: 'Tweezers',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '14',
        category: 'TOOLS & EQUIPMENT',
        item: 'Digital Thermometer',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '15',
        category: 'TOOLS & EQUIPMENT',
        item: 'CPR Face Mask/Shield',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },

      // Emergency Medications
      {
        id: '16',
        category: 'EMERGENCY MEDICATIONS',
        item: 'Pain Reliever (Ibuprofen/Acetaminophen)',
        requiredQuantity: 20,
        currentQuantity: 0,
        status: null,
        expiryDate: '',
        comments: '',
        requiresAction: false,
      },
      {
        id: '17',
        category: 'EMERGENCY MEDICATIONS',
        item: 'Aspirin (for heart attack)',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        expiryDate: '',
        comments: '',
        requiresAction: false,
      },
      {
        id: '18',
        category: 'EMERGENCY MEDICATIONS',
        item: 'Antihistamine (for allergic reactions)',
        requiredQuantity: 10,
        currentQuantity: 0,
        status: null,
        expiryDate: '',
        comments: '',
        requiresAction: false,
      },

      // Documentation
      {
        id: '19',
        category: 'DOCUMENTATION',
        item: 'First Aid Manual/Guide',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '20',
        category: 'DOCUMENTATION',
        item: 'Emergency Contact List',
        requiredQuantity: 1,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
      {
        id: '21',
        category: 'DOCUMENTATION',
        item: 'Incident Report Forms',
        requiredQuantity: 5,
        currentQuantity: 0,
        status: null,
        comments: '',
        requiresAction: false,
      },
    ],
  });

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Kit types
  const kitTypes = [
    'Standard Workplace Kit',
    'Industrial/Heavy Duty Kit',
    'Vehicle/Mobile Kit',
    'Sports/Recreation Kit',
    'Laboratory Kit',
    'Kitchen/Food Service Kit',
    'Construction Site Kit',
    'Office Environment Kit',
    'Custom Kit',
  ];

  // Status options with professional colors
  const statusOptions = [
    { value: 'GOOD', label: 'Good', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { value: 'LOW', label: 'Low Stock', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
    { value: 'EXPIRED', label: 'Expired', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { value: 'MISSING', label: 'Missing', color: 'bg-red-700 hover:bg-red-800 text-white' },
    { value: 'DAMAGED', label: 'Damaged', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
  ];

  // Check if inspection is editable
  const isEditable = inspectionData.status === 'draft';

  // Handle quantity change
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, currentQuantity: Math.max(0, quantity) };
          // Auto-determine status based on quantity
          if (updatedItem.currentQuantity === 0) {
            updatedItem.status = 'MISSING';
            updatedItem.requiresAction = true;
          } else if (updatedItem.currentQuantity < updatedItem.requiredQuantity * 0.3) {
            updatedItem.status = 'LOW';
            updatedItem.requiresAction = true;
          } else if (
            !updatedItem.status ||
            updatedItem.status === 'MISSING' ||
            updatedItem.status === 'LOW'
          ) {
            updatedItem.status = 'GOOD';
            updatedItem.requiresAction = false;
          }
          return updatedItem;
        }
        return item;
      }),
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'quantity_changed',
          details: `Quantity changed for item ${itemId} to ${quantity}`,
        },
      ],
    }));
  };

  // Handle status change
  const handleStatusChange = (itemId: string, status: ItemStatus) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              requiresAction: ['LOW', 'EXPIRED', 'MISSING', 'DAMAGED'].includes(status || ''),
            }
          : item,
      ),
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'status_changed',
          details: `Status changed for item ${itemId} to ${status}`,
        },
      ],
    }));
  };

  // Handle expiry date change
  const handleExpiryDateChange = (itemId: string, expiryDate: string) => {
    if (!isEditable) return;

    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, expiryDate };
          // Check if expired
          if (expiryDate && new Date(expiryDate) < new Date()) {
            updatedItem.status = 'EXPIRED';
            updatedItem.requiresAction = true;
          }
          return updatedItem;
        }
        return item;
      }),
      auditLog: [
        ...prev.auditLog,
        {
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          action: 'expiry_changed',
          details: `Expiry date changed for item ${itemId} to ${expiryDate}`,
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
    if (!inspectionData.building) missingFields.push('Building');
    if (!inspectionData.location) missingFields.push('Location');
    if (!inspectionData.inspectedBy) missingFields.push('Inspected By');

    const unratedItems = inspectionData.items.filter((item) => item.status === null).length;

    if (missingFields.length > 0) {
      setSaveError(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (unratedItems > 0) {
      setSaveError(`Please check all items. ${unratedItems} items remaining.`);
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
          details: 'First aid kit inspection submitted for review',
        },
      ],
    };

    // Save to localStorage
    const existingInspections = storage.load('first_aid_inspections') || [];
    const updatedInspections = [...existingInspections, savedInspection];
    storage.save('first_aid_inspections', updatedInspections);

    setInspectionData(savedInspection);
    setShowSaveConfirmation(false);
    setSaveError(null);
  };

  // Clear all data
  const handleClearAll = () => {
    if (!isEditable) return;

    if (confirm('Are you sure you want to clear all quantities, statuses, and comments?')) {
      setInspectionData((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          currentQuantity: 0,
          status: null,
          comments: '',
          requiresAction: false,
          expiryDate: '',
        })),
        auditLog: [
          ...prev.auditLog,
          {
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            action: 'cleared_all',
            details: 'All quantities, statuses, and comments cleared',
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
  }, {} as Record<string, FirstAidItem[]>);

  // Calculate statistics
  const stats = {
    total: inspectionData.items.length,
    completed: inspectionData.items.filter((item) => item.status !== null).length,
    good: inspectionData.items.filter((item) => item.status === 'GOOD').length,
    lowStock: inspectionData.items.filter((item) => item.status === 'LOW').length,
    expired: inspectionData.items.filter((item) => item.status === 'EXPIRED').length,
    missing: inspectionData.items.filter((item) => item.status === 'MISSING').length,
    damaged: inspectionData.items.filter((item) => item.status === 'DAMAGED').length,
    requiresAction: inspectionData.items.filter((item) => item.requiresAction).length,
  };

  const overallStatus =
    stats.missing > 0 || stats.expired > 0 || stats.damaged > 0
      ? 'NEEDS IMMEDIATE ATTENTION'
      : stats.lowStock > 0
      ? 'NEEDS RESTOCKING'
      : stats.completed === stats.total
      ? 'READY'
      : 'INCOMPLETE';

  return (
    <BaseLayout title="First Aid Kit Inspection">
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
            <h1 className="text-2xl font-bold text-gray-900">First Aid Kit Inspection</h1>
            <p className="text-sm text-gray-600 mt-1">Emergency Supplies Verification</p>
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
                  placeholder="Break room, hallway, etc."
                />
              </div>
            </div>

            {/* Kit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kit Type</label>
                <select
                  value={inspectionData.kitType}
                  onChange={(e) => handleHeaderChange('kitType', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  {kitTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kit Serial/ID Number
                </label>
                <input
                  type="text"
                  value={inspectionData.kitSerialNumber}
                  onChange={(e) => handleHeaderChange('kitSerialNumber', e.target.value)}
                  disabled={!isEditable}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="Kit identification number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Restock Date
                </label>
                <input
                  type="date"
                  value={inspectionData.lastRestockDate}
                  onChange={(e) => handleHeaderChange('lastRestockDate', e.target.value)}
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
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Kit Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.completed}/{stats.total}
                  </div>
                  <div className="text-xs text-gray-600">Checked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{stats.good}</div>
                  <div className="text-xs text-gray-600">Good</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.lowStock}</div>
                  <div className="text-xs text-gray-600">Low Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.expired}</div>
                  <div className="text-xs text-gray-600">Expired</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-700">{stats.missing}</div>
                  <div className="text-xs text-gray-600">Missing</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.damaged}</div>
                  <div className="text-xs text-gray-600">Damaged</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      overallStatus === 'READY'
                        ? 'text-emerald-600'
                        : overallStatus.includes('IMMEDIATE')
                        ? 'text-red-600'
                        : overallStatus.includes('RESTOCKING')
                        ? 'text-amber-600'
                        : 'text-gray-600'
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
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      {/* Item Header */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{item.item}</h4>
                        <p className="text-xs text-gray-500">Required: {item.requiredQuantity}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Current Quantity */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Current Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.currentQuantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                            }
                            disabled={!isEditable}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Status
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {statusOptions.slice(0, 2).map((option) => (
                              <button
                                key={option.value}
                                onClick={() =>
                                  handleStatusChange(item.id, option.value as ItemStatus)
                                }
                                disabled={!isEditable}
                                className={`
                                  px-2 py-2 text-xs font-medium rounded transition-all duration-200 touch-manipulation
                                  ${
                                    !isEditable
                                      ? 'cursor-not-allowed opacity-50'
                                      : 'cursor-pointer active:scale-95'
                                  }
                                  ${
                                    item.status === option.value
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
                            {statusOptions.slice(2).map((option) => (
                              <button
                                key={option.value}
                                onClick={() =>
                                  handleStatusChange(item.id, option.value as ItemStatus)
                                }
                                disabled={!isEditable}
                                className={`
                                  px-2 py-2 text-xs font-medium rounded transition-all duration-200 touch-manipulation
                                  ${
                                    !isEditable
                                      ? 'cursor-not-allowed opacity-50'
                                      : 'cursor-pointer active:scale-95'
                                  }
                                  ${
                                    item.status === option.value
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
                        </div>

                        {/* Expiry Date (for medications) */}
                        {item.category === 'EMERGENCY MEDICATIONS' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleExpiryDateChange(item.id, e.target.value)}
                              disabled={!isEditable}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            />
                          </div>
                        )}

                        {/* Comments */}
                        <div
                          className={
                            item.category === 'EMERGENCY MEDICATIONS' ? '' : 'sm:col-span-2'
                          }
                        >
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            Comments
                          </label>
                          <input
                            type="text"
                            placeholder="Notes..."
                            value={item.comments}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            disabled={!isEditable}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              !isEditable ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Action Required Badge */}
                      {item.requiresAction && (
                        <div className="mt-3">
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

export default FirstAidInspection;
