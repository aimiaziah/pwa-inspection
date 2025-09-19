import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';

interface Template {
  id: string;
  name: string;
  description: string;
  categories: string[];
  itemCount: number;
  createdDate: string;
  lastModified: string;
  active: boolean;
}

const TemplatesAdmin: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Construction Site HSE',
      description: 'Complete HSE checklist for construction sites',
      categories: ['WORKING AREAS', 'PPE', 'EQUIPMENT & TOOLS', 'WORK AT HEIGHT'],
      itemCount: 25,
      createdDate: '2024-01-15',
      lastModified: '2024-01-20',
      active: true,
    },
    {
      id: '2',
      name: 'Office Safety Inspection',
      description: 'Safety checklist for office environments',
      categories: ['WORKING AREAS', 'FIRE SAFETY'],
      itemCount: 12,
      createdDate: '2024-01-10',
      lastModified: '2024-01-10',
      active: true,
    },
    {
      id: '3',
      name: 'Manufacturing Plant',
      description: 'Industrial manufacturing safety checklist',
      categories: ['PPE', 'EQUIPMENT & TOOLS', 'FIRE SAFETY'],
      itemCount: 18,
      createdDate: '2024-01-05',
      lastModified: '2024-01-18',
      active: true,
    },
  ]);

  const handleDuplicate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  };

  return (
    <AdminLayout title="Template Management">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Inspection Templates</h2>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            ➕ Create Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items:</span>
                    <span className="font-medium">{template.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categories:</span>
                    <span className="font-medium">{template.categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modified:</span>
                    <span className="font-medium">{template.lastModified}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-4">
                  {template.categories.map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <button className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="flex-1 px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TemplatesAdmin;
