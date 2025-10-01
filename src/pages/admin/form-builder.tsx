// src/pages/admin/form-builder.tsx - Dynamic Form Builder for Inspection Templates
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { storage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';

interface FormField {
  id: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'rating' | 'textarea' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  category: string;
  order: number;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  inspectionType: 'hse' | 'fire_extinguisher' | 'first_aid' | 'custom';
  fields: FormField[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  version: string;
}

const FormBuilder: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form builder state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    inspectionType: 'custom' as const,
    isActive: true,
  });

  // Field builder state
  const [fields, setFields] = useState<FormField[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldFormData, setFieldFormData] = useState({
    type: 'text' as const,
    label: '',
    placeholder: '',
    required: false,
    options: [''],
    category: '',
    validation: {
      minLength: undefined as number | undefined,
      maxLength: undefined as number | undefined,
      pattern: '',
    },
  });

  // Categories for grouping fields
  const [categories, setCategories] = useState<string[]>(['General', 'Safety', 'Compliance']);
  const [newCategory, setNewCategory] = useState('');

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setLoading(true);
    try {
      const storedTemplates = storage.load('form_templates', []) as FormTemplate[];

      // Initialize with default templates if none exist
      if (storedTemplates.length === 0) {
        const defaultTemplates = createDefaultTemplates();
        storage.save('form_templates', defaultTemplates);
        setTemplates(defaultTemplates);
      } else {
        setTemplates(storedTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = (): FormTemplate[] => {
    const now = new Date().toISOString();

    return [
      {
        id: '1',
        name: 'Standard HSE Inspection',
        description: 'Default Health, Safety & Environment inspection form',
        inspectionType: 'hse',
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'Inspector Name',
            required: true,
            category: 'General',
            order: 1,
          },
          {
            id: '2',
            type: 'date',
            label: 'Inspection Date',
            required: true,
            category: 'General',
            order: 2,
          },
          {
            id: '3',
            type: 'text',
            label: 'Location',
            required: true,
            category: 'General',
            order: 3,
          },
          {
            id: '4',
            type: 'rating',
            label: 'Overall Safety Rating',
            required: true,
            options: ['G', 'A', 'P', 'I', 'SIN', 'SPS', 'SWO'],
            category: 'Safety',
            order: 4,
          },
        ],
        isActive: true,
        isDefault: true,
        createdAt: now,
        createdBy: 'System',
        version: '1.0',
      },
      {
        id: '2',
        name: 'Fire Extinguisher Check',
        description: 'Standard fire extinguisher inspection template',
        inspectionType: 'fire_extinguisher',
        fields: [
          {
            id: '1',
            type: 'text',
            label: 'Extinguisher Serial Number',
            required: true,
            category: 'General',
            order: 1,
          },
          {
            id: '2',
            type: 'select',
            label: 'Extinguisher Type',
            required: true,
            options: ['ABC Dry Chemical', 'CO2', 'Water', 'Foam', 'Wet Chemical'],
            category: 'General',
            order: 2,
          },
          {
            id: '3',
            type: 'radio',
            label: 'Physical Condition',
            required: true,
            options: ['PASS', 'FAIL', 'N/A'],
            category: 'Safety',
            order: 3,
          },
        ],
        isActive: true,
        isDefault: true,
        createdAt: now,
        createdBy: 'System',
        version: '1.0',
      },
    ];
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      description: '',
      inspectionType: 'custom',
      isActive: true,
    });
    setFields([]);
    setShowBuilderModal(true);
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description,
      inspectionType: template.inspectionType,
      isActive: template.isActive,
    });
    setFields([...template.fields]);
    setShowBuilderModal(true);
  };

  const handleSaveTemplate = () => {
    try {
      if (!templateFormData.name.trim()) {
        alert('Please enter a template name.');
        return;
      }

      if (fields.length === 0) {
        alert('Please add at least one field to the template.');
        return;
      }

      const now = new Date().toISOString();
      let updatedTemplates;

      if (editingTemplate) {
        // Update existing template
        updatedTemplates = templates.map((template) =>
          template.id === editingTemplate.id
            ? {
                ...template,
                ...templateFormData,
                fields: fields.map((field, index) => ({ ...field, order: index + 1 })),
                version: incrementVersion(template.version),
              }
            : template,
        );
      } else {
        // Create new template
        const newTemplate: FormTemplate = {
          id: Date.now().toString(),
          ...templateFormData,
          fields: fields.map((field, index) => ({ ...field, order: index + 1 })),
          isDefault: false,
          createdAt: now,
          createdBy: user?.name || 'Admin',
          version: '1.0',
        };
        updatedTemplates = [...templates, newTemplate];
      }

      storage.save('form_templates', updatedTemplates);
      setTemplates(updatedTemplates);
      setShowBuilderModal(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (template.isDefault) {
      alert('Default templates cannot be deleted.');
      return;
    }

    if (
      !confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const updatedTemplates = templates.filter((t) => t.id !== templateId);
      storage.save('form_templates', updatedTemplates);
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const patch = parseInt(parts[parts.length - 1]) + 1;
    parts[parts.length - 1] = patch.toString();
    return parts.join('.');
  };

  // Field Management
  const handleAddField = () => {
    setEditingField(null);
    setFieldFormData({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [''],
      category: categories[0] || 'General',
      validation: {
        minLength: undefined,
        maxLength: undefined,
        pattern: '',
      },
    });
    setShowFieldModal(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldFormData({
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required,
      options: field.options || [''],
      category: field.category,
      validation: field.validation || {
        minLength: undefined,
        maxLength: undefined,
        pattern: '',
      },
    });
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    try {
      if (!fieldFormData.label.trim()) {
        alert('Please enter a field label.');
        return;
      }

      const newField: FormField = {
        id: editingField?.id || Date.now().toString(),
        type: fieldFormData.type,
        label: fieldFormData.label,
        placeholder: fieldFormData.placeholder || undefined,
        required: fieldFormData.required,
        options: ['select', 'radio', 'checkbox'].includes(fieldFormData.type)
          ? fieldFormData.options.filter((opt) => opt.trim())
          : undefined,
        validation: {
          minLength: fieldFormData.validation.minLength || undefined,
          maxLength: fieldFormData.validation.maxLength || undefined,
          pattern: fieldFormData.validation.pattern || undefined,
        },
        category: fieldFormData.category,
        order: editingField?.order || fields.length + 1,
      };

      if (editingField) {
        setFields(fields.map((f) => (f.id === editingField.id ? newField : f)));
      } else {
        setFields([...fields, newField]);
      }

      setShowFieldModal(false);
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Error saving field. Please try again.');
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[fieldIndex], newFields[targetIndex]] = [
        newFields[targetIndex],
        newFields[fieldIndex],
      ];
      setFields(newFields);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'select':
        return '📋';
      case 'radio':
        return '⚪';
      case 'checkbox':
        return '☑️';
      case 'rating':
        return '⭐';
      case 'textarea':
        return '📄';
      case 'date':
        return '📅';
      case 'file':
        return '📎';
      default:
        return '📝';
    }
  };

  const groupFieldsByCategory = (fields: FormField[]) => {
    return fields.reduce((acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    }, {} as Record<string, FormField[]>);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canManageForms">
        <AdminLayout title="Form Builder">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading form templates...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="canManageForms">
      <AdminLayout title="Form Builder">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dynamic Form Builder</h1>
              <p className="text-gray-600">Create and manage custom inspection form templates</p>
            </div>
            <button
              onClick={handleCreateTemplate}
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
              Create Template
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {template.isDefault && <span className="mr-2">🛡️</span>}
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">
                      {template.inspectionType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fields:</span>
                    <span className="font-medium">{template.fields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">v{template.version}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    {template.isDefault ? 'View' : 'Edit'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setFields([...template.fields]);
                      setShowPreview(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Preview
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No form templates found.</p>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Template
              </button>
            </div>
          )}

          {/* Form Builder Modal */}
          {showBuilderModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingTemplate
                        ? `Edit Template: ${editingTemplate.name}`
                        : 'Create New Template'}
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Template Settings */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Template Settings</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name *
                          </label>
                          <input
                            type="text"
                            value={templateFormData.name}
                            onChange={(e) =>
                              setTemplateFormData({ ...templateFormData, name: e.target.value })
                            }
                            disabled={editingTemplate?.isDefault}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="Enter template name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={templateFormData.description}
                            onChange={(e) =>
                              setTemplateFormData({
                                ...templateFormData,
                                description: e.target.value,
                              })
                            }
                            disabled={editingTemplate?.isDefault}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="Describe the template"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inspection Type
                          </label>
                          <select
                            value={templateFormData.inspectionType}
                            onChange={(e) =>
                              setTemplateFormData({
                                ...templateFormData,
                                inspectionType: e.target.value as any,
                              })
                            }
                            disabled={editingTemplate?.isDefault}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          >
                            <option value="hse">HSE Inspection</option>
                            <option value="fire_extinguisher">Fire Extinguisher</option>
                            <option value="first_aid">First Aid Kit</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {!editingTemplate?.isDefault && (
                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={templateFormData.isActive}
                                onChange={(e) =>
                                  setTemplateFormData({
                                    ...templateFormData,
                                    isActive: e.target.checked,
                                  })
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Active</span>
                            </label>
                          </div>
                        )}

                        {/* Categories Management */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Categories
                          </label>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <span
                                key={category}
                                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mr-2"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                          <div className="flex mt-2">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="Add category"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={addCategory}
                              className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Fields Management */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">
                            Form Fields ({fields.length})
                          </h4>
                          {!editingTemplate?.isDefault && (
                            <button
                              onClick={handleAddField}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Add Field
                            </button>
                          )}
                        </div>

                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          {Object.entries(groupFieldsByCategory(fields)).map(
                            ([category, categoryFields]) => (
                              <div
                                key={category}
                                className="p-4 border-b border-gray-200 last:border-b-0"
                              >
                                <h5 className="font-medium text-gray-800 mb-2">{category}</h5>
                                <div className="space-y-2">
                                  {categoryFields.map((field) => (
                                    <div
                                      key={field.id}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                      <div className="flex items-center">
                                        <span className="mr-2">{getFieldTypeIcon(field.type)}</span>
                                        <span className="text-sm font-medium">{field.label}</span>
                                        {field.required && (
                                          <span className="ml-2 text-red-500">*</span>
                                        )}
                                      </div>
                                      {!editingTemplate?.isDefault && (
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => handleMoveField(field.id, 'up')}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                          >
                                            ↑
                                          </button>
                                          <button
                                            onClick={() => handleMoveField(field.id, 'down')}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                          >
                                            ↓
                                          </button>
                                          <button
                                            onClick={() => handleEditField(field)}
                                            className="p-1 text-blue-600 hover:text-blue-800"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            onClick={() => handleDeleteField(field.id)}
                                            className="p-1 text-red-600 hover:text-red-800"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                          {fields.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                              No fields added yet. Click "Add Field" to get started.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    {!editingTemplate?.isDefault && (
                      <button
                        onClick={handleSaveTemplate}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowBuilderModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingTemplate?.isDefault ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Field Builder Modal */}
          {showFieldModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingField ? 'Edit Field' : 'Add New Field'}
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Type *
                          </label>
                          <select
                            value={fieldFormData.type}
                            onChange={(e) =>
                              setFieldFormData({ ...fieldFormData, type: e.target.value as any })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="text">Text Input</option>
                            <option value="textarea">Text Area</option>
                            <option value="select">Dropdown</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="rating">Rating Scale</option>
                            <option value="date">Date Picker</option>
                            <option value="file">File Upload</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                          </label>
                          <select
                            value={fieldFormData.category}
                            onChange={(e) =>
                              setFieldFormData({ ...fieldFormData, category: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          value={fieldFormData.label}
                          onChange={(e) =>
                            setFieldFormData({ ...fieldFormData, label: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter field label"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          value={fieldFormData.placeholder}
                          onChange={(e) =>
                            setFieldFormData({ ...fieldFormData, placeholder: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter placeholder text"
                        />
                      </div>

                      {['select', 'radio', 'checkbox', 'rating'].includes(fieldFormData.type) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options
                          </label>
                          <div className="space-y-2">
                            {fieldFormData.options.map((option, index) => (
                              <div key={index} className="flex">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...fieldFormData.options];
                                    newOptions[index] = e.target.value;
                                    setFieldFormData({ ...fieldFormData, options: newOptions });
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Option ${index + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const newOptions = fieldFormData.options.filter(
                                      (_, i) => i !== index,
                                    );
                                    setFieldFormData({ ...fieldFormData, options: newOptions });
                                  }}
                                  className="px-3 py-2 bg-red-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-red-200 text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setFieldFormData({
                                  ...fieldFormData,
                                  options: [...fieldFormData.options, ''],
                                })
                              }
                              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Add Option
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fieldFormData.required}
                            onChange={(e) =>
                              setFieldFormData({ ...fieldFormData, required: e.target.checked })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required field</span>
                        </label>
                      </div>

                      {['text', 'textarea'].includes(fieldFormData.type) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min Length
                            </label>
                            <input
                              type="number"
                              value={fieldFormData.validation.minLength || ''}
                              onChange={(e) =>
                                setFieldFormData({
                                  ...fieldFormData,
                                  validation: {
                                    ...fieldFormData.validation,
                                    minLength: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Min characters"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max Length
                            </label>
                            <input
                              type="number"
                              value={fieldFormData.validation.maxLength || ''}
                              onChange={(e) =>
                                setFieldFormData({
                                  ...fieldFormData,
                                  validation: {
                                    ...fieldFormData.validation,
                                    maxLength: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Max characters"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={handleSaveField}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingField ? 'Update Field' : 'Add Field'}
                    </button>
                    <button
                      onClick={() => setShowFieldModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Modal */}
          {showPreview && editingTemplate && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Preview: {editingTemplate.name}
                    </h3>

                    <div className="space-y-6">
                      {Object.entries(groupFieldsByCategory(fields)).map(
                        ([category, categoryFields]) => (
                          <div key={category} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-4">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {categoryFields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>

                                  {field.type === 'text' && (
                                    <input
                                      type="text"
                                      placeholder={field.placeholder}
                                      disabled
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                  )}

                                  {field.type === 'textarea' && (
                                    <textarea
                                      placeholder={field.placeholder}
                                      disabled
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                  )}

                                  {field.type === 'select' && (
                                    <select
                                      disabled
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    >
                                      <option>Select an option...</option>
                                      {field.options?.map((option, index) => (
                                        <option key={index} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {field.type === 'radio' && (
                                    <div className="space-y-2">
                                      {field.options?.map((option, index) => (
                                        <label key={index} className="flex items-center">
                                          <input type="radio" disabled className="mr-2" />
                                          <span className="text-sm">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {field.type === 'checkbox' && (
                                    <div className="space-y-2">
                                      {field.options?.map((option, index) => (
                                        <label key={index} className="flex items-center">
                                          <input type="checkbox" disabled className="mr-2" />
                                          <span className="text-sm">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {field.type === 'rating' && (
                                    <div className="flex space-x-2">
                                      {field.options?.map((option, index) => (
                                        <button
                                          key={index}
                                          disabled
                                          className="px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                                        >
                                          {option}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {field.type === 'date' && (
                                    <input
                                      type="date"
                                      disabled
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                  )}

                                  {field.type === 'file' && (
                                    <input
                                      type="file"
                                      disabled
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                    >
                      Close Preview
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

export default FormBuilder;
