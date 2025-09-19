import React, { useState } from 'react';
import BaseLayout from '@/layouts/BaseLayout';

// Types
type RatingType = 'G' | 'A' | 'P' | 'I' | 'SIN' | 'SPS' | 'SWO' | null;

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  rating: RatingType;
  comments: string;
}

interface InspectionData {
  contractor: string;
  location: string;
  inspectedBy: string;
  date: string;
  items: ChecklistItem[];
}

const ChecklistPage: React.FC = () => {
  // Initial inspection data
  const [inspectionData, setInspectionData] = useState<InspectionData>({
    contractor: '',
    location: '',
    inspectedBy: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      // NO. 1 Working Areas
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

      // NO. 2 SITE OFFICE
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

      // NO. 3 SITE OFFICE
      {
        id: '13',
        category: 'SITE OFFICE',
        item: 'Worker’s legality / age',
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

      // HOT WORK/ ELECTRICAL
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

  // Rating options with colors
  const ratingOptions = [
    { value: 'G', label: 'Good', color: 'bg-green-500 hover:bg-green-600 text-white' },
    { value: 'A', label: 'Acceptable', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { value: 'P', label: 'Poor', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { value: 'I', label: 'Irrelevant', color: 'bg-gray-400 hover:bg-gray-500 text-white' },
    { value: 'SIN', label: 'SIN', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    { value: 'SPS', label: 'SPS', color: 'bg-red-500 hover:bg-red-600 text-white' },
    { value: 'SWO', label: 'SWO', color: 'bg-red-700 hover:bg-red-800 text-white' },
  ];

  // Handle rating change
  const handleRatingChange = (itemId: string, rating: RatingType) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, rating } : item)),
    }));
  };

  // Handle comment change
  const handleCommentChange = (itemId: string, comments: string) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, comments } : item)),
    }));
  };

  // Handle header data change
  const handleHeaderChange = (field: string, value: string) => {
    setInspectionData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  // Export function
  const handleExport = () => {
    const dataStr = JSON.stringify(inspectionData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `inspection-${inspectionData.date}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <BaseLayout title="HSE Inspection Checklist">
      {/* Header Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">HSE Inspection Checklist</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
            <input
              type="text"
              value={inspectionData.contractor}
              onChange={(e) => handleHeaderChange('contractor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter contractor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={inspectionData.location}
              onChange={(e) => handleHeaderChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inspected By</label>
            <input
              type="text"
              value={inspectionData.inspectedBy}
              onChange={(e) => handleHeaderChange('inspectedBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Inspector name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={inspectionData.date}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Rating Legend:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
            <div>
              <span className="font-bold">G:</span> Good
            </div>
            <div>
              <span className="font-bold">A:</span> Acceptable
            </div>
            <div>
              <span className="font-bold">P:</span> Poor
            </div>
            <div>
              <span className="font-bold">I:</span> Irrelevant
            </div>
            <div>
              <span className="font-bold">SIN:</span> Safety Improvement Notice
            </div>
            <div>
              <span className="font-bold">SPS:</span> Safety Penalty System
            </div>
            <div>
              <span className="font-bold">SWO:</span> Stop Work Order
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Inspection Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.completed}/{stats.total}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.good}</div>
            <div className="text-sm text-gray-600">Good</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.acceptable}</div>
            <div className="text-sm text-gray-600">Acceptable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.poor}</div>
            <div className="text-sm text-gray-600">Poor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.issues}</div>
            <div className="text-sm text-gray-600">Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {Math.round((stats.completed / stats.total) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div
            key={category}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{category}</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Item Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.item}</p>
                    </div>

                    {/* Rating Buttons */}
                    <div className="flex flex-wrap gap-1">
                      {ratingOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleRatingChange(item.id, option.value as RatingType)}
                          className={`
                            px-3 py-1 rounded text-sm font-medium transition-colors
                            ${
                              item.rating === option.value
                                ? option.color
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }
                          `}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>

                    {/* Comments Input */}
                    <div className="flex-1 lg:max-w-xs">
                      <input
                        type="text"
                        placeholder="Comments..."
                        value={item.comments}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 mb-8">
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Export Results
        </button>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear all ratings?')) {
              setInspectionData((prev) => ({
                ...prev,
                items: prev.items.map((item) => ({ ...item, rating: null, comments: '' })),
              }));
            }
          }}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Clear All
        </button>

        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Print
        </button>
      </div>
    </BaseLayout>
  );
};

export default ChecklistPage;
