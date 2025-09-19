import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  active: boolean;
}

const CategoriesAdmin: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'WORKING AREAS',
      description: 'General workplace safety',
      icon: '🏗️',
      itemCount: 8,
      active: true,
    },
    {
      id: '2',
      name: 'PPE',
      description: 'Personal Protective Equipment',
      icon: '🦺',
      itemCount: 7,
      active: true,
    },
    {
      id: '3',
      name: 'EQUIPMENT & TOOLS',
      description: 'Equipment safety and maintenance',
      icon: '🔧',
      itemCount: 5,
      active: true,
    },
    {
      id: '4',
      name: 'WORK AT HEIGHT',
      description: 'Height safety requirements',
      icon: '🪜',
      itemCount: 5,
      active: true,
    },
    {
      id: '5',
      name: 'FIRE SAFETY',
      description: 'Fire prevention and response',
      icon: '🔥',
      itemCount: 4,
      active: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this category? All associated items will be unassigned.',
      )
    ) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const handleSave = () => {
    if (editingCategory) {
      setCategories(
        categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, ...formData } : cat)),
      );
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        itemCount: 0,
        active: true,
      };
      setCategories([...categories, newCategory]);
    }
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
  };

  const toggleActive = (id: string) => {
    setCategories(categories.map((cat) => (cat.id === id ? { ...cat, active: !cat.active } : cat)));
  };

  return (
    <AdminLayout title="Category Management">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', icon: '' });
              setShowModal(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ➕ Add Category
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{category.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.itemCount} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(category.id)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        category.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter an emoji"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoriesAdmin;
