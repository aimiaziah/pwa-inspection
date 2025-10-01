// src/components/admin/FormBuilder.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Trash2, Edit, Eye, Download, Upload, Save } from 'lucide-react';

interface FormBuilderProps {
  initialForm?: FormTemplate;
  onSave: (form: FormTemplate) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ initialForm, onSave }) => {
  const [form, setForm] = useState<FormTemplate>(initialForm || createEmptyForm());
  const [previewMode, setPreviewMode] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'dropdown', label: 'Dropdown', icon: '📋' },
    { value: 'date', label: 'Date Picker', icon: '📅' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'rating', label: 'Rating Scale', icon: '⭐' },
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(form.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setForm({ ...form, fields: updatedItems });
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      categoryId: form.categories[0]?.id || '',
      type,
      label: `New ${type} Field`,
      description: '',
      required: false,
      order: form.fields.length,
      validation: {},
    };

    if (type === 'dropdown') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    setForm({
      ...form,
      fields: [...form.fields, newField],
    });
  };

  const importFromExcel = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', form.name);

    const response = await fetch('/api/admin/forms/import', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const { form: importedForm } = await response.json();
      setForm(importedForm);
    }
  };

  const exportAsTemplate = async () => {
    const response = await fetch(`/api/admin/forms/${form.id}/export`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name}-template.xlsx`;
    a.click();
  };

  if (previewMode) {
    return <FormPreview form={form} onClose={() => setPreviewMode(false)} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-2xl font-bold border-none focus:outline-none"
              placeholder="Form Name"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-2 text-gray-600 border-none focus:outline-none resize-none"
              placeholder="Form Description"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={exportAsTemplate}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <label className="flex items-center px-4 py-2 text-green-600 hover:text-green-700 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importFromExcel(e.target.files[0])}
              />
            </label>
            <button
              onClick={() => onSave(form)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="flex items-center text-sm text-gray-500">
          <span>Version {form.version}</span>
          <span className="mx-2">•</span>
          <span>Last updated: {new Date(form.updatedAt).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>Status: {form.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Types Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Field Types</h3>
            <div className="space-y-2">
              {fieldTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => addField(type.value)}
                  className="w-full flex items-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-2xl mr-3">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                  <Plus className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              {form.categories.map((category) => (
                <div key={category.id} className="p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(category.id, e.target.value)}
                    className="w-full font-medium bg-transparent border-none focus:outline-none"
                  />
                </div>
              ))}
              <button
                onClick={addCategory}
                className="w-full p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Form Fields</h3>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {form.fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-4 border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg bg-gray-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="text-sm font-medium text-gray-500 mr-2">
                                    {fieldTypes.find((t) => t.value === field.type)?.icon}
                                  </span>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, 'label', e.target.value)}
                                    className="font-medium border-none focus:outline-none"
                                  />
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </div>

                                {field.description && (
                                  <p className="text-sm text-gray-600 ml-7">{field.description}</p>
                                )}

                                {field.type === 'dropdown' && field.options && (
                                  <div className="ml-7 mt-2">
                                    <span className="text-sm text-gray-500">Options: </span>
                                    <span className="text-sm">{field.options.join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => editField(field)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteField(field.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {form.fields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No fields added yet</p>
                <p className="text-sm mt-2">Click on field types to add them to your form</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Edit Modal */}
      {showFieldModal && editingField && (
        <FieldEditModal
          field={editingField}
          categories={form.categories}
          onSave={(updatedField) => {
            setForm({
              ...form,
              fields: form.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
            });
            setShowFieldModal(false);
          }}
          onClose={() => setShowFieldModal(false)}
        />
      )}
    </div>
  );
};
