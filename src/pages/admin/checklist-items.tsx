// src/pages/admin/checklist-items.tsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  description?: string;
  inspectionType: 'hse' | 'fire_extinguisher' | 'first_aid';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  inspectionType: 'hse' | 'fire_extinguisher' | 'first_aid';
  isActive: boolean;
  createdAt: string;
}

const ChecklistItemsManagement: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form data
  const [itemFormData, setItemFormData] = useState({
    category: '',
    item: '',
    description: '',
    inspectionType: 'hse' as const,
    isActive: true,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    inspectionType: 'hse' as const,
    isActive: true,
  });

  // Filters
  const [filterInspectionType, setFilterInspectionType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const storedItems = storage.load('checklist_items', []);
      const storedCategories = storage.load('checklist_categories', []);

      setItems(storedItems);
      setCategories(storedCategories);

      // Initialize with default data if empty
      if (storedCategories.length === 0) {
        createDefaultCategories();
      }
      if (storedItems.length === 0) {
        createDefaultItems();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCategories = () => {
    const defaultCategories: Category[] = [
      // HSE Categories
      {
        id: '1',
        name: 'WORKING AREAS',
        description: 'General working area safety',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'SITE OFFICE',
        description: 'Office safety and compliance',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'LIFTING & RIGGING',
        description: 'Equipment and procedures',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'ELECTRICAL SAFETY',
        description: 'Electrical systems and safety',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'FALL PROTECTION',
        description: 'Fall arrest systems and safety',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
      },

      // Fire Extinguisher Categories
      {
        id: '6',
        name: 'PHYSICAL CONDITION',
        description: 'Physical state of extinguisher',
        inspectionType: 'fire_extinguisher',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '7',
        name: 'PRESSURE & SEALS',
        description: 'Pressure gauge and seals',
        inspectionType: 'fire_extinguisher',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '8',
        name: 'SIGNAGE & LOCATION',
        description: 'Visibility and accessibility',
        inspectionType: 'fire_extinguisher',
        isActive: true,
        createdAt: new Date().toISOString(),
      },

      // First Aid Categories
      {
        id: '9',
        name: 'BANDAGES & DRESSINGS',
        description: 'Wound care supplies',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '10',
        name: 'ANTISEPTIC & CLEANING',
        description: 'Cleaning and antiseptic supplies',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '11',
        name: 'TOOLS & EQUIPMENT',
        description: 'First aid tools and devices',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '12',
        name: 'EMERGENCY MEDICATIONS',
        description: 'Emergency medical supplies',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    storage.save('checklist_categories', defaultCategories);
    setCategories(defaultCategories);
  };

  const createDefaultItems = () => {
    const defaultItems: ChecklistItem[] = [
      // HSE Items
      {
        id: '1',
        category: 'WORKING AREAS',
        item: 'Housekeeping',
        description: 'General cleanliness and organization',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },
      {
        id: '2',
        category: 'WORKING AREAS',
        item: 'Proper barrier/safety signs',
        description: 'Safety signage and barriers',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },
      {
        id: '3',
        category: 'WORKING AREAS',
        item: 'Lighting adequacy',
        description: 'Sufficient lighting for work areas',
        inspectionType: 'hse',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },

      // Fire Extinguisher Items
      {
        id: '4',
        category: 'PHYSICAL CONDITION',
        item: 'Fire extinguisher is properly located and visible',
        description: 'Visibility and proper positioning',
        inspectionType: 'fire_extinguisher',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },
      {
        id: '5',
        category: 'PHYSICAL CONDITION',
        item: 'Access to fire extinguisher is unobstructed',
        description: 'Clear access path',
        inspectionType: 'fire_extinguisher',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },

      // First Aid Items
      {
        id: '6',
        category: 'BANDAGES & DRESSINGS',
        item: 'Adhesive Bandages (various sizes)',
        description: 'Standard adhesive bandages',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },
      {
        id: '7',
        category: 'BANDAGES & DRESSINGS',
        item: 'Sterile Gauze Pads (2x2, 4x4)',
        description: 'Sterile wound dressings',
        inspectionType: 'first_aid',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
      },
    ];

    storage.save('checklist_items', defaultItems);
    setItems(defaultItems);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterInspectionType !== 'all' && item.inspectionType !== filterInspectionType)
      return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (
      searchQuery &&
      !item.item.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // CRUD Operations for Items
  const handleCreateItem = () => {
    setEditingItem(null);
    setItemFormData({
      category: '',
      item: '',
      description: '',
      inspectionType: 'hse',
      isActive: true,
    });
    setShowItemModal(true);
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setItemFormData({
      category: item.category,
      item: item.item,
      description: item.description || '',
      inspectionType: item.inspectionType,
      isActive: item.isActive,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemFormData.item.trim() || !itemFormData.category.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const now = new Date().toISOString();
      let updatedItems;

      if (editingItem) {
        // Update existing item
        updatedItems = items.map((item) =>
          item.id === editingItem.id ? { ...item, ...itemFormData } : item,
        );
      } else {
        // Create new item
        const newItem: ChecklistItem = {
          id: Date.now().toString(),
          ...itemFormData,
          createdAt: now,
          createdBy: user?.name || 'Admin',
        };
        updatedItems = [...items, newItem];
      }

      storage.save('checklist_items', updatedItems);
      setItems(updatedItems);
      setShowItemModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedItems = items.filter((item) => item.id !== itemId);
      storage.save('checklist_items', updatedItems);
      setItems(updatedItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    }
  };

  // CRUD Operations for Categories
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      inspectionType: 'hse',
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      inspectionType: category.inspectionType,
      isActive: category.isActive,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name.trim()) {
      alert('Please enter a category name.');
      return;
    }

    try {
      const now = new Date().toISOString();
      let updatedCategories;

      if (editingCategory) {
        // Update existing category
        updatedCategories = categories.map((category) =>
          category.id === editingCategory.id ? { ...category, ...categoryFormData } : category,
        );
      } else {
        // Create new category
        const newCategory: Category = {
          id: Date.now().toString(),
          ...categoryFormData,
          createdAt: now,
        };
        updatedCategories = [...categories, newCategory];
      }

      storage.save('checklist_categories', updatedCategories);
      setCategories(updatedCategories);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;

    // Check if category is being used by items
    const itemsUsingCategory = items.filter((item) => item.category === category.name);
    if (itemsUsingCategory.length > 0) {
      alert(
        `Cannot delete category "${category.name}" because it is being used by ${itemsUsingCategory.length} item(s).`,
      );
      return;
    }

    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
      storage.save('checklist_categories', updatedCategories);
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  const getInspectionTypeLabel = (type: string) => {
    switch (type) {
      case 'hse':
        return 'HSE Inspection';
      case 'fire_extinguisher':
        return 'Fire Extinguisher';
      case 'first_aid':
        return 'First Aid Kit';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout title="Checklist Management">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading checklist data...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout title="Checklist Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checklist Management</h1>
              <p className="text-gray-600">Manage inspection checklist items and categories</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Category
              </button>
              <button
                onClick={handleCreateItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Item
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
                </div>
                <span className="text-4xl">📁</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-3xl font-bold text-gray-900">{items.length}</p>
                </div>
                <span className="text-4xl">📋</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">HSE Items</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {items.filter((i) => i.inspectionType === 'hse').length}
                  </p>
                </div>
                <span className="text-4xl">🛡️</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Items</p>
                  <p className="text-3xl font-bold text-green-600">
                    {items.filter((i) => i.isActive).length}
                  </p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items or categories..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Type
                </label>
                <select
                  value={filterInspectionType}
                  onChange={(e) => setFilterInspectionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="hse">HSE Inspection</option>
                  <option value="fire_extinguisher">Fire Extinguisher</option>
                  <option value="first_aid">First Aid Kit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories
                    .filter(
                      (cat) =>
                        filterInspectionType === 'all' ||
                        cat.inspectionType === filterInspectionType,
                    )
                    .map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterInspectionType('all');
                    setFilterCategory('all');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Checklist Items ({filteredItems.length})
              </h3>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No items found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.item}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getInspectionTypeLabel(item.inspectionType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Item Modal */}
          {showItemModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingItem ? 'Edit Checklist Item' : 'Create New Checklist Item'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={itemFormData.item}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, item: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter item name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={itemFormData.category}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Category</option>
                          {categories
                            .filter((cat) => cat.inspectionType === itemFormData.inspectionType)
                            .map((category) => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inspection Type *
                        </label>
                        <select
                          value={itemFormData.inspectionType}
                          onChange={(e) =>
                            setItemFormData({
                              ...itemFormData,
                              inspectionType: e.target.value as any,
                              category: '', // Reset category when type changes
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="hse">HSE Inspection</option>
                          <option value="fire_extinguisher">Fire Extinguisher</option>
                          <option value="first_aid">First Aid Kit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={itemFormData.description}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional description"
                        />
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={itemFormData.isActive}
                            onChange={(e) =>
                              setItemFormData({ ...itemFormData, isActive: e.target.checked })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={handleSaveItem}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingItem ? 'Update Item' : 'Create Item'}
                    </button>
                    <button
                      onClick={() => setShowItemModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          value={categoryFormData.name}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter category name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inspection Type *
                        </label>
                        <select
                          value={categoryFormData.inspectionType}
                          onChange={(e) =>
                            setCategoryFormData({
                              ...categoryFormData,
                              inspectionType: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="hse">HSE Inspection</option>
                          <option value="fire_extinguisher">Fire Extinguisher</option>
                          <option value="first_aid">First Aid Kit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={categoryFormData.description}
                          onChange={(e) =>
                            setCategoryFormData({
                              ...categoryFormData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional description"
                        />
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={categoryFormData.isActive}
                            onChange={(e) =>
                              setCategoryFormData({
                                ...categoryFormData,
                                isActive: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={handleSaveCategory}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                    <button
                      onClick={() => setShowCategoryModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ChecklistItemsManagement;
